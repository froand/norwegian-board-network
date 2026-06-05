import { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar from './components/SearchBar';
import NetworkGraph from './components/NetworkGraph';
import NodeDetails from './components/NodeDetails';
import Legend from './components/Legend';
import { getOverviewGraph, expandNode, getCompanyGraph, getPersonGraph } from './services/api';
import type { GraphData, GraphNode } from './services/api';

export default function App() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedNodes = useRef(new Set<string>());

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

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node);

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
          // Focus on the new company node
          const companyNode = data.nodes.find((n) => n.id === `org-${orgNumber}`);
          if (companyNode) setSelectedNode(companyNode);
        }
      } catch (e) {
        console.error('Failed to load company:', e);
      }
    } else if (type === 'person') {
      try {
        // Load the person's full network (political + brreg roles)
        const data = await getPersonGraph(id);
        if (data.nodes.length > 0) {
          setGraphData((prev) => mergeGraphData(prev, data));
        }
        // Focus on the person node
        const personNode = data.nodes.find((n) => n.id === id) ||
          graphData.nodes.find((n) => n.id === id);
        if (personNode) setSelectedNode(personNode);
      } catch (e) {
        console.error('Failed to load person network:', e);
        // Fallback: just focus on existing node if present
        const node = graphData.nodes.find((n) => n.id === id);
        if (node) setSelectedNode(node);
      }
    }
  }, [graphData]);

  return (
    <div className="relative w-full h-full">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none">
        <div className="pointer-events-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-white mb-2">
            🇳🇴 Norsk Nettverk — Styre & Makt
          </h1>
          <p className="text-sm text-slate-400 mb-3">
            Utforsk forbindelser mellom styremedlemmer, politikere og statlige posisjoner
          </p>
          <SearchBar onSelect={handleSearchSelect} />
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
        <NetworkGraph data={graphData} onNodeClick={handleNodeClick} selectedNode={selectedNode} />
      )}

      {/* Node details panel */}
      {selectedNode && (
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
