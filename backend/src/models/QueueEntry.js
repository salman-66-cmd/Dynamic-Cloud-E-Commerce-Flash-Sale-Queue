const mongoose = require('mongoose');
const { mockModels, isRealMongo } = require('../config/db');

const queueEntrySchema = new mongoose.Schema(
  {
    queueId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: 'Shopper' },
    userEmail: { type: String, default: '' },
    flashSaleId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    position: { type: Number, default: 0, index: true },
    initialPosition: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['WAITING', 'PROCESSING', 'PAYMENT_PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED'],
      default: 'WAITING',
      index: true,
    },
    retryCount: { type: Number, default: 0 },
    reservationExpiresAt: { type: Date },
    orderId: { type: String },
    failureReason: { type: String },
    processedByWorker: { type: String },
    joinedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

let MongoQueueEntryModel;
try {
  MongoQueueEntryModel = mongoose.model('QueueEntry', queueEntrySchema);
} catch (e) {
  MongoQueueEntryModel = mongoose.models.QueueEntry;
}

const QueueEntryModelProxy = new Proxy({}, {
  get(target, prop) {
    if (isRealMongo() && MongoQueueEntryModel) {
      return MongoQueueEntryModel[prop];
    }
    return mockModels.QueueEntry[prop];
  }
});

module.exports = QueueEntryModelProxy;
