// Agent System Types - Unified Schemas v1

export interface AgentCapability {
  type: string;
  version: string;
  maxConcurrency: number;
  estimatedDuration?: number;
}

export interface AgentHeartbeat {
  agentId: string;
  capabilities: AgentCapability[];
  lastSeen: string;
  load: number; // 0-1 utilization
  version: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metadata?: Record<string, any>;
}

export interface Task {
  taskId: string;
  type: string;
  payload: Record<string, any>;
  priority: 0 | 1 | 2 | 3; // 0 = highest
  idempotencyKey?: string;
  requiredCapability: string;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
    jitter: boolean;
  };
  createdAt: string;
  scheduledAt?: string;
}

export interface TaskRun {
  runId: string;
  taskId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  result?: Record<string, any>;
  error?: {
    message: string;
    code: string;
    stack?: string;
    retryable: boolean;
  };
  attempt: number;
  traceId: string;
}

export interface AgentEvent {
  eventId: string;
  taskId?: string;
  runId?: string;
  agentId: string;
  type: 'task.queued' | 'task.started' | 'task.progress' | 'task.completed' | 'task.failed' | 'agent.heartbeat' | 'agent.registered' | 'agent.offline';
  payload: Record<string, any>;
  timestamp: string;
  traceId: string;
}

export interface AgentRegistry {
  agentId: string;
  name: string;
  type: 'drone' | 'python-ai' | 'vision' | 'content' | 'analytics';
  capabilities: AgentCapability[];
  version: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastHeartbeat?: string;
  config: Record<string, any>;
  registeredAt: string;
  updatedAt: string;
}

export interface AgentMetrics {
  agentId: string;
  tasksCompleted: number;
  tasksRunning: number;
  tasksFailed: number;
  avgExecutionTime: number;
  successRate: number;
  lastActivityAt: string;
  cpuUsage?: number;
  memoryUsage?: number;
}

// Agent Communication Protocols
export interface AgentRequest {
  requestId: string;
  task: Task;
  traceId: string;
  timestamp: string;
}

export interface AgentResponse {
  requestId: string;
  runId: string;
  status: TaskRun['status'];
  result?: Record<string, any>;
  error?: TaskRun['error'];
  timestamp: string;
  traceId: string;
}

// Queue Management
export interface QueueStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  avgWaitTime: number;
  avgExecutionTime: number;
}

// Agent Orchestrator Interface
export interface AgentOrchestrator {
  submitTask(task: Omit<Task, 'taskId' | 'createdAt'>): Promise<{ taskId: string }>;
  getTaskStatus(taskId: string): Promise<TaskRun | null>;
  cancelTask(taskId: string, reason?: string): Promise<boolean>;
  getAgentMetrics(agentId?: string): Promise<AgentMetrics[]>;
  getQueueStats(): Promise<QueueStats>;
  registerAgent(agent: Omit<AgentRegistry, 'registeredAt' | 'updatedAt'>): Promise<void>;
  heartbeat(heartbeat: AgentHeartbeat): Promise<void>;
  getAvailableAgents(capability?: string): Promise<AgentRegistry[]>;
}
