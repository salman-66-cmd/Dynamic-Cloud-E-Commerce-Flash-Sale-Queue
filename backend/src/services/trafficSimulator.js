const { v4: uuidv4 } = require('uuid');
const queueManager = require('../queue/queueManager');
const FlashSale = require('../models/FlashSale');
const User = require('../models/User');
const logger = require('../utils/logger');

class TrafficSimulator {
  constructor() {
    this.isRunning = false;
    this.io = null;
    this.currentSimulation = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  async runSimulation({ userCount = 100, flashSaleId }) {
    if (this.isRunning) {
      return { success: false, message: 'A traffic simulation is already running.' };
    }

    // Find active flash sale
    let sale;
    if (flashSaleId) {
      sale = await FlashSale.findById(flashSaleId);
    } else {
      sale = await FlashSale.findOne({ status: 'ACTIVE' });
    }

    if (!sale) {
      return { success: false, message: 'No active flash sale found to simulate traffic against.' };
    }

    const targetSaleId = String(sale._id || sale.id);
    this.isRunning = true;
    const startTime = Date.now();

    this.currentSimulation = {
      id: `sim_${Date.now()}`,
      userCount,
      flashSaleId: targetSaleId,
      productTitle: sale.title,
      initialStock: sale.remainingStock,
      startTime: new Date().toISOString(),
      status: 'RUNNING',
      injectedCount: 0,
      rejectedCount: 0,
      errors: 0,
    };

    logger.info(`START TRAFFIC SIMULATION: Generating ${userCount} concurrent flash-sale requests for '${sale.title}' (Stock: ${sale.remainingStock})`, {
      server: 'LOAD-SIMULATOR',
      userCount,
    });

    if (this.io) {
      this.io.to('admin:metrics').emit('admin:simulation_started', this.currentSimulation);
    }

    // Fire batch generation in background so response returns immediately
    this._executeSimulationBatches(userCount, targetSaleId, sale.productId, startTime);

    return {
      success: true,
      simulationId: this.currentSimulation.id,
      message: `Injected burst of ${userCount} virtual shoppers into the Flash Sale queue.`,
      initialStock: sale.remainingStock,
    };
  }

  async _executeSimulationBatches(totalUsers, flashSaleId, productId, startTime) {
    const batchSize = 50;
    let injected = 0;
    let rejected = 0;

    for (let i = 0; i < totalUsers; i += batchSize) {
      const currentBatch = Math.min(batchSize, totalUsers - i);
      const promises = [];

      for (let j = 0; j < currentBatch; j++) {
        const simUserId = `sim_user_${i + j}_${uuidv4().substring(0, 5)}`;
        const simName = `Virtual Shopper #${i + j + 1}`;
        const simEmail = `shopper_${i + j + 1}@virtual-cloud.net`;

        promises.push(
          queueManager.enqueue({
            userId: simUserId,
            userName: simName,
            userEmail: simEmail,
            flashSaleId,
            productId,
          }).then(res => {
            if (res.success) injected++;
            else rejected++;
          }).catch(() => {
            this.currentSimulation.errors++;
          })
        );
      }

      await Promise.all(promises);

      this.currentSimulation.injectedCount = injected;
      this.currentSimulation.rejectedCount = rejected;

      if (this.io) {
        this.io.to('admin:metrics').emit('admin:simulation_progress', {
          injected,
          rejected,
          total: totalUsers,
          percentage: Math.round(((injected + rejected) / totalUsers) * 100),
        });
      }

      // Small throttle between batches to emulate distributed client network arrival
      await new Promise(r => setTimeout(r, 40));
    }

    const durationSec = Math.max(0.1, (Date.now() - startTime) / 1000);
    const rps = Math.round(injected / durationSec);

    this.currentSimulation.status = 'COMPLETED';
    this.currentSimulation.durationSec = durationSec.toFixed(2);
    this.currentSimulation.rps = rps;
    this.isRunning = false;

    logger.info(`TRAFFIC SIMULATION COMPLETED: Enqueued ${injected} shoppers in ${durationSec.toFixed(2)}s (${rps} requests/sec)`, {
      server: 'LOAD-SIMULATOR',
      injected,
      rps,
    });

    if (this.io) {
      this.io.to('admin:metrics').emit('admin:simulation_completed', this.currentSimulation);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      current: this.currentSimulation,
    };
  }
}

const trafficSimulator = new TrafficSimulator();
module.exports = trafficSimulator;
