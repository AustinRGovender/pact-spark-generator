export interface LanguageConfig {
  language: SupportedLanguage;
  framework: TestFramework;
  packageManager: PackageManager;
  buildTool?: BuildTool;
  version: string;
  customSettings: Record<string, any>;
  namingConvention: NamingConvention;
  codeStyle: CodeStyle;
}

export interface NamingConvention {
  testClasses: 'PascalCase' | 'camelCase' | 'snake_case';
  testMethods: 'PascalCase' | 'camelCase' | 'snake_case';
  variables: 'PascalCase' | 'camelCase' | 'snake_case';
  constants: 'UPPER_CASE' | 'PascalCase' | 'camelCase';
}

export interface CodeStyle {
  indentation: 'spaces' | 'tabs';
  indentSize: number;
  maxLineLength: number;
  semicolons: boolean;
  quotes: 'single' | 'double';
}

export interface LanguageFeatures {
  supportsAsync: boolean;
  hasNullSafety: boolean;
  hasGenerics: boolean;
  hasLambdas: boolean;
  hasAnnotations: boolean;
  hasInterfaces: boolean;
  hasAbstractClasses: boolean;
}

export type SupportedLanguage = 'javascript' | 'java' | 'csharp' | 'python' | 'go';

export type TestFramework = 
  // JavaScript
  | 'jest' | 'mocha' | 'jasmine' | 'vitest'
  // Java
  | 'junit5' | 'junit4' | 'testng' | 'spock'
  // C#
  | 'nunit' | 'xunit' | 'mstest'
  // Python
  | 'pytest' | 'unittest' | 'nose2'
  // Go
  | 'testing' | 'ginkgo' | 'testify';

export type PackageManager = 
  // JavaScript
  | 'npm' | 'yarn' | 'pnpm' | 'bun'
  // Java
  | 'maven' | 'gradle'
  // C#
  | 'nuget' | 'paket'
  // Python
  | 'pip' | 'pipenv' | 'poetry' | 'conda'
  // Go
  | 'go-mod';

export type BuildTool = 
  | 'maven' | 'gradle' | 'dotnet' | 'webpack' | 'vite' | 'rollup' | 'go-build' | 'setuptools';

export interface LanguageMetadata {
  name: string;
  displayName: string;
  fileExtension: string;
  features: LanguageFeatures;
  defaultFramework: TestFramework;
  defaultPackageManager: PackageManager;
  supportedFrameworks: TestFramework[];
  supportedPackageManagers: PackageManager[];
  icon: string;
  documentation: string;
}

export const LANGUAGE_METADATA: Record<SupportedLanguage, LanguageMetadata> = {
  javascript: {
    name: 'javascript',
    displayName: 'JavaScript',
    fileExtension: '.js',
    features: {
      supportsAsync: true,
      hasNullSafety: false,
      hasGenerics: false,
      hasLambdas: true,
      hasAnnotations: false,
      hasInterfaces: false,
      hasAbstractClasses: false
    },
    defaultFramework: 'jest',
    defaultPackageManager: 'npm',
    supportedFrameworks: ['jest', 'mocha', 'jasmine', 'vitest'],
    supportedPackageManagers: ['npm', 'yarn', 'pnpm', 'bun'],
    icon: '🟨',
    documentation: 'https://docs.pact.io/implementation_guides/javascript'
  },
  java: {
    name: 'java',
    displayName: 'Java',
    fileExtension: '.java',
    features: {
      supportsAsync: true,
      hasNullSafety: false,
      hasGenerics: true,
      hasLambdas: true,
      hasAnnotations: true,
      hasInterfaces: true,
      hasAbstractClasses: true
    },
    defaultFramework: 'junit5',
    defaultPackageManager: 'maven',
    supportedFrameworks: ['junit5', 'junit4', 'testng', 'spock'],
    supportedPackageManagers: ['maven', 'gradle'],
    icon: '☕',
    documentation: 'https://docs.pact.io/implementation_guides/jvm'
  },
  csharp: {
    name: 'csharp',
    displayName: 'C#',
    fileExtension: '.cs',
    features: {
      supportsAsync: true,
      hasNullSafety: true,
      hasGenerics: true,
      hasLambdas: true,
      hasAnnotations: true,
      hasInterfaces: true,
      hasAbstractClasses: true
    },
    defaultFramework: 'nunit',
    defaultPackageManager: 'nuget',
    supportedFrameworks: ['nunit', 'xunit', 'mstest'],
    supportedPackageManagers: ['nuget', 'paket'],
    icon: '🔷',
    documentation: 'https://docs.pact.io/implementation_guides/net'
  },
  python: {
    name: 'python',
    displayName: 'Python',
    fileExtension: '.py',
    features: {
      supportsAsync: true,
      hasNullSafety: false,
      hasGenerics: true,
      hasLambdas: true,
      hasAnnotations: true,
      hasInterfaces: false,
      hasAbstractClasses: true
    },
    defaultFramework: 'pytest',
    defaultPackageManager: 'pip',
    supportedFrameworks: ['pytest', 'unittest', 'nose2'],
    supportedPackageManagers: ['pip', 'pipenv', 'poetry', 'conda'],
    icon: '🐍',
    documentation: 'https://docs.pact.io/implementation_guides/python'
  },
  go: {
    name: 'go',
    displayName: 'Go',
    fileExtension: '.go',
    features: {
      supportsAsync: true,
      hasNullSafety: false,
      hasGenerics: true,
      hasLambdas: true,
      hasAnnotations: false,
      hasInterfaces: true,
      hasAbstractClasses: false
    },
    defaultFramework: 'testing',
    defaultPackageManager: 'go-mod',
    supportedFrameworks: ['testing', 'ginkgo', 'testify'],
    supportedPackageManagers: ['go-mod'],
    icon: '🔵',
    documentation: 'https://docs.pact.io/implementation_guides/go'
  }
};

export interface TemplateContext {
  testSuite: any;
  languageConfig: LanguageConfig;
  imports: string[];
  dependencies: string[];
  setup: string[];
  teardown: string[];
  helpers: Record<string, any>;
}

export interface GeneratedOutput {
  files: GeneratedFile[];
  projectStructure: ProjectStructure;
  setupInstructions: string[];
  dependencies: Dependency[];
  configuration: ProjectConfiguration;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: FileType;
  language: SupportedLanguage;
  description: string;
}

export interface ProjectStructure {
  rootDir: string;
  testDir: string;
  configFiles: string[];
  sourceFiles: string[];
  packageFile: string;
  buildFile?: string;
}

export interface ProjectConfiguration {
  packageManager: PackageManager;
  testFramework: TestFramework;
  buildTool?: BuildTool;
  language: SupportedLanguage;
  version: string;
  scripts: Record<string, string>;
  settings: Record<string, any>;
}

export interface Dependency {
  name: string;
  version: string;
  scope: 'production' | 'development' | 'test';
  manager: PackageManager;
  description?: string;
}

export type FileType = 'test' | 'config' | 'dependency' | 'setup' | 'documentation' | 'build';