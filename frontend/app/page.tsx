"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Beaker,
  BrainCircuit,
  Globe2,
  Rocket,
  Sparkles,
  Telescope,
} from "lucide-react";

const maximumQueryLength = 120;

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const progressHighlights = useMemo(
    () => [
      {
        title: "Microgravity Cellular Insights",
        description:
          "Over 570 curated studies mapping gene expression, immunity response, and plant adaptation in low-gravity environments.",
        metric: "572 indexed studies",
      },
      {
        title: "Mission-Ready Knowledge Graph",
        description:
          "Evidence sentences and entity links unify findings across NASA missions from ISS to Artemis precursor campaigns.",
        metric: "31k relationships",
      },
      {
        title: "AI-Powered Evidence Extraction",
        description:
          "Sentence-level claims surface critical biological effects, accelerating literature reviews by weeks.",
        metric: "42k evidence points",
      },
    ],
    [],
  );

  const researchGaps = useMemo(
    () => [
      {
        area: "Long-duration immune response",
        detail: "Sparse longitudinal datasets beyond six months impede risk modeling for Mars-class missions.",
        priority: "High",
      },
      {
        area: "Lunar regolith exposure",
        detail: "Few controlled biology experiments incorporate regolith simulants under partial gravity.",
        priority: "Emerging",
      },
      {
        area: "Cross-species transfer learning",
        detail: "Limited models convert plant stress adaptations into human biomarker predictions.",
        priority: "Opportunity",
      },
    ],
    [],
  );

  const missionVectors = useMemo(
    () => [
      {
        label: "Habitat engineering",
        description:
          "Radiation, atmosphere, and nutrient cycles inform shielded habitats and closed-loop bioregenerative systems.",
        impact: "Artemis Base Camp",
      },
      {
        label: "Crew health",
        description:
          "Microbiome drift, musculoskeletal atrophy, and immune suppression map to countermeasure portfolios.",
        impact: "Mars 2033",
      },
      {
        label: "Crop resilience",
        description:
          "Optimized plant cultivars maintain yield in low gravity—critical for lunar greenhouses and deep-space logistics.",
        impact: "Lunar Gateway",
      },
    ],
    [],
  );

  const audiences = useMemo(
    () => [
      {
        title: "Scientists",
        body: "Spot under explored variables, download structured evidence, and launch new hypotheses in minutes.",
        icon: <Beaker className="h-5 w-5 text-emerald-300" aria-hidden />,
      },
      {
        title: "Mission architects",
        body: "Stress-test scenarios for lunar and Martian missions with biology-backed risk intelligence.",
        icon: <Globe2 className="h-5 w-5 text-sky-300" aria-hidden />,
      },
      {
        title: "Leaders & Investors",
        body: "Surface funding gaps and high-leverage biology programs ready for scale up.",
        icon: <BrainCircuit className="h-5 w-5 text-fuchsia-300" aria-hidden />,
      },
    ],
    [],
  );

  const suggestedQueries = useMemo(
    () => ["microgravity bone regeneration", "plant phototropism space", "immune response lunar mission"], []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim().slice(0, maximumQueryLength);
    if (trimmedQuery.length === 0) {
      router.push("/explore");
      return;
    }
    const params = new URLSearchParams({ q: trimmedQuery });
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-500/40 via-cyan-400/20 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-gradient-to-tl from-fuchsia-500/30 via-purple-500/10 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/10 bg-cyan-500/5 blur-2xl" />
        <div className="absolute left-16 top-1/3 h-24 w-24 rounded-full border border-cyan-400/20 bg-slate-900/80 shadow-[0_0_35px_rgba(34,211,238,0.25)]" />
        <div className="absolute right-32 top-24 h-16 w-16 rounded-full border border-fuchsia-400/30 bg-slate-900/70 shadow-[0_0_35px_rgba(232,121,249,0.25)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-24 sm:px-6 lg:px-8">
        <header className="flex flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-3 rounded-full border border-cyan-400/30 bg-slate-900/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200">
            <Sparkles className="h-4 w-4" aria-hidden />
            BioSpace Knowledge Engine
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
            Space biology intelligence for lunar and Martian mission readiness.
          </h1>
          <p className="max-w-2xl text-pretty text-base text-slate-300 sm:text-lg">
            Navigate curated NASA studies, evidence sentences, and entity-level insights to accelerate discovery and
            mission design.
          </p>

          <form onSubmit={handleSubmit} className="relative mt-6 w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-2 shadow-[0_0_40px_rgba(21,94,239,0.25)] backdrop-blur">
            <div className="flex items-center gap-3 rounded-xl bg-slate-900/70 px-4 py-3">
              <Telescope className="h-5 w-5 text-cyan-200" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search biology insights: microgravity immunity, plant genomics, lunar regolith..."
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                maxLength={maximumQueryLength}
                aria-label="Search space biology intelligence"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100 transition hover:border-cyan-200/70 hover:text-white"
              >
                Launch
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 px-4 pb-2 text-xs text-slate-400">
              <span className="uppercase tracking-[0.25em] text-slate-500">Suggestions:</span>
              {suggestedQueries.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-cyan-100 transition hover:border-cyan-200/50 hover:text-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-10 flex flex-col items-center gap-3 text-sm text-slate-400">
            <span className="uppercase tracking-[0.3em] text-slate-500">Trusted by NASA research teams</span>
            <div className="flex items-center gap-6 text-xs uppercase tracking-[0.35em] text-slate-500">
              <span className="rounded-full border border-cyan-400/20 px-3 py-1 text-cyan-100/80">ISS</span>
              <span className="rounded-full border border-cyan-400/20 px-3 py-1 text-cyan-100/80">Artemis</span>
              <span className="rounded-full border border-cyan-400/20 px-3 py-1 text-cyan-100/80">Gateway</span>
              <span className="rounded-full border border-cyan-400/20 px-3 py-1 text-cyan-100/80">Deep Space</span>
            </div>
          </div>
        </header>

        <section className="mt-24 space-y-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50">What have we learned so far?</h2>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200 transition hover:text-white"
            >
              Dive into the atlas
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {progressHighlights.map((item) => (
              <article
                key={item.title}
                className="group relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-slate-950/60 p-6 shadow-[0_0_30px_rgba(12,74,110,0.35)] transition hover:border-cyan-300/35 hover:shadow-[0_0_45px_rgba(34,211,238,0.35)]"
              >
                <div className="absolute -right-10 top-8 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent blur-xl transition group-hover:scale-125" aria-hidden />
                <div className="relative space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-100">
                    <Rocket className="h-4 w-4" aria-hidden />
                    Breakthrough
                  </div>
                  <h3 className="text-lg font-semibold text-slate-50">{item.title}</h3>
                  <p className="text-sm text-slate-300">{item.description}</p>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">{item.metric}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 space-y-8">
          <div className="flex flex-col gap-3 text-center">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-fuchsia-100">
              <Telescope className="h-4 w-4" aria-hidden />
              Unmapped Territory
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50">Where do we still need answers?</h2>
            <p className="mx-auto max-w-3xl text-sm text-slate-300">
              Target upcoming investigations by visualizing biology domains with limited coverage or conflicting evidence.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {researchGaps.map((item) => (
              <article
                key={item.area}
                className="rounded-3xl border border-fuchsia-400/15 bg-slate-950/60 p-6 shadow-[0_0_30px_rgba(134,25,143,0.35)] backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-200">{item.priority}</p>
                <h3 className="mt-3 text-lg font-semibold text-slate-50">{item.area}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                <Link
                  href="/explore"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-100 transition hover:text-white"
                >
                  Review studies
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 space-y-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-100">
              <Globe2 className="h-4 w-4" aria-hidden />
              Mission Impact
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50">
              How biology shapes lunar and Martian campaigns
            </h2>
            <p className="max-w-3xl text-sm text-slate-300">
              Connect biological stressors to flight-readiness decisions, habitat architectures, and countermeasure roadmaps.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {missionVectors.map((item) => (
              <article
                key={item.label}
                className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-slate-950/60 p-6 shadow-[0_0_30px_rgba(4,120,87,0.35)]"
              >
                <div className="absolute -bottom-10 right-0 h-40 w-40 rounded-full bg-gradient-to-tr from-emerald-500/20 to-transparent blur-xl" aria-hidden />
                <div className="relative space-y-4">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-emerald-200">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {item.impact}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-50">{item.label}</h3>
                  <p className="text-sm text-slate-300">{item.description}</p>
                  <Link
                    href="/graph"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:text-white"
                  >
                    Explore knowledge graph
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 space-y-8">
          <div className="flex flex-col gap-3 text-center">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-100">
              <Rocket className="h-4 w-4" aria-hidden />
              Designed for Impact
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50">A tailored lens for every stakeholder</h2>
            <p className="mx-auto max-w-3xl text-sm text-slate-300">
              Whether you are designing missions, funding programs, or shaping experiments, BioSpace adapts to your
              workflow.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {audiences.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-cyan-400/15 bg-slate-950/60 p-6 shadow-[0_0_30px_rgba(30,64,175,0.35)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-slate-900/70">
                    {item.icon}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-50">{item.title}</h3>
                </div>
                <p className="mt-4 text-sm text-slate-300">{item.body}</p>
                <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-slate-500">
                  <span className="h-[1px] w-10 bg-cyan-400/40" aria-hidden />
                  Tailored Views
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-24 flex flex-col items-center gap-6 rounded-3xl border border-cyan-400/20 bg-slate-950/60 p-8 text-center shadow-[0_0_40px_rgba(10,102,194,0.35)]">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">
            <Sparkles className="h-4 w-4" aria-hidden />
            Ready for launch?
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50">
            Start exploring the BioSpace knowledge atlas.
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Jump into mission-aligned datasets, build comparison decks, and surface intelligence that drives the next
            decade of space biology breakthroughs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100 transition hover:border-cyan-200/70 hover:text-white"
            >
              Enter Explore
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-900/70 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-slate-300/60 hover:text-white"
            >
              Build a compare deck
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}