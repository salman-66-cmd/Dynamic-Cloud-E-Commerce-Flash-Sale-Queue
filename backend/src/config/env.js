const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/flashsale_db',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'super_cloud_secure_jwt_secret_key_987654321',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SIMULATED_SERVERS: ['API-1 (us-east-1a)', 'API-2 (us-east-1b)', 'API-3 (us-east-1c)'],
  MIN_WORKERS: parseInt(process.env.MIN_WORKERS || '2', 10),
  MAX_WORKERS: parseInt(process.env.MAX_WORKERS || '8', 10),
  RESERVATION_TIMEOUT_SEC: parseInt(process.env.RESERVATION_TIMEOUT_SEC || '120', 10),
};
