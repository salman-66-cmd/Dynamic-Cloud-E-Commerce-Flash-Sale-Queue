const Order = require('../models/Order');
const QueueEntry = require('../models/QueueEntry');
const FlashSale = require('../models/FlashSale');
const logger = require('../utils/logger');

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    logger.error('Error fetching user orders', { error: error.message });
    res.status(500).json({ success: false, message: 'Could not fetch orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving order' });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params; // orderId
    const { simulateSuccess = true } = req.body;

    const order = await Order.findOne({ orderId: id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Order is already in ${order.status} state. Payment cannot be reprocessed.`,
      });
    }

    logger.info(`Simulating payment for order ${id} (Intent: ${simulateSuccess ? 'SUCCESS' : 'FAILURE'})`, {
      server: req.assignedServer?.id,
      orderId: id,
    });

    // Mark as PAYMENT_PROCESSING
    await Order.updateOne({ orderId: id }, { paymentStatus: 'PAYMENT_PROCESSING' });

    // Simulate 1.2 second cloud payment gateway verification
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (simulateSuccess) {
      // Payment Successful
      const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      await Order.updateOne(
        { orderId: id },
        {
          status: 'CONFIRMED',
          paymentStatus: 'PAYMENT_SUCCESS',
          paymentId,
        }
      );

      if (order.queueId) {
        await QueueEntry.updateOne(
          { queueId: order.queueId },
          { status: 'SUCCESS' }
        );
      }

      logger.info(`Payment SUCCESS for order ${id}. Transaction ID: ${paymentId}`, {
        server: req.assignedServer?.id,
        orderId: id,
      });

      const updatedOrder = await Order.findOne({ orderId: id });

      // Notify via socket
      if (req.app.get('io') && order.queueId) {
        req.app.get('io').to(`queue:${order.queueId}`).emit('queue:status_changed', {
          queueId: order.queueId,
          status: 'SUCCESS',
          orderId: id,
          paymentId,
          message: 'Payment verified! Your flash sale order is officially CONFIRMED.',
        });
      }

      return res.json({
        success: true,
        message: 'Payment completed successfully! Order confirmed.',
        order: updatedOrder,
      });
    } else {
      // Payment Failed -> release inventory lock
      await Order.updateOne(
        { orderId: id },
        {
          status: 'FAILED',
          paymentStatus: 'PAYMENT_FAILED',
        }
      );

      if (order.queueId) {
        await QueueEntry.updateOne(
          { queueId: order.queueId },
          { status: 'FAILED', failureReason: 'PAYMENT_DECLINED' }
        );
      }

      // Concurrency lock release: Put 1 unit back into FlashSale pool
      const updatedSale = await FlashSale.findOneAndUpdate(
        { _id: order.flashSaleId },
        { $inc: { remainingStock: 1 } },
        { new: true }
      );

      logger.warn(`Payment FAILED for order ${id}. Released stock back to sale pool.`, {
        server: req.assignedServer?.id,
        orderId: id,
      });

      if (req.app.get('io') && order.queueId) {
        req.app.get('io').to(`queue:${order.queueId}`).emit('queue:status_changed', {
          queueId: order.queueId,
          status: 'FAILED',
          failureReason: 'PAYMENT_DECLINED',
          message: 'Payment simulation declined. Reserved inventory returned to the pool.',
        });
        if (updatedSale) {
          req.app.get('io').to(`flashsale:${order.flashSaleId}`).emit('flashsale:stock_updated', {
            flashSaleId: order.flashSaleId,
            remainingStock: updatedSale.remainingStock,
          });
        }
      }

      return res.status(400).json({
        success: false,
        message: 'Payment failed/declined. Your reservation has been canceled and stock released.',
      });
    }
  } catch (error) {
    logger.error('Error during simulated payment', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal error processing payment transaction' });
  }
};
