import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Copy, Download, FileText, Maximize2, Minimize2, Code } from 'lucide-react';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { GeneratedOutput, GeneratedFile, SupportedLanguage } from '../types/languageTypes';
import { useToast } from './ui/use-toast';

interface CodePreviewProps {
  generatedOutput: GeneratedOutput | null;
  language: SupportedLanguage;
  isLoading?: boolean;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
  generatedOutput,
  language,
  isLoading = false
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generating Code...</CardTitle>
          <CardDescription>Please wait while we generate your Pact tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!generatedOutput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Code Preview</CardTitle>
          <CardDescription>Upload a Swagger/OpenAPI file to see generated Pact tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No code generated yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentFile = generatedOutput.files.find(f => f.path === selectedFile) || generatedOutput.files[0];

  const handleCopyToClipboard = async (content: string, type: 'formatted' | 'plain' = 'plain') => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: `${type === 'formatted' ? 'Formatted code' : 'Plain text'} has been copied to your clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'java': 'java',
      'cs': 'csharp',
      'py': 'python',
      'go': 'go',
      'json': 'json',
      'xml': 'xml',
      'yml': 'yaml',
      'yaml': 'yaml',
      'md': 'markdown'
    };
    return languageMap[ext || ''] || 'text';
  };

  const groupedFiles = generatedOutput.files.reduce((acc, file) => {
    const group = file.type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(file);
    return acc;
  }, {} as Record<string, GeneratedFile[]>);

  const CodePreviewContent = ({ isMaximized }: { isMaximized: boolean }) => (
    <Tabs defaultValue="files" className="h-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="structure">Structure</TabsTrigger>
        <TabsTrigger value="setup">Setup</TabsTrigger>
      </TabsList>

      <TabsContent value="files" className="space-y-4 p-4">
        <div className={`grid gap-4 ${isMaximized ? 'grid-cols-1 xl:grid-cols-4 h-[70vh]' : 'grid-cols-1 lg:grid-cols-3 h-96'}`}>
          {/* File browser */}
          <div className={`space-y-2 ${isMaximized ? 'xl:col-span-1' : ''}`}>
            <h4 className="font-medium text-sm">Files by Type</h4>
            <div className={`space-y-3 overflow-y-auto scroll-container-mobile ${isMaximized ? 'max-h-[65vh]' : 'max-h-80'}`}>
              {Object.entries(groupedFiles).map(([type, files]) => (
                <div key={type} className="space-y-1">
                  <h5 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                    {type} ({files.length})
                  </h5>
                  {files.map((file) => (
                    <button
                      key={file.path}
                      className={`w-full text-left p-2 rounded text-sm hover:bg-muted transition-colors ${
                        selectedFile === file.path ? 'bg-primary/10 border border-primary/20' : ''
                      }`}
                      onClick={() => setSelectedFile(file.path)}
                    >
                      <div className="font-mono text-xs truncate">{file.path}</div>
                      <div className="text-xs text-muted-foreground mt-1">{file.description}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Code display */}
          <div className={`space-y-2 ${isMaximized ? 'xl:col-span-3' : 'lg:col-span-2'}`}>
            {currentFile && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium font-mono text-sm">{currentFile.path}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {currentFile.type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(currentFile.content, 'plain')}
                      title="Copy as plain text"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(currentFile.content, 'formatted')}
                      title="Copy formatted code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadFile(currentFile)}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className={`border rounded-lg overflow-hidden overflow-y-auto scroll-container-mobile ${isMaximized ? 'max-h-[60vh]' : 'max-h-64'}`}>
                  <SyntaxHighlighter
                    code={currentFile.content}
                    language={getLanguageFromExtension(currentFile.path)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="structure" className="space-y-4 p-4">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Project Structure</h4>
            <div className="space-y-2 font-mono text-sm">
              <div><strong>Root:</strong> {generatedOutput.projectStructure.rootDir}</div>
              <div><strong>Tests:</strong> {generatedOutput.projectStructure.testDir}</div>
              <div><strong>Package File:</strong> {generatedOutput.projectStructure.packageFile}</div>
              {generatedOutput.projectStructure.buildFile && (
                <div><strong>Build File:</strong> {generatedOutput.projectStructure.buildFile}</div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Dependencies</h4>
            <div className="space-y-1">
              {generatedOutput.dependencies.map((dep, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-mono text-sm">{dep.name}</div>
                    <div className="text-xs text-muted-foreground">{dep.description}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">{dep.version}</Badge>
                    <Badge variant="secondary" className="text-xs">{dep.scope}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="setup" className="space-y-4 p-4">
        <div>
          <h4 className="font-medium mb-2">Setup Instructions</h4>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
              {generatedOutput.setupInstructions.join('\n')}
            </pre>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Code Preview</CardTitle>
              <CardDescription>
                {generatedOutput.files.length} files generated for {language}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaximized(true)}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Maximize
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <CodePreviewContent isMaximized={false} />
        </CardContent>
      </Card>

      {/* Maximized Dialog */}
      <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Generated Code Preview - Maximized</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {generatedOutput.files.length} files generated for {language}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMaximized(false)}
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Minimize
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6 pt-0">
            <CodePreviewContent isMaximized={true} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
