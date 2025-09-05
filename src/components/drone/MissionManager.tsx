import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  CheckCircle,
  XCircle,
  Plus,
  Trash2
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Mission {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'paused';
  waypoints: Array<{
    id: string;
    latitude: number;
    longitude: number;
    altitude: number;
    action?: string;
  }>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  progress: number;
}

interface MissionManagerProps {
  missions: Mission[];
  activeMission: Mission | null;
  onStartMission: (missionId: string) => void;
  onPauseMission: (missionId: string) => void;
  onStopMission: (missionId: string) => void;
  onDeleteMission: (missionId: string) => void;
  isLoading: boolean;
}

const MissionManager: React.FC<MissionManagerProps> = ({
  missions,
  activeMission,
  onStartMission,
  onPauseMission,
  onStopMission,
  onDeleteMission,
  isLoading
}) => {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMissionAction = useCallback((mission: Mission, action: string) => {
    switch (action) {
      case 'start':
        onStartMission(mission.id);
        break;
      case 'pause':
        onPauseMission(mission.id);
        break;
      case 'stop':
        onStopMission(mission.id);
        break;
      case 'delete':
        onDeleteMission(mission.id);
        break;
    }
  }, [onStartMission, onPauseMission, onStopMission, onDeleteMission]);

  return (
    <div className="space-y-6">
      {/* Active Mission Status */}
      {activeMission && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Play className="h-5 w-5" />
              Active Mission: {activeMission.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {activeMission.progress}%
                </span>
              </div>
              <Progress value={activeMission.progress} className="h-2" />
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleMissionAction(activeMission, 'pause')}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={() => handleMissionAction(activeMission, 'stop')}
                  disabled={isLoading}
                  variant="destructive"
                  size="sm"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mission List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mission Management</span>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Mission
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-3">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMission?.id === mission.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMission(mission)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(mission.status)}
                      <div>
                        <h3 className="font-medium">{mission.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {mission.waypoints.length} waypoints • Created {new Date(mission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(mission.status)}>
                        {mission.status}
                      </Badge>
                      
                      {mission.status === 'active' && mission.startedAt && (
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(mission.startedAt)}
                        </span>
                      )}
                      
                      <div className="flex gap-1">
                        {mission.status === 'pending' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMissionAction(mission, 'start');
                            }}
                            disabled={isLoading}
                            size="sm"
                            variant="outline"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {mission.status === 'active' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMissionAction(mission, 'pause');
                            }}
                            disabled={isLoading}
                            size="sm"
                            variant="outline"
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMissionAction(mission, 'delete');
                          }}
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {mission.status === 'active' && (
                    <div className="mt-3">
                      <Progress value={mission.progress} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="pending">
              {missions.filter(m => m.status === 'pending').map((mission) => (
                <div key={mission.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{mission.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {mission.waypoints.length} waypoints
                      </p>
                    </div>
                    <Button
                      onClick={() => handleMissionAction(mission, 'start')}
                      disabled={isLoading}
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="active">
              {missions.filter(m => m.status === 'active').map((mission) => (
                <div key={mission.id} className="p-4 border rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{mission.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Started {mission.startedAt && new Date(mission.startedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge className="bg-blue-500">Active</Badge>
                    </div>
                    
                    <Progress value={mission.progress} className="h-2" />
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleMissionAction(mission, 'pause')}
                        disabled={isLoading}
                        size="sm"
                        variant="outline"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                      <Button
                        onClick={() => handleMissionAction(mission, 'stop')}
                        disabled={isLoading}
                        size="sm"
                        variant="destructive"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="completed">
              {missions.filter(m => m.status === 'completed').map((mission) => (
                <div key={mission.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{mission.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Completed {mission.completedAt && new Date(mission.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-green-500">Completed</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(MissionManager);
