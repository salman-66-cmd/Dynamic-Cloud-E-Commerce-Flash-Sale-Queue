const mongoose = require('mongoose');
const { mockModels, isRealMongo } = require('../config/db');

const flashSaleSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    originalPrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    totalStock: { type: Number, required: true },
    remainingStock: { type: Number, required: true, min: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    maxQtyPerUser: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'PAUSED', 'ENDED'],
      default: 'UPCOMING',
      index: true,
    },
  },
  { timestamps: true }
);

let MongoFlashSaleModel;
try {
  MongoFlashSaleModel = mongoose.model('FlashSale', flashSaleSchema);
} catch (e) {
  MongoFlashSaleModel = mongoose.models.FlashSale;
}

const FlashSaleModelProxy = new Proxy({}, {
  get(target, prop) {
    if (isRealMongo() && MongoFlashSaleModel) {
      return MongoFlashSaleModel[prop];
    }
    return mockModels.FlashSale[prop];
  }
});

module.exports = FlashSaleModelProxy;
