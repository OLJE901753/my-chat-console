const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFoundHandler, timeoutHandler } = require('./middleware/errorHandler');
const { performanceMonitor, createRateLimiter, memoryMonitor, cpuMonitor, healthCheck, performanceMetrics } = require('./middleware/performance');
require('dotenv').config();

const droneRoutes = require('./routes/drone');
const missionRoutes = require('./routes/mission');
const telemetryRoutes = require('./routes/telemetry');
const aiMissionRoutes = require('./routes/aiMission');
const supabaseRoutes = require('./routes/supabase');
const AIAgentRoutes = require('./routes/aiAgents');
const pythonAIRoutes = require('./routes/pythonAI');
const { router: sseRoutes } = require('./routes/sse');
const AIAgentService = require('./services/aiAgentService');
const { initializeDroneService } = require('./services/droneServiceImproved');
const { initializeDatabase } = require('./database/init');
const SSEService = require('./services/sseService');

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Performance monitoring
app.use(performanceMonitor);

// Rate limiting with performance tracking
const limiter = createRateLimiter(15 * 60 * 1000, 100); // 15 minutes, 100 requests
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true
}));

// Request timeout
app.use(timeoutHandler(30000)); // 30 seconds

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', healthCheck);

// Performance metrics endpoint
app.get('/metrics', performanceMetrics);

// API routes
app.use('/api/drone', droneRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/ai-missions', aiMissionRoutes);
app.use('/api/supabase', supabaseRoutes);
app.use('/api/python-ai', pythonAIRoutes);
app.use('/api', sseRoutes);

// AI Agent routes - initialize after services are ready
app.use('/api/ai-agents', (req, res, next) => {
  if (!aiAgentService) {
    return res.status(503).json({ error: 'AI Agent service not ready' });
  }
  const aiAgentRoutes = new AIAgentRoutes(aiAgentService);
  aiAgentRoutes.setupRoutes()(req, res, next);
});

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
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Initialize AI Agent service
    aiAgentService = new AIAgentService();
    console.log('✅ AI Agent service initialized');

    // Initialize drone service (no longer needs io parameter)
    await initializeDroneService();
    console.log('✅ Drone service initialized');

    // Start performance monitoring
    memoryMonitor();
    cpuMonitor();
    console.log('✅ Performance monitoring started');

    // Initialize SSE service
    sseService = new SSEService();
    console.log('✅ SSE service initialized');

    console.log('🚀 All services initialized successfully');
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
app.use(notFoundHandler);
app.use(errorHandler);

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
