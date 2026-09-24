const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');
const QueueEntry = require('../models/QueueEntry');
const queueManager = require('../queue/queueManager');
const logger = require('../utils/logger');

exports.getAllFlashSales = async (req, res) => {
  try {
    const sales = await FlashSale.find();
    // Attach product info if needed
    const enriched = await Promise.all(
      sales.map(async (sale) => {
        const product = await Product.findById(sale.productId);
        const queueDepth = await queueManager.getQueueLength(sale._id || sale.id);
        return {
          ...sale,
          productName: product ? product.name : sale.title,
          productImage: product ? product.imageUrl : '',
          queueDepth,
        };
      })
    );
    res.json({ success: true, count: enriched.length, flashSales: enriched });
  } catch (error) {
    logger.error('Error getting flash sales', { error: error.message });
    res.status(500).json({ success: false, message: 'Could not fetch flash sales' });
  }
};

exports.getActiveFlashSale = async (req, res) => {
  try {
    let sale = await FlashSale.findOne({ status: 'ACTIVE' });
    if (!sale) {
      sale = await FlashSale.findOne({ status: 'UPCOMING' });
    }
    if (!sale) {
      // Find the latest sale regardless
      const all = await FlashSale.find();
      sale = all[0] || null;
    }

    if (!sale) {
      return res.status(404).json({ success: false, message: 'No flash sale currently configured.' });
    }

    const product = await Product.findById(sale.productId);
    const queueDepth = await queueManager.getQueueLength(sale._id || sale.id);

    res.json({
      success: true,
      flashSale: {
        ...sale,
        product,
        queueDepth,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving active flash sale' });
  }
};

exports.getFlashSaleById = async (req, res) => {
  try {
    const sale = await FlashSale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Flash sale not found' });
    }
    const product = await Product.findById(sale.productId);
    const queueDepth = await queueManager.getQueueLength(sale._id || sale.id);

    res.json({
      success: true,
      flashSale: {
        ...sale,
        product,
        queueDepth,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving flash sale' });
  }
};

exports.createFlashSale = async (req, res) => {
  try {
    const { productId, title, originalPrice, salePrice, stock, startTime, endTime, maxQtyPerUser } = req.body;
    if (!productId || !title || !salePrice || !stock) {
      return res.status(400).json({ success: false, message: 'Please provide productId, title, salePrice, and stock.' });
    }

    const orig = Number(originalPrice || salePrice);
    const sPrice = Number(salePrice);
    const discount = orig > sPrice ? Math.round(((orig - sPrice) / orig) * 100) : 0;
    const initialStock = Number(stock);

    const sale = await FlashSale.create({
      productId,
      title,
      originalPrice: orig,
      salePrice: sPrice,
      discountPercentage: discount,
      totalStock: initialStock,
      remainingStock: initialStock,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      maxQtyPerUser: maxQtyPerUser || 1,
      status: 'ACTIVE',
    });

    logger.info(`Flash sale created: ${sale.title} with ${sale.totalStock} units`, { server: req.assignedServer?.id });

    res.status(201).json({ success: true, message: 'Flash sale created and live', flashSale: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating flash sale' });
  }
};

exports.startFlashSale = async (req, res) => {
  try {
    const sale = await FlashSale.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'ACTIVE', startTime: new Date() } },
      { new: true }
    );
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    logger.info(`Flash sale started: ${sale.title}`, { server: 'ADMIN' });
    res.json({ success: true, message: 'Flash sale is now ACTIVE', flashSale: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start sale' });
  }
};

exports.pauseFlashSale = async (req, res) => {
  try {
    const sale = await FlashSale.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'PAUSED' } },
      { new: true }
    );
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    logger.info(`Flash sale paused: ${sale.title}`, { server: 'ADMIN' });
    res.json({ success: true, message: 'Flash sale is now PAUSED', flashSale: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to pause sale' });
  }
};

exports.endFlashSale = async (req, res) => {
  try {
    const sale = await FlashSale.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'ENDED', endTime: new Date() } },
      { new: true }
    );
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    logger.info(`Flash sale ended: ${sale.title}`, { server: 'ADMIN' });
    res.json({ success: true, message: 'Flash sale has ENDED', flashSale: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to end sale' });
  }
};

exports.resetStock = async (req, res) => {
  try {
    const { stock = 10 } = req.body;
    const newStock = Number(stock);

    const sale = await FlashSale.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          totalStock: newStock,
          remainingStock: newStock,
          status: 'ACTIVE',
        },
      },
      { new: true }
    );

    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

    logger.info(`Reset stock for flash sale ${sale.title} to ${newStock} units`, { server: 'ADMIN' });

    res.json({
      success: true,
      message: `Stock successfully reset to ${newStock} units. Flash sale set to ACTIVE.`,
      flashSale: sale,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset stock' });
  }
};
