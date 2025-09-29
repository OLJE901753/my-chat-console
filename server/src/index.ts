import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import envConfig from './config/environment';
import { ApiResponse } from './types';

// Import routes (using require for existing JS modules from src)
const telemetryRoutes = require('../src/routes/telemetry');
const droneRoutes = require('../src/routes/drone');
const pythonAIRoutes = require('../src/routes/pythonAI');
const netatmoRoutes = require('../src/routes/netatmo');
// const { router: sseRoutes } = require('../src/routes/sse'); // Disabled - using WebSocket instead
const supabaseRoutes = require('../src/routes/supabase');
import experimentsRoutes from './routes/experiments';

// Import services
const SupabaseService = require('../src/services/supabaseService');
// const SSEService = require('../src/services/sseService'); // Disabled - using WebSocket instead
import websocketService from './services/websocketService';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Trust proxy for correct client IPs (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for development
      imgSrc: ["'self'", "data:", "https:", "http://localhost:*"], // Allow localhost images including favicon
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"], // Allow WebSocket connections
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS (must be before rate limiting so error responses include CORS)
// Allow multiple frontend ports for development
const corsOrigins = [
  "http://localhost:8081",
  "http://localhost:8082", 
  "http://localhost:8080",
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow any localhost port
    if (process.env['NODE_ENV'] === 'development' && origin?.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const config = envConfig.getConfig();
  
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: config.nodeEnv,
      services: {
        supabase: config.supabase.configured,
        websocket: websocketService.getStats().isRunning,
      }
    }
  } as ApiResponse);
});

// WebSocket test endpoint
app.get('/ws', (_req: Request, res: Response) => {
  res.json({
    message: 'WebSocket endpoint is available',
    upgrade: 'Use WebSocket protocol to connect',
    url: 'ws://localhost:3001/ws',
    status: websocketService.getStats().isRunning ? 'running' : 'stopped'
  });
});

// API routes
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/drone', droneRoutes);
app.use('/api/supabase', supabaseRoutes);
app.use('/api/python-ai', pythonAIRoutes);
app.use('/api/netatmo', netatmoRoutes);
// app.use('/api', sseRoutes); // Disabled - using WebSocket instead

// New experiments API
app.use('/api/experiments', experimentsRoutes);

// Enhanced AI Agent routes
const EnhancedAIAgentRoutesClass = require('../src/routes/enhancedAiAgents').default;
const enhancedAIAgentRoutes = new EnhancedAIAgentRoutesClass();
app.use('/api/ai-agents', enhancedAIAgentRoutes.setupRoutes());

// SSE stats endpoint - DISABLED
// app.get('/api/sse/stats', (_req: Request, res: Response) => {
//   if (SSEService) {
//     res.json({
//       success: true,
//       data: SSEService.getStats()
//     } as ApiResponse);
//   } else {
//     res.status(503).json({
//       success: false,
//       error: 'SSE service not initialized'
//     } as ApiResponse);
//   }
// });

// WebSocket stats endpoint
app.get('/api/ws/stats', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: websocketService.getStats()
  } as ApiResponse);
});

// Initialize services

async function initializeServices(): Promise<void> {
  try {
    console.log('🔄 Starting service initialization...');
    
    // Initialize Supabase service
    const supabaseService = new SupabaseService();
    console.log('📊 Supabase service created');
    
    if (await supabaseService.checkHealth()) {
      console.log('✅ Supabase service connected');
    } else {
      console.log('⚠️ Supabase service not available');
    }

    // SSE service removed - using WebSocket instead

    // Initialize WebSocket service
    console.log('🌐 Initializing WebSocket service...');
    websocketService.initialize(server);
    console.log('✅ WebSocket service initialized');

    console.log('🚀 All services initialized successfully');
    console.log('🤖 Enhanced AI Agent Orchestrator is ready');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    console.error('Stack trace:', error);
    // Don't exit - let server run without some services
    console.warn('⚠️ Continuing with limited functionality');
  }
}

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  } as ApiResponse);
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  } as ApiResponse);
});

// Start server
const PORT = process.env['PORT'] || 3001;
server.listen(PORT, () => {
  console.log(`🚁 Farm Management Server running on port ${PORT}`);
  console.log(`🌐 WebSocket server ready for real-time communication`);
  console.log(`🌐 WebSocket server ready on /ws`);
  console.log(`🤖 AI Mission Planning System active`);
  console.log(`📊 Experiments API available at /api/experiments`);
  
  // Initialize services after server starts
  initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  websocketService.close();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  websocketService.close();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export { app, server };
