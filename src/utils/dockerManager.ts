import { DockerConnectionSettings, DockerExecutionConfig, DockerExecutionResult, DockerInfo, TestResult, ErrorDetails } from '@/types/dockerTypes';

// Re-export for backwards compatibility
export type { DockerExecutionConfig, DockerExecutionResult };

export class DockerManager {
  private static instance: DockerManager;
  
  public static getInstance(): DockerManager {
    if (!DockerManager.instance) {
      DockerManager.instance = new DockerManager();
    }
    return DockerManager.instance;
  }

  private constructor() {}

  async checkDockerAvailability(connection?: DockerConnectionSettings): Promise<boolean> {
    // In a real implementation, this would test the specific Docker connection
    // For now, we'll simulate Docker availability based on connection type
    return new Promise((resolve) => {
      const delay = connection?.type === 'remote-tcp' || connection?.type === 'remote-ssh' ? 300 : 100;
      setTimeout(() => {
        // Simulate some connections failing
        const success = connection?.type === 'custom' ? Math.random() > 0.3 : true;
        resolve(success);
      }, delay);
    });
  }

  async testConnection(connection: DockerConnectionSettings): Promise<{ success: boolean; info?: DockerInfo; error?: string }> {
    try {
      // Simulate connection testing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate different connection results
      if (connection.type === 'custom' && Math.random() > 0.7) {
        throw new Error('Custom connection failed');
      }
      
      if (connection.type === 'remote-ssh' && Math.random() > 0.8) {
        throw new Error('SSH connection timeout');
      }

      const mockInfo: DockerInfo = {
        version: '24.0.0',
        apiVersion: '1.43',
        platform: connection.type === 'remote-tcp' ? 'linux/amd64' : 'local',
        architecture: 'x86_64',
        containers: Math.floor(Math.random() * 10),
        images: Math.floor(Math.random() * 50) + 10
      };

      return { success: true, info: mockInfo };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }

  async buildTestImage(): Promise<boolean> {
    // Simulate Docker image building
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 2000);
    });
  }

  async executeTests(config: DockerExecutionConfig): Promise<DockerExecutionResult> {
    const startTime = Date.now();
    const containerId = `pact-test-${Date.now()}`;
    
    try {
      // Use connection-specific configuration
      const connection = config.connection;
      if (connection) {
        console.log(`Executing tests using ${connection.name} (${connection.type})`);
      }
      
      // Simulate containerized test execution with connection-specific behavior
      await this.prepareTestEnvironment(config);
      const result = await this.runTestsInContainer(config);
      
      const testResults = this.generateDetailedTestResults(config, result.exitCode === 0);
      
      return {
        success: result.exitCode === 0,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        duration: Date.now() - startTime,
        containerId,
        testResults
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: 1,
        duration: Date.now() - startTime,
        containerId
      };
    }
  }

  private async prepareTestEnvironment(config: DockerExecutionConfig): Promise<void> {
    // Simulate environment preparation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create test files in container
    for (const testFile of config.testFiles) {
      await this.writeTestFileToContainer(testFile);
    }
  }

  private async writeTestFileToContainer(content: string): Promise<void> {
    // Simulate writing test files to container
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async runTestsInContainer(config: DockerExecutionConfig): Promise<{
    output: string;
    error?: string;
    exitCode: number;
  }> {
    // Simulate actual test execution in container
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
    
    const profile = config.isProviderMode ? 'provider' : 'consumer';
    const success = Math.random() > 0.2; // 80% success rate for simulation
    
    if (success) {
      return {
        output: this.generateSuccessOutput(config, profile),
        exitCode: 0
      };
    } else {
      return {
        output: this.generateFailureOutput(config, profile),
        error: 'Test execution failed',
        exitCode: 1
      };
    }
  }

  private generateSuccessOutput(config: DockerExecutionConfig, profile: string): string {
    const testCount = config.testFiles.length;
    const connection = config.connection;
    const connectionInfo = connection ? ` via ${connection.name}` : '';
    
    return `
Docker container started successfully${connectionInfo}
Running ${profile} tests...

✓ Test environment initialized
✓ Dependencies installed
✓ ${testCount} test file(s) executed
✓ All interactions verified
✓ Pact files generated successfully
${connection?.type !== 'local' ? `✓ Remote execution completed on ${connection?.config.host || connection?.config.contextName}` : ''}

Tests: ${testCount} passed, 0 failed
Time: ${(Math.random() * 5 + 2).toFixed(2)}s

Container execution completed successfully.
    `.trim();
  }

  private generateFailureOutput(config: DockerExecutionConfig, profile: string): string {
    const testCount = config.testFiles.length;
    const failedCount = Math.floor(Math.random() * testCount) + 1;
    return `
Docker container started successfully
Running ${profile} tests...

✓ Test environment initialized
✓ Dependencies installed
✗ ${failedCount} of ${testCount} test file(s) failed

FAIL consumer-product-api.test.js
  ● Contract Test › Product API › GET /products/123

    AssertionError: Contract verification failed
      at Object.<anonymous> (/app/tests/consumer-product-api.test.js:45:7)
      at Promise.then.completed (/app/node_modules/jest-circus/build/utils.js:333:28)
      at new Promise (<anonymous>)
      at callAsyncCircusFn (/app/node_modules/jest-circus/build/utils.js:259:10)

    Expected: 200
    Received: 404

    Difference:
      - Expected
      + Received
      - 200
      + 404

Stack trace:
Error: Request failed with status code 404
    at createError (/app/node_modules/axios/lib/core/createError.js:16:15)
    at settle (/app/node_modules/axios/lib/core/settle.js:17:12)
    at IncomingMessage.handleStreamEnd (/app/node_modules/axios/lib/adapters/http.js:236:11)
    at IncomingMessage.emit (events.js:203:15)
    at endReadableNT (_stream_readable.js:1145:12)
    at process._tickCallback (internal/process/next_tick.js:63:19)

Tests: ${testCount - failedCount} passed, ${failedCount} failed
Time: ${(Math.random() * 5 + 2).toFixed(2)}s

Container execution failed.
    `.trim();
  }

  private generateDetailedTestResults(config: DockerExecutionConfig, success: boolean): TestResult[] {
    const results: TestResult[] = [];
    
    config.testFiles.forEach((testFile, index) => {
      const testName = `test-${index + 1}.js`;
      const shouldFail = !success && Math.random() > 0.6; // Some tests fail when overall execution fails
      
      if (shouldFail) {
        const errorType = this.getRandomErrorType();
        const errorDetails = this.generateErrorDetails(errorType, testName);
        
        results.push({
          filename: testName,
          status: 'failed',
          message: this.getErrorMessage(errorType),
          duration: Math.random() * 3000 + 500,
          errorDetails,
          fullLog: this.generateFullLog(testName, false)
        });
      } else {
        results.push({
          filename: testName,
          status: 'passed',
          message: `Contract test passed successfully`,
          duration: Math.random() * 2000 + 300,
          fullLog: this.generateFullLog(testName, true)
        });
      }
    });
    
    return results;
  }

  private getRandomErrorType(): ErrorDetails['errorType'] {
    const types: ErrorDetails['errorType'][] = [
      'assertion', 'network', 'timeout', 'contract_mismatch', 'runtime', 'syntax'
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateErrorDetails(errorType: ErrorDetails['errorType'], filename: string): ErrorDetails {
    const baseDetails: ErrorDetails = {
      errorType,
      filename,
      lineNumber: Math.floor(Math.random() * 50) + 10,
      columnNumber: Math.floor(Math.random() * 20) + 5,
      suggestions: this.getSuggestions(errorType),
      relatedFiles: [`${filename}`, 'pact-helper.js', 'package.json']
    };

    switch (errorType) {
      case 'assertion':
        return {
          ...baseDetails,
          stackTrace: `AssertionError: expected 200 to equal 404
    at Object.<anonymous> (/app/tests/${filename}:${baseDetails.lineNumber}:${baseDetails.columnNumber})
    at Promise.then.completed (/app/node_modules/jest-circus/build/utils.js:333:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (/app/node_modules/jest-circus/build/utils.js:259:10)
    at _callCircusTest (/app/node_modules/jest-circus/build/run.js:276:40)
    at _runTest (/app/node_modules/jest-circus/build/run.js:208:3)
    at _runTestsForDescribeBlock (/app/node_modules/jest-circus/build/run.js:96:9)`,
          assertion: {
            expected: 200,
            actual: 404,
            operator: 'strictEqual',
            diff: `- Expected\n+ Received\n\n- 200\n+ 404`
          },
          context: {
            request: {
              method: 'GET',
              url: '/products/123',
              headers: { 'Content-Type': 'application/json' }
            },
            response: {
              status: 404,
              body: { error: 'Product not found' },
              headers: { 'Content-Type': 'application/json' }
            }
          }
        };

      case 'network':
        return {
          ...baseDetails,
          stackTrace: `Error: connect ECONNREFUSED 127.0.0.1:3001
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)
    at TCPConnectWrap.callbackTrampoline (internal/async_hooks.js:130:17)`,
          context: {
            request: {
              method: 'POST',
              url: 'http://127.0.0.1:3001/api/users',
              timeout: 5000
            }
          }
        };

      case 'contract_mismatch':
        return {
          ...baseDetails,
          stackTrace: `PactError: Contract verification failed
    at verifyContract (/app/node_modules/@pact-foundation/pact/src/verifier.js:124:13)
    at Object.<anonymous> (/app/tests/${filename}:${baseDetails.lineNumber}:${baseDetails.columnNumber})`,
          assertion: {
            expected: { id: 123, name: 'Product A', price: 99.99 },
            actual: { id: 123, name: 'Product A' },
            operator: 'deepEqual'
          },
          context: {
            interaction: {
              description: 'GET product by ID',
              request: { method: 'GET', path: '/products/123' },
              response: { status: 200, body: { id: 123, name: 'Product A', price: 99.99 } }
            },
            response: {
              status: 200,
              body: { id: 123, name: 'Product A' }
            }
          }
        };

      default:
        return {
          ...baseDetails,
          stackTrace: `Error: Test execution failed
    at Object.<anonymous> (/app/tests/${filename}:${baseDetails.lineNumber}:${baseDetails.columnNumber})
    at Module._compile (internal/modules/cjs/loader.js:999:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)`
        };
    }
  }

  private getSuggestions(errorType: ErrorDetails['errorType']): string[] {
    switch (errorType) {
      case 'assertion':
        return [
          'Check if the expected response matches the provider implementation',
          'Verify the test data setup and mock responses',
          'Review the API contract specification for accuracy'
        ];
      case 'network':
        return [
          'Ensure the provider service is running and accessible',
          'Check network connectivity and firewall settings',
          'Verify the provider URL and port configuration'
        ];
      case 'contract_mismatch':
        return [
          'Update the consumer expectations to match provider implementation',
          'Check if the provider API has changed since the contract was created',
          'Verify field names and data types in the contract'
        ];
      case 'timeout':
        return [
          'Increase the test timeout value',
          'Check provider service performance',
          'Review database query performance if applicable'
        ];
      default:
        return ['Review the test implementation and error logs for more details'];
    }
  }

  private getErrorMessage(errorType: ErrorDetails['errorType']): string {
    switch (errorType) {
      case 'assertion':
        return 'Assertion failed: Expected response does not match actual response';
      case 'network':
        return 'Network error: Unable to connect to provider service';
      case 'contract_mismatch':
        return 'Contract verification failed: Provider response does not match contract';
      case 'timeout':
        return 'Test timeout: Provider service did not respond within expected time';
      case 'runtime':
        return 'Runtime error: Test execution failed due to runtime exception';
      case 'syntax':
        return 'Syntax error: Invalid test code or configuration';
      default:
        return 'Test failed with unknown error';
    }
  }

  private generateFullLog(filename: string, success: boolean): string {
    if (success) {
      return `
🐳 Starting Docker container for test execution...
📦 Installing dependencies...
✅ Dependencies installed successfully
🔧 Setting up test environment...
✅ Test environment configured
🧪 Running test: ${filename}
✅ Test passed: Contract verification successful
📋 Generating test report...
✅ Test execution completed successfully
🧹 Cleaning up container resources...
✅ Container cleanup completed
      `.trim();
    } else {
      return `
🐳 Starting Docker container for test execution...
📦 Installing dependencies...
✅ Dependencies installed successfully
🔧 Setting up test environment...
✅ Test environment configured
🧪 Running test: ${filename}
❌ Test failed: Contract verification failed
📋 Error details captured
🧹 Cleaning up container resources...
✅ Container cleanup completed

Full container output:
npm WARN deprecated request@2.88.2: request has been deprecated
npm WARN deprecated har-validator@5.1.5: deprecated

> pact-tests@1.0.0 test
> jest --config=jest.config.js

FAIL tests/${filename}
  Contract Test
    ❌ should verify provider contract

Test Suites: 1 failed, 0 passed, 1 total
Tests:       1 failed, 0 passed, 1 total
Snapshots:   0 total
Time:        2.486 s
Ran all test suites.
      `.trim();
    }
  }

  async cleanupContainers(): Promise<void> {
    // Simulate container cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async getContainerLogs(containerId: string): Promise<string> {
    // Simulate getting container logs
    await new Promise(resolve => setTimeout(resolve, 200));
    return `Container ${containerId} logs retrieved successfully`;
  }
}

export const dockerManager = DockerManager.getInstance();