import { useState, useEffect, useRef } from 'react';
import { search } from '../services/api';
import type { SearchResult } from '../services/api';

interface Props {
  onSelect: (id: string, type: string, orgNumber?: string) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await search(query);
        setResults(data);
        setIsOpen(true);
      } catch (e) {
        console.error('Search error:', e);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(id: string, type: string, orgNumber?: string) {
    setIsOpen(false);
    setQuery('');
    onSelect(id, type, orgNumber);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søk etter person eller selskap..."
        className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      {isOpen && results && (
        <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
          {results.persons.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
                Personer
              </div>
              {results.persons.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id, 'person')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {results.companies.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
                Selskaper
              </div>
              {results.companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id, 'company', c.orgNumber)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  {c.name}
                  <span className="text-xs text-slate-500 ml-auto">{c.orgNumber}</span>
                </button>
              ))}
            </div>
          )}

          {results.persons.length === 0 && results.companies.length === 0 && (
            <div className="px-3 py-4 text-center text-slate-400 text-sm">
              Ingen resultater funnet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
