
import { TestSuite, GeneratedProject, LanguageConfig, ValidationResult, SupportedLanguage, TestFramework, PackageManager } from '../types/testModels';

export interface LanguageGenerator {
  readonly language: SupportedLanguage;
  readonly supportedFrameworks: TestFramework[];
  readonly defaultFramework: TestFramework;
  readonly packageManager: PackageManager;

  generateProject(testSuite: TestSuite, config: LanguageConfig): GeneratedProject;
  validateConfiguration(config: LanguageConfig): ValidationResult;
  getDefaultConfiguration(): Partial<LanguageConfig>;
  getSetupInstructions(config: LanguageConfig): string[];
}

export abstract class BaseLanguageGenerator implements LanguageGenerator {
  abstract readonly language: SupportedLanguage;
  abstract readonly supportedFrameworks: TestFramework[];
  abstract readonly defaultFramework: TestFramework;
  abstract readonly packageManager: PackageManager;

  abstract generateProject(testSuite: TestSuite, config: LanguageConfig): GeneratedProject;
  
  validateConfiguration(config: LanguageConfig): ValidationResult {
    const errors = [];
    const warnings = [];

    if (config.language !== this.language) {
      errors.push({
        field: 'language',
        message: `Expected language ${this.language}, got ${config.language}`,
        code: 'INVALID_LANGUAGE'
      });
    }

    if (!this.supportedFrameworks.includes(config.framework)) {
      errors.push({
        field: 'framework',
        message: `Framework ${config.framework} is not supported for ${this.language}`,
        code: 'UNSUPPORTED_FRAMEWORK'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getDefaultConfiguration(): Partial<LanguageConfig> {
    return {
      language: this.language,
      framework: this.defaultFramework,
      packageManager: this.packageManager,
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
  }

  abstract getSetupInstructions(config: LanguageConfig): string[];

  protected generateFileName(testSuite: TestSuite, testCase: any, config: LanguageConfig, mode: 'consumer' | 'provider'): string {
    const sanitizedName = testSuite.name.replace(/[^a-zA-Z0-9]/g, '');
    const tag = testCase.tags?.[0] || 'default';
    const testType = testCase.type || 'test';
    
    switch (this.language) {
      case 'javascript':
        return `${tag}_${testCase.request.method.toLowerCase()}_${this.sanitizePath(testCase.request.path)}_${mode}_${testType}.test.js`;
      
      case 'java':
        return `${this.toPascalCase(sanitizedName)}${this.toPascalCase(mode)}${this.toPascalCase(testType)}Test.java`;
      
      case 'csharp':
        return `${this.toPascalCase(sanitizedName)}${this.toPascalCase(mode)}${this.toPascalCase(testType)}Tests.cs`;
      
      case 'python':
        return `test_${this.toSnakeCase(sanitizedName)}_${mode}_${testType}.py`;
      
      case 'go':
        return `${this.toSnakeCase(sanitizedName)}_${mode}_${testType}_test.go`;
      
      default:
        return `${sanitizedName}_${mode}_${testType}.test`;
    }
  }

  protected sanitizePath(path: string): string {
    return path.replace(/[{}]/g, '').replace(/\//g, '_').replace(/^_/, '');
  }

  protected toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_\s])(\w)/g, (_, char) => char.toUpperCase());
  }

  protected toCamelCase(str: string): string {
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  protected toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  protected toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
  }
}
