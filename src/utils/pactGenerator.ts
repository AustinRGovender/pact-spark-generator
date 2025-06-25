
import { ParsedSpec, ParsedOperation } from './swaggerParser';

interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

const generateTestContent = (operation: ParsedOperation, specInfo: any): string => {
  const operationName = operation.operationId || `${operation.method.toLowerCase()}${operation.path.replace(/[^a-zA-Z0-9]/g, '')}`;
  const description = operation.summary || `${operation.method} ${operation.path}`;
  
  // Generate example request based on parameters and request body
  let requestExample = '{}';
  if (operation.requestBody?.content?.['application/json']?.schema) {
    requestExample = generateExampleFromSchema(operation.requestBody.content['application/json'].schema);
  }
  
  // Generate example response based on successful response schema
  let responseExample = '{}';
  const successResponse = operation.responses?.['200'] || operation.responses?.['201'] || operation.responses?.['204'];
  if (successResponse?.content?.['application/json']?.schema) {
    responseExample = generateExampleFromSchema(successResponse.content['application/json'].schema);
  }
  
  const statusCode = Object.keys(operation.responses || {}).find(code => code.startsWith('2')) || '200';
  
  return `const { Pact } = require('@pact-foundation/pact');
const { like, eachLike } = require('@pact-foundation/pact').Matchers;

describe('${specInfo.title} - ${description}', () => {
  const provider = new Pact({
    consumer: '${specInfo.title.replace(/[^a-zA-Z0-9]/g, '')}-consumer',
    provider: '${specInfo.title.replace(/[^a-zA-Z0-9]/g, '')}-provider',
    port: 1234,
    log: './logs/pact.log',
    dir: './pacts',
    logLevel: 'INFO',
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('${operationName}', () => {
    it('should ${description.toLowerCase()}', async () => {
      // Arrange
      await provider.addInteraction({
        state: 'provider has data',
        uponReceiving: '${description}',
        withRequest: {
          method: '${operation.method}',
          path: '${operation.path}',
          ${operation.method !== 'GET' && operation.method !== 'DELETE' ? `body: ${requestExample},` : ''}
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
        willRespondWith: {
          status: ${statusCode},
          headers: {
            'Content-Type': 'application/json',
          },
          body: ${responseExample},
        },
      });

      // Act & Assert
      // Add your actual HTTP client call here
      // Example:
      // const response = await yourApiClient.${operationName}();
      // expect(response.status).toBe(${statusCode});
    });
  });
});
`;
};

const generateExampleFromSchema = (schema: any): string => {
  if (!schema) return '{}';
  
  try {
    const example = generateMockData(schema);
    return JSON.stringify(example, null, 2);
  } catch {
    return '{}';
  }
};

const generateMockData = (schema: any): any => {
  if (schema.example) return schema.example;
  
  switch (schema.type) {
    case 'object':
      const obj: any = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
          obj[key] = generateMockData(propSchema);
        });
      }
      return obj;
    
    case 'array':
      return schema.items ? [generateMockData(schema.items)] : [];
    
    case 'string':
      if (schema.format === 'date-time') return '2023-01-01T00:00:00Z';
      if (schema.format === 'date') return '2023-01-01';
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'uri') return 'https://example.com';
      return schema.enum ? schema.enum[0] : 'string';
    
    case 'number':
    case 'integer':
      return schema.enum ? schema.enum[0] : 42;
    
    case 'boolean':
      return true;
    
    default:
      return null;
  }
};

export const generatePactTests = (spec: ParsedSpec): GeneratedTest[] => {
  const tests: GeneratedTest[] = [];
  
  spec.operations.forEach(operation => {
    const tag = operation.tags?.[0] || 'default';
    const filename = `${operation.method.toLowerCase()}-${operation.path.replace(/[^a-zA-Z0-9]/g, '-')}.spec.js`;
    const content = generateTestContent(operation, spec.info);
    
    tests.push({
      filename,
      content,
      tag,
      endpoint: operation.path,
      method: operation.method,
    });
  });
  
  return tests;
};
