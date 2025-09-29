// Frontend Types for Phase 4 Dashboard

export interface WebSocketMessage {
  type: 'experiment_update' | 'task_update' | 'agent_status' | 'system_status' | 'pong';
  data: any;
  timestamp: string;
}

export interface CoordinatorEvent {
  type: string;
  task_id: string;
  data: Record<string, any>;
  timestamp: string;
  traceId: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: any;
  cost?: number;
  experimentId?: string;
  agentId?: string;
}

export interface ExperimentMetrics {
  total: number;
  success: number;
  failed: number;
  running: number;
  totalCost: number;
  avgCost: number;
  successRate: number;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError: string | null;
  connectionId: string | null;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TrendData {
  success: ChartDataPoint[];
  failure: ChartDataPoint[];
  cost: ChartDataPoint[];
}

export interface StatusChipProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'running' | 'pending';
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface Experiment {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  endedAt?: string;
  cost?: number;
  duration?: number;
  agentId?: string;
  metadata?: Record<string, any>;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastSeen: string;
  capabilities: string[];
  load: number;
  tasksCompleted: number;
  successRate: number;
}

export interface DashboardConfig {
  autoScroll: boolean;
  maxLogs: number;
  refreshInterval: number;
  showCosts: boolean;
  showTimestamps: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// Re-export agent types
export * from './agents';

