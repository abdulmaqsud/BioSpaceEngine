'use client';

import { SearchResult } from '../lib/api';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
}

export default function SearchResults({ results, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Searching through 572 NASA studies...</span>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or lowering the relevance threshold.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Found {results.length} relevant studies
        </h3>
        <p className="text-sm text-gray-600">
          Results ranked by AI relevance score
        </p>
      </div>

      <div className="space-y-6">
        {results.map((result, index) => (
          <StudyCard key={result.study.id} result={result} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}

function StudyCard({ result, rank }: { result: SearchResult; rank: number }) {
  const { study, evidence_sentences, relevance_score } = result;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                #{rank}
              </span>
              <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
                {Math.round(relevance_score * 100)}% match
              </span>
              {study.year && (
                <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2 py-1 rounded">
                  {study.year}
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
            {study.journal && (
              <p className="text-sm text-gray-600 mb-2">
                <strong>Journal:</strong> {study.journal}
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

        {/* Abstract */}
        {study.abstract && (
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Abstract:</h5>
            <p className="text-sm text-gray-600 line-clamp-3">
              {study.abstract}
            </p>
          </div>
        )}

        {/* Evidence Sentences */}
        {evidence_sentences.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-2">
              Relevant Evidence ({evidence_sentences.length}):
            </h5>
            <div className="space-y-2">
              {evidence_sentences.slice(0, 3).map((evidence, idx) => (
                <div key={evidence.id} className="bg-blue-50 border-l-4 border-blue-400 p-3">
                  <p className="text-sm text-gray-700">
                    {evidence.sentence_text}
                  </p>
                </div>
              ))}
              {evidence_sentences.length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{evidence_sentences.length - 3} more evidence sentences...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            PMCID: {study.pmcid}
          </div>
          <div className="text-xs text-gray-500">
            Added: {new Date(study.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
