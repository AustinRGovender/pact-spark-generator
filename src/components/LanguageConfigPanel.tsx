
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Code2, Package, Wrench } from 'lucide-react';
import { SupportedLanguage, TestFramework, PackageManager, LanguageConfig } from '../types/testModels';
import { SUPPORTED_LANGUAGES, getFrameworksForLanguage, getDefaultFrameworkForLanguage } from '../utils/pactGenerator';

interface LanguageConfigPanelProps {
  config: LanguageConfig;
  onChange: (config: LanguageConfig) => void;
  className?: string;
}

export const LanguageConfigPanel: React.FC<LanguageConfigPanelProps> = ({
  config,
  onChange,
  className = ""
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleLanguageChange = (language: SupportedLanguage) => {
    const defaultFramework = getDefaultFrameworkForLanguage(language);
    const defaultPackageManager = getDefaultPackageManagerForLanguage(language);
    
    onChange({
      ...config,
      language,
      framework: defaultFramework,
      packageManager: defaultPackageManager
    });
  };

  const handleFrameworkChange = (framework: TestFramework) => {
    onChange({ ...config, framework });
  };

  const handlePackageManagerChange = (packageManager: PackageManager) => {
    onChange({ ...config, packageManager });
  };

  const getDefaultPackageManagerForLanguage = (language: SupportedLanguage): PackageManager => {
    switch (language) {
      case 'javascript': return 'npm';
      case 'java': return 'maven';
      case 'csharp': return 'nuget';
      case 'python': return 'pip';
      case 'go': return 'go-mod';
      default: return 'npm';
    }
  };

  const getPackageManagersForLanguage = (language: SupportedLanguage): PackageManager[] => {
    switch (language) {
      case 'javascript': return ['npm', 'yarn', 'pnpm'];
      case 'java': return ['maven', 'gradle'];
      case 'csharp': return ['nuget'];
      case 'python': return ['pip'];
      case 'go': return ['go-mod'];
      default: return ['npm'];
    }
  };

  const getLanguageIcon = (language: SupportedLanguage) => {
    const icons = {
      javascript: '🟨',
      java: '☕',
      csharp: '🔷',
      python: '🐍',
      go: '🐹'
    };
    return icons[language] || '📄';
  };

  const getLanguageDescription = (language: SupportedLanguage) => {
    const descriptions = {
      javascript: 'Node.js with PactJS - Most mature implementation',
      java: 'Spring Boot with Pact JVM - Enterprise ready',
      csharp: '.NET Core with PactNet - Microsoft stack',
      python: 'Python with pact-python - Data science friendly',
      go: 'Go with Pact Go - High performance'
    };
    return descriptions[language] || 'Programming language support';
  };

  return (
    <Card className={`bg-white/70 backdrop-blur-xl border-white/20 shadow-xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Code2 className="h-5 w-5" />
          Language Configuration
        </CardTitle>
        <CardDescription className="text-slate-600">
          Choose your target language and testing framework
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Programming Language</Label>
          <Select value={config.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="bg-white/50 border-white/30">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((language) => (
                <SelectItem key={language} value={language}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getLanguageIcon(language)}</span>
                    <div>
                      <div className="font-medium capitalize">{language}</div>
                      <div className="text-xs text-slate-500">
                        {getLanguageDescription(language)}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Framework Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Testing Framework</Label>
          <Select value={config.framework} onValueChange={handleFrameworkChange}>
            <SelectTrigger className="bg-white/50 border-white/30">
              <SelectValue placeholder="Select framework" />
            </SelectTrigger>
            <SelectContent>
              {getFrameworksForLanguage(config.language).map((framework) => (
                <SelectItem key={framework} value={framework}>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{framework}</span>
                    {framework === getDefaultFrameworkForLanguage(config.language) && (
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Package Manager Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Package Manager</Label>
          <Select value={config.packageManager} onValueChange={handlePackageManagerChange}>
            <SelectTrigger className="bg-white/50 border-white/30">
              <SelectValue placeholder="Select package manager" />
            </SelectTrigger>
            <SelectContent>
              {getPackageManagersForLanguage(config.language).map((manager) => (
                <SelectItem key={manager} value={manager}>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="capitalize">{manager.replace('-', ' ')}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="pt-4 border-t border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-slate-600 hover:text-slate-800"
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced Settings
          </Button>
        </div>

        {/* Advanced Settings Panel */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-slate-50/50 rounded-lg border border-white/30">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Code Style</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600">Indentation</Label>
                  <Select 
                    value={config.codeStyle.indentation} 
                    onValueChange={(value: 'spaces' | 'tabs') => 
                      onChange({
                        ...config,
                        codeStyle: { ...config.codeStyle, indentation: value }
                      })
                    }
                  >
                    <SelectTrigger className="bg-white/50 border-white/30 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spaces">Spaces</SelectItem>
                      <SelectItem value="tabs">Tabs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Indent Size</Label>
                  <Select 
                    value={config.codeStyle.indentSize.toString()} 
                    onValueChange={(value) => 
                      onChange({
                        ...config,
                        codeStyle: { ...config.codeStyle, indentSize: parseInt(value) }
                      })
                    }
                  >
                    <SelectTrigger className="bg-white/50 border-white/30 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Naming Convention</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600">Test Classes</Label>
                  <Select 
                    value={config.namingConvention.testClasses} 
                    onValueChange={(value: any) => 
                      onChange({
                        ...config,
                        namingConvention: { ...config.namingConvention, testClasses: value }
                      })
                    }
                  >
                    <SelectTrigger className="bg-white/50 border-white/30 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PascalCase">PascalCase</SelectItem>
                      <SelectItem value="camelCase">camelCase</SelectItem>
                      <SelectItem value="snake_case">snake_case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Variables</Label>
                  <Select 
                    value={config.namingConvention.variables} 
                    onValueChange={(value: any) => 
                      onChange({
                        ...config,
                        namingConvention: { ...config.namingConvention, variables: value }
                      })
                    }
                  >
                    <SelectTrigger className="bg-white/50 border-white/30 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PascalCase">PascalCase</SelectItem>
                      <SelectItem value="camelCase">camelCase</SelectItem>
                      <SelectItem value="snake_case">snake_case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
