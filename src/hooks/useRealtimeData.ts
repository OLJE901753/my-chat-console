import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from '@/components/RealtimeProvider';

// Generic real-time data hook
export function useRealtimeData<T>(
  messageType: string,
  initialData: T | null = null,
  options: {
    transform?: (data: any) => T;
    onUpdate?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const [data, setData] = useState<T | null>(initialData);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { connected, subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe(messageType, (rawData: any) => {
      try {
        const transformedData = options.transform ? options.transform(rawData) : rawData;
        setData(transformedData);
        setLastUpdate(new Date());
        setIsLive(true);
        setError(null);
        options.onUpdate?.(transformedData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Data transformation failed');
        setError(error.message);
        options.onError?.(error);
      }
    });

    return unsubscribe;
  }, [subscribe, messageType, options.transform, options.onUpdate, options.onError]);

  // Mark as not live if connection is lost
  useEffect(() => {
    if (!connected) {
      setIsLive(false);
    }
  }, [connected]);

  return {
    data,
    lastUpdate,
    isLive,
    connected,
    error,
  };
}

// Drone telemetry real-time data
export function useDroneTelemetry() {
  return useRealtimeData('drone_telemetry', null, {
    transform: (data) => ({
      battery: data.battery || 0,
      altitude: data.altitude || 0,
      speed: data.speed || 0,
      temperature: data.temperature || 0,
      position: data.position || { lat: 0, lng: 0 },
      orientation: data.orientation || { yaw: 0, pitch: 0, roll: 0 },
      status: data.status || 'unknown',
      timestamp: data.timestamp || Date.now(),
    }),
  });
}

// Sensor readings real-time data
export function useSensorReadings() {
  return useRealtimeData('sensor_readings', null, {
    transform: (data) => ({
      npk: data.npk || { nitrogen: 0, phosphorus: 0, potassium: 0 },
      ph: data.ph || 7.0,
      moisture: data.moisture || 0,
      electricalConductivity: data.electricalConductivity || 0,
      temperature: data.temperature || 0,
      humidity: data.humidity || 0,
      location: data.location || 'Unknown',
      timestamp: data.timestamp || Date.now(),
    }),
  });
}

// Weather data real-time updates
export function useWeatherData() {
  return useRealtimeData('weather_data', null, {
    transform: (data) => ({
      temperature: data.temperature || 0,
      humidity: data.humidity || 0,
      pressure: data.pressure || 0,
      windSpeed: data.windSpeed || 0,
      windDirection: data.windDirection || 0,
      precipitation: data.precipitation || 0,
      uvIndex: data.uvIndex || 0,
      visibility: data.visibility || 0,
      timestamp: data.timestamp || Date.now(),
    }),
  });
}

// AI agent status real-time updates
export function useAgentStatus() {
  return useRealtimeData('agent_status', null, {
    transform: (data) => ({
      agentId: data.agentId || '',
      status: data.status || 'inactive',
      lastActivity: data.lastActivity || null,
      currentTask: data.currentTask || null,
      performance: data.performance || { cpu: 0, memory: 0 },
      errors: data.errors || [],
      timestamp: data.timestamp || Date.now(),
    }),
  });
}

// Mission progress real-time updates
export function useMissionProgress() {
  return useRealtimeData('mission_progress', null, {
    transform: (data) => ({
      missionId: data.missionId || '',
      status: data.status || 'pending',
      progress: data.progress || 0,
      currentWaypoint: data.currentWaypoint || 0,
      totalWaypoints: data.totalWaypoints || 0,
      estimatedCompletion: data.estimatedCompletion || null,
      errors: data.errors || [],
      timestamp: data.timestamp || Date.now(),
    }),
  });
}

// System alerts real-time updates
export function useSystemAlerts() {
  return useRealtimeData('system_alerts', [], {
    transform: (data) => Array.isArray(data) ? data : [],
  });
}

// Custom hook for sending real-time commands
export function useRealtimeCommands() {
  const { send } = useRealtime();

  const sendCommand = useCallback((command: string, params: any = {}) => {
    send('command', { command, params, timestamp: Date.now() });
  }, [send]);

  const sendDroneCommand = useCallback((command: string, params: any = {}) => {
    send('drone_command', { command, params, timestamp: Date.now() });
  }, [send]);

  const sendAgentCommand = useCallback((agentId: string, command: string, params: any = {}) => {
    send('agent_command', { agentId, command, params, timestamp: Date.now() });
  }, [send]);

  return {
    sendCommand,
    sendDroneCommand,
    sendAgentCommand,
  };
}

// Hook for real-time notifications
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('notification', (notification: any) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    });

    return unsubscribe;
  }, [subscribe]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    clearNotifications,
    removeNotification,
  };
}

export default useRealtimeData;
