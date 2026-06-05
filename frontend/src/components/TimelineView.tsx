import { useEffect, useState } from 'react';
import type { PersonTimeline, TimelinePosition } from '../services/api';
import { getPersonTimeline } from '../services/api';

const CATEGORY_COLORS: Record<string, string> = {
  political: '#f472b6',
  government: '#fbbf24',
  board: '#34d399',
  executive: '#a78bfa',
};

const CATEGORY_LABELS: Record<string, string> = {
  political: 'Politisk',
  government: 'Statlig',
  board: 'Styreverv',
  executive: 'Ledelse',
};

interface Props {
  personId: string;
  personName: string;
  onClose: () => void;
}

export default function TimelineView({ personId, personName, onClose }: Props) {
  const [timeline, setTimeline] = useState<PersonTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPersonTimeline(personId).then((data) => {
      setTimeline(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [personId]);

  if (loading) {
    return (
      <div className="absolute top-24 right-4 w-[500px] bg-slate-800 border border-slate-600 rounded-lg p-4 z-30">
        <div className="text-slate-400">Laster tidslinje...</div>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="absolute top-24 right-4 w-[500px] bg-slate-800 border border-slate-600 rounded-lg p-4 z-30">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold">{personName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="text-slate-400 text-sm">Ingen tidslinjedata tilgjengelig for denne personen.</div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const minYear = Math.min(...timeline.positions.map((p) => p.startYear)) - 1;
  const maxYear = currentYear + 1;
  const totalYears = maxYear - minYear;

  // Detect revolving door gaps (< 2 years between gov/political exit and board/exec entry)
  const gaps = detectRevolvingDoorGaps(timeline.positions);

  return (
    <div className="absolute top-24 right-4 w-[550px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-30 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-slate-700">
        <div>
          <h3 className="text-white font-semibold">📅 Tidslinje — {personName}</h3>
          <p className="text-xs text-slate-400 mt-1">Posisjoner over tid • Røde markører = kort karantene</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[500px]">
        {/* Year axis */}
        <div className="relative mb-2 ml-[140px]">
          <div className="flex justify-between text-xs text-slate-500">
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
                  <div className="text-xs text-slate-300 truncate" title={pos.orgName}>
                    {pos.orgName}
                  </div>
                  <div className="text-[10px] text-slate-500">{pos.role}</div>
                </div>
                <div className="flex-1 relative h-6 bg-slate-700/50 rounded">
                  <div
                    className="absolute h-full rounded opacity-90 flex items-center px-1"
                    style={{
                      left: `${startPct}%`,
                      width: `${Math.max(widthPct, 2)}%`,
                      backgroundColor: CATEGORY_COLORS[pos.category],
                    }}
                  >
                    <span className="text-[9px] text-slate-900 font-medium truncate">
                      {pos.startYear}–{pos.endYear || 'nå'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revolving door warnings */}
        {gaps.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-red-400 uppercase mb-2 group relative inline-flex items-center gap-1 cursor-help">
              ⚠️ <span className="underline decoration-dotted">Svingdør-mønster</span> oppdaget
              <span className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 border border-slate-600 rounded-lg shadow-xl text-xs text-slate-300 font-normal normal-case z-50">
                <strong className="text-white block mb-1">Svingdør (revolving door)</strong>
                Mønsteret der politikere forlater statlige posisjoner og raskt tar styreverv eller lederroller i privat næringsliv — ofte i samme sektor de regulerte. Dette kan tyde på interessekonflikter: politikeren kan ha tatt gunstige beslutninger i embetet med viten om en fremtidig stilling, eller deres innsidekunnskap gir selskapet en urettferdig fordel. Norge har en <em>karantenelov</em> som krever ventetid før slike overganger.
              </span>
            </h4>
            {gaps.map((gap, i) => (
              <div key={i} className="bg-red-900/20 border border-red-800/50 rounded p-2 mb-2">
                <div className="text-sm text-red-300">
                  {gap.fromRole} → {gap.toRole}
                </div>
                <div className="text-xs text-red-400/80 mt-1">
                  {gap.gapYears === 0
                    ? 'Samme år — ingen karantene'
                    : `${gap.gapYears} år mellom rollene`}
                  {gap.gapYears <= 1 && ' — mulig brudd på karanteneregler'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-700 flex flex-wrap gap-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1 text-xs text-slate-400">
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
