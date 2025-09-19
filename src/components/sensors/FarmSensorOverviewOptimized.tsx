import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Zap, 
  Leaf,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Progress } from '@/components/ui/progress';

interface TelemetryPoint {
  timestamp: string;
  altitude: number;
  speed: number;
  battery: number;
  temperature: number;
  npk_nitrogen: number;
  npk_phosphorus: number;
  npk_potassium: number;
  ph: number;
  moisture: number;
  electrical_conductivity: number;
}

type MetricKey = keyof Pick<TelemetryPoint, 
  'altitude' | 'speed' | 'battery' | 'temperature' | 
  'npk_nitrogen' | 'npk_phosphorus' | 'npk_potassium' | 
  'ph' | 'moisture' | 'electrical_conductivity'
>;

const METRICS: Array<{
  key: MetricKey;
  label: string;
  icon: React.ReactNode;
  unit: string;
  color: string;
  category: 'drone' | 'soil';
}> = [
  { key: 'altitude', label: 'Altitude', icon: <TrendingUp className="h-4 w-4" />, unit: 'm', color: 'text-blue-500', category: 'drone' },
  { key: 'speed', label: 'Speed', icon: <Wind className="h-4 w-4" />, unit: 'm/s', color: 'text-green-500', category: 'drone' },
  { key: 'battery', label: 'Battery', icon: <Zap className="h-4 w-4" />, unit: '%', color: 'text-yellow-500', category: 'drone' },
  { key: 'temperature', label: 'Temperature', icon: <Thermometer className="h-4 w-4" />, unit: '°C', color: 'text-red-500', category: 'drone' },
  { key: 'npk_nitrogen', label: 'Nitrogen', icon: <Leaf className="h-4 w-4" />, unit: 'ppm', color: 'text-green-600', category: 'soil' },
  { key: 'npk_phosphorus', label: 'Phosphorus', icon: <Leaf className="h-4 w-4" />, unit: 'ppm', color: 'text-orange-500', category: 'soil' },
  { key: 'npk_potassium', label: 'Potassium', icon: <Leaf className="h-4 w-4" />, unit: 'ppm', color: 'text-purple-500', category: 'soil' },
  { key: 'ph', label: 'pH', icon: <Droplets className="h-4 w-4" />, unit: '', color: 'text-cyan-500', category: 'soil' },
  { key: 'moisture', label: 'Moisture', icon: <Droplets className="h-4 w-4" />, unit: '%', color: 'text-blue-600', category: 'soil' },
  { key: 'electrical_conductivity', label: 'EC', icon: <Zap className="h-4 w-4" />, unit: 'mS/cm', color: 'text-indigo-500', category: 'soil' },
];

// Memoized Sparkline component
const Sparkline = React.memo<{ 
  values: number[]; 
  width?: number; 
  height?: number; 
  stroke?: string;
}>(({ values, width = 320, height = 100, stroke = '#84cc16' }) => {
  const pathData = useMemo(() => {
    if (values.length < 2) return '';
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }, [values, width, height]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathData}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Sparkline.displayName = 'Sparkline';

// Optimized telemetry hook with proper cleanup and memoization
const useTelemetryFeed = () => {
  const [data, setData] = useState<TelemetryPoint[]>([]);
  const sseRef = useRef<EventSource | null>(null);
  const isMountedRef = useRef(true);

  const loadHistory = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:3001/api/telemetry/history?limit=60');
      if (resp.ok && isMountedRef.current) {
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
        })).reverse();
        
        if (isMountedRef.current) {
          setData(mapped);
        }
      }
    } catch {
      // ignore; UI will show empty state
    }
  }, []);

  const connectSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    const sse = new EventSource('http://localhost:3001/api/telemetry/stream');
    
    sse.onmessage = (e) => {
      if (!isMountedRef.current) return;
      
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'telemetry_update') {
          const now = Date.now();
          const point: TelemetryPoint = {
            timestamp: msg.timestamp,
            altitude: Number(msg.altitude ?? 0),
            speed: Number(msg.speed ?? 0),
            battery: Number(msg.battery ?? 0),
            temperature: Number(msg.temperature ?? 0),
            // Mock live soil sensor data
            npk_nitrogen: 150 + Math.sin(now * 0.0001) * 20 + Math.random() * 10,
            npk_phosphorus: 45 + Math.sin(now * 0.00008) * 8 + Math.random() * 5,
            npk_potassium: 180 + Math.sin(now * 0.00012) * 25 + Math.random() * 15,
            ph: 6.8 + Math.sin(now * 0.00005) * 0.3 + Math.random() * 0.2,
            moisture: 65 + Math.sin(now * 0.00015) * 15 + Math.random() * 8,
            electrical_conductivity: 1.2 + Math.sin(now * 0.00007) * 0.3 + Math.random() * 0.1,
          };
          
          setData((prev) => {
            const next = [...prev, point];
            return next.slice(-120); // keep last 120 points
          });
        }
      } catch {
        // ignore bad frames
      }
    };
    
    sse.onerror = () => {
      if (isMountedRef.current) {
        sse.close();
        setTimeout(connectSSE, 3000);
      }
    };
    
    sseRef.current = sse;
  }, []);

  useEffect(() => {
    loadHistory();
    connectSSE();

    return () => {
      isMountedRef.current = false;
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [loadHistory, connectSSE]);

  return data;
};

// Memoized metric card component
const MetricCard = React.memo<{
  metric: typeof METRICS[0];
  currentValue: number;
  values: number[];
  trend: 'up' | 'down' | 'stable';
}>(({ metric, currentValue, values, trend }) => {
  const trendIcon = useMemo(() => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <Minus className="h-3 w-3 text-gray-500" />;
    }
  }, [trend]);

  const formatValue = useCallback((value: number) => {
    if (metric.key === 'ph') return value.toFixed(1);
    if (metric.key === 'electrical_conductivity') return value.toFixed(2);
    return Math.round(value).toString();
  }, [metric.key]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className={metric.color}>{metric.icon}</span>
          {metric.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {formatValue(currentValue)}
            </span>
            <div className="flex items-center gap-1">
              {trendIcon}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {metric.unit}
          </div>
          <div className="h-16">
            <Sparkline values={values} height={60} stroke={metric.color.replace('text-', '#')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

// Main component
const FarmSensorOverviewOptimized: React.FC = () => {
  const data = useTelemetryFeed();

  // Generate demo data if no real data is available
  const demoData = React.useMemo(() => {
    if (data.length > 0) return data;
    
    const demoPoints: TelemetryPoint[] = [];
    for (let i = 0; i < 60; i++) {
      demoPoints.push({
        timestamp: new Date(Date.now() - (60 - i) * 5000).toISOString(),
        altitude: 25 + Math.sin(i * 0.1) * 5 + Math.random() * 3,
        speed: 8 + Math.sin(i * 0.08) * 2 + Math.random() * 1.5,
        battery: 85 + Math.sin(i * 0.05) * 10 + Math.random() * 5,
        temperature: 18 + Math.sin(i * 0.12) * 3 + Math.random() * 2,
        npk_nitrogen: 150 + Math.sin(i * 0.1) * 20 + Math.random() * 10,
        npk_phosphorus: 45 + Math.sin(i * 0.08) * 8 + Math.random() * 5,
        npk_potassium: 180 + Math.sin(i * 0.12) * 25 + Math.random() * 15,
        ph: 6.8 + Math.sin(i * 0.05) * 0.3 + Math.random() * 0.2,
        moisture: 65 + Math.sin(i * 0.15) * 15 + Math.random() * 8,
        electrical_conductivity: 1.2 + Math.sin(i * 0.07) * 0.3 + Math.random() * 0.1,
      });
    }
    return demoPoints;
  }, [data]);

  // Memoized calculations
  const { currentValues, trends, chartData } = useMemo(() => {
    if (demoData.length === 0) {
      return { currentValues: {}, trends: {}, chartData: {} };
    }

    const current = demoData[demoData.length - 1];
    const currentValues: Record<MetricKey, number> = {
      altitude: current.altitude,
      speed: current.speed,
      battery: current.battery,
      temperature: current.temperature,
      npk_nitrogen: current.npk_nitrogen,
      npk_phosphorus: current.npk_phosphorus,
      npk_potassium: current.npk_potassium,
      ph: current.ph,
      moisture: current.moisture,
      electrical_conductivity: current.electrical_conductivity,
    };

    const trends: Record<MetricKey, 'up' | 'down' | 'stable'> = {};
    const chartData: Record<MetricKey, number[]> = {};

    METRICS.forEach(({ key }) => {
      const values = demoData.map(point => point[key]);
      chartData[key] = values;
      
      if (values.length >= 2) {
        const recent = values.slice(-5);
        const older = values.slice(-10, -5);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        const change = (recentAvg - olderAvg) / olderAvg;
        trends[key] = change > 0.05 ? 'up' : change < -0.05 ? 'down' : 'stable';
      } else {
        trends[key] = 'stable';
      }
    });

    return { currentValues, trends, chartData };
  }, [demoData]);

  // Memoized filtered metrics
  const droneMetrics = useMemo(() => 
    METRICS.filter(m => m.category === 'drone'), []
  );
  
  const soilMetrics = useMemo(() => 
    METRICS.filter(m => m.category === 'soil'), []
  );

  if (demoData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading sensor data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Farm Sensor Overview</h2>
        <Badge variant="outline" className="text-green-600">
          Live Data
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Drone Metrics */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Drone Telemetry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {droneMetrics.map((metric) => (
              <MetricCard
                key={metric.key}
                metric={metric}
                currentValue={currentValues[metric.key]}
                values={chartData[metric.key] || []}
                trend={trends[metric.key]}
              />
            ))}
          </div>
        </div>

        {/* Soil Metrics */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Soil Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {soilMetrics.map((metric) => (
              <MetricCard
                key={metric.key}
                metric={metric}
                currentValue={currentValues[metric.key]}
                values={chartData[metric.key] || []}
                trend={trends[metric.key]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FarmSensorOverviewOptimized);
