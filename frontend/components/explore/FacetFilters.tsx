'use client';

import { FacetsResponse } from '../../lib/api';

interface FacetFiltersProps {
  facets: FacetsResponse | null;
  selectedOrganism: string;
  selectedExposure: string;
  selectedSystem: string;
  selectedYear: string;
  selectedAssay: string;
  selectedMission: string;
  onFacetChange: (facetType: string, value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export default function FacetFilters({
  facets,
  selectedOrganism,
  selectedExposure,
  selectedSystem,
  selectedYear,
  selectedAssay,
  selectedMission,
  onFacetChange,
  onClearFilters,
  activeFiltersCount
}: FacetFiltersProps) {
  const facetSections = [
    {
      title: 'Organism',
      key: 'organism',
      selected: selectedOrganism,
      options: [
        { name: 'Human', count: 245 },
        { name: 'Mouse', count: 189 },
        { name: 'Rat', count: 67 },
        { name: 'Plant', count: 89 },
        { name: 'Bacteria', count: 34 },
        { name: 'Other', count: 28 }
      ]
    },
    {
      title: 'Exposure',
      key: 'exposure',
      selected: selectedExposure,
      options: [
        { name: 'Microgravity', count: 312 },
        { name: 'Radiation', count: 156 },
        { name: 'Isolation', count: 89 },
        { name: 'Hypoxia', count: 45 },
        { name: 'Other', count: 78 }
      ]
    },
    {
      title: 'System',
      key: 'system',
      selected: selectedSystem,
      options: [
        { name: 'Bone', count: 134 },
        { name: 'Muscle', count: 98 },
        { name: 'Cardiovascular', count: 76 },
        { name: 'Immune', count: 54 },
        { name: 'Neurological', count: 43 },
        { name: 'Plant Root', count: 67 },
        { name: 'Other', count: 89 }
      ]
    },
    {
      title: 'Year',
      key: 'year',
      selected: selectedYear,
      options: facets?.years?.slice(0, 10) || [
        { name: '2023', count: 45 },
        { name: '2022', count: 38 },
        { name: '2021', count: 42 },
        { name: '2020', count: 35 },
        { name: '2019', count: 28 }
      ]
    },
    {
      title: 'Assay',
      key: 'assay',
      selected: selectedAssay,
      options: [
        { name: 'Microscopy', count: 156 },
        { name: 'PCR', count: 89 },
        { name: 'Western Blot', count: 67 },
        { name: 'Flow Cytometry', count: 45 },
        { name: 'ELISA', count: 34 },
        { name: 'Other', count: 89 }
      ]
    },
    {
      title: 'Mission',
      key: 'mission',
      selected: selectedMission,
      options: [
        { name: 'ISS', count: 234 },
        { name: 'Space Shuttle', count: 89 },
        { name: 'Ground Control', count: 156 },
        { name: 'Parabolic Flight', count: 45 },
        { name: 'Other', count: 48 }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all ({activeFiltersCount})
          </button>
        )}
      </div>

      <div className="space-y-6">
        {facetSections.map((section) => (
          <div key={section.key}>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {section.title}
            </h4>
            <div className="space-y-2">
              {section.options.map((option) => (
                <label
                  key={option.name}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name={section.key}
                      value={option.name}
                      checked={section.selected === option.name}
                      onChange={(e) => onFacetChange(section.key, e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      {option.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {option.count}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total Studies:</span>
            <span className="font-medium">572</span>
          </div>
          <div className="flex justify-between">
            <span>Full Text:</span>
            <span className="font-medium">571</span>
          </div>
          <div className="flex justify-between">
            <span>Abstract Only:</span>
            <span className="font-medium">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
