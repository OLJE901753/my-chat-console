import { 
  Droplets, 
  Timer, 
  Zap,
  Settings,
  Play,
  Pause,
  Calendar,
  TrendingUp,
  Thermometer,
  Cloud
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

interface IrrigationZone {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'paused' | 'off';
  soilMoisture: number;
  targetMoisture: number;
  flowRate: number;
  pressure: number;
  lastWatering: string;
  nextScheduled: string;
  efficiency: number;
  autoMode: boolean;
}

const SmartIrrigation = () => {
  const [zones, setZones] = useState<IrrigationZone[]>([
    {
      id: 'zone-01',
      name: 'Apple Orchard North',
      status: 'active',
      soilMoisture: 45,
      targetMoisture: 70,
      flowRate: 15.2,
      pressure: 32,
      lastWatering: '2 hours ago',
      nextScheduled: 'In progress',
      efficiency: 94,
      autoMode: true
    },
    {
      id: 'zone-02',
      name: 'Pear Orchard South',
      status: 'scheduled',
      soilMoisture: 78,
      targetMoisture: 75,
      flowRate: 0,
      pressure: 30,
      lastWatering: '6 hours ago',
      nextScheduled: '2:30 PM',
      efficiency: 89,
      autoMode: true
    },
    {
      id: 'zone-03',
      name: 'Young Trees Section',
      status: 'paused',
      soilMoisture: 62,
      targetMoisture: 80,
      flowRate: 0,
      pressure: 28,
      lastWatering: '12 hours ago',
      nextScheduled: 'Manual override',
      efficiency: 91,
      autoMode: false
    },
    {
      id: 'zone-04',
      name: 'Greenhouse Area',
      status: 'off',
      soilMoisture: 85,
      targetMoisture: 85,
      flowRate: 0,
      pressure: 0,
      lastWatering: '18 hours ago',
      nextScheduled: 'Tomorrow 6:00 AM',
      efficiency: 96,
      autoMode: true
    }
  ]);

  const [systemStats] = useState({
    totalWaterUsed: 2847,
    waterSaved: 432,
    avgEfficiency: 92,
    activeSprinklers: 18,
    systemPressure: 31,
    weatherFactor: 'Optimal'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'scheduled': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'paused': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'off': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />;
      case 'scheduled': return <Timer className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'off': return <Settings className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const toggleAutoMode = (zoneId: string) => {
    setZones(zones.map(zone => 
      zone.id === zoneId 
        ? { ...zone, autoMode: !zone.autoMode }
        : zone
    ));
  };

  const getMoistureStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return { status: 'optimal', color: 'text-green-500' };
    if (percentage >= 70) return { status: 'good', color: 'text-blue-500' };
    if (percentage >= 50) return { status: 'low', color: 'text-yellow-500' };
    return { status: 'critical', color: 'text-red-500' };
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Water Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {systemStats.totalWaterUsed}
            </div>
            <p className="text-sm text-muted-foreground">gallons today</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Water Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {systemStats.waterSaved}
            </div>
            <p className="text-sm text-muted-foreground">gallons vs manual</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-blue">
              {systemStats.avgEfficiency}%
            </div>
            <Progress value={systemStats.avgEfficiency} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-orange">
              {zones.filter(z => z.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground">of {zones.length} zones</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pressure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-purple">
              {systemStats.systemPressure}
            </div>
            <p className="text-sm text-muted-foreground">PSI</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Weather</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Optimal</span>
            </div>
            <p className="text-sm text-muted-foreground">for irrigation</p>
          </CardContent>
        </Card>
      </div>

      {/* Zone Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Irrigation Zones</CardTitle>
          <CardDescription>AI-controlled irrigation system with zone management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {zones.map((zone) => {
              const moistureStatus = getMoistureStatus(zone.soilMoisture, zone.targetMoisture);
              
              return (
                <div key={zone.id} className="border border-border rounded-lg p-6 bg-gradient-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{zone.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(zone.status)}>
                          {getStatusIcon(zone.status)}
                          <span className="ml-1">{zone.status}</span>
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={zone.autoMode} 
                            onCheckedChange={() => toggleAutoMode(zone.id)}
                          />
                          <span className="text-sm text-muted-foreground">Auto</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Soil Moisture */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Soil Moisture</span>
                        <span className={`text-sm font-bold ${moistureStatus.color}`}>
                          {zone.soilMoisture}% / {zone.targetMoisture}%
                        </span>
                      </div>
                      <Progress value={(zone.soilMoisture / zone.targetMoisture) * 100} className="h-2" />
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-xs font-medium">Flow Rate</span>
                        </div>
                        <div className="text-sm font-bold">{zone.flowRate} GPM</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-xs font-medium">Pressure</span>
                        </div>
                        <div className="text-sm font-bold">{zone.pressure} PSI</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs font-medium">Efficiency</span>
                        </div>
                        <div className="text-sm font-bold">{zone.efficiency}%</div>
                      </div>
                    </div>

                    {/* Timing Info */}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Last: {zone.lastWatering}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          <span>Next: {zone.nextScheduled}</span>
                        </div>
                      </div>
                    </div>

                    {/* Zone Controls */}
                    <div className="flex gap-2 pt-2">
                      {zone.status === 'active' ? (
                        <Button size="sm" variant="outline" className="flex-1">
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1">
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card border-lime-500/30">
          <CardHeader>
            <CardTitle>System Controls</CardTitle>
            <CardDescription>Master irrigation system management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full">Emergency Stop All Zones</Button>
              <Button variant="outline" className="w-full">Run System Diagnostics</Button>
              <Button variant="outline" className="w-full">Generate Water Report</Button>
              <Button variant="outline" className="w-full">Optimize Schedule</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader>
            <CardTitle>Weather Integration</CardTitle>
            <CardDescription>AI weather-based irrigation adjustments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Today's Forecast</span>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  Partly Cloudy
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Thermometer className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <div className="text-lg font-bold">78°F</div>
                  <div className="text-xs text-muted-foreground">High</div>
                </div>
                <div className="text-center">
                  <Droplets className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <div className="text-lg font-bold">15%</div>
                  <div className="text-xs text-muted-foreground">Rain Chance</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                AI has reduced irrigation schedule by 20% based on upcoming weather patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartIrrigation;