'use client';

import { useState, useEffect } from 'react';
import { apiService, Study, EvidenceSentence } from '../../lib/api';
import Link from 'next/link';

export default function ComparePage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [evidence, setEvidence] = useState<{ [studyId: number]: EvidenceSentence[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get studies from localStorage or URL params
    const compareList = getCompareList();
    if (compareList.length > 0) {
      loadStudies(compareList);
    }
  }, []);

  const getCompareList = (): number[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('compareList');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };

  const loadStudies = async (studyIds: number[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const studyPromises = studyIds.map(id => apiService.getStudy(id));
      const studyResults = await Promise.all(studyPromises);
      setStudies(studyResults);

      // Load evidence for each study
      const evidencePromises = studyIds.map(async (id) => {
        try {
          const evidenceData = await apiService.getStudyEvidence(id);
          return { id, evidence: evidenceData };
        } catch (err) {
          console.error(`Failed to load evidence for study ${id}:`, err);
          return { id, evidence: [] };
        }
      });

      const evidenceResults = await Promise.all(evidencePromises);
      const evidenceMap: { [studyId: number]: EvidenceSentence[] } = {};
      evidenceResults.forEach(({ id, evidence }) => {
        evidenceMap[id] = evidence;
      });
      setEvidence(evidenceMap);

    } catch (err: any) {
      console.error('Error loading studies:', err);
      setError(`Failed to load studies: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeStudy = (studyId: number) => {
    const updatedStudies = studies.filter(s => s.id !== studyId);
    setStudies(updatedStudies);
    
    // Update localStorage
    const updatedIds = updatedStudies.map(s => s.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('compareList', JSON.stringify(updatedIds));
    }
    
    // Remove evidence for this study
    const updatedEvidence = { ...evidence };
    delete updatedEvidence[studyId];
    setEvidence(updatedEvidence);
  };

  const clearAll = () => {
    setStudies([]);
    setEvidence({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('compareList');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading studies for comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Studies</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            href="/explore"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (studies.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-500 text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Studies to Compare</h1>
          <p className="text-gray-600 mb-4">
            Add studies to your comparison list from the search results or paper detail pages.
          </p>
          <Link 
            href="/explore"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search Studies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link href="/explore" className="hover:text-blue-600">
                  Search
                </Link>
                <span>›</span>
                <span className="text-gray-900 font-medium">Compare Studies</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">
                Compare Studies ({studies.length}/3)
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={clearAll}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <Link 
                href="/explore"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add More Studies
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {studies.map((study, index) => (
            <div key={study.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Study Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Study {index + 1}
                    </span>
                    {study.year && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {study.year}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-3">
                    {study.title}
                  </h3>
                </div>
                <button
                  onClick={() => removeStudy(study.id)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove from comparison"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Study Metadata */}
              <div className="space-y-2 mb-4">
                {study.authors && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Authors:</span>
                    <p className="text-sm text-gray-700 line-clamp-2">{study.authors}</p>
                  </div>
                )}
                {study.journal && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Journal:</span>
                    <p className="text-sm text-gray-700">{study.journal}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-gray-500">PMCID:</span>
                  <a 
                    href={study.pmc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 ml-1"
                  >
                    {study.pmcid}
                  </a>
                </div>
              </div>

              {/* Abstract */}
              {study.abstract && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Abstract</h4>
                  <p className="text-sm text-gray-700 line-clamp-4">{study.abstract}</p>
                </div>
              )}

              {/* Key Findings */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Key Findings ({evidence[study.id]?.length || 0})
                </h4>
                <div className="space-y-2">
                  {evidence[study.id]?.slice(0, 3).map((evidenceItem, idx) => (
                    <div key={evidenceItem.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Finding {idx + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          Pos: {evidenceItem.char_start}-{evidenceItem.char_end}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-3">{evidenceItem.sentence_text}</p>
                    </div>
                  ))}
                  {evidence[study.id]?.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{evidence[study.id].length - 3} more findings
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link 
                  href={`/paper/${study.id}`}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  View Details
                </Link>
                <a 
                  href={study.pmc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  View on PMC
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Summary */}
        {studies.length > 1 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Comparison Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Publication Years</h3>
                <div className="space-y-1">
                  {studies.map((study, index) => (
                    <div key={study.id} className="flex justify-between text-sm">
                      <span>Study {index + 1}:</span>
                      <span className="font-medium">{study.year || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Evidence Count</h3>
                <div className="space-y-1">
                  {studies.map((study, index) => (
                    <div key={study.id} className="flex justify-between text-sm">
                      <span>Study {index + 1}:</span>
                      <span className="font-medium">{evidence[study.id]?.length || 0} findings</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Journals</h3>
                <div className="space-y-1">
                  {studies.map((study, index) => (
                    <div key={study.id} className="flex justify-between text-sm">
                      <span>Study {index + 1}:</span>
                      <span className="font-medium text-right line-clamp-1">
                        {study.journal?.split(' ')[0] || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🚀 BioSpace Knowledge Engine
              </h3>
              <p className="text-sm text-gray-600">
                AI-powered comparison of NASA Space Biology research
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/explore"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
