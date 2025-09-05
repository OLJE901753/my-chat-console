import { Drone, Settings, MapPin, Camera } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DroneControlRefactoredDebug: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  // Handle connection
  const handleConnect = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsConnected(!isConnected);
      setIsLoading(false);
    }, 1000);
  };

  // Handle drone commands
  const handleDroneCommand = (command: string, params?: Record<string, unknown>) => {
    console.log('Drone command:', command, params);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Drone className="h-6 w-6" />
            Drone Control System - Debug Version
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isConnected
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50`}
              >
                {isLoading ? 'Connecting...' : 
                 isConnected ? 'Disconnect' : 'Connect'}
              </button>
              
              <div className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            
            {error && (
              <div className="text-sm text-red-500">
                Error: {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Drone className="h-4 w-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Controls
          </TabsTrigger>
          <TabsTrigger value="missions" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Missions
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Media
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drone Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Status information will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drone Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => handleDroneCommand('takeoff')}>
                  Takeoff
                </Button>
                <Button onClick={() => handleDroneCommand('land')}>
                  Land
                </Button>
                <Button onClick={() => handleDroneCommand('emergency_stop')}>
                  Emergency Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mission Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Mission management will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Media library functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DroneControlRefactoredDebug;
