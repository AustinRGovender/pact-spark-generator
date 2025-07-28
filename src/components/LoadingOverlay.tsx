import React from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { X, Code, FileText, Settings, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  active: boolean;
}

interface LoadingOverlayProps {
  isVisible: boolean;
  progress: number;
  currentStep: string;
  steps: LoadingStep[];
  onCancel?: () => void;
  estimatedTime?: number;
  actualTime?: number;
  canCancel?: boolean;
  processingRate?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  progress,
  currentStep,
  steps,
  onCancel,
  estimatedTime,
  actualTime,
  canCancel = true,
  processingRate
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg shadow-lg p-8 max-w-md w-full mx-4 animate-scale-in">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Generating Code
            </h3>
            {canCancel && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Current Step</p>
            <p className="text-foreground font-medium">{currentStep}</p>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center space-x-3 p-2 rounded-md transition-colors",
                  step.active && "bg-primary/10",
                  step.completed && "bg-green-500/10"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                  step.completed && "bg-green-500 text-white",
                  step.active && "bg-primary text-primary-foreground",
                  !step.active && !step.completed && "bg-muted text-muted-foreground"
                )}>
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "text-sm",
                  step.active && "text-foreground font-medium",
                  step.completed && "text-green-600 dark:text-green-400",
                  !step.active && !step.completed && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Time Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {actualTime && actualTime > 0 && (
              <div className="text-center text-muted-foreground">
                Elapsed: {Math.ceil(actualTime / 1000)}s
              </div>
            )}
            {estimatedTime && estimatedTime > 0 && actualTime && (
              <div className="text-center text-muted-foreground">
                Remaining: ~{Math.max(0, Math.ceil((estimatedTime - actualTime) / 1000))}s
              </div>
            )}
          </div>
          
          {processingRate && (
            <div className="text-center text-sm text-muted-foreground">
              {processingRate}
            </div>
          )}

          {/* Loading Animation */}
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};