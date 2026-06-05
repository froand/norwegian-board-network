import { useState, useEffect } from 'react';
import type { GraphNode, GraphLink, PersonDetails, PersonPosition } from '../services/api';
import { getPersonDetails } from '../services/api';

const TYPE_LABELS: Record<string, string> = {
  person: '👤 Person',
  company: '🏢 Selskap',
  political_party: '🏛️ Parti',
  government_body: '⚖️ Statlig organ',
};

const POSITION_TYPE_ICONS: Record<string, string> = {
  political: '🏛️',
  government: '⚖️',
  private: '💼',
  board: '📋',
  committee: '🗂️',
};

interface Props {
  node: GraphNode;
  links: GraphLink[];
  nodes: GraphNode[];
  onClose: () => void;
}

export default function NodeDetails({ node, links, nodes, onClose }: Props) {
  const [details, setDetails] = useState<PersonDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (node.type === 'person') {
      setLoadingDetails(true);
      getPersonDetails(node.id)
        .then((d) => setDetails(d))
        .catch(() => setDetails(null))
        .finally(() => setLoadingDetails(false));
    } else {
      setDetails(null);
    }
  }, [node.id, node.type]);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function getNodeName(idOrObj: string | { id: string }): string {
    const id = typeof idOrObj === 'string' ? idOrObj : idOrObj.id;
    return nodeMap.get(id)?.name || id;
  }

  function getConnectedId(link: GraphLink): string {
    const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
    const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
    return sourceId === node.id ? targetId : sourceId;
  }

  function renderPosition(pos: PersonPosition, index: number) {
    const icon = POSITION_TYPE_ICONS[pos.type] || '•';
    const yearRange = pos.startYear
      ? `${pos.startYear}–${pos.endYear === null ? 'nå' : pos.endYear || ''}`
      : '';

    return (
      <div key={index} className="flex items-start gap-2 text-sm py-1.5 px-2 rounded bg-gray-50 border border-gray-100">
        <span className="flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[var(--stortinget-text)] truncate">{pos.title}</div>
          <div className="text-xs text-[var(--stortinget-muted)] truncate">{pos.organization}</div>
          {pos.description && (
            <div className="text-xs text-[var(--stortinget-muted)] italic truncate">{pos.description}</div>
          )}
        </div>
        {yearRange && (
          <span className="text-[10px] text-[var(--stortinget-muted)] flex-shrink-0 mt-0.5">{yearRange}</span>
        )}
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-white border border-[var(--stortinget-border)] rounded-lg shadow-lg z-20 overflow-hidden max-h-[80vh] flex flex-col">
      {/* Header with photo */}
      <div className="flex items-start gap-3 p-4 border-b border-[var(--stortinget-border)] flex-shrink-0">
        {node.type === 'person' && (node.imageUrl || details?.imageUrl) && (
          <img
            src={node.imageUrl || details?.imageUrl}
            alt={node.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-[var(--stortinget-border)] flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--stortinget-dark)] truncate">{node.name}</h3>
          <div className="text-xs text-[var(--stortinget-muted)] mt-0.5">
            {TYPE_LABELS[node.type] || node.type}
          </div>
          {(node.meta?.party || details?.party) && (
            <div className="text-xs text-[var(--stortinget-muted)] mt-0.5">
              {node.meta?.party || details?.party}
              {(node.meta?.fylke || details?.fylke) ? ` • ${node.meta?.fylke || details?.fylke}` : ''}
            </div>
          )}
          {details?.email && (
            <div className="text-xs text-blue-600 mt-0.5 truncate">{details.email}</div>
          )}
          {details?.birthYear && (
            <div className="text-[10px] text-[var(--stortinget-muted)]">Født {details.birthYear}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-[var(--stortinget-muted)] hover:text-[var(--stortinget-dark)] text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        {/* Current positions */}
        {loadingDetails && (
          <div className="text-xs text-[var(--stortinget-muted)] mb-3 animate-pulse">Henter posisjoner...</div>
        )}

        {details && details.currentPositions.length > 0 && (
          <div className="mb-3">
            <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase mb-2">
              Nåværende posisjoner ({details.currentPositions.length})
            </h4>
            <div className="space-y-1">
              {details.currentPositions.map((pos, i) => renderPosition(pos, i))}
            </div>
          </div>
        )}

        {/* Past positions */}
        {details && details.pastPositions.length > 0 && (
          <div className="mb-3">
            <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase mb-2">
              Tidligere posisjoner ({details.pastPositions.length})
            </h4>
            <div className="space-y-1">
              {details.pastPositions.map((pos, i) => renderPosition(pos, i))}
            </div>
          </div>
        )}

        {/* Connections */}
        {links.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase mb-2">
              Forbindelser ({links.length})
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {links.map((link, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm py-1.5 px-2 rounded bg-gray-50 border border-gray-100"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        link.category === 'board'
                          ? '#22c55e'
                          : link.category === 'political'
                          ? '#cf0a2c'
                          : link.category === 'government'
                          ? '#f59e0b'
                          : '#8b5cf6',
                    }}
                  />
                  <span className="text-[var(--stortinget-text)] truncate">
                    {getNodeName(getConnectedId(link))}
                  </span>
                  <span className="text-[10px] text-[var(--stortinget-muted)] ml-auto flex-shrink-0">
                    {link.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {node.type === 'person' && !details && !loadingDetails && (
          <p className="text-xs text-[var(--stortinget-muted)] mt-3">
            Klikk på andre noder for å utforske nettverket
          </p>
        )}
      </div>
    </div>
  );
}
