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

    } catch (err: unknown) {
      console.error('Error loading studies:', err);
      if (err instanceof Error) {
        setError(`Failed to load studies: ${err.message}`);
      } else {
        setError('Failed to load studies.');
      }
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_40px_rgba(34,211,238,0.35)]">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-200"></div>
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Processing</p>
          <p className="text-base text-slate-100">Loading studies for comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-rose-400/20 bg-slate-950/80 p-8 text-center shadow-[0_0_40px_rgba(244,114,182,0.28)]">
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-semibold text-slate-100">Error Loading Studies</h1>
          <p className="text-sm text-slate-300">{error}</p>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (studies.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-lg space-y-4 rounded-2xl border border-cyan-400/20 bg-slate-950/75 p-10 text-center shadow-[0_0_45px_rgba(56,189,248,0.28)]">
          <div className="text-6xl text-cyan-200">🔍</div>
          <h1 className="text-2xl font-semibold text-slate-100">No Studies to Compare</h1>
          <p className="text-sm text-slate-300">
            Add studies to your comparison deck from the search results or paper detail pages.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
          >
            Launch Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(14,165,233,0.16),transparent_55%),radial-gradient(circle_at_90%_10%,rgba(147,51,234,0.14),transparent_60%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.16),transparent_55%)]" aria-hidden />
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88))]" aria-hidden />
      <div className="relative">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-cyan-400/20 bg-slate-950/70 backdrop-blur-lg">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
            <div className="space-y-3">
              <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
                <Link href="/explore" className="transition hover:text-cyan-200">
                  Search
                </Link>
                <span>›</span>
                <span className="text-cyan-200">Compare</span>
              </nav>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
                  Comparative Mission Control
                </h1>
                <p className="text-sm text-slate-300">
                  Reviewing {studies.length} of 3 allowable studies side-by-side.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={clearAll}
                className="rounded-full border border-slate-500/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-100"
              >
                Clear All
              </button>
              <Link
                href="/explore"
                className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
              >
                Add More
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {studies.map((study, index) => (
            <div
              key={study.id}
              className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_32px_rgba(20,80,160,0.28)]"
            >
              {/* Study Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-100">
                      Study {index + 1}
                    </span>
                    {study.year && (
                      <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100">
                        {study.year}
                      </span>
                    )}
                  </div>
                  <h3 className="line-clamp-3 text-lg font-semibold text-slate-50">
                    {study.title}
                  </h3>
                </div>
                <button
                  onClick={() => removeStudy(study.id)}
                  className="ml-2 text-slate-500 transition hover:text-rose-300"
                  title="Remove from comparison"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Study Metadata */}
              <div className="mb-4 space-y-3 text-sm text-slate-300">
                {study.authors && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Authors</span>
                    <p className="line-clamp-2 text-slate-200">{study.authors}</p>
                  </div>
                )}
                {study.journal && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Journal</span>
                    <p className="text-slate-200">{study.journal}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">PMCID</span>
                  <a 
                    href={study.pmc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-sm text-cyan-200 transition hover:text-white"
                  >
                    {study.pmcid}
                  </a>
                </div>
              </div>

              {/* Abstract */}
              {study.abstract && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Abstract</h4>
                  <p className="line-clamp-4 text-sm text-slate-200/90">{study.abstract}</p>
                </div>
              )}

              {/* Key Findings */}
              <div className="mb-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Key Findings ({evidence[study.id]?.length || 0})
                </h4>
                <div className="space-y-2">
                  {evidence[study.id]?.slice(0, 3).map((evidenceItem, idx) => (
                    <div
                      key={evidenceItem.id}
                      className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-slate-100 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    >
                      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em]">
                        <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-cyan-100">
                          Finding {idx + 1}
                        </span>
                        <span className="text-slate-200/70">
                          {evidenceItem.char_start}-{evidenceItem.char_end}
                        </span>
                      </div>
                      <p className="line-clamp-3 text-xs text-slate-100/90">
                        {evidenceItem.sentence_text}
                      </p>
                    </div>
                  ))}
                  {evidence[study.id]?.length > 3 && (
                    <p className="text-center text-[11px] uppercase tracking-[0.2em] text-cyan-200/70">
                      +{evidence[study.id].length - 3} additional findings
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link 
                  href={`/paper/${study.id}`}
                  className="flex-1 rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
                >
                  View Details
                </Link>
                <a 
                  href={study.pmc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl border border-slate-500/40 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-100"
                >
                  View on PMC
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Summary */}
        {studies.length > 1 && (
          <div className="mt-10 rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_32px_rgba(45,212,191,0.2)]">
            <h2 className="mb-4 text-xl font-semibold text-cyan-100">Mission Summary Relay</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Publication Years</h3>
                <div className="space-y-2 text-sm text-slate-200">
                  {studies.map((study, index) => (
                    <div key={study.id} className="flex items-center justify-between">
                      <span>Study {index + 1}</span>
                      <span className="font-semibold text-cyan-100">{study.year || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Evidence Count</h3>
                <div className="space-y-2 text-sm text-slate-200">
                  {studies.map((study, index) => (
                    <div key={study.id} className="flex items-center justify-between">
                      <span>Study {index + 1}</span>
                      <span className="font-semibold text-emerald-200">{evidence[study.id]?.length || 0} findings</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Journals</h3>
                <div className="space-y-2 text-sm text-slate-200">
                  {studies.map((study, index) => (
                    <div key={study.id} className="flex items-center justify-between gap-3">
                      <span>Study {index + 1}</span>
                      <span className="line-clamp-1 text-right text-cyan-100">
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
        <footer className="mt-16 border-t border-cyan-400/10 bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-slate-300 sm:px-6 lg:px-8">
            <div>
              <h3 className="text-base font-semibold text-cyan-100">🚀 BioSpace Comparison Deck</h3>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">NASA space biology intelligence</p>
            </div>
            <Link
              href="/explore"
              className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
            >
              Return to Search
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
