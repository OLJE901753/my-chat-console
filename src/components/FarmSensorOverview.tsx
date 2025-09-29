import { Battery, Thermometer, Navigation, ArrowUp, Droplets, TestTube, Zap, FlaskConical, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TelemetryPoint = {
  timestamp: string;
  altitude: number;
  speed: number;
  battery: number;
  temperature: number;
  // Soil sensor data
  npk_nitrogen?: number;
  npk_phosphorus?: number;
  npk_potassium?: number;
  ph?: number;
  moisture?: number;
  electrical_conductivity?: number;
  // Location data
  sensor_location?: string;
};

type SensorLocation = {
  id: string;
  name: string;
  description: string;
  coordinates: { lat: number; lng: number };
  sensor_count: number;
  last_update: string;
};

type MetricKey = 'temperature' | 'battery' | 'altitude' | 'speed' | 'npk_nitrogen' | 'npk_phosphorus' | 'npk_potassium' | 'ph' | 'moisture' | 'electrical_conductivity';

const METRICS: Array<{
  key: MetricKey;
  label: string;
  icon: React.ReactNode;
  unit: string;
  color: string;
  category: 'drone' | 'soil';
}> = [
  // Drone metrics
  { key: 'temperature', label: 'Temperature', icon: <Thermometer className="w-4 h-4" />, unit: '°C', color: 'text-lime-400', category: 'drone' },
  { key: 'battery', label: 'Battery', icon: <Battery className="w-4 h-4" />, unit: '%', color: 'text-green-400', category: 'drone' },
  { key: 'altitude', label: 'Altitude', icon: <ArrowUp className="w-4 h-4" />, unit: 'm', color: 'text-cyan-400', category: 'drone' },
  { key: 'speed', label: 'Speed', icon: <Navigation className="w-4 h-4" />, unit: 'cm/s', color: 'text-blue-400', category: 'drone' },
  // Soil metrics
  { key: 'npk_nitrogen', label: 'Nitrogen (N)', icon: <TestTube className="w-4 h-4" />, unit: 'mg/kg', color: 'text-emerald-400', category: 'soil' },
  { key: 'npk_phosphorus', label: 'Phosphorus (P)', icon: <TestTube className="w-4 h-4" />, unit: 'mg/kg', color: 'text-orange-400', category: 'soil' },
  { key: 'npk_potassium', label: 'Potassium (K)', icon: <TestTube className="w-4 h-4" />, unit: 'mg/kg', color: 'text-purple-400', category: 'soil' },
  { key: 'ph', label: 'pH Level', icon: <FlaskConical className="w-4 h-4" />, unit: 'pH', color: 'text-yellow-400', category: 'soil' },
  { key: 'moisture', label: 'Soil Moisture', icon: <Droplets className="w-4 h-4" />, unit: '%', color: 'text-blue-400', category: 'soil' },
  { key: 'electrical_conductivity', label: 'EC Level', icon: <Zap className="w-4 h-4" />, unit: 'mS/cm', color: 'text-indigo-400', category: 'soil' },
];

function useTelemetryFeed() {
  const [data, setData] = useState<TelemetryPoint[]>([]);
  // Real-time data comes from WebSocket via useRealtimeData hook

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const resp = await fetch('http://localhost:3001/api/telemetry/history?limit=60');
        if (resp.ok) {
          const result = await resp.json();
          const mapped: TelemetryPoint[] = (result.data || []).map((row: Record<string, unknown>, index: number) => ({
            timestamp: row.timestamp,
            altitude: row.altitude ?? 0,
            speed: row.speed ?? 0,
            battery: row.battery ?? 0,
            temperature: row.temperature ?? 0,
            // Mock soil sensor data since backend doesn't have it yet
            npk_nitrogen: 150 + Math.sin(index * 0.1) * 20 + Math.random() * 10,
            npk_phosphorus: 45 + Math.sin(index * 0.08) * 8 + Math.random() * 5,
            npk_potassium: 180 + Math.sin(index * 0.12) * 25 + Math.random() * 15,
            ph: 6.8 + Math.sin(index * 0.05) * 0.3 + Math.random() * 0.2,
            moisture: 65 + Math.sin(index * 0.15) * 15 + Math.random() * 8,
            electrical_conductivity: 1.2 + Math.sin(index * 0.07) * 0.3 + Math.random() * 0.1,
          })).reverse(); // oldest -> newest for charting
          if (isMounted) setData(mapped);
        }
      } catch {
        // ignore; UI will show empty state
      }
    };

    // Real-time data comes from WebSocket via useRealtimeData hook
    // Real-time data handled by WebSocket

    loadHistory();
    // Real-time data comes from WebSocket

    return () => {
      isMounted = false;
      // Cleanup handled by WebSocket service
    };
  }, []);

  return data;
}

function Sparkline({ values, width = 320, height = 100, stroke = '#84cc16' }: { values: number[]; width?: number; height?: number; stroke?: string }) {
  const path = useMemo(() => {
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = width / Math.max(values.length - 1, 1);
    const points = values.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    });
    return points.join(' ');
  }, [values, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
      <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={path} />
    </svg>
  );
}

// Mock sensor locations - in real app, this would come from your backend
const SENSOR_LOCATIONS: SensorLocation[] = [
  {
    id: 'field-a',
    name: 'Field A - Apple Orchard',
    description: 'Main apple orchard with 6 soil sensors',
    coordinates: { lat: 58.9, lng: 5.7 },
    sensor_count: 6,
    last_update: new Date().toISOString()
  },
  {
    id: 'field-b',
    name: 'Field B - Pear Trees',
    description: 'Pear tree section with 4 soil sensors',
    coordinates: { lat: 58.901, lng: 5.701 },
    sensor_count: 4,
    last_update: new Date().toISOString()
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse - Seedlings',
    description: 'Controlled environment with 2 sensors',
    coordinates: { lat: 58.899, lng: 5.699 },
    sensor_count: 2,
    last_update: new Date().toISOString()
  },
  {
    id: 'field-c',
    name: 'Field C - Mixed Crops',
    description: 'Diverse crop area with 8 sensors',
    coordinates: { lat: 58.902, lng: 5.702 },
    sensor_count: 8,
    last_update: new Date().toISOString()
  }
];

// Mock individual sensors for the selected location
const generateSensors = (location: SensorLocation) => {
  const sensors = [];
  for (let i = 1; i <= location.sensor_count; i++) {
    sensors.push({
      id: `${location.id}-sensor-${i}`,
      name: `Sensor ${i}`,
      location: location.name,
      coordinates: {
        lat: location.coordinates.lat + (Math.random() - 0.5) * 0.001,
        lng: location.coordinates.lng + (Math.random() - 0.5) * 0.001
      },
      status: Math.random() > 0.1 ? 'active' : 'maintenance',
      last_update: new Date().toISOString()
    });
  }
  return sensors;
};

const FarmSensorOverview: React.FC = () => {
  const telemetry = useTelemetryFeed();
  const [selectedLocation, setSelectedLocation] = useState<SensorLocation>(SENSOR_LOCATIONS[0]);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null); // null = combined view
  const [viewMode, setViewMode] = useState<'combined' | 'individual'>('combined');

  const latest = telemetry[telemetry.length - 1];
  const currentSensors = generateSensors(selectedLocation);

  const series = useMemo(() => {
    const byKey = (key: MetricKey) => telemetry.map((p) => p[key] || 0);
    return {
      temperature: byKey('temperature'),
      battery: byKey('battery'),
      altitude: byKey('altitude'),
      speed: byKey('speed'),
      npk_nitrogen: byKey('npk_nitrogen'),
      npk_phosphorus: byKey('npk_phosphorus'),
      npk_potassium: byKey('npk_potassium'),
      ph: byKey('ph'),
      moisture: byKey('moisture'),
      electrical_conductivity: byKey('electrical_conductivity'),
    };
  }, [telemetry]);

  const colorFor = (key: MetricKey) => {
    switch (key) {
      case 'temperature': return '#84cc16'; // lime-400
      case 'battery': return '#22c55e'; // green-500
      case 'altitude': return '#06b6d4'; // cyan-500
      case 'speed': return '#3b82f6'; // blue-500
      case 'npk_nitrogen': return '#10b981'; // emerald-500
      case 'npk_phosphorus': return '#f97316'; // orange-500
      case 'npk_potassium': return '#a855f7'; // purple-500
      case 'ph': return '#eab308'; // yellow-500
      case 'moisture': return '#3b82f6'; // blue-500
      case 'electrical_conductivity': return '#6366f1'; // indigo-500
    }
  };

  const soilMetrics = METRICS.filter(m => m.category === 'soil');

  const nextLocation = () => {
    const nextIndex = (currentLocationIndex + 1) % SENSOR_LOCATIONS.length;
    setCurrentLocationIndex(nextIndex);
    setSelectedLocation(SENSOR_LOCATIONS[nextIndex]);
    setSelectedSensor(null); // Reset to combined view when changing location
    setViewMode('combined');
  };

  const prevLocation = () => {
    const prevIndex = currentLocationIndex === 0 ? SENSOR_LOCATIONS.length - 1 : currentLocationIndex - 1;
    setCurrentLocationIndex(prevIndex);
    setSelectedLocation(SENSOR_LOCATIONS[prevIndex]);
    setSelectedSensor(null); // Reset to combined view when changing location
    setViewMode('combined');
  };

  const selectSensor = (sensorId: string | null) => {
    setSelectedSensor(sensorId);
    setViewMode(sensorId ? 'individual' : 'combined');
  };

  return (
    <div className="space-y-4">
      {/* Location Selector */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="gradient-text">Sensor Locations</CardTitle>
          <CardDescription>Switch between different farm areas to view their sensor data</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Location Info */}
          <div className="mb-4 p-4 glass-card border-lime-500/30 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-lime-400 mb-1">{selectedLocation.name}</h3>
                <p className="text-sm text-gray-300 mb-2">{selectedLocation.description}</p>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>📍 {selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}</span>
                  <span>📊 {selectedLocation.sensor_count} sensors</span>
                  <span>🕒 Updated: {new Date(selectedLocation.last_update).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={prevLocation}
                  className="border-lime-500/30 hover:bg-gray-800/50"
                >
                  <ChevronLeft className="w-4 h-4 text-lime-400" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={nextLocation}
                  className="border-lime-500/30 hover:bg-gray-800/50"
                >
                  <ChevronRight className="w-4 h-4 text-lime-400" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Location Selection */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Select Location:</h4>
            <div className="flex gap-2 flex-wrap">
              {SENSOR_LOCATIONS.map((location, index) => (
                <Button
                  key={location.id}
                  variant={index === currentLocationIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCurrentLocationIndex(index);
                    setSelectedLocation(location);
                    setSelectedSensor(null);
                    setViewMode('combined');
                  }}
                  className={index === currentLocationIndex ? "bg-lime-600 hover:bg-lime-700" : "border-lime-500/30"}
                >
                  {location.name.split(' - ')[0]}
                </Button>
              ))}
            </div>
          </div>

          {/* Sensor Selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Select Sensor:</h4>
            <div className="flex gap-2 flex-wrap">
              {/* Combined Data Button */}
              <Button
                variant={viewMode === 'combined' ? "default" : "outline"}
                size="sm"
                onClick={() => selectSensor(null)}
                className={viewMode === 'combined' ? "bg-lime-600 hover:bg-lime-700" : "border-lime-500/30"}
              >
                📊 Combined Data
              </Button>
              
              {/* Individual Sensor Buttons */}
              {currentSensors.map((sensor) => (
                <Button
                  key={sensor.id}
                  variant={selectedSensor === sensor.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectSensor(sensor.id)}
                  className={selectedSensor === sensor.id ? "bg-lime-600 hover:bg-lime-700" : "border-lime-500/30"}
                >
                  {sensor.name}
                  {sensor.status === 'maintenance' && ' ⚠️'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Soil Sensors */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="gradient-text">
            {viewMode === 'combined' 
              ? `Soil Sensors - ${selectedLocation.name} (Combined Data)`
              : `Soil Sensors - ${selectedSensor ? currentSensors.find(s => s.id === selectedSensor)?.name : 'Unknown'}`
            }
          </CardTitle>
          <CardDescription>
            {viewMode === 'combined' 
              ? `NPK, pH, Moisture & EC readings from all sensors in ${selectedLocation.name.toLowerCase()}`
              : `NPK, pH, Moisture & EC readings from individual sensor`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {soilMetrics.map((m) => {
              const values = series[m.key] || [];
              const current = latest ? (latest[m.key] as number) : undefined;
              return (
                <Card key={m.key} className="glass-card border-lime-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2 gradient-text">
                        {m.icon}
                        {m.label}
                      </span>
                      <Badge variant="secondary" className="bg-lime-500/10 text-lime-400 border border-lime-500/20">
                        {current !== undefined ? `${current.toFixed(1)} ${m.unit}` : '—'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {values.length ? (
                      <Sparkline values={values} stroke={colorFor(m.key)} />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmSensorOverview;


