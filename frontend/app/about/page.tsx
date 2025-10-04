'use client';

import Link from 'next/link';

export default function AboutPage() {
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
                <span className="text-gray-900 font-medium">About</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">
                ℹ️ About BioSpace Knowledge Engine
              </h1>
              <p className="text-gray-600 mt-1">
                Methodology, transparency, and technical details
              </p>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Project Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Overview</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 mb-4">
                The BioSpace Knowledge Engine is an AI-powered platform for exploring and analyzing 
                NASA Space Biology research. It provides researchers, students, and space enthusiasts 
                with intelligent search, comparison, and insight capabilities across 608+ peer-reviewed 
                studies.
              </p>
              <p className="text-gray-700">
                Our mission is to make space biology research more accessible and discoverable, 
                enabling faster scientific progress and better understanding of life in space.
              </p>
            </div>
          </div>

          {/* Data Sources */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Data Sources</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">📚</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">PubMed Central (PMC)</h3>
                  <p className="text-gray-600 text-sm">
                    608+ peer-reviewed NASA Space Biology studies with full-text access
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">🔬</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Research Metadata</h3>
                  <p className="text-gray-600 text-sm">
                    Extracted authors, journals, publication years, and study characteristics
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">🧬</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Scientific Entities</h3>
                  <p className="text-gray-600 text-sm">
                    AI-extracted biological entities, organisms, and research systems
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI-Powered Search</h3>
                  <p className="text-gray-600 text-sm">
                    Our system understands the meaning behind your search queries, not just keywords. 
                    Find studies by concept, not just exact word matches.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Analysis</h3>
                  <p className="text-gray-600 text-sm">
                    We automatically extract key findings, identify research patterns, 
                    and highlight connections between studies.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Research Insights</h3>
                  <p className="text-gray-600 text-sm">
                    Discover research gaps, emerging trends, and opportunities 
                    for future space biology research.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs">🔍</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Semantic Search</h3>
                    <p className="text-gray-600 text-sm">AI-powered search that understands meaning, not just keywords</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs">🔬</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Study Comparison</h3>
                    <p className="text-gray-600 text-sm">Side-by-side comparison of up to 3 studies</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-xs">📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Research Insights</h3>
                    <p className="text-gray-600 text-sm">Patterns, trends, and gaps in research</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-xs">🏷️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Smart Filtering</h3>
                    <p className="text-gray-600 text-sm">Filter by organism, system, year, and more</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs">📄</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Study Details</h3>
                    <p className="text-gray-600 text-sm">Comprehensive study information and evidence</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-indigo-600 text-xs">🔗</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">PMC Integration</h3>
                    <p className="text-gray-600 text-sm">Direct links to original papers on PMC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                We believe that making space biology research more discoverable and accessible 
                will accelerate scientific progress and help humanity prepare for long-term space exploration.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Why This Matters</h3>
                <p className="text-blue-800 text-sm">
                  As we prepare for missions to Mars and beyond, understanding how space affects 
                  biological systems becomes critical. This platform helps researchers, students, 
                  and space enthusiasts discover and connect the dots in space biology research.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact & Support</h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                This is an open-source project built for the NASA Space Biology challenge. 
                For questions, suggestions, or contributions, please refer to the project repository.
              </p>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/explore"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Exploring
                </Link>
                <Link 
                  href="/consensus"
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Insights
                </Link>
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
                AI-powered exploration of NASA Space Biology research
              </p>
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
      </footer>
    </div>
  );
}
