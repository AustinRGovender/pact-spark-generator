
import { ParsedSpec, ParsedOperation } from './swaggerParser';
import { TestSuite, TestCase, TestScenario, TestRequest, TestResponse, TestSetup, TestMetadata, TestCaseType, SupportedLanguage, TestFramework } from '../types/testModels';
import { SecurityAnalyzer, AuthTestScenario } from './securityAnalyzer';
import { ErrorCaseGenerator, ErrorTestCase } from './errorCaseGenerator';
import { BoundaryTestGenerator } from './boundaryTestGenerator';
import { EdgeCaseGenerator } from './edgeCaseGenerator';
import { PerformanceTestGenerator } from './performanceTestGenerator';
import { EnhancedMockDataGenerator } from './enhancedMockDataGenerator';

export class TestGenerator {
  private securityAnalyzer: SecurityAnalyzer;

  constructor() {
    this.securityAnalyzer = new SecurityAnalyzer();
  }

  generateTestSuite(
    spec: ParsedSpec,
    language: SupportedLanguage = 'javascript',
    framework: TestFramework = 'jest',
    isProviderMode: boolean = false
  ): TestSuite {
    const securityAnalysis = this.securityAnalyzer.analyzeSpec(spec);
    const allTests: TestCase[] = [];

    spec.operations.forEach((operation) => {
      // Generate success case tests
      const successTests = this.generateSuccessTests(operation, spec);
      allTests.push(...successTests);

      // Generate authentication tests
      const authTests = this.generateAuthTests(operation, spec, securityAnalysis);
      allTests.push(...authTests);

      // Generate error case tests
      const errorTests = this.generateErrorTests(operation, spec);
      allTests.push(...errorTests);

      // Generate boundary tests
      const boundaryTests = this.generateBoundaryTests(operation, spec);
      allTests.push(...boundaryTests);

      // Generate edge case tests
      const edgeTests = this.generateEdgeTests(operation, spec);
      allTests.push(...edgeTests);

      // Generate performance tests
      const performanceTests = this.generatePerformanceTests(operation, spec);
      allTests.push(...performanceTests);
    });

    return {
      name: this.sanitizeName(spec.info.title),
      description: 'Generated Pact test suite',
      provider: this.sanitizeName(spec.info.title),
      consumer: `${this.sanitizeName(spec.info.title)}Consumer`,
      tests: allTests,
      setup: this.generateTestSetup(spec, language, framework),
      metadata: this.generateTestMetadata(spec, language, framework, isProviderMode),
      isProviderMode
    };
  }

  private generateSuccessTests(operation: ParsedOperation, spec: ParsedSpec): TestCase[] {
    const baseTest: TestCase = {
      id: this.generateTestId(operation, 'success'),
      name: `${operation.method}_${this.sanitizePath(operation.path)}_success`,
      description: `Should successfully handle ${operation.method} ${operation.path}`,
      type: 'success',
      scenario: {
        given: operation.summary || 'default state',
        when: `a ${operation.method} request is made to ${operation.path}`,
        then: 'a successful response should be returned'
      },
      request: this.generateTestRequest(operation),
      response: this.generateTestResponse(operation, 200),
      tags: [operation.tags?.[0] || 'default', 'success']
    };

    // Generate variations (minimal, maximal)
    const minimalTest = { ...baseTest };
    minimalTest.id = this.generateTestId(operation, 'success_minimal');
    minimalTest.name = `${operation.method}_${this.sanitizePath(operation.path)}_success_minimal`;
    minimalTest.description = 'Should handle minimal valid request';
    minimalTest.scenario.given = 'minimal data state';

    const maximalTest = { ...baseTest };
    maximalTest.id = this.generateTestId(operation, 'success_maximal');
    maximalTest.name = `${operation.method}_${this.sanitizePath(operation.path)}_success_maximal`;
    maximalTest.description = 'Should handle request with all optional fields';
    maximalTest.scenario.given = 'complete data state';

    return [baseTest, minimalTest, maximalTest];
  }

  private generateAuthTests(operation: ParsedOperation, spec: ParsedSpec, securityAnalysis: any): TestCase[] {
    const operationKey = `${operation.method} ${operation.path}`;
    const operationSecurity = securityAnalysis.operationSecurity[operationKey];
    
    if (!operationSecurity || operationSecurity.length === 0) {
      return [];
    }

    const authScenarios = this.securityAnalyzer.generateAuthTestScenarios(operationKey, operationSecurity);
    
    return authScenarios.map((scenario, index) => ({
      id: this.generateTestId(operation, `auth_${scenario.scenario}`),
      name: `${operation.method}_${this.sanitizePath(operation.path)}_auth_${scenario.scenario}`,
      description: `Should handle ${scenario.name.toLowerCase()}`,
      type: 'auth' as TestCaseType,
      scenario: {
        given: scenario.description,
        when: `a ${operation.method} request is made to ${operation.path} with ${scenario.name.toLowerCase()}`,
        then: `should return ${scenario.expectedStatus} status`,
        auth: {
          type: scenario.scenario as any,
          expectedStatus: scenario.expectedStatus,
          description: scenario.description
        }
      },
      request: this.generateTestRequest(operation),
      response: this.generateTestResponse(operation, scenario.expectedStatus),
      providerState: scenario.description,
      tags: [operation.tags?.[0] || 'default', 'auth']
    }));
  }

  private generateErrorTests(operation: ParsedOperation, spec: ParsedSpec): TestCase[] {
    const errorCases = ErrorCaseGenerator.generateErrorCases(operation);
    
    return errorCases.map(errorCase => ({
      id: this.generateTestId(operation, `error_${errorCase.name}`),
      name: `${operation.method}_${this.sanitizePath(operation.path)}_error_${errorCase.name}`,
      description: errorCase.description,
      type: 'error' as TestCaseType,
      scenario: {
        given: errorCase.providerState || 'error condition exists',
        when: `a ${operation.method} request is made to ${operation.path}`,
        then: `should return ${errorCase.statusCode} status`,
        errorCase: {
          statusCode: errorCase.statusCode,
          errorType: errorCase.name,
          description: errorCase.description,
          providerState: errorCase.providerState || ''
        }
      },
      request: this.generateTestRequest(operation, errorCase.requestModification),
      response: this.generateTestResponse(operation, errorCase.statusCode, errorCase.expectedError),
      providerState: errorCase.providerState,
      tags: [operation.tags?.[0] || 'default', 'error']
    }));
  }

  private generateBoundaryTests(operation: ParsedOperation, spec: ParsedSpec): TestCase[] {
    const boundaryTests = BoundaryTestGenerator.generateBoundaryTests(operation);
    
    return boundaryTests.map((boundaryTest, index) => ({
      id: this.generateTestId(operation, `boundary_${index}`),
      name: `${operation.method}_${this.sanitizePath(operation.path)}_boundary_${boundaryTest.category}`,
      description: boundaryTest.description,
      type: 'boundary' as TestCaseType,
      scenario: {
        given: 'boundary condition setup',
        when: `a ${operation.method} request is made with ${boundaryTest.category} values`,
        then: `should return ${boundaryTest.expected} result`,
        edgeCase: {
          type: 'boundary',
          description: boundaryTest.description,
          expectedBehavior: `should return ${boundaryTest.expected} result`
        }
      },
      request: this.generateTestRequest(operation, { modifyBody: boundaryTest.value }),
      response: this.generateTestResponse(operation, boundaryTest.errorCode || 200),
      tags: [operation.tags?.[0] || 'default', 'boundary']
    }));
  }

  private generateEdgeTests(operation: ParsedOperation, spec: ParsedSpec): TestCase[] {
    const edgeTests = EdgeCaseGenerator.generateEdgeCases(operation);
    
    return edgeTests.map((edgeTest, index) => ({
      id: this.generateTestId(operation, `edge_${index}`),
      name: `${operation.method}_${this.sanitizePath(operation.path)}_edge_${edgeTest.category}`,
      description: edgeTest.description,
      type: 'edge' as TestCaseType,
      scenario: {
        given: 'edge case condition',
        when: `a ${operation.method} request is made with ${edgeTest.category} scenario`,
        then: `should return ${edgeTest.expectedStatus} status`,
        edgeCase: {
          type: edgeTest.category as any,
          description: edgeTest.description,
          expectedBehavior: `should return ${edgeTest.expectedStatus} status`
        }
      },
      request: this.generateTestRequest(operation, { modifyBody: edgeTest.requestData }),
      response: this.generateTestResponse(operation, edgeTest.expectedStatus || 200),
      tags: [operation.tags?.[0] || 'default', 'edge']
    }));
  }

  private generatePerformanceTests(operation: ParsedOperation, spec: ParsedSpec): TestCase[] {
    const performanceTests = PerformanceTestGenerator.generatePerformanceTests(operation);
    
    return performanceTests.map((perfTest, index) => ({
      id: this.generateTestId(operation, `performance_${index}`),
      name: `${operation.method}_${this.sanitizePath(operation.path)}_perf_${perfTest.category}`,
      description: perfTest.description,
      type: 'performance' as TestCaseType,
      scenario: {
        given: 'performance test setup',
        when: `${perfTest.category} scenario is executed`,
        then: perfTest.expectedBehavior,
        edgeCase: {
          type: perfTest.category as any,
          description: perfTest.description,
          expectedBehavior: perfTest.expectedBehavior
        }
      },
      request: this.generateTestRequest(operation),
      response: this.generateTestResponse(operation, 200),
      tags: [operation.tags?.[0] || 'default', 'performance']
    }));
  }

  private generateTestRequest(operation: ParsedOperation, modifications?: any): TestRequest {
    const request: TestRequest = {
      method: operation.method,
      path: operation.path,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Add request body if operation requires it
    if (operation.requestBody?.content?.['application/json']?.schema) {
      const schema = operation.requestBody.content['application/json'].schema;
      request.body = EnhancedMockDataGenerator.generateAdvancedMockData(schema, 'request', {
        variation: 'valid',
        includeOptional: false,
        generateRealistic: true,
        respectConstraints: true
      });
    }

    // Apply modifications if provided
    if (modifications) {
      if (modifications.removeHeaders) {
        modifications.removeHeaders.forEach((header: string) => {
          delete request.headers![header];
        });
      }
      if (modifications.addHeaders) {
        request.headers = { ...request.headers, ...modifications.addHeaders };
      }
      if (modifications.modifyBody) {
        request.body = modifications.modifyBody;
      }
    }

    return request;
  }

  private generateTestResponse(operation: ParsedOperation, statusCode: number, errorBody?: any): TestResponse {
    const response: TestResponse = {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (errorBody) {
      response.body = errorBody;
    } else if (operation.responses?.[statusCode.toString()]?.content?.['application/json']?.schema) {
      const schema = operation.responses[statusCode.toString()].content['application/json'].schema;
      response.body = EnhancedMockDataGenerator.generateAdvancedMockData(schema, 'response', {
        variation: 'valid',
        includeOptional: true,
        generateRealistic: true,
        respectConstraints: true
      });
    } else {
      response.body = statusCode >= 400 ? { error: 'Error occurred' } : { success: true };
    }

    return response;
  }

  private generateTestSetup(spec: ParsedSpec, language: SupportedLanguage, framework: TestFramework): TestSetup {
    const baseSetup: TestSetup = {
      dependencies: [],
      imports: [],
      configuration: {},
      beforeEach: [],
      afterEach: [],
      beforeAll: [],
      afterAll: []
    };

    // Language-specific setup will be handled by language generators
    return baseSetup;
  }

  private generateTestMetadata(spec: ParsedSpec, language: SupportedLanguage, framework: TestFramework, isProviderMode: boolean): TestMetadata {
    return {
      endpoint: 'multiple',
      method: 'multiple',
      tag: 'generated',
      language,
      framework,
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      isProviderMode
    };
  }

  private generateTestId(operation: ParsedOperation, suffix: string): string {
    return `${operation.method.toLowerCase()}_${this.sanitizePath(operation.path)}_${suffix}`;
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '');
  }

  private sanitizePath(path: string): string {
    return path.replace(/[{}]/g, '').replace(/\//g, '_').replace(/^_/, '');
  }
}
