const cloudMonitorService = require('../services/cloudMonitorService');
const trafficSimulator = require('../services/trafficSimulator');
const queueManager = require('../queue/queueManager');
const workerPool = require('../workers/workerPool');
const QueueEntry = require('../models/QueueEntry');
const FlashSale = require('../models/FlashSale');
const Order = require('../models/Order');
const { getRecentLogs } = require('../utils/logger');

exports.getMetrics = async (req, res) => {
  try {
    const metrics = await cloudMonitorService.getMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve telemetry metrics' });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const health = await cloudMonitorService.getSystemHealth();
    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve system health status' });
  }
};

exports.getQueueOverview = async (req, res) => {
  try {
    const waiting = await QueueEntry.countDocuments({ status: 'WAITING' });
    const processing = await QueueEntry.countDocuments({ status: 'PROCESSING' });
    const paymentPending = await QueueEntry.countDocuments({ status: 'PAYMENT_PENDING' });
    const success = await QueueEntry.countDocuments({ status: 'SUCCESS' });
    const failed = await QueueEntry.countDocuments({ status: 'FAILED' });
    const expired = await QueueEntry.countDocuments({ status: 'EXPIRED' });
    const cancelled = await QueueEntry.countDocuments({ status: 'CANCELLED' });

    const recentEntries = await QueueEntry.find();
    // Sort recent entries by joinedAt desc
    const sortedEntries = recentEntries
      .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
      .slice(0, 30);

    const workerStats = workerPool.getMetrics();

    res.json({
      success: true,
      stats: {
        waiting,
        processing,
        paymentPending,
        success,
        failed,
        expired,
        cancelled,
        total: waiting + processing + paymentPending + success + failed + expired + cancelled,
        avgProcessingTimeMs: workerStats.avgProcessingTimeMs,
        activeWorkers: workerStats.activeWorkers,
      },
      recentEntries: sortedEntries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve queue overview' });
  }
};

exports.startTrafficSimulation = async (req, res) => {
  try {
    const { userCount = 100, flashSaleId } = req.body;
    const count = parseInt(userCount, 10) || 100;

    const result = await trafficSimulator.runSimulation({
      userCount: count,
      flashSaleId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to initiate traffic simulation' });
  }
};

exports.getTrafficSimulationStatus = async (req, res) => {
  try {
    const status = trafficSimulator.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check simulation status' });
  }
};

exports.getServerLogs = async (req, res) => {
  try {
    const logs = getRecentLogs();
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
};
