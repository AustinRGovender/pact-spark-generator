import { ParsedOperation } from './swaggerParser';

export interface PerformanceTestCase {
  name: string;
  description: string;
  category: 'load' | 'stress' | 'volume' | 'timeout' | 'concurrency' | 'retry';
  scenario: string;
  testConfig: {
    concurrency?: number;
    duration?: number;
    requestCount?: number;
    payloadSize?: 'small' | 'medium' | 'large' | 'extreme';
    timeout?: number;
    retryAttempts?: number;
  };
  expectedBehavior: string;
  failureThreshold?: {
    maxResponseTime?: number;
    minSuccessRate?: number;
    maxErrorRate?: number;
  };
}

export class PerformanceTestGenerator {
  static generatePerformanceTests(operation: ParsedOperation): PerformanceTestCase[] {
    const tests: PerformanceTestCase[] = [];
    
    tests.push(...this.generateLoadTests(operation));
    tests.push(...this.generateStressTests(operation));
    tests.push(...this.generateVolumeTests(operation));
    tests.push(...this.generateTimeoutTests(operation));
    tests.push(...this.generateConcurrencyTests(operation));
    tests.push(...this.generateRetryTests(operation));

    return tests;
  }

  private static generateLoadTests(operation: ParsedOperation): PerformanceTestCase[] {
    const tests: PerformanceTestCase[] = [];

    // Normal load test
    tests.push({
      name: `${operation.operationId}_normal_load`,
      description: `Normal load test for ${operation.operationId}`,
      category: 'load',
      scenario: 'Normal expected load',
      testConfig: {
        concurrency: 10,
        duration: 60, // seconds
        requestCount: 100
      },
      expectedBehavior: 'System handles normal load efficiently',
      failureThreshold: {
        maxResponseTime: 2000, // 2 seconds
        minSuccessRate: 0.99, // 99%
        maxErrorRate: 0.01 // 1%
      }
    });

    // Peak load test
    tests.push({
      name: `${operation.operationId}_peak_load`,
      description: `Peak load test for ${operation.operationId}`,
      category: 'load',
      scenario: 'Peak expected load',
      testConfig: {
        concurrency: 50,
        duration: 120,
        requestCount: 1000
      },
      expectedBehavior: 'System handles peak load with acceptable performance',
      failureThreshold: {
        maxResponseTime: 5000, // 5 seconds
        minSuccessRate: 0.95, // 95%
        maxErrorRate: 0.05 // 5%
      }
    });

    return tests;
  }

  private static generateStressTests(operation: ParsedOperation): PerformanceTestCase[] {
    const tests: PerformanceTestCase[] = [];

    // Breaking point test
    tests.push({
      name: `${operation.operationId}_breaking_point`,
      description: `Find breaking point for ${operation.operationId}`,
      category: 'stress',
      scenario: 'Gradually increasing load until system breaks',
      testConfig: {
        concurrency: 100,
        duration: 300,
        requestCount: 5000
      },
      expectedBehavior: 'System gracefully degrades or fails with proper error responses',
      failureThreshold: {
        maxResponseTime: 10000, // 10 seconds
        minSuccessRate: 0.50, // 50%
        maxErrorRate: 0.50 // 50%
      }
    });

    // Spike test
    tests.push({
      name: `${operation.operationId}_spike_test`,
      description: `Sudden spike test for ${operation.operationId}`,
      category: 'stress',
      scenario: 'Sudden increase in load',
      testConfig: {
        concurrency: 200,
        duration: 30,
        requestCount: 2000
      },
      expectedBehavior: 'System handles sudden spikes without crashing',
      failureThreshold: {
        maxResponseTime: 15000, // 15 seconds
        minSuccessRate: 0.70, // 70%
        maxErrorRate: 0.30 // 30%
      }
    });

    return tests;
  }

  private static generateVolumeTests(operation: ParsedOperation): PerformanceTestCase[] {
    const tests: PerformanceTestCase[] = [];

    if (operation.method !== 'get') {
      // Small payload test
      tests.push({
        name: `${operation.operationId}_small_payload`,
        description: `Small payload volume test for ${operation.operationId}`,
        category: 'volume',
        scenario: 'Small payload processing',
        testConfig: {
          payloadSize: 'small',
          concurrency: 20,
          requestCount: 500
        },
        expectedBehavior: 'System processes small payloads efficiently',
        failureThreshold: {
          maxResponseTime: 1000,
          minSuccessRate: 0.99
        }
      });

      // Large payload test
      tests.push({
        name: `${operation.operationId}_large_payload`,
        description: `Large payload volume test for ${operation.operationId}`,
        category: 'volume',
        scenario: 'Large payload processing',
        testConfig: {
          payloadSize: 'large',
          concurrency: 5,
          requestCount: 50
        },
        expectedBehavior: 'System handles large payloads without memory issues',
        failureThreshold: {
          maxResponseTime: 30000, // 30 seconds
          minSuccessRate: 0.95
        }
      });

      // Extreme payload test
      tests.push({
        name: `${operation.operationId}_extreme_payload`,
        description: `Extreme payload volume test for ${operation.operationId}`,
        category: 'volume',
        scenario: 'Extreme payload size near limits',
        testConfig: {
          payloadSize: 'extreme',
          concurrency: 1,
          requestCount: 10
        },
        expectedBehavior: 'System rejects or handles extreme payloads gracefully',
        failureThreshold: {
          maxResponseTime: 60000, // 1 minute
          minSuccessRate: 0.80
        }
      });
    }

    return tests;
  }

  private static generateTimeoutTests(operation: ParsedOperation): PerformanceTestCase[] {
    const tests: PerformanceTestCase[] = [];

    // Network timeout test
    tests.push({
      name: `${operation.operationId}_network_timeout`,
      description: `Network timeout test for ${operation.operationId}`,
      category: 'timeout',
      scenario: 'Network delays and timeouts',
      testConfig: {
        timeout: 5000, // 5 seconds
        concurrency: 10,
        requestCount: 50
      },
      expectedBehavior: 'System handles network timeouts gracefully',
      failureThreshold: {
        maxResponseTime: 5000,
        minSuccessRate: 0.90
      }
    });

    // Processing timeout test
    tests.push({
      name: `${operation.operationId}_processing_timeout`,
      description: `Processing timeout test for ${operation.operationId}`,
      category: 'timeout',
      scenario: 'Long processing operations',
      testConfig: {
        timeout: 30000, // 30 seconds
        concurrency: 5,
        requestCount: 20
      },
      expectedBehavior: 'System completes processing within timeout or returns appropriate error',
      failureThreshold: {
        maxResponseTime: 30000,
        minSuccessRate: 0.85
      }
    });

    return tests;
  }

  private static generateConcurrencyTests(operation: ParsedOperation): PerformanceTestCase[] {
    const tests: PerformanceTestCase[] = [];

    // Race condition test
    tests.push({
      name: `${operation.operationId}_race_condition`,
      description: `Race condition test for ${operation.operationId}`,
      category: 'concurrency',
      scenario: 'Multiple simultaneous operations on same resource',
      testConfig: {
        concurrency: 50,
        duration: 30,
        requestCount: 200
      },
      expectedBehavior: 'System handles concurrent access without data corruption',
      failureThreshold: {
        maxResponseTime: 5000,
        minSuccessRate: 0.95
      }
    });

    // Deadlock test (for operations that might lock resources)
    if (operation.method === 'put' || operation.method === 'patch' || operation.method === 'delete') {
      tests.push({
        name: `${operation.operationId}_deadlock_prevention`,
        description: `Deadlock prevention test for ${operation.operationId}`,
        category: 'concurrency',
        scenario: 'Potential deadlock scenarios',
        testConfig: {
          concurrency: 20,
          duration: 60,
          requestCount: 100
        },
        expectedBehavior: 'System prevents deadlocks and completes operations',
        failureThreshold: {
          maxResponseTime: 10000,
          minSuccessRate: 0.90
        }
      });
    }

    return tests;
  }

  private static generateRetryTests(operation: ParsedOperation): PerformanceTestCase[] {
    const tests: PerformanceTestCase[] = [];

    // Retry logic test
    tests.push({
      name: `${operation.operationId}_retry_logic`,
      description: `Retry logic test for ${operation.operationId}`,
      category: 'retry',
      scenario: 'Transient failures requiring retries',
      testConfig: {
        retryAttempts: 3,
        concurrency: 10,
        requestCount: 100
      },
      expectedBehavior: 'System retries failed requests according to retry policy',
      failureThreshold: {
        maxResponseTime: 15000, // Including retry time
        minSuccessRate: 0.90
      }
    });

    // Exponential backoff test
    tests.push({
      name: `${operation.operationId}_exponential_backoff`,
      description: `Exponential backoff test for ${operation.operationId}`,
      category: 'retry',
      scenario: 'Progressive retry delays',
      testConfig: {
        retryAttempts: 5,
        concurrency: 5,
        requestCount: 50
      },
      expectedBehavior: 'System implements exponential backoff for retries',
      failureThreshold: {
        maxResponseTime: 30000,
        minSuccessRate: 0.85
      }
    });

    return tests;
  }

  static generatePayloadForSize(size: 'small' | 'medium' | 'large' | 'extreme', schema?: any): any {
    const payloads = {
      small: {
        data: 'A'.repeat(100), // 100 bytes
        numbers: [1, 2, 3],
        nested: { key: 'value' }
      },
      medium: {
        data: 'A'.repeat(10000), // 10KB
        numbers: Array(100).fill(0).map((_, i) => i),
        nested: Array(50).fill(0).reduce((acc, _, i) => {
          acc[`key${i}`] = `value${i}`;
          return acc;
        }, {} as Record<string, string>)
      },
      large: {
        data: 'A'.repeat(1000000), // 1MB
        numbers: Array(10000).fill(0).map((_, i) => i),
        nested: Array(1000).fill(0).reduce((acc, _, i) => {
          acc[`key${i}`] = 'A'.repeat(100);
          return acc;
        }, {} as Record<string, string>)
      },
      extreme: {
        data: 'A'.repeat(10000000), // 10MB
        numbers: Array(100000).fill(0).map((_, i) => i),
        nested: Array(5000).fill(0).reduce((acc, _, i) => {
          acc[`key${i}`] = 'A'.repeat(1000);
          return acc;
        }, {} as Record<string, string>)
      }
    };

    return payloads[size];
  }

  static generatePerformanceTestContent(operation: ParsedOperation, test: PerformanceTestCase, isConsumer: boolean = true): string {
    if (isConsumer) {
      return this.generateConsumerPerformanceTest(operation, test);
    } else {
      return this.generateProviderPerformanceTest(operation, test);
    }
  }

  private static generateConsumerPerformanceTest(operation: ParsedOperation, test: PerformanceTestCase): string {
    const payload = test.testConfig.payloadSize ? 
      this.generatePayloadForSize(test.testConfig.payloadSize) : 
      { testData: 'performance test' };

    return `
  test('${test.name}', async () => {
    const startTime = Date.now();
    const promises = [];
    const results = [];

    // Setup performance test interaction
    const interaction = {
      state: '${test.scenario}',
      uponReceiving: '${test.description}',
      withRequest: {
        method: '${operation.method.toUpperCase()}',
        path: '${operation.path}',
        headers: { 'Content-Type': 'application/json' },
        ${operation.method !== 'get' ? `body: ${JSON.stringify(payload, null, 2)}` : ''}
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { success: true, processingTime: 'PT1S' }
      }
    };

    await provider.addInteraction(interaction);

    // Execute ${test.testConfig.concurrency || 1} concurrent requests
    for (let i = 0; i < ${test.testConfig.concurrency || 1}; i++) {
      promises.push(
        fetch(\`\${mockServerURL}${operation.path}\`, {
          method: '${operation.method.toUpperCase()}',
          headers: { 'Content-Type': 'application/json' },
          ${operation.method !== 'get' ? 'body: JSON.stringify(payload)' : ''}
        }).then(async (response) => {
          const endTime = Date.now();
          return {
            status: response.status,
            responseTime: endTime - startTime,
            success: response.ok
          };
        }).catch(error => ({
          status: 0,
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message
        }))
      );
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.success).length;
    const successRate = successCount / responses.length;
    const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;

    // Validate performance thresholds
    ${test.failureThreshold?.minSuccessRate ? `expect(successRate).toBeGreaterThanOrEqual(${test.failureThreshold.minSuccessRate});` : ''}
    ${test.failureThreshold?.maxResponseTime ? `expect(avgResponseTime).toBeLessThanOrEqual(${test.failureThreshold.maxResponseTime});` : ''}

    console.log('Performance Results:', {
      successRate: \`\${(successRate * 100).toFixed(2)}%\`,
      avgResponseTime: \`\${avgResponseTime}ms\`,
      totalRequests: responses.length,
      scenario: '${test.scenario}'
    });
  }, ${(test.testConfig.timeout || test.failureThreshold?.maxResponseTime || 30000) * 2}); // Extended timeout for performance tests`;
  }

  private static generateProviderPerformanceTest(operation: ParsedOperation, test: PerformanceTestCase): string {
    const payload = test.testConfig.payloadSize ? 
      this.generatePayloadForSize(test.testConfig.payloadSize) : 
      { testData: 'performance test' };

    return `
  test('${test.name}', async () => {
    const startTime = Date.now();
    const promises = [];

    // Execute ${test.testConfig.concurrency || 1} concurrent requests
    for (let i = 0; i < ${test.testConfig.concurrency || 1}; i++) {
      promises.push(
        request(app)
          .${operation.method}('${operation.path}')
          .send(${JSON.stringify(payload, null, 2)})
          .then(response => ({
            status: response.status,
            responseTime: Date.now() - startTime,
            success: response.status < 400,
            body: response.body
          }))
          .catch(error => ({
            status: 0,
            responseTime: Date.now() - startTime,
            success: false,
            error: error.message
          }))
      );
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.success).length;
    const successRate = successCount / responses.length;
    const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;

    // Validate performance expectations
    expect(responses.length).toBe(${test.testConfig.concurrency || 1});
    ${test.failureThreshold?.minSuccessRate ? `expect(successRate).toBeGreaterThanOrEqual(${test.failureThreshold.minSuccessRate});` : ''}
    ${test.failureThreshold?.maxResponseTime ? `expect(avgResponseTime).toBeLessThanOrEqual(${test.failureThreshold.maxResponseTime});` : ''}

    // Log performance metrics
    console.log('Provider Performance Results:', {
      scenario: '${test.scenario}',
      successRate: \`\${(successRate * 100).toFixed(2)}%\`,
      avgResponseTime: \`\${avgResponseTime}ms\`,
      totalRequests: responses.length,
      behavior: '${test.expectedBehavior}'
    });
  }, ${(test.testConfig.timeout || test.failureThreshold?.maxResponseTime || 30000) * 2});`;
  }
}