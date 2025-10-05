'use client';

import { FacetBucket, FacetsResponse } from '../../lib/api';

export type FacetKey =
  | 'organism'
  | 'exposure'
  | 'system'
  | 'year'
  | 'assay'
  | 'mission'
  | 'model_organism'
  | 'molecular';

export type DynamicFacetCounts = Partial<Record<FacetKey, Record<string, number>>>;

interface FacetFiltersProps {
  facets: FacetsResponse | null;
  selectedOrganism: string;
  selectedExposure: string;
  selectedSystem: string;
  selectedYear: string;
  selectedAssay: string;
  selectedMission: string;
  selectedModelOrganism: string;
  selectedMolecular: string;
  onFacetChange: (facetType: string, value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  dynamicCounts?: DynamicFacetCounts | null;
}

export default function FacetFilters({
  facets,
  selectedOrganism,
  selectedExposure,
  selectedSystem,
  selectedYear,
  selectedAssay,
  selectedMission,
  selectedModelOrganism,
  selectedMolecular,
  onFacetChange,
  onClearFilters,
  activeFiltersCount,
  dynamicCounts
}: FacetFiltersProps) {
  const useDynamic = !!dynamicCounts;

  // Helper to safely get dynamic counts for a facet key
  function getDynamicCount(key: FacetKey, name: string): number {
    const facetCounts = dynamicCounts?.[key as FacetKey];
    if (!facetCounts) return 0;
    return typeof facetCounts[name] === 'number' ? facetCounts[name] : 0;
  }
  const facetSections: Array<{
    title: string;
    key: FacetKey;
    selected: string;
    options: FacetBucket[];
  }> = [
    {
      title: 'Organism',
      key: 'organism',
      selected: selectedOrganism,
      options: facets?.organisms || []
    },
    {
      title: 'Exposure',
      key: 'exposure',
      selected: selectedExposure,
      options: facets?.exposures || []
    },
    {
      title: 'System',
      key: 'system',
      selected: selectedSystem,
      options: facets?.systems || []
    },
    {
      title: 'Model Organism',
      key: 'model_organism',
      selected: selectedModelOrganism,
      options: facets?.model_organisms || []
    },
    {
      title: 'Molecular Biology',
      key: 'molecular',
      selected: selectedMolecular,
      options: facets?.molecular || []
    },
    {
      title: 'Year',
      key: 'year',
      selected: selectedYear,
      options: facets?.years?.slice(0, 10) || []
    },
    {
      title: 'Assay',
      key: 'assay',
      selected: selectedAssay,
      options: facets?.assays || []
    },
    {
      title: 'Mission',
      key: 'mission',
      selected: selectedMission,
      options: facets?.missions || []
    }
  ];

  if (!facets) {
    return (
      <div className="overflow-hidden rounded-2xl border border-cyan-500/15 bg-slate-950/70 shadow-[0_0_38px_rgba(14,58,130,0.32)]">
        <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/60 px-6 py-5">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-100">Mission Filters</h3>
            <p className="mt-1 text-xs text-slate-300/80">Fine-tune your orbit by organism, exposure, mission profile, and more.</p>
          </div>
        </div>
        <div className="p-6 text-center text-slate-400">
          Loading filters...
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-500/15 bg-slate-950/70 shadow-[0_0_38px_rgba(14,58,130,0.32)]">
      <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/60 px-6 py-5">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-100">Mission Filters</h3>
          <p className="mt-1 text-xs text-slate-300/80">Fine-tune your orbit by organism, exposure, mission profile, and more.</p>
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-300/60 hover:text-white"
          >
            Reset ×{activeFiltersCount}
          </button>
        )}
      </div>

      <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/60">
        {facetSections.map((section) => (
          <div key={section.key}>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
                {section.title}
              </h4>
              <span className="rounded-full border border-cyan-500/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.25em] text-cyan-100">
                {useDynamic
                  ? section.options.reduce((total, option) => total + getDynamicCount(section.key, option.name), 0)
                  : section.options.length}
              </span>
            </div>
            <div className="space-y-2">
              {section.options.map((option) => (
                <label
                  key={option.name}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2 transition hover:border-cyan-400/40 hover:bg-cyan-500/5 ${
                    section.selected === option.name ? 'border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_16px_rgba(34,211,238,0.35)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={section.key}
                      value={option.name}
                      checked={section.selected === option.name}
                      onChange={(e) => onFacetChange(section.key, e.target.value)}
                      className="h-4 w-4 border-cyan-400/40 text-cyan-400 focus:ring-cyan-300"
                    />
                    <span className="text-sm text-slate-100">
                      {option.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-cyan-100/80">
                    {useDynamic
                      ? getDynamicCount(section.key, option.name)
                      : option.count}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="border-t border-white/5 bg-slate-900/70 px-6 py-6">
        <h4 className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">Mission Stats</h4>
        <div className="mt-4 space-y-3 text-sm text-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Total Studies</span>
            <span className="font-semibold text-cyan-100">{facets.total_studies}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Full Text</span>
            <span className="font-semibold text-emerald-200">571</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Abstract Only</span>
            <span className="font-semibold text-amber-200">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
