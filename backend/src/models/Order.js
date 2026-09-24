const mongoose = require('mongoose');
const { mockModels, isRealMongo } = require('../config/db');

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, default: '' },
    flashSaleId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    productImage: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED'],
      default: 'PAYMENT_PENDING',
      index: true,
    },
    paymentId: { type: String },
    queueId: { type: String, index: true },
  },
  { timestamps: true }
);

let MongoOrderModel;
try {
  MongoOrderModel = mongoose.model('Order', orderSchema);
} catch (e) {
  MongoOrderModel = mongoose.models.Order;
}

const OrderModelProxy = new Proxy({}, {
  get(target, prop) {
    if (isRealMongo() && MongoOrderModel) {
      return MongoOrderModel[prop];
    }
    return mockModels.Order[prop];
  }
});

module.exports = OrderModelProxy;
