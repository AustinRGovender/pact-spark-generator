
import { BaseLanguageGenerator } from '../../utils/languageGenerator';
import { TestSuite, GeneratedProject, LanguageConfig, SupportedLanguage, TestFramework, PackageManager, GeneratedFile } from '../../types/testModels';
import { TemplateEngine, TemplateContext } from '../../utils/templateEngine';

export class JavaScriptPactGenerator extends BaseLanguageGenerator {
  readonly language: SupportedLanguage = 'javascript';
  readonly supportedFrameworks: TestFramework[] = ['jest', 'mocha', 'jasmine'];
  readonly defaultFramework: TestFramework = 'jest';
  readonly packageManager: PackageManager = 'npm';
  
  private templateEngine: TemplateEngine;

  constructor() {
    super();
    this.templateEngine = new TemplateEngine();
  }

  generateProject(testSuite: TestSuite, config: LanguageConfig): GeneratedProject {
    const files: GeneratedFile[] = [];
    
    // Group tests by type and endpoint
    const groupedTests = this.groupTestsByTypeAndEndpoint(testSuite.tests);
    
    // Generate consumer tests
    Object.entries(groupedTests).forEach(([groupKey, tests]) => {
      const consumerFile = this.generateConsumerTestFile(testSuite, tests, config);
      files.push(consumerFile);
      
      const providerFile = this.generateProviderTestFile(testSuite, tests, config);
      files.push(providerFile);
    });

    // Generate package.json
    const packageFile = this.generatePackageJsonFile(testSuite, config);
    files.push(packageFile);

    // Generate jest config if using Jest
    if (config.framework === 'jest') {
      const jestConfigFile = this.generateJestConfigFile(config);
      files.push(jestConfigFile);
    }

    return {
      files,
      projectStructure: {
        rootDir: '.',
        testDir: './tests',
        configFiles: ['package.json', 'jest.config.js'],
        sourceFiles: files.map(f => f.path)
      },
      setupInstructions: this.getSetupInstructions(config),
      dependencies: this.getDependencies(config),
      configuration: {
        packageManager: this.packageManager,
        testFramework: config.framework,
        language: this.language,
        version: config.version
      }
    };
  }

  private groupTestsByTypeAndEndpoint(tests: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    tests.forEach(test => {
      const groupKey = `${test.tags[0] || 'default'}_${test.request.method}_${this.sanitizePath(test.request.path)}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(test);
    });
    
    return groups;
  }

  private generateConsumerTestFile(testSuite: TestSuite, tests: any[], config: LanguageConfig): GeneratedFile {
    const context: TemplateContext = {
      testSuite: { ...testSuite, tests },
      config,
      helpers: this.templateEngine['helpers']
    };

    const content = this.templateEngine.render('javascript/consumer', context);
    const firstTest = tests[0];
    const filename = this.generateFileName(testSuite, firstTest, config, 'consumer');

    return {
      path: `tests/${filename}`,
      content,
      type: 'test',
      language: this.language
    };
  }

  private generateProviderTestFile(testSuite: TestSuite, tests: any[], config: LanguageConfig): GeneratedFile {
    const context: TemplateContext = {
      testSuite: { ...testSuite, tests },
      config,
      helpers: this.templateEngine['helpers']
    };

    const content = this.templateEngine.render('javascript/provider', context);
    const firstTest = tests[0];
    const filename = this.generateFileName(testSuite, firstTest, config, 'provider');

    return {
      path: `tests/${filename}`,
      content,
      type: 'test',
      language: this.language
    };
  }

  private generatePackageJsonFile(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const context: TemplateContext = {
      testSuite,
      config,
      helpers: this.templateEngine['helpers']
    };

    const content = this.templateEngine.render('javascript/package', context);

    return {
      path: 'package.json',
      content,
      type: 'config',
      language: this.language
    };
  }

  private generateJestConfigFile(config: LanguageConfig): GeneratedFile {
    const jestConfig = {
      testEnvironment: 'node',
      testMatch: ['**/tests/**/*.test.js'],
      collectCoverageFrom: ['src/**/*.js'],
      coverageDirectory: 'coverage',
      verbose: true
    };

    return {
      path: 'jest.config.js',
      content: `module.exports = ${JSON.stringify(jestConfig, null, 2)};`,
      type: 'config',
      language: this.language
    };
  }

  private getDependencies(config: LanguageConfig) {
    const dependencies = [
      {
        name: '@pact-foundation/pact',
        version: '^12.0.0',
        scope: 'development' as const,
        manager: this.packageManager
      }
    ];

    switch (config.framework) {
      case 'jest':
        dependencies.push({
          name: 'jest',
          version: '^29.0.0',
          scope: 'development' as const,
          manager: this.packageManager
        });
        break;
      case 'mocha':
        dependencies.push({
          name: 'mocha',
          version: '^10.0.0',
          scope: 'development' as const,
          manager: this.packageManager
        });
        break;
      case 'jasmine':
        dependencies.push({
          name: 'jasmine',
          version: '^4.0.0',
          scope: 'development' as const,
          manager: this.packageManager
        });
        break;
    }

    return dependencies;
  }

  getSetupInstructions(config: LanguageConfig): string[] {
    const packageManagerCmd = config.packageManager === 'yarn' ? 'yarn' : 'npm';
    
    return [
      '1. Install dependencies:',
      `   ${packageManagerCmd} install`,
      '',
      '2. Run consumer tests:',
      `   ${packageManagerCmd} run test:consumer`,
      '',
      '3. Run provider tests:',
      `   ${packageManagerCmd} run test:provider`,
      '',
      '4. Run all tests:',
      `   ${packageManagerCmd} test`,
      '',
      '5. Generate Pact files:',
      '   Consumer tests will generate pact files in the ./pacts directory',
      '',
      '6. Publish Pacts (optional):',
      '   Configure pact broker settings and run pact publishing commands'
    ];
  }
}
