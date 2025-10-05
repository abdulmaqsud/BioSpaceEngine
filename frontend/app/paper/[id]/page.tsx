'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  apiService,
  Study,
  EvidenceSentence,
  Section,
} from '../../../lib/api';

type TabKey = 'overview' | 'evidence' | 'entities';

type StudyEntity = {
  id: number;
  text: string;
  entity_type: string;
  start_char: number | null;
  end_char: number | null;
};

export default function PaperDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawStudyId = params?.id;
  const studyId = Array.isArray(rawStudyId) ? rawStudyId[0] : rawStudyId;

  const [study, setStudy] = useState<Study | null>(null);
  const [evidence, setEvidence] = useState<EvidenceSentence[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [entities, setEntities] = useState<StudyEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [compareList, setCompareList] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedCompare = window.localStorage.getItem('compareList');
    if (storedCompare) {
      try {
        const parsed = JSON.parse(storedCompare);
        if (Array.isArray(parsed)) {
          setCompareList(parsed.filter((value): value is number => typeof value === 'number'));
        }
      } catch (err) {
        console.warn('Failed to parse compare list from local storage', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!studyId) {
      setError('Missing study identifier.');
      setLoading(false);
      return;
    }

    const loadStudy = async () => {
      try {
        setLoading(true);

        const [studyData, evidenceData, sectionsData, rawEntities] = await Promise.all([
          apiService.getStudy(studyId),
          apiService.getStudyEvidence(studyId),
          apiService.getStudySections(studyId),
          apiService.getEntities({ study: studyId }),
        ]);

        setStudy(studyData);
        setEvidence(evidenceData ?? []);
        setSections(sectionsData ?? []);
        const normalizedEntities = (rawEntities ?? [])
          .filter((entity) => Boolean(entity.text ?? entity.name))
          .map<StudyEntity>((entity) => ({
            id: entity.id,
            text: entity.text ?? entity.name ?? `Entity-${entity.id}`,
            entity_type: entity.entity_type ?? 'unknown',
            start_char: entity.start_char ?? null,
            end_char: entity.end_char ?? null,
          }));
        setEntities(normalizedEntities);
        setError(null);
      } catch (err) {
        console.error('Error loading study data:', err);
        setError('Failed to load study intelligence.');
      } finally {
        setLoading(false);
      }
    };

    loadStudy();
  }, [studyId]);

  const isInCompareList = study ? compareList.includes(study.id) : false;

  const evidenceHighlights = useMemo(() => evidence.slice(0, 3), [evidence]);
  const sectionHighlights = useMemo(() => sections.slice(0, 4), [sections]);

  const uniqueEntityTypes = useMemo(
    () => new Set(entities.map((entity) => entity.entity_type)).size,
    [entities],
  );

  const readingTimeMinutes = useMemo(() => {
    if (!study?.abstract) {
      return null;
    }
    const wordCount = study.abstract.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [study?.abstract]);

  const handleToggleCompare = () => {
    if (!study) {
      return;
    }

    setCompareList((prev) => {
      if (prev.includes(study.id)) {
        const next = prev.filter((id) => id !== study.id);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('compareList', JSON.stringify(next));
        }
        return next;
      }

      if (prev.length >= 3) {
        window.alert('You can compare up to 3 studies at a time.');
        return prev;
      }

      const next = [...prev, study.id];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('compareList', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleExportCitation = async () => {
    if (!study) {
      return;
    }
    const citation = `${study.authors || 'Unknown Authors'}. ${study.title}. ${study.journal || 'Unknown Journal'}. ${study.year || 'Unknown Year'}.`;
    try {
      await navigator.clipboard.writeText(citation);
      window.alert('Citation copied to clipboard.');
    } catch (err) {
      console.error('Failed to copy citation:', err);
      window.alert('Unable to copy citation. Please copy manually.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-200" />
          </div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Initializing dossier</p>
          <p className="text-base text-slate-200">Retrieving study intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-full max-w-lg space-y-5 rounded-3xl border border-rose-400/20 bg-slate-950/80 p-8 text-center shadow-[0_0_45px_rgba(251,113,133,0.28)]">
          <div className="text-5xl">🛰️</div>
          <h1 className="text-2xl font-semibold text-slate-50">Signal Lost</h1>
          <p className="text-sm text-slate-300">{error ?? 'The requested study could not be located.'}</p>
          {studyId && (
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">ID: {studyId}</p>
          )}
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
          >
            Return to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-28 text-slate-100">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,197,94,0.15),transparent_55%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(165,105,255,0.18),transparent_60%)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,7,18,0.95),rgba(15,23,42,0.9))]" aria-hidden />
      <div className="relative">
        <header className="border-b border-cyan-400/15 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                <Link href="/explore" className="transition hover:text-cyan-200">
                  Search
                </Link>
                <span>›</span>
                <span className="text-cyan-200">Paper Analysis</span>
              </nav>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
                  {study.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  {study.authors && (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-100">
                      {study.authors.split(';')[0]}
                    </span>
                  )}
                  {study.journal && <span>{study.journal}</span>}
                  {study.year && (
                    <span className="rounded-full border border-slate-500/40 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-200">
                      {study.year}
                    </span>
                  )}
                  <a
                    href={study.pmc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-200 transition hover:text-white"
                  >
                    PMCID {study.pmcid}
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleToggleCompare}
                className={`rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                  isInCompareList
                    ? 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-100 hover:border-emerald-200/70 hover:text-white'
                    : 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-100 hover:border-cyan-200/60 hover:text-white'
                }`}
              >
                {isInCompareList ? 'Remove from Compare' : 'Add to Compare'}
              </button>
              <button
                onClick={handleExportCitation}
                className="rounded-full border border-slate-500/40 px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200 transition hover:border-slate-300/60 hover:text-white"
              >
                Export Citation
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-cyan-400/15 bg-slate-950/70 p-8 shadow-[0_0_40px_rgba(15,60,130,0.35)]">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6">
                  <h2 className="text-lg font-semibold text-cyan-100">Study Synopsis</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {study.abstract
                      ? study.abstract
                      : 'Abstract forthcoming. This NASA space biology study contributes new insights into microgravity-driven responses across biological systems.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Evidence Sentences</p>
                    <p className="mt-2 text-3xl font-semibold text-cyan-100">{evidence.length}</p>
                    <p className="mt-1 text-xs text-slate-400">Key findings extracted by the BioSpace engine</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Entity Types</p>
                    <p className="mt-2 text-3xl font-semibold text-cyan-100">{uniqueEntityTypes}</p>
                    <p className="mt-1 text-xs text-slate-400">Distinct biological concepts detected</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Document Sections</p>
                    <p className="mt-2 text-3xl font-semibold text-cyan-100">{sections.length}</p>
                    <p className="mt-1 text-xs text-slate-400">Structured segments available for context</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Reading Time</p>
                    <p className="mt-2 text-3xl font-semibold text-cyan-100">
                      {readingTimeMinutes ? `${readingTimeMinutes} min` : '—'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Approximate review duration</p>
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Mission Tags</h3>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em]">
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                      NASA
                    </span>
                    <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-fuchsia-100">
                      Space Biology
                    </span>
                    {study.title.toLowerCase().includes('microgravity') && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                        Microgravity
                      </span>
                    )}
                    {study.title.toLowerCase().includes('immune') && (
                      <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                        Immunology
                      </span>
                    )}
                    {study.title.toLowerCase().includes('plant') && (
                      <span className="rounded-full border border-lime-400/30 bg-lime-500/10 px-3 py-1 text-lime-100">
                        Plant Systems
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Top Sections</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    {sectionHighlights.length > 0 ? (
                      sectionHighlights.map((section => (
                        <div key={section.id} className="rounded-xl border border-cyan-400/10 bg-slate-950/60 p-3">
                          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">{section.section_type}</p>
                          {section.title && <p className="mt-1 font-medium text-slate-100">{section.title}</p>}
                          {section.content && (
                            <p className="mt-2 text-xs leading-relaxed text-slate-300 line-clamp-3">
                              {section.content.substring(0, 200)}...
                            </p>
                          )}
                        </div>
                      )))
                    ) : (
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Section metadata pending ingestion
                      </p>
                    )}
                  </div>
                </div>

                {compareList.length > 0 && (
                  <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6 text-sm text-slate-300">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Mission Deck</h3>
                    <p className="mt-3 text-xs text-slate-400">
                      {compareList.length} study{compareList.length > 1 ? 'ies' : ''} staged for comparison.
                    </p>
                    <Link
                      href="/compare"
                      className="mt-4 inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
                    >
                      Launch Compare
                    </Link>
                  </div>
                )}
              </aside>
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-cyan-400/15 bg-slate-950/70 p-6 shadow-[0_0_40px_rgba(59,130,246,0.25)]">
            <nav className="flex flex-wrap gap-3 border-b border-cyan-400/10 pb-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              {(['overview', 'evidence', 'entities'] as TabKey[]).map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`rounded-full px-4 py-2 transition ${
                    activeTab === tabKey
                      ? 'border border-cyan-400/60 bg-cyan-500/20 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                      : 'border border-transparent text-slate-400 hover:border-cyan-400/30 hover:text-cyan-100'
                  }`}
                >
                  {tabKey === 'overview' && 'Overview'}
                  {tabKey === 'evidence' && `Evidence (${evidence.length})`}
                  {tabKey === 'entities' && `Entities (${entities.length})`}
                </button>
              ))}
            </nav>

            <div className="mt-6">
              {activeTab === 'overview' && (
                <div className="space-y-6 text-sm text-slate-200">
                  <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Research Overview</h3>
                    <p className="mt-3 leading-relaxed text-slate-300">
                      <strong>Study Title:</strong> {study.title}
                    </p>
                    {study.abstract ? (
                      <div className="mt-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200 mb-2">Abstract</p>
                        <p className="leading-relaxed text-slate-300">{study.abstract}</p>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200 mb-2">Abstract</p>
                        <p className="leading-relaxed text-slate-400 italic">Abstract not available for this study.</p>
                      </div>
                    )}
                    {evidenceHighlights.length > 0 && (
                      <ul className="mt-4 space-y-3">
                        {evidenceHighlights.map((item, index) => (
                          <li
                            key={item.id}
                            className="rounded-xl border border-cyan-400/10 bg-slate-950/60 p-4 text-sm text-slate-200"
                          >
                            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Finding #{index + 1}</p>
                            <p className="mt-2 text-slate-100">{item.sentence_text}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Research Metadata</h3>
                      <dl className="mt-4 space-y-3 text-xs text-slate-300">
                        <div className="flex justify-between border-b border-slate-700/40 pb-2">
                          <dt>Publication Year</dt>
                          <dd className="text-cyan-100">{study.year ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-700/40 pb-2">
                          <dt>Journal</dt>
                          <dd className="text-cyan-100">{study.journal ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-700/40 pb-2">
                          <dt>PMCID</dt>
                          <dd className="text-cyan-100">{study.pmcid}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Evidence Coverage</dt>
                          <dd className="text-cyan-100">{evidence.length} findings</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Section Overview</h3>
                      {sectionHighlights.length > 0 ? (
                        <ul className="mt-4 space-y-3 text-xs text-slate-300">
                          {sectionHighlights.map((section) => (
                            <li key={section.id} className="flex flex-col rounded-xl border border-cyan-400/10 bg-slate-950/60 p-3">
                              <span className="text-cyan-100">{section.section_type}</span>
                              {section.title && <span className="mt-1 text-slate-200">{section.title}</span>}
                              {section.content && (
                                <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-2">
                                  {section.content.substring(0, 150)}...
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">
                          Section breakdown is being prepared.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  {evidence.length > 0 ? (
                    evidence.map((item, index) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-5 text-sm text-slate-200 shadow-[0_0_25px_rgba(34,211,238,0.18)]"
                      >
                        <header className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.28em] text-cyan-200/80">
                          <span>Finding #{index + 1}</span>
                          <span>
                            Position: {item.char_start ?? '—'}-{item.char_end ?? '—'}
                          </span>
                        </header>
                        <p className="leading-relaxed text-slate-100">{item.sentence_text}</p>
                        <footer className="mt-3 text-[11px] uppercase tracking-[0.28em] text-slate-500">
                          Sentence Index: {item.sentence_index}
                        </footer>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
                      <p className="text-3xl text-cyan-200">🔍</p>
                      <p className="mt-2 uppercase tracking-[0.25em]">
                        Evidence extraction underway – check back soon.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'entities' && (
                <div className="space-y-4">
                  {entities.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {entities.map((entity) => (
                        <div
                          key={entity.id}
                          className="rounded-2xl border border-cyan-400/15 bg-slate-900/60 p-4 text-sm text-slate-200 shadow-[0_0_20px_rgba(165,105,255,0.2)]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-cyan-100">{entity.text}</span>
                            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] uppercase tracking-[0.25em] text-cyan-100">
                              {entity.entity_type}
                            </span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                            Span: {entity.start_char ?? '—'}–{entity.end_char ?? '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
                      <p className="text-3xl text-cyan-200">🧬</p>
                      <p className="mt-2 uppercase tracking-[0.25em]">Entity extraction is being processed.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="mt-12 border-t border-cyan-400/10 bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-slate-300 sm:px-6 lg:px-8">
            <div>
              <h3 className="text-base font-semibold text-cyan-100">🚀 BioSpace Knowledge Engine</h3>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                NASA space biology intelligence hub
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/explore"
                className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
              >
                Back to Search
              </Link>
              {compareList.length > 0 && (
                <Link
                  href="/compare"
                  className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:border-emerald-200/60 hover:text-white"
                >
                  Compare Deck ({compareList.length})
                </Link>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
