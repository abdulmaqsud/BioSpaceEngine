'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import Link from 'next/link';
import KnowledgeGraph from '../../components/KnowledgeGraph';

export default function GraphPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [triples, setTriples] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load entities and triples
      const [entitiesData, triplesData] = await Promise.all([
        apiService.getEntities(),
        apiService.getTriples()
      ]);
      
      setEntities(entitiesData);
      setTriples(triplesData);
      
    } catch (err: any) {
      console.error('Error loading graph data:', err);
      setError(`Failed to load graph data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Graph</h1>
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
                <span className="text-gray-900 font-medium">Knowledge Graph</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">
                🕸️ Knowledge Graph
              </h1>
              <p className="text-gray-600 mt-1">
                Entity relationships in NASA Space Biology research
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Interactive Knowledge Graph */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <KnowledgeGraph entities={entities} triples={triples} />
        </div>

        {/* Current Data Preview */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Entities Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Extracted Entities</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Entities</span>
                <span className="text-2xl font-bold text-blue-600">{entities.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Entity Types</span>
                <span className="text-lg font-semibold text-gray-900">
                  {new Set(entities.map(e => e.entity_type)).size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Studies with Entities</span>
                <span className="text-lg font-semibold text-gray-900">
                  {new Set(entities.map(e => e.study)).size}
                </span>
              </div>
            </div>
            
            {entities.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Top Entity Types</h4>
                <div className="space-y-1">
                  {Object.entries(
                    entities.reduce((acc, entity) => {
                      acc[entity.entity_type] = (acc[entity.entity_type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-600">{type}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Triples Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Entity Relationships</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Relationships</span>
                <span className="text-2xl font-bold text-green-600">{triples.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Relationship Types</span>
                <span className="text-lg font-semibold text-gray-900">
                  {new Set(triples.map(t => t.predicate)).size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unique Entities</span>
                <span className="text-lg font-semibold text-gray-900">
                  {new Set([...triples.map(t => t.subject), ...triples.map(t => t.object)]).size}
                </span>
              </div>
            </div>
            
            {triples.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Top Relationships</h4>
                <div className="space-y-1">
                  {Object.entries(
                    triples.reduce((acc, triple) => {
                      acc[triple.predicate] = (acc[triple.predicate] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([predicate, count]) => (
                      <div key={predicate} className="flex justify-between text-sm">
                        <span className="text-gray-600">{predicate}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sample Data */}
        {entities.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sample Entities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entities.slice(0, 9).map((entity, index) => (
                <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800 text-sm">{entity.text}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {entity.entity_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Study: {entity.study}
                  </p>
                </div>
              ))}
            </div>
            {entities.length > 9 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                ... and {entities.length - 9} more entities
              </p>
            )}
          </div>
        )}
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
