import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ProviderServiceConfig } from '@/types/dockerTypes';
import { useProviderServices } from '@/hooks/useProviderServices';
import { useToast } from '@/hooks/use-toast';

interface ProviderServiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProviderServiceSettings: React.FC<ProviderServiceSettingsProps> = ({
  isOpen,
  onClose
}) => {
  const { services, addService, updateService, removeService, setActiveServiceById, checkServiceHealth } = useProviderServices();
  const { toast } = useToast();
  const [newService, setNewService] = useState<Partial<ProviderServiceConfig>>({
    name: '',
    url: '',
    healthCheckPath: '/health',
    authentication: { type: 'none' },
    environment: 'local',
    isActive: false
  });

  const handleAddService = () => {
    if (!newService.name || !newService.url) {
      toast({
        title: "Validation Error",
        description: "Name and URL are required",
        variant: "destructive"
      });
      return;
    }

    const config: ProviderServiceConfig = {
      id: `service-${Date.now()}`,
      name: newService.name,
      url: newService.url,
      healthCheckPath: newService.healthCheckPath,
      authentication: newService.authentication,
      environment: newService.environment || 'local',
      isActive: newService.isActive || false
    };

    addService(config);
    setNewService({
      name: '',
      url: '',
      healthCheckPath: '/health',
      authentication: { type: 'none' },
      environment: 'local',
      isActive: false
    });

    toast({
      title: "Service Added",
      description: `Provider service "${config.name}" has been added`
    });
  };

  const handleTestService = async (service: any) => {
    toast({
      title: "Testing Connection",
      description: `Testing connection to ${service.config.name}...`
    });

    const result = await checkServiceHealth(service);
    
    toast({
      title: result.isHealthy ? "Connection Successful" : "Connection Failed",
      description: result.isHealthy 
        ? `${service.config.name} responded in ${result.responseTime}ms`
        : result.error,
      variant: result.isHealthy ? "default" : "destructive"
    });
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'local': return 'bg-blue-100 text-blue-800';
      case 'development': return 'bg-green-100 text-green-800';
      case 'staging': return 'bg-yellow-100 text-yellow-800';
      case 'production': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (service: any) => {
    if (!service.lastChecked) {
      return <Clock className="h-4 w-4 text-gray-500" />;
    }
    return service.isHealthy 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Provider Service Configuration</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services">Manage Services</TabsTrigger>
            <TabsTrigger value="add">Add New Service</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4">
              {services.map((service) => (
                <Card key={service.config.id} className={service.config.isActive ? 'ring-2 ring-blue-500' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service)}
                        <div>
                          <CardTitle className="text-lg">{service.config.name}</CardTitle>
                          <CardDescription>{service.config.url}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getEnvironmentColor(service.config.environment)}>
                          {service.config.environment}
                        </Badge>
                        {service.config.isActive && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Health Check: {service.config.healthCheckPath || '/health'}</div>
                        <div>Auth: {service.config.authentication?.type || 'none'}</div>
                        {service.lastChecked && (
                          <div>
                            Last checked: {service.lastChecked.toLocaleTimeString()}
                            {service.responseTime && ` (${service.responseTime}ms)`}
                          </div>
                        )}
                        {service.error && (
                          <div className="text-red-600">Error: {service.error}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestService(service)}
                        >
                          <TestTube className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        {!service.config.isActive && (
                          <Button
                            size="sm"
                            onClick={() => setActiveServiceById(service.config.id)}
                          >
                            Set Active
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeService(service.config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Provider Service</CardTitle>
                <CardDescription>
                  Configure a new provider service for contract testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Service Name</Label>
                    <Input
                      id="name"
                      value={newService.name || ''}
                      onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My API Service"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Service URL</Label>
                    <Input
                      id="url"
                      value={newService.url || ''}
                      onChange={(e) => setNewService(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="http://localhost:3000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="healthPath">Health Check Path</Label>
                    <Input
                      id="healthPath"
                      value={newService.healthCheckPath || ''}
                      onChange={(e) => setNewService(prev => ({ ...prev, healthCheckPath: e.target.value }))}
                      placeholder="/health"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={newService.environment || 'local'}
                      onValueChange={(value) => setNewService(prev => ({ ...prev, environment: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Authentication</Label>
                  <Select
                    value={newService.authentication?.type || 'none'}
                    onValueChange={(value) => setNewService(prev => ({ 
                      ...prev, 
                      authentication: { ...prev.authentication, type: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="api-key">API Key</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newService.authentication?.type === 'bearer' && (
                  <div className="space-y-2">
                    <Label htmlFor="token">Bearer Token</Label>
                    <Input
                      id="token"
                      type="password"
                      value={newService.authentication.token || ''}
                      onChange={(e) => setNewService(prev => ({ 
                        ...prev, 
                        authentication: { ...prev.authentication, token: e.target.value }
                      }))}
                      placeholder="Enter bearer token"
                    />
                  </div>
                )}

                {newService.authentication?.type === 'api-key' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={newService.authentication.apiKey || ''}
                        onChange={(e) => setNewService(prev => ({ 
                          ...prev, 
                          authentication: { ...prev.authentication, apiKey: e.target.value }
                        }))}
                        placeholder="Enter API key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKeyHeader">Header Name</Label>
                      <Input
                        id="apiKeyHeader"
                        value={newService.authentication.apiKeyHeader || 'X-API-Key'}
                        onChange={(e) => setNewService(prev => ({ 
                          ...prev, 
                          authentication: { ...prev.authentication, apiKeyHeader: e.target.value }
                        }))}
                        placeholder="X-API-Key"
                      />
                    </div>
                  </div>
                )}

                {newService.authentication?.type === 'basic' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newService.authentication.username || ''}
                        onChange={(e) => setNewService(prev => ({ 
                          ...prev, 
                          authentication: { ...prev.authentication, username: e.target.value }
                        }))}
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newService.authentication.password || ''}
                        onChange={(e) => setNewService(prev => ({ 
                          ...prev, 
                          authentication: { ...prev.authentication, password: e.target.value }
                        }))}
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                )}

                <Button onClick={handleAddService} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider Service
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};