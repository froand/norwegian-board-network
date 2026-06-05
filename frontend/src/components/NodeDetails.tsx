import type { GraphNode, GraphLink } from '../services/api';

const TYPE_LABELS: Record<string, string> = {
  person: '👤 Person',
  company: '🏢 Selskap',
  political_party: '🏛️ Parti',
  government_body: '⚖️ Statlig organ',
};

const CATEGORY_LABELS: Record<string, string> = {
  board: 'Styreverv',
  political: 'Politisk',
  government: 'Statlig',
  executive: 'Ledelse',
};

interface Props {
  node: GraphNode;
  links: GraphLink[];
  nodes: GraphNode[];
  onClose: () => void;
}

export default function NodeDetails({ node, links, nodes, onClose }: Props) {
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

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <h3 className="font-semibold text-white truncate">{node.name}</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div className="p-3">
        <div className="text-sm text-slate-400 mb-3">
          {TYPE_LABELS[node.type] || node.type}
        </div>

        {links.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
              Forbindelser ({links.length})
            </h4>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {links.map((link, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-slate-700/50"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        link.category === 'board'
                          ? '#34d399'
                          : link.category === 'political'
                          ? '#f472b6'
                          : link.category === 'government'
                          ? '#fbbf24'
                          : '#a78bfa',
                    }}
                  />
                  <span className="text-slate-300 truncate">
                    {getNodeName(getConnectedId(link))}
                  </span>
                  <span className="text-xs text-slate-500 ml-auto flex-shrink-0">
                    {link.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {node.type === 'person' && (
          <p className="text-xs text-slate-500 mt-3">
            Klikk på andre noder for å utforske nettverket
          </p>
        )}
      </div>
    </div>
  );
}
