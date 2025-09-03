const express = require('express');
const router = express.Router();

// Store connected SSE clients
const sseClients = new Set();

// SSE endpoint
router.get('/events', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add client to the set
  const clientId = Date.now() + Math.random();
  sseClients.add({ id: clientId, response: res });
  
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
    sseClients.delete({ id: clientId, response: res });
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
