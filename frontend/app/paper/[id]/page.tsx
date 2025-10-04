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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
    } catch (err) {
      console.error('Error loading study data:', err);
      setError(`Failed to load study data: ${err.message}`);
    } finally {
      setLoading(false);
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
              <Link 
                href="/explore"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Search
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Paper Details
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              PMCID: {study.pmcid}
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

              {/* Abstract */}
              {study.abstract && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                  <p className="text-gray-700 leading-relaxed">{study.abstract}</p>
                </div>
              )}

              {/* Evidence Sentences */}
              {evidence.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Evidence</h3>
                  <div className="space-y-3">
                    {evidence.slice(0, 10).map((evidenceItem, index) => (
                      <div key={evidenceItem.id} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{evidenceItem.sentence_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Information</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">External Links</h4>
                  <div className="space-y-2">
                    <a 
                      href={study.pmc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      View on PubMed Central
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Evidence Sentences</h4>
                  <p className="text-sm text-gray-600">{evidence.length} sentences found</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                      Add to Compare
                    </button>
                    <button className="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                      Export Citation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
