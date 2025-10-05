'use client';

import { useCallback, useEffect, useState } from 'react';

const COMMON_QUERIES = [
  'microgravity effects on bone loss',
  'plant growth in space',
  'muscle atrophy spaceflight',
  'radiation effects on organisms',
  'bone density microgravity',
  'cardiovascular changes space',
  'immune system space',
  'cell division microgravity',
  'protein synthesis space',
  'gene expression microgravity'
];

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: (query: string) => void;
  loading: boolean;
  placeholder?: string;
  onClear?: () => void;
}

export default function SearchBar({
  query,
  onQueryChange,
  onSearch,
  loading,
  placeholder,
  onClear,
}: SearchBarProps) {
  const [internalQuery, setInternalQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const updateSuggestions = useCallback((value: string) => {
    if (value.length > 2) {
      const filtered = COMMON_QUERIES.filter(q =>
        q.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      setInternalQuery(query ?? '');
      updateSuggestions(query ?? '');
    }
  }, [query, updateSuggestions, isClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = internalQuery.trim();
    if (trimmed) {
      setInternalQuery(trimmed);
      onQueryChange(trimmed);
      onSearch(trimmed);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInternalQuery(suggestion);
    onQueryChange(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInternalQuery(value);
    onQueryChange(value);
    updateSuggestions(value);
  };

  const handleClear = () => {
    setInternalQuery('');
    onQueryChange('');
    setShowSuggestions(false);
    onClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-500/10 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(15,60,130,0.35)]">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={isClient ? internalQuery : ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => internalQuery.length > 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder || "Search NASA Space Biology research..."}
            className="w-full rounded-2xl border border-cyan-500/20 bg-slate-900/60 px-6 py-5 text-lg text-slate-100 shadow-[0_0_25px_rgba(8,47,73,0.25)] outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/40"
            disabled={loading}
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            {internalQuery.trim().length > 0 && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/30 bg-slate-900/70 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !internalQuery.trim()}
              className="flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white disabled:border-slate-600 disabled:text-slate-400"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-cyan-200"></div>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/90 shadow-[0_0_35px_rgba(12,74,110,0.35)] backdrop-blur">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full border-b border-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-cyan-500/10 last:border-b-0"
              >
                <span className="text-cyan-100">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </form>

    </div>
  );
}
