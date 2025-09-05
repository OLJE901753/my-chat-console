import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Battery, 
  Thermometer, 
  Droplets, 
  Wind,
  Zap,
  MapPin,
  Clock,
  AlertTriangle
} from 'lucide-react';
import React, { useState } from 'react';

import { useRealtime } from '@/components/RealtimeProvider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDroneTelemetry } from '@/hooks/useRealtimeData';
import { useSensorReadings } from '@/hooks/useRealtimeData';
import { useWeatherData } from '@/hooks/useRealtimeData';
import { useAgentStatus } from '@/hooks/useRealtimeData';
import { useMissionProgress } from '@/hooks/useRealtimeData';
import { useSystemAlerts } from '@/hooks/useRealtimeData';

const RealtimeDashboard: React.FC = () => {
  const { connected, lastActivity } = useRealtime();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="gradient-text">Real-time Dashboard</CardTitle>
              <CardDescription>
                Live data from your farm management system
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={connected ? "default" : "destructive"}
                className={connected ? "bg-green-500" : "bg-red-500"}
              >
                {connected ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
              {lastActivity && (
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{lastActivity.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="drone">Drone</TabsTrigger>
              <TabsTrigger value="sensors">Sensors</TabsTrigger>
              <TabsTrigger value="weather">Weather</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="missions">Missions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <OverviewTab />
            </TabsContent>

            <TabsContent value="drone" className="space-y-4">
              <DroneTab />
            </TabsContent>

            <TabsContent value="sensors" className="space-y-4">
              <SensorsTab />
            </TabsContent>

            <TabsContent value="weather" className="space-y-4">
              <WeatherTab />
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <AgentsTab />
            </TabsContent>

            <TabsContent value="missions" className="space-y-4">
              <MissionsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const OverviewTab: React.FC = () => {
  const { connected } = useRealtime();
  const { data: droneData, isLive: droneLive } = useDroneTelemetry();
  const { data: sensorData, isLive: sensorLive } = useSensorReadings();
  const { data: weatherData, isLive: weatherLive } = useWeatherData();
  const { data: agentData, isLive: agentLive } = useAgentStatus();
  const { data: alerts } = useSystemAlerts();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Connection Status */}
      <Card className="glass-card border-lime-500/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-lime-400" />
            <div>
              <p className="text-sm font-medium text-gray-300">Connection</p>
              <p className="text-xs text-gray-400">
                {connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drone Status */}
      <Card className="glass-card border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-gray-300">Drone</p>
              <p className="text-xs text-gray-400">
                {droneData?.status || 'Unknown'} {droneLive && '• Live'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensors Status */}
      <Card className="glass-card border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Droplets className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-gray-300">Sensors</p>
              <p className="text-xs text-gray-400">
                {sensorData?.location || 'Unknown'} {sensorLive && '• Live'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Status */}
      <Card className="glass-card border-cyan-500/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Wind className="h-5 w-5 text-cyan-400" />
            <div>
              <p className="text-sm font-medium text-gray-300">Weather</p>
              <p className="text-xs text-gray-400">
                {weatherData?.temperature ? `${weatherData.temperature}°C` : 'Unknown'} {weatherLive && '• Live'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Status */}
      <Card className="glass-card border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-sm font-medium text-gray-300">Agents</p>
              <p className="text-xs text-gray-400">
                {agentData?.status || 'Unknown'} {agentLive && '• Live'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="glass-card border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-gray-300">Alerts</p>
              <p className="text-xs text-gray-400">
                {Array.isArray(alerts) ? alerts.length : 0} active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DroneTab: React.FC = () => {
  const { data: droneData, isLive, lastUpdate } = useDroneTelemetry();

  if (!droneData) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No drone data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="glass-card border-blue-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Battery className="h-4 w-4" />
            <span>Battery</span>
            {isLive && <Badge variant="outline" className="text-xs">Live</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-400">{droneData.battery}%</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-green-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Altitude</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-400">{droneData.altitude}m</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-yellow-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Wind className="h-4 w-4" />
            <span>Speed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-yellow-400">{droneData.speed} km/h</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-red-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Thermometer className="h-4 w-4" />
            <span>Temperature</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-400">{droneData.temperature}°C</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Position</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300">
            Lat: {droneData.position.lat.toFixed(6)}
          </p>
          <p className="text-sm text-gray-300">
            Lng: {droneData.position.lng.toFixed(6)}
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card border-cyan-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="capitalize">
            {droneData.status}
          </Badge>
          {lastUpdate && (
            <p className="text-xs text-gray-400 mt-2">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SensorsTab: React.FC = () => {
  const { data: sensorData, isLive, lastUpdate } = useSensorReadings();

  if (!sensorData) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No sensor data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="glass-card border-green-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Droplets className="h-4 w-4" />
            <span>Moisture</span>
            {isLive && <Badge variant="outline" className="text-xs">Live</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-400">{sensorData.moisture}%</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-blue-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>pH Level</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-400">{sensorData.ph}</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-yellow-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>EC</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-yellow-400">{sensorData.electricalConductivity} mS/cm</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-red-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Thermometer className="h-4 w-4" />
            <span>Temperature</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-400">{sensorData.temperature}°C</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-cyan-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">NPK Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">N:</span>
            <span className="text-sm text-gray-300">{sensorData.npk.nitrogen} ppm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">P:</span>
            <span className="text-sm text-gray-300">{sensorData.npk.phosphorus} ppm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">K:</span>
            <span className="text-sm text-gray-300">{sensorData.npk.potassium} ppm</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Location</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300">{sensorData.location}</p>
          {lastUpdate && (
            <p className="text-xs text-gray-400 mt-2">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const WeatherTab: React.FC = () => {
  const { data: weatherData, isLive, lastUpdate } = useWeatherData();

  if (!weatherData) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No weather data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="glass-card border-red-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Thermometer className="h-4 w-4" />
            <span>Temperature</span>
            {isLive && <Badge variant="outline" className="text-xs">Live</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-400">{weatherData.temperature}°C</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-blue-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Droplets className="h-4 w-4" />
            <span>Humidity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-400">{weatherData.humidity}%</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-green-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Wind className="h-4 w-4" />
            <span>Wind Speed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-400">{weatherData.windSpeed} km/h</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-yellow-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Pressure</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-yellow-400">{weatherData.pressure} hPa</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-cyan-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>UV Index</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-cyan-400">{weatherData.uvIndex}</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Precipitation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-purple-400">{weatherData.precipitation} mm</p>
          {lastUpdate && (
            <p className="text-xs text-gray-400 mt-2">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AgentsTab: React.FC = () => {
  const { data: agentData, isLive } = useAgentStatus();

  if (!agentData) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No agent data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="glass-card border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Agent Status</span>
            {isLive && <Badge variant="outline" className="text-xs">Live</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">ID:</span>
              <span className="text-sm text-gray-300">{agentData.agentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Status:</span>
              <Badge variant="outline" className="capitalize">
                {agentData.status}
              </Badge>
            </div>
            {agentData.currentTask && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-300">Task:</span>
                <span className="text-sm text-gray-300">{agentData.currentTask}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-blue-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">CPU:</span>
              <span className="text-sm text-gray-300">{agentData.performance.cpu}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Memory:</span>
              <span className="text-sm text-gray-300">{agentData.performance.memory}%</span>
            </div>
            {agentData.errors.length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-red-400">Errors:</span>
                <span className="text-sm text-red-400">{agentData.errors.length}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MissionsTab: React.FC = () => {
  const { data: missionData, isLive, lastUpdate } = useMissionProgress();

  if (!missionData) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No mission data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="glass-card border-green-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Mission Progress</span>
            {isLive && <Badge variant="outline" className="text-xs">Live</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">ID:</span>
              <span className="text-sm text-gray-300">{missionData.missionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Status:</span>
              <Badge variant="outline" className="capitalize">
                {missionData.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Progress:</span>
              <span className="text-sm text-gray-300">{missionData.progress}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Waypoint:</span>
              <span className="text-sm text-gray-300">
                {missionData.currentWaypoint}/{missionData.totalWaypoints}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-yellow-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {missionData.estimatedCompletion && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-300">ETA:</span>
                <span className="text-sm text-gray-300">
                  {new Date(missionData.estimatedCompletion).toLocaleTimeString()}
                </span>
              </div>
            )}
            {missionData.errors.length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-red-400">Errors:</span>
                <span className="text-sm text-red-400">{missionData.errors.length}</span>
              </div>
            )}
            {lastUpdate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Last update:</span>
                <span className="text-sm text-gray-400">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeDashboard;
