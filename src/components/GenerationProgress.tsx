import React from 'react';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { Code, FileText, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GenerationStatus {
  stage: 'idle' | 'parsing' | 'analyzing' | 'generating' | 'formatting' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  filesGenerated?: number;
  totalFiles?: number;
  error?: string;
}

interface GenerationProgressProps {
  status: GenerationStatus;
  compact?: boolean;
}

const stageInfo = {
  idle: { icon: Settings, label: 'Ready', color: 'text-muted-foreground' },
  parsing: { icon: FileText, label: 'Parsing specification', color: 'text-blue-500' },
  analyzing: { icon: Settings, label: 'Analyzing structure', color: 'text-yellow-500' },
  generating: { icon: Code, label: 'Generating tests', color: 'text-orange-500' },
  formatting: { icon: CheckCircle, label: 'Formatting code', color: 'text-green-500' },
  complete: { icon: CheckCircle, label: 'Complete', color: 'text-green-500' },
  error: { icon: AlertCircle, label: 'Error occurred', color: 'text-red-500' }
};

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  status,
  compact = false
}) => {
  const { stage, progress, currentStep, filesGenerated, totalFiles, error } = status;
  const { icon: Icon, label, color } = stageInfo[stage];

  if (stage === 'idle') {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Icon className={cn("h-4 w-4 animate-spin", color)} />
        <span className="text-muted-foreground">{currentStep}</span>
        <span className="text-foreground font-medium">{Math.round(progress)}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-card border rounded-lg">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Icon className={cn("h-5 w-5", color, stage !== 'complete' && "animate-spin")} />
        <span className="font-medium text-foreground">{label}</span>
        {stage === 'error' && error && (
          <span className="text-sm text-red-500">({error})</span>
        )}
      </div>

      {/* Progress Bar */}
      {stage !== 'complete' && stage !== 'error' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{currentStep}</span>
            <span className="text-foreground font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* File Progress */}
      {filesGenerated !== undefined && totalFiles !== undefined && (
        <div className="text-sm text-muted-foreground">
          Generated {filesGenerated} of {totalFiles} files
        </div>
      )}

      {/* Loading Skeleton for Code Preview */}
      {stage === 'generating' && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
    </div>
  );
};