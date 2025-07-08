
import React, { useState, useCallback } from 'react';
import { FileUploader } from '../components/FileUploader';
import { CodeViewer } from '../components/CodeViewer';
import { FileEditor } from '../components/FileEditor';
import { TestExecutor } from '../components/TestExecutor';
import { TestModeToggle } from '../components/TestModeToggle';
import { PrivacyBanner } from '../components/PrivacyBanner';
import { ActionBar } from '../components/ActionBar';
import { ShaderBackground } from '../components/ShaderBackground';
import { Button } from '@/components/ui/button';
import { parseSwaggerFile } from '../utils/swaggerParser';
import { generatePactTests } from '../utils/pactGenerator';
import { downloadZip } from '../utils/downloadUtils';
import { useToast } from '../hooks/use-toast';
import { Edit } from 'lucide-react';

interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

const Index = () => {
  const [generatedTests, setGeneratedTests] = useState<GeneratedTest[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTest, setSelectedTest] = useState<GeneratedTest | null>(null);
  const [editingTest, setEditingTest] = useState<GeneratedTest | null>(null);
  const [isProviderMode, setIsProviderMode] = useState(false);
  const [providerSpecFiles, setProviderSpecFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (files: File[]) => {
    setIsGenerating(true);
    
    try {
      const allTests: GeneratedTest[] = [];
      
      for (const file of files) {
        const content = await file.text();
        const parsedSpec = await parseSwaggerFile(content, file.name);
        const tests = generatePactTests(parsedSpec, isProviderMode);
        allTests.push(...tests);
      }
      
      setGeneratedTests(allTests);
      if (allTests.length > 0) {
        setSelectedTest(allTests[0]);
      }
      
      toast({
        title: "Tests Generated Successfully",
        description: `Generated ${allTests.length} PactJS ${isProviderMode ? 'provider' : 'consumer'} test${allTests.length === 1 ? '' : 's'} from ${files.length} file${files.length === 1 ? '' : 's'}`,
      });
    } catch (error) {
      console.error('Error generating tests:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to parse OpenAPI specification",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [toast, isProviderMode]);

  const handleReset = useCallback(() => {
    setGeneratedTests([]);
    setSelectedTest(null);
    setEditingTest(null);
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (generatedTests.length > 0) {
      await downloadZip(generatedTests, isProviderMode);
      toast({
        title: "Download Started",
        description: `Your PactJS ${isProviderMode ? 'provider' : 'consumer'} test suite is being downloaded as a ZIP file`,
      });
    }
  }, [generatedTests, toast, isProviderMode]);

  const handleCopyAll = useCallback(() => {
    const allContent = generatedTests.map(test => 
      `// ${test.filename}\n${test.content}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(allContent);
    toast({
      title: "Copied to Clipboard",
      description: "All generated tests have been copied to your clipboard",
    });
  }, [generatedTests, toast]);

  const handleEditTest = (test: GeneratedTest) => {
    setEditingTest(test);
  };

  const handleSaveTest = (updatedTest: GeneratedTest) => {
    setGeneratedTests(prev => 
      prev.map(test => 
        test.filename === updatedTest.filename ? updatedTest : test
      )
    );
    
    if (selectedTest?.filename === updatedTest.filename) {
      setSelectedTest(updatedTest);
    }
    
    setEditingTest(null);
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
  };

  const handleProviderSpecUpload = useCallback((files: File[]) => {
    setProviderSpecFiles(files);
  }, []);

  const handleModeToggle = (providerMode: boolean) => {
    setIsProviderMode(providerMode);
    // Clear existing tests when switching modes
    if (generatedTests.length > 0) {
      setGeneratedTests([]);
      setSelectedTest(null);
      setEditingTest(null);
      setProviderSpecFiles([]);
      toast({
        title: "Mode Changed",
        description: `Switched to ${providerMode ? 'Provider' : 'Consumer'} mode. Please regenerate your tests.`,
      });
    }
  };

  return (
    <div className="min-h-screen relative">
      <ShaderBackground />
      <PrivacyBanner />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative z-10">
        {generatedTests.length === 0 ? (
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="space-y-6 text-center px-4">
              <TestModeToggle 
                isProviderMode={isProviderMode}
                onToggle={handleModeToggle}
              />
              <FileUploader 
                onFilesUpload={handleFileUpload} 
                isLoading={isGenerating}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-center sm:justify-between items-center">
              <TestModeToggle 
                isProviderMode={isProviderMode}
                onToggle={handleModeToggle}
              />
            </div>
            
            <ActionBar
              testsCount={generatedTests.length}
              onCopyAll={handleCopyAll}
              onDownloadZip={handleDownloadZip}
              onReset={handleReset}
            />
            
            <TestExecutor 
              tests={generatedTests}
              isProviderMode={isProviderMode}
              onProviderSpecUpload={handleProviderSpecUpload}
            />
            
            <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="order-2 lg:order-1 lg:col-span-1">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
                    Generated Tests ({generatedTests.length})
                  </h3>
                  <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                    {generatedTests.map((test, index) => (
                      <div
                        key={index}
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 ${
                          selectedTest === test
                            ? 'bg-[#bbc7fe]/30 border border-[#bbc7fe]/50'
                            : 'hover:bg-slate-100/50 border border-transparent'
                        }`}
                      >
                        <button
                          onClick={() => setSelectedTest(test)}
                          className="w-full text-left mb-2"
                        >
                          <div className="font-medium text-slate-800 text-xs sm:text-sm truncate">
                            {test.endpoint}
                          </div>
                          <div className="text-xs text-slate-600 flex gap-2">
                            <span className="uppercase font-mono">{test.method}</span>
                            <span>•</span>
                            <span className="truncate">{test.tag}</span>
                          </div>
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTest(test)}
                          className="w-full h-8 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 lg:col-span-3">
                {editingTest ? (
                  <FileEditor
                    test={editingTest}
                    onSave={handleSaveTest}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  selectedTest && <CodeViewer test={selectedTest} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
