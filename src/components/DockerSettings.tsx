import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, TestTube2, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDockerConnections } from '@/hooks/useDockerConnections';
import { DockerConnectionSettings } from '@/types/dockerTypes';
import { dockerManager } from '@/utils/dockerManager';

interface DockerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DockerSettings: React.FC<DockerSettingsProps> = ({ isOpen, onClose }) => {
  const { connections, activeConnection, addConnection, updateConnection, removeConnection, setDefaultConnection, switchConnection, updateConnectionStatus } = useDockerConnections();
  const [editingConnection, setEditingConnection] = useState<DockerConnectionSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleNewConnection = () => {
    const newConnection: DockerConnectionSettings = {
      id: `conn-${Date.now()}`,
      name: 'New Connection',
      type: 'local',
      isDefault: false,
      config: {
        socketPath: '/var/run/docker.sock'
      }
    };
    setEditingConnection(newConnection);
    setIsEditing(true);
  };

  const handleEditConnection = (connection: DockerConnectionSettings) => {
    setEditingConnection({ ...connection });
    setIsEditing(true);
  };

  const handleSaveConnection = () => {
    if (!editingConnection) return;

    if (connections.find(c => c.settings.id === editingConnection.id)) {
      updateConnection(editingConnection.id, editingConnection);
    } else {
      addConnection(editingConnection);
    }

    setEditingConnection(null);
    setIsEditing(false);
    toast({
      title: "Connection Saved",
      description: `Docker connection "${editingConnection.name}" has been saved.`
    });
  };

  const handleTestConnection = async (connection: DockerConnectionSettings) => {
    setTestingConnection(connection.id);
    try {
      const result = await dockerManager.testConnection(connection);
      updateConnectionStatus(connection.id, result.success ? 'healthy' : 'unhealthy', result.info);
      
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.success 
          ? `Connected to Docker ${result.info?.version}` 
          : result.error,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      updateConnectionStatus(connection.id, 'unhealthy');
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const renderConnectionForm = () => {
    if (!editingConnection) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {connections.find(c => c.settings.id === editingConnection.id) ? 'Edit Connection' : 'New Connection'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="conn-name">Connection Name</Label>
              <Input
                id="conn-name"
                value={editingConnection.name}
                onChange={(e) => setEditingConnection(prev => prev ? {...prev, name: e.target.value} : null)}
              />
            </div>
            <div>
              <Label htmlFor="conn-type">Connection Type</Label>
              <Select
                value={editingConnection.type}
                onValueChange={(value: any) => setEditingConnection(prev => prev ? {...prev, type: value, config: {}} : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Docker</SelectItem>
                  <SelectItem value="remote-tcp">Remote TCP</SelectItem>
                  <SelectItem value="remote-ssh">Remote SSH</SelectItem>
                  <SelectItem value="context">Docker Context</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {editingConnection.type === 'local' && (
            <div>
              <Label htmlFor="socket-path">Socket Path</Label>
              <Input
                id="socket-path"
                value={editingConnection.config.socketPath || ''}
                onChange={(e) => setEditingConnection(prev => prev ? {
                  ...prev,
                  config: {...prev.config, socketPath: e.target.value}
                } : null)}
                placeholder="/var/run/docker.sock"
              />
            </div>
          )}

          {editingConnection.type === 'remote-tcp' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tcp-host">Host</Label>
                <Input
                  id="tcp-host"
                  value={editingConnection.config.host || ''}
                  onChange={(e) => setEditingConnection(prev => prev ? {
                    ...prev,
                    config: {...prev.config, host: e.target.value}
                  } : null)}
                  placeholder="tcp://docker.example.com"
                />
              </div>
              <div>
                <Label htmlFor="tcp-port">Port</Label>
                <Input
                  id="tcp-port"
                  type="number"
                  value={editingConnection.config.port || ''}
                  onChange={(e) => setEditingConnection(prev => prev ? {
                    ...prev,
                    config: {...prev.config, port: parseInt(e.target.value)}
                  } : null)}
                  placeholder="2376"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="tcp-tls"
                  checked={editingConnection.config.tls || false}
                  onCheckedChange={(checked) => setEditingConnection(prev => prev ? {
                    ...prev,
                    config: {...prev.config, tls: checked}
                  } : null)}
                  size="sm"
                />
                <Label htmlFor="tcp-tls">Use TLS</Label>
              </div>
            </div>
          )}

          {editingConnection.type === 'context' && (
            <div>
              <Label htmlFor="context-name">Context Name</Label>
              <Input
                id="context-name"
                value={editingConnection.config.contextName || ''}
                onChange={(e) => setEditingConnection(prev => prev ? {
                  ...prev,
                  config: {...prev.config, contextName: e.target.value}
                } : null)}
                placeholder="my-context"
              />
            </div>
          )}

          {editingConnection.type === 'custom' && (
            <div>
              <Label htmlFor="custom-config">Custom Configuration (JSON)</Label>
              <Textarea
                id="custom-config"
                value={JSON.stringify(editingConnection.config.customConfig || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const customConfig = JSON.parse(e.target.value);
                    setEditingConnection(prev => prev ? {
                      ...prev,
                      config: {...prev.config, customConfig}
                    } : null);
                  } catch {}
                }}
                placeholder='{"host": "tcp://example.com:2376"}'
                rows={6}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image-name">Image Name</Label>
              <Input
                id="image-name"
                value={editingConnection.config.imageName || ''}
                onChange={(e) => setEditingConnection(prev => prev ? {
                  ...prev,
                  config: {...prev.config, imageName: e.target.value}
                } : null)}
                placeholder="pact-test-runner"
              />
            </div>
            <div>
              <Label htmlFor="registry">Registry</Label>
              <Input
                id="registry"
                value={editingConnection.config.registry || ''}
                onChange={(e) => setEditingConnection(prev => prev ? {
                  ...prev,
                  config: {...prev.config, registry: e.target.value}
                } : null)}
                placeholder="docker.io"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveConnection}>Save Connection</Button>
            <Button variant="outline" onClick={() => { setEditingConnection(null); setIsEditing(false); }}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Docker Configuration</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <Tabs defaultValue={isEditing ? "edit" : "connections"} value={isEditing ? "edit" : "connections"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connections" onClick={() => setIsEditing(false)}>Connections</TabsTrigger>
              <TabsTrigger value="edit" disabled={!isEditing}>
                {editingConnection && connections.find(c => c.settings.id === editingConnection.id) ? 'Edit' : 'New'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="connections" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Docker Connections</h3>
                <Button onClick={handleNewConnection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              </div>
              
              <div className="grid gap-4">
                {connections.map((connection) => (
                  <Card key={connection.settings.id} className={connection.settings.id === activeConnection?.settings.id ? 'ring-2 ring-blue-500' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {connection.status === 'healthy' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {connection.status === 'unhealthy' && <XCircle className="h-4 w-4 text-red-600" />}
                            {connection.status === 'unknown' && <div className="h-4 w-4 rounded-full bg-gray-300" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{connection.settings.name}</span>
                              {connection.settings.isDefault && <Badge variant="secondary">Default</Badge>}
                              {connection.settings.id === activeConnection?.settings.id && <Badge>Active</Badge>}
                            </div>
                            <div className="text-sm text-gray-600">
                              {connection.settings.type} • {connection.settings.config.host || connection.settings.config.socketPath || connection.settings.config.contextName}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestConnection(connection.settings)}
                            disabled={testingConnection === connection.settings.id}
                          >
                            <TestTube2 className="h-3 w-3 mr-1" />
                            {testingConnection === connection.settings.id ? 'Testing...' : 'Test'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditConnection(connection.settings)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => switchConnection(connection.settings.id)}
                            disabled={connection.settings.id === activeConnection?.settings.id}
                          >
                            Use
                          </Button>
                          {connection.settings.id !== 'default-local' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeConnection(connection.settings.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="edit">
              {renderConnectionForm()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};