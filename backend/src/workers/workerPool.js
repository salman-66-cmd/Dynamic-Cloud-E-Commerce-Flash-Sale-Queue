const { v4: uuidv4 } = require('uuid');
const redis = require('../config/redis');
const config = require('../config/env');
const QueueEntry = require('../models/QueueEntry');
const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');
const Order = require('../models/Order');
const queueManager = require('../queue/queueManager');
const logger = require('../utils/logger');

class WorkerPool {
  constructor() {
    this.minWorkers = config.MIN_WORKERS || 2;
    this.maxWorkers = config.MAX_WORKERS || 8;
    this.workers = [];
    this.scalingHistory = [];
    this.isRunning = false;
    this.io = null;
    this.totalProcessed = 0;
    this.totalSuccess = 0;
    this.totalFailed = 0;
    this.processingTimes = [];

    // Initialize minimum workers
    for (let i = 1; i <= this.minWorkers; i++) {
      this.workers.push(this._createWorker(i));
    }
  }

  setSocketIO(io) {
    this.io = io;
  }

  _createWorker(index) {
    return {
      id: `Worker-${index}`,
      name: `Queue Worker Node #${index}`,
      status: 'IDLE',
      currentJob: null,
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
      activeSince: new Date(),
      lastHeartbeat: new Date(),
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(`Worker Pool started with ${this.workers.length} active worker threads.`, { server: 'WORKER-POOL' });

    // Worker loop
    this.loopInterval = setInterval(() => this._processLoop(), 350);

    // Auto-Scaler loop (evaluates every 2 seconds)
    this.scalerInterval = setInterval(() => this._evaluateAutoScaling(), 2000);

    // Reservation timeout reaper (evaluates every 4 seconds)
    this.reaperInterval = setInterval(() => this._reapExpiredReservations(), 4000);
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.loopInterval);
    clearInterval(this.scalerInterval);
    clearInterval(this.reaperInterval);
    logger.info('Worker Pool stopped.', { server: 'WORKER-POOL' });
  }

  // Auto-scaling logic: Adjusts worker count based on queue pressure
  async _evaluateAutoScaling() {
    try {
      const activeSales = await FlashSale.find({ status: 'ACTIVE' });
      let totalQueueLength = 0;
      for (const sale of activeSales) {
        totalQueueLength += await queueManager.getQueueLength(sale._id || sale.id);
      }

      const currentCount = this.workers.length;
      let targetCount = currentCount;

      if (totalQueueLength > 250 && currentCount < this.maxWorkers) {
        targetCount = Math.min(this.maxWorkers, currentCount + 2);
      } else if (totalQueueLength > 50 && currentCount < this.maxWorkers) {
        targetCount = Math.min(this.maxWorkers, currentCount + 1);
      } else if (totalQueueLength < 15 && currentCount > this.minWorkers) {
        targetCount = Math.max(this.minWorkers, currentCount - 1);
      }

      if (targetCount !== currentCount) {
        const direction = targetCount > currentCount ? 'SCALE_UP' : 'SCALE_DOWN';
        
        if (targetCount > currentCount) {
          for (let i = currentCount + 1; i <= targetCount; i++) {
            this.workers.push(this._createWorker(i));
          }
        } else {
          this.workers.splice(targetCount);
        }

        const event = {
          id: `scale_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: direction,
          previousCount: currentCount,
          newCount: targetCount,
          queueLength: totalQueueLength,
          message: direction === 'SCALE_UP'
            ? `AUTO-SCALING TRIGGERED: Scaled UP from ${currentCount} to ${targetCount} workers (Queue pressure: ${totalQueueLength} items)`
            : `AUTO-SCALING TRIGGERED: Scaled DOWN from ${currentCount} to ${targetCount} workers (Idle queue: ${totalQueueLength} items)`,
        };

        this.scalingHistory.unshift(event);
        if (this.scalingHistory.length > 30) this.scalingHistory.pop();

        logger.info(event.message, { server: 'AUTO-SCALER' });

        if (this.io) {
          this.io.to('admin:metrics').emit('admin:auto_scale_event', event);
        }
      }
    } catch (err) {
      logger.error('Error evaluating auto-scaling', { error: err.message });
    }
  }

  async _processLoop() {
    try {
      // Find idle workers
      const idleWorkers = this.workers.filter(w => w.status === 'IDLE');
      if (idleWorkers.length === 0) return;

      // Find active flash sales
      const activeSales = await FlashSale.find({ status: 'ACTIVE' });
      if (activeSales.length === 0) return;

      for (const worker of idleWorkers) {
        for (const sale of activeSales) {
          const saleId = String(sale._id || sale.id);
          const queueId = await queueManager.dequeue(saleId);
          if (queueId) {
            this._runWorkerJob(worker, queueId, saleId);
            break;
          }
        }
      }
    } catch (err) {
      logger.error('Worker loop exception', { error: err.message });
    }
  }

  async _runWorkerJob(worker, queueId, flashSaleId) {
    const startTime = Date.now();
    worker.status = 'BUSY';
    worker.currentJob = queueId;
    worker.lastHeartbeat = new Date();

    try {
      const entry = await QueueEntry.findOne({ queueId });
      if (!entry) {
        worker.status = 'IDLE';
        worker.currentJob = null;
        return;
      }

      if (['CANCELLED', 'SUCCESS', 'FAILED'].includes(entry.status)) {
        worker.status = 'IDLE';
        worker.currentJob = null;
        return;
      }

      // 1. Mark as PROCESSING
      await QueueEntry.updateOne(
        { queueId },
        { status: 'PROCESSING', processedByWorker: worker.id, processedAt: new Date() }
      );

      if (this.io) {
        this.io.to(`queue:${queueId}`).emit('queue:status_changed', {
          queueId,
          status: 'PROCESSING',
          workerId: worker.id,
          message: 'Your turn has arrived! Worker is reserving your flash sale item...',
        });
      }

      // Small realistic processing latency (40ms - 90ms)
      await new Promise(r => setTimeout(r, 60));

      // 2. CONCURRENCY-SAFE INVENTORY RESERVATION (Zero Overselling Guarantee)
      // Only decrement when remainingStock > 0!
      const reservedSale = await FlashSale.findOneAndUpdate(
        {
          _id: flashSaleId,
          remainingStock: { $gt: 0 },
        },
        {
          $inc: { remainingStock: -1 },
        },
        { new: true }
      );

      if (!reservedSale) {
        // SOLD OUT! No stock remaining
        await QueueEntry.updateOne(
          { queueId },
          { status: 'FAILED', failureReason: 'SOLD_OUT' }
        );

        this.totalFailed++;
        worker.failedCount++;

        logger.warn(`Flash sale ${flashSaleId} item sold out for queue ${queueId}`, {
          server: worker.id,
          queueId,
        });

        if (this.io) {
          this.io.to(`queue:${queueId}`).emit('queue:status_changed', {
            queueId,
            status: 'FAILED',
            failureReason: 'SOLD_OUT',
            message: 'All flash sale units have been claimed. Product is Sold Out!',
          });
          this.io.to(`flashsale:${flashSaleId}`).emit('flashsale:stock_updated', {
            flashSaleId,
            remainingStock: 0,
            status: 'ACTIVE',
          });
        }
      } else {
        // STOCK RESERVED SUCCESSFULLY!
        // Create pending order and give user reservation window (120 seconds)
        const orderId = `ORD-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
        const product = await Product.findById(reservedSale.productId);

        const order = await Order.create({
          orderId,
          userId: entry.userId,
          userEmail: entry.userEmail,
          flashSaleId,
          productId: reservedSale.productId,
          productName: product ? product.name : reservedSale.title,
          productImage: product ? product.imageUrl : '',
          quantity: 1,
          unitPrice: reservedSale.salePrice,
          totalAmount: reservedSale.salePrice,
          status: 'PENDING',
          paymentStatus: 'PAYMENT_PENDING',
          queueId,
        });

        const reservationExpiresAt = new Date(Date.now() + config.RESERVATION_TIMEOUT_SEC * 1000);

        await QueueEntry.updateOne(
          { queueId },
          {
            status: 'PAYMENT_PENDING',
            orderId,
            reservationExpiresAt,
          }
        );

        this.totalSuccess++;
        worker.successCount++;

        logger.info(`Stock reserved! Created pending order ${orderId} for queue ${queueId}. Remaining: ${reservedSale.remainingStock}`, {
          server: worker.id,
          queueId,
          orderId,
          remainingStock: reservedSale.remainingStock,
        });

        if (this.io) {
          this.io.to(`queue:${queueId}`).emit('queue:status_changed', {
            queueId,
            status: 'PAYMENT_PENDING',
            orderId,
            order,
            reservationExpiresAt,
            message: 'Stock reserved! Complete simulated payment within 2 minutes to finalize.',
          });
          this.io.to(`flashsale:${flashSaleId}`).emit('flashsale:stock_updated', {
            flashSaleId,
            remainingStock: reservedSale.remainingStock,
            status: reservedSale.remainingStock === 0 ? 'ACTIVE' : 'ACTIVE',
          });
        }
      }
    } catch (err) {
      logger.error(`Worker error processing ${queueId}`, { server: worker.id, error: err.message });
      // Retry policy
      const entry = await QueueEntry.findOne({ queueId });
      if (entry && entry.retryCount < 2) {
        await QueueEntry.updateOne(
          { queueId },
          { $inc: { retryCount: 1 }, status: 'WAITING' }
        );
        await queueManager.enqueue(entry);
      } else {
        await QueueEntry.updateOne(
          { queueId },
          { status: 'FAILED', failureReason: 'WORKER_PROCESSING_ERROR' }
        );
      }
    } finally {
      const duration = Date.now() - startTime;
      this.processingTimes.push(duration);
      if (this.processingTimes.length > 50) this.processingTimes.shift();

      worker.processedCount++;
      worker.status = 'IDLE';
      worker.currentJob = null;
      worker.lastHeartbeat = new Date();
      this.totalProcessed++;
    }
  }

  // Reservation reaper: frees inventory if user failed to pay within reservation window
  async _reapExpiredReservations() {
    try {
      const now = new Date();
      const expiredEntries = await QueueEntry.find({
        status: 'PAYMENT_PENDING',
        reservationExpiresAt: { $lt: now },
      });

      for (const entry of expiredEntries) {
        logger.warn(`Reservation expired for queue ${entry.queueId}. Releasing inventory lock.`, {
          server: 'REAPER',
          queueId: entry.queueId,
        });

        // 1. Release reserved stock back to FlashSale
        const updatedSale = await FlashSale.findOneAndUpdate(
          { _id: entry.flashSaleId },
          { $inc: { remainingStock: 1 } },
          { new: true }
        );

        // 2. Mark queue entry as EXPIRED
        await QueueEntry.updateOne(
          { queueId: entry.queueId },
          { status: 'EXPIRED', failureReason: 'RESERVATION_TIMEOUT' }
        );

        // 3. Mark order as CANCELLED
        if (entry.orderId) {
          await Order.updateOne(
            { orderId: entry.orderId },
            { status: 'CANCELLED', paymentStatus: 'PAYMENT_FAILED' }
          );
        }

        if (this.io) {
          this.io.to(`queue:${entry.queueId}`).emit('queue:status_changed', {
            queueId: entry.queueId,
            status: 'EXPIRED',
            failureReason: 'RESERVATION_TIMEOUT',
            message: 'Your reservation timed out. Released back to the flash sale pool.',
          });
          if (updatedSale) {
            this.io.to(`flashsale:${entry.flashSaleId}`).emit('flashsale:stock_updated', {
              flashSaleId: entry.flashSaleId,
              remainingStock: updatedSale.remainingStock,
            });
          }
        }
      }
    } catch (err) {
      logger.error('Error during reservation reaper loop', { error: err.message });
    }
  }

  getMetrics() {
    const busyWorkers = this.workers.filter(w => w.status === 'BUSY').length;
    const avgDuration = this.processingTimes.length > 0
      ? Math.round(this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length)
      : 65;

    return {
      activeWorkers: this.workers.length,
      busyWorkers,
      idleWorkers: this.workers.length - busyWorkers,
      minWorkers: this.minWorkers,
      maxWorkers: this.maxWorkers,
      totalProcessed: this.totalProcessed,
      totalSuccess: this.totalSuccess,
      totalFailed: this.totalFailed,
      avgProcessingTimeMs: avgDuration,
      scalingHistory: this.scalingHistory.slice(0, 10),
      workers: this.workers.map(w => ({
        id: w.id,
        name: w.name,
        status: w.status,
        currentJob: w.currentJob,
        processedCount: w.processedCount,
        successCount: w.successCount,
        failedCount: w.failedCount,
        activeSince: w.activeSince,
        lastHeartbeat: w.lastHeartbeat,
      })),
    };
  }
}

const workerPool = new WorkerPool();
module.exports = workerPool;
