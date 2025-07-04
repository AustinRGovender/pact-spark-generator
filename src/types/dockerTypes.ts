export interface DockerConnectionSettings {
  id: string;
  name: string;
  type: 'local' | 'remote-tcp' | 'remote-ssh' | 'context' | 'custom';
  isDefault: boolean;
  config: DockerConnectionConfig;
}

export interface DockerConnectionConfig {
  // Local Docker daemon
  socketPath?: string;
  
  // Remote TCP connection
  host?: string;
  port?: number;
  tls?: boolean;
  tlsCert?: string;
  tlsKey?: string;
  tlsCa?: string;
  
  // SSH connection
  sshHost?: string;
  sshPort?: number;
  sshUser?: string;
  sshKey?: string;
  
  // Docker context
  contextName?: string;
  
  // Custom configuration
  customConfig?: Record<string, any>;
  
  // Image and registry settings
  imageName?: string;
  registry?: string;
  
  // Resource limits
  memory?: string;
  cpus?: string;
  
  // Network settings
  network?: string;
}

export interface DockerConnection {
  settings: DockerConnectionSettings;
  isConnected: boolean;
  lastTested: Date | null;
  status: 'healthy' | 'unhealthy' | 'unknown';
  version?: string;
  info?: DockerInfo;
}

export interface DockerInfo {
  version: string;
  apiVersion: string;
  platform: string;
  architecture: string;
  containers: number;
  images: number;
}

export interface DockerExecutionConfig {
  testFiles: string[];
  isProviderMode: boolean;
  environment?: Record<string, string>;
  timeout?: number;
  connection?: DockerConnectionSettings;
}

export interface DockerExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  containerId?: string;
}