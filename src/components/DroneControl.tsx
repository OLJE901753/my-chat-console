import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Loader2
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
}

interface Mission {
  id: string;
  name: string;
  description: string;
  waypoints: any[];
  status: string;
}

const DroneControl: React.FC = () => {
  const { toast } = useToast();
  const [droneStatus, setDroneStatus] = useState<DroneStatus>({
    connected: false,
    battery: 0,
    altitude: 0,
    speed: 0,
    temperature: 25,
    position: { x: 0, y: 0, z: 0 },
    orientation: { yaw: 0, pitch: 0, roll: 0 },
    mission: null,
    lastUpdate: new Date().toISOString()
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  
  // Movement controls
  const [moveDistance, setMoveDistance] = useState(50);
  const [rotateDegrees, setRotateDegrees] = useState(90);
  const [droneSpeed, setDroneSpeed] = useState(50);
  
  // Mission planning
  const [newMission, setNewMission] = useState({
    name: '',
    description: '',
    waypoints: []
  });
  
  const socketRef = useRef<WebSocket | null>(null);
  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3001');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        joinTelemetryRoom();
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect
        setTimeout(connectWebSocket, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      socketRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
      }
    };
  }, []);

  const joinTelemetryRoom = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'join',
        room: 'drone-telemetry'
      }));
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'drone-status':
        setDroneStatus(data.data);
        break;
      case 'command-result':
        handleCommandResult(data);
        break;
      case 'mission-update':
        handleMissionUpdate(data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleCommandResult = (data: any) => {
    if (data.success) {
      toast({
        title: 'Command Executed',
        description: data.result.message,
      });
      // Update command history
      setCommandHistory(prev => [{
        command: data.command,
        result: data.result,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 49)]);
    } else {
      toast({
        title: 'Command Failed',
        description: data.error,
        variant: 'destructive',
      });
    }
  };

  const handleMissionUpdate = (data: any) => {
    // Update mission status
    if (activeMission && activeMission.id === data.missionId) {
      setActiveMission(prev => prev ? { ...prev, ...data } : null);
    }
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
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'drone-command',
          command,
          params
        }));
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

  // Flight controls
  const handleTakeoff = () => executeCommand('takeoff');
  const handleLand = () => executeCommand('land');
  const handleEmergency = () => executeCommand('emergency');
  
  const handleMove = (direction: string) => {
    executeCommand('move', { direction, distance: moveDistance });
  };
  
  const handleRotate = () => {
    executeCommand('rotate', { degrees: rotateDegrees });
  };
  
  const handleSetSpeed = () => {
    executeCommand('set_speed', { speed: droneSpeed });
  };

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="control">Flight Control</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
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

        {/* Telemetry Tab */}
        <TabsContent value="telemetry" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
