// Test WebSocket Connection
const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Connection to Backend...');

const wsUrl = 'ws://localhost:3001/ws';
console.log('🔌 Connecting to:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ WebSocket connection established!');
  console.log('📡 Sending test message...');
  
  // Send a test message
  ws.send(JSON.stringify({
    type: 'ping',
    data: { test: true },
    timestamp: new Date().toISOString()
  }));
});

ws.on('message', (data) => {
  console.log('📨 Received message:', data.toString());
});

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log('🔌 WebSocket closed:', code, reason.toString());
});

// Close after 3 seconds
setTimeout(() => {
  console.log('⏰ Closing connection...');
  ws.close();
}, 3000);
