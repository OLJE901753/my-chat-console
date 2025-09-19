import { NESSA_LOCATION, WEATHER_STATIONS, TEMP_THRESHOLDS, NORWEGIAN_FORMATS } from '@/constants/nessa';

// Norwegian Meteorological Institute API types
export interface NorwegianWeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  pressure: number;
  cloudCover: number;
  visibility: number;
  timestamp: string;
  source: 'yr.no' | 'met.no';
}

export interface WeatherForecast extends NorwegianWeatherData {
  date: string;
  time: string;
  symbol: string;
  symbolName: string;
}

export interface FrostAlert {
  active: boolean;
  severity: 'low' | 'medium' | 'high';
  expectedTemp: number;
  timeToFrost: number; // hours
  recommendations: string[];
}

export interface GrowingDegreeDay {
  date: string;
  gdd: number;
  cumulativeGdd: number;
  baseTemp: number;
}

class NorwegianWeatherService {
  private readonly baseUrl = 'https://api.met.no';
  private readonly userAgent = 'NessaFarmAI/1.0 (farm.ai@nessa.no)';
  
  /**
   * Get current weather for Nessa location from Norwegian Met Institute
   */
  async getCurrentWeather(): Promise<NorwegianWeatherData> {
    try {
      const url = `${this.baseUrl}/weatherapi/locationforecast/2.0/compact?lat=${NESSA_LOCATION.latitude}&lon=${NESSA_LOCATION.longitude}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent
        }
      });
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      const current = data.properties.timeseries[0];
      
      return {
        temperature: current.data.instant.details.air_temperature,
        humidity: current.data.instant.details.relative_humidity,
        windSpeed: current.data.instant.details.wind_speed,
        windDirection: current.data.instant.details.wind_from_direction,
        precipitation: current.data.next_1_hours?.details?.precipitation_amount || 0,
        pressure: current.data.instant.details.air_pressure_at_sea_level,
        cloudCover: current.data.instant.details.cloud_area_fraction,
        visibility: 10000, // Default good visibility
        timestamp: current.time,
        source: 'yr.no'
      };
    } catch (error) {
      console.error('Failed to fetch Norwegian weather data:', error);
      throw new Error('Failed to get weather data from yr.no');
    }
  }
  
  /**
   * Get 7-day weather forecast for Nessa
   */
  async getWeeklyForecast(): Promise<WeatherForecast[]> {
    try {
      const url = `${this.baseUrl}/weatherapi/locationforecast/2.0/compact?lat=${NESSA_LOCATION.latitude}&lon=${NESSA_LOCATION.longitude}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent
        }
      });
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.properties.timeseries.slice(0, 168).map((item: any) => ({ // 7 days * 24 hours
        temperature: item.data.instant.details.air_temperature,
        humidity: item.data.instant.details.relative_humidity,
        windSpeed: item.data.instant.details.wind_speed,
        windDirection: item.data.instant.details.wind_from_direction,
        precipitation: item.data.next_1_hours?.details?.precipitation_amount || 0,
        pressure: item.data.instant.details.air_pressure_at_sea_level,
        cloudCover: item.data.instant.details.cloud_area_fraction,
        visibility: 10000,
        timestamp: item.time,
        date: new Date(item.time).toLocaleDateString(NORWEGIAN_FORMATS.locale, {
          timeZone: NORWEGIAN_FORMATS.timezone
        }),
        time: new Date(item.time).toLocaleTimeString(NORWEGIAN_FORMATS.locale, {
          timeZone: NORWEGIAN_FORMATS.timezone,
          hour: '2-digit',
          minute: '2-digit'
        }),
        symbol: item.data.next_1_hours?.summary?.symbol_code || 'unknown',
        symbolName: this.getSymbolName(item.data.next_1_hours?.summary?.symbol_code),
        source: 'yr.no'
      }));
    } catch (error) {
      console.error('Failed to fetch Norwegian forecast:', error);
      throw new Error('Failed to get forecast from yr.no');
    }
  }
  
  /**
   * Check for frost alerts - critical for Norwegian spring fruit farming
   */
  async getFrostAlert(): Promise<FrostAlert> {
    try {
      const forecast = await this.getWeeklyForecast();
      const next48Hours = forecast.slice(0, 48);
      
      const frostRisk = next48Hours.find(f => f.temperature <= TEMP_THRESHOLDS.frostWarning);
      
      if (!frostRisk) {
        return {
          active: false,
          severity: 'low',
          expectedTemp: Math.min(...next48Hours.map(f => f.temperature)),
          timeToFrost: 48,
          recommendations: ['No frost risk in next 48 hours']
        };
      }
      
      const hoursToFrost = next48Hours.findIndex(f => f.temperature <= TEMP_THRESHOLDS.frostWarning);
      const minTemp = Math.min(...next48Hours.map(f => f.temperature));
      
      const severity = minTemp <= TEMP_THRESHOLDS.frostDamage ? 'high' : 
                      minTemp <= 0 ? 'medium' : 'low';
      
      const recommendations = this.getFrostRecommendations(severity, hoursToFrost);
      
      return {
        active: true,
        severity,
        expectedTemp: minTemp,
        timeToFrost: hoursToFrost,
        recommendations
      };
    } catch (error) {
      console.error('Failed to get frost alert:', error);
      throw error;
    }
  }
  
  /**
   * Calculate Growing Degree Days for apple/pear varieties
   */
  async calculateGDD(baseTemp: number = 5, days: number = 30): Promise<GrowingDegreeDay[]> {
    try {
      const forecast = await this.getWeeklyForecast();
      
      // Group by date and calculate daily average temperature
      const dailyData = new Map<string, number[]>();
      
      forecast.forEach(item => {
        if (!dailyData.has(item.date)) {
          dailyData.set(item.date, []);
        }
        dailyData.get(item.date)!.push(item.temperature);
      });
      
      let cumulativeGdd = 0;
      const gddData: GrowingDegreeDay[] = [];
      
      Array.from(dailyData.entries()).slice(0, days).forEach(([date, temps]) => {
        const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
        const dailyGdd = Math.max(0, avgTemp - baseTemp);
        cumulativeGdd += dailyGdd;
        
        gddData.push({
          date,
          gdd: Math.round(dailyGdd * 10) / 10,
          cumulativeGdd: Math.round(cumulativeGdd * 10) / 10,
          baseTemp
        });
      });
      
      return gddData;
    } catch (error) {
      console.error('Failed to calculate GDD:', error);
      throw error;
    }
  }
  
  /**
   * Get disease risk based on Norwegian weather patterns
   */
  async getDiseaseRisk() {
    try {
      const current = await this.getCurrentWeather();
      const forecast = await this.getWeeklyForecast();
      
      const next7Days = forecast.slice(0, 168); // 7 days
      const avgTemp = next7Days.reduce((sum, f) => sum + f.temperature, 0) / next7Days.length;
      const avgHumidity = next7Days.reduce((sum, f) => sum + f.humidity, 0) / next7Days.length;
      const totalRain = next7Days.reduce((sum, f) => sum + f.precipitation, 0);
      
      return {
        appleScab: this.calculateAppleScabRisk(avgTemp, avgHumidity, totalRain),
        fireBlight: this.calculateFireBlightRisk(avgTemp, avgHumidity),
        powderyMildew: this.calculatePowderyMildewRisk(avgTemp, avgHumidity),
        overall: 'medium', // Calculated based on individual risks
        recommendations: this.getDiseaseRecommendations(avgTemp, avgHumidity)
      };
    } catch (error) {
      console.error('Failed to calculate disease risk:', error);
      throw error;
    }
  }
  
  private getSymbolName(symbolCode: string): string {
    const symbols: Record<string, string> = {
      'clearsky_day': 'Klarvær',
      'clearsky_night': 'Klarvær',
      'fair_day': 'Lettskyet',
      'fair_night': 'Lettskyet',
      'partlycloudy_day': 'Delvis skyet',
      'partlycloudy_night': 'Delvis skyet',
      'cloudy': 'Skyet',
      'rain': 'Regn',
      'snow': 'Snø',
      'fog': 'Tåke'
    };
    
    return symbols[symbolCode] || 'Ukjent';
  }
  
  private getFrostRecommendations(severity: string, hoursToFrost: number): string[] {
    const base = [
      'Aktivér frostbeskyttelse',
      'Overvåk unge trær nøye',
      'Utsett vanning til etter soloppgang'
    ];
    
    if (severity === 'high') {
      return [
        ...base,
        'KRITISK: Start frostkanoner/sprinkleranlegg',
        'Vurder røykpotter som backup',
        'Varsle forsikringsselskap ved skader'
      ];
    }
    
    if (hoursToFrost < 6) {
      return [
        ...base,
        'Umiddelbar handling kreves',
        'Sjekk været hver time'
      ];
    }
    
    return base;
  }
  
  private calculateAppleScabRisk(temp: number, humidity: number, rain: number): 'low' | 'medium' | 'high' {
    // Apple scab thrives in cool, wet conditions (10-24°C, high humidity)
    if (temp >= 10 && temp <= 24 && humidity > 70 && rain > 2) {
      return 'high';
    }
    if (temp >= 8 && temp <= 26 && humidity > 60 && rain > 0.5) {
      return 'medium';
    }
    return 'low';
  }
  
  private calculateFireBlightRisk(temp: number, humidity: number): 'low' | 'medium' | 'high' {
    // Fire blight likes warm, humid conditions (20-30°C, high humidity)
    if (temp >= 20 && temp <= 30 && humidity > 75) {
      return 'high';
    }
    if (temp >= 15 && temp <= 35 && humidity > 60) {
      return 'medium';
    }
    return 'low';
  }
  
  private calculatePowderyMildewRisk(temp: number, humidity: number): 'low' | 'medium' | 'high' {
    // Powdery mildew likes warm, dry conditions (20-30°C, moderate humidity)
    if (temp >= 20 && temp <= 30 && humidity >= 40 && humidity <= 70) {
      return 'high';
    }
    if (temp >= 15 && temp <= 35 && humidity >= 30 && humidity <= 80) {
      return 'medium';
    }
    return 'low';
  }
  
  private getDiseaseRecommendations(temp: number, humidity: number): string[] {
    const recommendations = [];
    
    if (temp >= 10 && temp <= 24 && humidity > 70) {
      recommendations.push('Høy risiko for epleskurv - vurder forebyggende sprøyting');
    }
    
    if (temp >= 20 && temp <= 30 && humidity > 75) {
      recommendations.push('Høy risiko for ildskudd - følg med på blomsterstadiet');
    }
    
    if (temp >= 20 && temp <= 30) {
      recommendations.push('Moderate forhold for meldugg - sikre god luftsirkulasjon');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Lave sykdomsrisiko - fortsett vanlig overvåking');
    }
    
    return recommendations;
  }
}

export const norwegianWeatherService = new NorwegianWeatherService();
export default norwegianWeatherService;