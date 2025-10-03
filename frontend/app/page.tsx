'use client';

import { useState } from 'react';
import SearchInterface from '../components/SearchInterface';
import SearchResults from '../components/SearchResults';
import StudyBrowser from '../components/StudyBrowser';
import { SearchResult } from '../lib/api';

export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'browse'>('search');

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
  };

  const handleLoading = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🚀 BioSpace Knowledge Engine
              </h1>
              <span className="ml-3 text-sm text-gray-500">
                572 NASA Space Biology Studies
              </span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔍 AI Search
              </button>
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'browse'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📚 Browse Studies
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        {activeTab === 'search' ? (
          <div>
            <SearchInterface
              onSearchResults={handleSearchResults}
              onLoading={handleLoading}
            />
            <SearchResults results={searchResults} loading={loading} />
          </div>
        ) : (
          <StudyBrowser />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              <strong>BioSpace Knowledge Engine</strong> - AI-powered exploration of NASA Space Biology research
            </p>
            <p className="text-sm">
              Powered by Django REST API, Next.js, and FAISS vector search
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
