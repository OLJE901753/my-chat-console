import { 
  Droplets, 
  Thermometer, 
  Zap, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  MapPin,
  TreePine,
  Bug
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SensorData {
  id: string;
  name: string;
  type: 'soil' | 'weather' | 'tree' | 'pest';
  status: 'online' | 'offline' | 'warning';
  value: number;
  unit: string;
  location: string;
  lastUpdate: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SensorNetwork = () => {
  const [sensors] = useState<SensorData[]>([
    {
      id: 'soil-01',
      name: 'Soil Moisture Zone A',
      type: 'soil',
      status: 'online',
      value: 68,
      unit: '%',
      location: 'Apple Orchard North',
      lastUpdate: '2 mins ago',
      icon: Droplets
    },
    {
      id: 'soil-02',
      name: 'NPK Sensor Zone B',
      type: 'soil',
      status: 'online',
      value: 142,
      unit: 'ppm',
      location: 'Pear Orchard South',
      lastUpdate: '5 mins ago',
      icon: Zap
    },
    {
      id: 'tree-01',
      name: 'Sap Flow Monitor',
      type: 'tree',
      status: 'warning',
      value: 78,
      unit: 'ml/hr',
      location: 'Apple Tree Row 3',
      lastUpdate: '1 min ago',
      icon: TreePine
    },
    {
      id: 'pest-01',
      name: 'Smart Trap Alpha',
      type: 'pest',
      status: 'online',
      value: 12,
      unit: 'catches',
      location: 'Perimeter West',
      lastUpdate: '30 mins ago',
      icon: Bug
    },
    {
      id: 'weather-01',
      name: 'Microclimate Station',
      type: 'weather',
      status: 'online',
      value: 72,
      unit: '°F',
      location: 'Central Station',
      lastUpdate: '1 min ago',
      icon: Thermometer
    }
  ]);

  const [networkStats] = useState({
    totalSensors: 24,
    onlineSensors: 22,
    dataPoints: 15847,
    coverage: 94
  });

  // status color computed directly where needed

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'soil': return 'bg-accent-orange/10 text-accent-orange border-accent-orange/20';
      case 'weather': return 'bg-accent-blue/10 text-accent-blue border-accent-blue/20';
      case 'tree': return 'bg-primary/10 text-primary border-primary/20';
      case 'pest': return 'bg-accent-purple/10 text-accent-purple border-accent-purple/20';
      default: return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Sensors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {networkStats.onlineSensors}/{networkStats.totalSensors}
            </div>
            <Progress value={(networkStats.onlineSensors / networkStats.totalSensors) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-blue">
              {networkStats.dataPoints.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Collected today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-orange">
              {networkStats.coverage}%
            </div>
            <Progress value={networkStats.coverage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Network Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span className="text-lg font-semibold">Excellent</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">All systems optimal</p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Sensors */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Status</CardTitle>
          <CardDescription>Real-time monitoring of all farm sensors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sensors.map((sensor) => {
              const IconComponent = sensor.icon;
              return (
                <div key={sensor.id} className="border border-border rounded-lg p-4 bg-gradient-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{sensor.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getTypeColor(sensor.type)}>
                            {sensor.type}
                          </Badge>
                          {getStatusIcon(sensor.status)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {sensor.value}
                        <span className="text-sm text-muted-foreground ml-1">
                          {sensor.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{sensor.location}</span>
                    </div>
                    <span>{sensor.lastUpdate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Network Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Network Management</CardTitle>
          <CardDescription>Monitor and control the sensor network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>Calibrate All Sensors</Button>
            <Button variant="outline">Generate Report</Button>
            <Button variant="outline">Export Data</Button>
            <Button variant="outline">Add New Sensor</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SensorNetwork;