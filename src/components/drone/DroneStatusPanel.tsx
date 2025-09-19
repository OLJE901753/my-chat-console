import { 
  Battery, 
  Thermometer, 
  Gauge, 
  Navigation,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DroneStatus {
  connected: boolean;
  battery: number;
  altitude: number;
  speed: number;
  temperature: number;
  position: { x: number; y: number; z: number };
  orientation: { yaw: number; pitch: number; roll: number };
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

interface DroneStatusPanelProps {
  status: DroneStatus;
}

const DroneStatusPanel: React.FC<DroneStatusPanelProps> = ({ status }) => {
  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-500';
    if (battery > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSafetyStatus = () => {
    const issues = [];
    if (status.safetyStatus.obstacleDetected) issues.push('Obstacle Detected');
    if (status.safetyStatus.geofenceViolation) issues.push('Geofence Violation');
    if (status.safetyStatus.lowBattery) issues.push('Low Battery');
    if (status.safetyStatus.weatherWarning) issues.push('Weather Warning');
    if (status.safetyStatus.emergencyMode) issues.push('Emergency Mode');
    
    return issues.length === 0 ? 'All Systems Normal' : issues.join(', ');
  };

  const getSafetyColor = () => {
    if (status.safetyStatus.emergencyMode) return 'text-red-500';
    if (status.safetyStatus.obstacleDetected || status.safetyStatus.geofenceViolation) return 'text-orange-500';
    if (status.safetyStatus.lowBattery || status.safetyStatus.weatherWarning) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {status.connected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={status.connected ? 'default' : 'destructive'}>
            {status.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardContent>
      </Card>

      {/* Battery Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Battery className={`h-4 w-4 ${getBatteryColor(status.battery)}`} />
            Battery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={status.battery} className="h-2" />
            <p className={`text-sm font-medium ${getBatteryColor(status.battery)}`}>
              {status.battery}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Altitude */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Navigation className="h-4 w-4 text-blue-500" />
            Altitude
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{status.altitude}m</p>
          <p className="text-xs text-muted-foreground">
            Position: ({status.position.x.toFixed(1)}, {status.position.y.toFixed(1)}, {status.position.z.toFixed(1)})
          </p>
        </CardContent>
      </Card>

      {/* Speed & Temperature */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4 text-purple-500" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Speed:</span> {status.speed} m/s
            </p>
            <p className="text-sm flex items-center gap-1">
              <Thermometer className="h-3 w-3" />
              <span className="font-medium">Temp:</span> {status.temperature}°C
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Safety Status */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${getSafetyColor()}`} />
            Safety Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${getSafetyColor()}`}>
              {getSafetyStatus()}
            </p>
            <div className="text-xs text-muted-foreground">
              Last Update: {new Date(status.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Conditions */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Weather Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Wind Speed</p>
              <p className="font-medium">{status.weatherConditions.windSpeed} m/s</p>
            </div>
            <div>
              <p className="text-muted-foreground">Visibility</p>
              <p className="font-medium">{status.weatherConditions.visibility}m</p>
            </div>
            <div>
              <p className="text-muted-foreground">Temperature</p>
              <p className="font-medium">{status.weatherConditions.temperature}°C</p>
            </div>
            <div>
              <p className="text-muted-foreground">Humidity</p>
              <p className="font-medium">{status.weatherConditions.humidity}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(DroneStatusPanel);
