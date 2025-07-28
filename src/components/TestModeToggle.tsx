
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code2 } from 'lucide-react';
import { SupportedLanguage, TestFramework } from '../types/testModels';
import { SUPPORTED_LANGUAGES, getFrameworksForLanguage } from '../utils/pactGenerator';

interface TestModeToggleProps {
  isProviderMode: boolean;
  onToggle: (isProviderMode: boolean) => void;
  language?: SupportedLanguage;
  framework?: TestFramework;
  onLanguageChange?: (language: SupportedLanguage) => void;
  onFrameworkChange?: (framework: TestFramework) => void;
}

export const TestModeToggle: React.FC<TestModeToggleProps> = ({
  isProviderMode,
  onToggle,
  language = 'javascript',
  framework = 'jest',
  onLanguageChange,
  onFrameworkChange,
}) => {
  const getLanguageIcon = (lang: SupportedLanguage) => {
    const icons = {
      javascript: '🟨',
      java: '☕',
      csharp: '🔷',
      python: '🐍',
      go: '🐹'
    };
    return icons[lang] || '📄';
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 shadow-lg p-3 sm:p-4">
      {/* Mode Toggle */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <Label htmlFor="test-mode" className="text-slate-700 font-medium text-xs sm:text-sm">
          Consumer Mode
        </Label>
        <Switch
          id="test-mode"
          checked={isProviderMode}
          onCheckedChange={onToggle}
          size="lg"
        />
        <Label htmlFor="test-mode" className="text-slate-700 font-medium text-xs sm:text-sm">
          Provider Mode
        </Label>
      </div>

      {/* Language Selection */}
      {onLanguageChange && (
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="h-4 w-4 text-slate-600 flex-shrink-0" />
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="bg-white/50 border-white/30 h-8 min-w-[120px]">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{getLanguageIcon(language)}</span>
                  <span className="capitalize text-xs">{language}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  <div className="flex items-center gap-2">
                    <span>{getLanguageIcon(lang)}</span>
                    <span className="capitalize">{lang}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Framework Selection */}
      {onFrameworkChange && (
        <div className="flex items-center gap-2 min-w-0">
          <Select value={framework} onValueChange={onFrameworkChange}>
            <SelectTrigger className="bg-white/50 border-white/30 h-8 min-w-[80px]">
              <SelectValue>
                <span className="capitalize text-xs">{framework}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {getFrameworksForLanguage(language).map((fw) => (
                <SelectItem key={fw} value={fw}>
                  <span className="capitalize">{fw}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
