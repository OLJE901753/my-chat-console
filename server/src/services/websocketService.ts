import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WebSocketMessage, CoordinatorEvent } from '../types';
import logger from '../utils/logger';

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server): void {
    try {
      this.wss = new WebSocketServer({ 
        server,
        path: '/ws'
      });

      this.wss.on('connection', (ws: WebSocket) => {
        this.handleConnection(ws);
      });

      this.wss.on('error', (error) => {
        logger.error('WebSocket server error:', error);
      });

      this.startHeartbeat();
      logger.info('WebSocket server initialized on /ws');
    } catch (error) {
      logger.error('Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    logger.info(`WebSocket client connected. Total clients: ${this.clients.size}`);

    // Send welcome message
    this.sendToClient(ws, {
      type: 'system_status',
      data: { message: 'Connected to Farm Management System', status: 'connected' },
      timestamp: new Date().toISOString()
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        logger.error('Invalid WebSocket message:', error);
        this.sendToClient(ws, {
          type: 'system_status',
          data: { error: 'Invalid message format' },
          timestamp: new Date().toISOString()
        });
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info(`WebSocket client disconnected. Total clients: ${this.clients.size}`);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.clients.delete(ws);
    });
  }

  private handleMessage(ws: WebSocket, message: any): void {
    logger.debug('Received WebSocket message:', message);

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        });
        break;

      case 'subscribe':
        // Handle subscription to specific event types
        logger.info(`Client subscribed to: ${message.data?.events || 'all'}`);
        break;

      default:
        logger.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send WebSocket message:', error);
        this.clients.delete(ws);
      }
    }
  }

  // Broadcast to all connected clients
  broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          sentCount++;
        } catch (error) {
          logger.error('Failed to broadcast message:', error);
          this.clients.delete(ws);
        }
      }
    });

    logger.debug(`Broadcasted message to ${sentCount} clients`);
  }

  // Broadcast coordinator events
  broadcastCoordinatorEvent(event: CoordinatorEvent): void {
    this.broadcast({
      type: 'task_update',
      data: {
        event_type: event.type,
        task_id: event.task_id,
        ...event.data
      },
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast experiment updates
  broadcastExperimentUpdate(experimentId: string, update: any): void {
    this.broadcast({
      type: 'experiment_update',
      data: {
        experiment_id: experimentId,
        ...update
      },
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast agent status updates
  broadcastAgentStatus(agentId: string, status: any): void {
    this.broadcast({
      type: 'agent_status',
      data: {
        agent_id: agentId,
        ...status
      },
      timestamp: new Date().toISOString()
    });
  }

  // Heartbeat to keep connections alive
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'system_status',
        data: { 
          status: 'healthy',
          connected_clients: this.clients.size,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }, 30000); // Every 30 seconds
  }

  // Get connection stats
  getStats(): { connectedClients: number; isRunning: boolean } {
    return {
      connectedClients: this.clients.size,
      isRunning: this.wss !== null
    };
  }

  // Cleanup
  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.clients.forEach((ws) => {
      ws.close();
    });
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    logger.info('WebSocket service closed');
  }
}

export default new WebSocketService();
