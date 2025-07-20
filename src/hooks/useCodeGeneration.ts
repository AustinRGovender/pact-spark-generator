
import { useState, useEffect, useCallback } from 'react';
import { parseSwaggerFile } from '../utils/swaggerParser';
import { TestGenerator } from '../utils/testGenerator';
import { LanguageGeneratorFactory } from '../generators/LanguageGeneratorFactory';
import { SupportedLanguage, TestFramework, PackageManager, GeneratedOutput } from '../types/languageTypes';
import { useToast } from './use-toast';

interface GenerationSettings {
  language: SupportedLanguage;
  framework: TestFramework;
  packageManager: PackageManager;
  isProviderMode: boolean;
}

interface UseCodeGenerationProps {
  autoRegenerate?: boolean;
}

export const useCodeGeneration = ({ autoRegenerate = true }: UseCodeGenerationProps = {}) => {
  const [spec, setSpec] = useState<any>(null);
  const [generatedOutput, setGeneratedOutput] = useState<GeneratedOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>({
    language: 'javascript',
    framework: 'jest',
    packageManager: 'npm',
    isProviderMode: false,
  });
  const [lastGenerationSettings, setLastGenerationSettings] = useState<GenerationSettings | null>(null);
  const [hasSettingsChanged, setHasSettingsChanged] = useState(false);
  const { toast } = useToast();

  // Check if settings have changed since last generation
  useEffect(() => {
    if (lastGenerationSettings && generatedOutput) {
      const changed = Object.keys(settings).some(
        key => settings[key as keyof GenerationSettings] !== lastGenerationSettings[key as keyof GenerationSettings]
      );
      setHasSettingsChanged(changed);
    }
  }, [settings, lastGenerationSettings, generatedOutput]);

  const generateCode = useCallback(async (specData: any, generationSettings: GenerationSettings) => {
    if (!specData) return null;

    setIsLoading(true);
    try {
      const testGenerator = new TestGenerator();
      const testSuite = testGenerator.generateTestSuite(
        specData,
        generationSettings.language,
        generationSettings.framework as any,
        generationSettings.isProviderMode
      );

      const output = LanguageGeneratorFactory.generateTests(testSuite, {
        language: generationSettings.language,
        framework: generationSettings.framework,
        packageManager: generationSettings.packageManager,
        buildTool: undefined,
        version: '1.0.0',
        customSettings: {},
        namingConvention: {
          testClasses: 'PascalCase',
          testMethods: 'camelCase',
          variables: 'camelCase',
          constants: 'UPPER_CASE'
        },
        codeStyle: {
          indentation: 'spaces',
          indentSize: 2,
          maxLineLength: 100,
          semicolons: true,
          quotes: 'single'
        }
      });

      setGeneratedOutput(output);
      setLastGenerationSettings({ ...generationSettings });
      setHasSettingsChanged(false);

      toast({
        title: "Code Generated",
        description: `Generated ${output.files.length} files for ${generationSettings.language}`,
      });

      return output;
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate code with current settings",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const content = await file.text();
      const parsedSpec = await parseSwaggerFile(content, file.name);
      setSpec(parsedSpec);
      
      // Auto-generate with current settings
      await generateCode(parsedSpec, settings);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to parse the uploaded file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [generateCode, settings, toast]);

  const regenerateCode = useCallback(async () => {
    if (spec) {
      await generateCode(spec, settings);
    }
  }, [spec, settings, generateCode]);

  // Auto-regenerate when settings change (if enabled and spec exists)
  useEffect(() => {
    if (autoRegenerate && spec && lastGenerationSettings && hasSettingsChanged) {
      const timeoutId = setTimeout(() => {
        regenerateCode();
      }, 500); // Debounce regeneration

      return () => clearTimeout(timeoutId);
    }
  }, [autoRegenerate, spec, hasSettingsChanged, regenerateCode]);

  const updateSettings = useCallback((newSettings: Partial<GenerationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const reset = useCallback(() => {
    setSpec(null);
    setGeneratedOutput(null);
    setLastGenerationSettings(null);
    setHasSettingsChanged(false);
    setSettings({
      language: 'javascript',
      framework: 'jest',
      packageManager: 'npm',
      isProviderMode: false,
    });
    toast({
      title: "Reset Complete",
      description: "All settings and generated code have been cleared",
    });
  }, [toast]);

  return {
    // State
    spec,
    generatedOutput,
    isLoading,
    settings,
    hasSettingsChanged,
    
    // Actions
    handleFileUpload,
    regenerateCode,
    updateSettings,
    reset,
  };
};
