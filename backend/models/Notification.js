const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, // The person who triggered it (e.g., the person who saved your item)
  item: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item' 
  }, // The item involved
  type: { 
    type: String, 
    enum: ['ITEM_SAVED', 'SYSTEM', 'PRICE_DROP', 'WISHLIST_MATCH'], 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);