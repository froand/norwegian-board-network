import { useState, useEffect } from 'react';
import type { GraphNode, GraphLink, PersonDetails, PersonPosition } from '../services/api';
import { getPersonAiSummary, getPersonDetails } from '../services/api';
import { useI18n } from '../I18nContext';
import { useDraggable } from '../hooks/useDraggable';

const TYPE_LABEL_KEYS: Record<string, string> = {
  person: 'node.person',
  company: 'node.company',
  political_party: 'node.party',
  government_body: 'node.government',
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
  onNodeClick?: (node: GraphNode) => void;
}

export default function NodeDetails({ node, links, nodes, onClose, onNodeClick }: Props) {
  const { t, lang } = useI18n();
  const [details, setDetails] = useState<PersonDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const { position, handleMouseDown } = useDraggable({ x: window.innerWidth - 340, y: 20 });

  useEffect(() => {
    if (node.type === 'person') {
      setLoadingDetails(true);
      setLoadingAiSummary(true);
      getPersonDetails(node.id)
        .then((d) => setDetails(d))
        .catch(() => setDetails(null))
        .finally(() => setLoadingDetails(false));
      getPersonAiSummary(node.id)
        .then((result) => setAiSummary(result?.summary || null))
        .catch(() => setAiSummary(null))
        .finally(() => setLoadingAiSummary(false));
    } else {
      setDetails(null);
      setAiSummary(null);
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

  // Translate Norwegian link labels to English when needed
  const LABEL_TRANSLATIONS: Record<string, string> = {
    'Medlem': 'Member',
    'Styremedlem': 'Board member',
    'Styreleder': 'Board chair',
    'Leder': 'Leader',
    'Nestleder': 'Deputy leader',
    'Varamedlem': 'Deputy member',
    'Daglig leder': 'CEO',
    'Administrerende direktør': 'CEO',
    'Kontaktperson': 'Contact person',
    'Observatør': 'Observer',
    'Innehaver': 'Owner',
    'Komitémedlem': 'Committee member',
    'Stortingsrepresentant': 'MP',
  };

  function translateLabel(label: string): string {
    if (lang === 'no') return label;
    // Direct match
    if (LABEL_TRANSLATIONS[label]) return LABEL_TRANSLATIONS[label];
    // Partial match for "Tidl." (former) prefix
    if (label.startsWith('Tidl. ')) {
      const rest = label.slice(6);
      const translated = LABEL_TRANSLATIONS[rest];
      return `Former ${translated || rest}`;
    }
    return label;
  }

  function renderPosition(pos: PersonPosition, index: number) {
    const icon = POSITION_TYPE_ICONS[pos.type] || '•';
    const yearRange = pos.startYear
      ? `${pos.startYear}–${pos.endYear === null ? t('node.now') : pos.endYear || ''}`
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
    <div
      className="w-80 bg-white border border-[var(--stortinget-border)] rounded-lg shadow-lg z-20 overflow-hidden max-h-[80vh] flex flex-col"
      style={{ position: 'absolute', left: position.x, top: position.y }}
    >
      {/* Header with photo */}
      <div
        className="flex items-start gap-3 p-4 border-b border-[var(--stortinget-border)] flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
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
            {t(TYPE_LABEL_KEYS[node.type] || node.type)}
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
            <div className="text-[10px] text-[var(--stortinget-muted)]">{t('node.born')} {details.birthYear}</div>
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
          <div className="text-xs text-[var(--stortinget-muted)] mb-3 animate-pulse">{t('node.loadingPositions')}</div>
        )}

        {details && details.currentPositions.length > 0 && (
          <div className="mb-3">
            <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase mb-2">
              {t('node.currentPositions')} ({details.currentPositions.length})
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
              {t('node.pastPositions')} ({details.pastPositions.length})
            </h4>
            <div className="space-y-1">
              {details.pastPositions.map((pos, i) => renderPosition(pos, i))}
            </div>
          </div>
        )}

        {node.type === 'person' && (
          <div className="mb-3">
            <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase mb-2">
              {t('node.aiSummary')}
            </h4>
            {loadingAiSummary && (
              <div className="text-xs text-[var(--stortinget-muted)] animate-pulse">{t('node.loadingAiSummary')}</div>
            )}
            {!loadingAiSummary && aiSummary && (
              <div className="text-xs text-[var(--stortinget-text)] leading-relaxed bg-gray-50 border border-gray-100 rounded p-2">
                <p>{aiSummary}</p>
                <p className="mt-2 text-[10px] text-[var(--stortinget-muted)] italic">{t('node.aiGeneratedDisclaimer')}</p>
              </div>
            )}
            {!loadingAiSummary && !aiSummary && (
              <p className="text-xs text-[var(--stortinget-muted)] italic">{t('node.noAiSummary')}</p>
            )}
          </div>
        )}

        {/* Connections */}
        {links.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase mb-2">
              {t('node.connections')} ({links.length})
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {links.map((link, i) => {
                const connectedId = getConnectedId(link);
                const connectedNode = nodeMap.get(connectedId);
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded bg-gray-50 border border-gray-100 ${
                      onNodeClick && connectedNode ? 'cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-colors' : ''
                    }`}
                    onClick={() => {
                      if (onNodeClick && connectedNode) onNodeClick(connectedNode);
                    }}
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
                    <span className={`truncate ${onNodeClick && connectedNode ? 'text-blue-700 hover:underline' : 'text-[var(--stortinget-text)]'}`}>
                      {getNodeName(connectedId)}
                    </span>
                    <span className="text-[10px] text-[var(--stortinget-muted)] ml-auto flex-shrink-0">
                      {translateLabel(link.label)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {node.type === 'person' && !details && !loadingDetails && (
          <p className="text-xs text-[var(--stortinget-muted)] mt-3 mb-3 italic">
            {t('node.noDetails')}
          </p>
        )}

        {node.type === 'person' && links.length === 0 && !details && !loadingDetails && (
          <p className="text-xs text-[var(--stortinget-muted)] mt-3">
            {t('node.explore')}
          </p>
        )}
      </div>
    </div>
  );
}
