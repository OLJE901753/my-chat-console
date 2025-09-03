import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LazyComponent from '@/components/LazyComponent';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorDisplay from '@/components/ErrorDisplay';
import RealtimeDashboard from '@/components/RealtimeDashboard';

// Lazy load components for code splitting
const DroneControlRefactored = () => import('@/components/drone/DroneControlRefactored');
const AIMissionPlanner = () => import('@/components/AIMissionPlanner');
const DroneMediaLibrary = () => import('@/components/DroneMediaLibrary');
const FarmSensorOverviewOptimized = () => import('@/components/sensors/FarmSensorOverviewOptimized');
const AIAgentManager = () => import('@/components/AIAgentManager');
const PythonAIControl = () => import('@/components/PythonAIControl');

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="gradient-text text-4xl font-bold mb-2">Farm Management Dashboard</h1>
        <p className="text-gray-400">Monitor and control your farm's autonomous systems</p>
      </div>

      <Tabs defaultValue="drone-control" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="drone-control">Drone Control</TabsTrigger>
          <TabsTrigger value="ai-missions">AI Mission Planning</TabsTrigger>
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
        </TabsContent>

        <TabsContent value="ai-missions">
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
        </TabsContent>

        <TabsContent value="media-library">
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
        </TabsContent>

          <TabsContent value="farm-overview">
            <div className="space-y-6">
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
                    <CardTitle className="gradient-text">Weather Conditions</CardTitle>
                    <CardDescription>Current environmental data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Temperature</span>
                        <span>22°C</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Humidity</span>
                        <span>65%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Wind Speed</span>
                        <span>5 m/s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Visibility</span>
                        <span>10 km</span>
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
                        <span>Pest Level</span>
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
            </div>
          </TabsContent>

          <TabsContent value="ai-agents" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="python-ai" className="space-y-6">
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
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;