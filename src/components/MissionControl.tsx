import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../services/websocketService';

interface Mission {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  content_results?: any;
}

interface MissionTemplate {
  name: string;
  description: string;
  type: string;
  duration: string;
  platforms: string[];
}

const MissionControl: React.FC = () => {
  const { droneStatus, sendDroneCommand } = useWebSocket();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);

  // Load mission templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('http://localhost:8031/templates');
        const data = await response.json();
        setTemplates(Object.values(data.templates));
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    loadTemplates();
  }, []);

  // Load missions
  useEffect(() => {
    const loadMissions = async () => {
      try {
        const response = await fetch('http://localhost:8031/missions');
        const data = await response.json();
        setMissions(data);
      } catch (error) {
        console.error('Failed to load missions:', error);
      }
    };
    loadMissions();
  }, []);

  const createMission = async () => {
    if (!selectedTemplate) return;
    
    setIsCreating(true);
    try {
      const template = templates.find(t => t.name === selectedTemplate);
      if (!template) return;

      const response = await fetch(`http://localhost:8031/templates/${template.type}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_name: 'Nordic Field A',
          area: 'Section 1',
          crop_type: 'wheat',
          field_id: 'FIELD_001'
        })
      });

      if (response.ok) {
        const newMission = await response.json();
        setMissions(prev => [newMission, ...prev]);
        setSelectedTemplate('');
      }
    } catch (error) {
      console.error('Failed to create mission:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const executeMission = async (missionId: string) => {
    setIsExecuting(true);
    try {
      const response = await fetch(`http://localhost:8031/missions/${missionId}/execute`, {
        method: 'POST'
      });

      if (response.ok) {
        setActiveMission(missions.find(m => m.id === missionId) || null);
        // Poll for mission status updates
        pollMissionStatus(missionId);
      }
    } catch (error) {
      console.error('Failed to execute mission:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const pollMissionStatus = async (missionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8031/missions/${missionId}`);
        const mission = await response.json();
        
        setMissions(prev => prev.map(m => m.id === missionId ? mission : m));
        
        if (mission.status === 'completed' || mission.status === 'failed') {
          clearInterval(interval);
          setActiveMission(null);
        }
      } catch (error) {
        console.error('Failed to poll mission status:', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  const cancelMission = async (missionId: string) => {
    try {
      await fetch(`http://localhost:8031/missions/${missionId}/cancel`, {
        method: 'POST'
      });
      setActiveMission(null);
    } catch (error) {
      console.error('Failed to cancel mission:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚁 Mission Control</h1>
        <p className="text-gray-600">Manage drone missions and content generation</p>
      </div>

      {/* Drone Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Drone Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${droneStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-sm text-gray-600">Connection</p>
            <p className="font-semibold">{droneStatus?.connected ? 'Connected' : 'Disconnected'}</p>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${droneStatus?.flying ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
            <p className="text-sm text-gray-600">Flight Status</p>
            <p className="font-semibold">{droneStatus?.flying ? 'Flying' : 'Landed'}</p>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${droneStatus?.recording ? 'bg-red-500' : 'bg-gray-400'}`}></div>
            <p className="text-sm text-gray-600">Recording</p>
            <p className="font-semibold">{droneStatus?.recording ? 'Recording' : 'Stopped'}</p>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-2 bg-blue-500"></div>
            <p className="text-sm text-gray-600">Battery</p>
            <p className="font-semibold">{droneStatus?.battery || 0}%</p>
          </div>
        </div>
      </div>

      {/* Create Mission */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Mission</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mission Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.name} value={template.name}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={createMission}
            disabled={!selectedTemplate || isCreating}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Mission'}
          </button>
        </div>
      </div>

      {/* Missions List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Missions</h2>
        <div className="space-y-4">
          {missions.map((mission) => (
            <div key={mission.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{mission.name}</h3>
                  <p className="text-sm text-gray-600">Type: {mission.type}</p>
                  <p className="text-sm text-gray-600">Created: {new Date(mission.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mission.status)}`}>
                    {mission.status}
                  </span>
                  {mission.status === 'planned' && (
                    <button
                      onClick={() => executeMission(mission.id)}
                      disabled={isExecuting}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      Execute
                    </button>
                  )}
                  {mission.status === 'in_progress' && (
                    <button
                      onClick={() => cancelMission(mission.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              
              {mission.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  Error: {mission.error_message}
                </div>
              )}
              
              {mission.content_results && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  Content Generated: {mission.content_results.clips_generated} clips for {mission.content_results.platforms?.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MissionControl;
