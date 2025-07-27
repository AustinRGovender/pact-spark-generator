import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { FrameworkConfig, SupportedFramework, DatabaseType, AuthType, CiCdType } from '../types/frameworkTypes';

interface FrameworkSettingsProps {
  config: FrameworkConfig;
  onChange: (config: FrameworkConfig) => void;
}

export const FrameworkSettings: React.FC<FrameworkSettingsProps> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<FrameworkConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateFeatures = (featureUpdates: Partial<FrameworkConfig['features']>) => {
    onChange({
      ...config,
      features: { ...config.features, ...featureUpdates }
    });
  };

  const frameworkOptions: { value: SupportedFramework; label: string; language: string }[] = [
    { value: 'express', label: 'Express.js', language: 'JavaScript/TypeScript' },
    { value: 'fastify', label: 'Fastify', language: 'JavaScript/TypeScript' },
    { value: 'nestjs', label: 'NestJS', language: 'TypeScript' },
    { value: 'spring-boot', label: 'Spring Boot', language: 'Java' },
    { value: 'dotnet-core', label: '.NET Core', language: 'C#' },
    { value: 'fastapi', label: 'FastAPI', language: 'Python' },
    { value: 'django', label: 'Django', language: 'Python' },
    { value: 'gin', label: 'Gin', language: 'Go' },
    { value: 'echo', label: 'Echo', language: 'Go' }
  ];

  const databaseOptions: { value: DatabaseType; label: string }[] = [
    { value: 'none', label: 'No Database' },
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'mongodb', label: 'MongoDB' },
    { value: 'sqlite', label: 'SQLite' }
  ];

  const authOptions: { value: AuthType; label: string }[] = [
    { value: 'none', label: 'No Authentication' },
    { value: 'jwt', label: 'JWT Tokens' },
    { value: 'oauth2', label: 'OAuth2' },
    { value: 'basic', label: 'Basic Auth' }
  ];

  const cicdOptions: { value: CiCdType; label: string }[] = [
    { value: 'none', label: 'No CI/CD' },
    { value: 'github-actions', label: 'GitHub Actions' },
    { value: 'gitlab-ci', label: 'GitLab CI' },
    { value: 'azure-devops', label: 'Azure DevOps' }
  ];

  const selectedFramework = frameworkOptions.find(f => f.value === config.framework);

  return (
    <div className="space-y-6">
      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Basic project configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={config.projectName}
                onChange={(e) => updateConfig({ projectName: e.target.value })}
                placeholder="my-api-project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={config.version}
                onChange={(e) => updateConfig({ version: e.target.value })}
                placeholder="1.0.0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="A modern API framework built with best practices"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={config.author}
              onChange={(e) => updateConfig({ author: e.target.value })}
              placeholder="Your Name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Framework Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Framework Selection</CardTitle>
          <CardDescription>Choose your preferred framework and language</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="framework">Framework</Label>
            <Select
              value={config.framework}
              onValueChange={(value: SupportedFramework) => {
                const framework = frameworkOptions.find(f => f.value === value);
                updateConfig({ 
                  framework: value,
                  language: framework?.language || config.language
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a framework" />
              </SelectTrigger>
              <SelectContent>
                {frameworkOptions.map((framework) => (
                  <SelectItem key={framework.value} value={framework.value}>
                    <div className="flex items-center gap-2">
                      <span>{framework.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {framework.language}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFramework && (
              <p className="text-sm text-muted-foreground">
                Language: {selectedFramework.language}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Core Features */}
      <Card>
        <CardHeader>
          <CardTitle>Core Features</CardTitle>
          <CardDescription>Configure the main components of your application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="database">Database</Label>
              <Select
                value={config.features.database}
                onValueChange={(value: DatabaseType) => updateFeatures({ database: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select database" />
                </SelectTrigger>
                <SelectContent>
                  {databaseOptions.map((db) => (
                    <SelectItem key={db.value} value={db.value}>
                      {db.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="authentication">Authentication</Label>
              <Select
                value={config.features.authentication}
                onValueChange={(value: AuthType) => updateFeatures({ authentication: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication" />
                </SelectTrigger>
                <SelectContent>
                  {authOptions.map((auth) => (
                    <SelectItem key={auth.value} value={auth.value}>
                      {auth.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Features */}
      <Card>
        <CardHeader>
          <CardTitle>Development Features</CardTitle>
          <CardDescription>Tools and integrations for development workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="apiDocumentation">API Documentation</Label>
                <p className="text-sm text-muted-foreground">
                  Generate OpenAPI/Swagger documentation
                </p>
              </div>
              <Switch
                id="apiDocumentation"
                checked={config.features.apiDocumentation}
                onCheckedChange={(checked) => updateFeatures({ apiDocumentation: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="testing">Testing Suite</Label>
                <p className="text-sm text-muted-foreground">
                  Include Jest testing framework and example tests
                </p>
              </div>
              <Switch
                id="testing"
                checked={config.features.testing}
                onCheckedChange={(checked) => updateFeatures({ testing: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="codeQuality">Code Quality Tools</Label>
                <p className="text-sm text-muted-foreground">
                  ESLint, Prettier, and code formatting
                </p>
              </div>
              <Switch
                id="codeQuality"
                checked={config.features.codeQuality}
                onCheckedChange={(checked) => updateFeatures({ codeQuality: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DevOps Features */}
      <Card>
        <CardHeader>
          <CardTitle>DevOps & Deployment</CardTitle>
          <CardDescription>Infrastructure and deployment configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="docker">Docker Support</Label>
                <p className="text-sm text-muted-foreground">
                  Include Dockerfile and Docker Compose configuration
                </p>
              </div>
              <Switch
                id="docker"
                checked={config.features.docker}
                onCheckedChange={(checked) => updateFeatures({ docker: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cicd">CI/CD Pipeline</Label>
              <Select
                value={config.features.cicd}
                onValueChange={(value: CiCdType) => updateFeatures({ cicd: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select CI/CD platform" />
                </SelectTrigger>
                <SelectContent>
                  {cicdOptions.map((cicd) => (
                    <SelectItem key={cicd.value} value={cicd.value}>
                      {cicd.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="monitoring">Monitoring & Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Health checks, request logging, and monitoring setup
                </p>
              </div>
              <Switch
                id="monitoring"
                checked={config.features.monitoring}
                onCheckedChange={(checked) => updateFeatures({ monitoring: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};