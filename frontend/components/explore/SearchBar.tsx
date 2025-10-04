'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  placeholder?: string;
}

export default function SearchBar({ onSearch, loading, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const commonQueries = [
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 2) {
      const filtered = commonQueries.filter(q => 
        q.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
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
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length > 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder || "Search NASA Space Biology research..."}
            className="w-full rounded-2xl border border-cyan-500/20 bg-slate-900/60 px-6 py-5 text-lg text-slate-100 shadow-[0_0_25px_rgba(8,47,73,0.25)] outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/40"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white disabled:border-slate-600 disabled:text-slate-400"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-cyan-200"></div>
            ) : (
              'Search'
            )}
          </button>
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

      {/* Search Tips */}
      <div className="mt-6 rounded-xl border border-cyan-500/10 bg-slate-900/70 px-5 py-4 text-sm text-slate-200">
        <p className="mb-3 flex items-center gap-2 text-cyan-200">
          <span className="text-base">💡</span>
          <span className="font-semibold uppercase tracking-[0.2em] text-cyan-100">Search tips</span>
        </p>
        <ul className="ml-4 space-y-2 text-slate-300">
          <li>Use natural language: &ldquo;How does microgravity affect muscle mass?&rdquo;</li>
          <li>Combine concepts and exposures: &ldquo;plant growth&rdquo; + &ldquo;radiation&rdquo;</li>
          <li>Target systems: &ldquo;bone density&rdquo;, &ldquo;cardiovascular&rdquo;, &ldquo;immune response&rdquo;</li>
          <li>Apply facets to orbit mission, organism, or assay to refine</li>
        </ul>
      </div>
    </div>
  );
}
