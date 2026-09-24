const Product = require('../models/Product');
const logger = require('../utils/logger');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'ACTIVE' });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    logger.error('Error fetching products', { error: error.message });
    res.status(500).json({ success: false, message: 'Could not retrieve products' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving product' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, originalPrice, salePrice, stock, imageUrl, category } = req.body;
    if (!name || !originalPrice || !stock) {
      return res.status(400).json({ success: false, message: 'Product name, originalPrice, and stock are required.' });
    }

    const product = await Product.create({
      name,
      description: description || 'High-performance cloud-grade hardware',
      originalPrice: Number(originalPrice),
      salePrice: Number(salePrice || originalPrice),
      stock: Number(stock),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
      category: category || 'Electronics',
      status: 'ACTIVE',
    });

    logger.info(`Product created: ${product.name} (Stock: ${product.stock})`, { server: req.assignedServer?.id });

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: { status: 'INACTIVE' } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product archived successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};
