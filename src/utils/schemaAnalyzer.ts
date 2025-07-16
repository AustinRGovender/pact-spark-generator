import { SchemaConstraints } from './mockDataGenerator';

export interface EnhancedSchemaConstraints extends SchemaConstraints {
  $ref?: string;
  allOf?: any[];
  oneOf?: any[];
  anyOf?: any[];
  items?: any;
  properties?: { [key: string]: any };
  additionalProperties?: boolean | any;
  description?: string;
  multipleOf?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: any;
  externalDocs?: any;
  deprecated?: boolean;
  discriminator?: any;
}

export interface ResolvedSchema {
  type: string;
  constraints: EnhancedSchemaConstraints;
  context: SchemaContext;
}

export interface SchemaContext {
  fieldPath: string[];
  parentType?: string;
  isRequired: boolean;
  depth: number;
  domainHints: DomainHint[];
}

export interface DomainHint {
  type: 'financial' | 'temporal' | 'personal' | 'geographic' | 'technical' | 'business';
  confidence: number;
  specificType?: string;
}

export class SchemaAnalyzer {
  private static formatPatterns = {
    // Standard OpenAPI formats
    'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)$/,
    'date': /^\d{4}-\d{2}-\d{2}$/,
    'time': /^\d{2}:\d{2}:\d{2}(\.\d{3})?$/,
    'email': /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'idn-email': /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'hostname': /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    'idn-hostname': /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    'ipv4': /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'ipv6': /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
    'uri': /^[a-zA-Z][a-zA-Z0-9+.-]*:/,
    'uri-reference': /^([a-zA-Z][a-zA-Z0-9+.-]*:)?[^\s]*$/,
    'iri': /^[a-zA-Z][a-zA-Z0-9+.-]*:/,
    'iri-reference': /^([a-zA-Z][a-zA-Z0-9+.-]*:)?[^\s]*$/,
    'uuid': /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'uri-template': /^[^\s]*\{[^}]+\}[^\s]*$/,
    'json-pointer': /^(\/([^\/~]|~[01])*)*$/,
    'relative-json-pointer': /^(0|[1-9][0-9]*)#?$/,
    'regex': /^.*$/,
    'password': /^.{8,}$/,
    'byte': /^[A-Za-z0-9+\/]*={0,2}$/,
    'binary': /^.*$/,
    'int32': /^-?2147483648|-?214748364[0-7]|-?21474836[0-3][0-9]|-?2147483[0-5][0-9]{2}|-?214748[0-2][0-9]{3}|-?21474[0-7][0-9]{4}|-?2147[0-3][0-9]{5}|-?214[0-6][0-9]{6}|-?21[0-3][0-9]{7}|-?2[0-0][0-9]{8}|-?1[0-9]{9}|-?[1-9][0-9]{0,8}|0$/,
    'int64': /^-?9223372036854775808|-?922337203685477580[0-7]|.*$/,
    'float': /^-?([0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?|[Ii]nfinity|NaN)$/,
    'double': /^-?([0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?|[Ii]nfinity|NaN)$/
  };

  private static domainPatterns = {
    financial: [
      /price|cost|amount|fee|rate|salary|wage|income|revenue|profit|budget|balance|payment|billing|invoice|currency/i,
      /\b(usd|eur|gbp|jpy|cad|aud|chf|cny|inr|brl)\b/i,
      /\$([\d,]+\.?\d*)|€([\d,]+\.?\d*)|£([\d,]+\.?\d*)/i
    ],
    temporal: [
      /date|time|timestamp|created|updated|modified|published|expired|start|end|begin|finish|duration|period|schedule/i,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i
    ],
    personal: [
      /name|first|last|full|email|phone|address|age|birth|gender|title|bio|profile|avatar|photo|contact/i,
      /user|person|customer|client|employee|member|account|profile/i
    ],
    geographic: [
      /country|state|province|city|region|location|address|postal|zip|latitude|longitude|coordinates|place|area/i,
      /\b(usa|canada|uk|france|germany|australia|japan|china|india|brazil)\b/i
    ],
    technical: [
      /id|uuid|token|key|secret|hash|url|uri|api|endpoint|version|status|code|type|format|protocol/i,
      /\b(http|https|ftp|ssh|tcp|udp|ip|dns|ssl|tls|oauth|jwt|rest|graphql|json|xml|yaml)\b/i
    ],
    business: [
      /order|product|service|category|brand|company|organization|department|role|permission|scope|license/i,
      /\b(b2b|b2c|saas|enterprise|startup|corporation|llc|inc|ltd)\b/i
    ]
  };

  static analyzeSchema(
    schema: any, 
    fieldName: string = 'field',
    context: Partial<SchemaContext> = {}
  ): ResolvedSchema {
    const fullContext: SchemaContext = {
      fieldPath: [...(context.fieldPath || []), fieldName],
      parentType: context.parentType,
      isRequired: context.isRequired || false,
      depth: (context.depth || 0) + 1,
      domainHints: context.domainHints || []
    };

    // Resolve schema references and compositions
    const resolvedSchema = this.resolveSchemaComposition(schema);
    
    // Extract enhanced constraints
    const constraints: EnhancedSchemaConstraints = {
      type: resolvedSchema.type || 'string',
      format: resolvedSchema.format,
      pattern: resolvedSchema.pattern,
      minLength: resolvedSchema.minLength,
      maxLength: resolvedSchema.maxLength,
      minimum: resolvedSchema.minimum,
      maximum: resolvedSchema.maximum,
      multipleOf: resolvedSchema.multipleOf,
      exclusiveMinimum: resolvedSchema.exclusiveMinimum,
      exclusiveMaximum: resolvedSchema.exclusiveMaximum,
      enum: resolvedSchema.enum,
      required: fullContext.isRequired,
      example: resolvedSchema.example,
      items: resolvedSchema.items,
      properties: resolvedSchema.properties,
      minItems: resolvedSchema.minItems,
      maxItems: resolvedSchema.maxItems,
      uniqueItems: resolvedSchema.uniqueItems,
      nullable: resolvedSchema.nullable,
      description: resolvedSchema.description,
      readOnly: resolvedSchema.readOnly,
      writeOnly: resolvedSchema.writeOnly,
      deprecated: resolvedSchema.deprecated
    };

    // Analyze domain context
    const domainHints = this.analyzeDomainContext(fieldName, resolvedSchema, fullContext);
    fullContext.domainHints = [...fullContext.domainHints, ...domainHints];

    return {
      type: constraints.type,
      constraints,
      context: fullContext
    };
  }

  private static resolveSchemaComposition(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      return { type: 'string' };
    }

    // Handle $ref (simplified - in real implementation, you'd resolve external refs)
    if (schema.$ref) {
      // For now, return a basic schema - in production, resolve the reference
      return { type: 'string', description: `Reference: ${schema.$ref}` };
    }

    // Handle allOf - merge all schemas
    if (schema.allOf && Array.isArray(schema.allOf)) {
      const merged = { ...schema };
      delete merged.allOf;
      
      schema.allOf.forEach((subSchema: any) => {
        const resolved = this.resolveSchemaComposition(subSchema);
        Object.assign(merged, resolved);
        
        // Merge properties for object types
        if (resolved.properties) {
          merged.properties = { ...merged.properties, ...resolved.properties };
        }
        
        // Merge required arrays
        if (resolved.required) {
          merged.required = [...(merged.required || []), ...resolved.required];
        }
      });
      
      return merged;
    }

    // Handle oneOf/anyOf - pick the first schema for simplicity
    if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
      return this.resolveSchemaComposition(schema.oneOf[0]);
    }

    if (schema.anyOf && Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
      return this.resolveSchemaComposition(schema.anyOf[0]);
    }

    return schema;
  }

  private static analyzeDomainContext(
    fieldName: string, 
    schema: any, 
    context: SchemaContext
  ): DomainHint[] {
    const hints: DomainHint[] = [];
    const fullPath = context.fieldPath.join('.');
    const description = schema.description || '';
    const combinedText = `${fieldName} ${fullPath} ${description}`.toLowerCase();

    // Analyze against domain patterns
    Object.entries(this.domainPatterns).forEach(([domain, patterns]) => {
      let confidence = 0;
      let specificType: string | undefined;

      patterns.forEach(pattern => {
        if (pattern.test(combinedText)) {
          confidence += 0.3;
          
          // Extract specific types
          if (domain === 'financial' && /currency|money/.test(combinedText)) {
            specificType = 'currency';
          } else if (domain === 'temporal' && /date/.test(combinedText)) {
            specificType = 'date';
          } else if (domain === 'personal' && /email/.test(combinedText)) {
            specificType = 'email';
          }
        }
      });

      // Boost confidence based on format
      if (schema.format) {
        if (domain === 'temporal' && ['date', 'date-time', 'time'].includes(schema.format)) {
          confidence += 0.5;
          specificType = schema.format;
        } else if (domain === 'personal' && schema.format === 'email') {
          confidence += 0.5;
          specificType = 'email';
        } else if (domain === 'technical' && ['uuid', 'uri', 'uri-reference'].includes(schema.format)) {
          confidence += 0.5;
          specificType = schema.format;
        }
      }

      // Boost confidence for exact field name matches
      if (fieldName.toLowerCase() === domain || fieldName.toLowerCase().includes(domain)) {
        confidence += 0.4;
      }

      if (confidence > 0.2) {
        hints.push({
          type: domain as any,
          confidence: Math.min(confidence, 1.0),
          specificType
        });
      }
    });

    return hints.sort((a, b) => b.confidence - a.confidence);
  }

  static getFormatValidator(format: string): RegExp | null {
    return this.formatPatterns[format as keyof typeof this.formatPatterns] || null;
  }

  static isValidFormat(value: string, format: string): boolean {
    const validator = this.getFormatValidator(format);
    return validator ? validator.test(value) : true;
  }

  static getBoundaryValues(constraints: EnhancedSchemaConstraints): any[] {
    const boundaries: any[] = [];

    if (constraints.type === 'string') {
      if (constraints.minLength !== undefined) {
        boundaries.push('A'.repeat(constraints.minLength));
        if (constraints.minLength > 0) {
          boundaries.push('A'.repeat(constraints.minLength - 1)); // Invalid
        }
      }
      if (constraints.maxLength !== undefined) {
        boundaries.push('A'.repeat(constraints.maxLength));
        boundaries.push('A'.repeat(constraints.maxLength + 1)); // Invalid
      }
    }

    if (constraints.type === 'number' || constraints.type === 'integer') {
      if (constraints.minimum !== undefined) {
        boundaries.push(constraints.minimum);
        if (!constraints.exclusiveMinimum) {
          boundaries.push(constraints.minimum - 1); // Invalid
        }
      }
      if (constraints.maximum !== undefined) {
        boundaries.push(constraints.maximum);
        if (!constraints.exclusiveMaximum) {
          boundaries.push(constraints.maximum + 1); // Invalid
        }
      }
    }

    if (constraints.type === 'array') {
      if (constraints.minItems !== undefined && constraints.maxItems !== undefined) {
        boundaries.push(constraints.minItems);
        boundaries.push(constraints.maxItems);
        if (constraints.minItems > 0) {
          boundaries.push(constraints.minItems - 1); // Invalid
        }
        boundaries.push(constraints.maxItems + 1); // Invalid
      }
    }

    return boundaries;
  }
}