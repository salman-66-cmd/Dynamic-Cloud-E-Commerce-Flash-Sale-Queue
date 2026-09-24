const { spawn } = require('child_process');
const path = require('path');

console.log('==================================================================');
console.log('🚀 STARTING DYNAMIC CLOUD E-COMMERCE FLASH SALE QUEUE PLATFORM 🚀');
console.log('==================================================================');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// 1. Start Backend on Port 5000
const backend = spawn(npmCmd, ['start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
});

// 2. Start Frontend on Port 5173
const frontend = spawn(npmCmd, ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
});

backend.on('error', (err) => console.error('Backend process error:', err));
frontend.on('error', (err) => console.error('Frontend process error:', err));

process.on('SIGINT', () => {
  console.log('\nShutting down all cloud services...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});
