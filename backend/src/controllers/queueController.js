const queueManager = require('../queue/queueManager');
const FlashSale = require('../models/FlashSale');
const logger = require('../utils/logger');

exports.joinQueue = async (req, res) => {
  try {
    const { flashSaleId } = req.body;
    if (!flashSaleId) {
      return res.status(400).json({ success: false, message: 'flashSaleId is required' });
    }

    const sale = await FlashSale.findById(flashSaleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Flash sale does not exist.' });
    }

    if (sale.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Flash sale is currently ${sale.status}. You cannot join the queue now.`,
      });
    }

    const result = await queueManager.enqueue({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      flashSaleId,
      productId: sale.productId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Successfully entered the cloud virtual queue.',
      queueId: result.entry.queueId,
      position: result.position,
      peopleAhead: result.peopleAhead,
      estimatedWaitSeconds: result.estimatedWaitSeconds,
      status: result.entry.status,
    });
  } catch (error) {
    logger.error('Error joining queue', { error: error.message });
    res.status(500).json({ success: false, message: 'An unexpected error occurred while entering the queue.' });
  }
};

exports.getQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await queueManager.getStatus(id);
    if (!status) {
      return res.status(404).json({ success: false, message: 'Queue record not found' });
    }

    res.json({
      success: true,
      queue: status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve queue status' });
  }
};

exports.cancelQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await queueManager.cancelQueue(id, req.user.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not cancel queue entry' });
  }
};
