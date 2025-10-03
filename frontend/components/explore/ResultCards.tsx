'use client';

import { SearchResult } from '../../lib/api';
import Link from 'next/link';

interface ResultCardsProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
}

export default function ResultCards({ results, loading, query }: ResultCardsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
        <p className="text-gray-500 mb-4">
          Try adjusting your search terms or filters to find relevant studies.
        </p>
        <div className="text-sm text-gray-400">
          <p>💡 <strong>Suggestions:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Try broader search terms</li>
            <li>Check your spelling</li>
            <li>Use different keywords</li>
            <li>Clear some filters</li>
          </ul>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-6xl mb-4">🚀</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to explore!</h3>
        <p className="text-gray-500">
          Search for NASA Space Biology research or use the filters to discover studies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </h3>
        <div className="text-sm text-gray-500">
          Sorted by relevance
        </div>
      </div>

      {/* Result Cards */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <ResultCard key={result.study.id} result={result} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ result, rank }: { result: SearchResult; rank: number }) {
  const { study, evidence_sentences, relevance_score } = result;

  // Generate key bullets from evidence sentences
  const keyBullets = evidence_sentences.slice(0, 2).map(evidence => ({
    text: evidence.sentence_text,
    highlight: true
  }));

  // Mock facet chips (in real implementation, these would come from entity extraction)
  const facetChips = [
    { label: 'Human', type: 'organism', color: 'blue' },
    { label: 'Microgravity', type: 'exposure', color: 'green' },
    { label: 'Bone', type: 'system', color: 'purple' }
  ].slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
              <p className="text-sm text-gray-600 mb-3">
                <strong>Journal:</strong> {study.journal}
              </p>
            )}
          </div>
        </div>

        {/* Facet Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {facetChips.map((chip, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                chip.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                chip.color === 'green' ? 'bg-green-100 text-green-800' :
                chip.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {chip.label}
            </span>
          ))}
        </div>

        {/* Key Bullets */}
        {keyBullets.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-2">Key Findings:</h5>
            <ul className="space-y-1">
              {keyBullets.map((bullet, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className={bullet.highlight ? 'bg-yellow-100 px-1 rounded' : ''}>
                    {bullet.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <Link
              href={`/paper/${study.id}`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Paper
            </Link>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Add to Compare
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            PMCID: {study.pmcid}
          </div>
        </div>
      </div>
    </div>
  );
}
