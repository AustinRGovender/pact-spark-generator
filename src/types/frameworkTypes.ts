export type SupportedFramework = 
  | 'express' | 'fastify' | 'nestjs'        // JavaScript/TypeScript
  | 'spring-boot'                           // Java
  | 'dotnet-core'                          // C#
  | 'fastapi' | 'django'                   // Python
  | 'gin' | 'echo';                        // Go

export type DatabaseType = 
  | 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'none';

export type AuthType = 
  | 'jwt' | 'oauth2' | 'basic' | 'none';

export type CiCdType = 
  | 'github-actions' | 'gitlab-ci' | 'azure-devops' | 'none';

export interface FrameworkFeatures {
  database: DatabaseType;
  authentication: AuthType;
  apiDocumentation: boolean;
  testing: boolean;
  cicd: CiCdType;
  docker: boolean;
  monitoring: boolean;
  codeQuality: boolean;
}

export interface FrameworkConfig {
  language: string;
  framework: SupportedFramework;
  projectName: string;
  description: string;
  version: string;
  author: string;
  features: FrameworkFeatures;
}

export interface GeneratedFile {
  path: string;
  content: string;
  description?: string;
}

export interface FrameworkTemplate {
  name: string;
  description: string;
  language: string;
  framework: SupportedFramework;
  supportedFeatures: (keyof FrameworkFeatures)[];
  files: GeneratedFile[];
}

export interface ProjectScaffolding {
  projectName: string;
  config: FrameworkConfig;
  files: GeneratedFile[];
  instructions: string[];
}

export interface FrameworkGenerationResult {
  success: boolean;
  scaffolding?: ProjectScaffolding;
  error?: string;
  downloadUrl?: string;
}