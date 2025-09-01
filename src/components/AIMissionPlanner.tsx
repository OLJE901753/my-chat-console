import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Map, 
  Camera, 
  Zap, 
  Shield, 
  TrendingUp, 
  Play, 
  Pause, 
  Square,
  RotateCcw,
  Settings,
  BarChart3,
  Lightbulb,
  Target,
  Route,
  Clock,
  Battery,
  Wind,
  Thermometer,
  Eye
} from 'lucide-react';

interface AIMission {
  id: string;
  type: string;
  status: string;
  flightConfiguration: {
    route: any[];
    altitude: number;
    speed: number;
    estimatedDuration: number;
  };
  dataCollection: {
    photography: any[];
    videography: any[];
    sensors: any[];
    investigations: any[];
  };
  aiInstructions: {
    decisionThresholds: any;
    contingencyProcedures: any;
    realTimeAdjustments: boolean;
    learningEnabled: boolean;
  };
  safetyParameters: {
    maxWindSpeed: number;
    minVisibility: number;
    maxTemperature: number;
    emergencyLandingZones: any[];
    geofencing: any;
  };
}

interface AIStats {
  totalMissions: number;
  autonomousMissions: number;
  averageFlightTime: number;
  successRate: number;
  aiLearningProgress: {
    decisionAccuracy: number;
    routeOptimization: number;
    weatherPrediction: number;
  };
}

const AIMissionPlanner: React.FC = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMission, setCurrentMission] = useState<AIMission | null>(null);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [farmId, setFarmId] = useState('FARM_001');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);

  const availableObjectives = [
    'CROP_HEALTH_CHECK',
    'IRRIGATION_ASSESSMENT',
    'PERIMETER_SURVEY',
    'DETAILED_INSPECTION',
    'QUICK_SURVEY',
    'SAFETY_CRITICAL',
    'HIGH_DETAIL',
    'BROAD_SURVEY',
    'OBSTACLE_HEAVY'
  ];

  useEffect(() => {
    loadAIStats();
  }, []);

  const loadAIStats = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/ai-missions/stats/${farmId}`);
      if (response.ok) {
        const data = await response.json();
        setAiStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load AI stats:', error);
    }
  };

  const generateAIMission = async () => {
    if (selectedObjectives.length === 0) {
      toast({
        title: "No Objectives Selected",
        description: "Please select at least one mission objective.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:3001/api/ai-missions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmId,
          objectives: selectedObjectives
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentMission(data.mission);
        toast({
          title: "AI Mission Generated!",
          description: "The AI has created a fully autonomous mission plan.",
        });
        loadAIStats(); // Refresh stats
      } else {
        throw new Error('Failed to generate AI mission');
      }
    } catch (error) {
      toast({
        title: "Mission Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const testAICapabilities = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ai-missions/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "AI Test Successful",
          description: "All AI capabilities are functioning correctly.",
        });
      }
    } catch (error) {
      toast({
        title: "AI Test Failed",
        description: "Some AI capabilities may not be working properly.",
        variant: "destructive"
      });
    }
  };

  const toggleObjective = (objective: string) => {
    setSelectedObjectives(prev => 
      prev.includes(objective) 
        ? prev.filter(o => o !== objective)
        : [...prev, objective]
    );
  };

  const getObjectiveIcon = (objective: string) => {
    switch (objective) {
      case 'CROP_HEALTH_CHECK': return <Eye className="w-4 h-4" />;
      case 'IRRIGATION_ASSESSMENT': return <Zap className="w-4 h-4" />;
      case 'PERIMETER_SURVEY': return <Map className="w-4 h-4" />;
      case 'DETAILED_INSPECTION': return <Camera className="w-4 h-4" />;
      case 'QUICK_SURVEY': return <Route className="w-4 h-4" />;
      case 'SAFETY_CRITICAL': return <Shield className="w-4 h-4" />;
      case 'HIGH_DETAIL': return <Target className="w-4 h-4" />;
      case 'BROAD_SURVEY': return <BarChart3 className="w-4 h-4" />;
      case 'OBSTACLE_HEAVY': return <Settings className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getObjectiveColor = (objective: string) => {
    switch (objective) {
      case 'CROP_HEALTH_CHECK': return 'bg-green-500';
      case 'IRRIGATION_ASSESSMENT': return 'bg-blue-500';
      case 'PERIMETER_SURVEY': return 'bg-purple-500';
      case 'DETAILED_INSPECTION': return 'bg-orange-500';
      case 'QUICK_SURVEY': return 'bg-yellow-500';
      case 'SAFETY_CRITICAL': return 'bg-red-500';
      case 'HIGH_DETAIL': return 'bg-indigo-500';
      case 'BROAD_SURVEY': return 'bg-pink-500';
      case 'OBSTACLE_HEAVY': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Mission Planning Header */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="gradient-text text-2xl flex items-center gap-2">
            <Brain className="w-8 h-8 text-lime-400" />
            AI Mission Planning System
          </CardTitle>
          <CardDescription className="text-gray-300">
            Autonomous drone mission generation using advanced AI algorithms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-lime-500/10 rounded-lg border border-lime-500/20">
              <Brain className="w-8 h-8 text-lime-400 mx-auto mb-2" />
              <h3 className="font-semibold text-lime-400">AI-Powered</h3>
              <p className="text-sm text-gray-300">Machine learning algorithms</p>
            </div>
            <div className="text-center p-4 bg-lime-500/10 rounded-lg border border-lime-500/20">
              <Zap className="w-8 h-8 text-lime-400 mx-auto mb-2" />
              <h3 className="font-semibold text-lime-400">Autonomous</h3>
              <p className="text-sm text-gray-300">Zero human intervention</p>
            </div>
            <div className="text-center p-4 bg-lime-500/10 rounded-lg border border-lime-500/20">
              <Shield className="w-8 h-8 text-lime-400 mx-auto mb-2" />
              <h3 className="font-semibold text-lime-400">Safety First</h3>
              <p className="text-sm text-gray-300">Built-in safety protocols</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="planning" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning">Mission Planning</TabsTrigger>
          <TabsTrigger value="current">Current Mission</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
          <TabsTrigger value="testing">AI Testing</TabsTrigger>
        </TabsList>

        {/* Mission Planning Tab */}
        <TabsContent value="planning" className="space-y-4">
          <Card className="glass-card border-lime-500/30">
            <CardHeader>
              <CardTitle className="gradient-text">Generate AI Mission</CardTitle>
              <CardDescription>
                Configure mission parameters and let AI create the optimal flight plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="farmId">Farm ID</Label>
                <Input
                  id="farmId"
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  placeholder="Enter farm identifier"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Mission Objectives</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {availableObjectives.map((objective) => (
                    <Button
                      key={objective}
                      variant={selectedObjectives.includes(objective) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleObjective(objective)}
                      className={`justify-start gap-2 ${
                        selectedObjectives.includes(objective) 
                          ? 'bg-lime-500 hover:bg-lime-600' 
                          : 'border-lime-500/30 hover:border-lime-500/50'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${getObjectiveColor(objective)}`} />
                      {getObjectiveIcon(objective)}
                      {objective.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateAIMission}
                disabled={isGenerating || selectedObjectives.length === 0}
                className="w-full cta-button"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    AI Planning Mission...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate AI Mission
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current Mission Tab */}
        <TabsContent value="current" className="space-y-4">
          {currentMission ? (
            <div className="space-y-4">
              <Card className="glass-card border-lime-500/30">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Mission: {currentMission.id}
                  </CardTitle>
                  <CardDescription>
                    AI-Generated Autonomous Mission Plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-lime-400 mb-2">Flight Configuration</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Altitude:</span>
                          <span>{currentMission.flightConfiguration.altitude}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Speed:</span>
                          <span>{currentMission.flightConfiguration.speed}m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{currentMission.flightConfiguration.estimatedDuration}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Waypoints:</span>
                          <span>{currentMission.flightConfiguration.route.length}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lime-400 mb-2">Data Collection</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Photo Points:</span>
                          <span>{currentMission.dataCollection.photography.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Video Segments:</span>
                          <span>{currentMission.dataCollection.videography.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sensor Readings:</span>
                          <span>{currentMission.dataCollection.sensors.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Investigations:</span>
                          <span>{currentMission.dataCollection.investigations.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-lime-400 mb-2">Safety Parameters</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-2 bg-lime-500/10 rounded border border-lime-500/20">
                        <Wind className="w-4 h-4 text-lime-400 mx-auto mb-1" />
                        <div>Max Wind</div>
                        <div className="font-semibold">{currentMission.safetyParameters.maxWindSpeed} m/s</div>
                      </div>
                      <div className="text-center p-2 bg-lime-500/10 rounded border border-lime-500/20">
                        <Eye className="w-4 h-4 text-lime-400 mx-auto mb-1" />
                        <div>Min Visibility</div>
                        <div className="font-semibold">{currentMission.safetyParameters.minVisibility}m</div>
                      </div>
                      <div className="text-center p-2 bg-lime-500/10 rounded border border-lime-500/20">
                        <Thermometer className="w-4 h-4 text-lime-400 mx-auto mb-1" />
                        <div>Max Temp</div>
                        <div className="font-semibold">{currentMission.safetyParameters.maxTemperature}°C</div>
                      </div>
                      <div className="text-center p-2 bg-lime-500/10 rounded border border-lime-500/20">
                        <Shield className="w-4 h-4 text-lime-400 mx-auto mb-1" />
                        <div>Emergency Zones</div>
                        <div className="font-semibold">{currentMission.safetyParameters.emergencyLandingZones.length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Execute Mission
                    </Button>
                    <Button variant="outline" className="border-lime-500/30">
                      <Settings className="w-4 h-4 mr-2" />
                      Modify
                    </Button>
                    <Button variant="outline" className="border-lime-500/30">
                      <Square className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="glass-card border-lime-500/30">
              <CardContent className="text-center py-8">
                <Brain className="w-16 h-16 text-lime-400/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Active Mission</h3>
                <p className="text-gray-400 mb-4">
                  Generate an AI mission to see the current mission details here.
                </p>
                <Button onClick={() => document.querySelector('[data-value="planning"]')?.click()}>
                  Go to Mission Planning
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {aiStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-card border-lime-500/30">
                <CardHeader>
                  <CardTitle className="gradient-text">Mission Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Missions:</span>
                      <span className="font-semibold">{aiStats.totalMissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Autonomous Missions:</span>
                      <span className="font-semibold">{aiStats.autonomousMissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Flight Time:</span>
                      <span className="font-semibold">{aiStats.averageFlightTime.toFixed(1)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-semibold">{aiStats.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-lime-500/30">
                <CardHeader>
                  <CardTitle className="gradient-text">AI Learning Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Decision Accuracy</span>
                        <span>{(aiStats.aiLearningProgress.decisionAccuracy * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={aiStats.aiLearningProgress.decisionAccuracy * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Route Optimization</span>
                        <span>{(aiStats.aiLearningProgress.routeOptimization * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={aiStats.aiLearningProgress.routeOptimization * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Weather Prediction</span>
                        <span>{(aiStats.aiLearningProgress.weatherPrediction * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={aiStats.aiLearningProgress.weatherPrediction * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="glass-card border-lime-500/30">
              <CardContent className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-lime-400/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Analytics Data</h3>
                <p className="text-gray-400">
                  AI statistics will appear here after missions are completed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card className="glass-card border-lime-500/30">
            <CardHeader>
              <CardTitle className="gradient-text">AI System Testing</CardTitle>
              <CardDescription>
                Test AI capabilities and verify system functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-lime-500/10 rounded-lg border border-lime-500/20">
                  <h4 className="font-semibold text-lime-400 mb-2">AI Capabilities Test</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Verify that all AI models are functioning correctly
                  </p>
                  <Button onClick={testAICapabilities} className="w-full">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Run AI Test
                  </Button>
                </div>

                <div className="p-4 bg-lime-500/10 rounded-lg border border-lime-500/20">
                  <h4 className="font-semibold text-lime-400 mb-2">System Health</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>AI Models:</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Database:</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">Connected</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>WebSocket:</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">Ready</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="font-semibold text-blue-400 mb-2">AI Model Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  {['CropHealthAI', 'WeatherAI', 'TerrainAI', 'DecisionAI', 'ComputerVisionAI'].map((model) => (
                    <div key={model} className="text-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                      <span className="text-gray-300">{model}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIMissionPlanner;
