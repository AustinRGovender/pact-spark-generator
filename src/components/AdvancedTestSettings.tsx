import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChevronDown, ChevronRight, Info, RotateCcw, Zap, Settings, Network, Timer, Bug, Play, Globe } from 'lucide-react';
import { 
  AdvancedTestConfig, 
  DEFAULT_ADVANCED_CONFIG, 
  TEST_CONFIG_PRESETS, 
  LogLevel, 
  LogFormat, 
  BackoffStrategy 
} from '../types/testConfigTypes';

interface AdvancedTestSettingsProps {
  config: AdvancedTestConfig;
  onChange: (config: AdvancedTestConfig) => void;
  className?: string;
}

export const AdvancedTestSettings: React.FC<AdvancedTestSettingsProps> = ({ 
  config, 
  onChange, 
  className 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['timeouts']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateConfig = (updates: Partial<AdvancedTestConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateTimeouts = (updates: Partial<AdvancedTestConfig['timeouts']>) => {
    updateConfig({ timeouts: { ...config.timeouts, ...updates } });
  };

  const updateLogging = (updates: Partial<AdvancedTestConfig['logging']>) => {
    updateConfig({ logging: { ...config.logging, ...updates } });
  };

  const updateNetwork = (updates: Partial<AdvancedTestConfig['network']>) => {
    updateConfig({ network: { ...config.network, ...updates } });
  };

  const updateRetry = (updates: Partial<AdvancedTestConfig['retry']>) => {
    updateConfig({ retry: { ...config.retry, ...updates } });
  };

  const updateExecution = (updates: Partial<AdvancedTestConfig['execution']>) => {
    updateConfig({ execution: { ...config.execution, ...updates } });
  };

  const updateEnvironment = (updates: Partial<AdvancedTestConfig['environment']>) => {
    updateConfig({ environment: { ...config.environment, ...updates } });
  };

  const applyPreset = (presetConfig: Partial<AdvancedTestConfig>) => {
    const mergedConfig = { ...config };
    Object.keys(presetConfig).forEach(key => {
      const typedKey = key as keyof AdvancedTestConfig;
      if (presetConfig[typedKey]) {
        (mergedConfig as any)[typedKey] = { ...mergedConfig[typedKey], ...presetConfig[typedKey] };
      }
    });
    onChange(mergedConfig);
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_ADVANCED_CONFIG);
  };

  const formatTime = (ms: number) => {
    if (ms >= 60000) return `${ms / 60000}m`;
    if (ms >= 1000) return `${ms / 1000}s`;
    return `${ms}ms`;
  };

  const addHeader = () => {
    const key = prompt('Header name:');
    const value = prompt('Header value:');
    if (key && value) {
      updateNetwork({
        defaultHeaders: { ...config.network.defaultHeaders, [key]: value }
      });
    }
  };

  const removeHeader = (key: string) => {
    const headers = { ...config.network.defaultHeaders };
    delete headers[key];
    updateNetwork({ defaultHeaders: headers });
  };

  const addEnvironmentVariable = () => {
    const key = prompt('Variable name:');
    const value = prompt('Variable value:');
    if (key && value) {
      updateEnvironment({
        variables: { ...config.environment.variables, [key]: value }
      });
    }
  };

  const removeEnvironmentVariable = (key: string) => {
    const variables = { ...config.environment.variables };
    delete variables[key];
    updateEnvironment({ variables });
  };

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* Presets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Configuration Presets
                </CardTitle>
                <CardDescription>Quick settings for common scenarios</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TEST_CONFIG_PRESETS.map((preset) => (
                <Card key={preset.name} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4" onClick={() => applyPreset(preset.config)}>
                    <div className="text-sm font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {preset.description}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeouts */}
        <Card>
          <Collapsible open={expandedSections.has('timeouts')} onOpenChange={() => toggleSection('timeouts')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    <CardTitle>Timeouts</CardTitle>
                    {expandedSections.has('timeouts') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  <Badge variant="secondary">
                    Request: {formatTime(config.timeouts.request)}
                  </Badge>
                </div>
                <CardDescription>Configure timeout values for different operations</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="request-timeout">Request Timeout</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Maximum time to wait for HTTP request completion
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2">
                      <Slider
                        value={[config.timeouts.request]}
                        onValueChange={([value]) => updateTimeouts({ request: value })}
                        max={120000}
                        min={1000}
                        step={1000}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground text-center">
                        {formatTime(config.timeouts.request)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="response-timeout">Response Timeout</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Maximum time to wait for response processing
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2">
                      <Slider
                        value={[config.timeouts.response]}
                        onValueChange={([value]) => updateTimeouts({ response: value })}
                        max={60000}
                        min={1000}
                        step={500}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground text-center">
                        {formatTime(config.timeouts.response)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="test-timeout">Test Timeout</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Maximum time for a single test to complete
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2">
                      <Slider
                        value={[config.timeouts.test]}
                        onValueChange={([value]) => updateTimeouts({ test: value })}
                        max={300000}
                        min={5000}
                        step={5000}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground text-center">
                        {formatTime(config.timeouts.test)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="suite-timeout">Suite Timeout</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Maximum time for entire test suite to complete
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2">
                      <Slider
                        value={[config.timeouts.suite]}
                        onValueChange={([value]) => updateTimeouts({ suite: value })}
                        max={1800000}
                        min={30000}
                        step={30000}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground text-center">
                        {formatTime(config.timeouts.suite)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Logging */}
        <Card>
          <Collapsible open={expandedSections.has('logging')} onOpenChange={() => toggleSection('logging')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    <CardTitle>Logging</CardTitle>
                    {expandedSections.has('logging') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  <Badge variant="secondary">
                    {config.logging.level.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>Configure logging verbosity and output options</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="log-level">Log Level</Label>
                    <Select
                      value={config.logging.level}
                      onValueChange={(value: LogLevel) => updateLogging({ level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="trace">Trace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="log-format">Log Format</Label>
                    <Select
                      value={config.logging.format}
                      onValueChange={(value: LogFormat) => updateLogging({ format: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="structured">Structured</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Console Output</Label>
                      <p className="text-sm text-muted-foreground">Enable logging to console</p>
                    </div>
                    <Switch
                      checked={config.logging.enableConsole}
                      onCheckedChange={(checked) => updateLogging({ enableConsole: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>File Output</Label>
                      <p className="text-sm text-muted-foreground">Enable logging to file</p>
                    </div>
                    <Switch
                      checked={config.logging.enableFile}
                      onCheckedChange={(checked) => updateLogging({ enableFile: checked })}
                    />
                  </div>
                  {config.logging.enableFile && (
                    <div className="space-y-2">
                      <Label htmlFor="log-file">Log File Path</Label>
                      <Input
                        id="log-file"
                        value={config.logging.filePath || ''}
                        onChange={(e) => updateLogging({ filePath: e.target.value })}
                        placeholder="test-logs.log"
                      />
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Include Request Body</Label>
                      <Switch
                        checked={config.logging.includeRequestBody}
                        onCheckedChange={(checked) => updateLogging({ includeRequestBody: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Include Response Body</Label>
                      <Switch
                        checked={config.logging.includeResponseBody}
                        onCheckedChange={(checked) => updateLogging({ includeResponseBody: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Include Headers</Label>
                      <Switch
                        checked={config.logging.includeHeaders}
                        onCheckedChange={(checked) => updateLogging({ includeHeaders: checked })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Network */}
        <Card>
          <Collapsible open={expandedSections.has('network')} onOpenChange={() => toggleSection('network')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    <CardTitle>Network</CardTitle>
                    {expandedSections.has('network') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  <Badge variant="secondary">
                    Port: {config.network.customPort || 'Default'}
                  </Badge>
                </div>
                <CardDescription>Configure network settings and custom headers</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-port">Custom Port</Label>
                    <Input
                      id="custom-port"
                      type="number"
                      value={config.network.customPort || ''}
                      onChange={(e) => updateNetwork({ customPort: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="8080"
                      min="1"
                      max="65535"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base-url">Base URL</Label>
                    <Input
                      id="base-url"
                      value={config.network.baseUrl || ''}
                      onChange={(e) => updateNetwork({ baseUrl: e.target.value })}
                      placeholder="http://localhost:3000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Default Headers</Label>
                    <Button variant="outline" size="sm" onClick={addHeader}>
                      Add Header
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(config.network.defaultHeaders).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Input value={key} readOnly className="flex-1" />
                        <Input value={value} readOnly className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeHeader(key)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Keep Alive</Label>
                      <p className="text-sm text-muted-foreground">Enable HTTP keep-alive connections</p>
                    </div>
                    <Switch
                      checked={config.network.keepAlive}
                      onCheckedChange={(checked) => updateNetwork({ keepAlive: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Max Connections</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Maximum number of concurrent connections
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider
                      value={[config.network.maxConnections]}
                      onValueChange={([value]) => updateNetwork({ maxConnections: value })}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      {config.network.maxConnections} connections
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Retry & Execution combined */}
        <Tabs defaultValue="retry" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="retry" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Retry
            </TabsTrigger>
            <TabsTrigger value="execution" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Execution
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="retry">
            <Card>
              <CardHeader>
                <CardTitle>Retry Configuration</CardTitle>
                <CardDescription>Configure retry behavior for failed requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Retry</Label>
                    <p className="text-sm text-muted-foreground">Automatically retry failed requests</p>
                  </div>
                  <Switch
                    checked={config.retry.enabled}
                    onCheckedChange={(checked) => updateRetry({ enabled: checked })}
                  />
                </div>
                {config.retry.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Attempts</Label>
                        <Slider
                          value={[config.retry.maxAttempts]}
                          onValueChange={([value]) => updateRetry({ maxAttempts: value })}
                          max={10}
                          min={1}
                          step={1}
                        />
                        <div className="text-sm text-muted-foreground text-center">
                          {config.retry.maxAttempts} attempts
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Backoff Strategy</Label>
                        <Select
                          value={config.retry.backoffStrategy}
                          onValueChange={(value: BackoffStrategy) => updateRetry({ backoffStrategy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="exponential">Exponential</SelectItem>
                            <SelectItem value="linear">Linear</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Base Delay (ms)</Label>
                      <Slider
                        value={[config.retry.baseDelay]}
                        onValueChange={([value]) => updateRetry({ baseDelay: value })}
                        max={10000}
                        min={100}
                        step={100}
                      />
                      <div className="text-sm text-muted-foreground text-center">
                        {config.retry.baseDelay}ms
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Retry on Timeout</Label>
                        <Switch
                          checked={config.retry.retryOnTimeout}
                          onCheckedChange={(checked) => updateRetry({ retryOnTimeout: checked })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="execution">
            <Card>
              <CardHeader>
                <CardTitle>Execution Configuration</CardTitle>
                <CardDescription>Configure how tests are executed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Parallel Execution</Label>
                      <p className="text-sm text-muted-foreground">Run tests in parallel</p>
                    </div>
                    <Switch
                      checked={config.execution.parallel}
                      onCheckedChange={(checked) => updateExecution({ parallel: checked })}
                    />
                  </div>
                  {config.execution.parallel && (
                    <div className="space-y-2">
                      <Label>Max Concurrency</Label>
                      <Slider
                        value={[config.execution.maxConcurrency]}
                        onValueChange={([value]) => updateExecution({ maxConcurrency: value })}
                        max={20}
                        min={1}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground text-center">
                        {config.execution.maxConcurrency} concurrent tests
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Random Order</Label>
                      <p className="text-sm text-muted-foreground">Execute tests in random order</p>
                    </div>
                    <Switch
                      checked={config.execution.randomOrder}
                      onCheckedChange={(checked) => updateExecution({ randomOrder: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Stop on First Failure</Label>
                      <p className="text-sm text-muted-foreground">Stop execution when first test fails</p>
                    </div>
                    <Switch
                      checked={config.execution.stopOnFirstFailure}
                      onCheckedChange={(checked) => updateExecution({ stopOnFirstFailure: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Verbose Output</Label>
                      <p className="text-sm text-muted-foreground">Enable detailed test output</p>
                    </div>
                    <Switch
                      checked={config.execution.verbose}
                      onCheckedChange={(checked) => updateExecution({ verbose: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Environment */}
        <Card>
          <Collapsible open={expandedSections.has('environment')} onOpenChange={() => toggleSection('environment')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <CardTitle>Environment</CardTitle>
                    {expandedSections.has('environment') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  <Badge variant="secondary">
                    {Object.keys(config.environment.variables).length} vars
                  </Badge>
                </div>
                <CardDescription>Configure environment variables and settings</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Environment Variables</Label>
                    <Button variant="outline" size="sm" onClick={addEnvironmentVariable}>
                      Add Variable
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(config.environment.variables).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Input value={key} readOnly className="flex-1" />
                        <Input value={value} readOnly className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeEnvironmentVariable(key)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="config-file">Config File Path</Label>
                  <Input
                    id="config-file"
                    value={config.environment.configFile || ''}
                    onChange={(e) => updateEnvironment({ configFile: e.target.value })}
                    placeholder=".env"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile">Profile</Label>
                  <Input
                    id="profile"
                    value={config.environment.profile || ''}
                    onChange={(e) => updateEnvironment({ profile: e.target.value })}
                    placeholder="development"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Load from System</Label>
                    <p className="text-sm text-muted-foreground">Load environment variables from system</p>
                  </div>
                  <Switch
                    checked={config.environment.loadFromSystem}
                    onCheckedChange={(checked) => updateEnvironment({ loadFromSystem: checked })}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </TooltipProvider>
  );
};