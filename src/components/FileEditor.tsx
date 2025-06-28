
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CodeEditor } from './CodeEditor';
import { PactCodeValidator, ValidationError } from '../utils/codeValidator';

interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

interface FileEditorProps {
  test: GeneratedTest;
  onSave: (updatedTest: GeneratedTest) => void;
  onCancel: () => void;
}

export const FileEditor: React.FC<FileEditorProps> = ({
  test,
  onSave,
  onCancel,
}) => {
  const [editedContent, setEditedContent] = useState(test.content);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const { toast } = useToast();

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    
    // Validate code in real-time
    const errors = PactCodeValidator.validatePactTest(value);
    setValidationErrors(errors);
  };

  const handleSave = () => {
    const updatedTest = { ...test, content: editedContent };
    onSave(updatedTest);
    toast({
      title: "File Saved",
      description: `${test.filename} has been updated successfully`,
    });
  };

  const getValidationSummary = () => {
    const errorCount = validationErrors.filter(e => e.severity === 'error').length;
    const warningCount = validationErrors.filter(e => e.severity === 'warning').length;
    const infoCount = validationErrors.filter(e => e.severity === 'info').length;

    return { errorCount, warningCount, infoCount };
  };

  const { errorCount, warningCount, infoCount } = getValidationSummary();

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Editing: {test.filename}
            </h3>
            <p className="text-sm text-slate-600">
              {test.method} {test.endpoint} • {test.tag}
            </p>
            {(errorCount > 0 || warningCount > 0 || infoCount > 0) && (
              <div className="flex gap-3 mt-2 text-xs">
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {errorCount} error{errorCount !== 1 ? 's' : ''}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-3 w-3" />
                    {warningCount} warning{warningCount !== 1 ? 's' : ''}
                  </span>
                )}
                {infoCount > 0 && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Info className="h-3 w-3" />
                    {infoCount} suggestion{infoCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" disabled={errorCount > 0}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <CodeEditor
          value={editedContent}
          onChange={handleContentChange}
          language="javascript"
          className="min-h-[500px]"
        />
        
        {validationErrors.length > 0 && (
          <div className="mt-4 bg-slate-50/50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-slate-800 mb-3">Code Analysis</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 text-xs p-2 rounded ${
                    error.severity === 'error' 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : error.severity === 'warning'
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {error.severity === 'error' ? (
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-medium">Line {error.line}</div>
                    <div>{error.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
