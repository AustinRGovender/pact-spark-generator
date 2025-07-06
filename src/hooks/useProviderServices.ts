import { useState, useEffect } from 'react';
import { ProviderServiceConfig, ProviderServiceStatus } from '@/types/dockerTypes';

const STORAGE_KEY = 'provider-services';

const getDefaultService = (): ProviderServiceConfig => ({
  id: 'local-provider',
  name: 'Local Provider',
  url: 'http://localhost:3000',
  healthCheckPath: '/health',
  authentication: { type: 'none' },
  environment: 'local',
  isActive: true
});

export const useProviderServices = () => {
  const [services, setServices] = useState<ProviderServiceStatus[]>([]);
  const [activeService, setActiveService] = useState<ProviderServiceStatus | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const configs: ProviderServiceConfig[] = stored 
        ? JSON.parse(stored) 
        : [getDefaultService()];
      
      const serviceStates = configs.map(config => ({
        config,
        isHealthy: false,
        lastChecked: null,
        responseTime: undefined,
        error: undefined
      }));
      
      setServices(serviceStates);
      
      // Set active service
      const active = serviceStates.find(s => s.config.isActive);
      if (active && !activeService) {
        setActiveService(active);
      }
    } catch (error) {
      console.error('Failed to load provider services:', error);
      const defaultService = {
        config: getDefaultService(),
        isHealthy: false,
        lastChecked: null
      };
      setServices([defaultService]);
      setActiveService(defaultService);
    }
  };

  const saveServices = (newServices: ProviderServiceStatus[]) => {
    try {
      const configs = newServices.map(s => s.config);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
      setServices(newServices);
    } catch (error) {
      console.error('Failed to save provider services:', error);
    }
  };

  const addService = (config: ProviderServiceConfig) => {
    const newService: ProviderServiceStatus = {
      config,
      isHealthy: false,
      lastChecked: null
    };
    
    const updatedServices = [...services, newService];
    saveServices(updatedServices);
  };

  const updateService = (id: string, updates: Partial<ProviderServiceConfig>) => {
    const updatedServices = services.map(service => 
      service.config.id === id 
        ? { ...service, config: { ...service.config, ...updates } }
        : service
    );
    saveServices(updatedServices);
  };

  const removeService = (id: string) => {
    const updatedServices = services.filter(s => s.config.id !== id);
    saveServices(updatedServices);
    
    if (activeService?.config.id === id) {
      const newActive = updatedServices.find(s => s.config.isActive);
      setActiveService(newActive || null);
    }
  };

  const setActiveServiceById = (id: string) => {
    const updatedServices = services.map(service => ({
      ...service,
      config: {
        ...service.config,
        isActive: service.config.id === id
      }
    }));
    saveServices(updatedServices);
    
    const active = updatedServices.find(s => s.config.id === id);
    if (active) {
      setActiveService(active);
    }
  };

  const checkServiceHealth = async (service: ProviderServiceStatus): Promise<ProviderServiceStatus> => {
    const startTime = Date.now();
    
    try {
      const healthUrl = `${service.config.url}${service.config.healthCheckPath || '/health'}`;
      const headers: Record<string, string> = {};
      
      // Add authentication headers
      if (service.config.authentication?.type === 'bearer' && service.config.authentication.token) {
        headers['Authorization'] = `Bearer ${service.config.authentication.token}`;
      } else if (service.config.authentication?.type === 'api-key' && service.config.authentication.apiKey) {
        const headerName = service.config.authentication.apiKeyHeader || 'X-API-Key';
        headers[headerName] = service.config.authentication.apiKey;
      } else if (service.config.authentication?.type === 'basic' && service.config.authentication.username) {
        const credentials = btoa(`${service.config.authentication.username}:${service.config.authentication.password || ''}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000)
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      return {
        ...service,
        isHealthy,
        lastChecked: new Date(),
        responseTime,
        error: isHealthy ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        ...service,
        isHealthy: false,
        lastChecked: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  };

  const checkAllServices = async () => {
    const updatedServices = await Promise.all(
      services.map(service => checkServiceHealth(service))
    );
    setServices(updatedServices);
    
    // Update active service if it was checked
    const updatedActive = updatedServices.find(s => s.config.id === activeService?.config.id);
    if (updatedActive) {
      setActiveService(updatedActive);
    }
  };

  return {
    services,
    activeService,
    addService,
    updateService,
    removeService,
    setActiveServiceById,
    checkServiceHealth,
    checkAllServices,
    loadServices
  };
};