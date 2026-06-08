import { useState, type FormEvent } from 'react';
import { useI18n } from '../I18nContext';

interface Props {
  onAsk: (query: string) => Promise<void>;
  loading: boolean;
}

export default function AiSearchBar({ onAsk, loading }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    await onAsk(trimmedQuery);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="min-w-16 text-xs font-semibold text-[var(--stortinget-muted)] uppercase tracking-wide">
        {t('ai.search.label')}
      </div>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('ai.search.placeholder')}
        className="w-full px-3 py-1.5 bg-white border border-[var(--stortinget-border)] rounded text-sm text-[var(--stortinget-text)] placeholder-[var(--stortinget-muted)] focus:outline-none focus:border-[var(--stortinget-red)] focus:ring-1 focus:ring-[var(--stortinget-red)]"
      />
      <button
        type="submit"
        disabled={loading || query.trim().length < 3}
        className="px-3 py-1.5 rounded text-xs font-semibold transition-colors border bg-white text-[var(--stortinget-text)] border-[var(--stortinget-border)] hover:border-[var(--stortinget-red)] hover:text-[var(--stortinget-red)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? `${t('ai.search.button')}...` : t('ai.search.button')}
      </button>
    </form>
  );
}
