'use client';

import { useState, useEffect } from 'react';
import { apiService, Study, FacetsResponse } from '../lib/api';

export default function StudyBrowser() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedJournal, setSelectedJournal] = useState<string>('');

  const pageSize = 20;

  useEffect(() => {
    loadStudies();
    loadFacets();
  }, [page, selectedYear, selectedJournal]);

  const loadStudies = async () => {
    setLoading(true);
    try {
      const response = await apiService.getStudies(page, pageSize);
      setStudies(response.results);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Failed to load studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFacets = async () => {
    try {
      const response = await apiService.getFacets();
      setFacets(response);
    } catch (error) {
      console.error('Failed to load facets:', error);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            📚 Browse All Studies ({totalCount} total)
          </h2>
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
        </div>

        {/* Filters */}
        {facets && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Years</option>
                  {facets.years.map((year) => (
                    <option key={year.name} value={year.name}>
                      {year.name} ({year.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Journal Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Journal
                </label>
                <select
                  value={selectedJournal}
                  onChange={(e) => setSelectedJournal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Journals</option>
                  {facets.journals.map((journal) => (
                    <option key={journal.name} value={journal.name}>
                      {journal.name} ({journal.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Studies List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading studies...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {studies.map((study) => (
              <StudyListItem key={study.id} study={study} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 rounded-lg ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StudyListItem({ study }: { study: Study }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {study.year && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                {study.year}
              </span>
            )}
            {study.journal && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                {study.journal}
              </span>
            )}
          </div>
          
          <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {study.title}
          </h4>
          
          {study.authors && (
            <p className="text-sm text-gray-600 mb-2">
              <strong>Authors:</strong> {study.authors}
            </p>
          )}
          
          {study.abstract && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {study.abstract}
            </p>
          )}
        </div>
        
        <a
          href={study.pmc_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Study
        </a>
      </div>
    </div>
  );
}
