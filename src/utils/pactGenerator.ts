
import { ParsedSpec, ParsedOperation } from './swaggerParser';

export interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

export const generatePactTests = (spec: ParsedSpec): GeneratedTest[] => {
  const tests: GeneratedTest[] = [];

  spec.operations.forEach((operation) => {
    const tag = operation.tags?.[0] || 'default';
    const sanitizedEndpoint = operation.path.replace(/[{}]/g, '').replace(/\//g, '_');
    const filename = `${tag}_${operation.method.toLowerCase()}_${sanitizedEndpoint}.test.js`;
    
    const testContent = generatePactTestContent(operation, spec);
    
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

const generatePactTestContent = (operation: ParsedOperation, spec: ParsedSpec): string => {
  const providerName = spec.info.title.replace(/\s+/g, '');
  const consumerName = `${providerName}Consumer`;
  
  return `const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('${operation.summary || operation.path}', () => {
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
