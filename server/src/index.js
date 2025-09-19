const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const { errorHandler, notFoundHandler, timeoutHandler } = require('./middleware/errorHandler');
// const { performanceMonitor, createRateLimiter, memoryMonitor, cpuMonitor, performanceMetrics } = require('./middleware/performance');
// const healthCheckService = require('./middleware/healthCheck');
require('dotenv').config();
// const envConfig = require('./config/environment');

// Import routes
const telemetryRoutes = require('./routes/telemetry');
// const droneRoutes = require('./routes/drone');
// const missionRoutes = require('./routes/mission');
// const aiMissionRoutes = require('./routes/aiMission');
// const AIAgentRoutes = require('./routes/aiAgents');
// const pythonAIRoutes = require('./routes/pythonAI');
const { router: sseRoutes } = require('./routes/sse');
const EnhancedAIAgentRoutes = require('./routes/enhancedAiAgents');
const SupabaseService = require('./services/supabaseService');
const SSEService = require('./services/sseService');

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
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"], // Allow SSE and WebSocket connections
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS (must be before rate limiting so error responses include CORS)
const corsOrigin = process.env.FRONTEND_URL || "http://localhost:8081";
const corsOrigins = corsOrigin.split(',').map(origin => origin.trim());
const corsOptions = { origin: corsOrigins, credentials: true };
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Performance monitoring
// app.use(performanceMonitor);

// Rate limiting with performance tracking (relax in development, exempt SSE)
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = process.env.NODE_ENV === 'production' ? 100 : 10000;
// const limiter = createRateLimiter(WINDOW_MS, MAX_REQUESTS);
// app.use('/api/', (req, res, next) => {
//   // Skip rate limiting for SSE endpoints
//   if (req.path.includes('/events') || req.path.includes('/sse')) {
//     return next();
//   }
//   limiter(req, res, next);
// });

// (CORS already configured above)

// Request timeout (exempt SSE routes)
// app.use((req, res, next) => {
//   // Skip timeout for SSE endpoints
//   if (req.path.includes('/events') || req.path.includes('/sse')) {
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

// Performance metrics endpoint
// app.get('/metrics', performanceMetrics);

// API routes
app.use('/api/telemetry', telemetryRoutes);
// app.use('/api/drone', droneRoutes);
// app.use('/api/missions', missionRoutes);
// app.use('/api/ai-missions', aiMissionRoutes);
const supabaseRoutes = require('./routes/supabase');
app.use('/api/supabase', supabaseRoutes);
// app.use('/api/python-ai', pythonAIRoutes);
app.use('/api', sseRoutes);

// Enhanced AI Agent routes
const enhancedAIAgentRoutes = new EnhancedAIAgentRoutes();
app.use('/api/ai-agents', enhancedAIAgentRoutes.setupRoutes());

// AI Agent routes (temporarily disabled)
// app.use('/api/ai-agents', (req, res, next) => {
//   if (!aiAgentService) {
//     return res.status(503).json({ error: 'AI Agent service not ready' });
//   }
//   const aiAgentRoutes = new AIAgentRoutes(aiAgentService);
//   aiAgentRoutes.setupRoutes()(req, res, next);
// });

// SSE stats endpoint
app.get('/api/sse/stats', (req, res) => {
  if (sseService) {
    res.json(sseService.getStats());
  } else {
    res.status(503).json({ error: 'SSE service not initialized' });
  }
});

// Server-Sent Events (SSE) for real-time data streaming

// Initialize services
let aiAgentService;
let sseService;

async function initializeServices() {
  try {
    // Initialize Supabase service
    const supabaseService = new SupabaseService();
    if (await supabaseService.checkHealth()) {
      console.log('✅ Supabase service connected');
    } else {
      console.warn('⚠️ Supabase service not available');
    }

    // Initialize SSE service
    sseService = new SSEService();
    console.log('✅ SSE service initialized');

    // Start performance monitoring
    // memoryMonitor();
    // cpuMonitor();
    console.log('✅ Performance monitoring started');

    console.log('🚀 Basic services initialized successfully');
    console.log('🤖 Enhanced AI Agent Orchestrator is ready');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚁 Drone Control Server running on port ${PORT}`);
  console.log(`📡 SSE server ready for real-time communication`);
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
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
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
