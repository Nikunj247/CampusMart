const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String, required: true },
  condition: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], // Array of image URLs
  location: { type: String, default: 'DTU Campus' },
  seller: {
    name: { type: String, required: true },
    year: { type: String, required: true },
    department: { type: String, required: true },
    avatar: { type: String }
  },
  status: { type: String, enum: ['Available', 'Pending', 'Sold'], default: 'Available' }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model('Product', productSchema);