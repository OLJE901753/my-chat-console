// Core API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Experiment Types
export interface Experiment {
  id: string;
  user_id: string | null;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  ended_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateExperimentRequest {
  name: string;
  user_id?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface ExperimentLog {
  id: string;
  experiment_id: string;
  user_id: string | null;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  payload: Record<string, any>;
  created_at: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'experiment_update' | 'task_update' | 'agent_status' | 'system_status' | 'pong';
  data: any;
  timestamp: string;
}

export interface CoordinatorEvent {
  type: string;
  task_id: string;
  data: Record<string, any>;
}

// Error Types
export interface ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;
}

// Database Types
export interface DatabaseConfig {
  url: string;
  serviceRoleKey: string;
  configured: boolean;
}

export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  frontendUrl: string;
  supabase: DatabaseConfig;
  isDevelopment: boolean;
  isProduction: boolean;
}
