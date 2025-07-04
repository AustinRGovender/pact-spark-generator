import { useState, useEffect } from 'react';
import { DockerConnectionSettings, DockerConnection } from '@/types/dockerTypes';

const STORAGE_KEY = 'docker-connections';
const DEFAULT_CONNECTION_ID = 'default-local';

const getDefaultConnection = (): DockerConnectionSettings => ({
  id: DEFAULT_CONNECTION_ID,
  name: 'Local Docker',
  type: 'local',
  isDefault: true,
  config: {
    socketPath: '/var/run/docker.sock',
    imageName: 'pact-test-runner',
    memory: '512m',
    cpus: '1'
  }
});

export const useDockerConnections = () => {
  const [connections, setConnections] = useState<DockerConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<DockerConnection | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const settings: DockerConnectionSettings[] = stored 
        ? JSON.parse(stored) 
        : [getDefaultConnection()];
      
      const connectionStates = settings.map(setting => ({
        settings: setting,
        isConnected: false,
        lastTested: null,
        status: 'unknown' as const
      }));
      
      setConnections(connectionStates);
      
      // Set default active connection
      const defaultConn = connectionStates.find(c => c.settings.isDefault);
      if (defaultConn && !activeConnection) {
        setActiveConnection(defaultConn);
      }
    } catch (error) {
      console.error('Failed to load Docker connections:', error);
      const defaultConn = {
        settings: getDefaultConnection(),
        isConnected: false,
        lastTested: null,
        status: 'unknown' as const
      };
      setConnections([defaultConn]);
      setActiveConnection(defaultConn);
    }
  };

  const saveConnections = (newConnections: DockerConnection[]) => {
    try {
      const settings = newConnections.map(c => c.settings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setConnections(newConnections);
    } catch (error) {
      console.error('Failed to save Docker connections:', error);
    }
  };

  const addConnection = (settings: DockerConnectionSettings) => {
    const newConnection: DockerConnection = {
      settings,
      isConnected: false,
      lastTested: null,
      status: 'unknown'
    };
    
    const updatedConnections = [...connections, newConnection];
    saveConnections(updatedConnections);
  };

  const updateConnection = (id: string, updates: Partial<DockerConnectionSettings>) => {
    const updatedConnections = connections.map(conn => 
      conn.settings.id === id 
        ? { ...conn, settings: { ...conn.settings, ...updates } }
        : conn
    );
    saveConnections(updatedConnections);
  };

  const removeConnection = (id: string) => {
    if (id === DEFAULT_CONNECTION_ID) return; // Can't remove default
    
    const updatedConnections = connections.filter(c => c.settings.id !== id);
    saveConnections(updatedConnections);
    
    // If removed connection was active, switch to default
    if (activeConnection?.settings.id === id) {
      const defaultConn = updatedConnections.find(c => c.settings.isDefault);
      setActiveConnection(defaultConn || null);
    }
  };

  const setDefaultConnection = (id: string) => {
    const updatedConnections = connections.map(conn => ({
      ...conn,
      settings: {
        ...conn.settings,
        isDefault: conn.settings.id === id
      }
    }));
    saveConnections(updatedConnections);
  };

  const switchConnection = (id: string) => {
    const connection = connections.find(c => c.settings.id === id);
    if (connection) {
      setActiveConnection(connection);
    }
  };

  const updateConnectionStatus = (id: string, status: 'healthy' | 'unhealthy' | 'unknown', info?: any) => {
    setConnections(prev => prev.map(conn => 
      conn.settings.id === id 
        ? { 
            ...conn, 
            status,
            lastTested: new Date(),
            isConnected: status === 'healthy',
            info
          }
        : conn
    ));
    
    // Update active connection if it matches
    if (activeConnection?.settings.id === id) {
      setActiveConnection(prev => prev ? {
        ...prev,
        status,
        lastTested: new Date(),
        isConnected: status === 'healthy',
        info
      } : null);
    }
  };

  return {
    connections,
    activeConnection,
    addConnection,
    updateConnection,
    removeConnection,
    setDefaultConnection,
    switchConnection,
    updateConnectionStatus,
    loadConnections
  };
};