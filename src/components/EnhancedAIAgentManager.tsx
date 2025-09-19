import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { enhancedAiAgentAPI } from '@/services/enhancedAiAgentService';
import { AgentRegistry, AgentMetrics, QueueStats, AgentEvent } from '@/types/agents';
import { 
  Activity, Brain, Eye, Plane, Droplets, Wrench, BarChart3, Cloud,
  CheckCircle, AlertTriangle, Play, RefreshCw, Clock, TrendingUp
} from 'lucide-react';

export default function EnhancedAIAgentManager() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<AgentRegistry[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, metricsRes, queueRes, eventsRes] = await Promise.allSettled([
        enhancedAiAgentAPI.getAvailableAgents(),
        enhancedAiAgentAPI.getAgentMetrics(),
        enhancedAiAgentAPI.getQueueStats(),
        enhancedAiAgentAPI.getSystemEvents(20)
      ]);
      
      if (agentsRes.status === 'fulfilled') {
        setAgents(agentsRes.value.agents || []);
      }
      
      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.metrics || []);
      }
      
      if (queueRes.status === 'fulfilled') {
        setQueueStats(queueRes.value);
      }
      
      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'production': return <Eye className="h-4 w-4" />;
      case 'resources': return <Droplets className="h-4 w-4" />;
      case 'operations': return <Plane className="h-4 w-4" />;
      case 'vision': return <Brain className="h-4 w-4" />;
      case 'environment': return <Cloud className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const executeTestTask = async (agentId: string, capability: string) => {
    try {
      const result = await enhancedAiAgentAPI.submitTask({
        type: 'test_task',
        requiredCapability: capability,
        payload: { test: true, agentId, timestamp: Date.now() },
        priority: 1
      });
      
      toast({
        title: "Test Task Submitted",
        description: `Task ${result.taskId} submitted to ${agentId}`
      });
      
      // Refresh data
      setTimeout(fetchData, 1000);
    } catch (error: any) {
      console.error('Failed to execute test task:', error);
      toast({
        title: "Test Task Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runGlobalAnalysis = async () => {
    try {
      toast({
        title: "Running Global Analysis",
        description: "Submitting analysis tasks to all agents..."
      });

      const result = await enhancedAiAgentAPI.triggerAutomatedAnalysis();

      toast({
        title: "Global Analysis Completed",
        description: `Submitted ${result.submittedTasks} of ${result.totalTasks} tasks successfully`
      });
      
      // Refresh data
      setTimeout(fetchData, 1000);
    } catch (error: any) {
      toast({
        title: "Global Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Enhanced AI Agent Orchestrator
          </CardTitle>
          <CardDescription>
            Next-generation agent coordination with heartbeat monitoring and task orchestration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card border-lime-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <Activity className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-lime-400">{agents.length}</div>
                  <div className="text-xs text-gray-400">Total Agents</div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-green-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-400">
                    {agents.filter(a => a.status === 'active').length}
                  </div>
                  <div className="text-xs text-gray-400">Active Agents</div>
                </div>
              </CardContent>
            </Card>

            {queueStats && (
              <>
                <Card className="glass-card border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-400">{queueStats.running}</div>
                      <div className="text-xs text-gray-400">Running Tasks</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-400">
                        {Math.round(queueStats.avgExecutionTime)}ms
                      </div>
                      <div className="text-xs text-gray-400">Avg Time</div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No agents registered
          </div>
        ) : (
          agents.map((agent) => {
            const agentMetrics = metrics.find(m => m.agentId === agent.agentId);
            return (
              <Card key={agent.agentId} className="border-gray-700 hover:border-lime-400/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAgentIcon(agent.type)}
                      <span>{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {agent.type} • v{agent.version}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {agentMetrics && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Tasks Completed:</span>
                        <span className="text-green-400">{agentMetrics.tasksCompleted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Currently Running:</span>
                        <span className="text-blue-400">{agentMetrics.tasksRunning}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Success Rate:</span>
                        <span className="text-green-400">{(agentMetrics.successRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Time:</span>
                        <span>{Math.round(agentMetrics.avgExecutionTime)}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Failed:</span>
                        <span className="text-red-400">{agentMetrics.tasksFailed}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium mb-2">Capabilities:</div>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((cap, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cap.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedAgent(selectedAgent === agent.agentId ? null : agent.agentId)}
                    >
                      {selectedAgent === agent.agentId ? 'Hide Details' : 'View Details'}
                    </Button>
                    
                    {selectedAgent === agent.agentId && (
                      <div className="mt-2 p-3 bg-gray-800 rounded text-sm space-y-2">
                        <div><strong>Agent ID:</strong> {agent.agentId}</div>
                        <div><strong>Last Heartbeat:</strong> {agent.lastHeartbeat ? new Date(agent.lastHeartbeat).toLocaleTimeString() : 'Never'}</div>
                        <div><strong>Registered:</strong> {new Date(agent.registeredAt).toLocaleString()}</div>
                        
                        <div className="pt-2 space-y-1">
                          <div className="text-xs font-medium">Test Actions:</div>
                          {agent.capabilities.slice(0, 3).map((cap, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant="outline"
                              className="text-xs mr-2 mb-1"
                              onClick={() => executeTestTask(agent.agentId, cap.type)}
                            >
                              Test {cap.type}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Queue Statistics */}
      {queueStats && (
        <Card className="glass-card border-blue-500/30">
          <CardHeader>
            <CardTitle className="gradient-text flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Task Queue Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{queueStats.pending}</div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{queueStats.running}</div>
                <div className="text-sm text-gray-400">Running</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{queueStats.completed}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{queueStats.failed}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{Math.round(queueStats.avgExecutionTime)}ms</div>
                <div className="text-sm text-gray-400">Avg Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Actions */}
      <div className="flex gap-4 flex-wrap">
        <Button 
          onClick={runGlobalAnalysis}
          className="bg-green-600 hover:bg-green-700"
        >
          <Play className="w-4 h-4 mr-2" />
          Run Global Analysis
        </Button>

        <Button 
          variant="outline"
          onClick={async () => {
            try {
              await enhancedAiAgentAPI.healthCheck();
              toast({
                title: "System Healthy",
                description: "Enhanced AI orchestrator is operational"
              });
            } catch (error: any) {
              toast({
                title: "Health Check Failed",
                description: error.message,
                variant: "destructive"
              });
            }
          }}
          className="border-blue-500/30"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Health Check
        </Button>

        <Button 
          variant="outline"
          onClick={fetchData}
          className="border-purple-500/30"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <Card className="glass-card border-gray-500/30">
          <CardHeader>
            <CardTitle className="gradient-text flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Events ({events.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.slice(0, 10).map((event) => (
                <div key={event.eventId} className="p-2 border border-gray-700 rounded bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {event.type.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Agent: {event.agentId} {event.taskId ? `• Task: ${event.taskId}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
