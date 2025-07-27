
export interface ParsedOperation {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

export interface ParsedSpec {
  info: {
    title: string;
    version: string;
    description?: string;
  };
  operations: ParsedOperation[];
  servers?: any[];
  schemas?: Record<string, any>;
}

export const parseSwaggerFile = async (content: string, filename: string): Promise<ParsedSpec> => {
  try {
    let spec: any;
    
    // Try to parse as JSON first, then YAML
    try {
      spec = JSON.parse(content);
    } catch {
      // Simple YAML-like parsing for basic OpenAPI specs
      spec = parseSimpleYaml(content);
    }

    // Basic validation
    if (!spec || typeof spec !== 'object') {
      throw new Error('Invalid OpenAPI specification format');
    }

    // Extract operations from paths
    const operations: ParsedOperation[] = [];
    
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
        if (!pathItem || typeof pathItem !== 'object') return;
        
        const httpMethods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'];
        
        httpMethods.forEach(method => {
          if (pathItem[method]) {
            const operation = pathItem[method];
            operations.push({
              path,
              method: method.toUpperCase(),
              operationId: operation.operationId,
              summary: operation.summary,
              description: operation.description,
              tags: operation.tags || ['default'],
              parameters: operation.parameters,
              requestBody: operation.requestBody,
              responses: operation.responses,
            });
          }
        });
      });
    }

    return {
      info: spec.info || { title: filename, version: '1.0.0' },
      operations,
      servers: spec.servers,
      schemas: spec.components?.schemas || spec.definitions,
    };
  } catch (error) {
    console.error('Error parsing OpenAPI spec:', error);
    throw new Error(`Failed to parse ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Simple YAML parser for basic OpenAPI specs
const parseSimpleYaml = (yamlContent: string): any => {
  const lines = yamlContent.split('\n');
  const result: any = {};
  const stack: any[] = [result];
  const indentStack: number[] = [0];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.length - line.trimStart().length;
    const colonIndex = trimmed.indexOf(':');
    
    if (colonIndex === -1) continue;
    
    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();
    
    // Handle indentation
    while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
      stack.pop();
      indentStack.pop();
    }
    
    const current = stack[stack.length - 1];
    
    if (value === '' || value === '{}' || value === '[]') {
      // Object or array
      current[key] = value === '[]' ? [] : {};
      stack.push(current[key]);
      indentStack.push(indent);
    } else {
      // Simple value
      current[key] = parseValue(value);
    }
  }
  
  return result;
};

const parseValue = (value: string): any => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (!isNaN(Number(value))) return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
};
