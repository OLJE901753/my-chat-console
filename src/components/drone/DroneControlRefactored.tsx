import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDroneStore } from '@/stores/droneStore';
import { useDroneStatus, useDroneConnection, useMissionMutations } from '@/hooks/useDroneQueries';
import DroneStatusPanel from './DroneStatusPanel';
import DroneControls from './DroneControls';
import MissionManager from './MissionManager';
import { Drone, Settings, MapPin, Camera } from 'lucide-react';

const DroneControlRefactored: React.FC = () => {
  // Zustand store state
  const { 
    status, 
    missions, 
    activeMission, 
    isLoading, 
    error,
    setConnected,
    setActiveMission
  } = useDroneStore();

  // React Query hooks
  const { data: droneStatus, isLoading: statusLoading } = useDroneStatus();
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
  const handleDroneCommand = (command: string, params?: any) => {
    // This would be implemented with the drone command mutation
    console.log('Drone command:', command, params);
  };

  // Update active mission when missions change
  useEffect(() => {
    const active = missions.find(mission => mission.status === 'active');
    setActiveMission(active || null);
  }, [missions, setActiveMission]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Drone className="h-6 w-6" />
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
          <Card>
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
