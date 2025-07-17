import { EnhancedSchemaConstraints, ResolvedSchema, SchemaAnalyzer } from './schemaAnalyzer';
import { ParsedOperation } from './swaggerParser';

export interface BoundaryTestCase {
  name: string;
  description: string;
  category: 'numeric' | 'string' | 'array' | 'null' | 'type_mismatch';
  field: string;
  value: any;
  expected: 'valid' | 'invalid';
  errorCode?: number;
  errorMessage?: string;
}

export class BoundaryTestGenerator {
  static generateBoundaryTests(operation: ParsedOperation): BoundaryTestCase[] {
    const tests: BoundaryTestCase[] = [];
    
    if (operation.requestBody?.schema) {
      tests.push(...this.analyzeSchemaBoundaries(operation.requestBody.schema, 'requestBody'));
    }

    // Analyze path parameters
    operation.parameters?.forEach(param => {
      if (param.schema) {
        tests.push(...this.analyzeSchemaBoundaries(param.schema, `parameter.${param.name}`));
      }
    });

    // Analyze query parameters
    operation.parameters?.forEach(param => {
      if (param.in === 'query' && param.schema) {
        tests.push(...this.analyzeSchemaBoundaries(param.schema, `query.${param.name}`));
      }
    });

    return tests;
  }

  private static analyzeSchemaBoundaries(schema: any, fieldPath: string): BoundaryTestCase[] {
    const tests: BoundaryTestCase[] = [];
    const analyzedSchema = SchemaAnalyzer.analyzeSchema(schema, fieldPath);
    
    // Generate boundary tests based on schema type
    tests.push(...this.generateNumericBoundaries(analyzedSchema, fieldPath));
    tests.push(...this.generateStringBoundaries(analyzedSchema, fieldPath));
    tests.push(...this.generateArrayBoundaries(analyzedSchema, fieldPath));
    tests.push(...this.generateNullTests(analyzedSchema, fieldPath));
    tests.push(...this.generateTypeMismatchTests(analyzedSchema, fieldPath));

    // Recursively analyze object properties
    if (analyzedSchema.type === 'object' && analyzedSchema.constraints.properties) {
      Object.entries(analyzedSchema.constraints.properties).forEach(([propName, propSchema]) => {
        tests.push(...this.analyzeSchemaBoundaries(propSchema, `${fieldPath}.${propName}`));
      });
    }

    return tests;
  }

  private static generateNumericBoundaries(schema: ResolvedSchema, fieldPath: string): BoundaryTestCase[] {
    const tests: BoundaryTestCase[] = [];
    
    if (schema.type !== 'number' && schema.type !== 'integer') return tests;

    const constraints = schema.constraints;
    
    // Minimum boundary tests
    if (constraints.minimum !== undefined) {
      tests.push({
        name: `${fieldPath}_minimum_valid`,
        description: `Test minimum valid value for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: constraints.minimum,
        expected: 'valid'
      });

      tests.push({
        name: `${fieldPath}_below_minimum`,
        description: `Test value below minimum for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: constraints.minimum - 1,
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Value must be greater than or equal to ${constraints.minimum}`
      });
    }

    if (constraints.exclusiveMinimum !== undefined) {
      tests.push({
        name: `${fieldPath}_exclusive_minimum_invalid`,
        description: `Test exclusive minimum boundary for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: constraints.exclusiveMinimum,
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Value must be greater than ${constraints.exclusiveMinimum}`
      });

      tests.push({
        name: `${fieldPath}_above_exclusive_minimum`,
        description: `Test value above exclusive minimum for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: typeof constraints.exclusiveMinimum === 'number' ? constraints.exclusiveMinimum + 0.1 : 1,
        expected: 'valid'
      });
    }

    // Maximum boundary tests
    if (constraints.maximum !== undefined) {
      tests.push({
        name: `${fieldPath}_maximum_valid`,
        description: `Test maximum valid value for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: constraints.maximum,
        expected: 'valid'
      });

      tests.push({
        name: `${fieldPath}_above_maximum`,
        description: `Test value above maximum for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: constraints.maximum + 1,
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Value must be less than or equal to ${constraints.maximum}`
      });
    }

    if (constraints.exclusiveMaximum !== undefined) {
      tests.push({
        name: `${fieldPath}_exclusive_maximum_invalid`,
        description: `Test exclusive maximum boundary for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: constraints.exclusiveMaximum,
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Value must be less than ${constraints.exclusiveMaximum}`
      });

      tests.push({
        name: `${fieldPath}_below_exclusive_maximum`,
        description: `Test value below exclusive maximum for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: typeof constraints.exclusiveMaximum === 'number' ? constraints.exclusiveMaximum - 0.1 : 99,
        expected: 'valid'
      });
    }

    // MultipleOf tests
    if (constraints.multipleOf !== undefined) {
      tests.push({
        name: `${fieldPath}_multiple_of_valid`,
        description: `Test valid multiple of ${constraints.multipleOf} for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: constraints.multipleOf * 3,
        expected: 'valid'
      });

      tests.push({
        name: `${fieldPath}_not_multiple_of`,
        description: `Test invalid multiple for ${fieldPath}`,
        category: 'numeric',
        field: fieldPath,
        value: constraints.multipleOf * 2.5,
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Value must be a multiple of ${constraints.multipleOf}`
      });
    }

    return tests;
  }

  private static generateStringBoundaries(schema: ResolvedSchema, fieldPath: string): BoundaryTestCase[] {
    const tests: BoundaryTestCase[] = [];
    
    if (schema.type !== 'string') return tests;

    const constraints = schema.constraints;
    
    // Length boundary tests
    if (constraints.minLength !== undefined) {
      tests.push({
        name: `${fieldPath}_min_length_valid`,
        description: `Test minimum length for ${fieldPath}`,
        category: 'string',
        field: fieldPath,
        value: 'a'.repeat(constraints.minLength),
        expected: 'valid'
      });

      if (constraints.minLength > 0) {
        tests.push({
          name: `${fieldPath}_below_min_length`,
          description: `Test below minimum length for ${fieldPath}`,
          category: 'string',
          field: fieldPath,
          value: 'a'.repeat(constraints.minLength - 1),
          expected: 'invalid',
          errorCode: 400,
          errorMessage: `String must be at least ${constraints.minLength} characters long`
        });
      }
    }

    if (constraints.maxLength !== undefined) {
      tests.push({
        name: `${fieldPath}_max_length_valid`,
        description: `Test maximum length for ${fieldPath}`,
        category: 'string',
        field: fieldPath,
        value: 'a'.repeat(constraints.maxLength),
        expected: 'valid'
      });

      tests.push({
        name: `${fieldPath}_above_max_length`,
        description: `Test above maximum length for ${fieldPath}`,
        category: 'string',
        field: fieldPath,
        value: 'a'.repeat(constraints.maxLength + 1),
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `String must not exceed ${constraints.maxLength} characters`
      });
    }

    // Pattern tests
    if (constraints.pattern) {
      const regex = new RegExp(constraints.pattern);
      tests.push({
        name: `${fieldPath}_pattern_invalid`,
        description: `Test invalid pattern for ${fieldPath}`,
        category: 'string',
        field: fieldPath,
        value: 'invalid_pattern_value_123!@#',
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Value does not match required pattern: ${constraints.pattern}`
      });
    }

    // Format-specific tests
    if (constraints.format) {
      const invalidFormatValue = this.getInvalidFormatValue(constraints.format);
      if (invalidFormatValue) {
        tests.push({
          name: `${fieldPath}_invalid_format`,
          description: `Test invalid ${constraints.format} format for ${fieldPath}`,
          category: 'string',
          field: fieldPath,
          value: invalidFormatValue,
          expected: 'invalid',
          errorCode: 400,
          errorMessage: `Value must be a valid ${constraints.format}`
        });
      }
    }

    return tests;
  }

  private static generateArrayBoundaries(schema: ResolvedSchema, fieldPath: string): BoundaryTestCase[] {
    const tests: BoundaryTestCase[] = [];
    
    if (schema.type !== 'array') return tests;

    const constraints = schema.constraints;
    
    // Array length boundaries
    if (constraints.minItems !== undefined) {
      tests.push({
        name: `${fieldPath}_min_items_valid`,
        description: `Test minimum items for ${fieldPath}`,
        category: 'array',
        field: fieldPath,
        value: Array(constraints.minItems).fill('item'),
        expected: 'valid'
      });

      if (constraints.minItems > 0) {
        tests.push({
          name: `${fieldPath}_below_min_items`,
          description: `Test below minimum items for ${fieldPath}`,
          category: 'array',
          field: fieldPath,
          value: Array(constraints.minItems - 1).fill('item'),
          expected: 'invalid',
          errorCode: 400,
          errorMessage: `Array must contain at least ${constraints.minItems} items`
        });
      }
    }

    if (constraints.maxItems !== undefined) {
      tests.push({
        name: `${fieldPath}_max_items_valid`,
        description: `Test maximum items for ${fieldPath}`,
        category: 'array',
        field: fieldPath,
        value: Array(constraints.maxItems).fill('item'),
        expected: 'valid'
      });

      tests.push({
        name: `${fieldPath}_above_max_items`,
        description: `Test above maximum items for ${fieldPath}`,
        category: 'array',
        field: fieldPath,
        value: Array(constraints.maxItems + 1).fill('item'),
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Array must not contain more than ${constraints.maxItems} items`
      });
    }

    return tests;
  }

  private static generateNullTests(schema: ResolvedSchema, fieldPath: string): BoundaryTestCase[] {
    const tests: BoundaryTestCase[] = [];
    
    // Test null values for required vs optional fields
    if (schema.context.isRequired) {
      tests.push({
        name: `${fieldPath}_null_required`,
        description: `Test null value for required field ${fieldPath}`,
        category: 'null',
        field: fieldPath,
        value: null,
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Field ${fieldPath} is required`
      });

      tests.push({
        name: `${fieldPath}_undefined_required`,
        description: `Test undefined value for required field ${fieldPath}`,
        category: 'null',
        field: fieldPath,
        value: undefined,
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Field ${fieldPath} is required`
      });
    } else {
      tests.push({
        name: `${fieldPath}_null_optional`,
        description: `Test null value for optional field ${fieldPath}`,
        category: 'null',
        field: fieldPath,
        value: null,
        expected: 'valid'
      });
    }

    return tests;
  }

  private static generateTypeMismatchTests(schema: ResolvedSchema, fieldPath: string): BoundaryTestCase[] {
    const tests: BoundaryTestCase[] = [];
    
    const typeMismatches = this.getTypeMismatchValues(schema.type);
    
    typeMismatches.forEach((mismatchValue, index) => {
      tests.push({
        name: `${fieldPath}_type_mismatch_${index}`,
        description: `Test type mismatch for ${fieldPath} (expected ${schema.type}, got ${typeof mismatchValue})`,
        category: 'type_mismatch',
        field: fieldPath,
        value: mismatchValue,
        expected: 'invalid',
        errorCode: 400,
        errorMessage: `Expected ${schema.type} but received ${typeof mismatchValue}`
      });
    });

    return tests;
  }

  private static getTypeMismatchValues(expectedType: string): any[] {
    const allTypes = {
      string: 'test string',
      number: 42,
      integer: 42,
      boolean: true,
      array: ['item1', 'item2'],
      object: { key: 'value' }
    };

    return Object.entries(allTypes)
      .filter(([type]) => type !== expectedType)
      .map(([, value]) => value);
  }

  private static getInvalidFormatValue(format: string): string | null {
    const invalidFormats: Record<string, string> = {
      'email': 'invalid-email',
      'uri': 'not-a-uri',
      'uuid': 'not-a-uuid',
      'date': 'invalid-date',
      'date-time': 'invalid-datetime',
      'ipv4': '999.999.999.999',
      'ipv6': 'not-an-ipv6',
      'hostname': 'invalid..hostname',
      'json-pointer': 'not/a/pointer',
      'regex': '[invalid regex'
    };

    return invalidFormats[format] || null;
  }

  static generateBoundaryTestContent(operation: ParsedOperation, test: BoundaryTestCase, isConsumer: boolean = true): string {
    if (isConsumer) {
      return this.generateConsumerBoundaryTest(operation, test);
    } else {
      return this.generateProviderBoundaryTest(operation, test);
    }
  }

  private static generateConsumerBoundaryTest(operation: ParsedOperation, test: BoundaryTestCase): string {
    const requestModification = this.generateBoundaryRequestModification(test);
    
    return `
  test('${test.name}', async () => {
    const interaction = {
      state: '${test.description}',
      uponReceiving: '${test.name}',
      withRequest: {
        method: '${operation.method.toUpperCase()}',
        path: '${operation.path}',
        ${requestModification}
      },
      willRespondWith: {
        status: ${test.expected === 'valid' ? '200' : test.errorCode || '400'},
        headers: {
          'Content-Type': 'application/json'
        },
        ${test.expected === 'invalid' ? `body: {
          error: '${test.errorMessage || 'Validation error'}',
          field: '${test.field}'
        }` : 'body: { success: true }'}
      }
    };

    await provider.addInteraction(interaction);
    
    // Make request with boundary test value
    const response = await fetch(\`\${mockServerURL}${operation.path}\`, {
      method: '${operation.method.toUpperCase()}',
      headers: { 'Content-Type': 'application/json' },
      ${operation.method !== 'get' ? 'body: JSON.stringify(requestBody)' : ''}
    });

    expect(response.status).toBe(${test.expected === 'valid' ? '200' : test.errorCode || '400'});
  });`;
  }

  private static generateProviderBoundaryTest(operation: ParsedOperation, test: BoundaryTestCase): string {
    return `
  test('${test.name}', async () => {
    // Provider state setup for boundary test
    const testData = ${this.generateBoundaryRequestModification(test)};
    
    const response = await request(app)
      .${operation.method}('${operation.path}')
      .send(testData)
      .expect(${test.expected === 'valid' ? '200' : test.errorCode || '400'});

    ${test.expected === 'invalid' ? `
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('${test.errorMessage || 'Validation error'}');
    ` : `
    expect(response.body).toHaveProperty('success');
    `}
  });`;
  }

  private static generateBoundaryRequestModification(test: BoundaryTestCase): string {
    const fieldParts = test.field.split('.');
    
    if (fieldParts[0] === 'requestBody') {
      return `body: ${JSON.stringify({ [fieldParts[1]]: test.value }, null, 2)}`;
    } else if (fieldParts[0] === 'parameter') {
      return `path: '${test.field.replace('parameter.', ':')}' // Path parameter: ${test.value}`;
    } else if (fieldParts[0] === 'query') {
      return `query: { ${fieldParts[1]}: '${test.value}' }`;
    }
    
    return `body: ${JSON.stringify({ [test.field]: test.value }, null, 2)}`;
  }
}