import { useI18n } from '../I18nContext';
import { useDraggable } from '../hooks/useDraggable';

export default function Legend() {
  const { t } = useI18n();
  const { position, handleMouseDown } = useDraggable({ x: 16, y: 16 });

  return (
    <div
      className="bg-white/95 border border-[var(--stortinget-border)] rounded-lg p-3 shadow-sm backdrop-blur-sm z-20"
      style={{ position: 'absolute', left: position.x, top: position.y }}
    >
      <div
        className="cursor-grab active:cursor-grabbing select-none mb-2"
        onMouseDown={handleMouseDown}
      >
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
