'use client';

import { useState, useEffect } from 'react';
import { apiService, SearchResult } from '../lib/api';

type SearchMode = 'semantic' | 'text';

interface SearchInterfaceProps {
  onSearchResults: (results: SearchResult[]) => void;
  onLoading: (loading: boolean) => void;
}

export default function SearchInterface({ onSearchResults, onLoading }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<SearchMode>('semantic');
  const [threshold, setThreshold] = useState(0.5);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    onLoading(true);

    try {
      const response = await apiService.searchStudies(query, 20, threshold);
      onSearchResults(response.results);
  const normalizedType: SearchMode = response.search_type === 'filtered' ? 'semantic' : response.search_type;
  setSearchType(normalizedType);
    } catch (error) {
      console.error('Search failed:', error);
      onSearchResults([]);
    } finally {
      setIsSearching(false);
      onLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🔍 Search NASA Space Biology Research
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: 'microgravity effects on bone loss' or 'plant growth in space'"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="semantic"
                name="searchType"
                value="semantic"
                checked={searchType === 'semantic'}
                onChange={(e) => setSearchType(e.target.value as SearchMode)}
                className="text-blue-600"
              />
              <label htmlFor="semantic" className="text-sm font-medium text-gray-700">
                AI Semantic Search
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="text"
                name="searchType"
                value="text"
                checked={searchType === 'text'}
                onChange={(e) => setSearchType(e.target.value as SearchMode)}
                className="text-blue-600"
              />
              <label htmlFor="text" className="text-sm font-medium text-gray-700">
                Text Search
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="threshold" className="text-sm font-medium text-gray-700">
                Relevance:
              </label>
              <input
                type="range"
                id="threshold"
                min="0.1"
                max="1.0"
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-600">{threshold.toFixed(1)}</span>
            </div>
          </div>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          <p>💡 <strong>AI Search Tips:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              Use natural language like
              {' '}
              <span className="text-gray-800">&ldquo;How does microgravity affect muscle mass?&rdquo;</span>
            </li>
            <li>
              Try specific terms such as
              {' '}
              <span className="text-gray-800">&ldquo;bone density&rdquo;</span>,
              {' '}
              <span className="text-gray-800">&ldquo;plant growth&rdquo;</span>,
              {' '}
              <span className="text-gray-800">&ldquo;radiation effects&rdquo;</span>
            </li>
            <li>Lower the relevance threshold to surface more results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
