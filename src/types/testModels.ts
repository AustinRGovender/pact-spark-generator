
export interface TestSuite {
  name: string;
  description: string;
  provider: string;
  consumer: string;
  tests: TestCase[];
  setup: TestSetup;
  metadata: TestMetadata;
  isProviderMode: boolean;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: TestCaseType;
  scenario: TestScenario;
  request: TestRequest;
  response: TestResponse;
  providerState?: string;
  tags: string[];
}

export interface TestScenario {
  given: string;
  when: string;
  then: string;
  auth?: AuthScenario;
  errorCase?: ErrorScenario;
  edgeCase?: EdgeCaseScenario;
}

export interface TestRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
  pathParams?: Record<string, string>;
}

export interface TestResponse {
  status: number;
  headers?: Record<string, string>;
  body?: any;
  matchers?: ResponseMatchers;
}

export interface TestSetup {
  dependencies: Dependency[];
  imports: string[];
  configuration: Record<string, any>;
  beforeEach?: string[];
  afterEach?: string[];
  beforeAll?: string[];
  afterAll?: string[];
}

export interface TestMetadata {
  endpoint: string;
  method: string;
  tag: string;
  language: SupportedLanguage;
  framework: TestFramework;
  generatedAt: string;
  version: string;
  isProviderMode: boolean;
}

export interface Dependency {
  name: string;
  version: string;
  scope: 'production' | 'development' | 'test';
  manager: PackageManager;
}

export interface GeneratedProject {
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
}

export interface ProjectStructure {
  rootDir: string;
  testDir: string;
  configFiles: string[];
  sourceFiles: string[];
}

export interface ProjectConfiguration {
  packageManager: PackageManager;
  testFramework: TestFramework;
  buildTool?: BuildTool;
  language: SupportedLanguage;
  version: string;
}

// Enums and Types
export type TestCaseType = 'success' | 'auth' | 'error' | 'edge' | 'boundary' | 'performance';
export type SupportedLanguage = 'javascript' | 'java' | 'csharp' | 'python' | 'go';
export type TestFramework = 'jest' | 'mocha' | 'jasmine' | 'junit5' | 'nunit' | 'xunit' | 'mstest' | 'pytest' | 'testing';
export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'maven' | 'gradle' | 'nuget' | 'pip' | 'go-mod';
export type BuildTool = 'maven' | 'gradle' | 'dotnet' | 'webpack' | 'vite' | 'go-build';
export type FileType = 'test' | 'config' | 'dependency' | 'setup' | 'documentation';

export interface AuthScenario {
  type: 'missing' | 'invalid' | 'expired' | 'insufficient_permissions';
  expectedStatus: number;
  description: string;
}

export interface ErrorScenario {
  statusCode: number;
  errorType: string;
  description: string;
  providerState: string;
}

export interface EdgeCaseScenario {
  type: 'boundary' | 'null' | 'empty' | 'large' | 'concurrent' | 'timeout';
  description: string;
  expectedBehavior: string;
}

export interface ResponseMatchers {
  like?: any;
  eachLike?: any;
  term?: { matcher: string; generate: string };
  type?: string;
  integer?: number;
  decimal?: number;
  boolean?: boolean;
  string?: string;
  uuid?: string;
  date?: string;
  time?: string;
  timestamp?: string;
}

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

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}
