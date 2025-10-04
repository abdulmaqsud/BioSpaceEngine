'use client';

interface CoverageMeterProps {
  totalStudies: number;
  fullTextCount: number;
  abstractOnlyCount: number;
  searchResultsCount: number;
}

export default function CoverageMeter({
  totalStudies,
  fullTextCount,
  abstractOnlyCount,
  searchResultsCount
}: CoverageMeterProps) {
  const fullTextPercentage = Math.round((fullTextCount / totalStudies) * 100);

  return (
    <div className="rounded-2xl border border-cyan-500/10 bg-slate-950/70 p-6 shadow-[0_0_30px_rgba(20,80,160,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            <span className="font-semibold text-emerald-200">
              {searchResultsCount} / {totalStudies} indexed
            </span>
          </div>

          <div className="flex items-center gap-2 text-cyan-100">
            <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            {fullTextCount} full-text
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-3 w-3 rounded-full bg-slate-500/80" />
            {abstractOnlyCount} abstract-only
          </div>
        </div>

        <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">
          {fullTextPercentage}% coverage
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800/70">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)] transition-all duration-500"
          style={{ width: `${fullTextPercentage}%` }}
        />
      </div>

      {/* Additional Info */}
      <div className="mt-4 text-xs text-slate-300">
        <p>
          <span className="font-semibold text-cyan-200">💡 Coverage:</span> {fullTextPercentage}% of studies include full-text data, unlocking deep-trace evidence and AI narrations.
        </p>
      </div>
    </div>
  );
}
