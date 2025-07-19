import { ParsedSpec } from './swaggerParser';
import { TestGenerator } from './testGenerator';
import { LanguageGeneratorFactory } from '../generators/LanguageGeneratorFactory';
import { SupportedLanguage, TestFramework, PackageManager, LanguageConfig, LANGUAGE_METADATA } from '../types/languageTypes';
import JSZip from 'jszip';

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
) => {
  const testGenerator = new TestGenerator();
  const testSuite = testGenerator.generateTestSuite(spec, config.language, config.framework as any, isProviderMode);
  
  // Generate language-specific output using the factory
  const generatedOutput = LanguageGeneratorFactory.generateTests(testSuite, config);
  return generatedOutput;
};

// Export supported languages and frameworks for UI
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['javascript'];
export const SUPPORTED_FRAMEWORKS: Record<SupportedLanguage, string[]> = {
  javascript: ['jest', 'mocha', 'jasmine', 'vitest'],
  java: ['junit5', 'junit4', 'testng', 'spock'],
  csharp: ['nunit', 'xunit', 'mstest'],
  python: ['pytest', 'unittest', 'nose2'],
  go: ['testing', 'ginkgo', 'testify']
};

export const getFrameworksForLanguage = (language: SupportedLanguage): string[] => {
  return SUPPORTED_FRAMEWORKS[language] || [];
};

export const getDefaultFrameworkForLanguage = (language: SupportedLanguage): string => {
  const frameworks = getFrameworksForLanguage(language);
  return frameworks[0] || 'jest';
};
