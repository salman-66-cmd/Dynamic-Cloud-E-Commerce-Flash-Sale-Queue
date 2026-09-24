const express = require('express');
const router = express.Router();
const flashSaleController = require('../controllers/flashSaleController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', flashSaleController.getAllFlashSales);
router.get('/active', flashSaleController.getActiveFlashSale);
router.get('/:id', flashSaleController.getFlashSaleById);

// Admin controls
router.post('/', verifyToken, requireAdmin, flashSaleController.createFlashSale);
router.post('/:id/start', verifyToken, requireAdmin, flashSaleController.startFlashSale);
router.post('/:id/pause', verifyToken, requireAdmin, flashSaleController.pauseFlashSale);
router.post('/:id/end', verifyToken, requireAdmin, flashSaleController.endFlashSale);
router.post('/:id/reset-stock', verifyToken, requireAdmin, flashSaleController.resetStock);

module.exports = router;
