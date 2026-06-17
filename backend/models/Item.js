const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Creates a relationship with the User model
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for your listing'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: [true, 'Please set a price'],
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['Books and Notes', 'Electronics', 'Hostel Essentials', 'Miscellaneous']
    },
    condition: {
      type: String,
      required: [true, 'Please state the condition'],
      enum: ['Like New', 'Very Good', 'Good', 'Acceptable'],
    },
    images: [
      {
        type: String, // These will eventually be Cloudinary/S3 image URLs
        required: true,
      }
    ],
    status: {
      type: String,
      enum: ['Available', 'Pending', 'Sold'],
      default: 'Available',
    },
    meetupLocation: {
      type: String,
      required: [true, 'Please suggest a safe campus meetup spot'],
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);