const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

console.log('🔄 Starting debug server...');

const app = express();
const server = http.createServer(app);

console.log('✅ Express app and HTTP server created');

// Basic CORS
app.use(cors());
console.log('✅ CORS configured');

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('✅ Body parsing configured');

// Basic route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
console.log('✅ Health route configured');

const PORT = process.env.PORT || 3001;
console.log(`🚀 Starting server on port ${PORT}...`);

server.listen(PORT, () => {
  console.log(`🚁 Debug Server running on port ${PORT}`);
  console.log(`📊 Server is healthy and ready`);
});

console.log('✅ Server setup complete - should be listening now');
