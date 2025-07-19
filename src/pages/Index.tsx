import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { LanguageSelector } from "../components/LanguageSelector";
import { CodePreview } from "../components/CodePreview";
import { ShaderBackground } from '../components/ShaderBackground';
import { parseSwaggerFile } from '../utils/swaggerParser';
import { TestGenerator } from "../utils/testGenerator";
import { LanguageGeneratorFactory } from "../generators/LanguageGeneratorFactory";
import { SupportedLanguage, TestFramework, PackageManager, GeneratedOutput } from "../types/languageTypes";
import { useToast } from '../hooks/use-toast';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ShaderBackground />
      <div className="relative z-10 container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Advanced Pact Test Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate comprehensive contract tests from OpenAPI specifications in multiple programming languages
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FileUploader onFilesUpload={handleFilesUpload} isLoading={isLoading} />
            
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              selectedFramework={selectedFramework}
              selectedPackageManager={selectedPackageManager}
              onLanguageChange={setSelectedLanguage}
              onFrameworkChange={setSelectedFramework}
              onPackageManagerChange={setSelectedPackageManager}
            />

            {/* Provider Mode Toggle */}
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="provider-mode"
                  checked={isProviderMode}
                  onChange={(e) => setIsProviderMode(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="provider-mode" className="text-sm font-medium">
                  Provider Mode (Generate provider verification tests)
                </label>
              </div>
            </div>
          </div>

          <div>
            <CodePreview
              generatedOutput={generatedOutput}
              language={selectedLanguage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;