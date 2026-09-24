const mongoose = require('mongoose');
const { mockModels, isRealMongo } = require('../config/db');

const systemMetricSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    activeWorkers: { type: Number, default: 2 },
    queueLength: { type: Number, default: 0 },
    rps: { type: Number, default: 0 },
    cpuUsage: { type: Number, default: 0 },
    memUsage: { type: Number, default: 0 },
    activeConnections: { type: Number, default: 0 },
    loadBalancerDistribution: { type: Object, default: {} },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

let MongoSystemMetricModel;
try {
  MongoSystemMetricModel = mongoose.model('SystemMetric', systemMetricSchema);
} catch (e) {
  MongoSystemMetricModel = mongoose.models.SystemMetric;
}

const SystemMetricModelProxy = new Proxy({}, {
  get(target, prop) {
    if (isRealMongo() && MongoSystemMetricModel) {
      return MongoSystemMetricModel[prop];
    }
    return mockModels.SystemMetric[prop];
  }
});

module.exports = SystemMetricModelProxy;
