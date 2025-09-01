const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const droneRoutes = require('./routes/drone');
const missionRoutes = require('./routes/mission');
const telemetryRoutes = require('./routes/telemetry');
const aiMissionRoutes = require('./routes/aiMission');
const supabaseRoutes = require('./routes/supabase');
const { initializeDroneService } = require('./services/droneService');
const { initializeDatabase } = require('./database/init');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true
}));

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
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      drone: 'active',
      ai: 'active',
      database: 'active'
    }
  });
});

// API routes
app.use('/api/drone', droneRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/ai-missions', aiMissionRoutes);
app.use('/api/supabase', supabaseRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });

  // Handle drone control commands
  socket.on('drone:command', async (data) => {
    try {
      console.log('🚁 Drone command received:', data);
      // Forward to drone service
      io.emit('drone:status', { status: 'command_received', data });
    } catch (error) {
      console.error('Drone command error:', error);
      socket.emit('drone:error', { error: error.message });
    }
  });

  // Handle mission updates
  socket.on('mission:update', (data) => {
    console.log('📋 Mission update:', data);
    io.emit('mission:status', data);
  });

  // Handle AI mission planning
  socket.on('ai:plan_mission', async (data) => {
    try {
      console.log('🤖 AI Mission Planning request:', data);
      io.emit('ai:planning_status', { status: 'planning_started', data });
    } catch (error) {
      console.error('AI Mission Planning error:', error);
      socket.emit('ai:error', { error: error.message });
    }
  });
});

// Initialize services
async function initializeServices() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Initialize drone service
    await initializeDroneService(io);
    console.log('✅ Drone service initialized');

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
  console.log(`📡 WebSocket server ready for real-time communication`);
  console.log(`🤖 AI Mission Planning System active`);
  
  // Initialize services after server starts
  initializeServices();
});

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

module.exports = { app, server, io };
