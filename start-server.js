#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================');
console.log('  Farm Management Server');
console.log('========================================');
console.log('');

// Get the directory where this script is located
const scriptDir = __dirname;
const serverDir = path.join(scriptDir, 'server');

console.log('Starting server...');
console.log('Server directory:', serverDir);
console.log('');

// Start the server
const serverProcess = spawn('node', ['src/index.js'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true
});

// Handle process events
serverProcess.on('error', (error) => {
  console.error('Error starting server:', error.message);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log('');
  console.log('Server stopped with code:', code);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('');
  console.log('Stopping server...');
  serverProcess.kill('SIGINT');
});
