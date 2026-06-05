export default function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-[var(--stortinget-border)] rounded-lg p-3 shadow-sm backdrop-blur-sm">
      <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase mb-2">Forklaring</h4>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[var(--stortinget-text)]">Person</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-[var(--stortinget-text)]">Selskap</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--stortinget-red)]" />
          <span className="text-[var(--stortinget-text)]">Parti</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-[var(--stortinget-text)]">Statlig organ</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-[var(--stortinget-border)] space-y-1.5 text-sm">
        <h4 className="text-[10px] font-semibold text-[var(--stortinget-muted)] uppercase mb-1">Linjer</h4>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-green-500" />
          <span className="text-[var(--stortinget-text)]">Styreverv</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[var(--stortinget-red)]" />
          <span className="text-[var(--stortinget-text)]">Politisk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-amber-500" />
          <span className="text-[var(--stortinget-text)]">Statlig</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-purple-500" />
          <span className="text-[var(--stortinget-text)]">Ledelse</span>
        </div>
      </div>
    </div>
  );
}
