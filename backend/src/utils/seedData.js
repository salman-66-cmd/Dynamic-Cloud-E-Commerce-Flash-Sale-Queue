const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const FlashSale = require('../models/FlashSale');
const logger = require('./logger');

async function seedInitialData() {
  try {
    // 1. Seed Admin User
    const existingAdmin = await User.findOne({ email: 'admin@cloudsale.com' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      await User.create({
        name: 'Cloud Administrator',
        email: 'admin@cloudsale.com',
        password: hashedPassword,
        role: 'ADMIN',
      });
      logger.info('Seeded default Admin: admin@cloudsale.com / Admin@123', { server: 'SYSTEM' });
    }

    // 2. Seed Test Shopper User
    const existingUser = await User.findOne({ email: 'user@cloudsale.com' });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('User@123', salt);
      await User.create({
        name: 'Alex Mercer (Shopper)',
        email: 'user@cloudsale.com',
        password: hashedPassword,
        role: 'USER',
      });
      logger.info('Seeded default User: user@cloudsale.com / User@123', { server: 'SYSTEM' });
    }

    // 3. Seed Products
    let primaryProduct = await Product.findOne({ name: { $regex: /RTX/i } });
    if (!primaryProduct) {
      primaryProduct = await Product.create({
        name: 'RTX 4090 Ti Cloud-Extreme Gaming Laptop',
        description: 'Ultra-thin aerospace aluminum chassis, Intel Core i9-14900HX 24-core, NVIDIA GeForce RTX 4090 16GB GDDR6 (175W max TGP), 64GB DDR5 5600MHz RAM, 2TB PCIe 4.0 NVMe SSD, 16" 240Hz QHD+ G-Sync display.',
        originalPrice: 3499,
        salePrice: 1499,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80',
        category: 'Laptops',
        status: 'ACTIVE',
      });

      // Additional catalog items
      await Product.create({
        name: 'CloudPro Quantum Noise-Cancelling Headphones',
        description: 'Lossless spatial audio with active beamforming dual-microphones and 45-hour ultra-density lithium cell battery.',
        originalPrice: 399,
        salePrice: 199,
        stock: 120,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        category: 'Audio',
        status: 'ACTIVE',
      });

      await Product.create({
        name: 'AeroMech RGB Low-Profile Wireless Keyboard',
        description: 'Custom lubed hot-swappable tactile switches, tri-mode 2.4GHz + Bluetooth 5.3 + USB-C connectivity.',
        originalPrice: 220,
        salePrice: 99,
        stock: 80,
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        category: 'Peripherals',
        status: 'ACTIVE',
      });

      logger.info('Seeded demonstration catalog products', { server: 'SYSTEM' });
    }

    // 4. Seed Active Flash Sale for the demonstration
    const activeSale = await FlashSale.findOne({ status: 'ACTIVE' });
    if (!activeSale && primaryProduct) {
      await FlashSale.create({
        productId: String(primaryProduct._id || primaryProduct.id),
        title: 'Cyber Rush: RTX 4090 Gaming Laptop Mega Flash Sale',
        description: 'Flash sale limit: Strictly 1 unit per verified shopper. Guaranteed zero overselling enforced via cloud queue mutex.',
        originalPrice: primaryProduct.originalPrice || 3499,
        salePrice: primaryProduct.salePrice || 1499,
        discountPercentage: 57,
        totalStock: 10,
        remainingStock: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maxQtyPerUser: 1,
        status: 'ACTIVE',
      });
      logger.info('Seeded default active Flash Sale (10 units stock)', { server: 'SYSTEM' });
    }
  } catch (error) {
    logger.error('Error during data seeding', { error: error.message });
  }
}

module.exports = seedInitialData;
