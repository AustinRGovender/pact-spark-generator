
import { ParsedOperation } from './swaggerParser';

export interface ErrorTestCase {
  name: string;
  description: string;
  statusCode: number;
  requestModification?: {
    removeHeaders?: string[];
    addHeaders?: { [key: string]: string };
    modifyBody?: any;
    removeBodyFields?: string[];
    invalidateBodyFields?: string[];
  };
  expectedError: {
    status: number;
    message?: string;
    code?: string;
    details?: any;
  };
  providerState?: string;
}

export interface EnhancedErrorTestSuite {
  basicErrors: ErrorTestCase[];
  boundaryTests: any[];
  edgeCases: any[];
  performanceTests: any[];
}

export class ErrorCaseGenerator {
  static generateErrorCases(operation: ParsedOperation): ErrorTestCase[] {
    const errorCases: ErrorTestCase[] = [];

    // Authentication/Authorization errors
    if (this.requiresAuth(operation)) {
      errorCases.push({
        name: 'missing_authentication',
        description: 'Request without authentication token',
        statusCode: 401,
        requestModification: {
          removeHeaders: ['Authorization', 'X-API-Key', 'Bearer']
        },
        expectedError: {
          status: 401,
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        providerState: 'user is not authenticated'
      });

      errorCases.push({
        name: 'invalid_token',
        description: 'Request with invalid authentication token',
        statusCode: 401,
        requestModification: {
          addHeaders: { 'Authorization': 'Bearer invalid_token_123' }
        },
        expectedError: {
          status: 401,
          message: 'Invalid authentication token',
          code: 'INVALID_TOKEN'
        },
        providerState: 'user has invalid token'
      });

      errorCases.push({
        name: 'expired_token',
        description: 'Request with expired authentication token',
        statusCode: 401,
        requestModification: {
          addHeaders: { 'Authorization': 'Bearer expired_token_456' }
        },
        expectedError: {
          status: 401,
          message: 'Authentication token has expired',
          code: 'TOKEN_EXPIRED'
        },
        providerState: 'user has expired token'
      });

      errorCases.push({
        name: 'insufficient_permissions',
        description: 'Request with insufficient permissions',
        statusCode: 403,
        expectedError: {
          status: 403,
          message: 'Insufficient permissions to access this resource',
          code: 'FORBIDDEN'
        },
        providerState: 'user lacks required permissions'
      });
    }

    // Validation errors for request body
    if (operation.requestBody?.content?.['application/json']?.schema) {
      const schema = operation.requestBody.content['application/json'].schema;
      
      errorCases.push({
        name: 'invalid_request_body',
        description: 'Request with invalid JSON body',
        statusCode: 400,
        requestModification: {
          modifyBody: 'invalid_json_string'
        },
        expectedError: {
          status: 400,
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        providerState: 'request has invalid JSON body'
      });

      if (schema.required && schema.required.length > 0) {
        errorCases.push({
          name: 'missing_required_fields',
          description: 'Request missing required fields',
          statusCode: 400,
          requestModification: {
            removeBodyFields: schema.required.slice(0, 2) // Remove first 2 required fields
          },
          expectedError: {
            status: 400,
            message: 'Missing required fields',
            code: 'VALIDATION_ERROR',
            details: {
              missing_fields: schema.required.slice(0, 2)
            }
          },
          providerState: 'request missing required fields'
        });
      }

      errorCases.push({
        name: 'invalid_field_types',
        description: 'Request with invalid field types',
        statusCode: 400,
        requestModification: {
          invalidateBodyFields: Object.keys(schema.properties || {}).slice(0, 2)
        },
        expectedError: {
          status: 400,
          message: 'Invalid field types in request',
          code: 'VALIDATION_ERROR'
        },
        providerState: 'request has invalid field types'
      });
    }

    // Resource not found errors
    if (operation.path.includes('{') && ['GET', 'PUT', 'DELETE'].includes(operation.method)) {
      errorCases.push({
        name: 'resource_not_found',
        description: 'Request for non-existent resource',
        statusCode: 404,
        expectedError: {
          status: 404,
          message: 'Resource not found',
          code: 'NOT_FOUND'
        },
        providerState: 'resource does not exist'
      });
    }

    // Method not allowed
    errorCases.push({
      name: 'method_not_allowed',
      description: 'Request with unsupported HTTP method',
      statusCode: 405,
      expectedError: {
        status: 405,
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      },
      providerState: 'endpoint does not support this method'
    });

    // Rate limiting
    errorCases.push({
      name: 'rate_limit_exceeded',
      description: 'Request exceeding rate limits',
      statusCode: 429,
      requestModification: {
        addHeaders: { 'X-Rate-Limit-Remaining': '0' }
      },
      expectedError: {
        status: 429,
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          retry_after: 60
        }
      },
      providerState: 'rate limit has been exceeded'
    });

    // Server errors
    errorCases.push({
      name: 'internal_server_error',
      description: 'Server experiencing internal error',
      statusCode: 500,
      expectedError: {
        status: 500,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      providerState: 'server is experiencing internal error'
    });

    errorCases.push({
      name: 'service_unavailable',
      description: 'Service temporarily unavailable',
      statusCode: 503,
      expectedError: {
        status: 503,
        message: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        details: {
          retry_after: 30
        }
      },
      providerState: 'service is temporarily unavailable'
    });

    // Content-Type errors
    if (operation.requestBody) {
      errorCases.push({
        name: 'unsupported_media_type',
        description: 'Request with unsupported content type',
        statusCode: 415,
        requestModification: {
          addHeaders: { 'Content-Type': 'application/xml' }
        },
        expectedError: {
          status: 415,
          message: 'Unsupported media type',
          code: 'UNSUPPORTED_MEDIA_TYPE'
        },
        providerState: 'request has unsupported content type'
      });
    }

    // Filter based on operation's defined responses
    return errorCases.filter(errorCase => {
      if (operation.responses && operation.responses[errorCase.statusCode.toString()]) {
        return true;
      }
      // Include common error cases even if not explicitly defined
      return [400, 401, 403, 404, 500].includes(errorCase.statusCode);
    });
  }

  private static requiresAuth(operation: ParsedOperation): boolean {
    // Simple heuristic to determine if operation requires authentication
    const authIndicators = [
      'security',
      'authorization',
      'auth',
      'protected',
      'private',
      'user',
      'profile',
      'account'
    ];
    
    const operationText = JSON.stringify(operation).toLowerCase();
    return authIndicators.some(indicator => operationText.includes(indicator));
  }

  static generateErrorTestContent(
    operation: ParsedOperation,
    errorCase: ErrorTestCase,
    isConsumer: boolean = true
  ): string {
    if (isConsumer) {
      return this.generateConsumerErrorTest(operation, errorCase);
    } else {
      return this.generateProviderErrorTest(operation, errorCase);
    }
  }

  private static generateConsumerErrorTest(operation: ParsedOperation, errorCase: ErrorTestCase): string {
    return `
    it('should handle ${errorCase.name} - ${errorCase.description}', async () => {
      // Arrange
      const expectedError = ${JSON.stringify(errorCase.expectedError, null, 6)};
      
      await provider
        .given('${errorCase.providerState}')
        .uponReceiving('${errorCase.description}')
        .withRequest({
          method: '${operation.method}',
          path: '${operation.path}'${this.generateErrorRequestModifications(errorCase)}
        })
        .willRespondWith({
          status: ${errorCase.statusCode},
          headers: {
            'Content-Type': 'application/json'
          },
          body: expectedError
        });

      // Act & Assert
      // Add your consumer code here to make the actual request and verify error handling
      // try {
      //   await yourApiClient.${operation.method.toLowerCase()}('${operation.path}');
      //   expect.fail('Expected request to fail');
      // } catch (error) {
      //   expect(error.status).toEqual(${errorCase.statusCode});
      //   expect(error.response.data).toMatchObject(expectedError);
      // }
    });\n`;
  }

  private static generateProviderErrorTest(operation: ParsedOperation, errorCase: ErrorTestCase): string {
    return `
    it('should handle ${errorCase.name} - ${errorCase.description}', async () => {
      // Arrange - Set up provider state for error scenario
      const errorScenario = '${errorCase.providerState}';
      
      // Act - Make request that should trigger error
      const request = {
        method: '${operation.method}',
        path: '${operation.path}'${this.generateErrorRequestModifications(errorCase)}
      };
      
      // Assert - Verify error response
      const response = await makeRequest(request);
      expect(response.status).toBe(${errorCase.statusCode});
      expect(response.body).toMatchObject(${JSON.stringify(errorCase.expectedError, null, 6)});
    });\n`;
  }

  private static generateErrorRequestModifications(errorCase: ErrorTestCase): string {
    let modifications = '';
    
    if (errorCase.requestModification) {
      const mod = errorCase.requestModification;
      
      if (mod.addHeaders || mod.removeHeaders) {
        modifications += ',\n          headers: {';
        if (mod.addHeaders) {
          Object.entries(mod.addHeaders).forEach(([key, value]) => {
            modifications += `\n            '${key}': '${value}',`;
          });
        }
        modifications += '\n          }';
      }
      
      if (mod.modifyBody) {
        modifications += `,\n          body: ${typeof mod.modifyBody === 'string' ? `'${mod.modifyBody}'` : JSON.stringify(mod.modifyBody, null, 10)}`;
      }
    }
    
    return modifications;
  }

  static generateEnhancedErrorTestSuite(operation: ParsedOperation): EnhancedErrorTestSuite {
    return {
      basicErrors: this.generateErrorCases(operation),
      boundaryTests: [], // Will be populated by BoundaryTestGenerator
      edgeCases: [], // Will be populated by EdgeCaseGenerator  
      performanceTests: [] // Will be populated by PerformanceTestGenerator
    };
  }
}
