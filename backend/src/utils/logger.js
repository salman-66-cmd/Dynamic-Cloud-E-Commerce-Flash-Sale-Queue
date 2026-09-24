const EventEmitter = require('events');

class LoggerEmitter extends EventEmitter {}
const logEmitter = new LoggerEmitter();

const recentLogs = [];
const MAX_LOGS = 150;

function pushLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp,
    level,
    message,
    meta,
    server: meta.server || 'API-1',
  };

  recentLogs.push(entry);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.shift();
  }

  // Console output
  const prefix = `[${timestamp}] [${level}] [${entry.server}]`;
  if (level === 'ERROR') {
    console.error(`${prefix} ${message}`, meta.error || '');
  } else if (level === 'WARN') {
    console.warn(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }

  logEmitter.emit('log', entry);
}

module.exports = {
  info: (msg, meta) => pushLog('INFO', msg, meta),
  warn: (msg, meta) => pushLog('WARN', msg, meta),
  error: (msg, meta) => pushLog('ERROR', msg, meta),
  debug: (msg, meta) => pushLog('DEBUG', msg, meta),
  getRecentLogs: () => [...recentLogs],
  logEmitter,
};
