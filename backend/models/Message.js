const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // Which conversation does this bubble belong to?
    conversationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Conversation', 
      required: true 
    },
    // Who sent it?
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    // The actual text
    text: { 
      type: String, 
      required: true 
    },
    // For read receipts later
    isRead: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true } 
);

module.exports = mongoose.model('Message', messageSchema);