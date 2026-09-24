const mongoose = require('mongoose');
const { mockModels, isRealMongo } = require('../config/db');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER', index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

let MongoUserModel;
try {
  MongoUserModel = mongoose.model('User', userSchema);
} catch (e) {
  MongoUserModel = mongoose.models.User;
}

const UserModelProxy = new Proxy({}, {
  get(target, prop) {
    if (isRealMongo() && MongoUserModel) {
      return MongoUserModel[prop];
    }
    return mockModels.User[prop];
  }
});

module.exports = UserModelProxy;
