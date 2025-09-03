import { Mission, DroneStatus } from '@/stores/droneStore';

const API_BASE_URL = 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DroneCommand {
  command: string;
  params?: Record<string, any>;
}

// Drone API functions
export const droneApi = {
  // Get drone status
  getStatus: async (): Promise<DroneStatus> => {
    const response = await fetch(`${API_BASE_URL}/drone/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch drone status');
    }
    const result = await response.json();
    return result.data;
  },

  // Execute drone command
  executeCommand: async (command: DroneCommand): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/drone/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    
    if (!response.ok) {
      throw new Error('Failed to execute drone command');
    }
    
    return response.json();
  },

  // Connect to drone
  connect: async (): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/drone/connect`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to connect to drone');
    }
    
    return response.json();
  },

  // Disconnect from drone
  disconnect: async (): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/drone/disconnect`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to disconnect from drone');
    }
    
    return response.json();
  },

  // Get command history
  getCommandHistory: async (limit: number = 50): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/drone/commands?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch command history');
    }
    const result = await response.json();
    return result.data || [];
  },

  // Get photos
  getPhotos: async (limit: number = 20): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/drone/photos?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch photos');
    }
    const result = await response.json();
    return result.data || [];
  },

  // Get recordings
  getRecordings: async (limit: number = 20): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/drone/recordings?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recordings');
    }
    const result = await response.json();
    return result.data || [];
  }
};

// Mission API functions
export const missionApi = {
  // Get all missions
  getMissions: async (): Promise<Mission[]> => {
    const response = await fetch(`${API_BASE_URL}/missions`);
    if (!response.ok) {
      throw new Error('Failed to fetch missions');
    }
    const result = await response.json();
    return result.data || [];
  },

  // Create new mission
  createMission: async (mission: Omit<Mission, 'id' | 'createdAt' | 'progress'>): Promise<Mission> => {
    const response = await fetch(`${API_BASE_URL}/missions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mission),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create mission');
    }
    
    const result = await response.json();
    return result.data;
  },

  // Update mission
  updateMission: async (missionId: string, updates: Partial<Mission>): Promise<Mission> => {
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update mission');
    }
    
    const result = await response.json();
    return result.data;
  },

  // Delete mission
  deleteMission: async (missionId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete mission');
    }
  },

  // Start mission
  startMission: async (missionId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}/start`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to start mission');
    }
    
    return response.json();
  },

  // Pause mission
  pauseMission: async (missionId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}/pause`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to pause mission');
    }
    
    return response.json();
  },

  // Stop mission
  stopMission: async (missionId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}/stop`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to stop mission');
    }
    
    return response.json();
  }
};
