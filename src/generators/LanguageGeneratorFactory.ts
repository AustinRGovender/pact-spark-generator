import { SupportedLanguage, LanguageConfig, GeneratedOutput } from '../types/languageTypes';
import { TestSuite } from '../types/testModels';
import { LanguageGenerator } from '../utils/languageGenerator';
import { JavaScriptPactGenerator } from './javascript/JavaScriptPactGenerator';
import { JavaPactGenerator } from './java/JavaPactGenerator';
import { CSharpPactGenerator } from './csharp/CSharpPactGenerator';
import { PythonPactGenerator } from './python/PythonPactGenerator';
import { GoPactGenerator } from './go/GoPactGenerator';

export class LanguageGeneratorFactory {
  private static generators: Map<SupportedLanguage, new () => LanguageGenerator> = new Map();

  static {
    // Initialize generators map with all supported languages
    this.generators.set('javascript', JavaScriptPactGenerator);
    this.generators.set('java', JavaPactGenerator);
    this.generators.set('csharp', CSharpPactGenerator);
    this.generators.set('python', PythonPactGenerator);
    this.generators.set('go', GoPactGenerator);
  }

  static createGenerator(language: SupportedLanguage): LanguageGenerator {
    const GeneratorClass = this.generators.get(language);
    
    if (!GeneratorClass) {
      throw new Error(`Unsupported language: ${language}. Supported languages: ${Array.from(this.generators.keys()).join(', ')}`);
    }
    
    return new GeneratorClass();
  }

  static getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.generators.keys());
  }

  static registerGenerator(language: SupportedLanguage, generatorClass: new () => LanguageGenerator): void {
    this.generators.set(language, generatorClass);
  }

  static generateTests(
    testSuite: TestSuite,
    languageConfig: LanguageConfig
  ): GeneratedOutput {
    const generator = this.createGenerator(languageConfig.language);
    return generator.generateTestSuite(testSuite, languageConfig);
  }

  static validateLanguageSupport(language: SupportedLanguage): boolean {
    return this.generators.has(language);
  }

  static getGeneratorCapabilities(language: SupportedLanguage): {
    supportedFrameworks: string[];
    supportedPackageManagers: string[];
    features: string[];
  } {
    const generator = this.createGenerator(language);
    return {
      supportedFrameworks: generator.getSupportedFrameworks(),
      supportedPackageManagers: generator.getSupportedPackageManagers(),
      features: generator.getFeatures()
    };
  }
}