/**
 * Netatmo Weather Station API Service
 * Fetches real weather data from the user's Netatmo station
 */

export interface NetatmoWeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  gustSpeed: number;
  pressure: number;
  co2: number;
  noise: number;
  rain: number;
  rainToday: number;
  timestamp: string;
  stationName: string;
  location: {
    city: string;
    country: string;
    altitude: number;
    coordinates: [number, number];
  };
}

export interface NetatmoAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

class NetatmoService {
  private readonly apiUrl = 'https://api.netatmo.com';
  private readonly deviceId = '70:ee:50:29:0d:66';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  
  // All authentication handled by backend - no client-side credentials needed

  /**
   * Get weather data from the Netatmo station via backend API
   */
  async getStationData(): Promise<NetatmoWeatherData> {
    try {
      // Use backend proxy to avoid CORS issues
      const response = await fetch('/api/netatmo/weather');
      
      if (!response.ok) {
        throw new Error(`Backend Netatmo API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get weather data');
      }

      return result.data;

    } catch (error) {
      console.error('Failed to fetch Netatmo data:', error);
      
      // Return mock data if API fails
      return {
        temperature: 12,
        humidity: 78,
        windSpeed: 3.2,
        windDirection: 180,
        gustSpeed: 5,
        pressure: 1013,
        co2: 400,
        noise: 35,
        rain: 0,
        rainToday: 0,
        timestamp: new Date().toISOString(),
        stationName: 'Nessa Weather Station (offline)',
        location: {
          city: 'Fister',
          country: 'NO',
          altitude: 29,
          coordinates: [6.105476, 59.150933]
        }
      };
    }
  }

  /**
   * Test the connection to Netatmo API via backend
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/netatmo/status');
      if (response.ok) {
        const status = await response.json();
        return status.configured && status.authenticated;
      }
      return false;
    } catch (error) {
      console.error('Netatmo connection test failed:', error);
      return false;
    }
  }
}

export const netatmoService = new NetatmoService();
export default netatmoService;

{}