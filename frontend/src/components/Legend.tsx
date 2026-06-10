import { useState } from 'react';
import { useI18n } from '../I18nContext';

export default function Legend() {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // On mobile, show a collapsible mini legend
  if (isMobile) {
    return (
      <div
        className="bg-[var(--stortinget-surface)] border border-[var(--stortinget-border)] rounded-lg shadow-sm z-20"
        style={{ position: 'absolute', left: 8, bottom: 8 }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="px-2 py-1 text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase w-full text-left"
        >
          {collapsed ? '◀ ' : '▼ '}{t('legend.title')}
        </button>
        {!collapsed && (
          <div className="px-2 pb-2 space-y-1 text-xs">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span>{t('legend.person')}</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /><span>{t('legend.company')}</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--stortinget-red)]" /><span>{t('legend.party')}</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>{t('legend.government')}</span></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-[var(--stortinget-surface)] border border-[var(--stortinget-border)] rounded-lg p-3 shadow-sm z-20"
      style={{ position: 'absolute', left: 16, bottom: 16 }}
    >
      <div className="mb-2">
        <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase">{t('legend.title')}</h4>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[var(--stortinget-text)]">{t('legend.person')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-[var(--stortinget-text)]">{t('legend.company')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--stortinget-red)]" />
          <span className="text-[var(--stortinget-text)]">{t('legend.party')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-[var(--stortinget-text)]">{t('legend.government')}</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-[var(--stortinget-border)] space-y-1.5 text-sm">
        <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase mb-1">{t('legend.lines')}</h4>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-green-500" />
          <span className="text-[var(--stortinget-text)]">{t('legend.board')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[var(--stortinget-red)]" />
          <span className="text-[var(--stortinget-text)]">{t('legend.political')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-amber-500" />
          <span className="text-[var(--stortinget-text)]">{t('legend.govLine')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-purple-500" />
          <span className="text-[var(--stortinget-text)]">{t('legend.executive')}</span>
        </div>
      </div>
    </div>
  );
}
