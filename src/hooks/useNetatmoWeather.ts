import { useState, useEffect, useCallback } from 'react';
import netatmoService, { NetatmoWeatherData } from '@/services/netatmoService';

export const useNetatmoWeather = () => {
  const [data, setData] = useState<NetatmoWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setError(null);
      const weatherData = await netatmoService.getStationData();
      setData(weatherData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchWeatherData();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch: fetchWeatherData
  };
};
