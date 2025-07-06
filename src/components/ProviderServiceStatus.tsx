import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Settings, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProviderServices } from '@/hooks/useProviderServices';
import { ProviderServiceSettings } from './ProviderServiceSettings';

interface ProviderServiceStatusProps {
  onStatusChange?: (service: any) => void;
}

export const ProviderServiceStatus: React.FC<ProviderServiceStatusProps> = ({ onStatusChange }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { activeService, checkServiceHealth } = useProviderServices();

  const checkStatus = async () => {
    if (!activeService) return;
    
    setIsChecking(true);
    try {
      const updatedService = await checkServiceHealth(activeService);
      onStatusChange?.(updatedService);
    } catch (error) {
      console.error('Failed to check service status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
    if (!activeService) {
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    }
    if (activeService.isHealthy) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking provider service...';
    if (!activeService) return 'No provider service configured';
    if (activeService.isHealthy) {
      return `${activeService.config.name} available`;
    }
    return `${activeService.config.name} unavailable`;
  };

  const getStatusColor = () => {
    if (isChecking) return 'text-blue-600';
    if (!activeService) return 'text-amber-600';
    if (activeService.isHealthy) return 'text-green-600';
    return 'text-red-600';
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

  return (
    <div className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-lg border border-slate-200/50">
      {getStatusIcon()}
      <div className="flex-1">
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
        {activeService && (
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs text-slate-500">
              {activeService.config.url}
            </div>
            <Badge className={`text-xs ${getEnvironmentColor(activeService.config.environment)}`}>
              {activeService.config.environment}
            </Badge>
            {activeService.lastChecked && (
              <div className="text-xs text-slate-500">
                Last checked: {activeService.lastChecked.toLocaleTimeString()}
                {activeService.responseTime && ` (${activeService.responseTime}ms)`}
              </div>
            )}
          </div>
        )}
        {activeService?.error && (
          <div className="text-xs text-red-600 mt-1">
            Error: {activeService.error}
          </div>
        )}
      </div>
      {!activeService?.isHealthy && !isChecking && activeService && (
        <div className="flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          <span>Service down</span>
        </div>
      )}
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSettings(true)}
          className="h-6 px-2 text-xs"
        >
          <Settings className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={checkStatus}
          disabled={isChecking || !activeService}
          className="h-6 px-2 text-xs"
        >
          <Globe className="h-3 w-3 mr-1" />
          Check
        </Button>
      </div>
      
      <ProviderServiceSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};