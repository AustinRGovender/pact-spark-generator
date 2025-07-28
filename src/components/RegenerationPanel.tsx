
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, Settings2, AlertTriangle, Check } from 'lucide-react';

interface RegenerationPanelProps {
  hasSettingsChanged: boolean;
  isLoading: boolean;
  onRegenerate: () => void;
  autoRegenerate: boolean;
  onAutoRegenerateChange: (enabled: boolean) => void;
  generatedFilesCount?: number;
}

export const RegenerationPanel: React.FC<RegenerationPanelProps> = ({
  hasSettingsChanged,
  isLoading,
  onRegenerate,
  autoRegenerate,
  onAutoRegenerateChange,
  generatedFilesCount = 0,
}) => {
  if (!generatedFilesCount) return null;

  return (
    <Card className="glass-card border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Generation Settings</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={hasSettingsChanged ? "destructive" : "secondary"} className="text-xs">
              {hasSettingsChanged ? "Outdated" : "Current"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hasSettingsChanged && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              Your settings have changed since the last generation. 
              {autoRegenerate ? " Code will regenerate automatically." : " Click regenerate to update the code."}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Auto-regenerate</div>
            <div className="text-xs text-muted-foreground">
              Automatically update code when settings change
            </div>
          </div>
          <Switch
            checked={autoRegenerate}
            onCheckedChange={onAutoRegenerateChange}
            size="lg"
          />
        </div>

        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">
              {generatedFilesCount} files generated
            </span>
          </div>
          
          <Button
            onClick={onRegenerate}
            disabled={isLoading || (autoRegenerate && !hasSettingsChanged)}
            size="sm"
            variant={hasSettingsChanged ? "default" : "ghost"}
            className={hasSettingsChanged ? "animate-pulse" : ""}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Generating...' : 'Regenerate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
