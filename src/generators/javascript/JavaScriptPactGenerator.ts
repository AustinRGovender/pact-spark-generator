
import { LanguageGenerator } from '../../utils/languageGenerator';
import { TestSuite, TestCase } from '../../types/testModels';
import { LanguageConfig, GeneratedOutput, GeneratedFile, Dependency, ProjectStructure, ProjectConfiguration } from '../../types/languageTypes';

export class JavaScriptPactGenerator extends LanguageGenerator {
  constructor() {
    super('javascript');
  }

  generateTestSuite(testSuite: TestSuite, config: LanguageConfig): GeneratedOutput {
    const files: GeneratedFile[] = [];
    
    // Generate tests based on mode
    if (testSuite.isProviderMode) {
      // Provider mode: only generate provider verification tests
      files.push(this.generateProviderTest(testSuite, config));
    } else {
      // Consumer mode: only generate consumer tests
      files.push(this.generateConsumerTest(testSuite, config));
    }
    
    // Generate package.json
    files.push(this.generatePackageJsonFile(testSuite, config));

    // Generate jest config if using Jest
    if (config.framework === 'jest') {
      files.push(this.generateJestConfigFile(config));
    }

    return {
      files,
      projectStructure: this.generateProjectStructure(testSuite.name, testSuite.isProviderMode),
      setupInstructions: this.generateSetupInstructions(config, testSuite.isProviderMode),
      dependencies: this.generateDependencies(config, testSuite.isProviderMode),
      configuration: this.generateProjectConfiguration(config, testSuite.isProviderMode)
    };
  }

  getSupportedFrameworks(): string[] {
    return ['jest', 'mocha', 'jasmine', 'vitest'];
  }

  getSupportedPackageManagers(): string[] {
    return ['npm', 'yarn', 'pnpm', 'bun'];
  }

  getFeatures(): string[] {
    return [
      'Consumer Tests',
      'Provider Tests',
      'Mock Server Setup',
      'Pact File Generation',
      'State Management',
      'Multiple Test Frameworks'
    ];
  }

  private generateConsumerTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('{{consumerName}} - Consumer Test', () => {
  const provider = new Pact({
    consumer: '{{consumerName}}',
    provider: '{{providerName}}',
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info'
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

{{#each tests}}
  describe('{{name}}', () => {
    it('{{description}}', async () => {
      await provider
        .given('{{scenario.given}}')
        .uponReceiving('{{description}}')
        .withRequest({
          method: '{{request.method}}',
          path: '{{request.path}}'{{#if request.body}},
          body: {{json request.body}}{{/if}}{{#if request.headers}},
          headers: {{json request.headers}}{{/if}}
        })
        .willRespondWith({
          status: {{response.status}},
          headers: {{json response.headers}},
          body: {{json response.body}}
        });

      // Add your consumer code here
    });
  });
{{/each}}
});`;

    const content = this.renderTemplate(template, {
      consumerName: testSuite.consumer,
      providerName: testSuite.provider,
      tests: testSuite.tests,
      json: (obj: any) => JSON.stringify(obj, null, 2)
    });

    return {
      path: `tests/${this.sanitizeName(testSuite.consumer)}_consumer.test.js`,
      content,
      type: 'test',
      language: 'javascript',
      description: 'Consumer Pact tests'
    };
  }

  private generateProviderTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `const { Verifier } = require('@pact-foundation/pact');
const path = require('path');

describe('{{providerName}} - Provider Verification', () => {
  it('should validate the expectations of {{consumerName}}', () => {
    const opts = {
      provider: '{{providerName}}',
      providerBaseUrl: process.env.PROVIDER_BASE_URL || 'http://localhost:3000',
      pactUrls: [
        path.resolve(process.cwd(), 'pacts', '{{kebabCase consumerName}}-{{kebabCase providerName}}.json')
      ],
      stateHandlers: {
{{#each providerStates}}
        '{{this}}': () => {
          console.log('Setting up state: {{this}}');
          return Promise.resolve('State setup complete');
        },
{{/each}}
      }
    };

    return new Verifier(opts).verifyProvider();
  });
});`;

    const providerStates = Array.from(new Set(testSuite.tests.map(t => t.providerState).filter(Boolean)));
    
    const content = this.renderTemplate(template, {
      consumerName: testSuite.consumer,
      providerName: testSuite.provider,
      providerStates,
      kebabCase: (str: string) => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '')
    });

    return {
      path: `tests/${this.sanitizeName(testSuite.provider)}_provider.test.js`,
      content,
      type: 'test',
      language: 'javascript',
      description: 'Provider Pact verification tests'
    };
  }

  private generatePackageJsonFile(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const isProviderMode = testSuite.isProviderMode;
    const testType = isProviderMode ? 'provider' : 'consumer';
    
    const scripts: Record<string, string> = {
      test: config.framework === 'jest' ? 'jest' : config.framework
    };
    
    if (isProviderMode) {
      scripts["test:provider"] = `${config.framework} --testPathPattern=provider`;
    } else {
      scripts["test:consumer"] = `${config.framework} --testPathPattern=consumer`;
    }
    
    const packageJson = {
      name: `${this.toKebabCase(testSuite.name)}-pact-${testType}-tests`,
      version: "1.0.0",
      description: `Pact ${testType} tests for ${testSuite.name}`,
      scripts,
      devDependencies: this.generateDependencies(config, isProviderMode).reduce((deps, dep) => {
        deps[dep.name] = dep.version;
        return deps;
      }, {} as Record<string, string>)
    };

    return {
      path: 'package.json',
      content: JSON.stringify(packageJson, null, 2),
      type: 'dependency',
      language: 'javascript',
      description: 'Node.js package configuration'
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
      language: 'javascript',
      description: 'Jest configuration'
    };
  }

  private generateDependencies(config: LanguageConfig, isProviderMode?: boolean): Dependency[] {
    const dependencies: Dependency[] = [
      {
        name: '@pact-foundation/pact',
        version: '^12.0.0',
        scope: 'development',
        manager: config.packageManager,
        description: 'Pact testing framework'
      }
    ];

    switch (config.framework) {
      case 'jest':
        dependencies.push({
          name: 'jest',
          version: '^29.0.0',
          scope: 'development',
          manager: config.packageManager,
          description: 'Jest testing framework'
        });
        break;
      case 'mocha':
        dependencies.push({
          name: 'mocha',
          version: '^10.0.0',
          scope: 'development',
          manager: config.packageManager,
          description: 'Mocha testing framework'
        });
        break;
      case 'jasmine':
        dependencies.push({
          name: 'jasmine',
          version: '^4.0.0',
          scope: 'development',
          manager: config.packageManager,
          description: 'Jasmine testing framework'
        });
        break;
      case 'vitest':
        dependencies.push({
          name: 'vitest',
          version: '^1.0.0',
          scope: 'development',
          manager: config.packageManager,
          description: 'Vitest testing framework'
        });
        break;
    }

    return dependencies;
  }

  private generateProjectStructure(projectName: string, isProviderMode?: boolean): ProjectStructure {
    return {
      rootDir: '.',
      testDir: './tests',
      configFiles: ['package.json', 'jest.config.js'],
      sourceFiles: ['tests/'],
      packageFile: 'package.json'
    };
  }

  private generateProjectConfiguration(config: LanguageConfig, isProviderMode?: boolean): ProjectConfiguration {
    const scripts: Record<string, string> = {
      test: config.framework === 'jest' ? 'jest' : config.framework
    };
    
    if (isProviderMode) {
      scripts['test:provider'] = `${config.framework} --testPathPattern=provider`;
    } else {
      scripts['test:consumer'] = `${config.framework} --testPathPattern=consumer`;
    }
    
    return {
      packageManager: config.packageManager,
      testFramework: config.framework,
      language: 'javascript',
      version: config.version,
      scripts,
      settings: {
        testFramework: config.framework,
        packageManager: config.packageManager,
        mode: isProviderMode ? 'provider' : 'consumer'
      }
    };
  }

  private generateSetupInstructions(config: LanguageConfig, isProviderMode?: boolean): string[] {
    const packageManagerCmd = config.packageManager === 'yarn' ? 'yarn' : 
                             config.packageManager === 'pnpm' ? 'pnpm' :
                             config.packageManager === 'bun' ? 'bun' : 'npm';
    
    const testType = isProviderMode ? 'Provider' : 'Consumer';
    const testCommand = isProviderMode ? 'test:provider' : 'test:consumer';
    
    const instructions = [
      `# JavaScript Pact ${testType} Testing Setup`,
      '',
      '## Prerequisites',
      '- Node.js 16 or higher',
      `- ${config.packageManager} package manager`,
      '',
      '## Installation',
      '1. Install dependencies:',
      `   ${packageManagerCmd} install`,
      '',
      `2. Run ${testType.toLowerCase()} tests:`,
      `   ${packageManagerCmd} run ${testCommand}`,
      '',
      '3. Run all tests:',
      `   ${packageManagerCmd} test`,
      '',
      '## Configuration'
    ];
    
    if (isProviderMode) {
      instructions.push(
        '- Provider tests verify against existing pact files',
        '- Configure provider base URL via PROVIDER_BASE_URL environment variable',
        '- Ensure provider states are properly implemented',
        '- Pact files should be available in ./pacts directory'
      );
    } else {
      instructions.push(
        '- Consumer tests generate pact files in ./pacts directory',
        '- Pact files are used by provider verification tests',
        '- Mock provider interactions are defined in test files'
      );
    }
    
    instructions.push(
      '',
      `## Framework: ${config.framework}`,
      '- Supports async/await patterns',
      '- Built-in mocking and verification',
      '- Comprehensive assertion methods'
    );
    
    return instructions;
  }

  private renderTemplate(template: string, context: any): string {
    let result = template;
    
    // Handle each loops
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      const array = context[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemContent = content;
        // Replace {{this}} and {{this.property}}
        itemContent = itemContent.replace(/\{\{this\.?(\w*)\}\}/g, (itemMatch, prop) => {
          return prop ? item[prop] : item;
        });
        // Replace other properties
        itemContent = itemContent.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (propMatch, propName) => {
          const value = this.getNestedValue(item, propName) || this.getNestedValue(context, propName);
          return value !== undefined ? String(value) : propMatch;
        });
        return itemContent;
      }).join('');
    });

    // Handle if statements
    result = result.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      const value = this.getNestedValue(context, condition);
      return value ? content : '';
    });

    // Replace simple variables
    result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, varName) => {
      const value = this.getNestedValue(context, varName);
      return value !== undefined ? String(value) : match;
    });

    // Handle function calls
    result = result.replace(/\{\{(\w+)\s+([^}]+)\}\}/g, (match, funcName, args) => {
      const func = context[funcName];
      if (typeof func === 'function') {
        const argValue = this.getNestedValue(context, args.trim());
        return func(argValue);
      }
      return match;
    });

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '');
  }
}
