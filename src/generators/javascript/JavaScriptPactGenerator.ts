
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
    const template = `const { Pact, Matchers } = require('@pact-foundation/pact');
const path = require('path');
const axios = require('axios');

// Import your consumer code here
// const { apiClient } = require('../src/api-client');

describe('{{consumerName}} - Consumer Pact Tests', () => {
  const provider = new Pact({
    consumer: '{{consumerName}}',
    provider: '{{providerName}}',
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info'
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

{{#each endpointGroups}}
  describe('{{endpoint}} endpoint', () => {
{{#each tests}}
    describe('{{method}} {{../endpoint}}', () => {
      it('{{description}}', async () => {
        // Arrange - Set up the interaction
        await provider
          .given('{{providerState}}')
          .uponReceiving('{{description}}')
          .withRequest({
            method: '{{method}}',
            path: '{{path}}'{{#if query}},
            query: {{json query}}{{/if}}{{#if headers}},
            headers: {
              'Content-Type': 'application/json',
              {{#each headers}}
              '{{@key}}': '{{this}}'{{#unless @last}},{{/unless}}
              {{/each}}
            }{{else}},
            headers: {
              'Content-Type': 'application/json'
            }{{/if}}{{#if body}},
            body: {{pactMatchers body}}{{/if}}
          })
          .willRespondWith({
            status: {{status}},
            headers: {
              'Content-Type': 'application/json'
            },
            body: {{pactMatchers responseBody}}
          });

        // Act - Call your consumer code here
        const response = await axios({
          method: '{{method}}',
          url: \`\${provider.mockService.baseUrl}{{path}}\`{{#if body}},
          data: {{json body}}{{/if}}{{#if headers}},
          headers: {{json headers}}{{/if}}
        });

        // Assert - Verify the response
        expect(response.status).toBe({{status}});
        expect(response.data).toMatchObject({{json responseBody}});
      });
    });
{{/each}}
  });
{{/each}}
});`;

    // Group tests by endpoint for better organization
    const endpointGroups = this.groupTestsByEndpoint(testSuite.tests);
    
    const content = this.renderTemplate(template, {
      consumerName: testSuite.consumer,
      providerName: testSuite.provider,
      endpointGroups,
      json: (obj: any) => JSON.stringify(obj, null, 2),
      pactMatchers: (obj: any) => this.generatePactMatchers(obj)
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
const express = require('express');

// Import your provider app
// const { createApp } = require('../src/app');

describe('{{providerName}} - Provider Verification', () => {
  let server;
  let app;
  const PORT = process.env.PORT || 3000;
  const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL || \`http://localhost:\${PORT}\`;

  beforeAll(async () => {
    // Set up your Express app
    app = express();
    app.use(express.json());
    
    // Add your API routes here
    // app.use('/api', require('../src/routes'));
    
    // Start the server
    server = app.listen(PORT, () => {
      console.log(\`Provider server running on port \${PORT}\`);
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('should validate the expectations of {{consumerName}}', async () => {
    const opts = {
      provider: '{{providerName}}',
      providerBaseUrl: PROVIDER_BASE_URL,
      pactUrls: [
        path.resolve(process.cwd(), 'pacts', '{{kebabCase consumerName}}-{{kebabCase providerName}}.json')
      ],
      stateHandlers: {
{{#each providerStates}}
        '{{this}}': async () => {
          console.log('Setting up provider state: {{this}}');
          // Add your state setup logic here
          // Example: await setupTestData();
          return Promise.resolve('Provider state "{{this}}" has been set up');
        },
{{/each}}
        // Default state handler for states without specific implementation
        default: async () => {
          console.log('Default state handler - no specific setup required');
          return Promise.resolve('Default state configured');
        }
      },
      // Enable verbose logging for debugging
      logLevel: 'debug',
      // Optional: Publish verification results to Pact Broker
      // publishVerificationResult: process.env.CI === 'true',
      // providerVersion: process.env.GIT_COMMIT || '1.0.0',
      // enablePending: true
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

    // Add HTTP client for consumer tests
    if (!isProviderMode) {
      dependencies.push({
        name: 'axios',
        version: '^1.6.0',
        scope: 'development',
        manager: config.packageManager,
        description: 'HTTP client for testing API calls'
      });
    }

    // Add Express for provider tests
    if (isProviderMode) {
      dependencies.push({
        name: 'express',
        version: '^4.18.0',
        scope: 'development',
        manager: config.packageManager,
        description: 'Express server for provider testing'
      });
    }

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
        },
        {
          name: 'chai',
          version: '^4.3.0',
          scope: 'development',
          manager: config.packageManager,
          description: 'Assertion library for Mocha'
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

  private groupTestsByEndpoint(tests: TestCase[]): Array<{endpoint: string, tests: TestCase[]}> {
    const grouped = tests.reduce((acc, test) => {
      const endpoint = test.request.path.split('?')[0]; // Remove query params for grouping
      if (!acc[endpoint]) {
        acc[endpoint] = [];
      }
      acc[endpoint].push({
        ...test,
        method: test.request.method,
        path: test.request.path,
        query: test.request.queryParams,
        headers: test.request.headers,
        body: test.request.body,
        status: test.response.status,
        responseBody: test.response.body,
        providerState: test.providerState || 'default state'
      });
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([endpoint, tests]) => ({
      endpoint,
      tests
    }));
  }

  private generatePactMatchers(obj: any): string {
    if (!obj) return 'undefined';
    
    const generateMatchers = (value: any): any => {
      if (typeof value === 'string') {
        return `Matchers.like('${value}')`;
      }
      if (typeof value === 'number') {
        return `Matchers.like(${value})`;
      }
      if (typeof value === 'boolean') {
        return `Matchers.like(${value})`;
      }
      if (Array.isArray(value)) {
        if (value.length > 0) {
          return `Matchers.eachLike(${generateMatchers(value[0])})`;
        }
        return `Matchers.eachLike({})`;
      }
      if (typeof value === 'object' && value !== null) {
        const matchedObj: any = {};
        for (const [key, val] of Object.entries(value)) {
          matchedObj[key] = generateMatchers(val);
        }
        return JSON.stringify(matchedObj, null, 2).replace(/"/g, '');
      }
      return JSON.stringify(value);
    };

    try {
      const result = generateMatchers(obj);
      return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    } catch (error) {
      return JSON.stringify(obj, null, 2);
    }
  }
}
