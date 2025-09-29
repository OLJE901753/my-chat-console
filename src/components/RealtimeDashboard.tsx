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
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Trash2
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useRealtime } from '@/components/RealtimeProvider';
import { useWebSocket } from '@/services/websocketService';
import MetricsOverview from '@/components/dashboard/MetricsOverview';
import MetricsChart from '@/components/dashboard/MetricsChart';
import LogEntry from '@/components/dashboard/LogEntry';
import StatusChip from '@/components/ui/StatusChip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import WeatherDashboard from '@/components/WeatherDashboard';
import { useDroneTelemetry } from '@/hooks/useRealtimeData';
import { useSensorReadings } from '@/hooks/useRealtimeData';
import { useWeatherData } from '@/hooks/useRealtimeData';
import { useAgentStatus } from '@/hooks/useRealtimeData';
import { useMissionProgress } from '@/hooks/useRealtimeData';
import { useSystemAlerts } from '@/hooks/useRealtimeData';

const RealtimeDashboard: React.FC = () => {
  const { connected, lastActivity } = useRealtime();
  const [activeTab, setActiveTab] = useState('overview');
  
  // WebSocket integration
  const {
    state: wsState,
    logs,
    metrics,
    recentLogs,
    autoScroll,
    isPaused,
    toggleAutoScroll,
    togglePause,
    clearLogs,
    reconnect,
    scrollToBottom,
  } = useWebSocket();

  // Use WebSocket state for connection status
  const isConnected = wsState.isConnected;
  const connectionStatus = wsState.isConnecting ? 'connecting' : wsState.isConnected ? 'connected' : 'disconnected';

  const [showDetails, setShowDetails] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Generate trend data from logs
  const trendData = {
    success: logs.reduce((acc, log) => {
      const minute = new Date(log.timestamp).toISOString().slice(0, 16);
      if (!acc[minute]) {
        acc[minute] = { timestamp: minute, value: 0 };
      }
      if (log.level === 'success') {
        acc[minute].value++;
      }
      return acc;
    }, {} as Record<string, { timestamp: string; value: number }>),

    failure: logs.reduce((acc, log) => {
      const minute = new Date(log.timestamp).toISOString().slice(0, 16);
      if (!acc[minute]) {
        acc[minute] = { timestamp: minute, value: 0 };
      }
      if (log.level === 'error') {
        acc[minute].value++;
      }
      return acc;
    }, {} as Record<string, { timestamp: string; value: number }>),

    cost: logs.reduce((acc, log) => {
      const minute = new Date(log.timestamp).toISOString().slice(0, 16);
      if (!acc[minute]) {
        acc[minute] = { timestamp: minute, value: 0 };
      }
      if (log.cost) {
        acc[minute].value += log.cost;
      }
      return acc;
    }, {} as Record<string, { timestamp: string; value: number }>),
  };

  const successTrendData = Object.values(trendData.success);
  const failureTrendData = Object.values(trendData.failure);
  const costTrendData = Object.values(trendData.cost);

  // Handle scroll events
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
    setIsUserScrolling(!isAtBottom);
  };

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && !isUserScrolling) {
      scrollToBottom();
    }
  }, [logs.length, autoScroll, isPaused, isUserScrolling, scrollToBottom]);

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
                variant={isConnected ? "default" : "destructive"}
                className={isConnected ? "bg-green-500" : "bg-red-500"}
              >
                {wsState.isConnecting ? (
                  <>
                    <Activity className="h-3 w-3 mr-1 animate-spin" />
                    Connecting...
                  </>
                ) : isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Disconnected
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
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="experiments">Experiments</TabsTrigger>
              <TabsTrigger value="logs">Live Logs</TabsTrigger>
              <TabsTrigger value="drone">Drone</TabsTrigger>
              <TabsTrigger value="sensors">Sensors</TabsTrigger>
              <TabsTrigger value="weather">Weather</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="missions">Missions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <OverviewTab />
            </TabsContent>

            <TabsContent value="experiments" className="space-y-4">
              <div className="space-y-6">
                {/* WebSocket Connection Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <StatusChip
                      status={wsState.isConnecting ? 'running' : wsState.isConnected ? 'success' : 'error'}
                      label={wsState.isConnecting ? 'CONNECTING' : wsState.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                      size="md"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {logs.length} log entries
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAutoScroll}
                      className={autoScroll ? 'bg-blue-100 text-blue-800' : ''}
                    >
                      {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePause}
                      className={isPaused ? 'bg-red-100 text-red-800' : ''}
                    >
                      {isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPaused ? 'PAUSED' : 'LIVE'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearLogs}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reconnect}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Metrics Overview */}
                <MetricsOverview metrics={metrics} />

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MetricsChart
                    title="Success/Failure Trends"
                    data={successTrendData}
                    type="line"
                    color="#10B981"
                  />
                  <MetricsChart
                    title="Cost Over Time"
                    data={costTrendData}
                    type="line"
                    color="#F59E0B"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <div className="space-y-4">
                {/* Log Controls */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Real-Time Logs
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {logs.length} entries
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showDetails}
                        onChange={(e) => setShowDetails(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        Show Details
                      </span>
                    </label>
                  </div>
                </div>

                {/* Logs Container */}
                <div
                  ref={logsContainerRef}
                  id="logs-container"
                  className="h-96 overflow-y-auto p-4 space-y-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  onScroll={handleScroll}
                >
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <Activity className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2">No logs yet. Waiting for data...</p>
                      </div>
                    </div>
                  ) : (
                    recentLogs.map((log) => (
                      <LogEntry
                        key={log.id}
                        log={log}
                        showDetails={showDetails}
                      />
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="drone" className="space-y-4">
              <DroneTab />
            </TabsContent>

            <TabsContent value="sensors" className="space-y-4">
              <SensorsTab />
            </TabsContent>

            <TabsContent value="weather" className="space-y-4">
              <WeatherDashboard />
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
      <Card className="glass-card border-lime-500/30">
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
      <Card className="glass-card border-lime-500/30">
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
      <Card className="glass-card border-lime-500/30">
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
      <Card className="glass-card border-lime-500/30">
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
      <Card className="glass-card border-lime-500/30">
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
      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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

  // Use demo data if no real data is available
  const demoSensorData = {
    npk: { nitrogen: 142, phosphorus: 38, potassium: 165 },
    ph: 6.8,
    moisture: 68,
    electricalConductivity: 1.2,
    temperature: 18,
    humidity: 65,
    location: 'Field A - Apple Orchard',
    timestamp: Date.now(),
  };

  const displayData = sensorData || demoSensorData;

  if (!displayData) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">Loading sensor data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="glass-card border-lime-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Droplets className="h-4 w-4" />
            <span>Moisture</span>
            {isLive && <Badge variant="outline" className="text-xs">Live</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-400">{displayData.moisture}%</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-lime-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>pH Level</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-400">{displayData.ph}</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-lime-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>EC</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-yellow-400">{displayData.electricalConductivity} mS/cm</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-lime-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Thermometer className="h-4 w-4" />
            <span>Temperature</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-400">{displayData.temperature}°C</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-lime-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">NPK Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">N:</span>
            <span className="text-sm text-gray-300">{displayData.npk.nitrogen} ppm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">P:</span>
            <span className="text-sm text-gray-300">{displayData.npk.phosphorus} ppm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-300">K:</span>
            <span className="text-sm text-gray-300">{displayData.npk.potassium} ppm</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-lime-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Location</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300">{displayData.location}</p>
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
      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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
      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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
      <Card className="glass-card border-lime-500/30">
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

      <Card className="glass-card border-lime-500/30">
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
