import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import SearchBar from './components/SearchBar';
import NetworkGraph from './components/NetworkGraph';
import NodeDetails from './components/NodeDetails';
import Legend from './components/Legend';
import TimelineView from './components/TimelineView';
import ConflictsPanel from './components/ConflictsPanel';
import FilterPanel, { DEFAULT_FILTERS } from './components/FilterPanel';
import CompanyDetails from './components/CompanyDetails';
import type { FilterState } from './components/FilterPanel';
import { getOverviewGraph, expandNode, getCompanyGraph, getPersonGraph } from './services/api';
import type { GraphData, GraphNode } from './services/api';

export default function App() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedNodes = useRef(new Set<string>());

  // Panel visibility
  const [showTimeline, setShowTimeline] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      const data = await getOverviewGraph();
      setGraphData(data);
      setError(null);
    } catch (e) {
      setError('Kunne ikke laste data. Er backend kjørende på port 3001?');
    } finally {
      setLoading(false);
    }
  }

  // Apply filters to graph data
  const filteredGraphData = useMemo(() => {
    const visibleNodes = graphData.nodes.filter(
      (n) => filters.nodeTypes[n.type as keyof FilterState['nodeTypes']] !== false
    );
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    const visibleLinks = graphData.links.filter((l) => {
      const sourceId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const targetId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return (
        visibleNodeIds.has(sourceId) &&
        visibleNodeIds.has(targetId) &&
        filters.categories[l.category as keyof FilterState['categories']] !== false
      );
    });

    return { nodes: visibleNodes, links: visibleLinks };
  }, [graphData, filters]);

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node);

    // Show timeline for person nodes, company details for company nodes
    if (node.type === 'person') {
      setShowTimeline(true);
    }

    // Expand node to show more connections
    if (!loadedNodes.current.has(node.id)) {
      loadedNodes.current.add(node.id);

      try {
        let newData: GraphData | null = null;

        if (node.id.startsWith('org-') && /^\d+$/.test(node.id.replace('org-', ''))) {
          const orgNumber = node.id.replace('org-', '');
          newData = await getCompanyGraph(orgNumber);
        } else {
          newData = await expandNode(node.id);
        }

        if (newData && newData.nodes.length > 0) {
          setGraphData((prev) => mergeGraphData(prev, newData!));
        }
      } catch (e) {
        console.error('Failed to expand node:', e);
      }
    }
  }, []);

  const handleSearchSelect = useCallback(async (id: string, type: string, orgNumber?: string) => {
    if (type === 'company' && orgNumber) {
      try {
        const data = await getCompanyGraph(orgNumber);
        if (data.nodes.length > 0) {
          setGraphData((prev) => mergeGraphData(prev, data));
          const companyNode = data.nodes.find((n) => n.id === `org-${orgNumber}`);
          if (companyNode) setSelectedNode(companyNode);
        }
      } catch (e) {
        console.error('Failed to load company:', e);
      }
    } else if (type === 'person') {
      try {
        const data = await getPersonGraph(id);
        if (data.nodes.length > 0) {
          setGraphData((prev) => mergeGraphData(prev, data));
        }
        const personNode = data.nodes.find((n) => n.id === id) ||
          graphData.nodes.find((n) => n.id === id);
        if (personNode) {
          setSelectedNode(personNode);
          setShowTimeline(true);
        }
      } catch (e) {
        console.error('Failed to load person network:', e);
        const node = graphData.nodes.find((n) => n.id === id);
        if (node) setSelectedNode(node);
      }
    }
  }, [graphData]);

  const handleConflictPersonClick = useCallback((personId: string) => {
    const node = graphData.nodes.find((n) => n.id === personId);
    if (node) {
      setSelectedNode(node);
      setShowTimeline(true);
    }
  }, [graphData]);

  return (
    <div className="relative w-full h-full">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none">
        <div className="pointer-events-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">
            🇳🇴 Norsk Nettverk — Styre & Makt
          </h1>
          <p className="text-sm text-slate-400 mb-3">
            Utforsk interessekonflikter mellom politikere, styreverv og statlige posisjoner
          </p>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <SearchBar onSelect={handleSearchSelect} />
            </div>
          </div>
          {/* Toolbar */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                showConflicts
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ⚠️ Konflikter
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🔍 Filtre
            </button>
            <button
              onClick={() => {
                if (selectedNode?.type === 'person') {
                  setShowTimeline(!showTimeline);
                }
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                showTimeline
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title={!selectedNode?.type || selectedNode.type !== 'person' ? 'Velg en person først' : ''}
            >
              📅 Tidslinje
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <Legend />

      {/* Graph */}
      {loading ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-xl text-slate-400">Laster nettverk...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-xl text-red-400 text-center p-8">{error}</div>
        </div>
      ) : (
        <NetworkGraph data={filteredGraphData} onNodeClick={handleNodeClick} selectedNode={selectedNode} />
      )}

      {/* Panels */}
      {showTimeline && selectedNode?.type === 'person' && (
        <TimelineView
          personId={selectedNode.id}
          personName={selectedNode.name}
          onClose={() => setShowTimeline(false)}
        />
      )}

      {showConflicts && (
        <ConflictsPanel
          onPersonClick={handleConflictPersonClick}
          onClose={() => setShowConflicts(false)}
        />
      )}

      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Node details panel */}
      {selectedNode && !showTimeline && selectedNode.type !== 'company' && (
        <NodeDetails
          node={selectedNode}
          links={graphData.links.filter(
            (l) =>
              (typeof l.source === 'string' ? l.source : (l.source as any).id) === selectedNode.id ||
              (typeof l.target === 'string' ? l.target : (l.target as any).id) === selectedNode.id
          )}
          nodes={graphData.nodes}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Company details panel */}
      {selectedNode && selectedNode.type === 'company' && selectedNode.id.startsWith('org-') && (
        <CompanyDetails
          orgNumber={selectedNode.id.replace('org-', '')}
          companyName={selectedNode.name}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

function mergeGraphData(existing: GraphData, incoming: GraphData): GraphData {
  const nodeMap = new Map(existing.nodes.map((n) => [n.id, n]));
  for (const node of incoming.nodes) {
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, node);
    }
  }

  const linkSet = new Set(existing.links.map((l) => `${l.source}-${l.target}-${l.label}`));
  const mergedLinks = [...existing.links];
  for (const link of incoming.links) {
    const key = `${link.source}-${link.target}-${link.label}`;
    if (!linkSet.has(key)) {
      linkSet.add(key);
      mergedLinks.push(link);
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links: mergedLinks,
  };
}
