
import { LanguageGenerator } from '../../utils/languageGenerator';
import { TestSuite, TestCase } from '../../types/testModels';
import { LanguageConfig, GeneratedOutput, GeneratedFile, Dependency, ProjectStructure, ProjectConfiguration } from '../../types/languageTypes';

export class JavaScriptPactGenerator extends LanguageGenerator {
  constructor() {
    super('javascript');
  }

  generateTestSuite(testSuite: TestSuite, config: LanguageConfig): GeneratedOutput {
    const files: GeneratedFile[] = [];
    
    // Generate consumer tests
    files.push(this.generateConsumerTest(testSuite, config));
    
    // Generate provider tests
    files.push(this.generateProviderTest(testSuite, config));
    
    // Generate package.json
    files.push(this.generatePackageJsonFile(testSuite, config));

    // Generate jest config if using Jest
    if (config.framework === 'jest') {
      files.push(this.generateJestConfigFile(config));
    }

    return {
      files,
      projectStructure: this.generateProjectStructure(testSuite.name),
      setupInstructions: this.generateSetupInstructions(config),
      dependencies: this.generateDependencies(config),
      configuration: this.generateProjectConfiguration(config)
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
    const packageJson = {
      name: `${this.toKebabCase(testSuite.name)}-pact-tests`,
      version: "1.0.0",
      description: `Pact tests for ${testSuite.name}`,
      scripts: {
        test: config.framework === 'jest' ? 'jest' : config.framework,
        "test:consumer": `${config.framework} --testPathPattern=consumer`,
        "test:provider": `${config.framework} --testPathPattern=provider`
      },
      devDependencies: this.generateDependencies(config).reduce((deps, dep) => {
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

  private generateDependencies(config: LanguageConfig): Dependency[] {
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

  private generateProjectStructure(projectName: string): ProjectStructure {
    return {
      rootDir: '.',
      testDir: './tests',
      configFiles: ['package.json', 'jest.config.js'],
      sourceFiles: ['tests/'],
      packageFile: 'package.json'
    };
  }

  private generateProjectConfiguration(config: LanguageConfig): ProjectConfiguration {
    return {
      packageManager: config.packageManager,
      testFramework: config.framework,
      language: 'javascript',
      version: config.version,
      scripts: {
        test: config.framework === 'jest' ? 'jest' : config.framework,
        'test:consumer': `${config.framework} --testPathPattern=consumer`,
        'test:provider': `${config.framework} --testPathPattern=provider`
      },
      settings: {
        testFramework: config.framework,
        packageManager: config.packageManager
      }
    };
  }

  private generateSetupInstructions(config: LanguageConfig): string[] {
    const packageManagerCmd = config.packageManager === 'yarn' ? 'yarn' : 
                             config.packageManager === 'pnpm' ? 'pnpm' :
                             config.packageManager === 'bun' ? 'bun' : 'npm';
    
    return [
      '# JavaScript Pact Testing Setup',
      '',
      '## Prerequisites',
      '- Node.js 16 or higher',
      `- ${config.packageManager} package manager`,
      '',
      '## Installation',
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
      '## Configuration',
      '- Consumer tests generate pact files in ./pacts directory',
      '- Provider tests verify against pact files',
      '- Configure provider base URL via PROVIDER_BASE_URL environment variable',
      '',
      `## Framework: ${config.framework}`,
      '- Supports async/await patterns',
      '- Built-in mocking and verification',
      '- Comprehensive assertion methods'
    ];
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
