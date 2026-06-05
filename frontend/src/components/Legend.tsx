export default function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 border border-slate-700 rounded-lg p-3 backdrop-blur-sm">
      <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Forklaring</h4>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-slate-300">Person</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-slate-300">Selskap</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-pink-400" />
          <span className="text-slate-300">Parti</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-slate-300">Statlig organ</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-slate-700 space-y-1.5 text-sm">
        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Linjer</h4>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-green-400" />
          <span className="text-slate-300">Styreverv</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-pink-400" />
          <span className="text-slate-300">Politisk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-amber-400" />
          <span className="text-slate-300">Statlig</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-purple-400" />
          <span className="text-slate-300">Ledelse</span>
        </div>
      </div>
    </div>
  );
}
