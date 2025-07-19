import { ParsedSpec } from './swaggerParser';
import { TestGenerator } from './testGenerator';
import { JavaScriptPactGenerator } from '../generators/javascript/JavaScriptPactGenerator';
import { SupportedLanguage, TestFramework, LanguageConfig, GeneratedProject } from '../types/testModels';

export interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

// Backward compatibility - maintain the original interface
export const generatePactTests = (spec: ParsedSpec, isProviderMode: boolean = false): GeneratedTest[] => {
  const config: LanguageConfig = {
    language: 'javascript',
    framework: 'jest',
    packageManager: 'npm',
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
      maxLineLength: 120,
      semicolons: true,
      quotes: 'single'
    }
  };

  const project = generatePactProject(spec, config, isProviderMode);
  
  // Convert new format back to old format for backward compatibility
  return project.files
    .filter(file => file.type === 'test')
    .map(file => {
      // Extract metadata from file path and content
      const pathParts = file.path.split('/');
      const filename = pathParts[pathParts.length - 1];
      const isProvider = filename.includes('provider');
      
      // Parse filename to extract metadata
      const filenameParts = filename.replace('.test.js', '').split('_');
      const tag = filenameParts[0] || 'default';
      const method = filenameParts[1]?.toUpperCase() || 'GET';
      const endpoint = '/' + filenameParts.slice(2, -2).join('/');

      return {
        filename,
        content: file.content,
        tag,
        endpoint,
        method
      };
    });
};

// New enhanced interface
export const generatePactProject = (
  spec: ParsedSpec, 
  config: LanguageConfig, 
  isProviderMode: boolean = false
): GeneratedProject => {
  const testGenerator = new TestGenerator();
  const testSuite = testGenerator.generateTestSuite(spec, config.language, config.framework, isProviderMode);
  
  const languageGenerator = getLanguageGenerator(config.language);
  return languageGenerator.generateProject(testSuite, config);
};

export const generatePactProjectForLanguage = (
  spec: ParsedSpec,
  language: SupportedLanguage,
  framework?: TestFramework,
  isProviderMode: boolean = false,
  customConfig?: Partial<LanguageConfig>
): GeneratedProject => {
  const languageGenerator = getLanguageGenerator(language);
  const defaultConfig = languageGenerator.getDefaultConfiguration();
  
  const config: LanguageConfig = {
    ...defaultConfig,
    language,
    framework: framework || languageGenerator.defaultFramework,
    ...customConfig
  } as LanguageConfig;

  const validation = languageGenerator.validateConfiguration(config);
  if (!validation.isValid) {
    throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  return generatePactProject(spec, config, isProviderMode);
};

function getLanguageGenerator(language: SupportedLanguage) {
  switch (language) {
    case 'javascript':
      return new JavaScriptPactGenerator();
    default:
      throw new Error(`Language ${language} is not yet supported`);
  }
}

// Export supported languages and frameworks for UI
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['javascript'];
export const SUPPORTED_FRAMEWORKS: Record<SupportedLanguage, TestFramework[]> = {
  javascript: ['jest', 'mocha', 'jasmine'],
  java: ['junit5'],
  csharp: ['nunit', 'xunit', 'mstest'],
  python: ['pytest'],
  go: ['testing']
};

export const getFrameworksForLanguage = (language: SupportedLanguage): TestFramework[] => {
  return SUPPORTED_FRAMEWORKS[language] || [];
};

export const getDefaultFrameworkForLanguage = (language: SupportedLanguage): TestFramework => {
  const frameworks = getFrameworksForLanguage(language);
  return frameworks[0] || 'jest';
};
