#!/usr/bin/env node

// CMMI Specs Agent MCP Server Launcher for VS Code
// This script starts the MCP server for VS Code integration

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'server.js');

console.log('🚀 Starting CMMI Specs Agent MCP Server...');
console.log(`📁 Server path: ${serverPath}`);

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    DEBUG_MCP: 'true',
    LOG_LEVEL: 'debug'
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`📊 MCP server exited with code ${code}`);
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});
