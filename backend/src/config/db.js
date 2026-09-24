const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

let isMongoConnected = false;
let dbMode = 'In-Memory Cloud Emulation';
let queryCount = 0;
let dbLatency = 2;

// In-Memory Document Store for local standalone execution without MongoDB daemon
class InMemoryStore {
  constructor() {
    this.collections = {
      users: new Map(),
      products: new Map(),
      flashsales: new Map(),
      queueentries: new Map(),
      orders: new Map(),
      systemmetrics: new Map(),
    };
  }

  getCollection(name) {
    const key = name.toLowerCase();
    if (!this.collections[key]) {
      this.collections[key] = new Map();
    }
    return this.collections[key];
  }
}

const memoryStore = new InMemoryStore();

function checkCondition(itemVal, condVal) {
  if (condVal && typeof condVal === 'object') {
    if ('$gt' in condVal && !(itemVal > condVal.$gt)) return false;
    if ('$gte' in condVal && !(itemVal >= condVal.$gte)) return false;
    if ('$lt' in condVal && !(itemVal < condVal.$lt)) return false;
    if ('$lte' in condVal && !(itemVal <= condVal.$lte)) return false;
    if ('$ne' in condVal && itemVal === condVal.$ne) return false;
    if ('$in' in condVal && !condVal.$in.includes(itemVal)) return false;
    return true;
  }
  return itemVal === condVal;
}

function matchesFilter(doc, filter = {}) {
  for (const [k, v] of Object.entries(filter)) {
    if (k === '_id' || k === 'id') {
      const docId = String(doc._id || doc.id);
      const targetId = String(v);
      if (docId !== targetId) return false;
      continue;
    }
    if (!checkCondition(doc[k], v)) return false;
  }
  return true;
}

// Model wrapper providing Mongoose-compatible interface
function createMockModel(name) {
  const col = memoryStore.getCollection(name);

  return class MockModel {
    constructor(data = {}) {
      this._id = data._id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      Object.assign(this, data);
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = new Date();
    }

    async save() {
      queryCount++;
      col.set(String(this._id), { ...this, updatedAt: new Date() });
      return this;
    }

    static async create(data) {
      queryCount++;
      const instance = new MockModel(data);
      col.set(String(instance._id), { ...instance });
      return instance;
    }

    static async find(filter = {}) {
      queryCount++;
      const docs = [];
      for (const item of col.values()) {
        if (matchesFilter(item, filter)) {
          docs.push({ ...item });
        }
      }
      return docs;
    }

    static async findOne(filter = {}) {
      queryCount++;
      for (const item of col.values()) {
        if (matchesFilter(item, filter)) {
          return { ...item };
        }
      }
      return null;
    }

    static async findById(id) {
      queryCount++;
      const doc = col.get(String(id));
      return doc ? { ...doc } : null;
    }

    static async findByIdAndUpdate(id, update, options = {}) {
      return MockModel.findOneAndUpdate({ _id: String(id) }, update, options);
    }

    // Atomic findOneAndUpdate supporting $inc and conditions
    static async findOneAndUpdate(filter = {}, update = {}, options = {}) {
      queryCount++;
      for (const [id, item] of col.entries()) {
        if (matchesFilter(item, filter)) {
          const doc = { ...item };
          
          // Apply $inc
          if (update.$inc) {
            for (const [k, incVal] of Object.entries(update.$inc)) {
              doc[k] = (doc[k] || 0) + incVal;
            }
          }
          // Apply $set
          if (update.$set) {
            for (const [k, setVal] of Object.entries(update.$set)) {
              doc[k] = setVal;
            }
          }
          // Direct fields
          for (const [k, v] of Object.entries(update)) {
            if (!k.startsWith('$')) {
              doc[k] = v;
            }
          }

          doc.updatedAt = new Date();
          col.set(id, doc);
          return options.new ? { ...doc } : { ...item };
        }
      }
      return null;
    }

    static async updateOne(filter = {}, update = {}) {
      const res = await MockModel.findOneAndUpdate(filter, update, { new: true });
      return { modifiedCount: res ? 1 : 0 };
    }

    static async updateMany(filter = {}, update = {}) {
      queryCount++;
      let modified = 0;
      for (const [id, item] of col.entries()) {
        if (matchesFilter(item, filter)) {
          const doc = { ...item };
          if (update.$set) {
            Object.assign(doc, update.$set);
          }
          col.set(id, doc);
          modified++;
        }
      }
      return { modifiedCount: modified };
    }

    static async deleteOne(filter = {}) {
      queryCount++;
      for (const [id, item] of col.entries()) {
        if (matchesFilter(item, filter)) {
          col.delete(id);
          return { deletedCount: 1 };
        }
      }
      return { deletedCount: 0 };
    }

    static async deleteMany(filter = {}) {
      queryCount++;
      let deleted = 0;
      for (const [id, item] of col.entries()) {
        if (matchesFilter(item, filter)) {
          col.delete(id);
          deleted++;
        }
      }
      return { deletedCount: deleted };
    }

    static async countDocuments(filter = {}) {
      queryCount++;
      let count = 0;
      for (const item of col.values()) {
        if (matchesFilter(item, filter)) count++;
      }
      return count;
    }
  };
}

const mockModels = {
  User: createMockModel('users'),
  Product: createMockModel('products'),
  FlashSale: createMockModel('flashsales'),
  QueueEntry: createMockModel('queueentries'),
  Order: createMockModel('orders'),
  SystemMetric: createMockModel('systemmetrics'),
};

async function connectDB() {
  if (process.env.FORCE_IN_MEMORY_DB === 'true') {
    logger.info('Using Embedded In-Memory Database (FORCE_IN_MEMORY_DB enabled)', { server: 'SYSTEM' });
    return;
  }

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    dbMode = 'MongoDB Server (' + conn.connection.host + ')';
    logger.info(`MongoDB Connected: ${conn.connection.host}`, { server: 'SYSTEM' });
  } catch (err) {
    isMongoConnected = false;
    dbMode = 'In-Memory Zero-Config Store (Development Fallback)';
    logger.warn('MongoDB connection not available. Operating seamlessly with In-Memory Document Store.', {
      server: 'SYSTEM',
      error: err.message,
    });
  }
}

function getDBStatus() {
  return {
    connected: true,
    mode: dbMode,
    isRealMongo: isMongoConnected,
    queryCount,
    latencyMs: isMongoConnected ? 5 : dbLatency,
    collections: Object.keys(memoryStore.collections),
  };
}

module.exports = {
  connectDB,
  getDBStatus,
  mockModels,
  isRealMongo: () => isMongoConnected,
  memoryStore,
};
