'use client';

import { useState, useEffect } from 'react';
import { apiService, FacetsResponse, FacetBucket } from '../../lib/api';
import Link from 'next/link';

interface ResearchIntensity {
  high: number;
  medium: number;
  low: number;
}

interface DominantTheme {
  name: string;
  count: number;
  percentage: number;
}

interface InsightSummary {
  totalStudies: number;
  topOrganisms: FacetBucket[];
  topSystems: FacetBucket[];
  topExposures: FacetBucket[];
  researchGaps: FacetBucket[];
  yearDistribution: FacetBucket[];
  recentYears: FacetBucket[];
  totalYears: number;
  totalJournals: number;
  researchIntensity: ResearchIntensity;
  dominantThemes: DominantTheme[];
  diversityScore: number;
  emergingAreas: FacetBucket[];
}

function generateInsights(facetsData: FacetsResponse): InsightSummary {
  const totalStudies = facetsData.organisms.reduce((sum, org) => sum + org.count, 0);

  const topOrganisms = [...facetsData.organisms]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topSystems = [...facetsData.systems]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topExposures = [...facetsData.exposures]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const researchGaps = [...facetsData.organisms]
    .filter((org) => org.count < 10)
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  const yearDistribution = [...facetsData.years]
    .sort((a, b) => parseInt(b.name, 10) - parseInt(a.name, 10))
    .slice(0, 10);

  const recentYears = [...facetsData.years]
    .filter((year) => parseInt(year.name, 10) >= 2020)
    .sort((a, b) => parseInt(b.name, 10) - parseInt(a.name, 10));

  const researchIntensity: ResearchIntensity = {
    high: topOrganisms.filter((org) => org.count > 50).length,
    medium: topOrganisms.filter((org) => org.count >= 20 && org.count <= 50).length,
    low: topOrganisms.filter((org) => org.count < 20).length,
  };

  const dominantThemes: DominantTheme[] = topSystems.slice(0, 3).map((system) => ({
    name: system.name,
    count: system.count,
    percentage: totalStudies > 0 ? Math.round((system.count / totalStudies) * 100) : 0,
  }));

  const distinctOrganisms = new Set(facetsData.organisms.map((org) => org.name)).size;
  const diversityScore = totalStudies > 0 ? Math.round((distinctOrganisms / totalStudies) * 100) : 0;

  const emergingAreas = [...facetsData.years]
    .filter((year) => parseInt(year.name, 10) >= 2022)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    totalStudies,
    topOrganisms,
    topSystems,
    topExposures,
    researchGaps,
    yearDistribution,
    recentYears,
    totalYears: facetsData.years.length,
    totalJournals: facetsData.journals.length,
    researchIntensity,
    dominantThemes,
    diversityScore,
    emergingAreas,
  };
}

export default function ConsensusPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const facetsData = await apiService.getFacets();
        const generatedInsights = generateInsights(facetsData);
        setInsights(generatedInsights);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error loading consensus data:', err);
        setError(`Failed to load data: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-200" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Generating insights</p>
          <p className="text-base text-slate-100">Analyzing research patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-rose-400/20 bg-slate-950/80 p-8 text-center shadow-[0_0_45px_rgba(251,113,133,0.28)]">
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-semibold text-slate-100">Error Loading Insights</h1>
          <p className="text-sm text-slate-300">{error}</p>
          <Link 
            href="/explore"
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-lg space-y-4 rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-10 text-center shadow-[0_0_45px_rgba(94,234,212,0.28)]">
          <div className="text-6xl text-cyan-200">📊</div>
          <h1 className="text-2xl font-semibold text-slate-100">No Insights Available</h1>
          <p className="text-sm text-slate-300">Unable to generate research insights at this time.</p>
          <Link 
            href="/explore"
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const recentStudyCount = insights.recentYears.reduce<number>((sum, year) => sum + year.count, 0);
  const topOrganismMax = insights.topOrganisms[0]?.count ?? 1;
  const topSystemMax = insights.topSystems[0]?.count ?? 1;

  return (
    <div className="relative min-h-screen pb-24 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(circle_at_85%_10%,rgba(168,85,247,0.14),transparent_60%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.12),transparent_55%)]" aria-hidden />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,7,18,0.92),rgba(15,23,42,0.88))]" aria-hidden />
      <div className="relative">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-cyan-400/20 bg-slate-950/70 backdrop-blur-lg">
          <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                <Link href="/explore" className="transition hover:text-cyan-200">
                  Search
                </Link>
                <span>›</span>
                <span className="text-cyan-200">Insights</span>
              </nav>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
                  � NASA Space Biology Research Insights
                </h1>
                <p className="max-w-2xl text-sm text-slate-300">
                  Patterns, trajectories, and mission gaps distilled from {insights.totalStudies} indexed studies.
                </p>
                <div className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
                  <p>📋 Data: study metadata &amp; semantic facets</p>
                  <p>🔍 Method: automated analytics &amp; anomaly detection</p>
                </div>
              </div>
            </div>
            <Link
              href="/explore"
              className="self-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
            >
              Search Studies
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          
          {/* Research Overview */}
          <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(15,60,130,0.3)]">
            <h2 className="mb-4 text-xl font-semibold text-cyan-100">Research Overview</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Total Studies</span>
                <span className="text-2xl font-semibold text-cyan-200">{insights.totalStudies}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Publication Years</span>
                <span className="text-lg font-semibold text-slate-100">{insights.totalYears}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Journals</span>
                <span className="text-lg font-semibold text-slate-100">{insights.totalJournals}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Recent Studies (2020+)</span>
                <span className="text-lg font-semibold text-emerald-200">
                  {recentStudyCount}
                </span>
              </div>
            </div>
          </div>

          {/* Top Research Areas */}
          <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(15,60,130,0.3)]">
            <h2 className="mb-4 text-xl font-semibold text-cyan-100">Top Research Areas</h2>
            <div className="space-y-3">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">Organisms</h3>
                <div className="space-y-2">
                  {insights.topOrganisms.map((org) => (
                    <div key={org.name} className="flex items-center justify-between text-sm text-slate-200">
                      <span>{org.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-slate-800/70">
                          <div 
                            className="h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]" 
                            style={{ width: `${(org.count / topOrganismMax) * 100}%` }}
                          ></div>
                        </div>
                        <span className="w-8 text-right text-sm font-semibold text-cyan-100">{org.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Research Systems */}
          <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(15,60,130,0.3)]">
            <h2 className="mb-4 text-xl font-semibold text-cyan-100">Research Systems</h2>
            <div className="space-y-3 text-sm text-slate-200">
              {insights.topSystems.map((system) => (
                <div key={system.name} className="flex items-center justify-between">
                  <span>{system.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-slate-800/70">
                      <div 
                        className="h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]" 
                        style={{ width: `${(system.count / topSystemMax) * 100}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-emerald-100">{system.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Gaps */}
          <div className="rounded-2xl border border-amber-400/20 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(251,191,36,0.25)]">
            <h2 className="mb-2 text-xl font-semibold text-amber-200">Research Gaps</h2>
            <p className="mb-4 text-xs uppercase tracking-[0.28em] text-amber-100/80">Areas with limited coverage</p>
            <div className="space-y-2 text-sm text-slate-200">
              {insights.researchGaps.map((gap) => (
                <div key={gap.name} className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-100">
                  <span>{gap.name}</span>
                  <span className="text-sm font-semibold">{gap.count} studies</span>
                </div>
              ))}
            </div>
          </div>

          {/* Publication Timeline */}
          <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(15,60,130,0.3)] lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-cyan-100">Publication Timeline</h2>
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-5">
              {insights.yearDistribution.map((year) => (
                <div key={year.name} className="rounded-xl border border-slate-500/20 bg-slate-900/60 p-3">
                  <div className="text-sm font-semibold text-cyan-100">{year.name}</div>
                  <div className="text-2xl font-bold text-cyan-200">{year.count}</div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">studies</div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Key Insights */}
          <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(15,60,130,0.3)] lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-cyan-100">Research Intelligence</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-slate-100 shadow-[0_0_30px_rgba(34,211,238,0.28)]">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100">Research Intensity</h3>
                <div className="space-y-2 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span>High Activity:</span>
                    <span className="font-medium">{insights.researchIntensity.high} areas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Medium Activity:</span>
                    <span className="font-medium">{insights.researchIntensity.medium} areas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Low Activity:</span>
                    <span className="font-medium">{insights.researchIntensity.low} areas</span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-slate-100 shadow-[0_0_30px_rgba(74,222,128,0.28)]">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-100">Dominant Themes</h3>
                <div className="space-y-2 text-sm">
                  {insights.dominantThemes.map((theme) => (
                    <div key={theme.name} className="flex items-center justify-between">
                      <span>{theme.name}:</span>
                      <span className="font-semibold text-emerald-100">{theme.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4 text-slate-100 shadow-[0_0_30px_rgba(168,85,247,0.28)]">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-purple-100">Research Diversity</h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-200">{insights.diversityScore}%</div>
                  <p className="text-xs uppercase tracking-[0.25em] text-purple-100/80">Diversity Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Research Opportunities */}
          <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(15,60,130,0.3)] lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-cyan-100">Research Opportunities</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-amber-200">Understudied Areas</h3>
                <div className="space-y-2 text-sm text-slate-200">
                  {insights.researchGaps.map((gap) => (
                    <div key={gap.name} className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-100">
                      <span>{gap.name}</span>
                      <span className="font-semibold">{gap.count} studies</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">Emerging Focus Areas</h3>
                <div className="space-y-2 text-sm text-slate-200">
                  {insights.emergingAreas.map((area) => (
                    <div key={area.name} className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">
                      <span>{area.name}</span>
                      <span className="font-semibold">{area.count} studies</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-cyan-400/10 bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-slate-300 sm:px-6 lg:px-8">
            <div>
              <h3 className="text-base font-semibold text-cyan-100">🚀 BioSpace Insight Lab</h3>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">NASA space biology intelligence</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link 
                href="/explore"
                className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
              >
                Search Studies
              </Link>
              <Link 
                href="/compare"
                className="rounded-full border border-slate-500/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-100"
              >
                Compare Deck
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
