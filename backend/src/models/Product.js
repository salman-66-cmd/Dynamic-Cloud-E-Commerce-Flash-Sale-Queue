const mongoose = require('mongoose');
const { mockModels, isRealMongo } = require('../config/db');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    imageUrl: { type: String, default: '' },
    category: { type: String, default: 'Electronics' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

let MongoProductModel;
try {
  MongoProductModel = mongoose.model('Product', productSchema);
} catch (e) {
  MongoProductModel = mongoose.models.Product;
}

const ProductModelProxy = new Proxy({}, {
  get(target, prop) {
    if (isRealMongo() && MongoProductModel) {
      return MongoProductModel[prop];
    }
    return mockModels.Product[prop];
  }
});

module.exports = ProductModelProxy;
