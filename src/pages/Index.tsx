import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { LanguageSelector } from "../components/LanguageSelector";
import { CodePreview } from "../components/CodePreview";
import { ShaderBackground } from '../components/ShaderBackground';
import { Layout } from '../components/Layout';
import { ThemeProvider } from '../components/ThemeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { parseSwaggerFile } from '../utils/swaggerParser';
import { TestGenerator } from "../utils/testGenerator";
import { LanguageGeneratorFactory } from "../generators/LanguageGeneratorFactory";
import { SupportedLanguage, TestFramework, PackageManager, GeneratedOutput } from "../types/languageTypes";
import { useToast } from '../hooks/use-toast';
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Code2,
  FileCheck,
  Settings,
  TrendingUp,
  Clock,
  RotateCcw,
  Trash2
} from 'lucide-react';

const Index = () => {
  const [spec, setSpec] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [selectedFramework, setSelectedFramework] = useState<TestFramework>('jest');
  const [selectedPackageManager, setSelectedPackageManager] = useState<PackageManager>('npm');
  const [generatedOutput, setGeneratedOutput] = useState<GeneratedOutput | null>(null);
  const [isProviderMode, setIsProviderMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFilesUpload = async (files: File[]) => {
    const file = files[0]; // Take the first file for now
    if (!file) return;
    
    try {
      setIsLoading(true);
      const content = await file.text();
      const parsedSpec = await parseSwaggerFile(content, file.name);
      setSpec(parsedSpec);
      
      // Generate tests automatically
      const testGenerator = new TestGenerator();
      const testSuite = testGenerator.generateTestSuite(
        parsedSpec,
        selectedLanguage,
        selectedFramework as any,
        isProviderMode
      );

      const output = LanguageGeneratorFactory.generateTests(testSuite, {
        language: selectedLanguage,
        framework: selectedFramework,
        packageManager: selectedPackageManager,
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
      
      toast({
        title: "Success",
        description: `Generated ${output.files.length} files for ${selectedLanguage}`,
      });
    } catch (error) {
      console.error('Error generating tests:', error);
      toast({
        title: "Error",
        description: "Failed to generate tests from the uploaded file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSpec(null);
    setGeneratedOutput(null);
    setSelectedLanguage('javascript');
    setSelectedFramework('jest');
    setSelectedPackageManager('npm');
    setIsProviderMode(false);
    setIsLoading(false);
    
    toast({
      title: "Reset Complete",
      description: "All settings and generated code have been cleared",
    });
  };

  return (
    <ThemeProvider defaultTheme="system">
      <Layout>
        <ShaderBackground />
        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
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
                  <FileUploader onFilesUpload={handleFilesUpload} isLoading={isLoading} />
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">5+</div>
                        <div className="text-xs text-muted-foreground">Languages</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">&lt;1s</div>
                        <div className="text-xs text-muted-foreground">Generation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Settings */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <CardTitle>Settings</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
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
                      onCheckedChange={setIsProviderMode}
                    />
                  </div>
                  
                  <Separator />
                  
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    selectedFramework={selectedFramework}
                    selectedPackageManager={selectedPackageManager}
                    onLanguageChange={setSelectedLanguage}
                    onFrameworkChange={setSelectedFramework}
                    onPackageManagerChange={setSelectedPackageManager}
                  />
                </CardContent>
              </Card>
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
                            onClick={handleReset}
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
                    language={selectedLanguage}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ThemeProvider>
  );
};

export default Index;