import { Plane, Settings, MapPin, Camera } from 'lucide-react';
import React, { useEffect } from 'react';

import DroneControls from './DroneControls';
import DroneStatusPanel from './DroneStatusPanel';
import MissionManager from './MissionManager';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDroneStatus, useDroneConnection, useMissionMutations, useDroneCommand } from '@/hooks/useDroneQueries';
import { useDroneStore } from '@/stores/droneStore';

const DroneControlRefactored: React.FC = () => {
  // Zustand store state
  const { 
    status, 
    missions, 
    activeMission, 
    isLoading, 
    error,
    setActiveMission
  } = useDroneStore();

  // React Query hooks
  // Hooks kept to preserve data flow; values currently unused in UI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: droneStatus } = useDroneStatus();
  const { connect, disconnect, isConnecting, isDisconnecting } = useDroneConnection();
  const {
    startMission,
    pauseMission,
    stopMission,
    deleteMission,
    isStarting,
    isPausing,
    isStopping,
    isDeleting
  } = useMissionMutations();

  // Drone command mutation (send actual commands instead of console.log)
  const { mutate: executeDroneCommand } = useDroneCommand();

  // Handle connection
  const handleConnect = () => {
    if (status.connected) {
      disconnect();
    } else {
      connect();
    }
  };

  // Handle mission actions
  const handleStartMission = (missionId: string) => {
    startMission(missionId);
  };

  const handlePauseMission = (missionId: string) => {
    pauseMission(missionId);
  };

  const handleStopMission = (missionId: string) => {
    stopMission(missionId);
  };

  const handleDeleteMission = (missionId: string) => {
    deleteMission(missionId);
  };

  // Handle drone commands
  const handleDroneCommand = (command: string, params?: Record<string, unknown>) => {
    executeDroneCommand({ command, params });
  };

  // Update active mission when missions change
  useEffect(() => {
    const active = missions.find(mission => mission.status === 'active');
    setActiveMission(active || null);
  }, [missions, setActiveMission]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            Drone Control System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleConnect}
                disabled={isConnecting || isDisconnecting}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  status.connected
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50`}
              >
                {isConnecting ? 'Connecting...' : 
                 isDisconnecting ? 'Disconnecting...' :
                 status.connected ? 'Disconnect' : 'Connect'}
              </button>
              
              <div className="text-sm text-muted-foreground">
                {status.connected ? 'Connected' : 'Disconnected'}
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
            <Plane className="h-4 w-4" />
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
          <DroneStatusPanel status={status} />
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <DroneControls
            isConnected={status.connected}
            onCommand={handleDroneCommand}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="missions" className="space-y-4">
          <MissionManager
            missions={missions}
            activeMission={activeMission}
            onStartMission={handleStartMission}
            onPauseMission={handlePauseMission}
            onStopMission={handleStopMission}
            onDeleteMission={handleDeleteMission}
            isLoading={isStarting || isPausing || isStopping || isDeleting}
          />
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card className="glass-card border-lime-500/30">
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Media library functionality will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DroneControlRefactored;
