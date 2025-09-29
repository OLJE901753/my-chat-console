import React, { useState, useEffect } from 'react';
import { Cloud, AlertTriangle, Thermometer, Wind, Eye, Droplets } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Progress } from '@/components/ui/progress'; // Comment out if not available
import { NESSA_LOCATION, TEMP_THRESHOLDS, NORWEGIAN_FORMATS } from '@/constants/nessa';
import norwegianWeatherService, { NorwegianWeatherData, FrostAlert, GrowingDegreeDay } from '@/services/norwegianWeatherService';

const WeatherDashboard: React.FC = () => {
  const [currentWeather, setCurrentWeather] = useState<NorwegianWeatherData | null>(null);
  const [frostAlert, setFrostAlert] = useState<FrostAlert | null>(null);
  const [gddData, setGddData] = useState<GrowingDegreeDay[]>([]);
  const [diseaseRisk, setDiseaseRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadWeatherData();
    // Update every 10 minutes
    const interval = setInterval(loadWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      
      // Load current weather
      const weather = await norwegianWeatherService.getCurrentWeather();
      setCurrentWeather(weather);
      
      // Check for frost alerts
      const frost = await norwegianWeatherService.getFrostAlert();
      setFrostAlert(frost);
      
      // Calculate GDD for apples
      const gdd = await norwegianWeatherService.calculateGDD(5, 7); // 7 days
      setGddData(gdd);
      
      // Get disease risk
      const risk = await norwegianWeatherService.getDiseaseRisk();
      setDiseaseRisk(risk);
      
      setLastUpdate(new Date().toLocaleString(NORWEGIAN_FORMATS.locale, {
        timeZone: NORWEGIAN_FORMATS.timezone
      }));
    } catch (error) {
      console.error('Failed to load Norwegian weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNorwegianTime = (isoString: string) => {
    return new Date(isoString).toLocaleString(NORWEGIAN_FORMATS.locale, {
      timeZone: NORWEGIAN_FORMATS.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (loading && !currentWeather) {
    return (
      <Card className="glass-card border-lime-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 animate-pulse" />
            <span>Loading weather data from yr.no...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-400" />
            Weather Data for Nessa - {NESSA_LOCATION.municipality}, {NESSA_LOCATION.county}
          </CardTitle>
          <CardDescription>
            Last update: {lastUpdate} • Source: yr.no
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Frost Alert */}
      {frostAlert?.active && (
        <Alert className={`border-2 ${frostAlert.severity === 'high' ? 'border-red-500' : frostAlert.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">
                FROST ALERT - {frostAlert.severity === 'high' ? 'CRITICAL' : frostAlert.severity === 'medium' ? 'MODERATE' : 'LOW'} RISK
              </div>
              <div>Expected temperature: {frostAlert.expectedTemp.toFixed(1)}°C in {frostAlert.timeToFrost} hours</div>
              <div className="text-sm">
                <strong>Recommendations:</strong>
                <ul className="list-disc list-inside mt-1">
                  {frostAlert.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Weather */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="gradient-text flex items-center gap-2 text-sm">
              <Thermometer className="h-4 w-4" />
              Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeather?.temperature.toFixed(1)}°C</div>
            <div className="text-xs text-muted-foreground">
              {currentWeather?.temperature > TEMP_THRESHOLDS.optimalGrowth.max ? 'Too warm' :
               currentWeather?.temperature < TEMP_THRESHOLDS.optimalGrowth.min ? 'Too cold' :
               'Optimal growth'}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="gradient-text flex items-center gap-2 text-sm">
              <Wind className="h-4 w-4" />
              Wind
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeather?.windSpeed.toFixed(1)} m/s</div>
            <div className="text-xs text-muted-foreground">
              {currentWeather?.windDirection}° • {currentWeather?.windSpeed > 15 ? 'Too strong for drone' : 'Drone OK'}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="gradient-text flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4" />
              Humidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeather?.humidity.toFixed(0)}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${currentWeather?.humidity || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="gradient-text flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              Visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(currentWeather?.visibility / 1000).toFixed(1)} km</div>
            <div className="text-xs text-muted-foreground">
              Precipitation: {currentWeather?.precipitation.toFixed(1)} mm
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growing Degree Days */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="gradient-text">Growing Degree Days (GDD) - Apple</CardTitle>
          <CardDescription>
            Accumulated heat units for optimal fruit development
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gddData.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Today</div>
                  <div className="text-2xl font-bold text-green-400">
                    {gddData[0]?.gdd.toFixed(1)} GDD
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total (7 days)</div>
                  <div className="text-2xl font-bold text-green-400">
                    {gddData[gddData.length - 1]?.cumulativeGdd.toFixed(1)} GDD
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-xs">
                {gddData.map((day, index) => (
                  <div key={index} className="text-center p-2 bg-muted rounded">
                    <div className="font-semibold">{day.date.split('.')[0]}</div>
                    <div className="text-green-400">{day.gdd.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disease Risk */}
      {diseaseRisk && (
        <Card className="glass-card border-lime-500/30">
          <CardHeader>
            <CardTitle className="gradient-text">Disease Risk</CardTitle>
            <CardDescription>
              Risk of common diseases in apple orchards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Apple Scab</span>
                  <Badge className={getSeverityColor(diseaseRisk.appleScab)}>
                    {diseaseRisk.appleScab}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fire Blight</span>
                  <Badge className={getSeverityColor(diseaseRisk.fireBlight)}>
                    {diseaseRisk.fireBlight}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Powdery Mildew</span>
                  <Badge className={getSeverityColor(diseaseRisk.powderyMildew)}>
                    {diseaseRisk.powderyMildew}
                  </Badge>
                </div>
              </div>
            </div>
            
            {diseaseRisk.recommendations && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="font-semibold text-sm mb-2">Recommendations:</div>
                <ul className="text-sm space-y-1">
                  {diseaseRisk.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-muted-foreground">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeatherDashboard;