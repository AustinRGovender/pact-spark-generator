import { ParsedSpec, ParsedOperation } from './swaggerParser';
import { MockDataGenerator } from './mockDataGenerator';
import { EnhancedMockDataGenerator } from './enhancedMockDataGenerator';
import { ErrorCaseGenerator, ErrorTestCase } from './errorCaseGenerator';
import { PactMatchers } from './pactMatchers';

export interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

export const generatePactTests = (spec: ParsedSpec, isProviderMode: boolean = false): GeneratedTest[] => {
  const tests: GeneratedTest[] = [];

  spec.operations.forEach((operation) => {
    const tag = operation.tags?.[0] || 'default';
    const sanitizedEndpoint = operation.path.replace(/[{}]/g, '').replace(/\//g, '_');
    const mode = isProviderMode ? 'provider' : 'consumer';
    
    // Generate success case test
    const successFilename = `${tag}_${operation.method.toLowerCase()}_${sanitizedEndpoint}_${mode}_success.test.js`;
    const successContent = isProviderMode 
      ? generateProviderTestContent(operation, spec)
      : generateConsumerTestContent(operation, spec);
    
    tests.push({
      filename: successFilename,
      content: successContent,
      tag,
      endpoint: operation.path,
      method: operation.method,
    });

    // Generate error case tests
    const errorCases = ErrorCaseGenerator.generateErrorCases(operation);
    errorCases.forEach((errorCase, index) => {
      const errorFilename = `${tag}_${operation.method.toLowerCase()}_${sanitizedEndpoint}_${mode}_${errorCase.name}.test.js`;
      const errorContent = generateErrorTestContent(operation, spec, errorCase, isProviderMode);
      
      tests.push({
        filename: errorFilename,
        content: errorContent,
        tag: `${tag}-errors`,
        endpoint: operation.path,
        method: operation.method,
      });
    });
  });

  return tests;
};

const generateConsumerTestContent = (operation: ParsedOperation, spec: ParsedSpec): string => {
  const providerName = spec.info.title.replace(/\s+/g, '');
  const consumerName = `${providerName}Consumer`;
  
  return `const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('${operation.summary || operation.path} - Consumer Test', () => {
  const provider = new Pact({
    consumer: '${consumerName}',
    provider: '${providerName}',
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info'
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('${operation.method} ${operation.path} - Success Cases', () => {
    it('should return a successful response', async () => {
      // Arrange - Using Pact matchers for flexible contract validation
      const expectedResponse = ${generateExpectedResponseWithMatchers(operation)};
      
      await provider
        .given('${operation.summary || 'default state'}')
        .uponReceiving('a request for ${operation.path}')
        .withRequest({
          method: '${operation.method}',
          path: '${operation.path}'${generateEnhancedRequestBody(operation)},
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedResponse
        });

      // Act & Assert
      // Add your consumer code here to make the actual request
      // const response = await yourApiClient.${operation.method.toLowerCase()}('${operation.path}');
      // expect(response.data).toEqual(expectedResponse);
    });

    // Edge case: Minimal valid request
    it('should handle minimal valid request', async () => {
      const minimalResponse = ${generateMinimalResponse(operation)};
      
      await provider
        .given('minimal data state')
        .uponReceiving('a minimal valid request for ${operation.path}')
        .withRequest({
          method: '${operation.method}',
          path: '${operation.path}'${generateMinimalRequestBody(operation)}
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: minimalResponse
        });
    });

    // Edge case: Maximum valid request  
    it('should handle request with all optional fields', async () => {
      const maximalResponse = ${generateMaximalResponse(operation)};
      
      await provider
        .given('complete data state')
        .uponReceiving('a request with all optional fields for ${operation.path}')
        .withRequest({
          method: '${operation.method}',
          path: '${operation.path}'${generateMaximalRequestBody(operation)}
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: maximalResponse
        });
    });
  });
});`;
};

const generateProviderTestContent = (operation: ParsedOperation, spec: ParsedSpec): string => {
  const providerName = spec.info.title.replace(/\s+/g, '');
  const consumerName = `${providerName}Consumer`;
  
  return `const { Verifier } = require('@pact-foundation/pact');
const path = require('path');

describe('${operation.summary || operation.path} - Provider Verification', () => {
  it('should validate the expectations of ${consumerName}', () => {
    const opts = {
      provider: '${providerName}',
      providerBaseUrl: process.env.PROVIDER_BASE_URL || 'http://localhost:3000',
      pactUrls: [
        path.resolve(process.cwd(), 'pacts', '${consumerName.toLowerCase()}-${providerName.toLowerCase()}.json')
      ],
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.PROVIDER_VERSION || '1.0.0',
      consumerVersionSelectors: [
        {
          tag: 'main',
          latest: true
        }
      ],
      // Enhanced provider states setup
      stateHandlers: {
        '${operation.summary || 'default state'}': () => {
          console.log('Setting up provider state: ${operation.summary || 'default state'}');
          // Setup your provider state here with realistic data
          return setupProviderState('${operation.summary || 'default state'}');
        },
        'minimal data state': () => {
          console.log('Setting up minimal data state');
          return setupMinimalState();
        },
        'complete data state': () => {
          console.log('Setting up complete data state');
          return setupCompleteState();
        }
      },
      // Request filters for dynamic data
      requestFilter: (req, res, next) => {
        // Add authentication headers if needed
        if (process.env.API_TOKEN) {
          req.headers['authorization'] = \`Bearer \${process.env.API_TOKEN}\`;
        }
        next();
      },
      // Custom verification setup
      beforeEach: () => {
        console.log('Preparing for verification...');
        return Promise.resolve();
      },
      afterEach: () => {
        console.log('Cleaning up after verification...');
        return cleanupAfterTest();
      }
    };

    return new Verifier(opts).verifyProvider().then(output => {
      console.log('Pact Verification Complete!');
      console.log(output);
    });
  });
});

// Provider state setup functions
async function setupProviderState(state) {
  // Implement your state setup logic here
  // This should configure your API to return the expected data
  console.log(\`Setting up state: \${state}\`);
  return Promise.resolve('Provider state setup complete');
}

async function setupMinimalState() {
  // Setup with minimal required data
  return Promise.resolve('Minimal state setup complete');
}

async function setupCompleteState() {
  // Setup with complete data including optional fields
  return Promise.resolve('Complete state setup complete');
}

async function cleanupAfterTest() {
  // Clean up any test data or state
  return Promise.resolve('Cleanup complete');
}

// Additional provider-specific tests for ${operation.method} ${operation.path}
describe('Provider API Tests - ${operation.method} ${operation.path}', () => {
  it('should handle ${operation.method} ${operation.path} requests correctly', async () => {
    // Direct API testing without Pact
    const mockRequest = ${generateRealisticMockRequest(operation)};
    const expectedResponse = ${generateRealisticExpectedResponse(operation)};
    
    // Example: Test your actual API endpoint
    // const response = await request(app)
    //   .${operation.method.toLowerCase()}('${operation.path}')
    //   .send(mockRequest)
    //   .expect(200);
    // 
    // expect(response.body).toMatchObject(expectedResponse);
  });
  
  it('should validate request data properly', async () => {
    // Test validation logic
    const invalidRequest = ${generateInvalidMockRequest(operation)};
    
    // const response = await request(app)
    //   .${operation.method.toLowerCase()}('${operation.path}')
    //   .send(invalidRequest)
    //   .expect(400);
    //
    // expect(response.body.error).toBeDefined();
  });
});`;
};

function generateErrorTestContent(operation: ParsedOperation, spec: ParsedSpec, errorCase: ErrorTestCase, isProviderMode: boolean): string {
  const providerName = spec.info.title.replace(/\s+/g, '');
  const consumerName = `${providerName}Consumer`;
  
  if (isProviderMode) {
    return `const { Verifier } = require('@pact-foundation/pact');
const path = require('path');

describe('${operation.summary || operation.path} - Provider Error Case: ${errorCase.name}', () => {
  it('should handle ${errorCase.name} correctly', () => {
    const opts = {
      provider: '${providerName}',
      providerBaseUrl: process.env.PROVIDER_BASE_URL || 'http://localhost:3000',
      pactUrls: [
        path.resolve(process.cwd(), 'pacts', '${consumerName.toLowerCase()}-${providerName.toLowerCase()}.json')
      ],
      stateHandlers: {
        '${errorCase.providerState}': () => {
          console.log('Setting up error state: ${errorCase.providerState}');
          return setupErrorState('${errorCase.name}');
        }
      }
    };

    return new Verifier(opts).verifyProvider();
  });
});

async function setupErrorState(errorType) {
  console.log(\`Setting up error state: \${errorType}\`);
  // Configure your provider to simulate the error condition
  return Promise.resolve('Error state setup complete');
}`;
  }

  return `const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('${operation.summary || operation.path} - Consumer Error Test: ${errorCase.name}', () => {
  const provider = new Pact({
    consumer: '${consumerName}',
    provider: '${providerName}',
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info'
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  ${ErrorCaseGenerator.generateErrorTestContent(operation, errorCase, true)}
});`;
}

// Enhanced helper functions with realistic data generation
const generateExpectedResponseWithMatchers = (operation: ParsedOperation): string => {
  if (operation.responses?.['200']?.content?.['application/json']?.schema) {
    const matchers = PactMatchers.generateResponseMatchersFromSchema(
      operation.responses['200'].content['application/json'].schema
    );
    return JSON.stringify(matchers, null, 2);
  }
  return JSON.stringify(PactMatchers.like({ success: true }), null, 2);
};

const generateEnhancedRequestBody = (operation: ParsedOperation): string => {
  if (operation.requestBody?.content?.['application/json']?.schema) {
    const schema = operation.requestBody.content['application/json'].schema;
    const mockBody = generateRealisticMockFromSchema(schema, 'valid');
    return `,\n          body: ${JSON.stringify(mockBody, null, 10)}`;
  }
  return '';
};

const generateMinimalRequestBody = (operation: ParsedOperation): string => {
  if (operation.requestBody?.content?.['application/json']?.schema) {
    const schema = operation.requestBody.content['application/json'].schema;
    const mockBody = generateRealisticMockFromSchema(schema, 'edge');
    return `,\n          body: ${JSON.stringify(mockBody, null, 10)}`;
  }
  return '';
};

const generateMaximalRequestBody = (operation: ParsedOperation): string => {
  if (operation.requestBody?.content?.['application/json']?.schema) {
    const schema = operation.requestBody.content['application/json'].schema;
    const mockBody = generateRealisticMockFromSchema(schema, 'valid', true);
    return `,\n          body: ${JSON.stringify(mockBody, null, 10)}`;
  }
  return '';
};

const generateMinimalResponse = (operation: ParsedOperation): string => {
  if (operation.responses?.['200']?.content?.['application/json']?.schema) {
    const mockResponse = generateRealisticMockFromSchema(
      operation.responses['200'].content['application/json'].schema, 
      'edge'
    );
    return JSON.stringify(mockResponse, null, 2);
  }
  return '{ "success": true }';
};

const generateMaximalResponse = (operation: ParsedOperation): string => {
  if (operation.responses?.['200']?.content?.['application/json']?.schema) {
    const mockResponse = generateRealisticMockFromSchema(
      operation.responses['200'].content['application/json'].schema, 
      'valid',
      true
    );
    return JSON.stringify(mockResponse, null, 2);
  }
  return '{ "success": true, "data": "complete" }';
};

const generateRealisticMockRequest = (operation: ParsedOperation): string => {
  if (operation.requestBody?.content?.['application/json']?.schema) {
    const mockBody = generateRealisticMockFromSchema(operation.requestBody.content['application/json'].schema, 'valid');
    return JSON.stringify(mockBody, null, 2);
  }
  return '{}';
};

const generateInvalidMockRequest = (operation: ParsedOperation): string => {
  if (operation.requestBody?.content?.['application/json']?.schema) {
    const mockBody = generateRealisticMockFromSchema(operation.requestBody.content['application/json'].schema, 'invalid');
    return JSON.stringify(mockBody, null, 2);
  }
  return '{ "invalid": "data" }';
};

const generateRealisticExpectedResponse = (operation: ParsedOperation): string => {
  if (operation.responses?.['200']?.content?.['application/json']?.schema) {
    return JSON.stringify(generateRealisticMockFromSchema(operation.responses['200'].content['application/json'].schema, 'valid'), null, 2);
  }
  return '{ "success": true }';
};

// Enhanced mock data generation using the new EnhancedMockDataGenerator
const generateRealisticMockFromSchema = (schema: any, variation: 'valid' | 'invalid' | 'edge' = 'valid', includeOptional: boolean = false): any => {
  if (!schema) return {};
  
  return EnhancedMockDataGenerator.generateAdvancedMockData(schema, 'field', {
    variation: variation as any,
    includeOptional,
    generateRealistic: true,
    respectConstraints: true
  });
};

const generateMockRequest = (operation: ParsedOperation): string => {
  if (operation.requestBody?.content?.['application/json']?.schema) {
    const mockBody = generateMockData(operation.requestBody.content['application/json'].schema);
    return JSON.stringify(mockBody, null, 2);
  }
  return '{}';
};

const generateExpectedResponse = (operation: ParsedOperation): string => {
  if (operation.responses?.['200']?.content?.['application/json']?.schema) {
    return JSON.stringify(generateMockData(operation.responses['200'].content['application/json'].schema), null, 2);
  }
  return '{ "success": true }';
};

const generateRequestBody = (operation: ParsedOperation): string => {
  if (operation.requestBody?.content?.['application/json']?.schema) {
    const mockBody = generateMockData(operation.requestBody.content['application/json'].schema);
    return `,\n          body: ${JSON.stringify(mockBody, null, 10)}`;
  }
  return '';
};

const generateMockData = (schema: any): any => {
  if (!schema) return {};
  
  switch (schema.type) {
    case 'object':
      const obj: any = {};
      if (schema.properties) {
        Object.keys(schema.properties).forEach(key => {
          obj[key] = generateMockData(schema.properties[key]);
        });
      }
      return obj;
    case 'array':
      return [generateMockData(schema.items)];
    case 'string':
      return schema.example || 'string';
    case 'number':
    case 'integer':
      return schema.example || 123;
    case 'boolean':
      return schema.example || true;
    default:
      return null;
  }
};
