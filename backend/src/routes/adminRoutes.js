const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// All admin routes require valid admin authentication
router.use(verifyToken, requireAdmin);

router.get('/metrics', adminController.getMetrics);
router.get('/system-health', adminController.getSystemHealth);
router.get('/queue', adminController.getQueueOverview);
router.get('/logs', adminController.getServerLogs);
router.post('/simulation/start', adminController.startTrafficSimulation);
router.get('/simulation/status', adminController.getTrafficSimulationStatus);

module.exports = router;
