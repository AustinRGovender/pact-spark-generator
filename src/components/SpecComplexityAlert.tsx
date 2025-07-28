import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { AlertTriangle, Clock, FileText, Settings } from 'lucide-react';
import { SpecComplexity, formatProcessingTime } from '../utils/specAnalyzer';

interface SpecComplexityAlertProps {
  complexity: SpecComplexity;
  onProceed?: () => void;
  onCancel?: () => void;
}

export const SpecComplexityAlert: React.FC<SpecComplexityAlertProps> = ({
  complexity,
  onProceed,
  onCancel
}) => {
  const getSizeColor = (size: SpecComplexity['size']) => {
    switch (size) {
      case 'small': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'large': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'xl': return 'bg-red-500/10 text-red-700 dark:text-red-400';
    }
  };

  const getSizeLabel = (size: SpecComplexity['size']) => {
    switch (size) {
      case 'small': return 'Small';
      case 'medium': return 'Medium';
      case 'large': return 'Large';
      case 'xl': return 'Extra Large';
    }
  };

  if (complexity.size === 'small') return null;

  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Specification Analysis
        <Badge variant="outline" className={getSizeColor(complexity.size)}>
          {getSizeLabel(complexity.size)}
        </Badge>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{complexity.endpointCount} endpoints</span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>{complexity.schemaCount} schemas</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>~{formatProcessingTime(complexity.estimatedProcessingTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Complexity:</span>
            <span>{complexity.complexity}</span>
          </div>
        </div>
        
        {complexity.warnings.length > 0 && (
          <div className="space-y-1">
            {complexity.warnings.map((warning, index) => (
              <div key={index} className="text-sm text-orange-600 dark:text-orange-400">
                • {warning}
              </div>
            ))}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          Processing will be optimized for this specification size. You can cancel at any time during generation.
        </div>
      </AlertDescription>
    </Alert>
  );
};