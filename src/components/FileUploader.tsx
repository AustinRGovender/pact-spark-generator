
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
    <div
      {...getRootProps()}
      className={`
        relative glass-card p-8 text-center cursor-pointer transition-smooth
        border-2 border-dashed rounded-xl
        ${isDragActive 
          ? 'border-primary bg-primary/5 scale-[1.02] shadow-colored' 
          : 'border-border hover:border-primary/50 hover:shadow-medium'
        }
        ${isLoading ? 'cursor-not-allowed opacity-70' : 'hover-lift'}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-4">
        {isLoading ? (
          <div className="relative">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
          </div>
        ) : (
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <FileText className="h-6 w-6 text-primary absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {isLoading ? 'Processing...' : isDragActive ? 'Drop files here' : 'Upload OpenAPI Specification'}
          </h3>
          
          {!isLoading && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Supports JSON, YAML, and YML formats
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to browse
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-3 right-3 w-12 h-12 bg-gradient-primary rounded-full opacity-10 blur-lg" />
      <div className="absolute bottom-3 left-3 w-8 h-8 bg-gradient-primary rounded-full opacity-20 blur-md" />
    </div>
  );
};
