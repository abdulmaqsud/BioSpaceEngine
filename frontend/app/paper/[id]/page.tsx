'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiService, Study, EvidenceSentence } from '../../../lib/api';
import Link from 'next/link';

export default function PaperDetailPage() {
  const params = useParams();
  const studyId = params.id;
  
  const [study, setStudy] = useState<Study | null>(null);
  const [evidence, setEvidence] = useState<EvidenceSentence[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'entities'>('overview');
  const [compareList, setCompareList] = useState<number[]>([]);

  useEffect(() => {
    if (studyId) {
      loadStudyData();
    }
  }, [studyId]);

  const loadStudyData = async () => {
    try {
      setLoading(true);
      console.log('Loading study data for ID:', studyId);
      
      // Get study details directly from API
      const studyResponse = await fetch(`http://127.0.0.1:8000/api/studies/${studyId}/`);
      console.log('Study response status:', studyResponse.status);
      
      if (!studyResponse.ok) {
        console.error('Study response not ok:', studyResponse.status, studyResponse.statusText);
        setError(`Study not found (${studyResponse.status})`);
        return;
      }
      
      const studyData = await studyResponse.json();
      console.log('Study data received:', studyData);
      setStudy(studyData);
      
      // Get evidence sentences
      const evidenceResponse = await fetch(`http://127.0.0.1:8000/api/studies/${studyId}/evidence/`);
      if (evidenceResponse.ok) {
        const evidenceData = await evidenceResponse.json();
        setEvidence(evidenceData);
      }
      
      // Get sections (if available)
      const sectionsResponse = await fetch(`http://127.0.0.1:8000/api/studies/${studyId}/sections/`);
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        setSections(sectionsData);
      }
      
      // Get entities (if available)
      const entitiesResponse = await fetch(`http://127.0.0.1:8000/api/entities/?study=${studyId}`);
      if (entitiesResponse.ok) {
        const entitiesData = await entitiesResponse.json();
        setEntities(entitiesData);
      }
      
    } catch (err: any) {
      console.error('Error loading study data:', err);
      setError(`Failed to load study data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCompare = () => {
    if (study && study.id) {
      if (compareList.includes(study.id)) {
        // Remove from compare list
        const updatedList = compareList.filter(id => id !== study.id);
        setCompareList(updatedList);
        if (typeof window !== 'undefined') {
          localStorage.setItem('compareList', JSON.stringify(updatedList));
        }
      } else {
        if (compareList.length < 3) {
          // Add to compare list
          const updatedList = [...compareList, study.id];
          setCompareList(updatedList);
          if (typeof window !== 'undefined') {
            localStorage.setItem('compareList', JSON.stringify(updatedList));
          }
        } else {
          alert('You can compare up to 3 studies at a time');
        }
      }
    }
  };

  const handleExportCitation = () => {
    if (study) {
      const citation = `${study.authors || 'Unknown Authors'}. ${study.title}. ${study.journal || 'Unknown Journal'}. ${study.year || 'Unknown Year'}.`;
      navigator.clipboard.writeText(citation);
      alert('Citation copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading study details...</p>
        </div>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Study Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested study could not be found.'}</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Study ID: {studyId}</p>
            <p>Error: {error}</p>
          </div>
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
                <span className="text-gray-900 font-medium">Paper Details</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">
                {study.title.length > 80 ? `${study.title.substring(0, 80)}...` : study.title}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">PMCID: {study.pmcid}</div>
              {study.year && (
                <div className="text-sm text-gray-500">{study.year}</div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Paper Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {study.title}
              </h2>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {study.authors && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Authors</h3>
                    <p className="text-sm text-gray-600">{study.authors}</p>
                  </div>
                )}
                
                {study.journal && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Journal</h3>
                    <p className="text-sm text-gray-600">{study.journal}</p>
                  </div>
                )}
                
                {study.year && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Year</h3>
                    <p className="text-sm text-gray-600">{study.year}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">PMCID</h3>
                  <a 
                    href={study.pmc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {study.pmcid}
                  </a>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('evidence')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'evidence'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Evidence ({evidence.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('entities')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'entities'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Entities ({entities.length})
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
                      {activeTab === 'overview' && (
                        <div>
                          {/* Study Summary */}
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Study Summary</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-gray-700 leading-relaxed">
                                This study investigates <strong>{study.title}</strong> in the context of space biology research. 
                                {study.abstract ? (
                                  ` The research focuses on ${study.abstract.substring(0, 200)}...`
                                ) : (
                                  ' This research contributes to our understanding of biological systems in space environments and microgravity conditions.'
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Abstract */}
                          {study.abstract && (
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                              <p className="text-gray-700 leading-relaxed">{study.abstract}</p>
                            </div>
                          )}

                          {/* Key Findings */}
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Findings</h3>
                            <div className="space-y-3">
                              {evidence.slice(0, 3).map((evidenceItem, index) => (
                                <div key={evidenceItem.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-start">
                                    <span className="text-green-500 mr-2 mt-1">•</span>
                                    <p className="text-sm text-gray-700">{evidenceItem.sentence_text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Research Context */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Research Context</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Publication Year:</span>
                                <span className="ml-2 text-gray-600">{study.year || 'Not specified'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Journal:</span>
                                <span className="ml-2 text-gray-600">{study.journal || 'Not specified'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Evidence Sentences:</span>
                                <span className="ml-2 text-gray-600">{evidence.length} key findings</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">PMCID:</span>
                                <span className="ml-2 text-blue-600">{study.pmcid}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'evidence' && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Research Evidence</h3>
                          <p className="text-gray-600 mb-4">Key findings and evidence extracted from this study:</p>
                          <div className="space-y-4">
                            {evidence.length > 0 ? (
                              evidence.map((evidenceItem, index) => (
                                <div key={evidenceItem.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                                      Finding #{index + 1}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Position: {evidenceItem.char_start}-{evidenceItem.char_end}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 leading-relaxed">{evidenceItem.sentence_text}</p>
                                  <div className="mt-3 pt-3 border-t border-blue-200">
                                    <div className="flex items-center text-xs text-gray-500">
                                      <span className="mr-4">Sentence Index: {evidenceItem.sentence_index}</span>
                                      <span>Study ID: {evidenceItem.study}</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <div className="text-4xl mb-2">🔍</div>
                                <p>No evidence sentences extracted yet</p>
                                <p className="text-sm mt-1">Evidence extraction is still in progress for this study</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

              {activeTab === 'entities' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Extracted Entities</h3>
                  {entities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {entities.map((entity, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800">{entity.text}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {entity.entity_type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Position: {entity.start_char}-{entity.end_char}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No entities extracted yet.</p>
                      <p className="text-sm mt-1">Entity extraction is still in progress.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Study Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Evidence Sentences</span>
                    <span className="text-sm font-medium text-gray-900">{evidence.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sections</span>
                    <span className="text-sm font-medium text-gray-900">{sections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Entities</span>
                    <span className="text-sm font-medium text-gray-900">{entities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Publication Year</span>
                    <span className="text-sm font-medium text-gray-900">{study.year || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a 
                    href={study.pmc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on PMC
                  </a>
                  <button 
                    onClick={handleAddToCompare}
                    className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      study && compareList.includes(study.id)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {study && compareList.includes(study.id) ? 'Remove from Compare' : 'Add to Compare'}
                  </button>
                  <button 
                    onClick={handleExportCitation}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Export Citation
                  </button>
                </div>
              </div>

              {/* Related Studies */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Studies</h3>
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Related studies feature coming soon</p>
                </div>
              </div>

                      {/* Study Tags */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {study.year && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {study.year}
                            </span>
                          )}
                          {study.journal && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {study.journal.split(' ')[0]}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Space Biology
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            NASA Research
                          </span>
                          {study.title.toLowerCase().includes('microgravity') && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Microgravity
                            </span>
                          )}
                          {study.title.toLowerCase().includes('bone') && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Bone Research
                            </span>
                          )}
                          {study.title.toLowerCase().includes('muscle') && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                              Muscle Research
                            </span>
                          )}
                          {study.title.toLowerCase().includes('plant') && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              Plant Biology
                            </span>
                          )}
                          {study.title.toLowerCase().includes('immune') && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                              Immunology
                            </span>
                          )}
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
                AI-powered exploration of NASA Space Biology research
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/explore"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Search
              </Link>
              {compareList.length > 0 && (
                <Link 
                  href="/compare"
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Compare Studies ({compareList.length})
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
