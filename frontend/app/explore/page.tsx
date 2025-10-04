'use client';

import { useState, useEffect } from 'react';
import { apiService, Study, SearchResult, FacetsResponse } from '../../lib/api';
import SearchBar from '../../components/explore/SearchBar';
import FacetFilters from '../../components/explore/FacetFilters';
import ResultCards from '../../components/explore/ResultCards';
import CoverageMeter from '../../components/explore/CoverageMeter';
import ClientOnly from '../../components/ClientOnly';
import Link from 'next/link';

export default function ExplorePage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [totalStudies, setTotalStudies] = useState(572);
  const [fullTextCount, setFullTextCount] = useState(571);
  const [abstractOnlyCount, setAbstractOnlyCount] = useState(1);
  
  // Facet filter states
  const [selectedOrganism, setSelectedOrganism] = useState<string>('');
  const [selectedExposure, setSelectedExposure] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedAssay, setSelectedAssay] = useState<string>('');
  const [selectedMission, setSelectedMission] = useState<string>('');
  const [selectedModelOrganism, setSelectedModelOrganism] = useState<string>('');
  const [selectedMolecular, setSelectedMolecular] = useState<string>('');

  useEffect(() => {
    loadFacets();
  }, []);

  const loadFacets = async () => {
    try {
      const response = await apiService.getFacets();
      setFacets(response);
    } catch (error) {
      console.error('Failed to load facets:', error);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setLoading(true);
    
    try {
      const filters = {
        organism: selectedOrganism,
        exposure: selectedExposure,
        system: selectedSystem,
        year: selectedYear,
        assay: selectedAssay,
        mission: selectedMission,
        model_organism: selectedModelOrganism,
        molecular: selectedMolecular,
      };
      
      const response = await apiService.searchStudies(searchQuery, 50, 0.3, filters);
      setSearchResults(response.results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFacetChange = (facetType: string, value: string) => {
    switch (facetType) {
      case 'organism':
        setSelectedOrganism(value);
        break;
      case 'exposure':
        setSelectedExposure(value);
        break;
      case 'system':
        setSelectedSystem(value);
        break;
      case 'year':
        setSelectedYear(value);
        break;
      case 'assay':
        setSelectedAssay(value);
        break;
      case 'mission':
        setSelectedMission(value);
        break;
      case 'model_organism':
        setSelectedModelOrganism(value);
        break;
      case 'molecular':
        setSelectedMolecular(value);
        break;
    }
    
    // Auto-search when filters change
    if (query) {
      handleSearch(query);
    }
  };

  const clearFilters = () => {
    setSelectedOrganism('');
    setSelectedExposure('');
    setSelectedSystem('');
    setSelectedYear('');
    setSelectedAssay('');
    setSelectedMission('');
    setSelectedModelOrganism('');
    setSelectedMolecular('');
    
    // Re-search with cleared filters
    if (query) {
      handleSearch(query);
    }
  };

  const removeFilter = (filterValue: string) => {
    // Remove specific filter by value
    if (selectedOrganism === filterValue) {
      setSelectedOrganism('');
    } else if (selectedExposure === filterValue) {
      setSelectedExposure('');
    } else if (selectedSystem === filterValue) {
      setSelectedSystem('');
    } else if (selectedYear === filterValue) {
      setSelectedYear('');
    } else if (selectedAssay === filterValue) {
      setSelectedAssay('');
    } else if (selectedMission === filterValue) {
      setSelectedMission('');
    } else if (selectedModelOrganism === filterValue) {
      setSelectedModelOrganism('');
    } else if (selectedMolecular === filterValue) {
      setSelectedMolecular('');
    }
  };

  // Auto-search when filters change (even without query)
  useEffect(() => {
    const hasFilters = selectedOrganism || selectedExposure || selectedSystem || 
                      selectedYear || selectedAssay || selectedMission ||
                      selectedModelOrganism || selectedMolecular;
    
    if (hasFilters) {
      const filters = {
        organism: selectedOrganism,
        exposure: selectedExposure,
        system: selectedSystem,
        year: selectedYear,
        assay: selectedAssay,
        mission: selectedMission,
        model_organism: selectedModelOrganism,
        molecular: selectedMolecular,
      };
      
      setLoading(true);
      apiService.searchStudies(query || '', 50, 0.3, filters)
        .then(response => {
          setSearchResults(response.results);
        })
        .catch(error => {
          console.error('Filter search failed:', error);
          setSearchResults([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedOrganism, selectedExposure, selectedSystem, selectedYear, selectedAssay, selectedMission, selectedModelOrganism, selectedMolecular, query]);

  const activeFilters = [
    selectedOrganism,
    selectedExposure,
    selectedSystem,
    selectedYear,
    selectedAssay,
    selectedMission,
    selectedModelOrganism,
    selectedMolecular,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🔍 Explore Space Biology Research
              </h1>
              <span className="ml-3 text-sm text-gray-500">
                {totalStudies} NASA Studies
              </span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/compare"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                🔍 Compare
              </Link>
              <Link
                href="/consensus"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                📊 Consensus
              </Link>
              <Link
                href="/graph"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                🕸️ Knowledge Graph
              </Link>
              <Link
                href="/about"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                ℹ️ About
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Facets */}
          <div className="lg:col-span-1">
            <FacetFilters
              facets={facets}
              selectedOrganism={selectedOrganism}
              selectedExposure={selectedExposure}
              selectedSystem={selectedSystem}
              selectedYear={selectedYear}
              selectedAssay={selectedAssay}
              selectedMission={selectedMission}
              selectedModelOrganism={selectedModelOrganism}
              selectedMolecular={selectedMolecular}
              onFacetChange={handleFacetChange}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFilters.length}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <SearchBar
              onSearch={handleSearch}
              loading={loading}
              placeholder="Search for: 'microgravity bone loss', 'plant growth space', 'muscle atrophy'..."
            />

            {/* Coverage Meter */}
            <CoverageMeter
              totalStudies={totalStudies}
              fullTextCount={fullTextCount}
              abstractOnlyCount={abstractOnlyCount}
              searchResultsCount={searchResults.length}
            />

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700">Active filters:</span>
                  {activeFilters.map((filter, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {filter}
                      <button
                        onClick={() => {
                          removeFilter(filter);
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            <ResultCards
              results={searchResults}
              loading={loading}
              query={query}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
