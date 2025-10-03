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
  const abstractOnlyPercentage = Math.round((abstractOnlyCount / totalStudies) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              {searchResultsCount} / {totalStudies} indexed
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {fullTextCount} full-text
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {abstractOnlyCount} abstract-only
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {fullTextPercentage}% full-text coverage
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${fullTextPercentage}%` }}
          ></div>
          <div
            className="bg-gray-400 transition-all duration-300"
            style={{ width: `${abstractOnlyPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-2 text-xs text-gray-500">
        <p>
          💡 <strong>Coverage:</strong> {fullTextPercentage}% of studies have full-text access, 
          enabling detailed analysis and AI-powered insights.
        </p>
      </div>
    </div>
  );
}
