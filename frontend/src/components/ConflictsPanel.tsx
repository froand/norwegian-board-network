import { useEffect, useState } from 'react';
import type { ConflictOfInterest } from '../services/api';
import { getAllConflicts } from '../services/api';

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  high: { bg: 'bg-red-900/30', border: 'border-red-700/50', text: 'text-red-300' },
  medium: { bg: 'bg-amber-900/30', border: 'border-amber-700/50', text: 'text-amber-300' },
  low: { bg: 'bg-blue-900/30', border: 'border-blue-700/50', text: 'text-blue-300' },
};

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  revolving_door: '🔄 Svingdør',
  concurrent: '⚡ Samtidig',
  sector_overlap: '🏭 Sektoroverlapp',
  shared_network: '🤝 Delt nettverk',
};

interface Props {
  onPersonClick: (personId: string) => void;
  onClose: () => void;
}

export default function ConflictsPanel({ onPersonClick, onClose }: Props) {
  const [conflicts, setConflicts] = useState<ConflictOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    getAllConflicts()
      .then(setConflicts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterType === 'all'
    ? conflicts
    : conflicts.filter((c) => c.conflictType === filterType);

  return (
    <div className="absolute top-24 left-4 w-[420px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-30 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-slate-700">
        <div>
          <h3 className="text-white font-semibold">⚠️ Interessekonflikter</h3>
          <p className="text-xs text-slate-400 mt-1">
            Automatisk oppdagede potensielle konflikter
          </p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-2 border-b border-slate-700 overflow-x-auto">
        {['all', 'revolving_door', 'sector_overlap', 'concurrent', 'shared_network'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
              filterType === type
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            {type === 'all' ? 'Alle' : CONFLICT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="p-3 overflow-y-auto max-h-[500px] space-y-2">
        {loading ? (
          <div className="text-slate-400 text-sm">Laster...</div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-400 text-sm">Ingen konflikter funnet.</div>
        ) : (
          filtered.map((conflict, i) => {
            const colors = SEVERITY_COLORS[conflict.severity];
            return (
              <div
                key={i}
                className={`${colors.bg} border ${colors.border} rounded-lg p-3 cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => onPersonClick(conflict.personId)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium text-sm ${colors.text}`}>
                    {conflict.personName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                    {CONFLICT_TYPE_LABELS[conflict.conflictType]}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    {conflict.politicalRole}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">↓</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                    {conflict.boardRole} — {conflict.boardOrg}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2 italic">
                  {conflict.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
