import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  enabled: boolean;
  performance: {
    accuracy: number;
    efficiency: number;
    uptime: number;
    tasksCompleted: number;
    lastActive: string;
  };
  capabilities: string[];
  permissions: {
    readSensorData: boolean;
    controlDrones: boolean;
    modifySettings: boolean;
    sendAlerts: boolean;
  };
  configuration: {
    sensitivity: number;
    updateFrequency: number;
    alertThreshold: number;
  };
  metrics: {
    dailyTasks: number;
    weeklyTasks: number;
    successRate: number;
    avgResponseTime: number;
  };
  recentAlerts: Array<{
    id: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
}

export interface AIMission {
  id: string;
  farmId: string;
  objectives: string[];
  status: 'generating' | 'ready' | 'executing' | 'completed' | 'failed';
  flightConfig: {
    altitude: number;
    speed: number;
    duration: number;
    waypoints: Array<{
      latitude: number;
      longitude: number;
      altitude: number;
      action?: string;
    }>;
  };
  dataCollection: {
    sensors: string[];
    frequency: number;
    duration: number;
  };
  aiInstructions: string;
  safetyParams: {
    maxAltitude: number;
    geofence: boolean;
    weatherLimits: boolean;
    batteryThreshold: number;
  };
  createdAt: string;
  executedAt?: string;
  completedAt?: string;
}

export interface AIStats {
  totalMissions: number;
  successRate: number;
  avgExecutionTime: number;
  modelPerformance: {
    cropAnalysis: number;
    weatherPrediction: number;
    routeOptimization: number;
    weatherPrediction: number;
  };
}

interface AIStore {
  // State
  agents: AIAgent[];
  missions: AIMission[];
  currentMission: AIMission | null;
  stats: AIStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAgents: (agents: AIAgent[]) => void;
  updateAgent: (agentId: string, updates: Partial<AIAgent>) => void;
  toggleAgent: (agentId: string) => void;
  setMissions: (missions: AIMission[]) => void;
  addMission: (mission: AIMission) => void;
  updateMission: (missionId: string, updates: Partial<AIMission>) => void;
  setCurrentMission: (mission: AIMission | null) => void;
  setStats: (stats: AIStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialStats: AIStats = {
  totalMissions: 0,
  successRate: 0,
  avgExecutionTime: 0,
  modelPerformance: {
    cropAnalysis: 0,
    weatherPrediction: 0,
    routeOptimization: 0,
    weatherPrediction: 0
  }
};

export const useAIStore = create<AIStore>()(
  devtools(
    (set, _get) => ({
      // Initial state
      agents: [],
      missions: [],
      currentMission: null,
      stats: initialStats,
      isLoading: false,
      error: null,

      // Actions
      setAgents: (agents) =>
        set({ agents }),

      updateAgent: (agentId, updates) =>
        set((state) => ({
          agents: state.agents.map(agent =>
            agent.id === agentId ? { ...agent, ...updates } : agent
          )
        })),

      toggleAgent: (agentId) =>
        set((state) => ({
          agents: state.agents.map(agent =>
            agent.id === agentId 
              ? { ...agent, enabled: !agent.enabled }
              : agent
          )
        })),

      setMissions: (missions) =>
        set({ missions }),

      addMission: (mission) =>
        set((state) => ({
          missions: [...state.missions, mission]
        })),

      updateMission: (missionId, updates) =>
        set((state) => ({
          missions: state.missions.map(mission =>
            mission.id === missionId ? { ...mission, ...updates } : mission
          ),
          currentMission: state.currentMission?.id === missionId 
            ? { ...state.currentMission, ...updates }
            : state.currentMission
        })),

      setCurrentMission: (mission) =>
        set({ currentMission: mission }),

      setStats: (stats) =>
        set({ stats }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      setError: (error) =>
        set({ error }),

      reset: () =>
        set({
          agents: [],
          missions: [],
          currentMission: null,
          stats: initialStats,
          isLoading: false,
          error: null
        })
    }),
    {
      name: 'ai-store',
    }
  )
);
