
import { TestSuite } from '../types/testModels';
import { LanguageConfig, GeneratedOutput, SupportedLanguage } from '../types/languageTypes';

export abstract class LanguageGenerator {
  protected language: SupportedLanguage;

  constructor(language: SupportedLanguage) {
    this.language = language;
  }

  abstract generateTestSuite(testSuite: TestSuite, config: LanguageConfig): GeneratedOutput;
  abstract getSupportedFrameworks(): string[];
  abstract getSupportedPackageManagers(): string[];
  abstract getFeatures(): string[];

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
