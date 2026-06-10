import AiSearchBar from './AiSearchBar';
import type { GraphNode } from '../services/api';

interface Props {
  i18n: { t: (key: string) => string };
  showConflicts: boolean;
  setShowConflicts: (v: boolean) => void;
  showDegrees: boolean;
  setShowDegrees: (v: boolean) => void;
  showClusters: boolean;
  setShowClusters: (v: boolean) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  showTimeline: boolean;
  setShowTimeline: (v: boolean) => void;
  selectedNode: GraphNode | null;
  onExport: () => void;
  onReset: () => void;
  onAiSearch: (query: string) => void;
  aiLoading: boolean;
  onClose: () => void;
}

export default function MobileMenu({
  i18n,
  showConflicts,
  setShowConflicts,
  showDegrees,
  setShowDegrees,
  showClusters,
  setShowClusters,
  showFilters,
  setShowFilters,
  showTimeline,
  setShowTimeline,
  selectedNode,
  onExport,
  onReset,
  onAiSearch,
  aiLoading,
  onClose,
}: Props) {
  const btnBase = 'w-full text-left px-3 py-2.5 rounded text-sm font-medium transition-colors border';
  const btnActive = 'bg-[var(--stortinget-red)] text-white border-[var(--stortinget-red)]';
  const btnInactive = 'bg-white text-[var(--stortinget-text)] border-[var(--stortinget-border)] active:bg-gray-50';

  function toggle(setter: (v: boolean) => void, current: boolean) {
    setter(!current);
    onClose();
  }

  return (
    <div className="md:hidden border-t border-[var(--stortinget-border)] bg-white px-3 py-3 space-y-2 max-h-[60vh] overflow-y-auto">
      {/* AI Search */}
      <div className="pb-2">
        <AiSearchBar onAsk={async (q) => { onAiSearch(q); onClose(); }} loading={aiLoading} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { onReset(); onClose(); }} className={`${btnBase} ${btnInactive}`}>
          {i18n.t('app.overview')}
        </button>
        <button onClick={() => toggle(setShowConflicts, showConflicts)} className={`${btnBase} ${showConflicts ? btnActive : btnInactive}`}>
          {i18n.t('app.conflicts')}
        </button>
        <button onClick={() => toggle(setShowDegrees, showDegrees)} className={`${btnBase} ${showDegrees ? btnActive : btnInactive}`}>
          {i18n.t('app.connections')}
        </button>
        <button onClick={() => toggle(setShowClusters, showClusters)} className={`${btnBase} ${showClusters ? btnActive : btnInactive}`}>
          {i18n.t('app.clusters')}
        </button>
        <button onClick={() => toggle(setShowFilters, showFilters)} className={`${btnBase} ${showFilters ? btnActive : btnInactive}`}>
          {i18n.t('app.filters')}
        </button>
        <button
          onClick={() => { if (selectedNode?.type === 'person') { toggle(setShowTimeline, showTimeline); } }}
          className={`${btnBase} ${showTimeline ? btnActive : btnInactive} ${!selectedNode || selectedNode.type !== 'person' ? 'opacity-50' : ''}`}
        >
          {i18n.t('app.timeline')}
        </button>
        <button onClick={() => { onExport(); onClose(); }} className={`${btnBase} ${btnInactive}`}>
          {i18n.t('app.export')}
        </button>
      </div>
    </div>
  );
}
