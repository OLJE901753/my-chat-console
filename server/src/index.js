const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const { errorHandler, notFoundHandler, timeoutHandler } = require('./middleware/errorHandler');
// const { performanceMonitor, createRateLimiter, memoryMonitor, cpuMonitor, performanceMetrics } = require('./middleware/performance');
// const healthCheckService = require('./middleware/healthCheck');
require('dotenv').config();
const envConfig = require('./config/environment');

// Import routes
const telemetryRoutes = require('./routes/telemetry');
const droneRoutes = require('./routes/drone');
const { droneService } = require('./routes/drone');
const cameraRoutes = require('./routes/cameras');
// const missionRoutes = require('./routes/mission');
// const aiMissionRoutes = require('./routes/aiMission');
// const AIAgentRoutes = require('./routes/aiAgents');
const pythonAIRoutes = require('./routes/pythonAI');
const netatmoRoutes = require('./routes/netatmo');
// const { router: sseRoutes } = require('./routes/sse'); // Disabled - using WebSocket instead
const { default: EnhancedAIAgentRoutes } = require('./routes/enhancedAiAgents');
const supabaseRoutes = require('./routes/supabase');
const SupabaseService = require('./services/supabaseService');
// const SSEService = require('./services/sseService'); // Disabled - using WebSocket instead
const websocketService = require('./services/websocketService');
const cameraFeedService = require('./services/cameraFeedService');

const app = express();
const server = http.createServer(app);

// Favicon endpoint to prevent CSP/CORS noise in the browser
app.get('/favicon.ico', (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    // Relax CSP for this endpoint only so the browser doesn't complain
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: http: https:");
    // No content needed; a 204 avoids broken image icons
    res.status(204).end();
  } catch (e) {
    res.status(204).end();
  }
});

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
    if (process.env.NODE_ENV === 'development' && origin?.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Performance monitoring
// app.use(performanceMonitor);

// Rate limiting with performance tracking (relax in development)
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = process.env.NODE_ENV === 'production' ? 100 : 10000;
// const limiter = createRateLimiter(WINDOW_MS, MAX_REQUESTS);
// app.use('/api/', (req, res, next) => {
//   // Skip rate limiting for WebSocket endpoints
//   if (req.path.includes('/ws')) {
//     return next();
//   }
//   limiter(req, res, next);
// });

// (CORS already configured above)

// Request timeout (exempt WebSocket routes)
// app.use((req, res, next) => {
//   // Skip timeout for WebSocket endpoints
//   if (req.path.includes('/ws')) {
//     return next();
//   }
//   timeoutHandler(30000)(req, res, next);
// });

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket test endpoint
app.get('/ws', (req, res) => {
  res.json({
    message: 'WebSocket endpoint is available',
    upgrade: 'Use WebSocket protocol to connect',
    url: 'ws://localhost:3001/ws',
    status: websocketService.getStats().isRunning ? 'running' : 'stopped'
  });
});

// Performance metrics endpoint
// app.get('/metrics', performanceMetrics);

// API routes
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/drone', droneRoutes);
app.use('/api/cameras', cameraRoutes);
// app.use('/api/missions', missionRoutes);
// app.use('/api/ai-missions', aiMissionRoutes);
app.use('/api/supabase', supabaseRoutes);
app.use('/api/python-ai', pythonAIRoutes);
app.use('/api/netatmo', netatmoRoutes);
// app.use('/api', sseRoutes); // Disabled - using WebSocket instead

// Enhanced AI Agent routes
try {
  console.log('🔧 Setting up Enhanced AI Agent routes...');
  const enhancedAIAgentRoutes = new EnhancedAIAgentRoutes();
  app.use('/api/ai-agents', enhancedAIAgentRoutes.setupRoutes());
  console.log('✅ Enhanced AI Agent routes configured');
} catch (error) {
  console.error('❌ Failed to setup Enhanced AI Agent routes:', error);
}

// AI Agent routes (temporarily disabled)
// app.use('/api/ai-agents', (req, res, next) => {
//   if (!aiAgentService) {
//     return res.status(503).json({ error: 'AI Agent service not ready' });
//   }
//   const aiAgentRoutes = new AIAgentRoutes(aiAgentService);
//   aiAgentRoutes.setupRoutes()(req, res, next);
// });

// SSE stats endpoint - DISABLED
// app.get('/api/sse/stats', (req, res) => {
//   if (sseService) {
//     res.json(sseService.getStats());
//   } else {
//     res.status(503).json({ error: 'SSE service not initialized' });
//   }
// });

// WebSocket stats endpoint
app.get('/api/ws/stats', (req, res) => {
  res.json({
    success: true,
    data: websocketService.getStats()
  });
});

// WebSocket for real-time data streaming

// Initialize services
let aiAgentService;
// let sseService; // Disabled - using WebSocket instead

async function initializeServices() {
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

    // Connect drone service to WebSocket for real-time updates
    console.log('🚁 Connecting drone service to WebSocket...');
    websocketService.setDroneService(droneService);
    console.log('✅ Drone service connected to WebSocket');

    // Connect camera service to WebSocket for real-time updates
    console.log('📹 Connecting camera service to WebSocket...');
    websocketService.setCameraService(cameraFeedService);
    console.log('✅ Camera service connected to WebSocket');

    console.log('🚀 Basic services initialized successfully');
    console.log('🤖 Enhanced AI Agent Orchestrator is ready');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    console.error('Stack trace:', error.stack);
    // Don't exit - let server run without some services
    console.warn('⚠️ Continuing with limited functionality');
  }
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚁 Drone Control Server running on port ${PORT}`);
  console.log(`🌐 WebSocket server ready for real-time communication`);
  console.log(`🤖 AI Mission Planning System active`);
  
  // Initialize services after server starts
  initializeServices();
});

// Error handling middleware (must be last)
// app.use(notFoundHandler);
// app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  websocketService.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  websocketService.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server };
