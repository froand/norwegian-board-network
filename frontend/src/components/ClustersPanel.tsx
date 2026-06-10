import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useI18n } from '../I18nContext';
import { getClusters, type Cluster } from '../services/api';

interface Props {
  onPersonClick: (personId: string) => void;
  onClose: () => void;
}

export default function ClustersPanel({ onPersonClick, onClose }: Props) {
  const { t } = useI18n();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState({ x: window.innerWidth - 456, y: 96 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    getClusters()
      .then((items) => setClusters(items))
      .catch((error) => console.error('Failed to fetch clusters:', error))
      .finally(() => setLoading(false));
  }, []);

  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
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

  const sortedClusters = useMemo(
    () => [...clusters].sort((a, b) => b.strength - a.strength),
    [clusters]
  );

  return (
    <div
      className="fixed w-[440px] max-w-[calc(100vw-16px)] bg-[var(--stortinget-surface)] border border-[var(--stortinget-border)] rounded-lg shadow-lg z-30 overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="flex justify-between items-center p-4 border-b border-[var(--stortinget-border)] cursor-grab active:cursor-grabbing select-none bg-[var(--stortinget-cream)]"
        onMouseDown={handleMouseDown}
      >
        <div>
          <h3 className="text-[var(--stortinget-dark)] font-semibold">{t('clusters.title')}</h3>
          <p className="text-xs text-[var(--stortinget-muted)] mt-1">
            {t('clusters.subtitle')}
            <span className="ml-2 italic">{t('clusters.drag')}</span>
          </p>
        </div>
        <button onClick={onClose} className="text-[var(--stortinget-muted)] hover:text-[var(--stortinget-red)] text-lg leading-none">✕</button>
      </div>

      <div className="max-h-[520px] overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-sm text-[var(--stortinget-muted)]">{t('clusters.loading')}</div>
        ) : sortedClusters.length === 0 ? (
          <div className="text-sm text-[var(--stortinget-muted)]">{t('clusters.none')}</div>
        ) : (
          sortedClusters.map((cluster) => (
            <div key={cluster.id} className="rounded-lg border border-[var(--stortinget-border)] bg-[var(--stortinget-surface-muted)] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--stortinget-muted)]">
                  {t('clusters.title')}
                </div>
                <div className="rounded-full bg-[var(--stortinget-cream)] px-2.5 py-1 text-xs font-semibold text-[var(--stortinget-red)]">
                  {t('clusters.strength')}: {cluster.strength}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--stortinget-muted)] mb-2">{t('clusters.members')}</div>
                <div className="flex flex-wrap gap-2">
                  {cluster.members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => onPersonClick(member.id)}
                      className="rounded-full border border-[var(--stortinget-border)] bg-[var(--stortinget-cream)] px-3 py-1 text-sm text-[var(--stortinget-text)] transition-colors hover:border-[var(--stortinget-red)] hover:text-[var(--stortinget-red)]"
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--stortinget-muted)] mb-2">{t('clusters.sharedOrgs')}</div>
                <div className="flex flex-wrap gap-2">
                  {cluster.sharedOrgs.map((org) => (
                    <span
                      key={org.id}
                      className="rounded-full bg-[var(--stortinget-red)]/10 px-3 py-1 text-sm text-[var(--stortinget-dark)]"
                    >
                      {org.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
