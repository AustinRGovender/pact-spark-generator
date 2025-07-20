import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LANGUAGE_METADATA, SupportedLanguage, TestFramework, PackageManager } from '../types/languageTypes';
import { ExternalLink, Check } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  selectedFramework: TestFramework;
  selectedPackageManager: PackageManager;
  onLanguageChange: (language: SupportedLanguage) => void;
  onFrameworkChange: (framework: TestFramework) => void;
  onPackageManagerChange: (packageManager: PackageManager) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  selectedFramework,
  selectedPackageManager,
  onLanguageChange,
  onFrameworkChange,
  onPackageManagerChange,
}) => {
  const currentLanguageMetadata = LANGUAGE_METADATA[selectedLanguage];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Programming Language</h3>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(LANGUAGE_METADATA).map(([key, metadata]) => {
            const language = key as SupportedLanguage;
            const isSelected = selectedLanguage === language;
            
            return (
              <Card 
                key={language}
                className={`cursor-pointer transition-all hover:shadow-md min-h-[120px] ${
                  isSelected ? 'ring-2 ring-primary shadow-colored' : ''
                }`}
                onClick={() => onLanguageChange(language)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl flex-shrink-0">{metadata.icon}</span>
                      <CardTitle className="text-lg font-semibold">{metadata.displayName}</CardTitle>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {metadata.defaultFramework}
                    </Badge>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {metadata.defaultPackageManager}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground font-medium">Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {metadata.features.supportsAsync && (
                        <Badge variant="outline" className="text-xs">Async</Badge>
                      )}
                      {metadata.features.hasGenerics && (
                        <Badge variant="outline" className="text-xs">Generics</Badge>
                      )}
                      {metadata.features.hasNullSafety && (
                        <Badge variant="outline" className="text-xs">Null Safety</Badge>
                      )}
                      {metadata.features.hasAnnotations && (
                        <Badge variant="outline" className="text-xs">Annotations</Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start p-2 h-auto text-xs text-primary hover:text-primary-hover hover:bg-primary/5"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(metadata.documentation, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">Documentation</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {currentLanguageMetadata && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Configure {currentLanguageMetadata.displayName}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Framework</label>
              <Select 
                value={selectedFramework} 
                onValueChange={onFrameworkChange as (value: string) => void}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select test framework" />
                </SelectTrigger>
                <SelectContent>
                  {currentLanguageMetadata.supportedFrameworks.map((framework) => (
                    <SelectItem key={framework} value={framework}>
                      <div className="flex items-center space-x-2 w-full">
                        <span className="flex-1 truncate">{framework}</span>
                        {framework === currentLanguageMetadata.defaultFramework && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Package Manager</label>
              <Select 
                value={selectedPackageManager} 
                onValueChange={onPackageManagerChange as (value: string) => void}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select package manager" />
                </SelectTrigger>
                <SelectContent>
                  {currentLanguageMetadata.supportedPackageManagers.map((packageManager) => (
                    <SelectItem key={packageManager} value={packageManager}>
                      <div className="flex items-center space-x-2 w-full">
                        <span className="flex-1 truncate">{packageManager}</span>
                        {packageManager === currentLanguageMetadata.defaultPackageManager && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Language Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-muted-foreground">File Extension:</span>
                  <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                    {currentLanguageMetadata.fileExtension}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-muted-foreground">Default Framework:</span>
                  <span className="bg-muted px-2 py-1 rounded text-sm">
                    {currentLanguageMetadata.defaultFramework}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="font-medium text-sm text-muted-foreground">Supported Frameworks:</span>
                <div className="flex flex-wrap gap-2">
                  {currentLanguageMetadata.supportedFrameworks.map((framework) => (
                    <Badge key={framework} variant="outline" className="text-xs">
                      {framework}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-medium text-sm text-muted-foreground">Package Managers:</span>
                <div className="flex flex-wrap gap-2">
                  {currentLanguageMetadata.supportedPackageManagers.map((pm) => (
                    <Badge key={pm} variant="outline" className="text-xs">
                      {pm}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};