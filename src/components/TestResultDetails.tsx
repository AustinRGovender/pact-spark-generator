import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Bug, 
  AlertTriangle, 
  Clock, 
  FileText,
  ExternalLink 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TestResult } from '@/types/dockerTypes';
import { SyntaxHighlighter } from './SyntaxHighlighter';

interface TestResultDetailsProps {
  result: TestResult;
}

export const TestResultDetails: React.FC<TestResultDetailsProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'stacktrace' | 'diff' | 'context' | 'log'>('stacktrace');
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} copied successfully`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getErrorTypeColor = (errorType: string) => {
    switch (errorType) {
      case 'assertion': return 'bg-red-100 text-red-800 border-red-200';
      case 'network': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'timeout': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'contract_mismatch': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'runtime': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'syntax': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatJson = (obj: any) => {
    if (!obj) return '';
    return JSON.stringify(obj, null, 2);
  };

  if (result.status !== 'failed' || !result.errorDetails) {
    return null;
  }

  const { errorDetails } = result;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-auto p-2 text-left w-full justify-start hover:bg-red-50"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 mr-2 text-red-600" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2 text-red-600" />
          )}
          <Bug className="h-4 w-4 mr-2 text-red-600" />
          <span className="text-red-600 font-medium">View Error Details</span>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 mt-3">
        {/* Error Summary */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">Error Summary</span>
            </div>
            <Badge className={getErrorTypeColor(errorDetails.errorType)}>
              {errorDetails.errorType.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          {errorDetails.filename && (
            <div className="text-sm text-red-700 mb-2">
              <strong>File:</strong> {errorDetails.filename}
              {errorDetails.lineNumber && (
                <span> (line {errorDetails.lineNumber}
                  {errorDetails.columnNumber && `:${errorDetails.columnNumber}`})
                </span>
              )}
            </div>
          )}
          
          <p className="text-red-800">{result.message}</p>
          
          {errorDetails.suggestions && errorDetails.suggestions.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-red-800 mb-2">Suggestions:</h4>
              <ul className="list-disc list-inside space-y-1">
                {errorDetails.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-red-700">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tabs for different views */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex bg-slate-50 border-b border-slate-200">
            {errorDetails.stackTrace && (
              <button
                onClick={() => setActiveTab('stacktrace')}
                className={`px-4 py-2 text-sm font-medium border-r border-slate-200 ${
                  activeTab === 'stacktrace' 
                    ? 'bg-white text-slate-900 border-b-2 border-blue-500' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stack Trace
              </button>
            )}
            
            {errorDetails.assertion && (
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-4 py-2 text-sm font-medium border-r border-slate-200 ${
                  activeTab === 'diff' 
                    ? 'bg-white text-slate-900 border-b-2 border-blue-500' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assertion Diff
              </button>
            )}
            
            {errorDetails.context && (
              <button
                onClick={() => setActiveTab('context')}
                className={`px-4 py-2 text-sm font-medium border-r border-slate-200 ${
                  activeTab === 'context' 
                    ? 'bg-white text-slate-900 border-b-2 border-blue-500' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Request/Response
              </button>
            )}
            
            {result.fullLog && (
              <button
                onClick={() => setActiveTab('log')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'log' 
                    ? 'bg-white text-slate-900 border-b-2 border-blue-500' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Full Log
              </button>
            )}
          </div>

          <div className="p-4">
            {/* Stack Trace Tab */}
            {activeTab === 'stacktrace' && errorDetails.stackTrace && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900">Stack Trace</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(errorDetails.stackTrace!, 'Stack trace')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <SyntaxHighlighter 
                  code={errorDetails.stackTrace} 
                  language="text"
                  className="max-h-96 overflow-y-auto"
                />
              </div>
            )}

            {/* Assertion Diff Tab */}
            {activeTab === 'diff' && errorDetails.assertion && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900">Assertion Details</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(
                      `Expected: ${formatJson(errorDetails.assertion!.expected)}\nActual: ${formatJson(errorDetails.assertion!.actual)}`,
                      'Assertion details'
                    )}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                {errorDetails.assertion.operator && (
                  <div className="text-sm text-slate-600">
                    <strong>Operator:</strong> <code className="bg-slate-100 px-1 rounded">{errorDetails.assertion.operator}</code>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Expected</h5>
                    <SyntaxHighlighter 
                      code={formatJson(errorDetails.assertion.expected)} 
                      language="json"
                      className="max-h-48 overflow-y-auto"
                    />
                  </div>
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">Actual</h5>
                    <SyntaxHighlighter 
                      code={formatJson(errorDetails.assertion.actual)} 
                      language="json"
                      className="max-h-48 overflow-y-auto"
                    />
                  </div>
                </div>
                
                {errorDetails.assertion.diff && (
                  <div>
                    <h5 className="font-medium text-slate-900 mb-2">Diff</h5>
                    <SyntaxHighlighter 
                      code={errorDetails.assertion.diff} 
                      language="diff"
                      className="max-h-48 overflow-y-auto"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Context Tab */}
            {activeTab === 'context' && errorDetails.context && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900">Request/Response Context</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(formatJson(errorDetails.context), 'Context')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                {errorDetails.context.request && (
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">Request</h5>
                    <SyntaxHighlighter 
                      code={formatJson(errorDetails.context.request)} 
                      language="json"
                      className="max-h-48 overflow-y-auto"
                    />
                  </div>
                )}
                
                {errorDetails.context.response && (
                  <div>
                    <h5 className="font-medium text-purple-700 mb-2">Response</h5>
                    <SyntaxHighlighter 
                      code={formatJson(errorDetails.context.response)} 
                      language="json"
                      className="max-h-48 overflow-y-auto"
                    />
                  </div>
                )}
                
                {errorDetails.context.interaction && (
                  <div>
                    <h5 className="font-medium text-orange-700 mb-2">Expected Interaction</h5>
                    <SyntaxHighlighter 
                      code={formatJson(errorDetails.context.interaction)} 
                      language="json"
                      className="max-h-48 overflow-y-auto"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Full Log Tab */}
            {activeTab === 'log' && result.fullLog && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900">Full Container Log</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(result.fullLog!, 'Full log')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <SyntaxHighlighter 
                  code={result.fullLog} 
                  language="text"
                  className="max-h-96 overflow-y-auto"
                />
              </div>
            )}
          </div>
        </div>

        {/* Related Files */}
        {errorDetails.relatedFiles && errorDetails.relatedFiles.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Related Files</span>
            </div>
            <div className="space-y-2">
              {errorDetails.relatedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-blue-700">
                  <ExternalLink className="h-4 w-4" />
                  <span className="font-mono">{file}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};