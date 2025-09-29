// WebSocket Connection Test
const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Connection...');

// Test 1: WebSocket module available
console.log('✅ WebSocket module available:', !!WebSocket);

// Test 2: Try to connect to backend WebSocket
const wsUrl = 'ws://localhost:3001/ws';
console.log('🔌 Attempting to connect to:', wsUrl);

try {
  const ws = new WebSocket(wsUrl);
  
  ws.on('open', () => {
    console.log('✅ WebSocket connection established!');
    ws.close();
  });
  
  ws.on('error', (error) => {
    console.log('❌ WebSocket connection failed:', error.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log('🔌 WebSocket connection closed:', code, reason.toString());
  });
  
  // Timeout after 5 seconds
  setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      console.log('⏰ WebSocket connection timeout');
      ws.close();
    }
  }, 5000);
  
} catch (error) {
  console.log('❌ WebSocket creation failed:', error.message);
}

console.log('🎉 WebSocket connection test completed!');
