'use client';

import Link from 'next/link';

export default function AboutPage() {
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
                <span className="text-cyan-200">About</span>
              </nav>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
                  ℹ️ About BioSpace Knowledge Engine
                </h1>
                <p className="max-w-2xl text-sm text-slate-300">
                  Methodology, transparency, and technical details
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/explore"
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
              >
                Search Studies
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-8">
            
            {/* Project Overview */}
            <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-8 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
              <h2 className="text-xl font-bold text-slate-50 mb-4">Project Overview</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-300 mb-4">
                  The BioSpace Knowledge Engine is an AI-powered platform for exploring and analyzing 
                  NASA Space Biology research. It provides researchers, students, and space enthusiasts 
                  with intelligent search, comparison, and insight capabilities across 608+ peer-reviewed 
                  studies.
                </p>
                <p className="text-slate-300">
                  Our mission is to make space biology research more accessible and discoverable, 
                  enabling faster scientific progress and better understanding of life in space.
                </p>
              </div>
            </div>

            {/* Data Sources */}
            <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-8 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
              <h2 className="text-xl font-bold text-slate-50 mb-4">Data Sources</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-200 font-bold">📚</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50">PubMed Central (PMC)</h3>
                    <p className="text-slate-300 text-sm">
                      608+ peer-reviewed NASA Space Biology studies with full-text access
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-200 font-bold">🔬</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50">Research Metadata</h3>
                    <p className="text-slate-300 text-sm">
                      Extracted authors, journals, publication years, and study characteristics
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-200 font-bold">🧬</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50">Scientific Entities</h3>
                    <p className="text-slate-300 text-sm">
                      AI-extracted biological entities, organisms, and research systems
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-8 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
              <h2 className="text-xl font-bold text-slate-50 mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-200 font-bold">1</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50">AI-Powered Search</h3>
                    <p className="text-slate-300 text-sm">
                      Our system understands the meaning behind your search queries, not just keywords. 
                      Find studies by concept, not just exact word matches.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-200 font-bold">2</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50">Smart Analysis</h3>
                    <p className="text-slate-300 text-sm">
                      We automatically extract key findings, identify research patterns, 
                      and highlight connections between studies.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-200 font-bold">3</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50">Research Insights</h3>
                    <p className="text-slate-300 text-sm">
                      Discover research gaps, emerging trends, and opportunities 
                      for future space biology research.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-8 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
              <h2 className="text-xl font-bold text-slate-50 mb-4">Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-50">🔍 Intelligent Search</h3>
                  <p className="text-slate-300 text-sm">
                    Semantic search across 608+ studies with natural language queries
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-50">📊 Research Insights</h3>
                  <p className="text-slate-300 text-sm">
                    Automated analysis of research patterns, trends, and gaps
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-50">🕸️ Knowledge Graph</h3>
                  <p className="text-slate-300 text-sm">
                    Interactive visualization of relationships between research concepts
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-50">⚖️ Study Comparison</h3>
                  <p className="text-slate-300 text-sm">
                    Side-by-side comparison of up to 3 studies with key findings
                  </p>
                </div>
              </div>
            </div>

            {/* Our Mission */}
            <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-8 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
              <h2 className="text-xl font-bold text-slate-50 mb-4">Our Mission</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-300 mb-4">
                  We believe that space biology research holds the key to understanding life beyond Earth 
                  and preparing for long-duration space missions. By making this knowledge more accessible 
                  and discoverable, we aim to accelerate scientific progress and inspire the next generation 
                  of space researchers.
                </p>
                <p className="text-slate-300">
                  Our platform serves researchers, students, educators, and space enthusiasts worldwide, 
                  providing them with powerful tools to explore, understand, and contribute to the field 
                  of space biology.
                </p>
              </div>
            </div>

            {/* Contact & Support */}
            <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-8 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
              <h2 className="text-xl font-bold text-slate-50 mb-4">Contact & Support</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <span className="text-cyan-200 font-bold">📧</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50">Questions or Feedback?</h3>
                    <p className="text-slate-300 text-sm">
                      We welcome your input to help improve the platform
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <span className="text-cyan-200 font-bold">🔧</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-50">Technical Issues</h3>
                    <p className="text-slate-300 text-sm">
                      Report bugs or technical problems through our support channels
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}