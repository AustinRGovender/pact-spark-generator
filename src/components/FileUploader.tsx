
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onFilesUpload: (files: File[]) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesUpload, isLoading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesUpload(acceptedFiles);
    }
  }, [onFilesUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml'],
      'text/yaml': ['.yaml', '.yml'],
      'text/x-yaml': ['.yaml', '.yml'],
    },
    multiple: true,
    disabled: isLoading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
          Swagger to PactJS
        </h1>
        <p className="text-xl text-slate-600 mb-2">
          Generate consumer contract tests from OpenAPI specs
        </p>
        <p className="text-sm text-slate-500">
          Completely client-side • Privacy-first • Zero data transmission
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          relative bg-white/60 backdrop-blur-xl rounded-3xl border-2 border-dashed
          p-12 text-center cursor-pointer transition-all duration-300 shadow-xl
          ${isDragActive 
            ? 'border-[#bbc7fe] bg-[#bbc7fe]/10 scale-105' 
            : 'border-slate-300 hover:border-[#bbc7fe] hover:bg-white/80'
          }
          ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <Loader2 className="h-16 w-16 text-[#bbc7fe] animate-spin" />
          ) : (
            <div className="relative">
              <Upload className="h-16 w-16 text-slate-400" />
              <FileText className="h-8 w-8 text-[#bbc7fe] absolute -bottom-1 -right-1" />
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-slate-800">
              {isLoading ? 'Generating Tests...' : isDragActive ? 'Drop files here' : 'Drop your OpenAPI files here'}
            </h3>
            
            {!isLoading && (
              <>
                <p className="text-slate-600">
                  Supports JSON, YAML, and YML formats • Multiple files welcome
                </p>
                <p className="text-sm text-slate-500">
                  Click to browse or drag and drop
                </p>
              </>
            )}
          </div>
        </div>

        {/* Glassmorphic accent elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-[#bbc7fe]/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-blue-200/30 rounded-full blur-lg"></div>
      </div>
    </div>
  );
};
