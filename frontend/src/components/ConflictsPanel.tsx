import { useEffect, useState } from 'react';
import type { ConflictOfInterest } from '../services/api';
import { detectAiConflicts, getAllConflicts } from '../services/api';
import { useI18n } from '../I18nContext';
import { useDraggable } from '../hooks/useDraggable';

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  critical: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' },
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
};

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  revolving_door: '🔄 Svingdør',
  concurrent: '⚡ Samtidig',
  sector_overlap: '🏭 Sektoroverlapp',
  shared_network: '🤝 Delt nettverk',
};

const CONFLICT_TYPE_TOOLTIPS: Record<string, string> = {
  revolving_door: 'Svingdør: Politikere som forlater statlige posisjoner og raskt tar styreverv i privat næringsliv, ofte i samme sektor de regulerte. Kan tyde på interessekonflikter.',
  concurrent: 'Samtidig: Person som holder politiske og næringslivsroller samtidig.',
  sector_overlap: 'Sektoroverlapp: Politiker med innflytelse på en sektor som også har styreverv i samme sektor.',
  shared_network: 'Delt nettverk: Personer som deler flere styreverv eller organisasjonstilknytninger, noe som kan indikere uformell innflytelse.',
};

interface Props {
  onPersonClick: (personId: string) => void;
  onClose: () => void;
}

const DISMISSED_AI_CONFLICTS_KEY = 'dismissed-ai-conflicts';

function getConflictDismissKey(conflict: ConflictOfInterest): string {
  if (conflict.dismissKey) return conflict.dismissKey;
  return `${conflict.personId}|${conflict.conflictType}|${conflict.boardOrg}|${conflict.boardRole}`.toLowerCase();
}

export default function ConflictsPanel({ onPersonClick, onClose }: Props) {
  const { t } = useI18n();
  const [conflicts, setConflicts] = useState<ConflictOfInterest[]>([]);
  const [aiConflicts, setAiConflicts] = useState<ConflictOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [dismissedAiConflicts, setDismissedAiConflicts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_AI_CONFLICTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  });
  const { position, handleMouseDown } = useDraggable({ x: 16, y: 96 });

  useEffect(() => {
    getAllConflicts()
      .then((data) => setConflicts(data.map((conflict) => ({ ...conflict, sourceType: 'curated' }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const visibleAiConflicts = aiConflicts.filter((conflict) => {
    const key = getConflictDismissKey(conflict);
    return !dismissedAiConflicts.includes(key);
  });

  const allConflicts = [...conflicts, ...visibleAiConflicts];

  const filtered = filterType === 'all'
    ? allConflicts
    : allConflicts.filter((c) => c.conflictType === filterType);

  const handleDetectConflicts = async () => {
    setDetecting(true);
    setDetectError(null);
    try {
      const detected = await detectAiConflicts();
      setAiConflicts(detected.map((conflict) => ({ ...conflict, sourceType: 'ai_suggested' })));
    } catch (error) {
      console.error(error);
      setDetectError(t('conflicts.detectFailed'));
    } finally {
      setDetecting(false);
    }
  };

  const handleDismissAiConflict = (conflict: ConflictOfInterest) => {
    const key = getConflictDismissKey(conflict);
    const next = dismissedAiConflicts.includes(key) ? dismissedAiConflicts : [...dismissedAiConflicts, key];
    setDismissedAiConflicts(next);
    localStorage.setItem(DISMISSED_AI_CONFLICTS_KEY, JSON.stringify(next));
  };

  return (
    <div
      className="w-[420px] bg-white border border-[var(--stortinget-border)] rounded-lg shadow-xl z-30 overflow-hidden"
      style={{ position: 'absolute', left: position.x, top: position.y }}
    >
      <div
        className="flex justify-between items-center p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div>
          <h3 className="text-gray-900 font-semibold">{t('conflicts.title')}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {t('conflicts.subtitle')}
            <span className="ml-2 text-gray-400 italic">{t('conflicts.drag')}</span>
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
      </div>

      <div className="px-4 py-2 border-b border-gray-200">
        <button
          onClick={handleDetectConflicts}
          disabled={detecting}
          className="w-full text-xs font-medium px-3 py-2 rounded border border-[var(--stortinget-red)] text-[var(--stortinget-red)] hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {detecting ? t('conflicts.detecting') : t('conflicts.detectButton')}
        </button>
        {detectError && (
          <p className="mt-2 text-[11px] text-red-600">{detectError}</p>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-2 border-b border-gray-200 overflow-x-auto">
        {['all', 'revolving_door', 'sector_overlap', 'concurrent', 'shared_network'].map((type) => {
          const labelMap: Record<string, string> = {
            all: t('conflicts.all'),
            revolving_door: t('conflicts.revolvingDoor'),
            sector_overlap: t('conflicts.sectorOverlap'),
            concurrent: t('conflicts.concurrent'),
            shared_network: t('conflicts.sharedNetwork'),
          };
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                filterType === type
                  ? 'bg-[var(--stortinget-red)] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {labelMap[type]}
            </button>
          );
        })}
      </div>

      <div className="p-3 overflow-y-auto max-h-[500px] space-y-2">
        {loading ? (
          <div className="text-gray-500 text-sm">{t('conflicts.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-sm">{t('conflicts.none')}</div>
        ) : (
          filtered.map((conflict, i) => {
            const colors = SEVERITY_COLORS[conflict.severity] ?? SEVERITY_COLORS.medium;
            return (
              <div
                key={i}
                className={`${colors.bg} border ${colors.border} rounded-lg p-3 cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => onPersonClick(conflict.personId)}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className={`font-medium text-sm ${colors.text}`}>
                    {conflict.personName}
                  </span>
                  <div className="flex items-center gap-1">
                    {conflict.sourceType === 'ai_suggested' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                        {t('conflicts.aiSuggested')}
                      </span>
                    )}
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 cursor-help border border-gray-200"
                      title={CONFLICT_TYPE_TOOLTIPS[conflict.conflictType]}
                    >
                      {CONFLICT_TYPE_LABELS[conflict.conflictType]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2 text-[10px] text-gray-600">
                  <span className="px-1.5 py-0.5 rounded bg-white/70 border border-gray-200 uppercase">
                    {conflict.severity}
                  </span>
                  {typeof conflict.confidenceScore === 'number' && (
                    <span className="px-1.5 py-0.5 rounded bg-white/70 border border-gray-200">
                      {t('conflicts.confidence')}: {Math.round(conflict.confidenceScore * 100)}%
                    </span>
                  )}
                  {conflict.classification && (
                    <span className="px-1.5 py-0.5 rounded bg-white/70 border border-gray-200">
                      Klasse {conflict.classification}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-600 space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    {conflict.politicalRole}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">↓</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    {conflict.boardRole} — {conflict.boardOrg}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2 italic">
                  {conflict.description}
                </p>
                {conflict.explanation && (
                  <p className="text-xs text-gray-600 mt-1">
                    {conflict.explanation}
                  </p>
                )}

                {conflict.sources && conflict.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    {conflict.sources.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {source.label}
                      </a>
                    ))}
                  </div>
                )}

                {conflict.sourceType === 'ai_suggested' && (
                  <div className="mt-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDismissAiConflict(conflict);
                      }}
                      className="text-[11px] text-gray-600 underline hover:text-gray-900"
                    >
                      {t('conflicts.dismiss')}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
