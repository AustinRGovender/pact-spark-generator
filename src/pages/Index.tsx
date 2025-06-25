import React, { useState, useCallback } from 'react';
import { FileUploader } from '../components/FileUploader';
import { CodeViewer } from '../components/CodeViewer';
import { PrivacyBanner } from '../components/PrivacyBanner';
import { ActionBar } from '../components/ActionBar';
import { parseSwaggerFile } from '../utils/swaggerParser';
import { generatePactTests } from '../utils/pactGenerator';
import { downloadZip } from '../utils/downloadUtils';
import { useToast } from '../hooks/use-toast';

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
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (files: File[]) => {
    setIsGenerating(true);
    
    try {
      const allTests: GeneratedTest[] = [];
      
      for (const file of files) {
        const content = await file.text();
        const parsedSpec = await parseSwaggerFile(content, file.name);
        const tests = generatePactTests(parsedSpec);
        allTests.push(...tests);
      }
      
      setGeneratedTests(allTests);
      if (allTests.length > 0) {
        setSelectedTest(allTests[0]);
      }
      
      toast({
        title: "Tests Generated Successfully",
        description: `Generated ${allTests.length} PactJS test${allTests.length === 1 ? '' : 's'} from ${files.length} file${files.length === 1 ? '' : 's'}`,
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
  }, [toast]);

  const handleReset = useCallback(() => {
    setGeneratedTests([]);
    setSelectedTest(null);
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (generatedTests.length > 0) {
      await downloadZip(generatedTests);
      toast({
        title: "Download Started",
        description: "Your PactJS test suite is being downloaded as a ZIP file",
      });
    }
  }, [generatedTests, toast]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <PrivacyBanner />
      
      <div className="container mx-auto px-4 py-8">
        {generatedTests.length === 0 ? (
          <div className="min-h-[80vh] flex items-center justify-center">
            <FileUploader 
              onFilesUpload={handleFileUpload} 
              isLoading={isGenerating}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <ActionBar
              testsCount={generatedTests.length}
              onCopyAll={handleCopyAll}
              onDownloadZip={handleDownloadZip}
              onReset={handleReset}
            />
            
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Test List */}
              <div className="lg:col-span-1">
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Generated Tests ({generatedTests.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {generatedTests.map((test, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTest(test)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                          selectedTest === test
                            ? 'bg-[#bbc7fe]/30 border border-[#bbc7fe]/50'
                            : 'hover:bg-slate-100/50 border border-transparent'
                        }`}
                      >
                        <div className="font-medium text-slate-800 text-sm truncate">
                          {test.endpoint}
                        </div>
                        <div className="text-xs text-slate-600 flex gap-2">
                          <span className="uppercase font-mono">{test.method}</span>
                          <span>•</span>
                          <span>{test.tag}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="lg:col-span-3">
                {selectedTest && <CodeViewer test={selectedTest} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
