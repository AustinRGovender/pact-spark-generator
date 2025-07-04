import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dockerManager } from '@/utils/dockerManager';
import { useDockerConnections } from '@/hooks/useDockerConnections';
import { DockerSettings } from './DockerSettings';

interface DockerStatusProps {
  onStatusChange?: (available: boolean) => void;
}

export const DockerStatus: React.FC<DockerStatusProps> = ({ onStatusChange }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { activeConnection, updateConnectionStatus } = useDockerConnections();

  const checkDockerStatus = async () => {
    setIsChecking(true);
    try {
      const available = await dockerManager.checkDockerAvailability(activeConnection?.settings);
      setIsAvailable(available);
      setLastChecked(new Date());
      onStatusChange?.(available);
      
      // Update connection status
      if (activeConnection) {
        updateConnectionStatus(activeConnection.settings.id, available ? 'healthy' : 'unhealthy');
      }
    } catch (error) {
      setIsAvailable(false);
      onStatusChange?.(false);
      if (activeConnection) {
        updateConnectionStatus(activeConnection.settings.id, 'unhealthy');
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkDockerStatus();
  }, []);

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
    if (isAvailable) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking Docker availability...';
    if (isAvailable) {
      return activeConnection 
        ? `${activeConnection.settings.name} connected`
        : 'Docker available';
    }
    return activeConnection
      ? `${activeConnection.settings.name} unavailable`
      : 'Docker unavailable';
  };

  const getStatusColor = () => {
    if (isChecking) return 'text-blue-600';
    if (isAvailable) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-lg border border-slate-200/50">
      {getStatusIcon()}
      <div className="flex-1">
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
        {lastChecked && (
          <div className="text-xs text-slate-500">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}
      </div>
      {!isAvailable && !isChecking && (
        <div className="flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          <span>Simulated mode</span>
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
          onClick={checkDockerStatus}
          disabled={isChecking}
          className="h-6 px-2 text-xs"
        >
          Refresh
        </Button>
      </div>
      
      <DockerSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};