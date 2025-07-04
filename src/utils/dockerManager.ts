import { DockerConnectionSettings, DockerExecutionConfig, DockerExecutionResult, DockerInfo } from '@/types/dockerTypes';

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
      
      return {
        success: result.exitCode === 0,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        duration: Date.now() - startTime,
        containerId
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

Error: Contract verification failed
- Expected interaction not found
- Response body mismatch
- Status code assertion failed

Tests: ${testCount - failedCount} passed, ${failedCount} failed
Time: ${(Math.random() * 5 + 2).toFixed(2)}s

Container execution failed.
    `.trim();
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