
import { useState, useEffect, useCallback, useRef } from 'react';
import { parseSwaggerFile } from '../utils/swaggerParser';
import { TestGenerator } from '../utils/testGenerator';
import { LanguageGeneratorFactory } from '../generators/LanguageGeneratorFactory';
import { SupportedLanguage, TestFramework, PackageManager, GeneratedOutput } from '../types/languageTypes';
import { useToast } from './use-toast';
import { GenerationStatus } from '../components/GenerationProgress';

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
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    stage: 'idle',
    progress: 0,
    currentStep: 'Ready to generate'
  });
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const generationStartTime = useRef<number>(0);
  const abortController = useRef<AbortController | null>(null);
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

  const updateProgress = useCallback((stage: GenerationStatus['stage'], progress: number, currentStep: string) => {
    setGenerationStatus(prev => ({
      ...prev,
      stage,
      progress,
      currentStep
    }));
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setIsLoading(false);
      setGenerationStatus({
        stage: 'idle',
        progress: 0,
        currentStep: 'Generation cancelled'
      });
      toast({
        title: "Generation Cancelled",
        description: "Code generation was cancelled by user",
        variant: "destructive",
      });
    }
  }, [toast]);

  const generateCode = useCallback(async (specData: any, generationSettings: GenerationSettings) => {
    if (!specData) return null;

    // Create new abort controller for this generation
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    setIsLoading(true);
    generationStartTime.current = Date.now();
    
    try {
      // Stage 1: Parsing (0-20%)
      updateProgress('parsing', 0, 'Parsing OpenAPI specification...');
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing time
      
      if (signal.aborted) throw new Error('Generation cancelled');
      updateProgress('parsing', 20, 'Specification parsed successfully');

      // Stage 2: Analyzing (20-40%)
      updateProgress('analyzing', 25, 'Analyzing API structure...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (signal.aborted) throw new Error('Generation cancelled');
      updateProgress('analyzing', 40, 'Structure analysis complete');

      // Stage 3: Generating (40-80%)
      updateProgress('generating', 45, 'Generating test suite...');
      const testGenerator = new TestGenerator();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      if (signal.aborted) throw new Error('Generation cancelled');
      
      updateProgress('generating', 60, 'Creating test cases...');
      const testSuite = testGenerator.generateTestSuite(
        specData,
        generationSettings.language,
        generationSettings.framework as any,
        generationSettings.isProviderMode
      );

      if (signal.aborted) throw new Error('Generation cancelled');
      updateProgress('generating', 75, 'Generating code files...');
      
      await new Promise(resolve => setTimeout(resolve, 200));

      // Stage 4: Formatting (80-100%)
      updateProgress('formatting', 80, 'Formatting generated code...');
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

      if (signal.aborted) throw new Error('Generation cancelled');
      
      updateProgress('formatting', 95, 'Finalizing output...');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Complete
      updateProgress('complete', 100, `Generated ${output.files.length} files successfully`);
      
      setGeneratedOutput(output);
      setLastGenerationSettings({ ...generationSettings });
      setHasSettingsChanged(false);

      toast({
        title: "Code Generated",
        description: `Generated ${output.files.length} files for ${generationSettings.language}`,
      });

      // Reset to idle after a brief delay
      setTimeout(() => {
        setGenerationStatus({
          stage: 'idle',
          progress: 0,
          currentStep: 'Ready to generate'
        });
      }, 2000);

      return output;
    } catch (error) {
      console.error('Error generating code:', error);
      
      if (signal.aborted) {
        updateProgress('idle', 0, 'Generation cancelled');
        return null;
      }
      
      updateProgress('error', 0, 'Generation failed');
      toast({
        title: "Generation Error",
        description: "Failed to generate code with current settings",
        variant: "destructive",
      });
      
      // Reset to idle after error
      setTimeout(() => {
        setGenerationStatus({
          stage: 'idle',
          progress: 0,
          currentStep: 'Ready to generate'
        });
      }, 3000);
      
      return null;
    } finally {
      setIsLoading(false);
      abortController.current = null;
    }
  }, [toast, updateProgress]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      updateProgress('parsing', 0, 'Uploading and parsing file...');
      
      const content = await file.text();
      const parsedSpec = await parseSwaggerFile(content, file.name);
      setSpec(parsedSpec);
      
      // Estimate generation time based on file size
      const estimatedMs = Math.min(Math.max(file.size / 100, 2000), 10000);
      setEstimatedTime(estimatedMs);
      
      // Auto-generate with current settings
      await generateCode(parsedSpec, settings);
    } catch (error) {
      console.error('Error parsing file:', error);
      updateProgress('error', 0, 'Failed to parse file');
      toast({
        title: "Upload Error",
        description: "Failed to parse the uploaded file",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setGenerationStatus({
          stage: 'idle',
          progress: 0,
          currentStep: 'Ready to generate'
        });
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  }, [generateCode, settings, toast, updateProgress]);

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
    // Cancel any ongoing generation
    if (abortController.current) {
      abortController.current.abort();
    }
    
    setSpec(null);
    setGeneratedOutput(null);
    setLastGenerationSettings(null);
    setHasSettingsChanged(false);
    setIsLoading(false);
    setGenerationStatus({
      stage: 'idle',
      progress: 0,
      currentStep: 'Ready to generate'
    });
    setEstimatedTime(0);
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
    generationStatus,
    estimatedTime,
    
    // Actions
    handleFileUpload,
    regenerateCode,
    updateSettings,
    reset,
    cancelGeneration,
  };
};
