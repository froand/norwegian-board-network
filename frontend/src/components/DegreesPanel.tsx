import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useI18n } from '../I18nContext';
import { getShortestPath, type GraphNode, type ShortestPathResult } from '../services/api';

interface Props {
  people: GraphNode[];
  nodes: GraphNode[];
  onClose: () => void;
}

export default function DegreesPanel({ people, nodes, onClose }: Props) {
  const { t } = useI18n();
  const [position, setPosition] = useState({ x: 24, y: 96 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [result, setResult] = useState<ShortestPathResult['path'] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const sortedPeople = useMemo(
    () => [...people].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [people]
  );
  const nodeNameMap = useMemo(() => new Map(nodes.map((node) => [node.id, node.name])), [nodes]);

  useEffect(() => {
    if (sortedPeople.length === 0) {
      setFromId('');
      setToId('');
      return;
    }

    setFromId((current) => (sortedPeople.some((person) => person.id === current) ? current : sortedPeople[0].id));
    setToId((current) => {
      if (sortedPeople.some((person) => person.id === current)) return current;
      return sortedPeople[1]?.id ?? sortedPeople[0].id;
    });
  }, [sortedPeople]);

  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, select')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleFindPath = useCallback(async () => {
    if (!fromId || !toId) return;

    try {
      setLoading(true);
      setHasSearched(true);
      const response = await getShortestPath(fromId, toId);
      setResult(response.path);
    } catch (error) {
      console.error('Failed to find shortest path:', error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [fromId, toId]);

  const orderedSteps = useMemo(() => {
    if (!result) return [];

    return result.nodes.slice(0, -1).map((nodeId, index) => {
      const nextId = result.nodes[index + 1];
      const link = result.links.find((candidate) => (
        (candidate.source === nodeId && candidate.target === nextId) ||
        (candidate.source === nextId && candidate.target === nodeId)
      ));

      return {
        from: nodeNameMap.get(nodeId) || nodeId,
        to: nodeNameMap.get(nextId) || nextId,
        label: link?.label || '—',
      };
    });
  }, [nodeNameMap, result]);

  return (
    <div
      className="fixed w-[440px] max-w-[calc(100vw-16px)] bg-white border border-[var(--stortinget-border)] rounded-lg shadow-lg z-30 overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="flex justify-between items-center p-4 border-b border-[var(--stortinget-border)] cursor-grab active:cursor-grabbing select-none bg-[var(--stortinget-cream)]"
        onMouseDown={handleMouseDown}
      >
        <div>
          <h3 className="text-[var(--stortinget-dark)] font-semibold">{t('connections.title')}</h3>
          <p className="text-xs text-[var(--stortinget-muted)] mt-1">
            {t('connections.subtitle')}
            <span className="ml-2 italic">{t('connections.drag')}</span>
          </p>
        </div>
        <button onClick={onClose} className="text-[var(--stortinget-muted)] hover:text-[var(--stortinget-red)] text-lg leading-none">✕</button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-[var(--stortinget-text)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--stortinget-muted)] mb-1">{t('connections.person1')}</div>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full rounded-md border border-[var(--stortinget-border)] bg-white px-3 py-2 text-sm text-[var(--stortinget-text)] focus:border-[var(--stortinget-red)] focus:outline-none"
            >
              {sortedPeople.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-[var(--stortinget-text)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--stortinget-muted)] mb-1">{t('connections.person2')}</div>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full rounded-md border border-[var(--stortinget-border)] bg-white px-3 py-2 text-sm text-[var(--stortinget-text)] focus:border-[var(--stortinget-red)] focus:outline-none"
            >
              {sortedPeople.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={handleFindPath}
          disabled={!fromId || !toId || loading || sortedPeople.length === 0}
          className="w-full rounded-md bg-[var(--stortinget-red)] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? `${t('connections.find')}...` : t('connections.find')}
        </button>

        <div className="max-h-[320px] overflow-y-auto">
          {hasSearched && !loading && !result && (
            <div className="rounded-lg border border-[var(--stortinget-border)] bg-[var(--stortinget-cream)] px-3 py-4 text-sm text-[var(--stortinget-muted)]">
              {t('connections.noPath')}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--stortinget-border)] bg-[var(--stortinget-cream)] px-3 py-3">
                <div className="text-sm font-semibold text-[var(--stortinget-dark)]">{t('connections.result')}</div>
                <div className="text-xs text-[var(--stortinget-muted)] mt-1">
                  {orderedSteps.length} {t('connections.steps')}
                </div>
              </div>

              <ol className="space-y-2">
                {orderedSteps.map((step, index) => (
                  <li
                    key={`${step.from}-${step.to}-${index}`}
                    className="rounded-lg border border-[var(--stortinget-border)] bg-white px-3 py-3 text-sm text-[var(--stortinget-text)]"
                  >
                    <span className="font-medium">{step.from}</span>
                    <span className="mx-2 text-[var(--stortinget-red)]">→</span>
                    <span className="rounded-full bg-[var(--stortinget-cream)] px-2 py-1 text-xs font-semibold text-[var(--stortinget-red)]">
                      {step.label}
                    </span>
                    <span className="mx-2 text-[var(--stortinget-red)]">→</span>
                    <span className="font-medium">{step.to}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
