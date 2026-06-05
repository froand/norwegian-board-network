import { useState, useRef, useEffect, useCallback } from 'react';

export interface FilterState {
  categories: {
    board: boolean;
    political: boolean;
    government: boolean;
    executive: boolean;
  };
  nodeTypes: {
    person: boolean;
    company: boolean;
    political_party: boolean;
    government_body: boolean;
  };
}

const DEFAULT_FILTERS: FilterState = {
  categories: { board: true, political: true, government: true, executive: true },
  nodeTypes: { person: true, company: true, political_party: true, government_body: true },
};

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClose: () => void;
}

export default function FilterPanel({ filters, onChange, onClose }: Props) {
  const [position, setPosition] = useState({ x: window.innerWidth - 280, y: 96 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleCategory = (key: keyof FilterState['categories']) => {
    onChange({
      ...filters,
      categories: { ...filters.categories, [key]: !filters.categories[key] },
    });
  };

  const toggleNodeType = (key: keyof FilterState['nodeTypes']) => {
    onChange({
      ...filters,
      nodeTypes: { ...filters.nodeTypes, [key]: !filters.nodeTypes[key] },
    });
  };

  return (
    <div
      className="fixed w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="flex justify-between items-center p-3 border-b border-slate-700 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-white font-semibold text-sm">🔍 Filtre</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
      </div>

      <div className="p-3 space-y-4">
        {/* Node type filters */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Nodetyper</h4>
          <div className="space-y-1.5">
            <FilterCheckbox
              label="👤 Personer"
              checked={filters.nodeTypes.person}
              onChange={() => toggleNodeType('person')}
              color="#60a5fa"
            />
            <FilterCheckbox
              label="🏢 Selskaper"
              checked={filters.nodeTypes.company}
              onChange={() => toggleNodeType('company')}
              color="#34d399"
            />
            <FilterCheckbox
              label="🏛️ Partier"
              checked={filters.nodeTypes.political_party}
              onChange={() => toggleNodeType('political_party')}
              color="#f472b6"
            />
            <FilterCheckbox
              label="⚖️ Statlige organer"
              checked={filters.nodeTypes.government_body}
              onChange={() => toggleNodeType('government_body')}
              color="#fbbf24"
            />
          </div>
        </div>

        {/* Relationship category filters */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Relasjonstyper</h4>
          <div className="space-y-1.5">
            <FilterCheckbox
              label="Styreverv"
              checked={filters.categories.board}
              onChange={() => toggleCategory('board')}
              color="#34d399"
            />
            <FilterCheckbox
              label="Politisk"
              checked={filters.categories.political}
              onChange={() => toggleCategory('political')}
              color="#f472b6"
            />
            <FilterCheckbox
              label="Statlig"
              checked={filters.categories.government}
              onChange={() => toggleCategory('government')}
              color="#fbbf24"
            />
            <FilterCheckbox
              label="Ledelse"
              checked={filters.categories.executive}
              onChange={() => toggleCategory('executive')}
              color="#a78bfa"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange, color }: {
  label: string;
  checked: boolean;
  onChange: () => void;
  color: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 hover:text-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
      />
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </label>
  );
}

export { DEFAULT_FILTERS };
