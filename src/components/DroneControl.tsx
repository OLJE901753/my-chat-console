import React, { useState, useEffect, useRef } from 'react';
import { useRealtime } from '@/components/RealtimeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Camera, 
  Video, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Play,
  Square,
  AlertTriangle,
  Battery,
  Thermometer,
  Navigation,
  MapPin,
  Settings,
  History,
  Plus,
  Save,
  Loader2,
  Brain,
  Zap,
  Eye,
  Wind,
  Sun,
  Cloud,
  Target,
  Route,
  Shield,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DroneStatus {
  connected: boolean;
  battery: number;
  altitude: number;
  speed: number;
  temperature: number;
  position: { x: number; y: number; z: number };
  orientation: { yaw: number; pitch: number; roll: number };
  mission: any;
  lastUpdate: string;
  weatherConditions: {
    windSpeed: number;
    windDirection: number;
    visibility: number;
    precipitation: number;
    temperature: number;
    humidity: number;
  };
  safetyStatus: {
    obstacleDetected: boolean;
    geofenceViolation: boolean;
    lowBattery: boolean;
    weatherWarning: boolean;
    emergencyMode: boolean;
  };
}

interface Mission {
  id: string;
  name: string;
  description: string;
  waypoints: any[];
  status: string;
  type: 'surveillance' | 'cinematic' | 'mapping' | 'inspection' | 'content';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
  weatherConditions: any;
  safetyChecks: any;
  confidence: number;
}

interface AIDroneMission {
  id: string;
  name: string;
  type: 'cinematic' | 'surveillance' | 'content_creation' | 'emergency';
  target: string;
  duration: number;
  waypoints: any[];
  cameraSettings: any;
  movementPattern: string;
  lightingOptimization: boolean;
  obstacleAvoidance: boolean;
  weatherAdaptation: boolean;
  confidence: number;
  status: 'planned' | 'executing' | 'completed' | 'failed';
}

const DroneControl: React.FC = () => {
  const { toast } = useToast();
  const { connected, send, subscribe } = useRealtime();
  const [droneStatus, setDroneStatus] = useState<DroneStatus>({
    connected: false,
    battery: 0,
    altitude: 0,
    speed: 0,
    temperature: 25,
    position: { x: 0, y: 0, z: 0 },
    orientation: { yaw: 0, pitch: 0, roll: 0 },
    mission: null,
    lastUpdate: new Date().toISOString(),
    weatherConditions: {
      windSpeed: 0,
      windDirection: 0,
      visibility: 10000,
      precipitation: 0,
      temperature: 25,
      humidity: 60
    },
    safetyStatus: {
      obstacleDetected: false,
      geofenceViolation: false,
      lowBattery: false,
      weatherWarning: false,
      emergencyMode: false
    }
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  
  // AI Mission Planning
  const [aiMissions, setAiMissions] = useState<AIDroneMission[]>([]);
  const [selectedAIMission, setSelectedAIMission] = useState<AIDroneMission | null>(null);
  const [aiPlanningMode, setAiPlanningMode] = useState<'automatic' | 'manual' | 'hybrid'>('automatic');
  
  // Movement controls
  const [moveDistance, setMoveDistance] = useState(50);
  const [rotateDegrees, setRotateDegrees] = useState(90);
  const [droneSpeed, setDroneSpeed] = useState(50);
  
  // AI Settings
  const [aiSettings, setAiSettings] = useState({
    obstacleAvoidance: true,
    weatherAdaptation: true,
    cinematicMode: true,
    autoReturnHome: true,
    emergencyProcedures: true,
    geofencing: true,
    maxAltitude: 120,
    maxDistance: 500,
    safetyMargin: 20
  });
  
  // Mission planning
  const [newMission, setNewMission] = useState({
    name: '',
    description: '',
    waypoints: [],
    type: 'surveillance' as const,
    priority: 'medium' as const
  });
  
  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use the shared realtime connection
  useEffect(() => {
    setIsConnected(connected);
    
    if (connected) {
      joinTelemetryRoom();
    }
  }, [connected]);

  // Subscribe to drone-related messages
  useEffect(() => {
    if (connected) {
      subscribe('drone_telemetry', handleWebSocketMessage);
      subscribe('mission_progress', handleWebSocketMessage);
      subscribe('agent_status', handleWebSocketMessage);
    }
  }, [connected, subscribe]);

  const handleWebSocketMessage = (data: any) => {
    // Handle different message types from the realtime service
    if (data.type === 'drone_telemetry') {
      setDroneStatus(prev => ({
        ...prev,
        ...data,
        lastUpdate: new Date().toISOString()
      }));
    } else if (data.type === 'mission_progress') {
      setActiveMission(data);
    } else if (data.type === 'agent_status') {
      // Handle agent status updates if needed
      console.log('Agent status update:', data);
    }
    
    // Legacy message handling for backward compatibility
    switch (data.type) {
      case 'telemetry':
        setDroneStatus(prev => ({
          ...prev,
          ...data.telemetry,
          lastUpdate: new Date().toISOString()
        }));
        break;
      case 'mission_update':
        setActiveMission(data.mission);
        break;
      case 'safety_alert':
        handleSafetyAlert(data.alert);
        break;
      case 'weather_update':
        setDroneStatus(prev => ({
          ...prev,
          weatherConditions: data.weather
        }));
        break;
      case 'obstacle_detected':
        setDroneStatus(prev => ({
          ...prev,
          safetyStatus: {
            ...prev.safetyStatus,
            obstacleDetected: true
          }
        }));
        break;
    }
  };

  const handleSafetyAlert = (alert: any) => {
    toast({
      title: "Safety Alert",
      description: alert.message,
      variant: alert.severity === 'high' ? 'destructive' : 'default'
    });
  };

  const joinTelemetryRoom = () => {
    if (connected) {
      send('join_room', {
        room: 'drone_telemetry'
      });
    }
  };

  // AI Mission Planning Functions
  const generateAIMission = async (type: string, target: string) => {
    setIsLoading(true);
    try {
      // Simulate AI mission generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newAIMission: AIDroneMission = {
        id: `ai_mission_${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Mission - ${target}`,
        type: type as any,
        target,
        duration: Math.floor(15 + Math.random() * 45),
        waypoints: generateAIWaypoints(target, type),
        cameraSettings: generateCameraSettings(type),
        movementPattern: getMovementPattern(type),
        lightingOptimization: true,
        obstacleAvoidance: true,
        weatherAdaptation: true,
        confidence: 0.85 + Math.random() * 0.15,
        status: 'planned'
      };
      
      setAiMissions(prev => [...prev, newAIMission]);
      toast({
        title: "AI Mission Generated",
        description: `New ${type} mission created for ${target}`
      });
    } catch (error) {
      toast({
        title: "Mission Generation Failed",
        description: "Could not generate AI mission",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIWaypoints = (target: string, type: string) => {
    const baseCoords = { lat: 59.9139, lng: 10.7522 };
    const waypoints = [];
    
    if (type === 'cinematic') {
      waypoints.push(
        { lat: baseCoords.lat, lng: baseCoords.lng, alt: 30, action: 'takeoff', camera: 'down' },
        { lat: baseCoords.lat + 0.001, lng: baseCoords.lng, alt: 60, action: 'rise', camera: 'forward' },
        { lat: baseCoords.lat + 0.002, lng: baseCoords.lng + 0.001, alt: 80, action: 'orbit', camera: 'orbital' },
        { lat: baseCoords.lat + 0.003, lng: baseCoords.lng + 0.002, alt: 70, action: 'pan', camera: 'side' },
        { lat: baseCoords.lat, lng: baseCoords.lng, alt: 40, action: 'land', camera: 'down' }
      );
    } else if (type === 'content_creation') {
      waypoints.push(
        { lat: baseCoords.lat, lng: baseCoords.lng, alt: 25, action: 'takeoff', camera: 'down' },
        { lat: baseCoords.lat + 0.0005, lng: baseCoords.lng, alt: 50, action: 'survey', camera: 'forward' },
        { lat: baseCoords.lat + 0.001, lng: baseCoords.lng + 0.0005, alt: 75, action: 'capture', camera: 'angled' },
        { lat: baseCoords.lat + 0.0015, lng: baseCoords.lng + 0.001, alt: 60, action: 'final', camera: 'hero' },
        { lat: baseCoords.lat, lng: baseCoords.lng, alt: 30, action: 'land', camera: 'down' }
      );
    }
    
    return waypoints.map((wp, index) => ({
      ...wp,
      id: `wp_${index}`,
      order: index,
      estimatedTime: index * 2
    }));
  };

  const generateCameraSettings = (type: string) => {
    const settings = {
      cinematic: {
        resolution: '4K',
        frameRate: 60,
        iso: 100,
        shutterSpeed: '1/120',
        whiteBalance: 'auto',
        focus: 'auto'
      },
      content_creation: {
        resolution: '4K',
        frameRate: 30,
        iso: 200,
        shutterSpeed: '1/60',
        whiteBalance: 'daylight',
        focus: 'manual'
      },
      surveillance: {
        resolution: '1080p',
        frameRate: 30,
        iso: 400,
        shutterSpeed: '1/30',
        whiteBalance: 'auto',
        focus: 'auto'
      }
    };
    
    return settings[type as keyof typeof settings] || settings.surveillance;
  };

  const getMovementPattern = (type: string) => {
    const patterns = {
      cinematic: 'Smooth, graceful movements with dramatic angles',
      content_creation: 'Dynamic movements optimized for social media',
      surveillance: 'Systematic grid pattern for thorough coverage',
      inspection: 'Precise positioning for detailed examination'
    };
    
    return patterns[type as keyof typeof patterns] || patterns.surveillance;
  };

  const executeAIMission = async (mission: AIDroneMission) => {
    setIsLoading(true);
    try {
      setSelectedAIMission(mission);
      mission.status = 'executing';
      
      // Simulate mission execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      mission.status = 'completed';
      setSelectedAIMission(null);
      
      toast({
        title: "AI Mission Completed",
        description: `${mission.name} finished successfully`
      });
      
      // Add to completed missions
      setMissions(prev => [...prev, {
        id: mission.id,
        name: mission.name,
        description: `AI-generated ${mission.type} mission`,
        waypoints: mission.waypoints,
        status: 'completed',
        type: mission.type as any,
        priority: 'medium',
        estimatedDuration: mission.duration,
        weatherConditions: droneStatus.weatherConditions,
        safetyChecks: { passed: true },
        confidence: mission.confidence
      }]);
      
    } catch (error) {
      mission.status = 'failed';
      toast({
        title: "Mission Failed",
        description: "AI mission execution failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced safety functions
  const emergencyStop = () => {
    if (connected) {
      send('emergency_stop', {
        droneId: 'drone_01'
      });
    }
    
    setDroneStatus(prev => ({
      ...prev,
      safetyStatus: {
        ...prev.safetyStatus,
        emergencyMode: true
      }
    }));
    
    toast({
      title: "Emergency Stop",
      description: "Drone emergency stop executed",
      variant: "destructive"
    });
  };

  const returnToHome = () => {
    if (connected) {
      send('return_home', {
        droneId: 'drone_01'
      });
    }
    
    toast({
      title: "Return to Home",
      description: "Drone returning to home position"
    });
  };

  // Basic flight control functions
  const handleTakeoff = () => {
    if (connected) {
      send('takeoff', {
        droneId: 'drone_01'
      });
    }
    
    toast({
      title: "Takeoff",
      description: "Drone taking off"
    });
  };

  const handleLand = () => {
    if (connected) {
      send('land', {
        droneId: 'drone_01'
      });
    }
    
    toast({
      title: "Landing",
      description: "Drone landing"
    });
  };

  const handleEmergency = () => {
    emergencyStop();
  };

  const handleMove = (direction: string) => {
    if (connected) {
      send('move', {
        direction,
        distance: moveDistance,
        droneId: 'drone_01'
      });
    }
    
    toast({
      title: "Movement",
      description: `Drone moving ${direction}`
    });
  };

  const handleRotate = () => {
    if (connected) {
      send('rotate', {
        degrees: rotateDegrees,
        droneId: 'drone_01'
      });
    }
    
    toast({
      title: "Rotation",
      description: `Drone rotating ${rotateDegrees} degrees`
    });
  };

  const handleSetSpeed = () => {
    if (connected) {
      send('set_speed', {
        speed: droneSpeed,
        droneId: 'drone_01'
      });
    }
    
    toast({
      title: "Speed Set",
      description: `Drone speed set to ${droneSpeed} cm/s`
    });
  };

  // Execute drone command
  const executeCommand = async (command: string, params: any = {}) => {
    if (!isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect to the drone first',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (connected) {
        send('drone-command', {
          command,
          params
        });
      } else {
        // Fallback to HTTP API
        const response = await fetch(`http://localhost:3001/api/drone/command`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command, params }),
        });
        
        const result = await response.json();
        if (result.success) {
          toast({
            title: 'Command Executed',
            description: result.data.message,
          });
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      toast({
        title: 'Command Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Flight controls - using the detailed implementations above

  // Camera controls
  const handleCapturePhoto = () => executeCommand('capture_photo');
  const handleStartRecording = () => executeCommand('start_recording');
  const handleStopRecording = () => executeCommand('stop_recording');

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load missions
        const missionsResponse = await fetch('http://localhost:3001/api/mission');
        if (missionsResponse.ok) {
          const missionsData = await missionsResponse.json();
          setMissions(missionsData.data || []);
        }
        
        // Load command history
        const commandsResponse = await fetch('http://localhost:3001/api/drone/commands?limit=50');
        if (commandsResponse.ok) {
          const commandsData = await commandsResponse.json();
          setCommandHistory(commandsData.data || []);
        }
        
        // Load photos
        const photosResponse = await fetch('http://localhost:3001/api/drone/photos?limit=20');
        if (photosResponse.ok) {
          const photosData = await photosResponse.json();
          setPhotos(photosData.data || []);
        }
        
        // Load recordings
        const recordingsResponse = await fetch('http://localhost:3001/api/drone/recordings?limit=20');
        if (recordingsResponse.ok) {
          const recordingsData = await recordingsResponse.json();
          setRecordings(recordingsData.data || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (isConnected) {
      loadData();
    }
  }, [isConnected]);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="gradient-text flex items-center gap-2">
            <Navigation className="h-5 w-5 text-lime-400" />
            Drone Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={isConnected ? "secondary" : "destructive"} className={isConnected ? "bg-green-500/20 text-green-400" : ""}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <span className="text-sm">
                Last Update: {droneStatus.lastUpdate ? new Date(droneStatus.lastUpdate).toLocaleTimeString() : 'Never'}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-lime-500/30"
              onClick={() => setIsConnected(!isConnected)}
            >
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="control" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="control">Flight Control</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="ai-missions">AI Missions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Flight Control Tab */}
        <TabsContent value="control" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Controls */}
            <Card className="glass-card border-lime-500/20">
              <CardHeader>
                <CardTitle className="gradient-text">Basic Flight Controls</CardTitle>
                <CardDescription>Essential drone operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleTakeoff}
                    disabled={!isConnected || isLoading}
                    className="flex-1 bg-lime-600 hover:bg-lime-700"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                    Takeoff
                  </Button>
                  <Button 
                    onClick={handleLand} 
                    disabled={!isConnected || isLoading}
                    className="flex-1 bg-lime-600 hover:bg-lime-700"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" />}
                    Land
                  </Button>
                </div>
                <Button 
                  onClick={handleEmergency} 
                  disabled={!isConnected || isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  Emergency Stop
                </Button>
              </CardContent>
            </Card>

            {/* Movement Controls */}
            <Card className="glass-card border-lime-500/20">
              <CardHeader>
                <CardTitle className="gradient-text">Movement Controls</CardTitle>
                <CardDescription>Precise drone positioning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="moveDistance">Movement Distance (cm)</Label>
                  <Input
                    id="moveDistance"
                    type="number"
                    value={moveDistance}
                    onChange={(e) => setMoveDistance(Number(e.target.value))}
                    min="10"
                    max="500"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    onClick={() => handleMove('up')} 
                    disabled={!isConnected || isLoading}
                    variant="outline"
                    className="border-lime-500/30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleMove('down')} 
                    disabled={!isConnected || isLoading}
                    variant="outline"
                    className="border-lime-500/30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleMove('forward')} 
                    disabled={!isConnected || isLoading}
                    variant="outline"
                    className="border-lime-500/30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleMove('back')} 
                    disabled={!isConnected || isLoading}
                    variant="outline"
                    className="border-lime-500/30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleMove('left')} 
                    disabled={!isConnected || isLoading}
                    variant="outline"
                    className="border-lime-500/30"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => handleMove('right')} 
                    disabled={!isConnected || isLoading}
                    variant="outline"
                    className="border-lime-500/30"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rotateDegrees">Rotation (degrees)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="rotateDegrees"
                      type="number"
                      value={rotateDegrees}
                      onChange={(e) => setRotateDegrees(Number(e.target.value))}
                      min="-180"
                      max="180"
                    />
                    <Button 
                      onClick={handleRotate} 
                      disabled={!isConnected || isLoading}
                      className="bg-lime-600 hover:bg-lime-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="droneSpeed">Speed (cm/s)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="droneSpeed"
                      type="number"
                      value={droneSpeed}
                      onChange={(e) => setDroneSpeed(Number(e.target.value))}
                      min="10"
                      max="100"
                    />
                    <Button 
                      onClick={handleSetSpeed} 
                      disabled={!isConnected || isLoading}
                      className="bg-lime-600 hover:bg-lime-700"
                    >
                      Set
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Mission Planning Tab */}
        <TabsContent value="ai-missions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Mission Generator */}
            <Card className="glass-card border-blue-500/20 lg:col-span-1">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Mission Generator
                </CardTitle>
                <CardDescription>
                  Generate intelligent drone missions for optimal content capture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="missionType">Mission Type</Label>
                  <select
                    id="missionType"
                    className="w-full p-2 rounded-md bg-background border border-input"
                    onChange={(e) => setNewMission(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="cinematic">Cinematic</option>
                    <option value="content_creation">Content Creation</option>
                    <option value="surveillance">Surveillance</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetArea">Target Area</Label>
                  <select
                    id="targetArea"
                    className="w-full p-2 rounded-md bg-background border border-input"
                  >
                    <option value="apple_orchard">Apple Orchard</option>
                    <option value="pear_orchard">Pear Orchard</option>
                    <option value="cherry_orchard">Cherry Orchard</option>
                    <option value="vineyard">Vineyard</option>
                    <option value="greenhouse">Greenhouse</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiPlanningMode">AI Planning Mode</Label>
                  <select
                    id="aiPlanningMode"
                    className="w-full p-2 rounded-md bg-background border border-input"
                    value={aiPlanningMode}
                    onChange={(e) => setAiPlanningMode(e.target.value as any)}
                  >
                    <option value="automatic">Fully Automatic</option>
                    <option value="hybrid">Hybrid (AI + Manual)</option>
                    <option value="manual">Manual Override</option>
                  </select>
                </div>

                <Button 
                  onClick={() => generateAIMission(newMission.type, 'apple_orchard')}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4" />
                  )}
                  Generate AI Mission
                </Button>
              </CardContent>
            </Card>

            {/* AI Mission Queue */}
            <Card className="glass-card border-purple-500/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  AI Mission Queue
                </CardTitle>
                <CardDescription>
                  Manage and execute AI-generated missions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiMissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No AI missions generated yet</p>
                    <p className="text-sm">Generate your first mission to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiMissions.map((mission) => (
                      <div key={mission.id} className="p-4 border border-border rounded-lg bg-card/50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{mission.name}</h4>
                            <p className="text-sm text-muted-foreground">{mission.type.replace('_', ' ')} • {mission.duration}min</p>
                          </div>
                          <Badge 
                            variant={mission.status === 'completed' ? 'default' : mission.status === 'executing' ? 'secondary' : 'outline'}
                            className={mission.status === 'completed' ? 'bg-green-500/20 text-green-400' : ''}
                          >
                            {mission.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Confidence:</span>
                            <div className="flex items-center gap-2">
                              <Progress value={mission.confidence * 100} className="flex-1" />
                              <span>{(mission.confidence * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Movement:</span>
                            <p className="text-xs">{mission.movementPattern}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {mission.status === 'planned' && (
                            <Button 
                              size="sm"
                              onClick={() => executeAIMission(mission)}
                              disabled={isLoading}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Play className="h-4 w-4" />
                              Execute
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedAIMission(mission)}
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Telemetry Tab */}
        <TabsContent value="telemetry" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="glass-card border-lime-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="gradient-text flex items-center gap-2 text-sm">
                  <Battery className="h-4 w-4" />
                  Battery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{droneStatus.battery}%</div>
                <Progress value={droneStatus.battery} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="glass-card border-lime-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="gradient-text flex items-center gap-2 text-sm">
                  <ArrowUp className="h-4 w-4" />
                  Altitude
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{droneStatus.altitude.toFixed(1)}m</div>
                <div className="text-xs text-muted-foreground">Above ground</div>
              </CardContent>
            </Card>

            <Card className="glass-card border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="gradient-text flex items-center gap-2 text-sm">
                  <Wind className="h-4 w-4" />
                  Weather
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{droneStatus.weatherConditions.windSpeed.toFixed(1)} m/s</div>
                <div className="text-xs text-muted-foreground">Wind • {droneStatus.weatherConditions.visibility/1000}km visibility</div>
              </CardContent>
            </Card>

            <Card className="glass-card border-lime-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="gradient-text flex items-center gap-2 text-sm">
                  <Navigation className="h-4 w-4" />
                  Speed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{droneStatus.speed} cm/s</div>
                <div className="text-xs text-muted-foreground">Current speed</div>
              </CardContent>
            </Card>

            <Card className="glass-card border-lime-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="gradient-text flex items-center gap-2 text-sm">
                  <Thermometer className="h-4 w-4" />
                  Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{droneStatus.temperature.toFixed(1)}°C</div>
                <div className="text-xs text-muted-foreground">Drone temp</div>
              </CardContent>
            </Card>

            <Card className="glass-card border-red-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="gradient-text flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  Safety Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {droneStatus.safetyStatus.obstacleDetected && (
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      Obstacle Detected
                    </div>
                  )}
                  {droneStatus.safetyStatus.weatherWarning && (
                    <div className="flex items-center gap-2 text-xs text-yellow-400">
                      <Cloud className="h-3 w-3" />
                      Weather Warning
                    </div>
                  )}
                  {droneStatus.safetyStatus.lowBattery && (
                    <div className="flex items-center gap-2 text-xs text-yellow-400">
                      <Battery className="h-3 w-3" />
                      Low Battery
                    </div>
                  )}
                  {!droneStatus.safetyStatus.obstacleDetected && !droneStatus.safetyStatus.weatherWarning && !droneStatus.safetyStatus.lowBattery && (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      All Systems OK
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-lime-500/20">
            <CardHeader>
              <CardTitle className="gradient-text">Position & Orientation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Position (x, y, z)</h4>
                  <div className="space-y-1 text-sm">
                    <div>X: {droneStatus.position.x.toFixed(2)}m</div>
                    <div>Y: {droneStatus.position.y.toFixed(2)}m</div>
                    <div>Z: {droneStatus.position.z.toFixed(2)}m</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Orientation (yaw, pitch, roll)</h4>
                  <div className="space-y-1 text-sm">
                    <div>Yaw: {droneStatus.orientation.yaw.toFixed(1)}°</div>
                    <div>Pitch: {droneStatus.orientation.pitch.toFixed(1)}°</div>
                    <div>Roll: {droneStatus.orientation.roll.toFixed(1)}°</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Camera Tab */}
        <TabsContent value="camera" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-lime-500/20">
              <CardHeader>
                <CardTitle className="gradient-text">Camera Controls</CardTitle>
                <CardDescription>Photo and video operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleCapturePhoto} 
                  disabled={!isConnected || isLoading}
                  className="w-full cta-button"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  Capture Photo
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleStartRecording} 
                    disabled={!isConnected || isLoading}
                    className="flex-1 bg-lime-600 hover:bg-lime-700"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Start Recording
                  </Button>
                  <Button 
                    onClick={handleStopRecording} 
                    disabled={!isConnected || isLoading}
                    variant="outline"
                    className="flex-1 border-lime-500/30"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                    Stop Recording
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-lime-500/20">
              <CardHeader>
                <CardTitle className="gradient-text">Live Feed</CardTitle>
                <CardDescription>Real-time camera view</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg border border-lime-500/20 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p>Camera feed will appear here</p>
                    <p className="text-sm">Connect to drone to view live feed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Missions Tab */}
        <TabsContent value="missions" className="space-y-4">
          <Card className="glass-card border-lime-500/20">
            <CardHeader>
              <CardTitle className="gradient-text">Mission Management</CardTitle>
              <CardDescription>Plan and execute automated flights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => {}} className="bg-lime-600 hover:bg-lime-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Mission
                </Button>
                <Button variant="outline" className="border-lime-500/30">
                  <Save className="h-4 w-4 mr-2" />
                  Save Mission
                </Button>
                <Button variant="outline" className="border-lime-500/30">
                  <History className="h-4 w-4 mr-2" />
                  Load Mission
                </Button>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p>Mission planner will be implemented here</p>
                <p className="text-sm">Create waypoints, set actions, and schedule flights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border-lime-500/20">
              <CardHeader>
                <CardTitle className="gradient-text">Command History</CardTitle>
                <CardDescription>Recent drone commands</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {commandHistory.length > 0 ? (
                    commandHistory.map((cmd, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="font-medium">{cmd.command}</div>
                        <div className="text-muted-foreground">
                          {new Date(cmd.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No commands executed yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-lime-500/20">
              <CardHeader>
                <CardTitle className="gradient-text">Media Library</CardTitle>
                <CardDescription>Photos and recordings</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="photos" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                    <TabsTrigger value="recordings">Recordings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="photos" className="mt-4">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {photos.length > 0 ? (
                        photos.map((photo, index) => (
                          <div key={index} className="p-2 bg-muted rounded text-sm">
                            <div className="font-medium">Photo {photo.id.slice(0, 8)}</div>
                            <div className="text-muted-foreground">
                              {new Date(photo.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No photos captured yet
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="recordings" className="mt-4">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recordings.length > 0 ? (
                        recordings.map((recording, index) => (
                          <div key={index} className="p-2 bg-muted rounded text-sm">
                            <div className="font-medium">Recording {recording.id.slice(0, 8)}</div>
                            <div className="text-muted-foreground">
                              {new Date(recording.start_time).toLocaleString()} - {Math.round(recording.duration / 1000)}s
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No recordings yet
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DroneControl;
