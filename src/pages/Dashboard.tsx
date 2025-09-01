import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DroneControl from '@/components/DroneControl';
import AIMissionPlanner from '@/components/AIMissionPlanner';
import DroneMediaLibrary from '@/components/DroneMediaLibrary';
import FarmSensorOverview from '@/components/FarmSensorOverview';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="gradient-text text-4xl font-bold mb-2">Farm Management Dashboard</h1>
        <p className="text-gray-400">Monitor and control your farm's autonomous systems</p>
      </div>

      <Tabs defaultValue="drone-control" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="drone-control">Drone Control</TabsTrigger>
          <TabsTrigger value="ai-missions">AI Mission Planning</TabsTrigger>
          <TabsTrigger value="media-library">Media Library</TabsTrigger>
          <TabsTrigger value="farm-overview">Farm Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="drone-control">
          <DroneControl />
        </TabsContent>

                  <TabsContent value="ai-missions">
            <AIMissionPlanner />
          </TabsContent>

          <TabsContent value="media-library">
            <DroneMediaLibrary />
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
              <FarmSensorOverview />
            </div>
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;