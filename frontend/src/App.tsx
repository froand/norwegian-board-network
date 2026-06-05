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
import { I18nContext, createI18nValue } from './I18nContext';
import type { Language } from './i18n';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'no';
  });
  const i18n = useMemo(() => createI18nValue(lang, (l) => { setLang(l); localStorage.setItem('lang', l); }), [lang]);

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
      setError(i18n.t('error.backend'));
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
          setGraphData(data); // Replace graph with company view
          const companyNode = data.nodes.find((n) => n.id === `org-${orgNumber}`);
          if (companyNode) setSelectedNode(companyNode);
          loadedNodes.current.clear();
        }
      } catch (e) {
        console.error('Failed to load company:', e);
      }
    } else if (type === 'person') {
      try {
        const data = await getPersonGraph(id);
        if (data.nodes.length > 0) {
          setGraphData(data); // Replace graph with person's network
          loadedNodes.current.clear();
        }
        const personNode = data.nodes.find((n) => n.id === id);
        if (personNode) {
          setSelectedNode(personNode);
          setShowTimeline(true);
        }
      } catch (e) {
        console.error('Failed to load person network:', e);
      }
    }
  }, []);

  const handleResetToOverview = useCallback(() => {
    setSelectedNode(null);
    setShowTimeline(false);
    loadedNodes.current.clear();
    loadOverview();
  }, []);

  const handleConflictPersonClick = useCallback((personId: string) => {
    const node = graphData.nodes.find((n) => n.id === personId);
    if (node) {
      setSelectedNode(node);
      setShowTimeline(true);
    }
  }, [graphData]);

  return (
    <I18nContext.Provider value={i18n}>
    <div className="relative w-full h-full flex flex-col">
      {/* Header bar — Stortinget-inspired */}
      <div className="flex-shrink-0 bg-white border-b border-[var(--stortinget-border)] shadow-sm z-20">
        {/* Top red accent line */}
        <div className="h-1 bg-[var(--stortinget-red)]" />
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl text-[var(--stortinget-dark)] mb-0 leading-tight">
                  {i18n.t('app.title')}
                </h1>
                <p className="text-xs text-[var(--stortinget-muted)] mt-0.5">
                  {i18n.t('app.subtitle')}
                </p>
              </div>
              <div className="w-px h-8 bg-[var(--stortinget-border)]" />
              <div className="w-80">
                <SearchBar onSelect={handleSearchSelect} />
              </div>
              <button
                onClick={handleResetToOverview}
                className="px-3 py-1.5 rounded text-xs font-semibold transition-colors border bg-white text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-red)] hover:text-[var(--stortinget-red)]"
                title={i18n.t('app.overview.tooltip')}
              >
                {i18n.t('app.overview')}
              </button>
            </div>
            {/* Toolbar */}
            <div className="flex gap-2 items-center">
              {/* Language toggle */}
              <button
                onClick={() => i18n.setLang(lang === 'no' ? 'en' : 'no')}
                className="px-2 py-1.5 rounded text-xs font-semibold transition-colors border bg-white text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-navy)] hover:text-[var(--stortinget-navy)]"
                title={lang === 'no' ? 'Switch to English' : 'Bytt til norsk'}
              >
                {lang === 'no' ? '🇬🇧 EN' : '🇳🇴 NO'}
              </button>
              <div className="w-px h-6 bg-[var(--stortinget-border)]" />
              <button
                onClick={() => setShowConflicts(!showConflicts)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                  showConflicts
                    ? 'bg-[var(--stortinget-red)] text-white border-[var(--stortinget-red)]'
                    : 'bg-white text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-red)] hover:text-[var(--stortinget-red)]'
                }`}
              >
                {i18n.t('app.conflicts')}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                  showFilters
                    ? 'bg-[var(--stortinget-navy)] text-white border-[var(--stortinget-navy)]'
                    : 'bg-white text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-navy)] hover:text-[var(--stortinget-navy)]'
                }`}
              >
                {i18n.t('app.filters')}
              </button>
              <button
                onClick={() => {
                  if (selectedNode?.type === 'person') {
                    setShowTimeline(!showTimeline);
                  }
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                  showTimeline
                    ? 'bg-[var(--stortinget-navy)] text-white border-[var(--stortinget-navy)]'
                    : 'bg-white text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-navy)] hover:text-[var(--stortinget-navy)]'
                }`}
                title={!selectedNode?.type || selectedNode.type !== 'person' ? i18n.t('app.timeline.select') : ''}
              >
                {i18n.t('app.timeline')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Legend */}
        <Legend />

        {/* Graph */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-lg text-[var(--stortinget-muted)]">{i18n.t('loading')}</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-lg text-[var(--stortinget-red)] text-center p-8">{error}</div>
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

      {/* Node details panel — show for persons and non-company orgs */}
      {selectedNode && selectedNode.type !== 'company' && (
        <NodeDetails
          node={selectedNode}
          links={graphData.links.filter(
            (l) =>
              (typeof l.source === 'string' ? l.source : (l.source as any).id) === selectedNode.id ||
              (typeof l.target === 'string' ? l.target : (l.target as any).id) === selectedNode.id
          )}
          nodes={graphData.nodes}
          onClose={() => setSelectedNode(null)}
          onNodeClick={handleNodeClick}
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
    </div>
    </I18nContext.Provider>
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
