
export class PactMatchers {
  static like(example: any): any {
    return {
      'pact:matcher:type': 'type',
      value: example
    };
  }

  static eachLike(example: any, options: { min?: number; max?: number } = {}): any {
    return {
      'pact:matcher:type': 'type',
      value: [example],
      min: options.min || 1,
      max: options.max
    };
  }

  static term(matcher: string | RegExp, example: any): any {
    const regex = typeof matcher === 'string' ? matcher : matcher.source;
    return {
      'pact:matcher:type': 'regex',
      regex,
      value: example
    };
  }

  static integer(example?: number): any {
    return {
      'pact:matcher:type': 'integer',
      value: example || 42
    };
  }

  static decimal(example?: number): any {
    return {
      'pact:matcher:type': 'decimal',
      value: example || 3.14
    };
  }

  static boolean(example?: boolean): any {
    return {
      'pact:matcher:type': 'boolean',
      value: example !== undefined ? example : true
    };
  }

  static string(example?: string): any {
    return {
      'pact:matcher:type': 'type',
      value: example || 'string'
    };
  }

  static uuid(example?: string): any {
    const uuidRegex = '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
    return this.term(uuidRegex, example || 'e91e4eee-9b00-4a0e-a6d8-7c25a8b1b0c8');
  }

  static email(example?: string): any {
    const emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
    return this.term(emailRegex, example || 'test@example.com');
  }

  static iso8601DateTime(example?: string): any {
    const iso8601Regex = '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?$';
    return this.term(iso8601Regex, example || '2023-01-01T12:00:00Z');
  }

  static iso8601Date(example?: string): any {
    const iso8601DateRegex = '^\\d{4}-\\d{2}-\\d{2}$';
    return this.term(iso8601DateRegex, example || '2023-01-01');
  }

  static url(example?: string): any {
    const urlRegex = '^https?://[^\\s$.?#].[^\\s]*$';
    return this.term(urlRegex, example || 'https://example.com');
  }

  static phoneNumber(example?: string): any {
    const phoneRegex = '^\\+?[\\d\\s\\-\\(\\)]{10,}$';
    return this.term(phoneRegex, example || '+1-555-123-4567');
  }

  static generateMatchersFromSchema(schema: any, fieldName: string = 'field'): any {
    if (!schema) return this.like(null);

    switch (schema.type) {
      case 'string':
        return this.generateStringMatcher(schema, fieldName);
      case 'number':
        return schema.format === 'float' ? this.decimal() : this.like(123.45);
      case 'integer':
        return this.integer();
      case 'boolean':
        return this.boolean();
      case 'array':
        const itemMatcher = schema.items 
          ? this.generateMatchersFromSchema(schema.items, `${fieldName}_item`)
          : this.string();
        return this.eachLike(itemMatcher, {
          min: schema.minItems || 1,
          max: schema.maxItems
        });
      case 'object':
        if (schema.properties) {
          const obj: any = {};
          Object.keys(schema.properties).forEach(key => {
            obj[key] = this.generateMatchersFromSchema(schema.properties[key], key);
          });
          return this.like(obj);
        }
        return this.like({});
      default:
        return this.like(schema.example || null);
    }
  }

  private static generateStringMatcher(schema: any, fieldName: string): any {
    const lowerFieldName = fieldName.toLowerCase();

    // Handle format-specific matchers
    if (schema.format) {
      switch (schema.format) {
        case 'email':
          return this.email();
        case 'uri':
        case 'url':
          return this.url();
        case 'date':
          return this.iso8601Date();
        case 'date-time':
          return this.iso8601DateTime();
        case 'uuid':
          return this.uuid();
        default:
          break;
      }
    }

    // Handle pattern matching
    if (schema.pattern) {
      return this.term(schema.pattern, schema.example || 'pattern_match');
    }

    // Context-aware matchers based on field name
    if (lowerFieldName.includes('email')) {
      return this.email();
    }
    if (lowerFieldName.includes('phone')) {
      return this.phoneNumber();
    }
    if (lowerFieldName.includes('url') || lowerFieldName.includes('website')) {
      return this.url();
    }
    if (lowerFieldName.includes('id') || lowerFieldName.includes('uuid')) {
      return this.uuid();
    }
    if (lowerFieldName.includes('date')) {
      return lowerFieldName.includes('time') ? this.iso8601DateTime() : this.iso8601Date();
    }

    // Default string matcher
    return this.string(schema.example);
  }

  static generateResponseMatchersFromSchema(responseSchema: any): any {
    if (!responseSchema) {
      return this.like({ success: true });
    }

    return this.generateMatchersFromSchema(responseSchema);
  }
}
