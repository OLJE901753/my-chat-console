#!/usr/bin/env node

import http from 'http';

console.log('Testing server connection...');
console.log('');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Server is running!');
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.log('Server is not running.');
  console.log('Error:', error.message);
  console.log('');
  console.log('To start the server, run: node start-server.js');
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Server is not responding (timeout).');
  console.log('');
  console.log('To start the server, run: node start-server.js');
  req.destroy();
  process.exit(1);
});

req.end();
