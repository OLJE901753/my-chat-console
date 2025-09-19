const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));

// Body parsing
app.use(express.json());

// Basic logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Supabase routes
const supabaseRoutes = require('./src/routes/supabase');
app.use('/api/supabase', supabaseRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚁 Minimal Drone Server running on port ${PORT}`);
  console.log('✅ Supabase media service ready');
});

module.exports = app;
