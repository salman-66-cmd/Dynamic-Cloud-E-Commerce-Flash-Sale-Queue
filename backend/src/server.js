const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');
const seedInitialData = require('./utils/seedData');

// Middleware
const { loadBalancerMiddleware } = require('./middleware/loadBalancer');
const { generalLimiter } = require('./middleware/rateLimiter');

// Services & Managers
const queueManager = require('./queue/queueManager');
const workerPool = require('./workers/workerPool');
const trafficSimulator = require('./services/trafficSimulator');
const cloudMonitorService = require('./services/cloudMonitorService');
const { initSocketHandlers } = require('./sockets/socketHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const flashSaleRoutes = require('./routes/flashSaleRoutes');
const queueRoutes = require('./routes/queueRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Attach Socket.IO to Express app and singleton services
app.set('io', io);
queueManager.setSocketIO(io);
workerPool.setSocketIO(io);
trafficSimulator.setSocketIO(io);
cloudMonitorService.setSocketIO(io);
initSocketHandlers(io);

// Security & Parsing
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// L7 Load Balancer & Rate Limiter middleware
app.use(loadBalancerMiddleware);
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    server: req.assignedServer?.id || 'API-1',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled Server Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
  });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Bootstrap server
async function startServer() {
  try {
    await connectDB();
    await seedInitialData();

    // Start auto-scaling worker pool
    workerPool.start();

    const PORT = config.PORT;
    server.listen(PORT, () => {
      logger.info(`=======================================================`, { server: 'SYSTEM' });
      logger.info(`DYNAMIC CLOUD FLASH SALE QUEUE BACKEND READY`, { server: 'SYSTEM' });
      logger.info(`Server Port: ${PORT} | Mode: ${config.NODE_ENV}`, { server: 'SYSTEM' });
      logger.info(`Load Balancer: Active across 3 Virtual Availability Zones`, { server: 'SYSTEM' });
      logger.info(`Auto-Scaler: Active (Min: ${config.MIN_WORKERS}, Max: ${config.MAX_WORKERS} workers)`, { server: 'SYSTEM' });
      logger.info(`Demo credentials:`, { server: 'SYSTEM' });
      logger.info(`  Admin: admin@cloudsale.com / Admin@123`, { server: 'SYSTEM' });
      logger.info(`  User:  user@cloudsale.com / User@123`, { server: 'SYSTEM' });
      logger.info(`=======================================================`, { server: 'SYSTEM' });
    });
  } catch (err) {
    logger.error('Critical failure during server bootstrap', { error: err.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down worker pool and server.', { server: 'SYSTEM' });
  workerPool.stop();
  server.close(() => process.exit(0));
});

startServer();

module.exports = { app, server };
