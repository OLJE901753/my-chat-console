import React from 'react';

import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorDisplay from '@/components/ErrorDisplay';
import LazyComponent from '@/components/LazyComponent';
import RealtimeDashboard from '@/components/RealtimeDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNetatmoWeather } from '@/hooks/useNetatmoWeather';

// Lazy load components for code splitting
const DroneControlRefactored = () => import('@/components/drone/DroneControlRefactored');
const AIMissionPlanner = () => import('@/components/AIMissionPlanner');
const DroneMediaLibrary = () => import('@/components/DroneMediaLibrary');
const ContentPreview = () => import('@/components/ContentPreview');
const CameraManager = () => import('@/components/CameraManager');
const FarmSensorOverviewOptimized = () => import('@/components/sensors/FarmSensorOverviewOptimized');
const AIAgentManager = () => import('@/components/AIAgentManager');
const PythonAIControl = () => import('@/components/PythonAIControl');

const Dashboard: React.FC = () => {
  const { data: netatmoData, loading: netatmoLoading, error: netatmoError, lastUpdate } = useNetatmoWeather();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="gradient-text text-4xl font-bold mb-2">Nessa Farm AI Dashboard</h1>
        <p className="text-gray-400">Apple and pear farm in Nessa, Rogaland • AI-driven farming</p>
        <p className="text-sm text-muted-foreground">58.9°N, 5.7°E • Instrumentation & AI for Norwegian Agriculture</p>
      </div>

      <Tabs defaultValue="drone-control" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="drone-control">Drone</TabsTrigger>
          <TabsTrigger value="ai-missions">AI Missions</TabsTrigger>
          <TabsTrigger value="media-library">Media Library</TabsTrigger>
          <TabsTrigger value="farm-overview">Farm Overview</TabsTrigger>
          <TabsTrigger value="ai-agents">AI Agents</TabsTrigger>
          <TabsTrigger value="python-ai">Python AI</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <ErrorBoundary
            fallback={
              <ErrorDisplay
                error="Failed to load Real-time Dashboard"
                title="Real-time Dashboard Error"
                description="There was an error loading the real-time data dashboard. This may be due to a WebSocket connection issue."
                onRetry={() => window.location.reload()}
                retryLabel="Reload Page"
              />
            }
          >
            <RealtimeDashboard />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="drone-control">
          <Card className="glass-card border-lime-500/30">
            <CardContent className="p-6">
              <ErrorBoundary
                fallback={
                  <ErrorDisplay
                    error="Failed to load Drone Control"
                    title="Drone Control Error"
                    description="There was an error loading the drone control interface. This may be due to a connection issue or server problem."
                    onRetry={() => window.location.reload()}
                    retryLabel="Reload Page"
                  />
                }
              >
                <LazyComponent 
                  component={DroneControlRefactored} 
                  loadingMessage="Loading drone control interface..."
                />
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-missions">
          <Card className="glass-card border-lime-500/30">
            <CardContent className="p-6">
              <ErrorBoundary
                fallback={
                  <ErrorDisplay
                    error="Failed to load AI Mission Planner"
                    title="AI Mission Planner Error"
                    description="There was an error loading the AI mission planning interface. Please try again."
                    onRetry={() => window.location.reload()}
                    retryLabel="Reload Page"
                  />
                }
              >
                <LazyComponent 
                  component={AIMissionPlanner} 
                  loadingMessage="Loading AI mission planner..."
                />
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media-library">
          <div className="space-y-6">
            {/* Media Library */}
            <Card className="glass-card border-lime-500/30">
              <CardHeader>
                <CardTitle className="gradient-text">Media Library</CardTitle>
                <CardDescription>Manage drone photos and videos</CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorBoundary
                  fallback={
                    <ErrorDisplay
                      error="Failed to load Media Library"
                      title="Media Library Error"
                      description="There was an error loading the media library. This may be due to a database connection issue."
                      onRetry={() => window.location.reload()}
                      retryLabel="Reload Page"
                    />
                  }
                >
                  <LazyComponent 
                    component={DroneMediaLibrary} 
                    loadingMessage="Loading media library..."
                  />
                </ErrorBoundary>
              </CardContent>
            </Card>

            {/* Content Preview and Camera Manager Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Preview */}
              <Card className="glass-card border-blue-500/30">
                <CardHeader>
                  <CardTitle className="gradient-text">Content Preview</CardTitle>
                  <CardDescription>AI-generated content for social media</CardDescription>
                </CardHeader>
                <CardContent>
                  <ErrorBoundary
                    fallback={
                      <ErrorDisplay
                        error="Failed to load Content Preview"
                        title="Content Preview Error"
                        description="There was an error loading the content preview."
                        onRetry={() => window.location.reload()}
                        retryLabel="Reload Page"
                      />
                    }
                  >
                    <LazyComponent 
                      component={ContentPreview} 
                      loadingMessage="Loading content preview..."
                    />
                  </ErrorBoundary>
                </CardContent>
              </Card>

              {/* Camera Manager */}
              <Card className="glass-card border-purple-500/30">
                <CardHeader>
                  <CardTitle className="gradient-text">Camera Manager</CardTitle>
                  <CardDescription>Control and monitor camera feeds</CardDescription>
                </CardHeader>
                <CardContent>
                  <ErrorBoundary
                    fallback={
                      <ErrorDisplay
                        error="Failed to load Camera Manager"
                        title="Camera Manager Error"
                        description="There was an error loading the camera manager."
                        onRetry={() => window.location.reload()}
                        retryLabel="Reload Page"
                      />
                    }
                  >
                    <LazyComponent 
                      component={CameraManager} 
                      loadingMessage="Loading camera manager..."
                    />
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="farm-overview">
          <Card className="glass-card border-lime-500/30">
            <CardContent className="space-y-6 p-6">
            {/* Original Status Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glass-card border-lime-500/30">
                <CardHeader>
                  <CardTitle className="gradient-text">System Status</CardTitle>
                  <CardDescription>Overall farm system health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Drones</span>
                      <span className="text-green-400">Online</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sensors</span>
                      <span className="text-green-400">Active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Irrigation</span>
                      <span className="text-yellow-400">Standby</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>AI Systems</span>
                      <span className="text-green-400">Learning</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-lime-500/30">
                <CardHeader>
                  <CardTitle className="gradient-text">Weather Conditions Nessa</CardTitle>
                  <CardDescription>
                    {netatmoError ? 'Source: yr.no • Stavanger area (Netatmo offline)' : 
                     netatmoLoading ? 'Loading Netatmo data...' :
                     `Source: Netatmo Station • Last update: ${lastUpdate?.toLocaleTimeString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Temperature</span>
                      <span className={netatmoData ? 'text-green-400' : 'text-gray-400'}>
                        {netatmoData ? `${netatmoData.temperature.toFixed(1)}°C` : '12°C'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Humidity</span>
                      <span className={netatmoData ? 'text-blue-400' : 'text-gray-400'}>
                        {netatmoData ? `${netatmoData.humidity.toFixed(0)}%` : '78%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Wind Speed</span>
                      <span className={netatmoData ? 'text-cyan-400' : 'text-gray-400'}>
                        {netatmoData ? `${netatmoData.windSpeed.toFixed(0)} km/h` : '3.2 m/s'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Rain Today</span>
                      <span className={netatmoData ? 'text-purple-400' : 'text-yellow-400'}>
                        {netatmoData ? `${netatmoData.rainToday.toFixed(1)} mm` : 'Offline'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-lime-500/30">
                <CardHeader>
                  <CardTitle className="gradient-text">Crop Health</CardTitle>
                  <CardDescription>Overall crop condition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Apple Trees</span>
                      <span className="text-green-400">Excellent</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pear Trees</span>
                      <span className="text-green-400">Good</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Soil Quality</span>
                      <span className="text-yellow-400">Moderate</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pests</span>
                      <span className="text-green-400">Low</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* New Sensor Charts */}
            <ErrorBoundary
              fallback={
                <ErrorDisplay
                  error="Failed to load Farm Sensor Overview"
                  title="Sensor Overview Error"
                  description="There was an error loading the farm sensor data. This may be due to a sensor connection issue."
                  onRetry={() => window.location.reload()}
                  retryLabel="Reload Page"
                />
              }
            >
              <LazyComponent 
                component={FarmSensorOverviewOptimized} 
                loadingMessage="Loading farm sensor data..."
              />
            </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-agents" className="space-y-6">
          <Card className="glass-card border-lime-500/30">
            <CardContent className="p-6">
              <ErrorBoundary
                fallback={
                  <ErrorDisplay
                    error="Failed to load AI Agent Manager"
                    title="AI Agent Manager Error"
                    description="There was an error loading the AI agent management interface. This may be due to a service connection issue."
                    onRetry={() => window.location.reload()}
                    retryLabel="Reload Page"
                  />
                }
              >
                <LazyComponent 
                  component={AIAgentManager} 
                  loadingMessage="Loading AI agent manager..."
                />
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="python-ai" className="space-y-6">
          <Card className="glass-card border-lime-500/30">
            <CardContent className="p-6">
              <ErrorBoundary
                fallback={
                  <ErrorDisplay
                    error="Failed to load Python AI Control"
                    title="Python AI Control Error"
                    description="There was an error loading the Python AI control interface. This may be due to a Python service connection issue."
                    onRetry={() => window.location.reload()}
                    retryLabel="Reload Page"
                  />
                }
              >
                <LazyComponent 
                  component={PythonAIControl} 
                  loadingMessage="Loading Python AI control interface..."
                />
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;