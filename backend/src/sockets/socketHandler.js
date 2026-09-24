const queueManager = require('../queue/queueManager');
const logger = require('../utils/logger');

function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`, { server: 'SOCKET-SVC' });

    // Join specific queue tracking room
    socket.on('join:queue', async ({ queueId }) => {
      if (!queueId) return;
      socket.join(`queue:${queueId}`);
      logger.debug(`Socket ${socket.id} joined room queue:${queueId}`);

      // Immediately respond with latest status
      try {
        const status = await queueManager.getStatus(queueId);
        if (status) {
          socket.emit('queue:status_changed', status);
        }
      } catch (e) {
        // silent
      }
    });

    // Join flash sale view room (to receive live stock and queue length updates)
    socket.on('join:flashsale', ({ flashSaleId }) => {
      if (!flashSaleId) return;
      socket.join(`flashsale:${flashSaleId}`);
      logger.debug(`Socket ${socket.id} joined flashsale:${flashSaleId}`);
    });

    // Join admin monitoring telemetry room
    socket.on('join:admin', () => {
      socket.join('admin:metrics');
      logger.debug(`Socket ${socket.id} subscribed to admin:metrics`);
    });

    // Leave rooms
    socket.on('leave:queue', ({ queueId }) => {
      if (queueId) socket.leave(`queue:${queueId}`);
    });

    socket.on('leave:admin', () => {
      socket.leave('admin:metrics');
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initSocketHandlers };
