import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import SearchBar from './components/SearchBar';
import AiSearchBar from './components/AiSearchBar';
import NetworkGraph from './components/NetworkGraph';
import NodeDetails from './components/NodeDetails';
import Legend from './components/Legend';
import TimelineView from './components/TimelineView';
import ConflictsPanel from './components/ConflictsPanel';
import FilterPanel, { DEFAULT_FILTERS } from './components/FilterPanel';
import CompanyDetails from './components/CompanyDetails';
import DegreesPanel from './components/DegreesPanel';
import ClustersPanel from './components/ClustersPanel';
import MobileMenu from './components/MobileMenu';
import AboutPage from './components/AboutPage';
import type { FilterState } from './components/FilterPanel';
import {
  getOverviewGraph,
  expandNode,
  getCompanyGraph,
  getPersonGraph,
  getPersonDetails,
  getPersonConflicts,
  searchWithAI,
} from './services/api';
import type {
  ConflictOfInterest,
  GraphData,
  GraphNode,
  PersonPosition,
} from './services/api';
import { I18nContext, createI18nValue } from './I18nContext';
import type { Language } from './i18n';
import { applySeo } from './seo/applySeo';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'no';
  });
  const i18n = useMemo(() => createI18nValue(lang, (l) => { setLang(l); localStorage.setItem('lang', l); }), [lang]);

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiMatchedNodeIds, setAiMatchedNodeIds] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const loadedNodes = useRef(new Set<string>());

  const [showTimeline, setShowTimeline] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showDegrees, setShowDegrees] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Keep document title, description and <html lang> in sync with the UI language.
  useEffect(() => {
    applySeo(lang);
  }, [lang]);

  const loadOverview = useCallback(async () => {
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
  }, [i18n]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const filteredGraphData = useMemo(() => {
    const visibleNodes = graphData.nodes.filter(
      (n) => filters.nodeTypes[n.type as keyof FilterState['nodeTypes']] !== false
    );
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    const visibleLinks = graphData.links.filter((l) => {
      const sourceId = getLinkEndpointId(l.source as string | { id: string });
      const targetId = getLinkEndpointId(l.target as string | { id: string });
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

    if (node.type === 'person') {
      setShowTimeline(true);
    }

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
          setGraphData((prev) => mergeGraphData(prev, newData));
        }
      } catch (e) {
        console.error('Failed to expand node:', e);
      }
    }
  }, []);

  const handleSearchSelect = useCallback(async (id: string, type: string, orgNumber?: string) => {
    setAiExplanation(null);
    setAiError(null);
    setAiMatchedNodeIds([]);
    if (type === 'company' && orgNumber) {
      try {
        const data = await getCompanyGraph(orgNumber);
        if (data.nodes.length > 0) {
          setGraphData(data);
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
          setGraphData(data);
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
    setAiExplanation(null);
    setAiError(null);
    setAiMatchedNodeIds([]);
    setSelectedNode(null);
    setShowTimeline(false);
    loadedNodes.current.clear();
    loadOverview();
  }, [loadOverview]);

  const handleAiSearch = useCallback(async (query: string) => {
    try {
      setAiLoading(true);
      setAiError(null);
      const [overviewData, aiResult] = await Promise.all([
        getOverviewGraph(),
        searchWithAI(query),
      ]);

      setGraphData(overviewData);
      loadedNodes.current.clear();

      setAiExplanation(aiResult.explanation);
      setAiMatchedNodeIds(aiResult.matchedNodeIds);

      // If only one person matched, select them directly
      const matchedNodes = aiResult.matchedNodeIds
        .map((id: string) => overviewData.nodes.find((n) => n.id === id))
        .filter(Boolean);
      const personNodes = matchedNodes.filter((n) => n!.type === 'person');
      if (personNodes.length === 1) {
        setSelectedNode(personNodes[0]!);
        setShowTimeline(true);
      } else {
        setSelectedNode(null);
        setShowTimeline(false);
      }
    } catch (_error) {
      setAiExplanation(null);
      setAiMatchedNodeIds([]);
      setAiError(i18n.t('ai.search.error'));
    } finally {
      setAiLoading(false);
    }
  }, [i18n]);

  const handlePersonFocus = useCallback(async (personId: string) => {
    const existingNode = graphData.nodes.find((node) => node.id === personId);
    if (existingNode) {
      await handleNodeClick(existingNode);
      return;
    }

    await handleSearchSelect(personId, 'person');
  }, [graphData.nodes, handleNodeClick, handleSearchSelect]);

  const handleConflictPersonClick = useCallback((personId: string) => {
    handlePersonFocus(personId);
  }, [handlePersonFocus]);

  const personNodes = useMemo(
    () => graphData.nodes.filter((node) => node.type === 'person'),
    [graphData.nodes]
  );

  const handleExport = useCallback(async () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    reportWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(i18n.t('export.title'))}</title></head><body style="font-family: Georgia, serif; padding: 24px; color: #1f2937;">${escapeHtml(i18n.t('loading'))}</body></html>`);
    reportWindow.document.close();

    const selectedPerson = selectedNode?.type === 'person' ? selectedNode : null;
    const selectedPersonDetailsPromise = selectedPerson
      ? getPersonDetails(selectedPerson.id).catch(() => null)
      : Promise.resolve(null);
    const selectedPersonConflictsPromise = selectedPerson
      ? getPersonConflicts(selectedPerson.id).catch(() => [])
      : Promise.resolve([] as ConflictOfInterest[]);

    const [selectedPersonDetails, selectedPersonConflicts] = await Promise.all([
      selectedPersonDetailsPromise,
      selectedPersonConflictsPromise,
    ]);

    const generatedAt = new Date().toLocaleString(lang === 'no' ? 'nb-NO' : 'en-US');
    const nodeMap = new Map(graphData.nodes.map((node) => [node.id, node]));
    const selectedConnections = selectedPerson
      ? filteredGraphData.links
          .filter((link) => getLinkEndpointId(link.source as string | { id: string }) === selectedPerson.id || getLinkEndpointId(link.target as string | { id: string }) === selectedPerson.id)
          .map((link) => {
            const sourceId = getLinkEndpointId(link.source as string | { id: string });
            const targetId = getLinkEndpointId(link.target as string | { id: string });
            const otherId = sourceId === selectedPerson.id ? targetId : sourceId;
            return `${nodeMap.get(otherId)?.name || otherId} — ${link.label}`;
          })
      : [];

    const currentPositions = selectedPersonDetails?.currentPositions.map((position) => formatPositionLine(position, i18n.t)) || [];
    const pastPositions = selectedPersonDetails?.pastPositions.map((position) => formatPositionLine(position, i18n.t)) || [];
    const conflictLines = selectedPersonConflicts.map((conflict) => conflict.description);
    const visibleNodeLines = filteredGraphData.nodes.map((node) => `${node.name} (${formatNodeType(node, i18n.t)})`);
    const visibleConnectionLines = filteredGraphData.links.map((link) => {
      const sourceId = getLinkEndpointId(link.source as string | { id: string });
      const targetId = getLinkEndpointId(link.target as string | { id: string });
      return `${nodeMap.get(sourceId)?.name || sourceId} — ${link.label} → ${nodeMap.get(targetId)?.name || targetId}`;
    });

    const reportMarkdown = buildReportMarkdown({
      title: i18n.t('export.title'),
      generatedLabel: i18n.t('export.generated'),
      generatedAt,
      selectedPersonLabel: i18n.t('export.selectedPerson'),
      selectedPersonName: selectedPerson?.name,
      currentPositionsLabel: i18n.t('node.currentPositions'),
      currentPositions,
      pastPositionsLabel: i18n.t('node.pastPositions'),
      pastPositions,
      selectedConnectionsLabel: i18n.t('export.connections'),
      selectedConnections,
      conflictsLabel: i18n.t('export.conflicts'),
      conflicts: conflictLines,
      visibleNodesLabel: i18n.t('export.visibleNodes'),
      visibleNodes: visibleNodeLines,
      visibleConnectionsLabel: i18n.t('export.connections'),
      visibleConnections: visibleConnectionLines,
    });

    const reportHtml = buildReportHtml({
      title: i18n.t('export.title'),
      generatedLabel: i18n.t('export.generated'),
      generatedAt,
      selectedPersonLabel: i18n.t('export.selectedPerson'),
      selectedPersonName: selectedPerson?.name,
      currentPositionsLabel: i18n.t('node.currentPositions'),
      currentPositions,
      pastPositionsLabel: i18n.t('node.pastPositions'),
      pastPositions,
      selectedConnectionsLabel: i18n.t('export.connections'),
      selectedConnections,
      conflictsLabel: i18n.t('export.conflicts'),
      conflicts: conflictLines,
      visibleNodesLabel: i18n.t('export.visibleNodes'),
      visibleNodes: visibleNodeLines,
      visibleConnectionsLabel: i18n.t('export.connections'),
      visibleConnections: visibleConnectionLines,
      copyLabel: i18n.t('export.copy'),
      copiedLabel: i18n.t('export.copied'),
      printLabel: i18n.t('export.print'),
      markdown: reportMarkdown,
    });

    reportWindow.document.open();
    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
  }, [filteredGraphData.links, filteredGraphData.nodes, graphData.nodes, i18n, lang, selectedNode]);

  return (
    <I18nContext.Provider value={i18n}>
      <div className="relative w-full h-full flex flex-col">
        <div className="flex-shrink-0 bg-[var(--stortinget-surface)] border-b border-[var(--stortinget-border)] shadow-sm z-20">
          <div className="h-1 bg-[var(--stortinget-red)]" />
          <div className="px-3 md:px-6 py-2 md:py-3">
            {/* Mobile header */}
            <div className="flex md:hidden items-center justify-between gap-2">
              <div
                onClick={handleResetToOverview}
                className="cursor-pointer select-none flex-shrink-0"
                title={i18n.t('app.overview.tooltip')}
              >
                <h1 className="text-base text-[var(--stortinget-dark)] mb-0 leading-tight">
                  {i18n.t('app.title')}
                </h1>
                <p className="text-[10px] text-[var(--stortinget-muted)] mt-0">
                  {i18n.t('app.subtitle')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => i18n.setLang(lang === 'no' ? 'en' : 'no')}
                  className="px-2 py-1 rounded text-xs font-semibold border bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)]"
                >
                  {lang === 'no' ? '🇬🇧' : '🇳🇴'}
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="px-2 py-1 rounded text-xs font-semibold border bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)]"
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded border border-[var(--stortinget-border)] bg-[var(--stortinget-surface)] text-[var(--stortinget-text)]"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? '✕' : '☰'}
                </button>
              </div>
            </div>
            {/* Mobile search bar */}
            <div className="mt-2 md:hidden">
              <SearchBar onSelect={(id, type, orgNumber) => { handleSearchSelect(id, type, orgNumber); setMobileMenuOpen(false); }} />
            </div>

            {/* Desktop header */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  onClick={handleResetToOverview}
                  className="cursor-pointer select-none"
                  title={i18n.t('app.overview.tooltip')}
                >
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
                <div className="w-96">
                  <AiSearchBar onAsk={handleAiSearch} loading={aiLoading} />
                </div>
                <button
                  onClick={handleResetToOverview}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-colors border bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-red)] hover:text-[var(--stortinget-red)]"
                  title={i18n.t('app.overview.tooltip')}
                >
                  {i18n.t('app.overview')}
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => i18n.setLang(lang === 'no' ? 'en' : 'no')}
                  className="px-2 py-1.5 rounded text-xs font-semibold transition-colors border bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-navy)] hover:text-[var(--stortinget-navy)]"
                  title={lang === 'no' ? 'Switch to English' : 'Bytt til norsk'}
                >
                  {lang === 'no' ? '🇬🇧 EN' : '🇳🇴 NO'}
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="px-2 py-1.5 rounded text-xs font-semibold transition-colors border bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-navy)] hover:text-[var(--stortinget-navy)]"
                  title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <div className="w-px h-6 bg-[var(--stortinget-border)]" />
                <button
                  onClick={() => setShowConflicts(!showConflicts)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                    showConflicts
                      ? 'bg-[var(--stortinget-red)] text-white border-[var(--stortinget-red)]'
                      : 'bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-red)] hover:text-[var(--stortinget-red)]'
                  }`}
                >
                  {i18n.t('app.conflicts')}
                </button>
                <button
                  onClick={() => setShowDegrees(!showDegrees)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                    showDegrees
                      ? 'bg-[var(--stortinget-red)] text-white border-[var(--stortinget-red)]'
                      : 'bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-red)] hover:text-[var(--stortinget-red)]'
                  }`}
                >
                  {i18n.t('app.connections')}
                </button>
                <button
                  onClick={() => setShowClusters(!showClusters)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                    showClusters
                      ? 'bg-[var(--stortinget-red)] text-white border-[var(--stortinget-red)]'
                      : 'bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-red)] hover:text-[var(--stortinget-red)]'
                  }`}
                >
                  {i18n.t('app.clusters')}
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-colors border bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-red)] hover:text-[var(--stortinget-red)]"
                >
                  {i18n.t('app.export')}
                </button>
                <button
                  onClick={() => setShowAbout(true)}
                  className="px-3 py-1.5 rounded text-xs font-semibold transition-colors border bg-white text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-navy)] hover:text-[var(--stortinget-navy)]"
                >
                  {i18n.t('app.about')}
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                    showFilters
                      ? 'bg-[var(--stortinget-navy)] text-white border-[var(--stortinget-navy)]'
                      : 'bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-navy)] hover:text-[var(--stortinget-navy)]'
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
                      : 'bg-[var(--stortinget-surface)] text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-navy)] hover:text-[var(--stortinget-navy)]'
                  }`}
                  title={!selectedNode?.type || selectedNode.type !== 'person' ? i18n.t('app.timeline.select') : ''}
                >
                  {i18n.t('app.timeline')}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <MobileMenu
              i18n={i18n}
              showConflicts={showConflicts}
              setShowConflicts={setShowConflicts}
              showDegrees={showDegrees}
              setShowDegrees={setShowDegrees}
              showClusters={showClusters}
              setShowClusters={setShowClusters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              showTimeline={showTimeline}
              setShowTimeline={setShowTimeline}
              selectedNode={selectedNode}
              onExport={handleExport}
              onAbout={() => setShowAbout(true)}
              onReset={handleResetToOverview}
              onAiSearch={handleAiSearch}
              aiLoading={aiLoading}
              onClose={() => setMobileMenuOpen(false)}
              darkMode={darkMode}
              setDarkMode={toggleDarkMode}
            />
          )}
        </div>

        <div className="flex-1 relative overflow-hidden">
          <Legend />

          {loading ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-lg text-[var(--stortinget-muted)]">{i18n.t('loading')}</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-lg text-[var(--stortinget-red)] text-center p-8">{error}</div>
            </div>
          ) : (
            <NetworkGraph
              data={filteredGraphData}
              onNodeClick={handleNodeClick}
              selectedNode={selectedNode}
              highlightedNodeIds={new Set(aiMatchedNodeIds)}
              darkMode={darkMode}
            />
          )}

          {(aiExplanation || aiError) && !loading && !error && (
            <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-auto md:max-w-xl rounded-lg border border-[var(--stortinget-border)] bg-[var(--stortinget-surface)] px-3 py-2 md:px-4 md:py-3 shadow-md z-30">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--stortinget-muted)]">
                {i18n.t('ai.search.result')}
              </div>
              <div className={`mt-1 text-sm ${aiError ? 'text-[var(--stortinget-red)]' : 'text-[var(--stortinget-text)]'}`}>
                {aiError || aiExplanation}
              </div>
              {!aiError && aiMatchedNodeIds.length === 0 && (
                <div className="mt-1 text-xs text-[var(--stortinget-muted)]">{i18n.t('ai.search.noResults')}</div>
              )}
              {!aiError && aiMatchedNodeIds.length > 1 && (
                <ul className="mt-2 space-y-1">
                  {aiMatchedNodeIds
                    .map((id) => graphData.nodes.find((n) => n.id === id))
                    .filter((n) => n && n.type === 'person')
                    .map((node) => (
                      <li key={node!.id}>
                        <button
                          onClick={() => handleNodeClick(node!)}
                          className="text-sm text-blue-700 hover:underline hover:text-[var(--stortinget-red)] cursor-pointer"
                        >
                          → {node!.name}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

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

          {showDegrees && (
            <DegreesPanel
              people={personNodes}
              nodes={graphData.nodes}
              onClose={() => setShowDegrees(false)}
            />
          )}

          {showClusters && (
            <ClustersPanel
              onPersonClick={handlePersonFocus}
              onClose={() => setShowClusters(false)}
            />
          )}

          {showFilters && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          )}

          {showAbout && (
            <AboutPage onClose={() => setShowAbout(false)} />
          )}

          {selectedNode && selectedNode.type !== 'company' && (
            <NodeDetails
              node={selectedNode}
              links={graphData.links.filter(
                (l) =>
                  getLinkEndpointId(l.source as string | { id: string }) === selectedNode.id ||
                  getLinkEndpointId(l.target as string | { id: string }) === selectedNode.id
              )}
              nodes={graphData.nodes}
              onClose={() => setSelectedNode(null)}
              onNodeClick={handleNodeClick}
            />
          )}

          {selectedNode && selectedNode.type === 'company' && selectedNode.id.startsWith('org-') && (
            <CompanyDetails
              orgNumber={selectedNode.id.replace('org-', '')}
              companyName={selectedNode.name}
              onClose={() => setSelectedNode(null)}
              onPersonClick={(personId) => {
                void handleSearchSelect(personId, 'person');
              }}
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

  const linkSet = new Set(existing.links.map((l) => `${getLinkEndpointId(l.source as string | { id: string })}-${getLinkEndpointId(l.target as string | { id: string })}-${l.label}`));
  const mergedLinks = [...existing.links];
  for (const link of incoming.links) {
    const key = `${getLinkEndpointId(link.source as string | { id: string })}-${getLinkEndpointId(link.target as string | { id: string })}-${link.label}`;
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

function getLinkEndpointId(endpoint: string | { id: string }) {
  return typeof endpoint === 'string' ? endpoint : endpoint.id;
}

function formatPositionLine(position: PersonPosition, t: (key: string) => string) {
  const years = position.startYear
    ? ` (${position.startYear}–${position.endYear === null ? t('node.now') : position.endYear || ''})`
    : '';
  return `${position.title} — ${position.organization}${years}`;
}

function formatNodeType(node: GraphNode, t: (key: string) => string) {
  if (node.type === 'person') return t('node.person');
  if (node.type === 'company') return t('node.company');
  if (node.type === 'political_party') return t('node.party');
  return t('node.government');
}

interface ReportSections {
  title: string;
  generatedLabel: string;
  generatedAt: string;
  selectedPersonLabel: string;
  selectedPersonName?: string;
  currentPositionsLabel: string;
  currentPositions: string[];
  pastPositionsLabel: string;
  pastPositions: string[];
  selectedConnectionsLabel: string;
  selectedConnections: string[];
  conflictsLabel: string;
  conflicts: string[];
  visibleNodesLabel: string;
  visibleNodes: string[];
  visibleConnectionsLabel: string;
  visibleConnections: string[];
}

function buildReportMarkdown(report: ReportSections) {
  const lines = [
    `# ${report.title}`,
    '',
    `**${report.generatedLabel}:** ${report.generatedAt}`,
  ];

  if (report.selectedPersonName) {
    lines.push(
      '',
      `## ${report.selectedPersonLabel}`,
      report.selectedPersonName,
      '',
      `### ${report.currentPositionsLabel}`,
      ...toBulletLines(report.currentPositions),
      '',
      `### ${report.pastPositionsLabel}`,
      ...toBulletLines(report.pastPositions),
      '',
      `### ${report.selectedConnectionsLabel}`,
      ...toBulletLines(report.selectedConnections),
      '',
      `### ${report.conflictsLabel}`,
      ...toBulletLines(report.conflicts),
    );
  }

  lines.push(
    '',
    `## ${report.visibleNodesLabel} (${report.visibleNodes.length})`,
    ...toBulletLines(report.visibleNodes),
    '',
    `## ${report.visibleConnectionsLabel} (${report.visibleConnections.length})`,
    ...toBulletLines(report.visibleConnections),
  );

  return lines.join('\n');
}

function buildReportHtml(report: ReportSections & { copyLabel: string; copiedLabel: string; printLabel: string; markdown: string }) {
  const copyLabelJs = JSON.stringify(report.copyLabel);
  const copiedLabelJs = JSON.stringify(report.copiedLabel);
  const markdownJs = JSON.stringify(report.markdown);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(report.title)}</title>
    <style>
      body { font-family: Georgia, serif; margin: 0; background: #faf9f7; color: #1f2937; }
      .page { max-width: 920px; margin: 0 auto; padding: 32px 24px 48px; }
      .actions { display: flex; gap: 12px; margin-bottom: 24px; }
      button { border: 1px solid #d7d2ca; background: #ffffff; color: #1f2937; padding: 10px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; }
      button:hover { border-color: #cf0a2c; color: #cf0a2c; }
      h1, h2, h3 { color: #1a1a2e; }
      h1 { margin-bottom: 8px; }
      .meta { color: #6b7280; margin-bottom: 28px; }
      .section { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
      .section h2, .section h3 { margin-top: 0; }
      ul { margin: 0; padding-left: 20px; }
      li { margin-bottom: 8px; }
      @media print {
        body { background: #ffffff; }
        .actions { display: none; }
        .page { max-width: none; padding: 0; }
        .section { box-shadow: none; break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="actions">
        <button onclick="copyReport(this)">${escapeHtml(report.copyLabel)}</button>
        <button onclick="window.print()">${escapeHtml(report.printLabel)}</button>
      </div>
      <h1>${escapeHtml(report.title)}</h1>
      <div class="meta">${escapeHtml(report.generatedLabel)}: ${escapeHtml(report.generatedAt)}</div>
      ${report.selectedPersonName ? `
        <section class="section">
          <h2>${escapeHtml(report.selectedPersonLabel)}</h2>
          <p><strong>${escapeHtml(report.selectedPersonName)}</strong></p>
          <h3>${escapeHtml(report.currentPositionsLabel)}</h3>
          ${renderHtmlList(report.currentPositions)}
          <h3>${escapeHtml(report.pastPositionsLabel)}</h3>
          ${renderHtmlList(report.pastPositions)}
          <h3>${escapeHtml(report.selectedConnectionsLabel)}</h3>
          ${renderHtmlList(report.selectedConnections)}
          <h3>${escapeHtml(report.conflictsLabel)}</h3>
          ${renderHtmlList(report.conflicts)}
        </section>
      ` : ''}
      <section class="section">
        <h2>${escapeHtml(report.visibleNodesLabel)} (${report.visibleNodes.length})</h2>
        ${renderHtmlList(report.visibleNodes)}
      </section>
      <section class="section">
        <h2>${escapeHtml(report.visibleConnectionsLabel)} (${report.visibleConnections.length})</h2>
        ${renderHtmlList(report.visibleConnections)}
      </section>
    </div>
    <script>
      const markdown = ${markdownJs};
      async function copyReport(button) {
        await navigator.clipboard.writeText(markdown);
        const originalLabel = ${copyLabelJs};
        button.textContent = ${copiedLabelJs};
        setTimeout(() => {
          button.textContent = originalLabel;
        }, 1500);
      }
    </script>
  </body>
</html>`;
}

function renderHtmlList(items: string[]) {
  const normalized = items.length > 0 ? items : ['—'];
  return `<ul>${normalized.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function toBulletLines(items: string[]) {
  const normalized = items.length > 0 ? items : ['—'];
  return normalized.map((item) => `- ${item}`);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
