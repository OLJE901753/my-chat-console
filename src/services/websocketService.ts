import { useState, useEffect } from 'react';

// Types
export interface WebSocketMessage {
  type: 'experiment_update' | 'task_update' | 'agent_status' | 'system_status' | 'pong' | 
        'drone_status' | 'connection_change' | 'flight_status_change' | 'recording_status_change' | 
        'battery_warning' | 'drone_command_response' | 'drone_command_executed';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface CoordinatorEvent extends Record<string, unknown> {
  type: string;
  task_id: string;
  data: Record<string, unknown>;
  timestamp: string;
  traceId: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data: Record<string, unknown>;
  cost?: number | undefined;
  experimentId?: string | undefined;
  agentId?: string | undefined;
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

export interface DroneStatus {
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
  connectionId: string | null;
  method: 'tellojs' | 'udp';
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError: string | null;
  connectionId: string | null;
}

// Type guards for better type safety
function isCoordinatorEvent(data: Record<string, unknown>): data is CoordinatorEvent {
  return (
    typeof data.type === 'string' &&
    typeof data.task_id === 'string' &&
    typeof data.timestamp === 'string' &&
    typeof data.traceId === 'string' &&
    typeof data.data === 'object' &&
    data.data !== null
  );
}

function isWebSocketError(error: unknown): error is Event {
  return error instanceof Event;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (isWebSocketError(error)) {
    return `WebSocket error: ${error.type}`;
  }
  return 'WebSocket connection failed';
}

function safeGetProperty<T>(obj: Record<string, unknown>, key: string, defaultValue: T): T {
  const value = obj[key];
  return (value as T) ?? defaultValue;
}

// WebSocket Service Class
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private listeners: Set<() => void> = new Set();
  
  // State
  public state: WebSocketState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null,
    connectionId: null,
  };

  public logs: LogEntry[] = [];
  public maxLogs = 1000;

  public metrics: ExperimentMetrics = {
    total: 0,
    success: 0,
    failed: 0,
    running: 0,
    totalCost: 0,
    avgCost: 0,
    successRate: 0,
  };

  public droneStatus: DroneStatus | null = null;

  public autoScroll = true;
  public isPaused = false;

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.state.isConnecting = true;
    this.state.lastError = null;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = import.meta.env.DEV
      ? `${protocol}//${host}:3001/ws` // In dev, connect to backend port
      : `${protocol}//${window.location.host}/ws`; // In prod, connect to same host

    console.log('🔌 Attempting WebSocket connection to:', wsUrl);
    console.log('🔌 Environment:', import.meta.env.DEV ? 'development' : 'production');
    console.log('🔌 Protocol:', protocol);
    console.log('🔌 Host:', host);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.state.isConnected = true;
        this.state.isConnecting = false;
        this.state.reconnectAttempts = 0;
        this.state.connectionId = this.generateConnectionId();
        this.startHeartbeat();
        this.addLog('success', 'WebSocket connected', { connectionId: this.state.connectionId });
        this.notifyListeners();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          this.addLog('error', 'Failed to parse message', { 
            error: error instanceof Error ? error.message : 'Invalid message format'
          });
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.state.isConnected = false;
        this.state.isConnecting = false;
        this.stopHeartbeat();
        
        if (event.code !== 1000) {
          this.addLog('warn', 'WebSocket disconnected unexpectedly', { 
            code: event.code, 
            reason: event.reason 
          });
          this.scheduleReconnect();
        }
        this.notifyListeners();
      };

      this.ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        this.state.lastError = 'Connection error';
        
        const errorMessage = getErrorMessage(error);
            
        this.addLog('error', 'WebSocket connection error', { 
          error: errorMessage,
          type: isWebSocketError(error) ? error.type : 'unknown'
        });
        this.notifyListeners();
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.state.lastError = 'Failed to create connection';
      this.state.isConnecting = false;
      this.addLog('error', 'Failed to create WebSocket connection', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.scheduleReconnect();
      this.notifyListeners();
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'experiment_update':
        this.handleExperimentUpdate(message.data);
        break;
      case 'task_update':
        this.handleTaskUpdate(message.data);
        break;
      case 'agent_status':
        this.handleAgentStatus(message.data);
        break;
      case 'system_status':
        this.handleSystemStatus(message.data);
        break;
      case 'drone_status':
        this.handleDroneStatus(message.data);
        break;
      case 'connection_change':
        this.handleConnectionChange(message.data);
        break;
      case 'flight_status_change':
        this.handleFlightStatusChange(message.data);
        break;
      case 'recording_status_change':
        this.handleRecordingStatusChange(message.data);
        break;
      case 'battery_warning':
        this.handleBatteryWarning(message.data);
        break;
      case 'drone_command_response':
        this.handleDroneCommandResponse(message.data);
        break;
      case 'drone_command_executed':
        this.handleDroneCommandExecuted(message.data);
        break;
      case 'pong':
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleExperimentUpdate(data: Record<string, unknown>): void {
    if (!isCoordinatorEvent(data)) {
      this.addLog('warn', 'Invalid experiment update data format', data);
      return;
    }
    
    this.addLog('info', `Experiment ${data.type}`, {
      taskId: data.task_id,
      data: data.data,
      timestamp: data.timestamp,
    });

    if (data.type === 'task_completed') {
      this.metrics.success++;
      this.metrics.running = Math.max(0, this.metrics.running - 1);
    } else if (data.type === 'task_failed') {
      this.metrics.failed++;
      this.metrics.running = Math.max(0, this.metrics.running - 1);
    } else if (data.type === 'task_received') {
      this.metrics.total++;
      this.metrics.running++;
    }

    // Safe access to nested properties
    const result = safeGetProperty(data.data, 'result', {});
    const executionTime = safeGetProperty(result, 'execution_time', 0);
    
    if (typeof executionTime === 'number' && executionTime > 0) {
      const cost = this.calculateCost(executionTime);
      this.metrics.totalCost += cost;
    }

    this.updateMetrics();
    this.notifyListeners();
  }

  private handleTaskUpdate(data: Record<string, unknown>): void {
    this.addLog('info', 'Task update', data);
    this.notifyListeners();
  }

  private handleAgentStatus(data: Record<string, unknown>): void {
    this.addLog('info', 'Agent status update', data);
    this.notifyListeners();
  }

  private handleSystemStatus(data: Record<string, unknown>): void {
    this.addLog('info', 'System status update', data);
    this.notifyListeners();
  }

  private handleDroneStatus(data: Record<string, unknown>): void {
    // Update drone status in the service state
    this.droneStatus = data as unknown as DroneStatus;
    this.notifyListeners();
  }

  private handleConnectionChange(data: Record<string, unknown>): void {
    const connected = safeGetProperty(data, 'connected', false);
    const message = safeGetProperty(data, 'message', 'Connection status changed');
    
    this.addLog(connected ? 'success' : 'error', message, data);
    this.notifyListeners();
  }

  private handleFlightStatusChange(data: Record<string, unknown>): void {
    const flying = safeGetProperty(data, 'flying', false);
    const message = safeGetProperty(data, 'message', 'Flight status changed');
    
    this.addLog(flying ? 'success' : 'info', message, data);
    this.notifyListeners();
  }

  private handleRecordingStatusChange(data: Record<string, unknown>): void {
    const recording = safeGetProperty(data, 'recording', false);
    const message = safeGetProperty(data, 'message', 'Recording status changed');
    
    this.addLog(recording ? 'success' : 'info', message, data);
    this.notifyListeners();
  }

  private handleBatteryWarning(data: Record<string, unknown>): void {
    const message = safeGetProperty(data, 'message', 'Battery warning');
    
    this.addLog('warn', message, data);
    this.notifyListeners();
  }

  private handleDroneCommandResponse(data: Record<string, unknown>): void {
    const success = safeGetProperty(data, 'success', false);
    const message = safeGetProperty(data, 'message', 'Command response');
    
    this.addLog(success ? 'success' : 'error', message, data);
    this.notifyListeners();
  }

  private handleDroneCommandExecuted(data: Record<string, unknown>): void {
    const command = safeGetProperty(data, 'command', 'unknown');
    const result = safeGetProperty(data, 'result', {});
    const success = safeGetProperty(result, 'success', false);
    
    this.addLog(success ? 'success' : 'error', `Drone command executed: ${command}`, data);
    this.notifyListeners();
  }

  private addLog(level: LogEntry['level'], message: string, data?: Record<string, unknown>): void {
    const log: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data || {},
      cost: data ? safeGetProperty(data, 'cost', undefined) : undefined,
      experimentId: data ? safeGetProperty(data, 'taskId', safeGetProperty(data, 'experimentId', undefined)) : undefined,
      agentId: data ? safeGetProperty(data, 'agentId', undefined) : undefined,
    };

    this.logs.push(log);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    if (this.autoScroll && !this.isPaused) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  private calculateCost(executionTime: number): number {
    return Math.round((executionTime / 1000) * 0.01 * 100) / 100;
  }

  private updateMetrics(): void {
    this.metrics.avgCost = this.metrics.total > 0 ? this.metrics.totalCost / this.metrics.total : 0;
    this.metrics.successRate = this.metrics.total > 0 ? (this.metrics.success / this.metrics.total) * 100 : 0;
  }

  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= this.maxReconnectAttempts) {
      this.addLog('error', 'Max reconnection attempts reached', {
        attempts: this.state.reconnectAttempts,
      });
      return;
    }

    this.state.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.state.reconnectAttempts - 1);
    
    this.addLog('warn', `Reconnecting in ${delay}ms (attempt ${this.state.reconnectAttempts})`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConnectionId(): string {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public scrollToBottom(): void {
    const container = document.getElementById('logs-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  public toggleAutoScroll(): void {
    this.autoScroll = !this.autoScroll;
    if (this.autoScroll) {
      this.scrollToBottom();
    }
    this.notifyListeners();
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    this.notifyListeners();
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.state.isConnected = false;
    this.state.isConnecting = false;
    this.notifyListeners();
  }

  public reconnect(): void {
    this.disconnect();
    this.state.reconnectAttempts = 0;
    this.connect();
  }

  public sendDroneCommand(command: string, params: Record<string, unknown> = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send drone command');
      return;
    }

    const message = {
      type: 'drone_command',
      data: {
        command,
        params
      },
      timestamp: new Date().toISOString()
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log('📤 Sent drone command via WebSocket:', command, params);
    } catch (error) {
      console.error('Failed to send drone command:', error);
    }
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// React hook for easy use in components
export function useWebSocket() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  return {
    state: websocketService.state,
    logs: websocketService.logs,
    metrics: websocketService.metrics,
    droneStatus: websocketService.droneStatus,
    recentLogs: websocketService.logs.slice(-50),
    successRate: websocketService.metrics.successRate,
    avgCost: websocketService.metrics.avgCost,
    autoScroll: websocketService.autoScroll,
    isPaused: websocketService.isPaused,
    toggleAutoScroll: websocketService.toggleAutoScroll.bind(websocketService),
    togglePause: websocketService.togglePause.bind(websocketService),
    clearLogs: websocketService.clearLogs.bind(websocketService),
    reconnect: websocketService.reconnect.bind(websocketService),
    scrollToBottom: websocketService.scrollToBottom.bind(websocketService),
    sendDroneCommand: websocketService.sendDroneCommand.bind(websocketService),
  };
}