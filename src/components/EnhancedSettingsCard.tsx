
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { LanguageSelector } from './LanguageSelector';
import { RegenerationPanel } from './RegenerationPanel';
import { Settings, RotateCcw } from 'lucide-react';
import { SupportedLanguage, TestFramework, PackageManager } from '../types/languageTypes';

interface EnhancedSettingsCardProps {
  selectedLanguage: SupportedLanguage;
  selectedFramework: TestFramework;
  selectedPackageManager: PackageManager;
  isProviderMode: boolean;
  onLanguageChange: (language: SupportedLanguage) => void;
  onFrameworkChange: (framework: TestFramework) => void;
  onPackageManagerChange: (packageManager: PackageManager) => void;
  onProviderModeChange: (isProviderMode: boolean) => void;
  onReset: () => void;
  hasSettingsChanged: boolean;
  isLoading: boolean;
  onRegenerate: () => void;
  autoRegenerate: boolean;
  onAutoRegenerateChange: (enabled: boolean) => void;
  generatedFilesCount?: number;
}

export const EnhancedSettingsCard: React.FC<EnhancedSettingsCardProps> = ({
  selectedLanguage,
  selectedFramework,
  selectedPackageManager,
  isProviderMode,
  onLanguageChange,
  onFrameworkChange,
  onPackageManagerChange,
  onProviderModeChange,
  onReset,
  hasSettingsChanged,
  isLoading,
  onRegenerate,
  autoRegenerate,
  onAutoRegenerateChange,
  generatedFilesCount = 0,
}) => {
  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <CardTitle className="flex items-center space-x-2">
                <span>Settings</span>
                {hasSettingsChanged && generatedFilesCount > 0 && (
                  <Badge variant="outline" className="text-xs animate-pulse border-amber-300 text-amber-600">
                    Changed
                  </Badge>
                )}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Provider Mode</div>
              <div className="text-xs text-muted-foreground">
                Generate provider verification tests
              </div>
            </div>
            <Switch
              checked={isProviderMode}
              onCheckedChange={onProviderModeChange}
            />
          </div>
          
          <Separator />
          
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            selectedFramework={selectedFramework}
            selectedPackageManager={selectedPackageManager}
            onLanguageChange={onLanguageChange}
            onFrameworkChange={onFrameworkChange}
            onPackageManagerChange={onPackageManagerChange}
          />
        </CardContent>
      </Card>

      {generatedFilesCount > 0 && (
        <RegenerationPanel
          hasSettingsChanged={hasSettingsChanged}
          isLoading={isLoading}
          onRegenerate={onRegenerate}
          autoRegenerate={autoRegenerate}
          onAutoRegenerateChange={onAutoRegenerateChange}
          generatedFilesCount={generatedFilesCount}
        />
      )}
    </div>
  );
};
