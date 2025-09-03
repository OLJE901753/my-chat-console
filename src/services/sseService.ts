export interface SSEMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface SSEConfig {
  url: string;
  debug?: boolean;
}

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  lastConnected?: Date;
  error?: string;
}

type EventListener = (...args: any[]) => void;

export class SSEService {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private eventSource: EventSource | null = null;
  private config: SSEConfig;
  private state: ConnectionState;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(config: SSEConfig) {
    this.config = {
      debug: false,
      ...config
    };
    this.state = {
      connected: false,
      connecting: false
    };
  }

  private log(message: string, ...args: any[]) {
    if (this.config.debug) {
      console.log(`[SSE] ${message}`, ...args);
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state.connecting || this.state.connected) {
        resolve();
        return;
      }

      this.state.connecting = true;
      this.log('Connecting to SSE endpoint...');

      try {
        // Check if EventSource is available
        if (typeof EventSource === 'undefined') {
          throw new Error('EventSource is not supported in this browser');
        }

        // Set a timeout for connection
        const connectionTimeout = setTimeout(() => {
          this.log('Connection timeout - server may not be running');
          this.state.connecting = false;
          this.state.error = 'Server not responding';
          resolve(); // Don't reject, just resolve with error state
        }, 5000);

        this.eventSource = new EventSource(this.config.url);

        this.eventSource.onopen = () => {
          clearTimeout(connectionTimeout);
          this.log('✅ SSE connection opened');
          this.state.connected = true;
          this.state.connecting = false;
          this.state.lastConnected = new Date();
          this.state.error = undefined;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          try {
            const message: SSEMessage = JSON.parse(event.data);
            this.log('📨 Received SSE message:', message.type);
            this.handleMessage(message);
          } catch (error) {
            this.log('❌ Error parsing SSE message:', error);
          }
        };

        this.eventSource.onerror = (error) => {
          this.log('❌ SSE connection error:', error);
          this.state.connected = false;
          this.state.connecting = false;
          this.state.error = 'Connection error';

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              this.connect().catch(() => {
                // Reconnection failed, will be handled by the next attempt
              });
            }, this.reconnectDelay);
          } else {
            this.log('❌ Max reconnection attempts reached');
            reject(new Error('Failed to connect to SSE endpoint'));
          }
        };

      } catch (error) {
        this.state.connecting = false;
        this.state.error = error instanceof Error ? error.message : 'Unknown error';
        reject(error);
      }
    });
  }

  private handleMessage(message: SSEMessage) {
    // Handle special message types
    switch (message.type) {
      case 'connected':
        this.log('🔗 SSE connection confirmed');
        break;
      case 'heartbeat':
        this.log('💓 SSE heartbeat received');
        break;
      default:
        // Emit to specific listeners
        const listeners = this.listeners.get(message.type);
        if (listeners) {
          listeners.forEach(callback => {
            try {
              callback(message.data);
            } catch (error) {
              this.log('❌ Error in message listener:', error);
            }
          });
        }
        break;
    }
  }

  // Subscribe to specific message types
  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(callback);
    this.log(`📡 Subscribed to: ${type}`);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(type);
        }
      }
      this.log(`📡 Unsubscribed from: ${type}`);
    };
  }

  // Get connection state
  getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  // Check if connected
  isConnected(): boolean {
    return this.state.connected && this.eventSource?.readyState === EventSource.OPEN;
  }

  // Disconnect
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.state.connected = false;
    this.state.connecting = false;
    this.log('🔌 SSE connection closed');
  }

  // Cleanup
  destroy() {
    this.disconnect();
    this.listeners.clear();
  }
}

// Create and export a singleton instance
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
export const sseService = new SSEService({
  url: `${API_URL}/api/events`,
  debug: false // Disable debug to reduce console noise
});
