import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FrameworkSettings } from '@/components/FrameworkSettings';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { FrameworkConfig, FrameworkGenerationResult, FrameworkFeatures } from '@/types/frameworkTypes';
import { FrameworkGenerator } from '@/utils/frameworkGenerator';
import { parseSwaggerFile, ParsedSpec } from '@/utils/swaggerParser';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/FileUploader';
import { Download, Code2, Zap, Shield, Database, TestTube, GitBranch, Package } from 'lucide-react';

const Framework = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [openApiSpec, setOpenApiSpec] = useState<ParsedSpec | null>(null);
  const [generationResult, setGenerationResult] = useState<FrameworkGenerationResult | null>(null);
  
  const [config, setConfig] = useState<FrameworkConfig>({
    language: 'JavaScript/TypeScript',
    framework: 'express',
    projectName: 'my-api-project',
    description: 'A modern API framework built with best practices',
    version: '1.0.0',
    author: '',
    features: {
      database: 'postgresql',
      authentication: 'jwt',
      apiDocumentation: true,
      testing: true,
      cicd: 'github-actions',
      docker: true,
      monitoring: true,
      codeQuality: true
    }
  });

  const handleSpecUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const content = await file.text();
    
    try {
      const spec = await parseSwaggerFile(content, file.name);
      setOpenApiSpec(spec);
      
      // Auto-configure project name from OpenAPI spec
      if (spec.info?.title) {
        const projectName = spec.info.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        setConfig(prev => ({
          ...prev,
          projectName,
          description: spec.info?.description || prev.description,
          version: spec.info?.version || prev.version
        }));
      }
      
      toast({
        title: "OpenAPI Specification Loaded",
        description: `Loaded ${spec.operations?.length || 0} API operations`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse OpenAPI specification",
        variant: "destructive",
      });
    }
  };

  const handleGenerateFramework = async () => {
    if (!config.projectName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a project name",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await FrameworkGenerator.generateFramework(config, openApiSpec || undefined);
      setGenerationResult(result);
      
      if (result.success) {
        toast({
          title: "Framework Generated Successfully",
          description: "Your enterprise-ready framework is ready for download",
        });
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate framework",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generationResult?.downloadUrl) {
      const link = document.createElement('a');
      link.href = generationResult.downloadUrl;
      link.download = `${config.projectName}-framework.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFeatureIcon = (feature: keyof FrameworkFeatures) => {
    const icons = {
      database: Database,
      authentication: Shield,
      apiDocumentation: Code2,
      testing: TestTube,
      cicd: GitBranch,
      docker: Package,
      monitoring: Zap,
      codeQuality: Code2
    };
    return icons[feature];
  };

  const getFeatureLabel = (feature: keyof FrameworkFeatures) => {
    const labels = {
      database: 'Database',
      authentication: 'Authentication',
      apiDocumentation: 'API Docs',
      testing: 'Testing',
      cicd: 'CI/CD',
      docker: 'Docker',
      monitoring: 'Monitoring',
      codeQuality: 'Code Quality'
    };
    return labels[feature];
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <LoadingOverlay
        isVisible={isGenerating}
        progress={50}
        currentStep="Generating enterprise framework..."
        steps={[
          { id: '1', label: 'Parsing configuration', icon: '⚙️', completed: true, active: false },
          { id: '2', label: 'Generating project structure', icon: '📁', completed: false, active: true },
          { id: '3', label: 'Creating configuration files', icon: '📄', completed: false, active: false },
          { id: '4', label: 'Setting up dependencies', icon: '📦', completed: false, active: false },
          { id: '5', label: 'Building documentation', icon: '📚', completed: false, active: false }
        ]}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Generate Framework</h1>
          <p className="text-muted-foreground">
            Create a complete, enterprise-ready API framework with your preferred stack and features.
          </p>
        </div>

        <Tabs defaultValue="configure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6">
            {/* OpenAPI Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  OpenAPI Specification (Optional)
                </CardTitle>
                <CardDescription>
                  Upload your OpenAPI/Swagger specification to generate API endpoints automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader
                  onFilesUpload={handleSpecUpload}
                  isLoading={false}
                />
                {openApiSpec && (
                  <Alert className="mt-4">
                    <Code2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{openApiSpec.info?.title || 'API Specification'}</strong> loaded with{' '}
                      {openApiSpec.operations?.length || 0} operations
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Framework Settings */}
            <FrameworkSettings config={config} onChange={setConfig} />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Framework Preview</CardTitle>
                <CardDescription>
                  Review your framework configuration before generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{config.projectName}</h3>
                    <p className="text-muted-foreground">{config.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">v{config.version}</Badge>
                      <Badge variant="outline">{config.framework}</Badge>
                      <Badge variant="outline">{config.language}</Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Features */}
                  <div>
                    <h4 className="font-medium mb-3">Enabled Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(config.features).map(([key, value]) => {
                        if (key === 'database' || key === 'authentication' || key === 'cicd') {
                          if (value !== 'none') {
                            const Icon = getFeatureIcon(key as keyof FrameworkFeatures);
                            return (
                              <div key={key} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                <Icon className="h-4 w-4 text-primary" />
                                <span className="text-sm">{getFeatureLabel(key as keyof FrameworkFeatures)}</span>
                              </div>
                            );
                          }
                        } else if (value === true) {
                          const Icon = getFeatureIcon(key as keyof FrameworkFeatures);
                          return (
                            <div key={key} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                              <Icon className="h-4 w-4 text-primary" />
                              <span className="text-sm">{getFeatureLabel(key as keyof FrameworkFeatures)}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                  
                  {openApiSpec && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-3">API Endpoints</h4>
                        <div className="space-y-2">
                          {openApiSpec.operations?.slice(0, 5).map((op, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                              <Badge variant={op.method === 'get' ? 'default' : op.method === 'post' ? 'secondary' : 'outline'}>
                                {op.method.toUpperCase()}
                              </Badge>
                              <code className="text-sm">{op.path}</code>
                              <span className="text-sm text-muted-foreground">{op.summary}</span>
                            </div>
                          ))}
                          {(openApiSpec.operations?.length || 0) > 5 && (
                            <p className="text-sm text-muted-foreground">
                              +{(openApiSpec.operations?.length || 0) - 5} more endpoints
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Framework</CardTitle>
                <CardDescription>
                  Generate and download your complete framework package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!generationResult ? (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Ready to generate your enterprise framework with the configured settings.
                    </p>
                    <Button 
                      onClick={handleGenerateFramework}
                      disabled={isGenerating}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Generate Framework
                    </Button>
                  </div>
                ) : generationResult.success ? (
                  <div className="text-center space-y-4">
                    <Alert>
                      <Package className="h-4 w-4" />
                      <AlertDescription>
                        Framework generated successfully! Your package includes {generationResult.scaffolding?.files.length || 0} files.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={handleDownload}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Framework
                    </Button>
                    
                    {generationResult.scaffolding?.instructions && (
                      <div className="text-left space-y-2 mt-6">
                        <h4 className="font-medium">Next Steps:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          {generationResult.scaffolding.instructions.map((instruction, index) => (
                            <li key={index}>{instruction}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {generationResult.error || 'Failed to generate framework'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Framework;