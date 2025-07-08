import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Server, ExternalLink, Container, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HostedService {
  name: string;
  type: 'provider' | 'mock' | 'database';
  url: string;
  port: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
  containerId?: string;
  startTime?: Date;
  error?: string;
}

interface HostingStatusProps {
  isHosting: boolean;
  hostingConfig?: {
    providerService?: any;
    useDocker?: boolean;
  };
  onHostingChange?: (services: HostedService[]) => void;
}

export const HostingStatus: React.FC<HostingStatusProps> = ({
  isHosting,
  hostingConfig,
  onHostingChange,
}) => {
  const [hostedServices, setHostedServices] = useState<HostedService[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (isHosting && hostingConfig) {
      initializeHostedServices();
    } else {
      setHostedServices([]);
    }
  }, [isHosting, hostingConfig]);

  const initializeHostedServices = async () => {
    if (!hostingConfig) return;

    setIsInitializing(true);
    
    // Simulate initializing hosted services
    const services: HostedService[] = [];
    
    // Add provider service if hosting
    if (hostingConfig.providerService) {
      services.push({
        name: 'Provider API',
        type: 'provider',
        url: 'http://localhost:8080',
        port: 8080,
        status: 'starting',
        containerId: hostingConfig.useDocker ? `provider-${Date.now()}` : undefined,
      });
    }

    setHostedServices(services);
    
    // Simulate service startup
    setTimeout(() => {
      setHostedServices(prev => prev.map(service => ({
        ...service,
        status: 'running' as const,
        startTime: new Date(),
      })));
      setIsInitializing(false);
      onHostingChange?.(services);
    }, 2000);
  };

  const getStatusIcon = (service: HostedService) => {
    switch (service.status) {
      case 'starting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Server className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'starting': return 'bg-blue-100 text-blue-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'provider': return <Server className="h-3 w-3" />;
      case 'mock': return <Globe className="h-3 w-3" />;
      case 'database': return <Container className="h-3 w-3" />;
      default: return <Server className="h-3 w-3" />;
    }
  };

  if (!isHosting || hostedServices.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-50/50 rounded-lg border border-slate-200/50 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Container className="h-4 w-4 text-slate-600" />
        <h4 className="text-sm font-medium text-slate-800">
          Hosted Services {isInitializing && '(Initializing...)'}
        </h4>
      </div>

      <div className="space-y-2">
        {hostedServices.map((service, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-white/70 rounded-lg border border-slate-200/30">
            <div className="flex items-center gap-2 flex-1">
              {getStatusIcon(service)}
              <div className="flex items-center gap-2">
                {getServiceTypeIcon(service.type)}
                <span className="text-sm font-medium text-slate-700">{service.name}</span>
              </div>
              <Badge className={`text-xs ${getStatusColor(service.status)}`}>
                {service.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {service.status === 'running' && (
                <>
                  <span className="font-mono">{service.url}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => window.open(service.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </>
              )}
              {service.containerId && (
                <Badge variant="outline" className="text-xs">
                  Docker
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {hostedServices.some(s => s.status === 'running') && (
        <div className="mt-3 p-2 bg-green-50/50 rounded-lg border border-green-200/30">
          <div className="text-xs text-green-700">
            <strong>Ready for testing:</strong> Consumer tests will run against the hosted provider at{' '}
            {hostedServices.find(s => s.type === 'provider')?.url}
          </div>
        </div>
      )}

      {hostedServices.some(s => s.status === 'error') && (
        <div className="mt-3 p-2 bg-red-50/50 rounded-lg border border-red-200/30">
          <div className="text-xs text-red-700">
            <strong>Hosting Error:</strong> Some services failed to start. Check Docker status and port availability.
          </div>
        </div>
      )}
    </div>
  );
};