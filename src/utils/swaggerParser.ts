
import SwaggerParser from '@apidevtools/swagger-parser';

export interface ParsedOperation {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  tags?: string[];
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

export interface ParsedSpec {
  info: {
    title: string;
    version: string;
  };
  operations: ParsedOperation[];
  servers?: any[];
}

export const parseSwaggerFile = async (content: string, filename: string): Promise<ParsedSpec> => {
  try {
    let spec: any;
    
    // Try to parse as JSON first, then YAML
    try {
      spec = JSON.parse(content);
    } catch {
      // If JSON parsing fails, assume it's YAML and use the parser to handle it
      spec = await SwaggerParser.parse(content);
    }

    // Dereference the spec to resolve all $ref pointers
    const dereferencedSpec = await SwaggerParser.dereference(spec);
    
    // Extract operations from paths
    const operations: ParsedOperation[] = [];
    
    if (dereferencedSpec.paths) {
      Object.entries(dereferencedSpec.paths).forEach(([path, pathItem]: [string, any]) => {
        const httpMethods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'];
        
        httpMethods.forEach(method => {
          if (pathItem[method]) {
            const operation = pathItem[method];
            operations.push({
              path,
              method: method.toUpperCase(),
              operationId: operation.operationId,
              summary: operation.summary || operation.description,
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
      info: dereferencedSpec.info || { title: filename, version: '1.0.0' },
      operations,
      servers: dereferencedSpec.servers,
    };
  } catch (error) {
    console.error('Error parsing Swagger/OpenAPI spec:', error);
    throw new Error(`Failed to parse ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
