import { ParsedOperation } from './swaggerParser';
import { SchemaAnalyzer, ResolvedSchema } from './schemaAnalyzer';

export interface EdgeTestCase {
  name: string;
  description: string;
  category: 'enum' | 'temporal' | 'currency' | 'locale' | 'business_logic' | 'combination';
  scenario: string;
  requestData: any;
  expectedStatus: number;
  expectedError?: string;
  providerState?: string;
}

export class EdgeCaseGenerator {
  static generateEdgeCases(operation: ParsedOperation): EdgeTestCase[] {
    const tests: EdgeTestCase[] = [];
    
    if (operation.requestBody?.schema) {
      tests.push(...this.analyzeSchemaEdgeCases(operation, operation.requestBody.schema, 'requestBody'));
    }

    // Analyze parameters for edge cases
    operation.parameters?.forEach(param => {
      if (param.schema) {
        tests.push(...this.analyzeSchemaEdgeCases(operation, param.schema, `parameter.${param.name}`));
      }
    });

    // Generate business logic combinations
    tests.push(...this.generateBusinessLogicEdgeCases(operation));

    return tests;
  }

  private static analyzeSchemaEdgeCases(operation: ParsedOperation, schema: any, fieldPath: string): EdgeTestCase[] {
    const tests: EdgeTestCase[] = [];
    const analyzedSchema = SchemaAnalyzer.analyzeSchema(schema, fieldPath);
    
    tests.push(...this.generateEnumEdgeCases(operation, analyzedSchema, fieldPath));
    tests.push(...this.generateTemporalEdgeCases(operation, analyzedSchema, fieldPath));
    tests.push(...this.generateCurrencyEdgeCases(operation, analyzedSchema, fieldPath));
    tests.push(...this.generateLocaleEdgeCases(operation, analyzedSchema, fieldPath));

    // Recursively analyze object properties
    if (analyzedSchema.type === 'object' && analyzedSchema.constraints.properties) {
      Object.entries(analyzedSchema.constraints.properties).forEach(([propName, propSchema]) => {
        tests.push(...this.analyzeSchemaEdgeCases(operation, propSchema, `${fieldPath}.${propName}`));
      });
    }

    return tests;
  }

  private static generateEnumEdgeCases(operation: ParsedOperation, schema: ResolvedSchema, fieldPath: string): EdgeTestCase[] {
    const tests: EdgeTestCase[] = [];
    
    if (!schema.constraints.enum) return tests;

    // Test invalid enum value
    tests.push({
      name: `${fieldPath}_invalid_enum_value`,
      description: `Test invalid enumeration value for ${fieldPath}`,
      category: 'enum',
      scenario: 'Invalid enum value provided',
      requestData: this.buildRequestData(fieldPath, 'INVALID_ENUM_VALUE'),
      expectedStatus: 400,
      expectedError: `Invalid value. Must be one of: ${schema.constraints.enum.join(', ')}`,
      providerState: 'Invalid enum value handling'
    });

    // Test case sensitivity for string enums
    if (schema.constraints.enum.some(val => typeof val === 'string')) {
      const firstStringEnum = schema.constraints.enum.find(val => typeof val === 'string') as string;
      tests.push({
        name: `${fieldPath}_enum_case_sensitivity`,
        description: `Test case sensitivity for enum ${fieldPath}`,
        category: 'enum',
        scenario: 'Wrong case enum value',
        requestData: this.buildRequestData(fieldPath, firstStringEnum.toUpperCase()),
        expectedStatus: 400,
        expectedError: 'Enum values are case sensitive',
        providerState: 'Case sensitive enum validation'
      });
    }

    // Test null enum value
    tests.push({
      name: `${fieldPath}_enum_null_value`,
      description: `Test null value for required enum ${fieldPath}`,
      category: 'enum',
      scenario: 'Null enum value',
      requestData: this.buildRequestData(fieldPath, null),
      expectedStatus: 400,
      expectedError: 'Enum field cannot be null',
      providerState: 'Null enum value handling'
    });

    return tests;
  }

  private static generateTemporalEdgeCases(operation: ParsedOperation, schema: ResolvedSchema, fieldPath: string): EdgeTestCase[] {
    const tests: EdgeTestCase[] = [];
    
    if (schema.type !== 'string') return tests;

    const isDateField = schema.constraints.format === 'date' || 
                       schema.constraints.format === 'date-time' ||
                       fieldPath.toLowerCase().includes('date') ||
                       fieldPath.toLowerCase().includes('time');

    if (!isDateField) return tests;

    // Test past date when future required
    tests.push({
      name: `${fieldPath}_past_date_invalid`,
      description: `Test past date for ${fieldPath}`,
      category: 'temporal',
      scenario: 'Past date provided when future date expected',
      requestData: this.buildRequestData(fieldPath, '2020-01-01T00:00:00Z'),
      expectedStatus: 400,
      expectedError: 'Date must be in the future',
      providerState: 'Past date validation'
    });

    // Test far future date
    tests.push({
      name: `${fieldPath}_far_future_date`,
      description: `Test far future date for ${fieldPath}`,
      category: 'temporal',
      scenario: 'Far future date (year 2099)',
      requestData: this.buildRequestData(fieldPath, '2099-12-31T23:59:59Z'),
      expectedStatus: 400,
      expectedError: 'Date too far in the future',
      providerState: 'Far future date validation'
    });

    // Test leap year edge case
    tests.push({
      name: `${fieldPath}_leap_year_feb_29`,
      description: `Test February 29th leap year for ${fieldPath}`,
      category: 'temporal',
      scenario: 'Leap year February 29th',
      requestData: this.buildRequestData(fieldPath, '2024-02-29T12:00:00Z'),
      expectedStatus: 200,
      providerState: 'Leap year date handling'
    });

    // Test non-leap year Feb 29
    tests.push({
      name: `${fieldPath}_non_leap_year_feb_29`,
      description: `Test February 29th non-leap year for ${fieldPath}`,
      category: 'temporal',
      scenario: 'Non-leap year February 29th',
      requestData: this.buildRequestData(fieldPath, '2023-02-29T12:00:00Z'),
      expectedStatus: 400,
      expectedError: 'Invalid date: February 29th in non-leap year',
      providerState: 'Invalid leap year date handling'
    });

    // Test timezone edge cases
    tests.push({
      name: `${fieldPath}_timezone_utc_plus_14`,
      description: `Test UTC+14 timezone for ${fieldPath}`,
      category: 'temporal',
      scenario: 'Maximum timezone offset UTC+14',
      requestData: this.buildRequestData(fieldPath, '2024-01-01T12:00:00+14:00'),
      expectedStatus: 200,
      providerState: 'Extreme timezone handling'
    });

    tests.push({
      name: `${fieldPath}_timezone_utc_minus_12`,
      description: `Test UTC-12 timezone for ${fieldPath}`,
      category: 'temporal',
      scenario: 'Minimum timezone offset UTC-12',
      requestData: this.buildRequestData(fieldPath, '2024-01-01T12:00:00-12:00'),
      expectedStatus: 200,
      providerState: 'Extreme timezone handling'
    });

    return tests;
  }

  private static generateCurrencyEdgeCases(operation: ParsedOperation, schema: ResolvedSchema, fieldPath: string): EdgeTestCase[] {
    const tests: EdgeTestCase[] = [];
    
    const isCurrencyField = fieldPath.toLowerCase().includes('price') ||
                           fieldPath.toLowerCase().includes('amount') ||
                           fieldPath.toLowerCase().includes('cost') ||
                           fieldPath.toLowerCase().includes('fee') ||
                           fieldPath.toLowerCase().includes('currency');

    if (!isCurrencyField) return tests;

    // Test negative currency amount
    tests.push({
      name: `${fieldPath}_negative_amount`,
      description: `Test negative currency amount for ${fieldPath}`,
      category: 'currency',
      scenario: 'Negative currency amount',
      requestData: this.buildRequestData(fieldPath, -100.50),
      expectedStatus: 400,
      expectedError: 'Currency amount cannot be negative',
      providerState: 'Negative amount validation'
    });

    // Test extremely large amount
    tests.push({
      name: `${fieldPath}_extremely_large_amount`,
      description: `Test extremely large amount for ${fieldPath}`,
      category: 'currency',
      scenario: 'Extremely large currency amount',
      requestData: this.buildRequestData(fieldPath, 999999999999.99),
      expectedStatus: 400,
      expectedError: 'Amount exceeds maximum allowed value',
      providerState: 'Maximum amount validation'
    });

    // Test precision edge cases
    tests.push({
      name: `${fieldPath}_high_precision`,
      description: `Test high precision currency for ${fieldPath}`,
      category: 'currency',
      scenario: 'High precision decimal (more than 2 places)',
      requestData: this.buildRequestData(fieldPath, 100.12345),
      expectedStatus: 400,
      expectedError: 'Currency precision cannot exceed 2 decimal places',
      providerState: 'Currency precision validation'
    });

    // Test zero amount
    tests.push({
      name: `${fieldPath}_zero_amount`,
      description: `Test zero currency amount for ${fieldPath}`,
      category: 'currency',
      scenario: 'Zero currency amount',
      requestData: this.buildRequestData(fieldPath, 0.00),
      expectedStatus: 400,
      expectedError: 'Amount must be greater than zero',
      providerState: 'Zero amount validation'
    });

    return tests;
  }

  private static generateLocaleEdgeCases(operation: ParsedOperation, schema: ResolvedSchema, fieldPath: string): EdgeTestCase[] {
    const tests: EdgeTestCase[] = [];
    
    const isLocaleField = fieldPath.toLowerCase().includes('locale') ||
                         fieldPath.toLowerCase().includes('language') ||
                         fieldPath.toLowerCase().includes('region') ||
                         fieldPath.toLowerCase().includes('country');

    if (!isLocaleField) return tests;

    // Test invalid locale format
    tests.push({
      name: `${fieldPath}_invalid_locale_format`,
      description: `Test invalid locale format for ${fieldPath}`,
      category: 'locale',
      scenario: 'Invalid locale format',
      requestData: this.buildRequestData(fieldPath, 'invalid_locale'),
      expectedStatus: 400,
      expectedError: 'Invalid locale format. Expected format: en-US',
      providerState: 'Invalid locale format handling'
    });

    // Test unsupported locale
    tests.push({
      name: `${fieldPath}_unsupported_locale`,
      description: `Test unsupported locale for ${fieldPath}`,
      category: 'locale',
      scenario: 'Unsupported locale',
      requestData: this.buildRequestData(fieldPath, 'xx-XX'),
      expectedStatus: 400,
      expectedError: 'Unsupported locale',
      providerState: 'Unsupported locale handling'
    });

    // Test case sensitivity
    tests.push({
      name: `${fieldPath}_locale_case_sensitivity`,
      description: `Test locale case sensitivity for ${fieldPath}`,
      category: 'locale',
      scenario: 'Incorrect case locale',
      requestData: this.buildRequestData(fieldPath, 'EN-us'),
      expectedStatus: 400,
      expectedError: 'Locale must be in correct case format (en-US)',
      providerState: 'Locale case validation'
    });

    return tests;
  }

  private static generateBusinessLogicEdgeCases(operation: ParsedOperation): EdgeTestCase[] {
    const tests: EdgeTestCase[] = [];
    
    // Generate combination tests based on operation type
    if (operation.method === 'post' && operation.path.includes('user')) {
      tests.push({
        name: 'create_user_duplicate_email',
        description: 'Test creating user with duplicate email',
        category: 'business_logic',
        scenario: 'Duplicate email address',
        requestData: {
          email: 'duplicate@example.com',
          username: 'newuser'
        },
        expectedStatus: 409,
        expectedError: 'Email address already exists',
        providerState: 'User with email duplicate@example.com exists'
      });
    }

    if (operation.method === 'put' && operation.path.includes('password')) {
      tests.push({
        name: 'change_password_same_as_current',
        description: 'Test changing password to same as current',
        category: 'business_logic',
        scenario: 'New password same as current',
        requestData: {
          currentPassword: 'oldPassword123',
          newPassword: 'oldPassword123'
        },
        expectedStatus: 400,
        expectedError: 'New password must be different from current password',
        providerState: 'User with current password oldPassword123'
      });
    }

    if (operation.path.includes('order') && operation.method === 'post') {
      tests.push({
        name: 'create_order_insufficient_inventory',
        description: 'Test creating order with insufficient inventory',
        category: 'business_logic',
        scenario: 'Insufficient inventory',
        requestData: {
          productId: 'prod123',
          quantity: 1000
        },
        expectedStatus: 400,
        expectedError: 'Insufficient inventory for requested quantity',
        providerState: 'Product prod123 has only 5 items in stock'
      });
    }

    return tests;
  }

  private static buildRequestData(fieldPath: string, value: any): any {
    const parts = fieldPath.split('.');
    
    if (parts[0] === 'requestBody') {
      return { [parts[1]]: value };
    } else if (parts[0] === 'parameter') {
      return { pathParam: value };
    } else if (parts[0] === 'query') {
      return { queryParam: value };
    }
    
    // Build nested object structure
    const result: any = {};
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    return result;
  }

  static generateEdgeCaseTestContent(operation: ParsedOperation, edgeCase: EdgeTestCase, isConsumer: boolean = true): string {
    if (isConsumer) {
      return this.generateConsumerEdgeCaseTest(operation, edgeCase);
    } else {
      return this.generateProviderEdgeCaseTest(operation, edgeCase);
    }
  }

  private static generateConsumerEdgeCaseTest(operation: ParsedOperation, edgeCase: EdgeTestCase): string {
    return `
  test('${edgeCase.name}', async () => {
    const interaction = {
      state: '${edgeCase.providerState || edgeCase.scenario}',
      uponReceiving: '${edgeCase.description}',
      withRequest: {
        method: '${operation.method.toUpperCase()}',
        path: '${operation.path}',
        headers: {
          'Content-Type': 'application/json'
        },
        ${operation.method !== 'get' ? `body: ${JSON.stringify(edgeCase.requestData, null, 2)}` : ''}
      },
      willRespondWith: {
        status: ${edgeCase.expectedStatus},
        headers: {
          'Content-Type': 'application/json'
        },
        ${edgeCase.expectedStatus >= 400 ? `body: {
          error: '${edgeCase.expectedError}',
          scenario: '${edgeCase.scenario}'
        }` : 'body: { success: true }'}
      }
    };

    await provider.addInteraction(interaction);
    
    const response = await fetch(\`\${mockServerURL}${operation.path}\`, {
      method: '${operation.method.toUpperCase()}',
      headers: { 'Content-Type': 'application/json' },
      ${operation.method !== 'get' ? 'body: JSON.stringify(edgeCase.requestData)' : ''}
    });

    expect(response.status).toBe(${edgeCase.expectedStatus});
    ${edgeCase.expectedStatus >= 400 ? `
    const responseBody = await response.json();
    expect(responseBody.error).toContain('${edgeCase.expectedError}');
    ` : ''}
  });`;
  }

  private static generateProviderEdgeCaseTest(operation: ParsedOperation, edgeCase: EdgeTestCase): string {
    return `
  test('${edgeCase.name}', async () => {
    // Provider state: ${edgeCase.providerState || edgeCase.scenario}
    
    const response = await request(app)
      .${operation.method}('${operation.path}')
      .send(${JSON.stringify(edgeCase.requestData, null, 2)})
      .expect(${edgeCase.expectedStatus});

    ${edgeCase.expectedStatus >= 400 ? `
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('${edgeCase.expectedError}');
    expect(response.body.scenario).toBe('${edgeCase.scenario}');
    ` : `
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
    `}
  });`;
  }
}