'use client';

import { useState, useEffect } from 'react';
import { SearchResult } from '../../lib/api';
import Link from 'next/link';

interface ResultCardsProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
}

export default function ResultCards({ results, loading, query }: ResultCardsProps) {
  const [compareList, setCompareList] = useState<number[]>([]);

  // Load compare list from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('compareList');
      if (stored) {
        setCompareList(JSON.parse(stored));
      }
    }
  }, []);

  const handleAddToCompare = (studyId: number) => {
    if (compareList.includes(studyId)) {
      // Remove from compare list
      const updatedList = compareList.filter(id => id !== studyId);
      setCompareList(updatedList);
      if (typeof window !== 'undefined') {
        localStorage.setItem('compareList', JSON.stringify(updatedList));
      }
    } else {
      if (compareList.length < 3) { // Limit to 3 studies for comparison
        // Add to compare list
        const updatedList = [...compareList, studyId];
        setCompareList(updatedList);
        if (typeof window !== 'undefined') {
          localStorage.setItem('compareList', JSON.stringify(updatedList));
        }
      } else {
        alert('You can compare up to 3 studies at a time');
      }
    }
  };
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-cyan-500/10 bg-slate-950/70 p-6 shadow-[0_0_28px_rgba(15,60,130,0.25)]">
            <div className="mb-4 h-6 rounded bg-slate-700/60"></div>
            <div className="mb-2 h-4 rounded bg-slate-700/60"></div>
            <div className="mb-4 h-4 w-3/4 rounded bg-slate-700/60"></div>
            <div className="mb-2 h-4 rounded bg-slate-700/60"></div>
            <div className="h-4 w-1/2 rounded bg-slate-700/60"></div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="rounded-2xl border border-cyan-500/10 bg-slate-950/70 p-12 text-center shadow-[0_0_30px_rgba(20,80,150,0.3)]">
        <div className="mb-4 text-6xl text-cyan-200">🔍</div>
        <h3 className="mb-2 text-xl font-semibold text-slate-100">No results found</h3>
        <p className="mb-4 text-slate-300">
          Try adjusting your search terms or filters to find relevant studies.
        </p>
        <div className="text-sm text-cyan-100/80">
          <p>💡 <span className="font-semibold uppercase tracking-[0.25em]">Suggestions</span></p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-left text-slate-200">
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
      <div className="rounded-2xl border border-cyan-500/10 bg-slate-950/70 p-12 text-center shadow-[0_0_32px_rgba(20,80,150,0.3)]">
        <div className="mb-4 text-6xl text-cyan-200">🚀</div>
        <h3 className="mb-2 text-xl font-semibold text-slate-100">Ready to explore!</h3>
        <p className="text-slate-300">
          Search for NASA Space Biology research or use the filters to discover studies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-cyan-100">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </h3>
        <div className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Sorted by relevance
        </div>
      </div>

      {/* Result Cards */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <ResultCard 
            key={result.study.id} 
            result={result} 
            rank={index + 1}
            onAddToCompare={handleAddToCompare}
            isInCompareList={compareList.includes(result.study.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ 
  result, 
  rank, 
  onAddToCompare, 
  isInCompareList 
}: { 
  result: SearchResult; 
  rank: number;
  onAddToCompare: (studyId: number) => void;
  isInCompareList: boolean;
}) {
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
    <div className="overflow-hidden rounded-2xl border border-cyan-500/10 bg-slate-950/60 shadow-[0_0_32px_rgba(25,78,145,0.35)] transition hover:border-cyan-400/40 hover:shadow-[0_0_38px_rgba(59,130,246,0.35)]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
                #{rank}
              </span>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                {Math.round(relevance_score * 100)}% match
              </span>
              {study.year && (
                <span className="rounded-full border border-slate-500/40 bg-slate-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
                  {study.year}
                </span>
              )}
            </div>
            
            <h4 className="line-clamp-2 text-lg font-semibold text-slate-50">
              {study.title}
            </h4>
            
            {study.authors && (
              <p className="mb-2 text-sm text-slate-300">
                <strong>Authors:</strong> {study.authors}
              </p>
            )}
            
            {study.journal && (
              <p className="mb-3 text-sm text-slate-300">
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
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] ${
                chip.color === 'blue' ? 'border border-cyan-400/40 bg-cyan-500/15 text-cyan-100' :
                chip.color === 'green' ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-100' :
                chip.color === 'purple' ? 'border border-purple-400/40 bg-purple-500/15 text-purple-100' :
                'border border-slate-500/40 bg-slate-500/20 text-slate-200'
              }`}
            >
              {chip.label}
            </span>
          ))}
        </div>

        {/* Key Bullets */}
        {keyBullets.length > 0 && (
          <div className="mb-4">
            <h5 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Key Findings</h5>
            <ul className="space-y-2">
              {keyBullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                  <span className={bullet.highlight ? 'rounded border border-amber-400/40 bg-amber-300/10 px-2 py-1 text-amber-100' : ''}>
                    {bullet.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/paper/${study.id}`}
              className="rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
            >
              View Paper
            </Link>
            <button 
              onClick={() => onAddToCompare(study.id)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                isInCompareList 
                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100 hover:border-cyan-200/60 hover:text-white' 
                  : 'border-slate-500/40 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100'
              }`}
            >
              {isInCompareList ? 'Remove from Compare' : 'Add to Compare'}
            </button>
          </div>
          <div className="rounded-full border border-slate-500/30 bg-slate-800/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">
            PMCID: <span className="text-cyan-200">{study.pmcid}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
