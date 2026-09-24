const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { verifyToken } = require('../middleware/auth');
const { flashSaleJoinLimiter } = require('../middleware/rateLimiter');

router.post('/join', verifyToken, flashSaleJoinLimiter, queueController.joinQueue);
router.get('/:id', queueController.getQueueStatus);
router.delete('/:id', verifyToken, queueController.cancelQueue);

module.exports = router;
