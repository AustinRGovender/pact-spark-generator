
export interface SchemaConstraints {
  type: string;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: any[];
  required?: boolean;
  example?: any;
}

export class MockDataGenerator {
  private static commonPatterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^\+?[\d\s\-\(\)]{10,}$/,
    url: /^https?:\/\/[^\s$.?#].[^\s]*$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    date: /^\d{4}-\d{2}-\d{2}$/,
    datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  };

  private static sampleData = {
    firstNames: ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eva', 'Frank'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'],
    companies: ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Future Systems'],
    domains: ['example.com', 'test.org', 'demo.net', 'sample.io', 'mock.dev'],
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'],
    countries: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia'],
  };

  // Legacy method - maintained for backward compatibility
  // For new implementations, use EnhancedMockDataGenerator instead

  static generateRealisticData(fieldName: string, schema: SchemaConstraints, variation: 'valid' | 'invalid' | 'edge' = 'valid'): any {
    // Handle enum values
    if (schema.enum && schema.enum.length > 0) {
      if (variation === 'invalid') {
        return 'INVALID_ENUM_VALUE';
      }
      return schema.enum[Math.floor(Math.random() * schema.enum.length)];
    }

    // Handle example values
    if (schema.example && variation === 'valid') {
      return schema.example;
    }

    // Context-aware generation based on field name
    const lowerFieldName = fieldName.toLowerCase();
    
    switch (schema.type) {
      case 'string':
        return this.generateStringData(lowerFieldName, schema, variation);
      case 'number':
      case 'integer':
        return this.generateNumberData(lowerFieldName, schema, variation);
      case 'boolean':
        return variation === 'invalid' ? 'not_a_boolean' : Math.random() > 0.5;
      case 'array':
        return this.generateArrayData(lowerFieldName, schema, variation);
      case 'object':
        return this.generateObjectData(schema, variation);
      default:
        return null;
    }
  }

  private static generateStringData(fieldName: string, schema: SchemaConstraints, variation: 'valid' | 'invalid' | 'edge'): string {
    const minLength = schema.minLength || 1;
    const maxLength = schema.maxLength || 100;

    // Context-aware string generation
    if (fieldName.includes('email')) {
      if (variation === 'invalid') return 'invalid-email';
      if (variation === 'edge') return 'a@b.co'; // minimal valid email
      const firstName = this.getRandomElement(this.sampleData.firstNames).toLowerCase();
      const domain = this.getRandomElement(this.sampleData.domains);
      return `${firstName}@${domain}`;
    }

    if (fieldName.includes('phone')) {
      if (variation === 'invalid') return '123';
      if (variation === 'edge') return '+1234567890';
      return `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    if (fieldName.includes('url') || fieldName.includes('website')) {
      if (variation === 'invalid') return 'not-a-url';
      if (variation === 'edge') return 'https://a.co';
      const domain = this.getRandomElement(this.sampleData.domains);
      return `https://www.${domain}`;
    }

    if (fieldName.includes('id') || fieldName.includes('uuid')) {
      if (variation === 'invalid') return 'not-a-uuid';
      if (variation === 'edge') return '00000000-0000-0000-0000-000000000000';
      return this.generateUUID();
    }

    if (fieldName.includes('name')) {
      if (variation === 'invalid' && minLength > 0) return '';
      if (variation === 'edge') return 'A'.repeat(minLength);
      if (fieldName.includes('first')) return this.getRandomElement(this.sampleData.firstNames);
      if (fieldName.includes('last')) return this.getRandomElement(this.sampleData.lastNames);
      if (fieldName.includes('company')) return this.getRandomElement(this.sampleData.companies);
      return `${this.getRandomElement(this.sampleData.firstNames)} ${this.getRandomElement(this.sampleData.lastNames)}`;
    }

    if (fieldName.includes('city')) {
      return this.getRandomElement(this.sampleData.cities);
    }

    if (fieldName.includes('country')) {
      return this.getRandomElement(this.sampleData.countries);
    }

    if (fieldName.includes('date')) {
      if (variation === 'invalid') return 'not-a-date';
      if (variation === 'edge') return '1970-01-01';
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      return date.toISOString().split('T')[0];
    }

    // Handle string length constraints
    if (variation === 'invalid') {
      if (minLength > 0) return ''; // Too short
      if (maxLength < 1000) return 'A'.repeat(maxLength + 1); // Too long
    }

    if (variation === 'edge') {
      if (Math.random() > 0.5) return 'A'.repeat(minLength); // Minimum length
      return 'A'.repeat(Math.min(maxLength, 50)); // Maximum or reasonable length
    }

    // Default realistic string
    const baseLength = Math.max(minLength, Math.min(maxLength, 20));
    const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
    let result = '';
    while (result.length < baseLength) {
      result += this.getRandomElement(words) + ' ';
    }
    return result.trim().substring(0, Math.min(maxLength, result.length));
  }

  private static generateNumberData(fieldName: string, schema: SchemaConstraints, variation: 'valid' | 'invalid' | 'edge'): number {
    const min = schema.minimum || 0;
    const max = schema.maximum || 1000;

    if (variation === 'invalid') {
      return NaN; // Invalid number
    }

    if (variation === 'edge') {
      return Math.random() > 0.5 ? min : max;
    }

    // Context-aware number generation
    if (fieldName.includes('age')) {
      return Math.floor(Math.random() * 80) + 18;
    }

    if (fieldName.includes('price') || fieldName.includes('cost') || fieldName.includes('amount')) {
      return Math.round((Math.random() * 999.99 + 1) * 100) / 100;
    }

    if (fieldName.includes('count') || fieldName.includes('quantity')) {
      return Math.floor(Math.random() * 100) + 1;
    }

    if (fieldName.includes('rating') || fieldName.includes('score')) {
      return Math.round((Math.random() * 4 + 1) * 10) / 10; // 1.0 to 5.0
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static generateArrayData(fieldName: string, schema: any, variation: 'valid' | 'invalid' | 'edge'): any[] {
    if (variation === 'invalid') {
      return 'not_an_array' as any;
    }

    const minItems = schema.minItems || 0;
    const maxItems = schema.maxItems || 5;

    if (variation === 'edge') {
      if (Math.random() > 0.5) return []; // Empty array
      // Generate minimum or maximum items
      const itemCount = Math.random() > 0.5 ? minItems : Math.min(maxItems, 3);
      const result = [];
      for (let i = 0; i < itemCount; i++) {
        if (schema.items) {
          result.push(this.generateRealisticData(`${fieldName}_item`, schema.items, 'valid'));
        } else {
          result.push(`${fieldName}_${i + 1}`);
        }
      }
      return result;
    }

    // Generate realistic array
    const itemCount = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
    const result = [];
    for (let i = 0; i < Math.max(1, itemCount); i++) {
      if (schema.items) {
        result.push(this.generateRealisticData(`${fieldName}_item`, schema.items, 'valid'));
      } else {
        result.push(`${fieldName}_${i + 1}`);
      }
    }
    return result;
  }

  private static generateObjectData(schema: any, variation: 'valid' | 'invalid' | 'edge'): any {
    if (variation === 'invalid') {
      return 'not_an_object';
    }

    const obj: any = {};
    if (schema.properties) {
      Object.keys(schema.properties).forEach(key => {
        const required = schema.required?.includes(key) || false;
        const propSchema = { ...schema.properties[key], required };
        
        if (variation === 'edge' && !required && Math.random() > 0.5) {
          // Sometimes omit optional fields in edge cases
          return;
        }
        
        obj[key] = this.generateRealisticData(key, propSchema, variation);
      });
    }
    return obj;
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

  static generateTestVariations(fieldName: string, schema: SchemaConstraints): { valid: any; invalid: any; edge: any } {
    return {
      valid: this.generateRealisticData(fieldName, schema, 'valid'),
      invalid: this.generateRealisticData(fieldName, schema, 'invalid'),
      edge: this.generateRealisticData(fieldName, schema, 'edge'),
    };
  }
}
