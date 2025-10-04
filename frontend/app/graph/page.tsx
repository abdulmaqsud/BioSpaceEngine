'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import Link from 'next/link';
import KnowledgeGraph from '../../components/KnowledgeGraph';

type GraphEntity = {
  id: number;
  text: string;
  entity_type: string;
  study: number | null;
};

type GraphTriple = {
  id: number;
  subject: string;
  predicate: string;
  object: string;
};

export default function GraphPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<GraphEntity[]>([]);
  const [triples, setTriples] = useState<GraphTriple[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [entitiesData, triplesData] = await Promise.all([
        apiService.getEntities(),
        apiService.getTriples(),
      ]);

      const sanitizedEntities = entitiesData
        .filter((entity) => Boolean(entity.text || entity.name))
        .map<GraphEntity>((entity) => ({
          id: entity.id,
          text: entity.text ?? entity.name ?? `Entity-${entity.id}`,
          entity_type: entity.entity_type ?? 'unknown',
          study: entity.study ?? null,
        }));

      const sanitizedTriples = triplesData
        .filter((triple) => Boolean(triple.subject && triple.predicate && triple.object))
        .map<GraphTriple>((triple) => ({
          id: triple.id,
          subject: triple.subject || 'unknown_subject',
          predicate: triple.predicate || 'related_to',
          object: triple.object || 'unknown_object',
        }));

      setEntities(sanitizedEntities);
      setTriples(sanitizedTriples);
    } catch (err: unknown) {
      console.error('Error loading graph data:', err);
      setError('Failed to load graph data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-200"></div>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Rendering topology</p>
          <p className="text-base text-slate-100">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-rose-400/20 bg-slate-950/80 p-8 text-center shadow-[0_0_45px_rgba(251,113,133,0.28)]">
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-semibold text-slate-100">Error Loading Graph</h1>
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

  const entityTypeCounts = entities.reduce<Record<string, number>>((acc, entity) => {
    const key = entity.entity_type ?? 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const relationshipCounts = triples.reduce<Record<string, number>>((acc, triple) => {
    const key = triple.predicate || 'related_to';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const uniqueEntityTypes = Object.keys(entityTypeCounts).length;
  const uniqueStudiesWithEntities = new Set(
    entities.filter((entity) => entity.study !== null).map((entity) => entity.study as number),
  ).size;
  const relationshipTypes = Object.keys(relationshipCounts).length;
  const uniqueGraphEntities = new Set([
    ...triples.map((t) => t.subject),
    ...triples.map((t) => t.object),
  ]).size;

  const graphEntitiesForVisualization = entities.map((entity) => ({
    ...entity,
    study: entity.study ?? 0,
  }));

  return (
    <div className="relative min-h-screen pb-24 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(165,105,255,0.14),transparent_60%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.12),transparent_55%)]" aria-hidden />
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
                <span className="text-cyan-200">Knowledge Graph</span>
              </nav>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50">🕸️ Knowledge Graph Observatory</h1>
                <p className="max-w-2xl text-sm text-slate-300">
                  Navigate NASA Space Biology entities, relationships, and mission-linked insights in an interactive topology.
                </p>
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
          <div className="overflow-hidden rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(15,60,130,0.3)]">
            <KnowledgeGraph entities={graphEntitiesForVisualization} triples={triples} />
          </div>

          {/* Current Data Preview */}
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Entities Summary */}
            <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(59,130,246,0.28)]">
              <h3 className="mb-4 text-lg font-semibold text-cyan-100">Extracted Entities</h3>
              <div className="space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>Total Entities</span>
                  <span className="text-2xl font-semibold text-cyan-200">{entities.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Entity Types</span>
                  <span className="text-lg font-semibold text-slate-100">{uniqueEntityTypes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Studies with Entities</span>
                  <span className="text-lg font-semibold text-slate-100">{uniqueStudiesWithEntities}</span>
                </div>
              </div>

              {entities.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">Top Entity Types</h4>
                  <div className="space-y-2 text-sm text-slate-200">
                    {Object.entries(entityTypeCounts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span>{type}</span>
                          <span className="font-semibold text-cyan-100">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Triples Summary */}
            <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(34,197,94,0.28)]">
              <h3 className="mb-4 text-lg font-semibold text-cyan-100">Entity Relationships</h3>
              <div className="space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>Total Relationships</span>
                  <span className="text-2xl font-semibold text-emerald-200">{triples.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Relationship Types</span>
                  <span className="text-lg font-semibold text-slate-100">{relationshipTypes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unique Entities</span>
                  <span className="text-lg font-semibold text-slate-100">{uniqueGraphEntities}</span>
                </div>
              </div>

              {triples.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">Top Relationships</h4>
                  <div className="space-y-2 text-sm text-slate-200">
                    {Object.entries(relationshipCounts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([predicate, count]) => (
                        <div key={predicate} className="flex items-center justify-between">
                          <span>{predicate}</span>
                          <span className="font-semibold text-emerald-100">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sample Data */}
          {entities.length > 0 && (
            <div className="mt-10 rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_35px_rgba(15,60,130,0.3)]">
              <h3 className="mb-4 text-lg font-semibold text-cyan-100">Sample Entities</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {entities.slice(0, 9).map((entity) => (
                  <div
                    key={`${entity.id}-${entity.text}`}
                    className="rounded-xl border border-cyan-400/20 bg-slate-900/60 p-3 text-sm text-slate-200 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-cyan-100">{entity.text}</span>
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] uppercase tracking-[0.25em] text-cyan-100">
                        {entity.entity_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Study: {entity.study ?? 'N/A'}</p>
                  </div>
                ))}
              </div>
              {entities.length > 9 && (
                <p className="mt-4 text-center text-xs uppercase tracking-[0.25em] text-slate-400">
                  … plus {entities.length - 9} additional entities logged
                </p>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-cyan-400/10 bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-slate-300 sm:px-6 lg:px-8">
            <div>
              <h3 className="text-base font-semibold text-cyan-100">🚀 BioSpace Graph Observatory</h3>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">NASA space biology intelligence</p>
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
