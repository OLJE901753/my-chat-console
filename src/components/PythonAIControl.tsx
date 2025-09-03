import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Loader2, Play, CheckCircle, XCircle, Clock, Brain, Zap, Target, FileText, AlertTriangle } from 'lucide-react';
import { pythonAIService, PythonAIResponse, PythonAIStatus } from '../services/pythonAIService';
import { useToast } from '../hooks/use-toast';

interface PythonAIControlProps {
  className?: string;
}

export const PythonAIControl: React.FC<PythonAIControlProps> = ({ className }) => {
  const [status, setStatus] = useState<PythonAIStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PythonAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string>('daily');
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const operations = [
    { value: 'daily', label: 'Daily Operations', icon: Clock, description: 'Routine farm management tasks' },
    { value: 'crisis', label: 'Crisis Response', icon: AlertTriangle, description: 'Emergency situation handling' },
    { value: 'content', label: 'Content Creation', icon: FileText, description: 'Marketing and communications' },
    { value: 'strategic', label: 'Strategic Planning', icon: Target, description: 'Long-term farm strategy' },
    { value: 'full', label: 'Full Crew', icon: Brain, description: 'Comprehensive farm management' },
    { value: 'test', label: 'Test Mode', icon: Zap, description: 'System validation and testing' }
  ];

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const statusData = await pythonAIService.getStatus();
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to fetch Python AI status:', error);
    }
  };

  const runOperation = async () => {
    if (!selectedOperation) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let response: PythonAIResponse;

      switch (selectedOperation) {
        case 'daily':
          response = await pythonAIService.runDailyOperations({
            farm_location: customInputs.farm_location || 'Apple Orchard Farm',
            current_season: customInputs.current_season || 'Fall',
            priority_focus: customInputs.priority_focus || 'Harvest preparation'
          });
          break;
        case 'crisis':
          response = await pythonAIService.runCrisisResponse({
            emergencyType: customInputs.emergencyType || 'weather_alert',
            severity_level: customInputs.severity_level || 'high',
            farm_location: customInputs.farm_location || 'Apple Orchard Farm'
          });
          break;
        case 'content':
          response = await pythonAIService.runContentCreation({
            content_focus: customInputs.content_focus || 'Drone footage and farm operations',
            target_platforms: customInputs.target_platforms ? customInputs.target_platforms.split(',') : ['Instagram', 'TikTok', 'YouTube'],
            content_type: customInputs.content_type || 'Educational and engaging farm content'
          });
          break;
        case 'strategic':
          response = await pythonAIService.runStrategicPlanning({
            planning_horizon: customInputs.planning_horizon || '12 months',
            farm_location: customInputs.farm_location || 'Apple Orchard Farm',
            focus_areas: customInputs.focus_areas ? customInputs.focus_areas.split(',') : ['Yield optimization', 'Cost reduction', 'Market expansion']
          });
          break;
        case 'full':
          response = await pythonAIService.runFullCrew({
            farm_location: customInputs.farm_location || 'Apple Orchard Farm',
            operation_mode: customInputs.operation_mode || 'comprehensive',
            priority_level: customInputs.priority_level || 'high'
          });
          break;
        case 'test':
          response = await pythonAIService.runTest({
            test_mode: true,
            farm_location: customInputs.farm_location || 'Test Farm'
          });
          break;
        default:
          throw new Error('Invalid operation selected');
      }

      setResult(response);
      toast({
        title: "AI Operation Completed",
        description: `${operations.find(op => op.value === selectedOperation)?.label} executed successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "AI Operation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      fetchStatus(); // Refresh status
    }
  };

  const getOperationIcon = (operationValue: string) => {
    const operation = operations.find(op => op.value === operationValue);
    return operation ? operation.icon : Brain;
  };

  const getStatusBadge = () => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    
    if (status.status === 'offline') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Server Offline
        </Badge>
      );
    }
    
    return status.isRunning ? (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </Badge>
    ) : (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Ready
      </Badge>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Python AI System Status
          </CardTitle>
          <CardDescription>
            Monitor and control the CrewAI farm management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge()}
              </div>
              {status && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(status.timestamp).toLocaleString()}
                </div>
              )}
              {status?.status === 'offline' && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  <strong>Server not running!</strong> To use Python AI features, start the Node.js server:
                  <br />
                  <code className="text-xs">cd server && node src/index.js</code>
                </div>
              )}
            </div>
            <Button onClick={fetchStatus} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Operation Selection */}
      <Card>
        <CardHeader>
          <CardTitle>AI Operations</CardTitle>
          <CardDescription>
            Select and configure AI operations for farm management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operations.map((operation) => {
              const Icon = operation.icon;
              return (
                <Card
                  key={operation.value}
                  className={`cursor-pointer transition-all ${
                    selectedOperation === operation.value
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedOperation(operation.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{operation.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {operation.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Separator />

          {/* Custom Inputs */}
          <div className="space-y-4">
            <Label>Custom Parameters (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farm_location">Farm Location</Label>
                <Input
                  id="farm_location"
                  placeholder="Apple Orchard Farm"
                  value={customInputs.farm_location || ''}
                  onChange={(e) => setCustomInputs(prev => ({ ...prev, farm_location: e.target.value }))}
                />
              </div>
              {selectedOperation === 'crisis' && (
                <div className="space-y-2">
                  <Label htmlFor="emergencyType">Emergency Type</Label>
                  <Select
                    value={customInputs.emergencyType || 'weather_alert'}
                    onValueChange={(value) => setCustomInputs(prev => ({ ...prev, emergencyType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weather_alert">Weather Alert</SelectItem>
                      <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                      <SelectItem value="pest_outbreak">Pest Outbreak</SelectItem>
                      <SelectItem value="disease_detection">Disease Detection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedOperation === 'content' && (
                <div className="space-y-2">
                  <Label htmlFor="target_platforms">Target Platforms</Label>
                  <Input
                    id="target_platforms"
                    placeholder="Instagram, TikTok, YouTube"
                    value={customInputs.target_platforms || ''}
                    onChange={(e) => setCustomInputs(prev => ({ ...prev, target_platforms: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={runOperation}
            disabled={isLoading || (status?.isRunning)}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running {operations.find(op => op.value === selectedOperation)?.label}...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run {operations.find(op => op.value === selectedOperation)?.label}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {(result || error) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Operation Completed
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Operation Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Operation: {result.operation} | Completed: {new Date(result.timestamp).toLocaleString()}
                </div>
                <Textarea
                  value={result.output}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="AI operation output will appear here..."
                />
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="text-red-800 font-medium">Error:</div>
                <div className="text-red-700 text-sm mt-1">{error}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PythonAIControl;
