const express = require('express');
const router = express.Router();

// Store connected SSE clients
const sseClients = new Map();

// Handle preflight just in case a proxy/browser sends it
router.options('/events', (req, res) => {
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:8081').split(',').map(o => o.trim());
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Last-Event-ID, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res.status(204).end();
});

// SSE endpoint
router.get('/events', (req, res) => {
  // Set SSE headers (align with CORS origin)
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:8081').split(',').map(o => o.trim());
  const origin = req.headers.origin;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Last-Event-ID, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.flushHeaders?.();

  // Add client to the map
  const clientId = Date.now() + Math.random();
  const client = { id: clientId, response: res };
  sseClients.set(clientId, client);
  
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
    sseClients.delete(clientId);
    console.log(`📡 SSE client disconnected: ${clientId}`);
    console.log(`📊 Total SSE clients: ${sseClients.size}`);
  });

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    if (sseClients.has(clientId)) {
      try {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          data: { timestamp: Date.now() },
          timestamp: Date.now()
        })}\n\n`);
      } catch (error) {
        console.log(`❌ Heartbeat failed for client ${clientId}, removing`);
        sseClients.delete(clientId);
        clearInterval(heartbeat);
      }
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // Send heartbeat every 30 seconds

  // Clean up heartbeat on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
  });
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

  // Convert to array for safe iteration while potentially modifying the map
  const clientEntries = Array.from(sseClients.entries());
  
  for (const [clientId, client] of clientEntries) {
    try {
      client.response.write(messageStr);
      sentCount++;
    } catch (error) {
      console.log(`❌ Error sending to SSE client ${clientId}:`, error.message);
      sseClients.delete(clientId);
    }
  }

  console.log(`📤 Successfully sent ${type} to ${sentCount} SSE clients`);
}

// Export the router and broadcast function
module.exports = { router, broadcastToSSEClients };
