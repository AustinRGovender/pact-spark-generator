import React from 'react';
import { TestResult } from '@/types/dockerTypes';
import { TestResultDetails } from './TestResultDetails';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResultsViewProps {
  results: TestResult[];
}

export const TestResultsView: React.FC<TestResultsViewProps> = ({ results }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'failed':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'skipped':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto mobile-scroll-container mobile-scroll-list">
      {results.map((result, index) => (
        <div 
          key={index}
          className={`border rounded-lg p-3 transition-colors mobile-scroll-item ${getStatusBg(result.status)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                {getStatusIcon(result.status)}
                <span className="font-medium text-sm truncate">{result.filename}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  result.status === 'passed' ? 'bg-green-100 text-green-700' :
                  result.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-600 truncate">{result.message}</div>
              {result.errorDetails?.errorType && (
                <div className="text-xs text-slate-500 mt-1">
                  Error Type: {result.errorDetails.errorType.replace('_', ' ')}
                  {result.errorDetails.filename && (
                    <span> • {result.errorDetails.filename}
                      {result.errorDetails.lineNumber && `:${result.errorDetails.lineNumber}`}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right ml-2 flex-shrink-0">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.round(result.duration)}ms
              </div>
            </div>
          </div>
          
          {/* Error Details Component */}
          <TestResultDetails result={result} />
        </div>
      ))}
    </div>
  );
};