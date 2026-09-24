const { v4: uuidv4 } = require('uuid');
const redis = require('../config/redis');
const QueueEntry = require('../models/QueueEntry');
const FlashSale = require('../models/FlashSale');
const logger = require('../utils/logger');

class QueueManager {
  constructor() {
    this.io = null;
    this.totalProcessed = 0;
    this.totalSuccess = 0;
    this.totalFailed = 0;
  }

  setSocketIO(io) {
    this.io = io;
  }

  getQueueKey(flashSaleId) {
    return `queue:flashsale:${flashSaleId}`;
  }

  // Join the flash sale virtual queue
  async enqueue({ userId, userName, userEmail, flashSaleId, productId }) {
    // 1. Check if user already has an active or waiting queue entry
    const existingEntry = await QueueEntry.findOne({
      userId,
      flashSaleId,
      status: { $in: ['WAITING', 'PROCESSING', 'PAYMENT_PENDING', 'SUCCESS'] },
    });

    if (existingEntry) {
      return {
        success: false,
        code: 'ALREADY_IN_QUEUE',
        message: 'You already have an active request or purchase for this flash sale.',
        entry: existingEntry,
      };
    }

    // 2. Fetch current queue length to determine position
    const queueKey = this.getQueueKey(flashSaleId);
    const queueLength = await redis.llen(queueKey);
    const position = queueLength + 1;
    const queueId = `q_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // 3. Create QueueEntry record
    const entryData = {
      queueId,
      userId,
      userName: userName || 'Shopper',
      userEmail: userEmail || '',
      flashSaleId,
      productId,
      position,
      initialPosition: position,
      status: 'WAITING',
      retryCount: 0,
      joinedAt: new Date(),
    };

    const newEntry = await QueueEntry.create(entryData);

    // 4. Push queueId to Redis Queue
    await redis.rpush(queueKey, queueId);

    // Cache entry state in Redis for rapid lookup
    await redis.set(`entry:${queueId}`, JSON.stringify(entryData), 'EX', 3600);

    logger.info(`User ${userEmail || userId} joined queue at position #${position}`, {
      server: 'QUEUE-SVC',
      queueId,
      position,
    });

    // 5. Calculate estimated wait time: approx 0.8s per position with worker concurrency
    const estWaitSeconds = Math.max(2, Math.round(position * 0.8));

    // Emit live queue length update to Admin & viewers
    if (this.io) {
      this.io.to(`flashsale:${flashSaleId}`).emit('queue:length_updated', {
        flashSaleId,
        queueLength: position,
      });
      this.io.to('admin:metrics').emit('admin:queue_stat', {
        queueLength: position,
        joinedUser: userName,
      });
    }

    return {
      success: true,
      entry: newEntry,
      position,
      peopleAhead: Math.max(0, position - 1),
      estimatedWaitSeconds: estWaitSeconds,
    };
  }

  // Fetch live queue item status & dynamic position
  async getStatus(queueId) {
    const entry = await QueueEntry.findOne({ queueId });
    if (!entry) {
      return null;
    }

    // If waiting, recalculate live position based on Redis queue index
    let currentPosition = entry.position;
    let peopleAhead = 0;

    if (entry.status === 'WAITING') {
      const queueKey = this.getQueueKey(entry.flashSaleId);
      const items = await redis.lrange(queueKey, 0, -1);
      const idx = items.indexOf(queueId);
      if (idx !== -1) {
        currentPosition = idx + 1;
        peopleAhead = idx;
        if (currentPosition !== entry.position) {
          entry.position = currentPosition;
          await QueueEntry.updateOne({ queueId }, { position: currentPosition });
        }
      } else {
        currentPosition = 1;
        peopleAhead = 0;
      }
    } else if (entry.status === 'PROCESSING') {
      currentPosition = 0;
      peopleAhead = 0;
    }

    const estimatedWaitSeconds = entry.status === 'WAITING'
      ? Math.max(2, Math.round(currentPosition * 0.8))
      : 0;

    return {
      ...entry,
      position: currentPosition,
      peopleAhead,
      estimatedWaitSeconds,
    };
  }

  // Dequeue next item for a worker
  async dequeue(flashSaleId) {
    const queueKey = this.getQueueKey(flashSaleId);
    const queueId = await redis.lpop(queueKey);
    return queueId;
  }

  // Peek queue depth
  async getQueueLength(flashSaleId) {
    const queueKey = this.getQueueKey(flashSaleId);
    return await redis.llen(queueKey);
  }

  // Cancel queue entry
  async cancelQueue(queueId, userId) {
    const entry = await QueueEntry.findOne({ queueId });
    if (!entry) return { success: false, message: 'Queue entry not found' };
    if (entry.userId !== userId) return { success: false, message: 'Unauthorized to cancel this entry' };

    if (['SUCCESS', 'FAILED'].includes(entry.status)) {
      return { success: false, message: `Cannot cancel entry in ${entry.status} status` };
    }

    await QueueEntry.updateOne({ queueId }, { status: 'CANCELLED', failureReason: 'USER_CANCELLED' });
    
    // Broadcast status change
    if (this.io) {
      this.io.to(`queue:${queueId}`).emit('queue:status_changed', {
        queueId,
        status: 'CANCELLED',
        message: 'You have exited the virtual queue.',
      });
    }

    return { success: true, message: 'Successfully left the queue.' };
  }
}

const queueManager = new QueueManager();
module.exports = queueManager;
