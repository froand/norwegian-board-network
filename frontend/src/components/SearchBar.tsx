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
        className="w-full px-3 py-1.5 bg-white border border-[var(--stortinget-border)] rounded text-sm text-[var(--stortinget-text)] placeholder-[var(--stortinget-muted)] focus:outline-none focus:border-[var(--stortinget-red)] focus:ring-1 focus:ring-[var(--stortinget-red)]"
      />

      {isOpen && results && (
        <div className="absolute top-full mt-1 w-full bg-white border border-[var(--stortinget-border)] rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
          {results.persons.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold text-[var(--stortinget-muted)] uppercase border-b border-[var(--stortinget-border)]">
                Personer
              </div>
              {results.persons.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id, 'person')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-[var(--stortinget-text)] flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {results.companies.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold text-[var(--stortinget-muted)] uppercase border-b border-[var(--stortinget-border)]">
                Selskaper
              </div>
              {results.companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id, 'company', c.orgNumber)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-[var(--stortinget-text)] flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {c.name}
                  <span className="text-xs text-[var(--stortinget-muted)] ml-auto">{c.orgNumber}</span>
                </button>
              ))}
            </div>
          )}

          {results.persons.length === 0 && results.companies.length === 0 && (
            <div className="px-3 py-4 text-center text-[var(--stortinget-muted)] text-sm">
              Ingen resultater funnet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
