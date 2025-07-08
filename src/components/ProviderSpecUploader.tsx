import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, Server } from 'lucide-react';

interface ProviderSpecUploaderProps {
  onSpecUpload: (files: File[]) => void;
  isLoading: boolean;
  hasSpec: boolean;
}

export const ProviderSpecUploader: React.FC<ProviderSpecUploaderProps> = ({ 
  onSpecUpload, 
  isLoading, 
  hasSpec 
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onSpecUpload(acceptedFiles);
    }
  }, [onSpecUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml'],
      'text/yaml': ['.yaml', '.yml'],
      'text/x-yaml': ['.yaml', '.yml'],
    },
    multiple: false,
    disabled: isLoading,
  });

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Server className="h-4 w-4 text-blue-600" />
        <h4 className="text-sm font-medium text-slate-700">
          Provider OpenAPI Specification
        </h4>
        {hasSpec && (
          <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
        )}
      </div>
      
      <div
        {...getRootProps()}
        className={`
          relative bg-white/60 backdrop-blur-sm rounded-xl border-2 border-dashed
          p-4 text-center cursor-pointer transition-all duration-200 text-sm
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50/50' 
            : 'border-slate-300 hover:border-blue-400 hover:bg-white/80'
          }
          ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
          ${hasSpec ? 'border-green-300 bg-green-50/30' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-2">
          {isLoading ? (
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          ) : (
            <div className="relative">
              <Upload className="h-8 w-8 text-slate-400" />
              <FileText className="h-4 w-4 text-blue-600 absolute -bottom-0.5 -right-0.5" />
            </div>
          )}
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">
              {isLoading ? 'Processing...' : 
               isDragActive ? 'Drop provider spec here' : 
               hasSpec ? 'Provider spec loaded - click to replace' :
               'Upload provider OpenAPI spec'}
            </p>
            
            {!isLoading && !hasSpec && (
              <p className="text-xs text-slate-500">
                Optional: Use different spec for hosted provider
              </p>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 mt-2">
        If no provider spec is uploaded, the consumer spec will be used for hosting.
      </p>
    </div>
  );
};