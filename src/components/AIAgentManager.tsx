import React, { useState, useEffect } from 'react';
import { aiAgentAPI } from '@/services/aiAgentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Eye, 
  Droplets, 
  Wrench, 
  BarChart3, 
  Cloud, 
  Camera, 
  Cpu, 
  Play, 
  Pause, 
  Square,
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  RefreshCw,
  AlertCircle,
  PhoneCall,
  MessageSquare,
  Users,
  Network,
  Workflow,
  GitBranch,
  Library,
  Plus,
  Download,
  Route
} from 'lucide-react';

interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'training' | 'error';
  enabled: boolean;
  performance: {
    accuracy: number;
    efficiency: number;
    uptime: number;
    tasksCompleted: number;
    lastActive: string;
  };
  capabilities: string[];
  permissions: {
    readSensorData: boolean;
    controlDrones: boolean;
    modifySettings: boolean;
    sendAlerts: boolean;
  };
  configuration: {
    sensitivity: number;
    updateFrequency: number;
    alertThreshold: number;
  };
  metrics: {
    dailyTasks: number;
    weeklyTasks: number;
    successRate: number;
    avgResponseTime: number;
  };
  recentAlerts: Array<{
    id: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
}

// New interfaces for enhanced collaboration
export interface CrewCollaboration {
  id: string;
  title: string;
  agents: string[];
  status: 'planning' | 'active' | 'paused' | 'completed';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date;
  estimatedDuration: number;
  activeCollaborations: number;
  tasksInProgress: number;
  knowledgeSharing: number;
  collaborations: Collaboration[];
}

export interface Collaboration {
  id: string;
  title: string;
  agents: string[];
  status: string;
  progress: number;
  priority: string;
}

export interface AgentMemory {
  agentId: string;
  agentName: string;
  specialization: string;
  experiencePoints: number;
  memorySize: number;
  lastUpdated: Date;
}

export interface CollaborationLog {
  id: string;
  title: string;
  agents: string[];
  type: 'insight' | 'collaboration' | 'learning';
  timestamp: Date;
  details: string;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  status: string;
  lastExecuted: Date;
  successRate: number;
}

const AIAgentManager: React.FC = () => {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Enhanced collaboration state
  const [crewCollaboration, setCrewCollaboration] = useState<CrewCollaboration[]>([]);
  const [agentMemory, setAgentMemory] = useState<AgentMemory[]>([]);
  const [collaborationLogs, setCollaborationLogs] = useState<CollaborationLog[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus[]>([]);
  const [newCollaboration, setNewCollaboration] = useState<Partial<CrewCollaboration>>({
    title: '',
    agents: [],
    priority: 'medium',
    estimatedDuration: 60
  });
  const [showCollaborationForm, setShowCollaborationForm] = useState(false);

  // Workflow template state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState<any>({});
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [runningWorkflows, setRunningWorkflows] = useState<string[]>([]);

  const [agents, setAgents] = useState<AIAgent[]>([
    {
      id: 'crop-health-monitor',
      name: 'Crop Health Monitor',
      description: 'AI-powered crop disease and pest detection from drone imagery',
      category: 'Production',
      icon: <Eye className="w-5 h-5" />,
      status: 'inactive',
      enabled: false,
      performance: {
        accuracy: 94.2,
        efficiency: 87.5,
        uptime: 99.1,
        tasksCompleted: 0,
        lastActive: 'Never'
      },
      capabilities: [
        'Disease Detection (Apple Scab, Fire Blight)',
        'Pest Identification (Aphids, Scale Insects)', 
        'Growth Stage Analysis',
        'Yield Prediction (±5% accuracy)',
        'Quality Assessment (Size, Color, Defects)'
      ],
      permissions: {
        readSensorData: true,
        controlDrones: false,
        modifySettings: false,
        sendAlerts: true
      },
      configuration: {
        sensitivity: 85,
        updateFrequency: 60,
        alertThreshold: 75
      },
      metrics: {
        dailyTasks: 0,
        weeklyTasks: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      recentAlerts: []
    },
    {
      id: 'irrigation-optimizer',
      name: 'Irrigation Optimizer',
      description: 'Smart water management based on soil sensors and weather data',
      category: 'Resources',
      icon: <Droplets className="w-5 h-5" />,
      status: 'inactive',
      enabled: false,
      performance: {
        accuracy: 91.8,
        efficiency: 92.3,
        uptime: 98.7,
        tasksCompleted: 0,
        lastActive: 'Never'
      },
      capabilities: [
        'Soil Moisture Analysis (NPK, pH, EC integration)',
        'Weather-based Scheduling',
        'Water Usage Optimization (30% reduction)',
        'Energy Cost Reduction (Solar timing)',
        'Root Zone Mapping'
      ],
      permissions: {
        readSensorData: true,
        controlDrones: false,
        modifySettings: true,
        sendAlerts: true
      },
      configuration: {
        sensitivity: 70,
        updateFrequency: 15,
        alertThreshold: 60
      },
      metrics: {
        dailyTasks: 0,
        weeklyTasks: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      recentAlerts: []
    },
    {
      id: 'predictive-maintenance',
      name: 'Predictive Maintenance',
      description: 'Equipment monitoring and failure prediction system',
      category: 'Operations',
      icon: <Wrench className="w-5 h-5" />,
      status: 'inactive',
      enabled: false,
      performance: {
        accuracy: 89.5,
        efficiency: 95.1,
        uptime: 99.8,
        tasksCompleted: 0,
        lastActive: 'Never'
      },
      capabilities: [
        'Drone Battery Health Monitoring',
        'Motor Wear Analysis',
        'Sensor Calibration Tracking',
        'Failure Prediction (7-30 days ahead)',
        'Maintenance Cost Optimization'
      ],
      permissions: {
        readSensorData: true,
        controlDrones: false,
        modifySettings: false,
        sendAlerts: true
      },
      configuration: {
        sensitivity: 80,
        updateFrequency: 30,
        alertThreshold: 70
      },
      metrics: {
        dailyTasks: 0,
        weeklyTasks: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      recentAlerts: []
    },
    {
      id: 'farm-analytics',
      name: 'Farm Analytics',
      description: 'Pattern recognition and insights from historical farm data',
      category: 'Intelligence',
      icon: <BarChart3 className="w-5 h-5" />,
      status: 'inactive',
      enabled: false,
      performance: {
        accuracy: 96.3,
        efficiency: 88.7,
        uptime: 99.5,
        tasksCompleted: 0,
        lastActive: 'Never'
      },
      capabilities: [
        'Seasonal Trend Analysis',
        'Yield Forecasting (Next 3 months)',
        'Resource Optimization Reports',
        'Market Intelligence Integration',
        'ROI Analysis & Recommendations'
      ],
      permissions: {
        readSensorData: true,
        controlDrones: false,
        modifySettings: false,
        sendAlerts: false
      },
      configuration: {
        sensitivity: 75,
        updateFrequency: 120,
        alertThreshold: 80
      },
      metrics: {
        dailyTasks: 0,
        weeklyTasks: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      recentAlerts: []
    },
    {
      id: 'weather-intelligence',
      name: 'Weather Intelligence',
      description: 'Microclimate prediction and agricultural risk assessment',
      category: 'Environment',
      icon: <Cloud className="w-5 h-5" />,
      status: 'inactive',
      enabled: false,
      performance: {
        accuracy: 92.1,
        efficiency: 90.4,
        uptime: 98.9,
        tasksCompleted: 0,
        lastActive: 'Never'
      },
      capabilities: [
        'Hyper-local Weather Forecasting',
        'Frost Warning System (6-hour advance)',
        'Optimal Spray Condition Alerts',
        'Work Window Optimization',
        'Disease Risk Prediction'
      ],
      permissions: {
        readSensorData: true,
        controlDrones: false,
        modifySettings: false,
        sendAlerts: true
      },
      configuration: {
        sensitivity: 90,
        updateFrequency: 10,
        alertThreshold: 85
      },
      metrics: {
        dailyTasks: 0,
        weeklyTasks: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      recentAlerts: []
    },
    {
      id: 'computer-vision',
      name: 'Computer Vision',
      description: 'Advanced image analysis for fruit counting and quality assessment',
      category: 'Vision',
      icon: <Camera className="w-5 h-5" />,
      status: 'inactive',
      enabled: false,
      performance: {
        accuracy: 97.8,
        efficiency: 85.2,
        uptime: 99.3,
        tasksCompleted: 0,
        lastActive: 'Never'
      },
      capabilities: [
        'Automated Fruit Counting',
        'Quality Grading (A/B/C grades)',
        'Maturity Assessment (3-stage)',
        'Defect Detection (8 types)',
        'Size Estimation (±2mm accuracy)'
      ],
      permissions: {
        readSensorData: false,
        controlDrones: false,
        modifySettings: false,
        sendAlerts: true
      },
      configuration: {
        sensitivity: 95,
        updateFrequency: 5,
        alertThreshold: 90
      },
      metrics: {
        dailyTasks: 0,
        weeklyTasks: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      recentAlerts: []
    },
    {
      id: 'drone-pilot-ai',
      name: 'Drone Pilot AI',
      description: 'Autonomous drone flight planning, execution, and safety management',
      category: 'Operations',
      icon: <Cpu className="w-5 h-5" />,
      status: 'inactive',
      enabled: false,
      performance: {
        accuracy: 98.7,
        efficiency: 94.2,
        uptime: 99.8,
        tasksCompleted: 0,
        lastActive: 'Never'
      },
      capabilities: [
        'Autonomous Mission Planning',
        'Real-time Obstacle Avoidance',
        'Weather-based Flight Decisions',
        'Emergency Procedures & RTH',
        'Multi-drone Fleet Coordination'
      ],
      permissions: {
        readSensorData: true,
        controlDrones: true,
        modifySettings: true,
        sendAlerts: true
      },
      configuration: {
        sensitivity: 95,
        updateFrequency: 1,
        alertThreshold: 90
      },
      metrics: {
        dailyTasks: 0,
        weeklyTasks: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      recentAlerts: []
    },
    {
      id: 'content-creation-agent',
      name: 'Content Creation Agent',
      description: 'Automated drone footage capture and content management for marketing',
      category: 'Marketing',
      icon: <Camera className="w-5 h-5" />,
      status: 'inactive',
      enabled: false,
      performance: {
        accuracy: 96.3,
        efficiency: 89.7,
        uptime: 98.9,
        tasksCompleted: 0,
        lastActive: 'Never'
      },
      capabilities: [
        'Cinematic Flight Path Planning',
        'Automatic Photo/Video Capture',
        'Content Quality Assessment',
        'Multi-angle Shot Planning',
        'Social Media Optimization',
        'Trend Analysis & Viral Content Prediction',
        'Multi-Platform Content Generation',
        'Hashtag Optimization & Engagement Prediction',
        'Optimal Posting Time Recommendations',
        'Content Performance Analytics & A/B Testing'
      ],
      permissions: {
        readSensorData: false,
        controlDrones: true,
        modifySettings: false,
        sendAlerts: true
      },
      configuration: {
        sensitivity: 88,
        updateFrequency: 30,
        alertThreshold: 80
      },
      metrics: {
        dailyTasks: 0,
        weeklyTasks: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      recentAlerts: []
    },
    {
      id: 'customer-service-agent',
      name: 'Customer Service AI',
      description: 'Virtual assistant for phone calls, emails, and website customer interactions',
      category: 'Customer Service',
      icon: <PhoneCall className="w-5 h-5" />,
      status: 'inactive',
      enabled: false,
      performance: {
        accuracy: 94.8,
        efficiency: 91.2,
        uptime: 99.7,
        tasksCompleted: 0,
        lastActive: 'Never'
      },
      capabilities: [
        'Automatic Phone Call Answering',
        'Email Response Generation & Processing',
        'Website Chat Support & Lead Qualification',
        'Multi-language Customer Communication',
        'Customer Satisfaction Tracking & Analytics'
      ],
      permissions: {
        readSensorData: false,
        controlDrones: false,
        modifySettings: false,
        sendAlerts: true
      },
      configuration: {
        sensitivity: 85,
        updateFrequency: 5,
        alertThreshold: 80
      },
      metrics: {
        dailyTasks: 0,
        weeklyTasks: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      recentAlerts: []
    }
  ]);

  // Load real agent metrics and simulate performance updates
  useEffect(() => {
    const updateAgentMetrics = async () => {
      try {
        const status = await aiAgentAPI.getAgentStatus();
        
        setAgents(prev => prev.map(agent => {
          const agentStatus = status[agent.id];
          if (agentStatus && agent.enabled) {
            return {
              ...agent,
              metrics: {
                ...agent.metrics,
                dailyTasks: agentStatus.total_tasks || agent.metrics.dailyTasks,
                successRate: agentStatus.success_rate || agent.metrics.successRate,
                avgResponseTime: agentStatus.avg_execution_time || agent.metrics.avgResponseTime
              },
              performance: {
                ...agent.performance,
                lastActive: agentStatus.last_update || agent.performance.lastActive
              }
            };
          }
          return agent;
        }));
      } catch (error) {
        console.error('Failed to update agent metrics:', error);
      }
    };

    // Initial load
    updateAgentMetrics();

    // Simulate ongoing updates for active agents
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (agent.enabled && agent.status === 'active') {
          const newTasksCompleted = agent.performance.tasksCompleted + Math.floor(Math.random() * 3);
          const newDailyTasks = agent.metrics.dailyTasks + Math.floor(Math.random() * 2);
          
          return {
            ...agent,
            performance: {
              ...agent.performance,
              tasksCompleted: newTasksCompleted,
              lastActive: new Date().toISOString()
            },
            metrics: {
              ...agent.metrics,
              dailyTasks: newDailyTasks,
              successRate: Math.min(100, agent.metrics.successRate + Math.random() * 2),
              avgResponseTime: Math.max(100, agent.metrics.avgResponseTime - Math.random() * 10)
            }
          };
        }
        return agent;
      }));

      // Refresh real metrics every 5 minutes
      if (Date.now() % 300000 < 30000) {
        updateAgentMetrics();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        const newEnabled = !agent.enabled;
        const newStatus = newEnabled ? 'active' : 'inactive';
        
        // Simulate initialization time for new agents
        if (newEnabled) {
          setTimeout(() => {
            setAgents(current => current.map(a => 
              a.id === agentId 
                ? { 
                    ...a, 
                    status: 'active' as const,
                    metrics: {
                      ...a.metrics,
                      avgResponseTime: 150 + Math.random() * 100
                    }
                  }
                : a
            ));
          }, 2000);
        }
        
        toast({
          title: newEnabled ? "Agent Activated" : "Agent Deactivated",
          description: `${agent.name} has been ${newEnabled ? 'enabled' : 'disabled'}`,
        });

        return {
          ...agent,
          enabled: newEnabled,
          status: newEnabled ? 'training' : newStatus,
          performance: {
            ...agent.performance,
            lastActive: newEnabled ? new Date().toISOString() : agent.performance.lastActive
          }
        };
      }
      return agent;
    }));
  };

  const updateAgentConfig = (agentId: string, config: Partial<AIAgent['configuration']>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, configuration: { ...agent.configuration, ...config } }
        : agent
    ));
  };

  const updateAgentPermissions = (agentId: string, permissions: Partial<AIAgent['permissions']>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, permissions: { ...agent.permissions, ...permissions } }
        : agent
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'training': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Production': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Resources': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Operations': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Intelligence': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Environment': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Vision': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'Marketing': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'Customer Service': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const selectedAgentData = agents.find(agent => agent.id === selectedAgent);

  const activeAgentsCount = agents.filter(agent => agent.enabled).length;
  const totalTasksToday = agents.reduce((sum, agent) => sum + agent.metrics.dailyTasks, 0);
  const avgSuccessRate = agents.length > 0 
    ? agents.reduce((sum, agent) => sum + agent.metrics.successRate, 0) / agents.length 
    : 0;

  // Enhanced collaboration functions
  const initiateCrewCollaboration = async () => {
    try {
      // Validate required fields
      if (!newCollaboration.title || newCollaboration.title.trim() === '') {
        toast({
          title: "Validation Error",
          description: "Please enter a collaboration title.",
          variant: "destructive",
        });
        return;
      }

      if (!newCollaboration.agents || newCollaboration.agents.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one agent for collaboration.",
          variant: "destructive",
        });
        return;
      }

      const collaborationData = {
        title: newCollaboration.title.trim(),
        agents: newCollaboration.agents,
        priority: newCollaboration.priority || 'medium',
        estimatedDuration: newCollaboration.estimatedDuration || 60
      };
      
      const response = await aiAgentAPI.initiateCrewCollaboration(collaborationData);
      if ((response as any).success) {
        setCrewCollaboration(prev => [...prev, (response as any).collaboration]);
        setNewCollaboration({
          title: '',
          agents: [],
          priority: 'medium',
          estimatedDuration: 60
        });
        setShowCollaborationForm(false);
        toast({
          title: "Collaboration Started",
          description: "New crew collaboration has been initiated successfully.",
        });
      }
    } catch (error) {
      console.error('Error starting collaboration:', error);
      toast({
        title: "Error",
        description: "Failed to start collaboration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const viewCollaborationDetails = (collaborationId: string) => {
    // Implementation for viewing collaboration details
    console.log('Viewing collaboration:', collaborationId);
  };

  const pauseCollaboration = async (collaborationId: string) => {
    // Implementation for pausing collaboration
    console.log('Pausing collaboration:', collaborationId);
  };

  const calculateLearningRate = (agentId: string) => {
    const agent = agentMemory.find(a => a.agentId === agentId);
    if (!agent) return 0;
    // Simple learning rate calculation based on experience points
    return Math.min(agent.experiencePoints / 100, 1);
  };

  // Workflow template functions
  const runWorkflowTemplate = async (templateName: string) => {
    try {
      // Add to running workflows
      setRunningWorkflows(prev => [...prev, templateName]);
      
      // Simulate workflow execution
      toast({
        title: "Workflow Started",
        description: `${templateName} workflow has been initiated successfully.`,
      });

      // Simulate workflow completion after a delay
      setTimeout(() => {
        setRunningWorkflows(prev => prev.filter(wf => wf !== templateName));
        toast({
          title: "Workflow Completed",
          description: `${templateName} workflow has completed successfully.`,
        });
      }, 5000);

    } catch (error) {
      console.error('Error running workflow:', error);
      toast({
        title: "Error",
        description: `Failed to run ${templateName} workflow. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const configureWorkflowTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    setIsConfiguring(true);
    
    // Set default configuration based on template
    const defaultConfig = {
      'Daily Operations': {
        weatherCheckInterval: 60,
        irrigationThreshold: 0.3,
        agents: ['Weather Intelligence', 'Irrigation Engineer']
      },
      'Crop Health Assessment': {
        droneAltitude: 50,
        imageQuality: 'high',
        analysisDepth: 'comprehensive',
        agents: ['Drone Pilot AI', 'Computer Vision', 'Crop Health Specialist']
      },
      'Crisis Response': {
        responseTime: 5,
        escalationLevel: 'high',
        notificationChannels: ['email', 'sms', 'dashboard'],
        agents: ['Farm Manager', 'Irrigation Engineer', 'Predictive Maintenance']
      },
      'Content Creation': {
        postFrequency: 'daily',
        platforms: ['instagram', 'youtube', 'tiktok'],
        contentTypes: ['drone_footage', 'farm_updates', 'educational'],
        agents: ['Content Creation Agent', 'Drone Pilot AI']
      },
      'Data Analysis': {
        reportFrequency: 'weekly',
        dataSources: ['sensors', 'drones', 'weather', 'equipment'],
        analysisTypes: ['trends', 'predictions', 'optimization'],
        agents: ['Farm Analytics', 'Computer Vision', 'Predictive Maintenance']
      }
    };

    setWorkflowConfig(defaultConfig[templateName as keyof typeof defaultConfig] || {});
  };

  const saveWorkflowConfiguration = () => {
    if (selectedTemplate && workflowConfig) {
      toast({
        title: "Configuration Saved",
        description: `${selectedTemplate} workflow configuration has been updated.`,
      });
      setIsConfiguring(false);
      setSelectedTemplate(null);
      setWorkflowConfig({});
    }
  };

  const cancelWorkflowConfiguration = () => {
    setIsConfiguring(false);
    setSelectedTemplate(null);
    setWorkflowConfig({});
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Agent Management System
          </CardTitle>
          <CardDescription>
            Manage and monitor AI agents for automated farm operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="glass-card border-lime-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <Activity className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-lime-400">{activeAgentsCount}</div>
                  <div className="text-xs text-gray-400">Active Agents</div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-lime-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-lime-400">{totalTasksToday}</div>
                  <div className="text-xs text-gray-400">Tasks Today</div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-lime-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-lime-400">{avgSuccessRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Avg Success Rate</div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-lime-500/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <Shield className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-lime-400">99.2%</div>
                  <div className="text-xs text-gray-400">System Uptime</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="crew">Crew</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="memory">Memory</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card 
                key={agent.id} 
                className={`glass-card border-lime-500/30 cursor-pointer transition-all hover:border-lime-400/50 ${
                  selectedAgent === agent.id ? 'ring-2 ring-lime-400/50' : ''
                }`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {agent.icon}
                      <Badge variant="outline" className={getCategoryColor(agent.category)}>
                        {agent.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      {getStatusIcon(agent.status)}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Enabled</span>
                      <Switch 
                        checked={agent.enabled}
                        onCheckedChange={() => toggleAgent(agent.id)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Performance</span>
                        <span>{agent.performance.accuracy}%</span>
                      </div>
                      <Progress value={agent.performance.accuracy} className="h-1" />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Tasks: {agent.metrics.dailyTasks}/day</span>
                      <span>Success: {agent.metrics.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Global Actions */}
          <div className="flex gap-4 mt-6">
            <Button 
              onClick={async () => {
                try {
                  toast({
                    title: "Running Global Test",
                    description: "Testing all active AI agents..."
                  });

                  const result = await aiAgentAPI.triggerAutomatedAnalysis();
                  
                  toast({
                    title: "Global Test Completed",
                    description: `Triggered ${Object.keys((result as any).analyses || {}).length} agent analyses`
                  });
                } catch (error) {
                  toast({
                    title: "Global Test Failed",
                    description: "Failed to trigger automated analysis"
                  });
                  console.error('Global test failed:', error);
                }
              }}
              className="bg-lime-600 hover:bg-lime-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Run All Active Agents
            </Button>

            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  const health = await aiAgentAPI.healthCheck();
                  toast({
                    title: "System Healthy",
                    description: "All AI agents are ready for operation"
                  });
                } catch (error) {
                  toast({
                    title: "System Check Failed",
                    description: "Some AI agents may not be responding"
                  });
                }
              }}
              className="border-blue-500/30"
            >
              <Shield className="w-4 h-4 mr-2" />
              Health Check
            </Button>

            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  const alerts = await aiAgentAPI.getActiveAlerts();
                  toast({
                    title: "Active Alerts",
                    description: `Found ${(alerts as any[]).length} active alerts`
                  });
                } catch (error) {
                  toast({
                    title: "Alert Check Failed",
                    description: "Could not retrieve alerts"
                  });
                }
              }}
              className="border-yellow-500/30"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Check Alerts
            </Button>
          </div>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Management */}
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Agent Management
                    </CardTitle>
                    <CardDescription>
                      Configure and manage individual AI agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Agents</span>
                        <Badge variant="secondary">{agents.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Agents</span>
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          {agents.filter(a => a.enabled).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Training Agents</span>
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400">
                          {agents.filter(a => a.status === 'training').length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Performance */}
                <Card className="glass-card border-green-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Overview
                    </CardTitle>
                    <CardDescription>
                      System-wide agent performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Accuracy</span>
                        <Badge variant="outline">
                          {(agents.reduce((sum, a) => sum + a.performance.accuracy, 0) / agents.length).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Tasks Today</span>
                        <Badge variant="secondary">
                          {agents.reduce((sum, a) => sum + a.metrics.dailyTasks, 0)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          {(agents.reduce((sum, a) => sum + a.metrics.successRate, 0) / agents.length).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Individual Agent Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card 
                    key={agent.id} 
                    className={`glass-card border-lime-500/30 cursor-pointer transition-all hover:border-lime-400/50 ${
                      selectedAgent === agent.id ? 'ring-2 ring-lime-400/50' : ''
                    }`}
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {agent.icon}
                          <Badge variant="outline" className={getCategoryColor(agent.category)}>
                            {agent.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                          {getStatusIcon(agent.status)}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {agent.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Enabled</span>
                          <Switch 
                            checked={agent.enabled}
                            onCheckedChange={() => toggleAgent(agent.id)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Performance</span>
                            <span>{agent.performance.accuracy}%</span>
                          </div>
                          <Progress value={agent.performance.accuracy} className="h-1" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Tasks: {agent.metrics.dailyTasks}/day</span>
                          <span>Success: {agent.metrics.successRate.toFixed(1)}%</span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs">
                            <span className="text-gray-400">Capabilities:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {agent.capabilities.slice(0, 3).map((cap, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Agent Actions */}
              <div className="flex gap-4">
                <Button 
                  onClick={async () => {
                    try {
                      toast({
                        title: "Enabling All Agents",
                        description: "Activating all AI agents..."
                      });
                      
                      // Enable all agents
                      setAgents(prev => prev.map(agent => ({ ...agent, enabled: true })));
                      
                      toast({
                        title: "All Agents Enabled",
                        description: "All AI agents are now active"
                      });
                    } catch (error) {
                      toast({
                        title: "Operation Failed",
                        description: "Could not enable all agents"
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enable All Agents
                </Button>

                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      toast({
                        title: "Disabling All Agents",
                        description: "Deactivating all AI agents..."
                      });
                      
                      // Disable all agents
                      setAgents(prev => prev.map(agent => ({ ...agent, enabled: false })));
                      
                      toast({
                        title: "All Agents Disabled",
                        description: "All AI agents are now inactive"
                      });
                    } catch (error) {
                      toast({
                        title: "Operation Failed",
                        description: "Could not disable all agents"
                      });
                    }
                  }}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Disable All Agents
                </Button>
              </div>
            </TabsContent>

            {/* Crew Collaboration Tab */}
            <TabsContent value="crew" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Crew Status */}
                <Card className="glass-card border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Crew Status
                    </CardTitle>
                    <CardDescription>
                      Real-time collaboration status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Collaborations</span>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          {crewCollaboration?.length || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tasks in Progress</span>
                        <Badge variant="outline">
                          {crewCollaboration?.reduce((sum, collab) => sum + collab.tasksInProgress, 0) || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Knowledge Sharing</span>
                        <Badge variant="outline">
                          {crewCollaboration?.reduce((sum, collab) => sum + collab.knowledgeSharing, 0) || 0}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setShowCollaborationForm(true)}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Start Crew Session
                    </Button>
                  </CardContent>
                </Card>

                {/* New Collaboration Form */}
                {showCollaborationForm && (
                  <Card className="glass-card border-blue-500/20 lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="gradient-text flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Collaboration
                      </CardTitle>
                      <CardDescription>
                        Configure collaboration parameters and select agents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="collab-title">Collaboration Title</Label>
                          <Input
                            id="collab-title"
                            placeholder="Enter collaboration title"
                            value={newCollaboration.title || ''}
                            onChange={(e) => setNewCollaboration(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="collab-priority">Priority</Label>
                          <select
                            id="collab-priority"
                            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                            value={newCollaboration.priority || 'medium'}
                            onChange={(e) => setNewCollaboration(prev => ({ ...prev, priority: e.target.value as any }))}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="collab-duration">Estimated Duration (minutes)</Label>
                          <Input
                            id="collab-duration"
                            type="number"
                            min="1"
                            placeholder="60"
                            value={newCollaboration.estimatedDuration || 60}
                            onChange={(e) => setNewCollaboration(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 60 }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Select Agents</Label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {agents.map((agent) => (
                              <label key={agent.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newCollaboration.agents?.includes(agent.name) || false}
                                  onChange={(e) => {
                                    const currentAgents = newCollaboration.agents || [];
                                    if (e.target.checked) {
                                      setNewCollaboration(prev => ({
                                        ...prev,
                                        agents: [...currentAgents, agent.name]
                                      }));
                                    } else {
                                      setNewCollaboration(prev => ({
                                        ...prev,
                                        agents: currentAgents.filter(name => name !== agent.name)
                                      }));
                                    }
                                  }}
                                  className="rounded border-border"
                                />
                                <span className="text-sm">{agent.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={initiateCrewCollaboration}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={!newCollaboration.title || !newCollaboration.agents || newCollaboration.agents.length === 0}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Start Collaboration
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setShowCollaborationForm(false);
                            setNewCollaboration({
                              title: '',
                              agents: [],
                              priority: 'medium',
                              estimatedDuration: 60
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Collaboration Network */}
                <Card className="glass-card border-purple-500/20 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Collaboration Network
                    </CardTitle>
                    <CardDescription>
                      Agent interaction patterns and knowledge flow
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Collaboration Network Visualization</p>
                        <p className="text-sm">Shows agent interactions and knowledge flow</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Collaborations */}
              <Card className="glass-card border-green-500/20">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Active Collaborations
                  </CardTitle>
                  <CardDescription>
                    Current multi-agent collaborative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!crewCollaboration || crewCollaboration.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active collaborations</p>
                      <p className="text-sm">Start a crew session to begin collaboration</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {crewCollaboration.map((collab) => (
                        <div key={collab.id} className="p-4 border border-border rounded-lg bg-card/50">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{collab.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {collab.agents.join(', ')} • {collab.status}
                              </p>
                            </div>
                            <Badge
                              variant={collab.status === 'active' ? 'default' : 'outline'}
                              className={collab.status === 'active' ? 'bg-green-500/20 text-green-400' : ''}
                            >
                              {collab.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Progress:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={collab.progress * 100} className="flex-1" />
                                <span>{(collab.progress * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Priority:</span>
                              <p className="text-xs">{collab.priority}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewCollaborationDetails(collab.id)}
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                            {collab.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => pauseCollaboration(collab.id)}
                                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                              >
                                <Square className="h-4 w-4" />
                                Pause
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Memory Tab */}
            <TabsContent value="memory" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Memory */}
                <Card className="glass-card border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Agent Memory
                    </CardTitle>
                    <CardDescription>
                      Individual agent knowledge and experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {agentMemory.map((memory) => (
                        <div key={memory.agentId} className="p-3 border border-border rounded-lg bg-card/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{memory.agentName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {memory.experiencePoints} XP • {memory.memorySize} items
                              </p>
                            </div>
                            <Badge variant="outline">
                              {memory.specialization}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Shared Knowledge Base */}
                <Card className="glass-card border-green-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Shared Knowledge
                    </CardTitle>
                    <CardDescription>
                      Cross-agent information and insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Knowledge Items</span>
                        <Badge variant="secondary">
                          {agentMemory.reduce((sum, m) => sum + m.memorySize, 0)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Shared Insights</span>
                        <Badge variant="outline">
                          {collaborationLogs.filter(log => log.type === 'insight').length}
                        </Badge>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Collaboration Logs */}
              <Card className="glass-card border-blue-500/20">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Collaboration Logs
                  </CardTitle>
                  <CardDescription>
                    Recent agent interactions and knowledge sharing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {collaborationLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="p-3 border border-border rounded-lg bg-card/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{log.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.agents.join(' ↔ ')} • {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={log.type === 'insight' ? 'border-green-500/30 text-green-400' : 
                                     log.type === 'collaboration' ? 'border-blue-500/30 text-blue-400' : 
                                     'border-orange-500/30 text-orange-400'}
                          >
                            {log.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Workflows Tab */}
            <TabsContent value="workflows" className="space-y-6">
              {/* Workflow Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Active Workflows */}
                <Card className="glass-card border-green-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Workflow className="h-5 w-5 text-green-400" />
                      Active Workflows
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400">{runningWorkflows.length}</div>
                    <p className="text-xs text-muted-foreground">Currently running</p>
                    <div className="mt-2">
                      <Progress value={runningWorkflows.length * 20} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Completed Today */}
                <Card className="glass-card border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-400" />
                      Completed Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-400">12</div>
                    <p className="text-xs text-muted-foreground">Successful executions</p>
                    <div className="mt-2">
                      <Progress value={100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Failed Workflows */}
                <Card className="glass-card border-red-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Failed Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-400">2</div>
                    <p className="text-xs text-muted-foreground">Requires attention</p>
                    <div className="mt-2">
                      <Progress value={14.3} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Success Rate */}
                <Card className="glass-card border-purple-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-400">85.7%</div>
                    <p className="text-xs text-muted-foreground">Overall performance</p>
                    <div className="mt-2">
                      <Progress value={85.7} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Workflow Templates */}
              <Card className="glass-card border-blue-500/20">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Workflow Templates
                  </CardTitle>
                  <CardDescription>
                    Pre-configured workflow patterns for common farm operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Daily Operations Template */}
                    <div className="p-4 border border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Cloud className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">Daily Operations</h4>
                          <p className="text-xs text-muted-foreground">Weather + Irrigation</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Automated daily weather analysis and irrigation optimization
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => runWorkflowTemplate('Daily Operations')}
                          disabled={runningWorkflows.includes('Daily Operations')}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {runningWorkflows.includes('Daily Operations') ? 'Running...' : 'Run'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => configureWorkflowTemplate('Daily Operations')}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>

                    {/* Crop Health Assessment Template */}
                    <div className="p-4 border border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <Eye className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">Crop Health</h4>
                          <p className="text-xs text-muted-foreground">Drone + Analysis</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Drone flight, image capture, and AI analysis workflow
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => runWorkflowTemplate('Crop Health Assessment')}
                          disabled={runningWorkflows.includes('Crop Health Assessment')}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {runningWorkflows.includes('Crop Health Assessment') ? 'Running...' : 'Run'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => configureWorkflowTemplate('Crop Health Assessment')}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>

                    {/* Crisis Response Template */}
                    <div className="p-4 border border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">Crisis Response</h4>
                          <p className="text-xs text-muted-foreground">Emergency Protocol</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Rapid response workflow for emergencies and alerts
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => runWorkflowTemplate('Crisis Response')}
                          disabled={runningWorkflows.includes('Crisis Response')}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {runningWorkflows.includes('Crisis Response') ? 'Running...' : 'Run'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => configureWorkflowTemplate('Crisis Response')}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>

                    {/* Content Creation Template */}
                    <div className="p-4 border border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Camera className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">Content Creation</h4>
                          <p className="text-xs text-muted-foreground">Media + Social</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Automated content generation and social media posting
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => runWorkflowTemplate('Content Creation')}
                          disabled={runningWorkflows.includes('Content Creation')}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {runningWorkflows.includes('Content Creation') ? 'Running...' : 'Run'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => configureWorkflowTemplate('Content Creation')}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>

                    {/* Data Analysis Template */}
                    <div className="p-4 border border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Data Analysis</h4>
                          <p className="text-xs text-muted-foreground">Reports + Insights</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Comprehensive data analysis and reporting workflow
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-orange-600 hover:bg-orange-700"
                          onClick={() => runWorkflowTemplate('Data Analysis')}
                          disabled={runningWorkflows.includes('Data Analysis')}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {runningWorkflows.includes('Data Analysis') ? 'Running...' : 'Run'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => configureWorkflowTemplate('Data Analysis')}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>

                    {/* Custom Workflow */}
                    <div className="p-4 border border-dashed border-border rounded-lg bg-card/20 hover:bg-card/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                          <Plus className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">Create Custom</h4>
                          <p className="text-xs text-muted-foreground">New Workflow</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Build a custom workflow from scratch
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Plus className="h-3 w-3 mr-1" />
                        Create New
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Configuration Modal */}
              {isConfiguring && selectedTemplate && (
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configure {selectedTemplate} Workflow
                    </CardTitle>
                    <CardDescription>
                      Customize workflow parameters and agent assignments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(workflowConfig).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key} className="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          {typeof value === 'string' ? (
                            <Input 
                              id={key} 
                              value={value as string}
                              onChange={(e) => setWorkflowConfig(prev => ({ ...prev, [key]: e.target.value }))}
                            />
                          ) : Array.isArray(value) ? (
                            <div className="space-y-2">
                              {value.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input 
                                    value={item}
                                    onChange={(e) => {
                                      const newArray = [...value];
                                      newArray[index] = e.target.value;
                                      setWorkflowConfig(prev => ({ ...prev, [key]: newArray }));
                                    }}
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      const newArray = value.filter((_, i) => i !== index);
                                      setWorkflowConfig(prev => ({ ...prev, [key]: newArray }));
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const newArray = [...value, ''];
                                  setWorkflowConfig(prev => ({ ...prev, [key]: newArray }));
                                }}
                              >
                                Add Item
                              </Button>
                            </div>
                          ) : (
                            <Input 
                              id={key} 
                              type="number"
                              value={value as number}
                              onChange={(e) => setWorkflowConfig(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                            />
                          )}
                        </div>
                      ))}
                      
                      <div className="flex gap-2 pt-4">
                        <Button onClick={saveWorkflowConfiguration} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Configuration
                        </Button>
                        <Button variant="outline" onClick={cancelWorkflowConfiguration}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Monitoring Tab */}
            <TabsContent value="monitoring" className="space-y-6">
              {/* Real-time Metrics Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Active Agents */}
                <Card className="glass-card border-green-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-400" />
                      Active Agents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400">7</div>
                    <p className="text-xs text-muted-foreground">of 9 total agents</p>
                    <div className="mt-2">
                      <Progress value={77.8} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* System Load */}
                <Card className="glass-card border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      System Load
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-400">68%</div>
                    <p className="text-xs text-muted-foreground">CPU & Memory usage</p>
                    <div className="mt-2">
                      <Progress value={68} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Response Time */}
                <Card className="glass-card border-purple-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-400" />
                      Avg Response
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-400">1.2s</div>
                    <p className="text-xs text-muted-foreground">Average response time</p>
                    <div className="mt-2">
                      <Progress value={60} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Success Rate */}
                <Card className="glass-card border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-orange-400" />
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-400">94.2%</div>
                    <p className="text-xs text-muted-foreground">Task completion rate</p>
                    <div className="mt-2">
                      <Progress value={94.2} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Performance Over Time */}
                <Card className="glass-card border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Agent Performance (24h)
                    </CardTitle>
                    <CardDescription>
                      Performance metrics over the last 24 hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Performance Chart Placeholder */}
                      <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Performance Chart</p>
                          <p className="text-sm">Real-time metrics visualization</p>
                        </div>
                      </div>
                      
                      {/* Performance Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-green-400">+12%</p>
                          <p className="text-xs text-muted-foreground">vs yesterday</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-400">89%</p>
                          <p className="text-xs text-muted-foreground">peak efficiency</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-400">-5%</p>
                          <p className="text-xs text-muted-foreground">error rate</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Resource Usage */}
                <Card className="glass-card border-green-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      System Resources
                    </CardTitle>
                    <CardDescription>
                      Real-time resource consumption
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* CPU Usage */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>CPU Usage</span>
                          <span>68%</span>
                        </div>
                        <Progress value={68} className="h-3" />
                      </div>
                      
                      {/* Memory Usage */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Memory Usage</span>
                          <span>72%</span>
                        </div>
                        <Progress value={72} className="h-3" />
                      </div>
                      
                      {/* Disk Usage */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Disk Usage</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} className="h-3" />
                      </div>
                      
                      {/* Network Usage */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Network I/O</span>
                          <span>23%</span>
                        </div>
                        <Progress value={23} className="h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Live Activity Feed */}
              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Live Activity Feed
                  </CardTitle>
                  <CardDescription>
                    Real-time system activities and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {/* Activity 1 */}
                    <div className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card/50">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Crop Health Monitor completed analysis</p>
                        <p className="text-sm text-muted-foreground">
                          Analyzed 150 images • 2 minutes ago
                        </p>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline" className="text-xs">Image Analysis</Badge>
                          <Badge variant="outline" className="text-xs">Disease Detection</Badge>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500/20 text-green-400">
                        SUCCESS
                      </Badge>
                    </div>

                    {/* Activity 2 */}
                    <div className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card/50">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Irrigation Engineer optimized schedule</p>
                        <p className="text-sm text-muted-foreground">
                          Updated 3 field zones • 5 minutes ago
                        </p>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline" className="text-xs">Water Optimization</Badge>
                          <Badge variant="outline" className="text-xs">Schedule Update</Badge>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-blue-500/20 text-blue-400">
                        OPTIMIZED
                      </Badge>
                    </div>

                    {/* Activity 3 */}
                    <div className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card/50">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Weather Intelligence updated forecast</p>
                        <p className="text-sm text-muted-foreground">
                          New weather data received • 8 minutes ago
                        </p>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline" className="text-xs">Weather Update</Badge>
                          <Badge variant="outline" className="text-xs">Forecast</Badge>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-orange-500/20 text-orange-400">
                        UPDATED
                      </Badge>
                    </div>

                    {/* Activity 4 */}
                    <div className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card/50">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Drone Pilot AI mission failed</p>
                        <p className="text-sm text-muted-foreground">
                          Mission timeout exceeded • 12 minutes ago
                        </p>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline" className="text-xs">Mission Failure</Badge>
                          <Badge variant="outline" className="text-xs">Timeout</Badge>
                        </div>
                      </div>
                      <Badge variant="destructive">
                        FAILED
                      </Badge>
                    </div>

                    {/* Activity 5 */}
                    <div className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card/50">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Content Creation Agent published post</p>
                        <p className="text-sm text-muted-foreground">
                          Social media content created • 15 minutes ago
                        </p>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline" className="text-xs">Content Creation</Badge>
                          <Badge variant="outline" className="text-xs">Social Media</Badge>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500/20 text-green-400">
                        PUBLISHED
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alert Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Alerts */}
                <Card className="glass-card border-red-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Active Alerts
                    </CardTitle>
                    <CardDescription>
                      Current system warnings and errors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Alert 1 */}
                      <div className="p-3 border border-red-500/20 rounded-lg bg-red-500/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <span className="font-medium">High Memory Usage</span>
                          </div>
                          <Badge variant="destructive">CRITICAL</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Memory usage at 85% - consider scaling
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline">Dismiss</Button>
                          <Button size="sm" variant="outline">Investigate</Button>
                        </div>
                      </div>

                      {/* Alert 2 */}
                      <div className="p-3 border border-orange-500/20 rounded-lg bg-orange-500/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-400" />
                            <span className="font-medium">Agent Response Slow</span>
                          </div>
                          <Badge variant="secondary">WARNING</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Crop Health Monitor responding slowly
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline">Dismiss</Button>
                          <Button size="sm" variant="outline">Restart</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Insights */}
                <Card className="glass-card border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Performance Insights
                    </CardTitle>
                    <CardDescription>
                      AI-powered recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 border border-blue-500/20 rounded-lg bg-blue-500/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-blue-400" />
                          <span className="font-medium">Optimization Opportunity</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Consider increasing parallel processing for image analysis tasks
                        </p>
                        <Button size="sm" variant="outline" className="mt-2">
                          Apply Suggestion
                        </Button>
                      </div>

                      <div className="p-3 border border-green-500/20 rounded-lg bg-green-500/10">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="font-medium">System Health</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          All critical systems operating within normal parameters
                        </p>
                        <Button size="sm" variant="outline" className="mt-2">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Suite Status */}
                <Card className="glass-card border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Test Suite Status
                    </CardTitle>
                    <CardDescription>
                      Current testing status and results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Tests</span>
                        <Badge variant="secondary">24</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Passed</span>
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          22
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Failed</span>
                        <Badge variant="destructive">2</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <Badge variant="outline">91.7%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Execution */}
                <Card className="glass-card border-green-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Test Execution
                    </CardTitle>
                    <CardDescription>
                      Run tests and monitor execution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Run All Tests
                      </Button>
                      
                      <Button variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run Failed Tests
                      </Button>
                      
                      <Button variant="outline" className="w-full">
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Tests
                      </Button>
                      
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground">
                          Last run: 2 minutes ago
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Next scheduled: Tomorrow 6:00 AM
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Test Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Unit Tests */}
                <Card className="glass-card border-purple-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Unit Tests
                    </CardTitle>
                    <CardDescription>Individual agent functionality</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span>12 tests</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Passed:</span>
                        <span className="text-green-400">11</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Failed:</span>
                        <span className="text-red-400">1</span>
                      </div>
                      <Progress value={91.7} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Integration Tests */}
                <Card className="glass-card border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Network className="h-5 w-5 text-blue-400" />
                      Integration Tests
                    </CardTitle>
                    <CardDescription>Agent collaboration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span>8 tests</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Passed:</span>
                        <span className="text-green-400">8</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Failed:</span>
                        <span className="text-red-400">0</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Tests */}
                <Card className="glass-card border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-400" />
                      Performance Tests
                    </CardTitle>
                    <CardDescription>Speed and efficiency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span>4 tests</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Passed:</span>
                        <span className="text-green-400">3</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Failed:</span>
                        <span className="text-red-400">1</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Test Results */}
              <Card className="glass-card border-gray-500/20">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Recent Test Results
                  </CardTitle>
                  <CardDescription>
                    Detailed results from latest test runs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {/* Test Result 1 */}
                    <div className="p-3 border border-border rounded-lg bg-card/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Crop Health Analysis Test</p>
                          <p className="text-sm text-muted-foreground">
                            Unit Test • 2 minutes ago
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          PASSED
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Response time: 1.2s • Accuracy: 94.2%
                      </div>
                    </div>

                    {/* Test Result 2 */}
                    <div className="p-3 border border-border rounded-lg bg-card/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Irrigation Optimization Test</p>
                          <p className="text-sm text-muted-foreground">
                            Integration Test • 5 minutes ago
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          PASSED
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Response time: 2.8s • Water savings: 23%
                      </div>
                    </div>

                    {/* Test Result 3 */}
                    <div className="p-3 border border-border rounded-lg bg-card/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Drone Mission Planning Test</p>
                          <p className="text-sm text-muted-foreground">
                            Performance Test • 8 minutes ago
                          </p>
                        </div>
                        <Badge variant="destructive">
                          FAILED
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Response time: 8.5s (exceeded 5s limit) • Error: Timeout
                      </div>
                    </div>

                    {/* Test Result 4 */}
                    <div className="p-3 border border-border rounded-lg bg-card/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Weather Intelligence Test</p>
                          <p className="text-sm text-muted-foreground">
                            Unit Test • 12 minutes ago
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-500/20 text-green-400">
                          PASSED
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Response time: 0.8s • Forecast accuracy: 89.1%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Configuration */}
              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Test Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure test parameters and thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="timeout-threshold">Timeout Threshold (seconds)</Label>
                        <Input 
                          id="timeout-threshold" 
                          type="number" 
                          defaultValue={5}
                          min={1}
                          max={30}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accuracy-threshold">Accuracy Threshold (%)</Label>
                        <Input 
                          id="accuracy-threshold" 
                          type="number" 
                          defaultValue={85}
                          min={50}
                          max={100}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="retry-attempts">Retry Attempts</Label>
                        <Input 
                          id="retry-attempts" 
                          type="number" 
                          defaultValue={3}
                          min={1}
                          max={5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="parallel-tests">Parallel Tests</Label>
                        <Input 
                          id="parallel-tests" 
                          type="number" 
                          defaultValue={4}
                          min={1}
                          max={8}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-retry">Auto Retry Failed Tests</Label>
                          <p className="text-xs text-muted-foreground">Automatically retry failed tests</p>
                        </div>
                        <Switch id="auto-retry" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="notify-failures">Notify on Failures</Label>
                          <p className="text-xs text-muted-foreground">Send alerts for test failures</p>
                        </div>
                        <Switch id="notify-failures" defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Configuration */}
                <Card className="glass-card border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      System Configuration
                    </CardTitle>
                    <CardDescription>
                      Global system settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-update">Auto Update Agents</Label>
                          <p className="text-xs text-muted-foreground">Automatically update agent configurations</p>
                        </div>
                        <Switch id="auto-update" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="notifications">Push Notifications</Label>
                          <p className="text-xs text-muted-foreground">Receive alerts for important events</p>
                        </div>
                        <Switch id="notifications" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="data-retention">Data Retention</Label>
                          <p className="text-xs text-muted-foreground">Keep historical data for analysis</p>
                        </div>
                        <Switch id="data-retention" defaultChecked />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="update-frequency">Update Frequency (minutes)</Label>
                        <Input 
                          id="update-frequency" 
                          type="number" 
                          defaultValue={60}
                          min={15}
                          max={1440}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Settings */}
                <Card className="glass-card border-green-500/20">
                  <CardHeader>
                    <CardTitle className="gradient-text flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance Settings
                    </CardTitle>
                    <CardDescription>
                      Optimize system performance and resource usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="max-concurrent">Max Concurrent Agents</Label>
                        <Input 
                          id="max-concurrent" 
                          type="number" 
                          defaultValue={5}
                          min={1}
                          max={10}
                        />
                        <p className="text-xs text-muted-foreground">Maximum agents running simultaneously</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="memory-limit">Memory Limit (MB)</Label>
                        <Input 
                          id="memory-limit" 
                          type="number" 
                          defaultValue={1024}
                          min={256}
                          max={4096}
                        />
                        <p className="text-xs text-muted-foreground">Maximum memory per agent</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="timeout">Task Timeout (seconds)</Label>
                        <Input 
                          id="timeout" 
                          type="number" 
                          defaultValue={300}
                          min={60}
                          max={1800}
                        />
                        <p className="text-xs text-muted-foreground">Maximum time for task completion</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Security Settings */}
              <Card className="glass-card border-red-500/20">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Configure access control and security policies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                          <p className="text-xs text-muted-foreground">Require 2FA for admin access</p>
                        </div>
                        <Switch id="two-factor" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="audit-logging">Audit Logging</Label>
                          <p className="text-xs text-muted-foreground">Log all system activities</p>
                        </div>
                        <Switch id="audit-logging" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                          <p className="text-xs text-muted-foreground">Restrict access to specific IPs</p>
                        </div>
                        <Switch id="ip-whitelist" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                        <Input 
                          id="session-timeout" 
                          type="number" 
                          defaultValue={8}
                          min={1}
                          max={24}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                        <Input 
                          id="max-login-attempts" 
                          type="number" 
                          defaultValue={5}
                          min={3}
                          max={10}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                        <Input 
                          id="password-expiry" 
                          type="number" 
                          defaultValue={90}
                          min={30}
                          max={365}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Backup & Recovery */}
              <Card className="glass-card border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Backup & Recovery
                  </CardTitle>
                  <CardDescription>
                    Manage system backups and recovery options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-backup">Auto Backup</Label>
                          <p className="text-xs text-muted-foreground">Automatically backup system data</p>
                        </div>
                        <Switch id="auto-backup" defaultChecked />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="backup-frequency">Backup Frequency</Label>
                        <select 
                          id="backup-frequency" 
                          className="w-full p-2 border rounded-md bg-background"
                          defaultValue="daily"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="retention-period">Retention Period (days)</Label>
                        <Input 
                          id="retention-period" 
                          type="number" 
                          defaultValue={30}
                          min={7}
                          max={365}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Download className="h-4 w-4 mr-2" />
                        Create Manual Backup
                      </Button>
                      
                      <Button variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restore from Backup
                      </Button>
                      
                      <Button variant="outline" className="w-full">
                        <Route className="h-4 w-4 mr-2" />
                        Export Configuration
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Settings */}
              <div className="flex justify-end gap-4">
                <Button variant="outline">
                  Reset to Defaults
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Agent Details */}
      {selectedAgentData && (
        <Card className="glass-card border-lime-500/30">
          <CardHeader>
            <CardTitle className="gradient-text flex items-center gap-2">
              {selectedAgentData.icon}
              {selectedAgentData.name} Configuration
            </CardTitle>
            <CardDescription>
              Configure and monitor agent performance and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-lime-400">Capabilities</h3>
                    <div className="space-y-2">
                      {selectedAgentData.capabilities.map((capability, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm">{capability}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-lime-400">Current Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Status</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedAgentData.status)}
                          <Badge variant="outline" className={getStatusColor(selectedAgentData.status)}>
                            {selectedAgentData.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Tasks</span>
                        <Badge variant="outline">{selectedAgentData.metrics.dailyTasks}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Tasks</span>
                        <Badge variant="outline">{selectedAgentData.metrics.weeklyTasks}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate</span>
                        <Badge variant="outline">{selectedAgentData.metrics.successRate.toFixed(1)}%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Response</span>
                        <Badge variant="outline">{selectedAgentData.metrics.avgResponseTime.toFixed(0)}ms</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Active</span>
                        <Badge variant="outline">
                          {selectedAgentData.performance.lastActive === 'Never' 
                            ? 'Never' 
                            : new Date(selectedAgentData.performance.lastActive).toLocaleTimeString()
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Sensitivity Level (%)</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Input
                          type="number"
                          value={selectedAgentData.configuration.sensitivity}
                          onChange={(e) => updateAgentConfig(selectedAgentData.id, {
                            sensitivity: parseInt(e.target.value)
                          })}
                          min="0"
                          max="100"
                          className="w-20"
                        />
                        <Progress 
                          value={selectedAgentData.configuration.sensitivity} 
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Higher sensitivity = more alerts, lower false negatives
                      </p>
                    </div>

                    <div>
                      <Label>Update Frequency (minutes)</Label>
                      <Input
                        type="number"
                        value={selectedAgentData.configuration.updateFrequency}
                        onChange={(e) => updateAgentConfig(selectedAgentData.id, {
                          updateFrequency: parseInt(e.target.value)
                        })}
                        min="1"
                        max="1440"
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        How often the agent checks for new data
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Alert Threshold (%)</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Input
                          type="number"
                          value={selectedAgentData.configuration.alertThreshold}
                          onChange={(e) => updateAgentConfig(selectedAgentData.id, {
                            alertThreshold: parseInt(e.target.value)
                          })}
                          min="0"
                          max="100"
                          className="w-20"
                        />
                        <Progress 
                          value={selectedAgentData.configuration.alertThreshold} 
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Confidence level required before sending alerts
                      </p>
                    </div>

                    <div className="flex gap-2 mt-6 flex-wrap">
                      <Button 
                        size="sm" 
                        onClick={() => toast({
                          title: "Configuration Saved",
                          description: "Agent configuration has been updated"
                        })}
                        className="bg-lime-600 hover:bg-lime-700"
                      >
                        Save Configuration
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          updateAgentConfig(selectedAgentData.id, {
                            sensitivity: 80,
                            updateFrequency: 60,
                            alertThreshold: 75
                          });
                          toast({
                            title: "Reset to Default",
                            description: "Configuration reset to default values"
                          });
                        }}
                      >
                        Reset to Default
                      </Button>
                      
                      {/* Test Agent Button */}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          if (!selectedAgentData.enabled) {
                            toast({
                              title: "Agent Disabled",
                              description: "Enable the agent first to run tests"
                            });
                            return;
                          }

                          try {
                            toast({
                              title: "Running Test",
                              description: `Testing ${selectedAgentData.name}...`
                            });

                            let result;
                            switch (selectedAgentData.id) {
                              case 'irrigation-optimizer':
                                result = await aiAgentAPI.optimizeIrrigation({
                                  moisture: 45,
                                  temperature: 22,
                                  ph: 6.5
                                });
                                break;
                              case 'weather-intelligence':
                                result = await aiAgentAPI.analyzeWeatherIntelligence();
                                break;
                              case 'predictive-maintenance':
                                result = await aiAgentAPI.analyzePredictiveMaintenance({
                                  drones: [{ id: 'test-drone', battery_cycles: 400 }]
                                });
                                break;
                              case 'drone-pilot-ai':
                                result = await aiAgentAPI.planDroneMission({
                                  mission_type: 'surveillance',
                                  area: 'Field A',
                                  priority: 'high'
                                });
                                break;
                              case 'content-creation-agent':
                                result = await aiAgentAPI.planContentCapture({
                                  content_type: 'cinematic',
                                  target: 'apple_orchard',
                                  duration: 300
                                });
                                break;
                              case 'customer-service-agent':
                                result = await aiAgentAPI.handleCustomerInquiry({
                                  inquiry_type: 'phone_call',
                                  message: 'Test customer service response',
                                  priority: 'medium'
                                });
                                break;
                              default:
                                result = await aiAgentAPI.triggerAutomatedAnalysis();
                            }

                            toast({
                              title: "Test Completed",
                              description: "Agent test executed successfully"
                            });
                          } catch (error) {
                            toast({
                              title: "Test Failed",
                              description: "Agent test failed - check console for details"
                            });
                            console.error('Agent test failed:', error);
                          }
                        }}
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      >
                        Test Agent
                      </Button>

                      {/* Special Actions for Drone Agents */}
                      {selectedAgentData.id === 'drone-pilot-ai' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const result = await aiAgentAPI.emergencyStopDrone('drone_01');
                                toast({
                                  title: "Emergency Stop",
                                  description: "Drone emergency stop executed"
                                });
                              } catch (error) {
                                toast({
                                  title: "Emergency Stop Failed",
                                  description: "Could not execute emergency stop"
                                });
                              }
                            }}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            🚨 Emergency Stop
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const result = await aiAgentAPI.planDroneMission({
                                  mission_type: 'content_capture',
                                  area: 'Field B',
                                  priority: 'medium'
                                });
                                toast({
                                  title: "Mission Planned",
                                  description: "New drone mission created successfully"
                                });
                              } catch (error) {
                                toast({
                                  title: "Mission Planning Failed",
                                  description: "Could not create mission plan"
                                });
                              }
                            }}
                            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          >
                            📋 Plan Mission
                          </Button>
                        </>
                      )}

                      {selectedAgentData.id === 'content-creation-agent' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const result = await aiAgentAPI.planContentCapture({
                                  content_type: 'marketing',
                                  target: 'pear_orchard',
                                  duration: 600
                                });
                                toast({
                                  title: "Content Plan Created",
                                  description: "New marketing content plan ready"
                                });
                              } catch (error) {
                                toast({
                                  title: "Content Planning Failed",
                                  description: "Could not create content plan"
                                });
                              }
                            }}
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                          >
                            🎬 Plan Marketing Content
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const result = await aiAgentAPI.assessContentQuality('content_001');
                                toast({
                                  title: "Quality Assessment",
                                  description: "Content quality analysis completed"
                                });
                              } catch (error) {
                                toast({
                                  title: "Assessment Failed",
                                  description: "Could not assess content quality"
                                });
                              }
                            }}
                            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            📊 Assess Quality
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                // Simulate trend analysis
                                await new Promise(resolve => setTimeout(resolve, 1500));
                                toast({
                                  title: "Trend Analysis",
                                  description: "Viral content trends identified for farming"
                                });
                              } catch (error) {
                                toast({
                                  title: "Trend Analysis Failed",
                                  description: "Could not analyze trends"
                                });
                              }
                            }}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          >
                            📈 Analyze Trends
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                // Simulate hashtag optimization
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                toast({
                                  title: "Hashtag Optimization",
                                  description: "Optimal hashtags generated for maximum reach"
                                });
                              } catch (error) {
                                toast({
                                  title: "Hashtag Optimization Failed",
                                  description: "Could not optimize hashtags"
                                });
                              }
                            }}
                            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          >
                            #️⃣ Optimize Hashtags
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                // Simulate posting time optimization
                                await new Promise(resolve => setTimeout(resolve, 800));
                                toast({
                                  title: "Posting Time Optimization",
                                  description: "Best times to post for maximum engagement"
                                });
                              } catch (error) {
                                toast({
                                  title: "Timing Analysis Failed",
                                  description: "Could not optimize posting times"
                                });
                              }
                            }}
                            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                          >
                            ⏰ Optimize Timing
                          </Button>
                        </>
                      )}

                      {selectedAgentData.id === 'customer-service-agent' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const result = await aiAgentAPI.handleCustomerInquiry({
                                  inquiry_type: 'email',
                                  message: 'Test email response generation',
                                  priority: 'high'
                                });
                                toast({
                                  title: "Email Response Test",
                                  description: "Customer service email response generated"
                                });
                              } catch (error) {
                                toast({
                                  title: "Email Test Failed",
                                  description: "Could not generate email response"
                                });
                              }
                            }}
                            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          >
                            📧 Test Email Response
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                const result = await aiAgentAPI.simulatePhoneCall({
                                  call_type: 'incoming',
                                  duration: 120,
                                  customer_type: 'new'
                                });
                                toast({
                                  title: "Phone Call Simulation",
                                  description: "Virtual phone call handling tested successfully"
                                });
                              } catch (error) {
                                toast({
                                  title: "Phone Test Failed",
                                  description: "Could not simulate phone call"
                                });
                              }
                            }}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          >
                            📞 Test Phone Call
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-lime-400">System Permissions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span>Read Sensor Data</span>
                          <p className="text-xs text-gray-400">Access to NPK, pH, moisture, EC readings</p>
                        </div>
                        <Switch 
                          checked={selectedAgentData.permissions.readSensorData}
                          onCheckedChange={(checked) => updateAgentPermissions(selectedAgentData.id, {
                            readSensorData: checked
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span>Control Drones</span>
                          <p className="text-xs text-gray-400">Send flight commands and mission updates</p>
                        </div>
                        <Switch 
                          checked={selectedAgentData.permissions.controlDrones}
                          onCheckedChange={(checked) => updateAgentPermissions(selectedAgentData.id, {
                            controlDrones: checked
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span>Modify Settings</span>
                          <p className="text-xs text-gray-400">Change irrigation schedules and equipment settings</p>
                        </div>
                        <Switch 
                          checked={selectedAgentData.permissions.modifySettings}
                          onCheckedChange={(checked) => updateAgentPermissions(selectedAgentData.id, {
                            modifySettings: checked
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span>Send Alerts</span>
                          <p className="text-xs text-gray-400">Push notifications and dashboard alerts</p>
                        </div>
                        <Switch 
                          checked={selectedAgentData.permissions.sendAlerts}
                          onCheckedChange={(checked) => updateAgentPermissions(selectedAgentData.id, {
                            sendAlerts: checked
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-lime-400">Safety & Security</h3>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">Security Notice</span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        This agent operates with restricted permissions. Critical operations require manual approval.
                      </p>
                      <ul className="text-xs text-gray-400 space-y-1">
                        <li>• All actions are logged and audited</li>
                        <li>• Emergency stop available at any time</li>
                        <li>• Human oversight required for high-risk actions</li>
                        <li>• Automatic rollback on system errors</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Safety Features</span>
                      </div>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Geofencing prevents out-of-bounds operations</li>
                        <li>• Weather safety checks before drone flights</li>
                        <li>• Battery level monitoring for all equipment</li>
                        <li>• Automatic conflict resolution between agents</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="glass-card border-lime-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <TrendingUp className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-lime-400">
                          {selectedAgentData.performance.accuracy}%
                        </div>
                        <div className="text-xs text-gray-400">Accuracy</div>
                        <Progress value={selectedAgentData.performance.accuracy} className="mt-2 h-1" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-lime-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Zap className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-lime-400">
                          {selectedAgentData.performance.efficiency}%
                        </div>
                        <div className="text-xs text-gray-400">Efficiency</div>
                        <Progress value={selectedAgentData.performance.efficiency} className="mt-2 h-1" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-lime-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <Activity className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-lime-400">
                          {selectedAgentData.performance.uptime}%
                        </div>
                        <div className="text-xs text-gray-400">Uptime</div>
                        <Progress value={selectedAgentData.performance.uptime} className="mt-2 h-1" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-lime-500/30">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-lime-400">
                          {selectedAgentData.performance.tasksCompleted}
                        </div>
                        <div className="text-xs text-gray-400">Tasks Done</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-lime-400 mb-4">Performance Timeline</h3>
                  <div className="h-32 bg-gray-800/50 rounded-lg flex items-center justify-center border border-lime-500/30">
                    {selectedAgentData.enabled ? (
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                        <span className="text-gray-300 text-sm">Performance data collecting...</span>
                        <p className="text-xs text-gray-400 mt-1">Charts will appear as the agent processes more data</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Square className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-400 text-sm">Agent not active</span>
                        <p className="text-xs text-gray-500 mt-1">Enable the agent to see performance charts</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-lime-400 mb-4">Recent Activity</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedAgentData.enabled ? (
                      <div className="text-sm text-gray-300">
                        <div className="flex justify-between p-2 bg-gray-800/30 rounded">
                          <span>Agent initialized successfully</span>
                          <span className="text-xs text-gray-400">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                        {selectedAgentData.status === 'active' && (
                          <div className="flex justify-between p-2 bg-green-500/10 rounded">
                            <span>Started monitoring operations</span>
                            <span className="text-xs text-gray-400">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-sm py-4">
                        No recent activity. Enable the agent to see activity logs.
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAgentManager;
