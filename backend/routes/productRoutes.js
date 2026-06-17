const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET: Fetch all available products for the feed
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ status: 'Available' }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error loading products', error: error.message });
  }
});

// POST: Create a new listing
router.post('/', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error creating listing', error: error.message });
  }
});

module.exports = router;