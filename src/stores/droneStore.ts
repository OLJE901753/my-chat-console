import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DroneStatus {
  connected: boolean;
  battery: number;
  altitude: number;
  speed: number;
  temperature: number;
  position: { x: number; y: number; z: number };
  orientation: { yaw: number; pitch: number; roll: number };
  mission: string | null;
  lastUpdate: string;
  weatherConditions: {
    windSpeed: number;
    windDirection: number;
    visibility: number;
    precipitation: number;
    temperature: number;
    humidity: number;
  };
  safetyStatus: {
    obstacleDetected: boolean;
    geofenceViolation: boolean;
    lowBattery: boolean;
    weatherWarning: boolean;
    emergencyMode: boolean;
  };
}

export interface Mission {
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

export interface DroneSettings {
  moveDistance: number;
  rotateDegrees: number;
  droneSpeed: number;
  autoReturnHome: boolean;
  geofenceEnabled: boolean;
  maxAltitude: number;
}

interface DroneStore {
  // State
  status: DroneStatus;
  missions: Mission[];
  activeMission: Mission | null;
  settings: DroneSettings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateStatus: (status: Partial<DroneStatus>) => void;
  setConnected: (connected: boolean) => void;
  addMission: (mission: Mission) => void;
  setMissions: (missions: Mission[]) => void;
  updateMission: (missionId: string, updates: Partial<Mission>) => void;
  deleteMission: (missionId: string) => void;
  setActiveMission: (mission: Mission | null) => void;
  updateSettings: (settings: Partial<DroneSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialStatus: DroneStatus = {
  connected: false,
  battery: 0,
  altitude: 0,
  speed: 0,
  temperature: 25,
  position: { x: 0, y: 0, z: 0 },
  orientation: { yaw: 0, pitch: 0, roll: 0 },
  mission: null,
  lastUpdate: new Date().toISOString(),
  weatherConditions: {
    windSpeed: 0,
    windDirection: 0,
    visibility: 10000,
    precipitation: 0,
    temperature: 25,
    humidity: 60
  },
  safetyStatus: {
    obstacleDetected: false,
    geofenceViolation: false,
    lowBattery: false,
    weatherWarning: false,
    emergencyMode: false
  }
};

const initialSettings: DroneSettings = {
  moveDistance: 50,
  rotateDegrees: 90,
  droneSpeed: 50,
  autoReturnHome: true,
  geofenceEnabled: true,
  maxAltitude: 100
};

export const useDroneStore = create<DroneStore>()(
  devtools(
    (set, _get) => ({
      // Initial state
      status: initialStatus,
      missions: [],
      activeMission: null,
      settings: initialSettings,
      isLoading: false,
      error: null,

      // Actions
      updateStatus: (statusUpdate) =>
        set((state) => ({
          status: { ...state.status, ...statusUpdate, lastUpdate: new Date().toISOString() }
        })),

      setConnected: (connected) =>
        set((state) => ({
          status: { ...state.status, connected }
        })),

      addMission: (mission) =>
        set((state) => ({
          missions: [...state.missions, mission]
        })),

      setMissions: (missions) =>
        set({ missions }),

      updateMission: (missionId, updates) =>
        set((state) => ({
          missions: state.missions.map(mission =>
            mission.id === missionId ? { ...mission, ...updates } : mission
          ),
          activeMission: state.activeMission?.id === missionId 
            ? { ...state.activeMission, ...updates }
            : state.activeMission
        })),

      deleteMission: (missionId) =>
        set((state) => ({
          missions: state.missions.filter(mission => mission.id !== missionId),
          activeMission: state.activeMission?.id === missionId ? null : state.activeMission
        })),

      setActiveMission: (mission) =>
        set({ activeMission: mission }),

      updateSettings: (settingsUpdate) =>
        set((state) => ({
          settings: { ...state.settings, ...settingsUpdate }
        })),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      setError: (error) =>
        set({ error }),

      reset: () =>
        set({
          status: initialStatus,
          missions: [],
          activeMission: null,
          settings: initialSettings,
          isLoading: false,
          error: null
        })
    }),
    {
      name: 'drone-store',
    }
  )
);
