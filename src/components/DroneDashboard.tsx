import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../services/websocketService';

interface DroneTelemetry {
  connected: boolean;
  flying: boolean;
  recording: boolean;
  battery: number;
  altitude: number;
  speed: number;
  temperature: number;
  position: { x: number; y: number; z: number };
  orientation: { yaw: number; pitch: number; roll: number };
  lastUpdate: string;
}

const DroneDashboard: React.FC = () => {
  const { droneStatus, sendDroneCommand } = useWebSocket();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  useEffect(() => {
    if (droneStatus) {
      setIsConnected(droneStatus.connected);
      setConnectionStatus(droneStatus.connected ? 'Connected' : 'Disconnected');
    }
  }, [droneStatus]);

  const handleConnect = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/drone/connect', {
        method: 'POST'
      });
      if (response.ok) {
        setConnectionStatus('Connecting...');
      }
    } catch (error) {
      console.error('Failed to connect to drone:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/drone/disconnect', {
        method: 'POST'
      });
      if (response.ok) {
        setConnectionStatus('Disconnected');
      }
    } catch (error) {
      console.error('Failed to disconnect from drone:', error);
    }
  };

  const handleTakeoff = () => {
    sendDroneCommand('takeoff');
  };

  const handleLand = () => {
    sendDroneCommand('land');
  };

  const handleEmergency = () => {
    sendDroneCommand('emergency');
  };

  const handleMove = (direction: string, distance: number) => {
    sendDroneCommand('move', { direction, distance });
  };

  const handleRotate = (degrees: number) => {
    sendDroneCommand('rotate', { degrees });
  };

  const handleStartRecording = () => {
    sendDroneCommand('start_recording');
  };

  const handleStopRecording = () => {
    sendDroneCommand('stop_recording');
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-600';
    if (battery > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBatteryIcon = (battery: number) => {
    if (battery > 75) return '🔋';
    if (battery > 50) return '🔋';
    if (battery > 25) return '🔋';
    return '🔋';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚁 Drone Dashboard</h1>
        <p className="text-gray-600">Real-time drone control and telemetry</p>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-lg font-medium">{connectionStatus}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Connect
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Data */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Telemetry Data</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-2">{getBatteryIcon(droneStatus?.battery || 0)}</div>
                <div className={`text-2xl font-bold ${getBatteryColor(droneStatus?.battery || 0)}`}>
                  {droneStatus?.battery || 0}%
                </div>
                <p className="text-sm text-gray-600">Battery</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl mb-2">📏</div>
                <div className="text-2xl font-bold text-gray-900">
                  {droneStatus?.altitude || 0}m
                </div>
                <p className="text-sm text-gray-600">Altitude</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-2xl font-bold text-gray-900">
                  {droneStatus?.speed || 0} m/s
                </div>
                <p className="text-sm text-gray-600">Speed</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl mb-2">🌡️</div>
                <div className="text-2xl font-bold text-gray-900">
                  {droneStatus?.temperature || 0}°C
                </div>
                <p className="text-sm text-gray-600">Temperature</p>
              </div>
            </div>
          </div>

          {/* Position and Orientation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Position & Orientation</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Position</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">X:</span>
                    <span className="font-mono">{droneStatus?.position?.x || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Y:</span>
                    <span className="font-mono">{droneStatus?.position?.y || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Z:</span>
                    <span className="font-mono">{droneStatus?.position?.z || 0}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Orientation</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Yaw:</span>
                    <span className="font-mono">{droneStatus?.orientation?.yaw || 0}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pitch:</span>
                    <span className="font-mono">{droneStatus?.orientation?.pitch || 0}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Roll:</span>
                    <span className="font-mono">{droneStatus?.orientation?.roll || 0}°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Controls */}
        <div className="space-y-6">
          {/* Basic Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Flight Controls</h2>
            <div className="space-y-3">
              <button
                onClick={handleTakeoff}
                disabled={!isConnected || droneStatus?.flying}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚁 Takeoff
              </button>
              
              <button
                onClick={handleLand}
                disabled={!isConnected || !droneStatus?.flying}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🛬 Land
              </button>
              
              <button
                onClick={handleEmergency}
                disabled={!isConnected}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚨 Emergency Stop
              </button>
            </div>
          </div>

          {/* Movement Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Movement</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleMove('forward', 1)}
                disabled={!isConnected || !droneStatus?.flying}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↑ Forward
              </button>
              <button
                onClick={() => handleMove('backward', 1)}
                disabled={!isConnected || !droneStatus?.flying}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↓ Backward
              </button>
              <button
                onClick={() => handleMove('left', 1)}
                disabled={!isConnected || !droneStatus?.flying}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Left
              </button>
              <button
                onClick={() => handleMove('right', 1)}
                disabled={!isConnected || !droneStatus?.flying}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                → Right
              </button>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Rotation</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRotate(-90)}
                  disabled={!isConnected || !droneStatus?.flying}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↺ -90°
                </button>
                <button
                  onClick={() => handleRotate(90)}
                  disabled={!isConnected || !droneStatus?.flying}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↻ +90°
                </button>
              </div>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recording</h2>
            <div className="space-y-3">
              <button
                onClick={handleStartRecording}
                disabled={!isConnected || droneStatus?.recording}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔴 Start Recording
              </button>
              
              <button
                onClick={handleStopRecording}
                disabled={!isConnected || !droneStatus?.recording}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⏹️ Stop Recording
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneDashboard;
