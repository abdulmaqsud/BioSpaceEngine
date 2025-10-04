'use client';

import { useState, useEffect } from 'react';
import { apiService, SearchResult, FacetsResponse } from '../../lib/api';
import SearchBar from '../../components/explore/SearchBar';
import FacetFilters from '../../components/explore/FacetFilters';
import ResultCards from '../../components/explore/ResultCards';
import CoverageMeter from '../../components/explore/CoverageMeter';
import Link from 'next/link';

export default function ExplorePage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [totalStudies] = useState(572);
  const [fullTextCount] = useState(571);
  const [abstractOnlyCount] = useState(1);
  
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
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-cyan-400/20 bg-slate-950/70 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-500/10 text-xl shadow-[0_0_24px_rgba(34,211,238,0.35)]">
                🚀
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
                  Explore NASA Space Biology Intelligence
                </h1>
                <span className="mt-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-cyan-200/80">
                  <span className="h-[3px] w-8 rounded-full bg-cyan-300/70" />
                  {totalStudies} indexed studies
                </span>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              {[{
                href: '/compare',
                label: 'Compare'
              }, {
                href: '/consensus',
                label: 'Consensus'
              }, {
                href: '/graph',
                label: 'Knowledge Graph'
              }, {
                href: '/about',
                label: 'About'
              }].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative overflow-hidden rounded-full border border-cyan-500/20 bg-slate-900/60 px-5 py-2 font-medium text-slate-200 shadow-[0_0_18px_rgba(45,212,191,0.08)] transition hover:border-cyan-300/60 hover:text-cyan-200"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-400/10 to-cyan-500/0 opacity-0 transition-opacity duration-500 hover:opacity-100" aria-hidden />
                  <span className="relative flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
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
          <div className="lg:col-span-3 space-y-6">
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
              <div className="rounded-xl border border-cyan-500/10 bg-slate-900/60 p-4 shadow-[0_0_20px_rgba(30,64,175,0.2)]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-cyan-100">Active filters:</span>
                  {activeFilters.map((filter, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100"
                    >
                      {filter}
                      <button
                        onClick={() => {
                          removeFilter(filter);
                        }}
                        className="text-cyan-300 transition hover:text-cyan-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-slate-400 transition hover:text-cyan-200"
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
