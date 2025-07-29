
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

    // Generate jest config if using Jest (with advanced configuration)
    if (config.framework === 'jest') {
      files.push(this.generateJestConfigFile(config));
      if (config.advancedConfig) {
        files.push(this.generateJestSetupFile(config));
      }
    }

    // Generate supporting files
    if (!testSuite.isProviderMode) {
      files.push(this.generateApiClientFile(config));
    }

    // Generate .env example file
    files.push(this.generateEnvFile(testSuite.isProviderMode, config));

    // Generate README
    files.push(this.generateReadmeFile(testSuite, config));

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
    const endpointGroups = this.groupTestsByEndpoint(testSuite.tests);
    const consumerName = testSuite.consumer || 'Consumer';
    const providerName = testSuite.provider || 'Provider';
    
    const content = `const { Pact, Matchers } = require('@pact-foundation/pact');
const path = require('path');
const axios = require('axios');

describe('${consumerName} - Consumer Pact Tests', () => {
  const provider = new Pact({
    consumer: '${consumerName}',
    provider: '${providerName}',
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info'
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());
${endpointGroups.map(group => `
  describe('${group.endpoint} endpoint', () => {
${group.tests.map(test => `    it('${test.description}', async () => {
      // Arrange - Set up the interaction
      await provider
        .given('${test.providerState || 'default state'}')
        .uponReceiving('${test.description}')
        .withRequest({
          method: '${test.request.method}',
          path: '${test.request.path}'${test.request.queryParams ? `,
          query: ${JSON.stringify(test.request.queryParams)}` : ''}${test.request.headers ? `,
          headers: ${JSON.stringify(test.request.headers)}` : `,
          headers: {
            'Content-Type': 'application/json'
          }`}${test.request.body ? `,
          body: ${this.generatePactMatchers(test.request.body)}` : ''}
        })
        .willRespondWith({
          status: ${test.response.status},
          headers: {
            'Content-Type': 'application/json'
          },
          body: ${this.generatePactMatchers(test.response.body)}
        });

      // Act - Make the actual API call
      const response = await axios({
        method: '${test.request.method}',
        url: \`\${provider.mockService.baseUrl}${test.request.path}\`${test.request.body ? `,
        data: ${JSON.stringify(test.request.body)}` : ''}${test.request.headers ? `,
        headers: ${JSON.stringify(test.request.headers)}` : ''}
      });

      // Assert - Verify the response
      expect(response.status).toBe(${test.response.status});
      expect(response.data).toMatchObject(${JSON.stringify(test.response.body)});
    });`).join('\n')}
  });`).join('')}
});`;

    return {
      path: `tests/${this.sanitizeName(consumerName)}_consumer.test.js`,
      content,
      type: 'test',
      language: 'javascript',
      description: 'Consumer Pact tests'
    };
  }

  private generateProviderTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const consumerName = testSuite.consumer || 'Consumer';
    const providerName = testSuite.provider || 'Provider';
    const providerStates = Array.from(new Set(testSuite.tests.map(t => t.providerState).filter(Boolean)));
    const kebabConsumer = this.toKebabCase(consumerName);
    const kebabProvider = this.toKebabCase(providerName);
    
    // Generate Express routes based on test operations
    const routeImplementations = this.generateProviderRoutes(testSuite);
    
    const content = `const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const express = require('express');

describe('${providerName} - Provider Verification', () => {
  let server;
  let app;
  const PORT = process.env.PORT || 3000;
  const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL || \`http://localhost:\${PORT}\`;

  beforeAll(async () => {
    // Set up Express app with actual routes
    app = express();
    app.use(express.json());
    
    ${routeImplementations}
    
    // Start the server
    server = await new Promise((resolve, reject) => {
      const srv = app.listen(PORT, (err) => {
        if (err) reject(err);
        else {
          console.log(\`Provider server running on port \${PORT}\`);
          resolve(srv);
        }
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('should validate the expectations of ${consumerName}', async () => {
    const opts = {
      provider: '${providerName}',
      providerBaseUrl: PROVIDER_BASE_URL,
      pactUrls: [
        path.resolve(process.cwd(), 'pacts', '${kebabConsumer}-${kebabProvider}.json')
      ],
      stateHandlers: {
${providerStates.map(state => `        '${state}': async () => {
          console.log('Setting up provider state: ${state}');
          // State setup completed
          return Promise.resolve();
        }`).join(',\n')}${providerStates.length > 0 ? ',' : ''}
        'default state': async () => {
          console.log('Default state - no specific setup required');
          return Promise.resolve();
        }
      },
      logLevel: 'debug',
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_COMMIT || '1.0.0'
    };

    return new Verifier(opts).verifyProvider();
  });
});`;

    return {
      path: `tests/${this.sanitizeName(providerName)}_provider.test.js`,
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
    const advancedConfig = config.advancedConfig;
    
    const jestConfig = {
      testEnvironment: 'node',
      testMatch: ['**/tests/**/*.test.js'],
      collectCoverageFrom: ['src/**/*.js'],
      coverageDirectory: 'coverage',
      verbose: advancedConfig?.execution?.verbose ?? true,
      ...(advancedConfig?.timeouts && {
        testTimeout: advancedConfig.timeouts.test,
        timeout: advancedConfig.timeouts.suite
      }),
      ...(advancedConfig?.execution?.maxConcurrency && {
        maxWorkers: advancedConfig.execution.parallel ? advancedConfig.execution.maxConcurrency : 1
      }),
      ...(advancedConfig?.execution?.randomOrder && {
        randomize: true
      }),
      ...(advancedConfig?.execution?.stopOnFirstFailure && {
        bail: 1
      }),
      ...(config.advancedConfig && {
        setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
      })
    };

    return {
      path: 'jest.config.js',
      content: `module.exports = ${JSON.stringify(jestConfig, null, 2)};`,
      type: 'config',
      language: 'javascript',
      description: 'Jest configuration with advanced settings'
    };
  }

  private generateJestSetupFile(config: LanguageConfig): GeneratedFile {
    const advancedConfig = config.advancedConfig;
    
    const setupContent = `// Jest setup file for Pact tests with advanced configuration
const { execSync } = require('child_process');

// Advanced configuration
const config = ${JSON.stringify(advancedConfig || {}, null, 2)};

// Global test setup
beforeAll(() => {
  ${advancedConfig?.logging?.enableConsole ? "console.log('Starting Pact tests...');" : "// Console logging disabled"}
  ${advancedConfig?.environment?.loadFromSystem ? `
  // Load environment variables
  if (config.environment?.configFile) {
    require('dotenv').config({ path: config.environment.configFile });
  }
  ` : ''}
});

afterAll(() => {
  ${advancedConfig?.logging?.enableConsole ? "console.log('Pact tests completed');" : "// Console logging disabled"}
});

// Configure request timeouts
if (config.timeouts?.request) {
  jest.setTimeout(config.timeouts.request);
}

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  ${advancedConfig?.logging?.level === 'debug' || advancedConfig?.logging?.level === 'trace' ? 
    "console.error('Unhandled Rejection at:', promise, 'reason:', reason);" : 
    "// Error logging configured"
  }
});

// Custom headers setup
global.defaultHeaders = config.network?.defaultHeaders || {};

// Retry configuration
global.retryConfig = config.retry || { enabled: false };

// Axios retry interceptor (if retry is enabled)
if (global.retryConfig.enabled) {
  const axios = require('axios');
  
  axios.interceptors.response.use(
    response => response,
    async error => {
      const { config: axiosConfig } = error;
      
      if (!axiosConfig || !axiosConfig.retry) {
        axiosConfig.retry = { count: 0 };
      }
      
      const shouldRetry = 
        axiosConfig.retry.count < global.retryConfig.maxAttempts &&
        (global.retryConfig.retryOnStatus.includes(error.response?.status) ||
         (global.retryConfig.retryOnTimeout && error.code === 'ECONNABORTED'));
      
      if (shouldRetry) {
        axiosConfig.retry.count++;
        
        // Calculate delay based on backoff strategy
        let delay = global.retryConfig.baseDelay;
        if (global.retryConfig.backoffStrategy === 'exponential') {
          delay *= Math.pow(2, axiosConfig.retry.count - 1);
        } else if (global.retryConfig.backoffStrategy === 'linear') {
          delay *= axiosConfig.retry.count;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return axios(axiosConfig);
      }
      
      return Promise.reject(error);
    }
  );
}`;

    return {
      path: 'jest.setup.js',
      content: setupContent,
      type: 'config',
      language: 'javascript',
      description: 'Jest setup file with advanced test configuration'
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
        query: test.request.queryParams || {},
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

  private generateProviderRoutes(testSuite: TestSuite): string {
    const routes = new Map<string, Set<string>>();
    
    // Collect unique paths and methods
    testSuite.tests.forEach(test => {
      const path = test.request.path;
      const method = test.request.method.toLowerCase();
      
      if (!routes.has(path)) {
        routes.set(path, new Set());
      }
      routes.get(path)!.add(method);
    });
    
    const routeCode = Array.from(routes.entries()).map(([path, methods]) => {
      const expressPath = path.replace(/{([^}]+)}/g, ':$1');
      
      return Array.from(methods).map(method => {
        // Find a sample response for this path/method
        const sampleTest = testSuite.tests.find(t => 
          t.request.path === path && t.request.method.toLowerCase() === method
        );
        
        const responseBody = sampleTest?.response.body || { message: 'Success' };
        const statusCode = sampleTest?.response.status || 200;
        
        return `    app.${method}('${expressPath}', (req, res) => {
      res.status(${statusCode}).json(${JSON.stringify(responseBody)});
    });`;
      }).join('\n');
    }).join('\n');
    
    return routeCode;
  }

  private generateApiClientFile(config?: LanguageConfig): GeneratedFile {
    const advancedConfig = config?.advancedConfig;
    
    const content = `const axios = require('axios');

class ApiClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...${JSON.stringify(advancedConfig?.network?.defaultHeaders || {})}
      },
      ${advancedConfig?.timeouts ? `timeout: ${advancedConfig.timeouts.request},` : ''}
      ${advancedConfig?.network?.maxConnections ? `maxConcurrency: ${advancedConfig.network.maxConnections},` : ''}
      ${advancedConfig?.network?.keepAlive ? `keepAlive: true,` : ''}
    });
  }

  async get(path, params = {}) {
    return this.client.get(path, { params });
  }

  async post(path, data = {}) {
    return this.client.post(path, data);
  }

  async put(path, data = {}) {
    return this.client.put(path, data);
  }

  async delete(path) {
    return this.client.delete(path);
  }

  async patch(path, data = {}) {
    return this.client.patch(path, data);
  }
}

module.exports = { ApiClient };`;

    return {
      path: 'src/api-client.js',
      content,
      type: 'setup',
      language: 'javascript',
      description: 'API client for making HTTP requests'
    };
  }

  private generateEnvFile(isProviderMode: boolean, config?: LanguageConfig): GeneratedFile {
    const advancedConfig = config?.advancedConfig;
    const envVars = advancedConfig?.environment?.variables || {};
    
    let baseContent = isProviderMode 
      ? `# Provider configuration
PORT=${advancedConfig?.network?.customPort || 3000}
PROVIDER_BASE_URL=${advancedConfig?.network?.baseUrl || 'http://localhost:3000'}

# Pact Broker configuration (optional)
PACT_BROKER_BASE_URL=
PACT_BROKER_USERNAME=
PACT_BROKER_PASSWORD=

# CI/CD configuration
CI=false
GIT_COMMIT=1.0.0`
      : `# Consumer configuration
API_BASE_URL=${advancedConfig?.network?.baseUrl || 'http://localhost:3000'}

# Test configuration
TEST_TIMEOUT=${advancedConfig?.timeouts?.test || 5000}`;

    // Add custom environment variables
    if (Object.keys(envVars).length > 0) {
      baseContent += '\n\n# Custom environment variables\n';
      Object.entries(envVars).forEach(([key, value]) => {
        baseContent += `${key}=${value}\n`;
      });
    }

    const content = baseContent;

    return {
      path: '.env.example',
      content,
      type: 'config',
      language: 'javascript',
      description: 'Environment variables template'
    };
  }

  private generateReadmeFile(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const isProviderMode = testSuite.isProviderMode;
    const testType = isProviderMode ? 'Provider' : 'Consumer';
    const packageManagerCmd = config.packageManager === 'yarn' ? 'yarn' : 
                             config.packageManager === 'pnpm' ? 'pnpm' :
                             config.packageManager === 'bun' ? 'bun' : 'npm';

    const content = `# ${testSuite.name} Pact ${testType} Tests

## Overview
This project contains Pact ${testType.toLowerCase()} tests for the ${testSuite.name} API.

## Getting Started

### Prerequisites
- Node.js 16 or higher
- ${config.packageManager} package manager

### Installation
\`\`\`bash
${packageManagerCmd} install
\`\`\`

### Running Tests
\`\`\`bash
# Run all tests
${packageManagerCmd} test

# Run ${testType.toLowerCase()} tests only
${packageManagerCmd} run test:${testType.toLowerCase()}
\`\`\`

${isProviderMode ? `### Provider Testing
This project verifies that the provider implementation matches the contract defined by the consumer.

#### Configuration
- Set \`PROVIDER_BASE_URL\` environment variable to point to your running provider
- Ensure your provider server is running before executing tests
- Pact files should be available in the \`./pacts\` directory

#### Provider States
The following provider states are implemented:
${Array.from(new Set(testSuite.tests.map(t => t.providerState).filter(Boolean))).map(state => `- ${state}`).join('\n')}

#### Express Server Routes
The test includes a mock Express server with the following routes:
${Array.from(new Set(testSuite.tests.map(t => `${t.request.method} ${t.request.path}`))).map(route => `- ${route}`).join('\n')}` : `### Consumer Testing
This project generates contract files that define the expected behavior of the provider.

#### Generated Contracts
- Pact files are generated in the \`./pacts\` directory
- These files should be shared with the provider team for verification

#### API Client
A reusable API client is included at \`src/api-client.js\` for making HTTP requests.

#### Test Structure
Tests are organized by endpoint:
${Array.from(new Set(testSuite.tests.map(t => t.request.path))).map(path => `- ${path}`).join('\n')}`}

## Project Structure
\`\`\`
.
├── tests/                  # Test files
├── src/                    # Source files (consumer only)
├── pacts/                  # Generated pact files
├── package.json           # Dependencies and scripts
├── jest.config.js         # Jest configuration
├── .env.example          # Environment variables template
└── README.md             # This file
\`\`\`

## Framework: ${config.framework}
This project uses ${config.framework} as the testing framework with the following features:
- Async/await support
- Built-in mocking and assertions
- Comprehensive test reporting

## Contributing
1. Make changes to the OpenAPI specification
2. Regenerate tests using the Pact generator
3. Update provider states as needed
4. Run tests to verify functionality

## Support
For questions or issues, please refer to the Pact documentation:
- [Pact JS Documentation](https://docs.pact.io/implementation_guides/javascript)
- [Pact Foundation](https://pact.io/)`;

    return {
      path: 'README.md',
      content,
      type: 'documentation',
      language: 'javascript',
      description: 'Project documentation and setup instructions'
    };
  }

}
