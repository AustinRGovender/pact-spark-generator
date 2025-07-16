import { SchemaAnalyzer, ResolvedSchema, DomainHint } from './schemaAnalyzer';

export interface DataGenerationOptions {
  variation: 'valid' | 'invalid' | 'edge' | 'boundary';
  includeOptional: boolean;
  locale: string;
  respectConstraints: boolean;
  generateRealistic: boolean;
}

export class EnhancedMockDataGenerator {
  private static domainDataSets = {
    financial: {
      currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'],
      companies: ['Apple Inc.', 'Microsoft Corp.', 'Amazon.com Inc.', 'Alphabet Inc.', 'Tesla Inc.'],
      amounts: [99.99, 199.50, 1299.00, 49.95, 2499.99, 19.99, 599.00, 999.99],
      accountNumbers: ['1234567890', '9876543210', '5555666677', '1111222233']
    },
    temporal: {
      timezones: ['UTC', 'EST', 'PST', 'GMT', 'CET', 'JST', 'IST', 'AEST'],
      dayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    },
    personal: {
      firstNames: ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'],
      lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
      titles: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Rev.'],
      phoneFormats: ['+1-###-###-####', '+44-##-####-####', '+33-#-##-##-##-##', '+49-###-#######']
    },
    geographic: {
      countries: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'China', 'India', 'Brazil'],
      countryCodes: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'CN', 'IN', 'BR'],
      cities: ['New York', 'London', 'Tokyo', 'Paris', 'Berlin', 'Sydney', 'Toronto', 'Mumbai', 'São Paulo', 'Beijing'],
      coordinates: [
        { lat: 40.7128, lng: -74.0060, name: 'New York' },
        { lat: 51.5074, lng: -0.1278, name: 'London' },
        { lat: 35.6762, lng: 139.6503, name: 'Tokyo' }
      ]
    },
    technical: {
      protocols: ['HTTP', 'HTTPS', 'FTP', 'SFTP', 'SSH', 'TCP', 'UDP'],
      domains: ['example.com', 'test.org', 'demo.net', 'sample.io', 'api.dev', 'staging.app'],
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      ],
      statusCodes: [200, 201, 400, 401, 403, 404, 422, 500, 502, 503]
    },
    business: {
      departments: ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Customer Support'],
      roles: ['Manager', 'Director', 'Engineer', 'Analyst', 'Specialist', 'Coordinator', 'Lead', 'Senior', 'Junior'],
      industries: ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Real Estate', 'Media']
    }
  };

  static generateAdvancedMockData(
    schema: any,
    fieldName: string = 'field',
    options: Partial<DataGenerationOptions> = {}
  ): any {
    const fullOptions: DataGenerationOptions = {
      variation: 'valid',
      includeOptional: false,
      locale: 'en-US',
      respectConstraints: true,
      generateRealistic: true,
      ...options
    };

    const analyzedSchema = SchemaAnalyzer.analyzeSchema(schema, fieldName, {
      isRequired: true,
      fieldPath: [],
      depth: 0,
      domainHints: []
    });

    return this.generateFromAnalyzedSchema(analyzedSchema, fullOptions);
  }

  private static generateFromAnalyzedSchema(
    schema: ResolvedSchema,
    options: DataGenerationOptions
  ): any {
    const { constraints, context } = schema;

    // Handle invalid variations
    if (options.variation === 'invalid') {
      return this.generateInvalidData(schema, options);
    }

    // Handle boundary variations
    if (options.variation === 'boundary') {
      return this.generateBoundaryData(schema, options);
    }

    // Generate realistic data based on domain hints
    if (options.generateRealistic && context.domainHints.length > 0) {
      const primaryHint = context.domainHints[0];
      return this.generateDomainSpecificData(schema, primaryHint, options);
    }

    // Generate by type with enhanced constraints
    return this.generateByType(schema, options);
  }

  private static generateInvalidData(schema: ResolvedSchema, options: DataGenerationOptions): any {
    const { constraints } = schema;

    switch (constraints.type) {
      case 'string':
        if (constraints.minLength && constraints.minLength > 0) {
          return ''; // Too short
        }
        if (constraints.maxLength) {
          return 'A'.repeat(constraints.maxLength + 10); // Too long
        }
        if (constraints.format === 'email') {
          return 'invalid-email-format';
        }
        if (constraints.format === 'uuid') {
          return 'not-a-uuid';
        }
        if (constraints.pattern) {
          return 'INVALID_PATTERN_MATCH';
        }
        return 123; // Wrong type

      case 'number':
      case 'integer':
        if (constraints.minimum !== undefined) {
          return constraints.minimum - 1;
        }
        if (constraints.maximum !== undefined) {
          return constraints.maximum + 1;
        }
        return 'not_a_number';

      case 'boolean':
        return 'not_a_boolean';

      case 'array':
        if (constraints.minItems && constraints.minItems > 0) {
          return []; // Too few items
        }
        return 'not_an_array';

      case 'object':
        return 'not_an_object';

      default:
        return null;
    }
  }

  private static generateBoundaryData(schema: ResolvedSchema, options: DataGenerationOptions): any {
    const { constraints } = schema;
    const boundaries = SchemaAnalyzer.getBoundaryValues(constraints);

    if (boundaries.length > 0) {
      // Return a random boundary value
      return boundaries[Math.floor(Math.random() * boundaries.length)];
    }

    // Fallback to edge case generation
    return this.generateEdgeCaseData(schema, options);
  }

  private static generateEdgeCaseData(schema: ResolvedSchema, options: DataGenerationOptions): any {
    const { constraints } = schema;

    switch (constraints.type) {
      case 'string':
        if (constraints.minLength !== undefined) {
          return 'A'.repeat(constraints.minLength);
        }
        if (constraints.maxLength !== undefined) {
          return 'A'.repeat(Math.min(constraints.maxLength, 1));
        }
        return '';

      case 'number':
      case 'integer':
        if (constraints.minimum !== undefined) {
          return constraints.minimum;
        }
        if (constraints.maximum !== undefined) {
          return constraints.maximum;
        }
        return 0;

      case 'array':
        if (constraints.minItems !== undefined) {
          const result = [];
          for (let i = 0; i < constraints.minItems; i++) {
            if (constraints.items) {
              result.push(this.generateFromAnalyzedSchema(
                SchemaAnalyzer.analyzeSchema(constraints.items, `item_${i}`),
                { ...options, variation: 'valid' }
              ));
            } else {
              result.push(`item_${i}`);
            }
          }
          return result;
        }
        return [];

      case 'object':
        const obj: any = {};
        if (constraints.properties) {
          // Only include required properties for edge cases
          Object.keys(constraints.properties).forEach(key => {
            const isRequired = Array.isArray(constraints.required) && constraints.required.includes(key);
            if (isRequired || options.includeOptional) {
              const propSchema = SchemaAnalyzer.analyzeSchema(
                constraints.properties![key], 
                key, 
                { isRequired }
              );
              obj[key] = this.generateFromAnalyzedSchema(propSchema, { ...options, variation: 'valid' });
            }
          });
        }
        return obj;

      default:
        return null;
    }
  }

  private static generateDomainSpecificData(
    schema: ResolvedSchema,
    hint: DomainHint,
    options: DataGenerationOptions
  ): any {
    const { constraints, context } = schema;
    const fieldName = context.fieldPath[context.fieldPath.length - 1] || 'field';
    const dataSet = this.domainDataSets[hint.type];

    if (!dataSet) {
      return this.generateByType(schema, options);
    }

    // Generate based on domain and specific type
    switch (hint.type) {
      case 'financial':
        return this.generateFinancialData(fieldName, hint.specificType, constraints, options);
      case 'temporal':
        return this.generateTemporalData(fieldName, hint.specificType, constraints, options);
      case 'personal':
        return this.generatePersonalData(fieldName, hint.specificType, constraints, options);
      case 'geographic':
        return this.generateGeographicData(fieldName, hint.specificType, constraints, options);
      case 'technical':
        return this.generateTechnicalData(fieldName, hint.specificType, constraints, options);
      case 'business':
        return this.generateBusinessData(fieldName, hint.specificType, constraints, options);
      default:
        return this.generateByType(schema, options);
    }
  }

  private static generateFinancialData(fieldName: string, specificType: string | undefined, constraints: any, options: DataGenerationOptions): any {
    const { financial } = this.domainDataSets;

    if (fieldName.toLowerCase().includes('currency') || specificType === 'currency') {
      return this.getRandomElement(financial.currencies);
    }

    if (fieldName.toLowerCase().includes('amount') || fieldName.toLowerCase().includes('price')) {
      const amount = this.getRandomElement(financial.amounts);
      if (constraints.minimum !== undefined && amount < constraints.minimum) {
        return constraints.minimum;
      }
      if (constraints.maximum !== undefined && amount > constraints.maximum) {
        return constraints.maximum;
      }
      return amount;
    }

    if (fieldName.toLowerCase().includes('account')) {
      return this.getRandomElement(financial.accountNumbers);
    }

    if (fieldName.toLowerCase().includes('company') || fieldName.toLowerCase().includes('corporation')) {
      return this.getRandomElement(financial.companies);
    }

    // Default financial number
    if (constraints.type === 'number' || constraints.type === 'integer') {
      return this.getRandomElement(financial.amounts);
    }

    return 'FINANCIAL_' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  private static generateTemporalData(fieldName: string, specificType: string | undefined, constraints: any, options: DataGenerationOptions): any {
    const now = new Date();

    if (constraints.format === 'date-time' || specificType === 'date-time') {
      const date = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      return date.toISOString();
    }

    if (constraints.format === 'date' || specificType === 'date') {
      const date = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }

    if (constraints.format === 'time' || specificType === 'time') {
      const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
      const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
      const seconds = Math.floor(Math.random() * 60).toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }

    if (fieldName.toLowerCase().includes('timezone')) {
      return this.getRandomElement(this.domainDataSets.temporal.timezones);
    }

    if (fieldName.toLowerCase().includes('day')) {
      return this.getRandomElement(this.domainDataSets.temporal.dayNames);
    }

    if (fieldName.toLowerCase().includes('month')) {
      return this.getRandomElement(this.domainDataSets.temporal.monthNames);
    }

    // Default timestamp
    return now.toISOString();
  }

  private static generatePersonalData(fieldName: string, specificType: string | undefined, constraints: any, options: DataGenerationOptions): any {
    const { personal } = this.domainDataSets;

    if (constraints.format === 'email' || specificType === 'email' || fieldName.toLowerCase().includes('email')) {
      const firstName = this.getRandomElement(personal.firstNames).toLowerCase();
      const lastName = this.getRandomElement(personal.lastNames).toLowerCase();
      const domain = this.getRandomElement(this.domainDataSets.technical.domains);
      return `${firstName}.${lastName}@${domain}`;
    }

    if (fieldName.toLowerCase().includes('phone')) {
      const format = this.getRandomElement(personal.phoneFormats);
      return format.replace(/#/g, () => Math.floor(Math.random() * 10).toString());
    }

    if (fieldName.toLowerCase().includes('first') && fieldName.toLowerCase().includes('name')) {
      return this.getRandomElement(personal.firstNames);
    }

    if (fieldName.toLowerCase().includes('last') && fieldName.toLowerCase().includes('name')) {
      return this.getRandomElement(personal.lastNames);
    }

    if (fieldName.toLowerCase().includes('title')) {
      return this.getRandomElement(personal.titles);
    }

    if (fieldName.toLowerCase().includes('name')) {
      return `${this.getRandomElement(personal.firstNames)} ${this.getRandomElement(personal.lastNames)}`;
    }

    if (fieldName.toLowerCase().includes('age')) {
      return Math.floor(Math.random() * 65) + 18;
    }

    return `${this.getRandomElement(personal.firstNames)} ${this.getRandomElement(personal.lastNames)}`;
  }

  private static generateGeographicData(fieldName: string, specificType: string | undefined, constraints: any, options: DataGenerationOptions): any {
    const { geographic } = this.domainDataSets;

    if (fieldName.toLowerCase().includes('country')) {
      if (fieldName.toLowerCase().includes('code')) {
        return this.getRandomElement(geographic.countryCodes);
      }
      return this.getRandomElement(geographic.countries);
    }

    if (fieldName.toLowerCase().includes('city')) {
      return this.getRandomElement(geographic.cities);
    }

    if (fieldName.toLowerCase().includes('lat') || fieldName.toLowerCase().includes('latitude')) {
      return (Math.random() * 180 - 90).toFixed(6);
    }

    if (fieldName.toLowerCase().includes('lng') || fieldName.toLowerCase().includes('longitude')) {
      return (Math.random() * 360 - 180).toFixed(6);
    }

    if (fieldName.toLowerCase().includes('coordinate')) {
      const coord = this.getRandomElement(geographic.coordinates);
      return { lat: coord.lat, lng: coord.lng };
    }

    if (fieldName.toLowerCase().includes('address')) {
      const streetNumber = Math.floor(Math.random() * 9999) + 1;
      const streetNames = ['Main St', 'Oak Ave', 'First St', 'Second Ave', 'Park Blvd', 'Broadway'];
      const streetName = this.getRandomElement(streetNames);
      return `${streetNumber} ${streetName}`;
    }

    return this.getRandomElement(geographic.cities);
  }

  private static generateTechnicalData(fieldName: string, specificType: string | undefined, constraints: any, options: DataGenerationOptions): any {
    if (constraints.format === 'uuid' || specificType === 'uuid' || fieldName.toLowerCase().includes('uuid') || fieldName.toLowerCase().includes('id')) {
      return this.generateUUID();
    }

    if (constraints.format === 'uri' || constraints.format === 'uri-reference' || fieldName.toLowerCase().includes('url')) {
      const techDomain = this.getRandomElement(this.domainDataSets.technical.domains);
      const protocol = Math.random() > 0.2 ? 'https' : 'http';
      return `${protocol}://www.${techDomain}/api/v1/resource`;
    }

    if (fieldName.toLowerCase().includes('token') || fieldName.toLowerCase().includes('key')) {
      return 'sk_' + Math.random().toString(36).substr(2, 32);
    }

    if (fieldName.toLowerCase().includes('hash')) {
      return Math.random().toString(36).substr(2, 64);
    }

    if (fieldName.toLowerCase().includes('version')) {
      const major = Math.floor(Math.random() * 10) + 1;
      const minor = Math.floor(Math.random() * 20);
      const patch = Math.floor(Math.random() * 50);
      return `${major}.${minor}.${patch}`;
    }

    if (fieldName.toLowerCase().includes('status') && constraints.type === 'number') {
      return this.getRandomElement(this.domainDataSets.technical.statusCodes);
    }

    if (fieldName.toLowerCase().includes('protocol')) {
      return this.getRandomElement(this.domainDataSets.technical.protocols);
    }

    return Math.random().toString(36).substr(2, 16);
  }

  private static generateBusinessData(fieldName: string, specificType: string | undefined, constraints: any, options: DataGenerationOptions): any {
    const { business } = this.domainDataSets;

    if (fieldName.toLowerCase().includes('department')) {
      return this.getRandomElement(business.departments);
    }

    if (fieldName.toLowerCase().includes('role') || fieldName.toLowerCase().includes('position')) {
      return this.getRandomElement(business.roles);
    }

    if (fieldName.toLowerCase().includes('industry')) {
      return this.getRandomElement(business.industries);
    }

    if (fieldName.toLowerCase().includes('company') || fieldName.toLowerCase().includes('organization')) {
      return this.getRandomElement(this.domainDataSets.financial.companies);
    }

    return this.getRandomElement(business.departments);
  }

  private static generateByType(schema: ResolvedSchema, options: DataGenerationOptions): any {
    const { constraints } = schema;

    switch (constraints.type) {
      case 'string':
        return this.generateStringByConstraints(constraints, options);
      case 'number':
      case 'integer':
        return this.generateNumberByConstraints(constraints, options);
      case 'boolean':
        return Math.random() > 0.5;
      case 'array':
        return this.generateArrayByConstraints(constraints, options);
      case 'object':
        return this.generateObjectByConstraints(constraints, options);
      default:
        return null;
    }
  }

  private static generateStringByConstraints(constraints: any, options: DataGenerationOptions): string {
    const minLength = constraints.minLength || 1;
    const maxLength = constraints.maxLength || 50;
    
    if (constraints.enum && constraints.enum.length > 0) {
      return this.getRandomElement(constraints.enum);
    }

    if (constraints.example && typeof constraints.example === 'string') {
      return constraints.example;
    }

    if (constraints.format) {
      return this.generateByFormat(constraints.format, constraints);
    }

    // Generate realistic words
    const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do'];
    let result = '';
    while (result.length < minLength) {
      result += this.getRandomElement(words) + ' ';
    }
    
    result = result.trim();
    return result.length > maxLength ? result.substring(0, maxLength) : result;
  }

  private static generateNumberByConstraints(constraints: any, options: DataGenerationOptions): number {
    const min = constraints.minimum ?? 0;
    const max = constraints.maximum ?? 1000;
    
    if (constraints.enum && constraints.enum.length > 0) {
      return this.getRandomElement(constraints.enum);
    }

    if (constraints.example !== undefined) {
      return constraints.example;
    }

    let value = Math.random() * (max - min) + min;
    
    if (constraints.multipleOf) {
      value = Math.round(value / constraints.multipleOf) * constraints.multipleOf;
    }
    
    if (constraints.type === 'integer') {
      value = Math.round(value);
    }
    
    return value;
  }

  private static generateArrayByConstraints(constraints: any, options: DataGenerationOptions): any[] {
    const minItems = constraints.minItems || 0;
    const maxItems = constraints.maxItems || 3;
    const itemCount = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
    
    const result = [];
    for (let i = 0; i < itemCount; i++) {
      if (constraints.items) {
        const itemSchema = SchemaAnalyzer.analyzeSchema(constraints.items, `item_${i}`);
        result.push(this.generateFromAnalyzedSchema(itemSchema, options));
      } else {
        result.push(`item_${i + 1}`);
      }
    }
    
    return result;
  }

  private static generateObjectByConstraints(constraints: any, options: DataGenerationOptions): any {
    const obj: any = {};
    
    if (constraints.properties) {
      Object.keys(constraints.properties).forEach(key => {
        const isRequired = Array.isArray(constraints.required) && constraints.required.includes(key);
        const shouldInclude = isRequired || (options.includeOptional && Math.random() > 0.3);
        
        if (shouldInclude) {
          const propSchema = SchemaAnalyzer.analyzeSchema(
            constraints.properties[key], 
            key,
            { isRequired }
          );
          obj[key] = this.generateFromAnalyzedSchema(propSchema, options);
        }
      });
    }
    
    return obj;
  }

  private static generateByFormat(format: string, constraints: any): string {
    switch (format) {
      case 'date':
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));
        return date.toISOString().split('T')[0];
      
      case 'date-time':
        const datetime = new Date();
        datetime.setTime(datetime.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        return datetime.toISOString();
      
      case 'time':
        const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
        const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        const seconds = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      
      case 'email':
        const domains = this.domainDataSets.technical.domains;
        const firstNames = this.domainDataSets.personal.firstNames;
        const firstName = this.getRandomElement(firstNames).toLowerCase();
        const domain = this.getRandomElement(domains);
        return `${firstName}@${domain}`;
      
      case 'uuid':
        return this.generateUUID();
      
      case 'uri':
      case 'uri-reference':
        const techDomains = this.domainDataSets.technical.domains;
        const uriDomain = this.getRandomElement(techDomains);
        return `https://api.${uriDomain}/v1/resource`;
      
      case 'hostname':
        return this.getRandomElement(this.domainDataSets.technical.domains);
      
      case 'ipv4':
        return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
      
      case 'ipv6':
        return Array.from({ length: 8 }, () => 
          Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')
        ).join(':');
      
      case 'password':
        return 'SecurePass123!';
      
      case 'byte':
        return Buffer.from('Hello World').toString('base64');
      
      default:
        return 'formatted_string_' + Math.random().toString(36).substr(2, 8);
    }
  }

  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  static generateTestVariations(schema: any, fieldName: string = 'field'): {
    valid: any;
    invalid: any;
    edge: any;
    boundary: any;
  } {
    return {
      valid: this.generateAdvancedMockData(schema, fieldName, { variation: 'valid', includeOptional: true }),
      invalid: this.generateAdvancedMockData(schema, fieldName, { variation: 'invalid' }),
      edge: this.generateAdvancedMockData(schema, fieldName, { variation: 'edge' }),
      boundary: this.generateAdvancedMockData(schema, fieldName, { variation: 'boundary' })
    };
  }
}