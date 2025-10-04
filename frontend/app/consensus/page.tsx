'use client';

import { useState, useEffect } from 'react';
import { apiService, Study, FacetsResponse } from '../../lib/api';
import Link from 'next/link';

export default function ConsensusPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load facets data
      const facetsData = await apiService.getFacets();
      setFacets(facetsData);
      
      // Generate insights from facets
      const generatedInsights = generateInsights(facetsData);
      setInsights(generatedInsights);
      
    } catch (err: any) {
      console.error('Error loading consensus data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (facetsData: FacetsResponse) => {
    // Analyze research patterns from facets
    const totalStudies = facetsData.organisms.reduce((sum, org) => sum + org.count, 0);
    
    // Top research areas
    const topOrganisms = facetsData.organisms
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const topSystems = facetsData.systems
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const topExposures = facetsData.exposures
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Research gaps (low count areas)
    const researchGaps = facetsData.organisms
      .filter(org => org.count < 10)
      .sort((a, b) => a.count - b.count)
      .slice(0, 5);
    
    // Year distribution
    const yearDistribution = facetsData.years
      .sort((a, b) => parseInt(b.name) - parseInt(a.name))
      .slice(0, 10);
    
    // Emerging trends (recent years)
    const recentYears = facetsData.years
      .filter(year => parseInt(year.name) >= 2020)
      .sort((a, b) => parseInt(b.name) - parseInt(a.name));
    
    // Calculate research intensity
    const researchIntensity = {
      high: topOrganisms.filter(org => org.count > 50).length,
      medium: topOrganisms.filter(org => org.count >= 20 && org.count <= 50).length,
      low: topOrganisms.filter(org => org.count < 20).length
    };
    
    // Find dominant research themes
    const dominantThemes = topSystems.slice(0, 3).map(system => ({
      name: system.name,
      count: system.count,
      percentage: Math.round((system.count / totalStudies) * 100)
    }));
    
    // Calculate research diversity
    const diversityScore = Math.round((new Set(facetsData.organisms.map(o => o.name)).size / totalStudies) * 100);
    
    // Find emerging areas (recent focus)
    const emergingAreas = facetsData.years
      .filter(year => parseInt(year.name) >= 2022)
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
      emergingAreas
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing research patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Insights</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            href="/explore"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Insights Available</h1>
          <p className="text-gray-600 mb-4">Unable to generate research insights at this time.</p>
          <Link 
            href="/explore"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link href="/explore" className="hover:text-blue-600">
                  Search
                </Link>
                <span>›</span>
                <span className="text-gray-900 font-medium">Research Insights</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">
                📊 NASA Space Biology Research Insights
              </h1>
              <p className="text-gray-600 mt-1">
                Patterns, trends, and gaps in {insights.totalStudies} studies
              </p>
              <div className="mt-2 text-sm text-gray-500">
                <p>📋 <strong>Data Source:</strong> Analysis based on study metadata (titles, journals, years, organisms)</p>
                <p>🔍 <strong>Methodology:</strong> Statistical analysis of research patterns and publication trends</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/explore"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search Studies
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Research Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Research Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Studies</span>
                <span className="text-2xl font-bold text-blue-600">{insights.totalStudies}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Publication Years</span>
                <span className="text-lg font-semibold text-gray-900">{insights.totalYears}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Journals</span>
                <span className="text-lg font-semibold text-gray-900">{insights.totalJournals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recent Studies (2020+)</span>
                <span className="text-lg font-semibold text-green-600">
                  {insights.recentYears.reduce((sum, year) => sum + year.count, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Research Areas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Research Areas</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Organisms</h3>
                <div className="space-y-1">
                  {insights.topOrganisms.map((org, index) => (
                    <div key={org.name} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{org.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(org.count / insights.topOrganisms[0].count) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{org.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Research Systems */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Research Systems</h2>
            <div className="space-y-3">
              {insights.topSystems.map((system, index) => (
                <div key={system.name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{system.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(system.count / insights.topSystems[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{system.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Gaps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Research Gaps</h2>
            <p className="text-sm text-gray-600 mb-4">Areas with limited research (opportunities for future studies)</p>
            <div className="space-y-2">
              {insights.researchGaps.map((gap, index) => (
                <div key={gap.name} className="flex justify-between items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <span className="text-sm text-gray-700">{gap.name}</span>
                  <span className="text-sm font-medium text-yellow-700">{gap.count} studies</span>
                </div>
              ))}
            </div>
          </div>

          {/* Publication Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Publication Timeline</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {insights.yearDistribution.map((year, index) => (
                <div key={year.name} className="text-center">
                  <div className="text-sm font-medium text-gray-900">{year.name}</div>
                  <div className="text-2xl font-bold text-blue-600">{year.count}</div>
                  <div className="text-xs text-gray-500">studies</div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Key Insights */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Research Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Research Intensity</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>High Activity:</span>
                    <span className="font-medium">{insights.researchIntensity.high} areas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Activity:</span>
                    <span className="font-medium">{insights.researchIntensity.medium} areas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Activity:</span>
                    <span className="font-medium">{insights.researchIntensity.low} areas</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Dominant Themes</h3>
                <div className="space-y-2 text-sm">
                  {insights.dominantThemes.map((theme, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{theme.name}:</span>
                      <span className="font-medium">{theme.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Research Diversity</h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{insights.diversityScore}%</div>
                  <p className="text-sm text-purple-700">Diversity Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Research Opportunities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Research Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Understudied Areas</h3>
                <div className="space-y-2">
                  {insights.researchGaps.map((gap, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <span className="text-sm text-gray-700">{gap.name}</span>
                      <span className="text-sm font-medium text-yellow-700">{gap.count} studies</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Emerging Focus Areas</h3>
                <div className="space-y-2">
                  {insights.emergingAreas.map((area, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm text-gray-700">{area.name}</span>
                      <span className="text-sm font-medium text-green-700">{area.count} studies</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🚀 BioSpace Knowledge Engine
              </h3>
              <p className="text-sm text-gray-600">
                AI-powered insights into NASA Space Biology research
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/explore"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search Studies
              </Link>
              <Link 
                href="/compare"
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Compare Studies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
