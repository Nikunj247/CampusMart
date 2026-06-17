const express = require('express');
const router = express.Router();
const { 
  accessChat, 
  getChats, 
  getMessages, 
  sendMessage, 
  deleteChat, 
  markConversationAsRead 
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, accessChat) // Create/Find chat
  .get(protect, getChats);   // Fetch inbox

router.post('/message', protect, sendMessage);

router.route('/:chatId/messages')
  .get(protect, getMessages); // Fetch message history

// --- NEW ROUTES: Read Receipts & Deletion ---
router.put('/:chatId/read', protect, markConversationAsRead);
router.delete('/:chatId', protect, deleteChat);

module.exports = router;