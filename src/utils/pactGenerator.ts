
import { ParsedSpec, ParsedOperation } from './swaggerParser';

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
    const filename = `${tag}_${operation.method.toLowerCase()}_${sanitizedEndpoint}_${mode}.test.js`;
    
    const testContent = isProviderMode 
      ? generateProviderTestContent(operation, spec)
      : generateConsumerTestContent(operation, spec);
    
    tests.push({
      filename,
      content: testContent,
      tag,
      endpoint: operation.path,
      method: operation.method,
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

  describe('${operation.method} ${operation.path}', () => {
    it('should return a successful response', async () => {
      // Arrange
      const expectedResponse = ${generateExpectedResponse(operation)};
      
      await provider
        .given('${operation.summary || 'default state'}')
        .uponReceiving('a request for ${operation.path}')
        .withRequest({
          method: '${operation.method}',
          path: '${operation.path}'${generateRequestBody(operation)}
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
      // Provider states setup
      stateHandlers: {
        '${operation.summary || 'default state'}': () => {
          // Setup your provider state here
          // This should configure your API to return the expected data
          return Promise.resolve('Provider state setup complete');
        }
      },
      // Request filters for dynamic data
      requestFilter: (req, res, next) => {
        // Modify request if needed (e.g., add auth headers)
        next();
      },
      // Custom verification setup
      beforeEach: () => {
        // Setup before each verification
        return Promise.resolve();
      }
    };

    return new Verifier(opts).verifyProvider().then(output => {
      console.log('Pact Verification Complete!');
      console.log(output);
    });
  });
});

// Additional provider-specific tests for ${operation.method} ${operation.path}
describe('Provider API Tests - ${operation.method} ${operation.path}', () => {
  it('should handle ${operation.method} ${operation.path} requests correctly', async () => {
    // Direct API testing without Pact
    // Add your provider-specific test logic here
    
    const mockRequest = ${generateMockRequest(operation)};
    const expectedResponse = ${generateExpectedResponse(operation)};
    
    // Example: Test your actual API endpoint
    // const response = await request(app)
    //   .${operation.method.toLowerCase()}('${operation.path}')
    //   .send(mockRequest)
    //   .expect(200);
    // 
    // expect(response.body).toMatchObject(expectedResponse);
  });
});`;
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
