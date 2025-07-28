
import { useState, useEffect, useCallback, useRef } from 'react';
import { parseSwaggerFile } from '../utils/swaggerParser';
import { TestGenerator } from '../utils/testGenerator';
import { LanguageGeneratorFactory } from '../generators/LanguageGeneratorFactory';
import { SupportedLanguage, TestFramework, PackageManager, GeneratedOutput } from '../types/languageTypes';
import { useToast } from './use-toast';
import { GenerationStatus } from '../components/GenerationProgress';
import { analyzeSpecComplexity, getProcessingSteps, SpecComplexity, ProcessingSteps } from '../utils/specAnalyzer';

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
  const [specComplexity, setSpecComplexity] = useState<SpecComplexity | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingSteps[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [actualProcessingTime, setActualProcessingTime] = useState<number>(0);
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

  const updateProgress = useCallback((stage: GenerationStatus['stage'], progress: number, currentStep: string, subProgress?: { current: number; total: number }) => {
    const elapsed = Date.now() - generationStartTime.current;
    setActualProcessingTime(elapsed);
    
    setGenerationStatus(prev => ({
      ...prev,
      stage,
      progress,
      currentStep,
      filesGenerated: subProgress?.current,
      totalFiles: subProgress?.total
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
    setCurrentStepIndex(0);
    
    try {
      // Execute processing steps dynamically
      let totalProgress = 0;
      const stepWeightSum = processingSteps.reduce((sum, step) => sum + step.weight, 0);
      
      for (let i = 0; i < processingSteps.length; i++) {
        const step = processingSteps[i];
        setCurrentStepIndex(i);
        
        if (signal.aborted) throw new Error('Generation cancelled');
        
        // Start step
        updateProgress(step.id as GenerationStatus['stage'], totalProgress, step.label);
        
        // Simulate processing based on complexity
        const chunks = Math.max(1, Math.floor(step.estimatedDuration / 100));
        for (let chunk = 0; chunk < chunks; chunk++) {
          if (signal.aborted) throw new Error('Generation cancelled');
          
          const chunkProgress = totalProgress + ((chunk + 1) / chunks) * step.weight * (100 / stepWeightSum);
          const subProgress = specComplexity?.endpointCount ? {
            current: Math.floor((chunk + 1) / chunks * specComplexity.endpointCount),
            total: specComplexity.endpointCount
          } : undefined;
          
          updateProgress(
            step.id as GenerationStatus['stage'], 
            Math.min(100, chunkProgress), 
            `${step.label}${subProgress ? ` (${subProgress.current}/${subProgress.total})` : ''}`,
            subProgress
          );
          
          await new Promise(resolve => setTimeout(resolve, step.estimatedDuration / chunks));
        }
        
        totalProgress += step.weight * (100 / stepWeightSum);
      }
      
      // Actual generation logic
      if (signal.aborted) throw new Error('Generation cancelled');
      
      const testGenerator = new TestGenerator();
      const testSuite = testGenerator.generateTestSuite(
        specData,
        generationSettings.language,
        generationSettings.framework as any,
        generationSettings.isProviderMode
      );

      if (signal.aborted) throw new Error('Generation cancelled');
      
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
      
      // Complete
      updateProgress('complete', 100, `Generated ${output.files.length} files successfully`, {
        current: output.files.length,
        total: output.files.length
      });
      
      setGeneratedOutput(output);
      setLastGenerationSettings({ ...generationSettings });
      setHasSettingsChanged(false);

      const actualTime = Date.now() - generationStartTime.current;
      toast({
        title: "Code Generated",
        description: `Generated ${output.files.length} files in ${Math.round(actualTime / 1000)}s`,
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
  }, [toast, updateProgress, processingSteps, specComplexity]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      updateProgress('parsing', 0, 'Uploading and parsing file...');
      
      const content = await file.text();
      const parsedSpec = await parseSwaggerFile(content, file.name);
      setSpec(parsedSpec);
      
      // Analyze spec complexity
      const complexity = analyzeSpecComplexity(parsedSpec);
      setSpecComplexity(complexity);
      
      // Generate dynamic processing steps
      const steps = getProcessingSteps(complexity);
      setProcessingSteps(steps);
      
      // Set realistic estimated time
      setEstimatedTime(complexity.estimatedProcessingTime);
      
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
    setSpecComplexity(null);
    setProcessingSteps([]);
    setCurrentStepIndex(0);
    setActualProcessingTime(0);
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
    specComplexity,
    processingSteps,
    currentStepIndex,
    actualProcessingTime,
    
    // Actions
    handleFileUpload,
    regenerateCode,
    updateSettings,
    reset,
    cancelGeneration,
  };
};
