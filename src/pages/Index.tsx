import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { CodePreview } from "../components/CodePreview";
import { LoadingOverlay } from '../components/LoadingOverlay';
import { GenerationProgress } from '../components/GenerationProgress';
import { Layout } from '../components/Layout';
import { ThemeProvider } from '../components/ThemeProvider';
import { EnhancedSettingsCard } from '../components/EnhancedSettingsCard';
import { SpecComplexityAlert } from '../components/SpecComplexityAlert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useCodeGeneration } from '../hooks/useCodeGeneration';
import { shouldShowLargeSpecWarning } from '../utils/specAnalyzer';
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Code2,
  FileCheck,
  TrendingUp,
  Clock,
  Trash2,
  FileText,
  Settings,
  Database,
  Layers,
  Cpu,
  Package,
  CheckCircle
} from 'lucide-react';

const Index = () => {
  const [autoRegenerate, setAutoRegenerate] = useState(true);
  
  const {
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
    handleFileUpload,
    regenerateCode,
    updateSettings,
    reset,
    cancelGeneration,
  } = useCodeGeneration({ autoRegenerate });

  // Generate dynamic loading steps based on processing steps
  const loadingSteps = processingSteps.map((step, index) => {
    const isCompleted = currentStepIndex > index || generationStatus.stage === 'complete';
    const isActive = currentStepIndex === index && generationStatus.stage !== 'complete' && generationStatus.stage !== 'idle';
    
    const iconMap: Record<string, React.ReactNode> = {
      parsing: <FileText className="h-4 w-4" />,
      analyzing: <Settings className="h-4 w-4" />,
      'schema-processing': <Database className="h-4 w-4" />,
      'endpoint-batching': <Layers className="h-4 w-4" />,
      'memory-management': <Cpu className="h-4 w-4" />,
      generating: <Code2 className="h-4 w-4" />,
      'chunked-processing': <Package className="h-4 w-4" />,
      formatting: <CheckCircle className="h-4 w-4" />
    };
    
    return {
      id: step.id,
      label: step.label,
      icon: iconMap[step.id] || <Settings className="h-4 w-4" />,
      completed: isCompleted,
      active: isActive
    };
  });
  
  // Calculate processing rate
  const processingRate = specComplexity && actualProcessingTime > 1000 
    ? `${Math.round((generationStatus.filesGenerated || 0) / (actualProcessingTime / 1000))} files/sec`
    : undefined;

  return (
    <ThemeProvider defaultTheme="system">
      <Layout>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6 py-12">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full glass-panel border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm font-medium text-primary">
                  Enterprise-grade contract testing
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
                <span className="gradient-text">Advanced Pact</span>
                <br />
                <span className="text-foreground">Test Generator</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transform your OpenAPI specifications into production-ready contract tests 
                across multiple programming languages with enterprise-grade reliability.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              {[
                { icon: Zap, text: "Lightning Fast" },
                { icon: Shield, text: "100% Client-side" },
                { icon: Code2, text: "Multi-language" },
                { icon: FileCheck, text: "Enterprise Ready" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 glass-panel px-4 py-2 rounded-lg">
                  <feature.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generation Progress */}
          {generationStatus.stage !== 'idle' && (
            <GenerationProgress status={generationStatus} />
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Configuration */}
            <div className="xl:col-span-1 space-y-6">
              {/* File Upload */}
              <Card className="glass-card shadow-medium hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span>Upload Specification</span>
                  </CardTitle>
                  <CardDescription>
                    Drop your OpenAPI/Swagger files to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploader onFilesUpload={handleFileUpload} isLoading={isLoading} />
                </CardContent>
              </Card>

              {/* Spec Complexity Alert */}
              {specComplexity && shouldShowLargeSpecWarning(specComplexity) && (
                <SpecComplexityAlert complexity={specComplexity} />
              )}

              {/* Enhanced Settings */}
              <EnhancedSettingsCard
                selectedLanguage={settings.language}
                selectedFramework={settings.framework}
                selectedPackageManager={settings.packageManager}
                isProviderMode={settings.isProviderMode}
                onLanguageChange={(language) => updateSettings({ language })}
                onFrameworkChange={(framework) => updateSettings({ framework })}
                onPackageManagerChange={(packageManager) => updateSettings({ packageManager })}
                onProviderModeChange={(isProviderMode) => updateSettings({ isProviderMode })}
                onReset={reset}
                hasSettingsChanged={hasSettingsChanged}
                isLoading={isLoading}
                onRegenerate={regenerateCode}
                autoRegenerate={autoRegenerate}
                onAutoRegenerateChange={setAutoRegenerate}
                generatedFilesCount={generatedOutput?.files.length || 0}
              />
            </div>

            {/* Right Column - Code Preview */}
            <div className="xl:col-span-2">
              <Card className="glass-card shadow-large h-[800px]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Code2 className="h-5 w-5" />
                        <span>Generated Code</span>
                        {hasSettingsChanged && generatedOutput && (
                          <Badge variant="outline" className="animate-pulse border-amber-300 text-amber-600">
                            Settings Changed
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Preview and download your contract tests
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {generatedOutput && (
                        <>
                          <Badge variant="secondary" className="animate-pulse">
                            {generatedOutput.files.length} files generated
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={reset}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-full">
                  <CodePreview
                    generatedOutput={generatedOutput}
                    language={settings.language}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        <LoadingOverlay
          isVisible={isLoading}
          progress={generationStatus.progress}
          currentStep={generationStatus.currentStep}
          steps={loadingSteps}
          onCancel={cancelGeneration}
          estimatedTime={estimatedTime}
          actualTime={actualProcessingTime}
          processingRate={processingRate}
          canCancel={generationStatus.stage !== 'complete'}
        />
      </Layout>
    </ThemeProvider>
  );
};

export default Index;
