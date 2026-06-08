import { useEffect, useState } from 'react';
import type { PersonTimeline, TimelinePosition } from '../services/api';
import { getPersonTimeline } from '../services/api';
import { useI18n } from '../I18nContext';
import { useDraggable } from '../hooks/useDraggable';

const CATEGORY_COLORS: Record<string, string> = {
  political: '#f472b6',
  government: '#fbbf24',
  board: '#34d399',
  executive: '#a78bfa',
};

interface Props {
  personId: string;
  personName: string;
  onClose: () => void;
}

export default function TimelineView({ personId, personName, onClose }: Props) {
  const { t } = useI18n();
  const [timeline, setTimeline] = useState<PersonTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const { position, handleMouseDown } = useDraggable({ x: 16, y: 20 });

  useEffect(() => {
    setLoading(true);
    getPersonTimeline(personId).then((data) => {
      setTimeline(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [personId]);

  const CATEGORY_LABELS: Record<string, string> = {
    political: t('timeline.catPolitical'),
    government: t('timeline.catGovernment'),
    board: t('timeline.catBoard'),
    executive: t('timeline.catExecutive'),
  };

  const panelClassName = 'w-[500px] bg-white border border-[var(--stortinget-border)] rounded-lg shadow-xl z-30 overflow-hidden';
  const panelStyle = { position: 'absolute' as const, left: position.x, top: position.y };

  if (loading) {
    return (
      <div className={panelClassName} style={panelStyle}>
        <div
          className="flex justify-between items-center p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-gray-900 font-semibold">{t('timeline.title')} — {personName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
        </div>
        <div className="p-4 text-gray-500">{t('timeline.loading')}</div>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className={panelClassName} style={panelStyle}>
        <div
          className="flex justify-between items-center p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-gray-900 font-semibold">{personName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
        </div>
        <div className="p-4 text-gray-500 text-sm">{t('timeline.noData')}</div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const minYear = Math.min(...timeline.positions.map((p) => p.startYear)) - 1;
  const maxYear = currentYear + 1;
  const totalYears = maxYear - minYear;

  const gaps = detectRevolvingDoorGaps(timeline.positions);

  return (
    <div className={panelClassName} style={panelStyle}>
      <div
        className="flex justify-between items-center p-4 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div>
          <h3 className="text-gray-900 font-semibold">{t('timeline.title')} — {personName}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('timeline.subtitle')}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[500px]">
        {/* Year axis */}
        <div className="relative mb-2 ml-[140px]">
          <div className="flex justify-between text-xs text-gray-500">
            {Array.from({ length: Math.ceil(totalYears / 5) + 1 }, (_, i) => {
              const year = minYear + i * 5;
              if (year > maxYear) return null;
              return <span key={year}>{year}</span>;
            })}
          </div>
        </div>

        {/* Position bars */}
        <div className="space-y-2">
          {timeline.positions.map((pos, i) => {
            const startPct = ((pos.startYear - minYear) / totalYears) * 100;
            const endYear = pos.endYear || currentYear;
            const widthPct = ((endYear - pos.startYear) / totalYears) * 100;

            return (
              <div key={i} className="flex items-center gap-2">
                <div className="w-[140px] flex-shrink-0 text-right">
                  <div className="text-xs text-gray-700 truncate" title={pos.orgName}>
                    {pos.orgName}
                  </div>
                  <div className="text-[10px] text-gray-500">{pos.role}</div>
                </div>
                <div className="flex-1 relative h-6 bg-gray-100 rounded">
                  <div
                    className="absolute h-full rounded opacity-90 flex items-center px-1"
                    style={{
                      left: `${startPct}%`,
                      width: `${Math.max(widthPct, 2)}%`,
                      backgroundColor: CATEGORY_COLORS[pos.category],
                    }}
                  >
                    <span className="text-[9px] text-white font-medium truncate drop-shadow-sm">
                      {pos.startYear}–{pos.endYear || t('timeline.now')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revolving door warnings */}
        {gaps.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-red-600 uppercase mb-2 group relative inline-flex items-center gap-1 cursor-help">
              ⚠️ <span className="underline decoration-dotted">{t('timeline.revolvingDoor')}</span> {t('timeline.detected')}
              <span className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-72 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl text-xs text-gray-200 font-normal normal-case z-50">
                <strong className="text-white block mb-1">{t('timeline.revolvingDoorTitle')}</strong>
                {t('timeline.revolvingDoorExplain')}
              </span>
            </h4>
            {gaps.map((gap, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                <div className="text-sm text-red-700">
                  {gap.fromRole} → {gap.toRole}
                </div>
                <div className="text-xs text-red-500 mt-1">
                  {gap.gapYears === 0
                    ? t('timeline.sameYear')
                    : `${gap.gapYears} ${t('timeline.yearsBetween')}`}
                  {gap.gapYears <= 1 && ` ${t('timeline.possibleViolation')}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1 text-xs text-gray-600">
              <span
                className="w-3 h-2 rounded"
                style={{ backgroundColor: CATEGORY_COLORS[key] }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface RevolvingDoorGap {
  fromRole: string;
  toRole: string;
  gapYears: number;
}

function detectRevolvingDoorGaps(positions: TimelinePosition[]): RevolvingDoorGap[] {
  const gaps: RevolvingDoorGap[] = [];
  const govPositions = positions.filter((p) => p.category === 'government' || p.category === 'political');
  const corpPositions = positions.filter((p) => p.category === 'board' || p.category === 'executive');

  for (const gov of govPositions) {
    if (!gov.endYear) continue;
    for (const corp of corpPositions) {
      const gap = corp.startYear - gov.endYear;
      if (gap >= 0 && gap <= 2) {
        gaps.push({
          fromRole: `${gov.role} (${gov.orgName})`,
          toRole: `${corp.role} (${corp.orgName})`,
          gapYears: gap,
        });
      }
    }
  }

  return gaps;
}
