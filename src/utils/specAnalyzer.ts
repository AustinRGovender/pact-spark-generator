import { ParsedSpec, ParsedOperation } from './swaggerParser';

export interface SpecComplexity {
  size: 'small' | 'medium' | 'large' | 'xl';
  endpointCount: number;
  schemaCount: number;
  averageParametersPerEndpoint: number;
  maxSchemaDepth: number;
  complexity: number;
  estimatedProcessingTime: number;
  warnings: string[];
}

export interface ProcessingSteps {
  id: string;
  label: string;
  estimatedDuration: number;
  weight: number;
}

export const analyzeSpecComplexity = (spec: ParsedSpec): SpecComplexity => {
  const endpointCount = spec.operations.length;
  const schemaCount = spec.schemas ? Object.keys(spec.schemas).length : 0;
  
  // Calculate average parameters per endpoint
  const totalParameters = spec.operations.reduce((sum, op) => {
    return sum + (op.parameters ? op.parameters.length : 0);
  }, 0);
  const averageParametersPerEndpoint = endpointCount > 0 ? totalParameters / endpointCount : 0;
  
  // Calculate max schema depth
  const maxSchemaDepth = calculateMaxSchemaDepth(spec.schemas || {});
  
  // Calculate complexity score
  const complexity = calculateComplexityScore(endpointCount, schemaCount, averageParametersPerEndpoint, maxSchemaDepth);
  
  // Determine size category
  let size: SpecComplexity['size'];
  if (endpointCount < 50) size = 'small';
  else if (endpointCount < 200) size = 'medium';
  else if (endpointCount < 500) size = 'large';
  else size = 'xl';
  
  // Estimate processing time (in milliseconds)
  const baseTime = 2000; // 2 seconds base
  const timePerEndpoint = 50; // 50ms per endpoint
  const timePerSchema = 100; // 100ms per schema
  const complexityMultiplier = 1 + (complexity / 100);
  
  const estimatedProcessingTime = Math.round(
    (baseTime + (endpointCount * timePerEndpoint) + (schemaCount * timePerSchema)) * complexityMultiplier
  );
  
  // Generate warnings
  const warnings: string[] = [];
  if (size === 'xl') {
    warnings.push('Very large specification - generation may take 5+ minutes');
  } else if (size === 'large') {
    warnings.push('Large specification - generation may take 2-5 minutes');
  }
  
  if (maxSchemaDepth > 10) {
    warnings.push('Deep schema nesting detected - may increase processing time');
  }
  
  if (averageParametersPerEndpoint > 10) {
    warnings.push('High parameter density - complex endpoint configurations detected');
  }
  
  return {
    size,
    endpointCount,
    schemaCount,
    averageParametersPerEndpoint,
    maxSchemaDepth,
    complexity,
    estimatedProcessingTime,
    warnings
  };
};

export const getProcessingSteps = (complexity: SpecComplexity): ProcessingSteps[] => {
  const baseSteps: ProcessingSteps[] = [
    { id: 'parsing', label: 'Parsing OpenAPI specification', estimatedDuration: 500, weight: 10 },
    { id: 'analyzing', label: 'Analyzing API structure', estimatedDuration: 800, weight: 15 },
    { id: 'generating', label: 'Generating test suite', estimatedDuration: 2000, weight: 50 },
    { id: 'formatting', label: 'Formatting generated code', estimatedDuration: 700, weight: 25 }
  ];
  
  // Add dynamic steps based on complexity
  if (complexity.size === 'medium' || complexity.size === 'large' || complexity.size === 'xl') {
    baseSteps.splice(2, 0, {
      id: 'schema-processing',
      label: 'Processing schemas and models',
      estimatedDuration: complexity.schemaCount * 50,
      weight: 15
    });
  }
  
  if (complexity.size === 'large' || complexity.size === 'xl') {
    baseSteps.splice(3, 0, {
      id: 'endpoint-batching',
      label: 'Batching endpoint processing',
      estimatedDuration: complexity.endpointCount * 10,
      weight: 10
    });
  }
  
  if (complexity.size === 'xl') {
    baseSteps.splice(4, 0, {
      id: 'memory-management',
      label: 'Optimizing memory usage',
      estimatedDuration: 1000,
      weight: 5
    });
    
    baseSteps.push({
      id: 'chunked-processing',
      label: 'Processing large endpoint chunks',
      estimatedDuration: complexity.endpointCount * 5,
      weight: 10
    });
  }
  
  // Adjust durations based on complexity
  const complexityMultiplier = 1 + (complexity.complexity / 200);
  return baseSteps.map(step => ({
    ...step,
    estimatedDuration: Math.round(step.estimatedDuration * complexityMultiplier)
  }));
};

export const shouldShowLargeSpecWarning = (complexity: SpecComplexity): boolean => {
  return complexity.size === 'large' || complexity.size === 'xl' || complexity.warnings.length > 0;
};

export const formatProcessingTime = (milliseconds: number): string => {
  if (milliseconds < 60000) {
    return `${Math.ceil(milliseconds / 1000)} seconds`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.ceil((milliseconds % 60000) / 1000);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} minutes`;
  }
};

// Helper functions
const calculateMaxSchemaDepth = (schemas: Record<string, any>): number => {
  let maxDepth = 0;
  
  Object.values(schemas).forEach(schema => {
    const depth = calculateSchemaDepth(schema, new Set());
    maxDepth = Math.max(maxDepth, depth);
  });
  
  return maxDepth;
};

const calculateSchemaDepth = (schema: any, visited: Set<string>): number => {
  if (!schema || typeof schema !== 'object') return 0;
  
  // Avoid circular references
  const schemaId = JSON.stringify(schema);
  if (visited.has(schemaId)) return 0;
  visited.add(schemaId);
  
  let maxDepth = 1;
  
  if (schema.properties) {
    Object.values(schema.properties).forEach((property: any) => {
      const depth = 1 + calculateSchemaDepth(property, new Set(visited));
      maxDepth = Math.max(maxDepth, depth);
    });
  }
  
  if (schema.items) {
    const depth = 1 + calculateSchemaDepth(schema.items, new Set(visited));
    maxDepth = Math.max(maxDepth, depth);
  }
  
  return maxDepth;
};

const calculateComplexityScore = (
  endpointCount: number,
  schemaCount: number,
  avgParameters: number,
  maxDepth: number
): number => {
  const endpointScore = endpointCount * 0.5;
  const schemaScore = schemaCount * 1.0;
  const parameterScore = avgParameters * 2.0;
  const depthScore = maxDepth * 3.0;
  
  return Math.round(endpointScore + schemaScore + parameterScore + depthScore);
};