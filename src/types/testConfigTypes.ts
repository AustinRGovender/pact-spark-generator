export interface AdvancedTestConfig {
  timeouts: TimeoutConfig;
  logging: LoggingConfig;
  network: NetworkConfig;
  retry: RetryConfig;
  execution: ExecutionConfig;
  environment: EnvironmentConfig;
}

export interface TimeoutConfig {
  request: number;          // HTTP request timeout (ms)
  response: number;         // Response wait timeout (ms)
  test: number;            // Individual test timeout (ms)
  suite: number;           // Full suite timeout (ms)
  connection: number;      // Connection timeout (ms)
}

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  includeHeaders: boolean;
  format: LogFormat;
}

export interface NetworkConfig {
  customPort?: number;
  baseUrl?: string;
  defaultHeaders: Record<string, string>;
  proxy?: ProxyConfig;
  ssl: SSLConfig;
  keepAlive: boolean;
  maxConnections: number;
}

export interface ProxyConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  auth?: {
    username: string;
    password: string;
  };
}

export interface SSLConfig {
  verify: boolean;
  cert?: string;
  key?: string;
  ca?: string;
}

export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  retryOnStatus: number[];
  retryOnTimeout: boolean;
  baseDelay: number;        // Base delay for exponential backoff (ms)
}

export interface ExecutionConfig {
  parallel: boolean;
  maxConcurrency: number;
  randomOrder: boolean;
  stopOnFirstFailure: boolean;
  continueOnError: boolean;
  verbose: boolean;
}

export interface EnvironmentConfig {
  variables: Record<string, string>;
  configFile?: string;
  profile?: string;
  loadFromSystem: boolean;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type LogFormat = 'json' | 'text' | 'structured';
export type BackoffStrategy = 'fixed' | 'exponential' | 'linear';

export const DEFAULT_ADVANCED_CONFIG: AdvancedTestConfig = {
  timeouts: {
    request: 30000,
    response: 10000,
    test: 60000,
    suite: 300000,
    connection: 5000
  },
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: false,
    includeRequestBody: true,
    includeResponseBody: true,
    includeHeaders: false,
    format: 'text'
  },
  network: {
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    ssl: {
      verify: true
    },
    keepAlive: true,
    maxConnections: 10
  },
  retry: {
    enabled: false,
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    retryOnStatus: [500, 502, 503, 504],
    retryOnTimeout: true,
    baseDelay: 1000
  },
  execution: {
    parallel: false,
    maxConcurrency: 5,
    randomOrder: false,
    stopOnFirstFailure: false,
    continueOnError: true,
    verbose: false
  },
  environment: {
    variables: {},
    loadFromSystem: false
  }
};

export interface TestConfigPreset {
  name: string;
  description: string;
  config: Partial<AdvancedTestConfig>;
}

export const TEST_CONFIG_PRESETS: TestConfigPreset[] = [
  {
    name: 'Development',
    description: 'Fast execution with detailed logging',
    config: {
      timeouts: {
        request: 10000,
        response: 5000,
        test: 30000,
        suite: 120000,
        connection: 3000
      },
      logging: {
        level: 'debug',
        enableConsole: true,
        enableFile: false,
        includeRequestBody: true,
        includeResponseBody: true,
        includeHeaders: true,
        format: 'text'
      },
      execution: {
        parallel: false,
        maxConcurrency: 1,
        randomOrder: false,
        stopOnFirstFailure: true,
        continueOnError: true,
        verbose: true
      }
    }
  },
  {
    name: 'CI/CD',
    description: 'Optimized for continuous integration',
    config: {
      timeouts: {
        request: 15000,
        response: 8000,
        test: 45000,
        suite: 180000,
        connection: 5000
      },
      logging: {
        level: 'warn',
        enableConsole: true,
        enableFile: true,
        filePath: 'test-results.log',
        includeRequestBody: false,
        includeResponseBody: false,
        includeHeaders: false,
        format: 'json'
      },
      execution: {
        parallel: true,
        maxConcurrency: 3,
        randomOrder: false,
        stopOnFirstFailure: false,
        continueOnError: false,
        verbose: false
      },
      retry: {
        enabled: true,
        maxAttempts: 2,
        backoffStrategy: 'fixed',
        retryOnStatus: [500, 502, 503, 504],
        retryOnTimeout: true,
        baseDelay: 500
      }
    }
  },
  {
    name: 'Production',
    description: 'Robust settings for production validation',
    config: {
      timeouts: {
        request: 60000,
        response: 30000,
        test: 120000,
        suite: 600000,
        connection: 10000
      },
      logging: {
        level: 'info',
        enableConsole: false,
        enableFile: true,
        filePath: 'pact-tests.log',
        includeRequestBody: true,
        includeResponseBody: true,
        includeHeaders: false,
        format: 'structured'
      },
      execution: {
        parallel: true,
        maxConcurrency: 2,
        randomOrder: true,
        stopOnFirstFailure: false,
        continueOnError: true,
        verbose: false
      },
      retry: {
        enabled: true,
        maxAttempts: 3,
        backoffStrategy: 'exponential',
        retryOnStatus: [500, 502, 503, 504],
        retryOnTimeout: true,
        baseDelay: 2000
      }
    }
  }
];