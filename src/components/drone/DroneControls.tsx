import { 
  Play, 
  Square, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Move,
  RotateCw,
  Camera,
  Video,
  Square as StopIcon
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface DroneControlsProps {
  isConnected: boolean;
  onCommand: (command: string, params?: Record<string, unknown>) => void;
  isLoading: boolean;
}

const DroneControls: React.FC<DroneControlsProps> = ({ 
  isConnected, 
  onCommand, 
  isLoading 
}) => {
  const [moveDistance, setMoveDistance] = useState(50);
  const [rotateDegrees, setRotateDegrees] = useState(90);
  const [droneSpeed, setDroneSpeed] = useState(50);

  const handleBasicCommand = useCallback((command: string) => {
    if (!isConnected) return;
    onCommand(command);
  }, [isConnected, onCommand]);

  const handleMovement = useCallback((direction: string) => {
    if (!isConnected) return;
    onCommand('move', { direction, distance: moveDistance });
  }, [isConnected, onCommand, moveDistance]);

  const handleRotation = useCallback((direction: 'left' | 'right') => {
    if (!isConnected) return;
    onCommand('rotate', { direction, degrees: rotateDegrees });
  }, [isConnected, onCommand, rotateDegrees]);

  const handleSpeedChange = useCallback((speed: number) => {
    setDroneSpeed(speed);
    if (isConnected) {
      onCommand('set_speed', { speed });
    }
  }, [isConnected, onCommand]);

  return (
    <div className="space-y-6">
      {/* Basic Flight Controls */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Basic Flight Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => handleBasicCommand('takeoff')}
              disabled={!isConnected || isLoading}
              className="h-12"
              variant="default"
            >
              <Play className="h-4 w-4 mr-2" />
              Takeoff
            </Button>
            
            <Button
              onClick={() => handleBasicCommand('land')}
              disabled={!isConnected || isLoading}
              className="h-12"
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Land
            </Button>
            
            <Button
              onClick={() => handleBasicCommand('emergency_stop')}
              disabled={!isConnected || isLoading}
              className="h-12"
              variant="destructive"
            >
              <StopIcon className="h-4 w-4 mr-2" />
              Emergency Stop
            </Button>
            
            <Button
              onClick={() => handleBasicCommand('return_home')}
              disabled={!isConnected || isLoading}
              className="h-12"
              variant="secondary"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Movement Controls */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            Movement Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Distance Control */}
            <div className="space-y-2">
              <Label htmlFor="moveDistance">Move Distance: {moveDistance}cm</Label>
              <Slider
                id="moveDistance"
                min={10}
                max={200}
                step={10}
                value={[moveDistance]}
                onValueChange={(value) => setMoveDistance(value[0])}
                className="w-full"
              />
            </div>

            {/* Movement Buttons */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              <div></div>
              <Button
                onClick={() => handleMovement('up')}
                disabled={!isConnected || isLoading}
                variant="outline"
                size="sm"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <div></div>
              
              <Button
                onClick={() => handleMovement('left')}
                disabled={!isConnected || isLoading}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-dashed border-muted-foreground rounded-full"></div>
              </div>
              
              <Button
                onClick={() => handleMovement('right')}
                disabled={!isConnected || isLoading}
                variant="outline"
                size="sm"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <div></div>
              <Button
                onClick={() => handleMovement('down')}
                disabled={!isConnected || isLoading}
                variant="outline"
                size="sm"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <div></div>
            </div>

            {/* Forward/Backward */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handleMovement('forward')}
                disabled={!isConnected || isLoading}
                variant="outline"
              >
                Forward
              </Button>
              <Button
                onClick={() => handleMovement('back')}
                disabled={!isConnected || isLoading}
                variant="outline"
              >
                Backward
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rotation Controls */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5" />
            Rotation Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rotateDegrees">Rotation: {rotateDegrees}°</Label>
              <Slider
                id="rotateDegrees"
                min={15}
                max={360}
                step={15}
                value={[rotateDegrees]}
                onValueChange={(value) => setRotateDegrees(value[0])}
                className="w-full"
              />
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handleRotation('left')}
                disabled={!isConnected || isLoading}
                variant="outline"
              >
                Rotate Left
              </Button>
              <Button
                onClick={() => handleRotation('right')}
                disabled={!isConnected || isLoading}
                variant="outline"
              >
                Rotate Right
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speed Control */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle>Speed Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="droneSpeed">Drone Speed: {droneSpeed}%</Label>
            <Slider
              id="droneSpeed"
              min={10}
              max={100}
              step={10}
              value={[droneSpeed]}
              onValueChange={(value) => handleSpeedChange(value[0])}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Camera Controls */}
      <Card className="glass-card border-lime-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => handleBasicCommand('take_photo')}
              disabled={!isConnected || isLoading}
              variant="outline"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
            
            <Button
              onClick={() => handleBasicCommand('start_recording')}
              disabled={!isConnected || isLoading}
              variant="outline"
            >
              <Video className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
            
            <Button
              onClick={() => handleBasicCommand('stop_recording')}
              disabled={!isConnected || isLoading}
              variant="outline"
            >
              <StopIcon className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
            
            <Button
              onClick={() => handleBasicCommand('flip')}
              disabled={!isConnected || isLoading}
              variant="outline"
            >
              Flip
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(DroneControls);
