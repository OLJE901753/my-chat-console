const express = require('express');
const router = express.Router();

// Store connected SSE clients
const sseClients = new Set();

// Handle preflight just in case a proxy/browser sends it
router.options('/events', (req, res) => {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:8080';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Last-Event-ID, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res.status(204).end();
});

// SSE endpoint
router.get('/events', (req, res) => {
  // Set SSE headers (align with CORS origin)
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:8080';
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Last-Event-ID, Content-Type');
  // Only set credentials header if you actually use cookies; harmless if present with explicit origin
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.flushHeaders?.();

  // Add client to the set
  const clientId = Date.now() + Math.random();
  const client = { id: clientId, response: res };
  sseClients.add(client);
  
  console.log(`📡 SSE client connected: ${clientId}`);
  console.log(`📊 Total SSE clients: ${sseClients.size}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    data: { clientId, timestamp: Date.now() },
    timestamp: Date.now()
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    sseClients.delete(client);
    console.log(`📡 SSE client disconnected: ${clientId}`);
    console.log(`📊 Total SSE clients: ${sseClients.size}`);
  });

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    if (sseClients.has({ id: clientId, response: res })) {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        data: { timestamp: Date.now() },
        timestamp: Date.now()
      })}\n\n`);
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // Send heartbeat every 30 seconds
});

// Function to broadcast data to all SSE clients
function broadcastToSSEClients(type, data) {
  const message = {
    type,
    data,
    timestamp: Date.now()
  };

  const messageStr = `data: ${JSON.stringify(message)}\n\n`;
  let sentCount = 0;

  console.log(`📡 Broadcasting ${type} to ${sseClients.size} SSE clients...`);

  sseClients.forEach(client => {
    try {
      client.response.write(messageStr);
      sentCount++;
    } catch (error) {
      console.log(`❌ Error sending to SSE client ${client.id}:`, error.message);
      sseClients.delete(client);
    }
  });

  console.log(`📤 Successfully sent ${type} to ${sentCount} SSE clients`);
}

// Export the router and broadcast function
module.exports = { router, broadcastToSSEClients };
