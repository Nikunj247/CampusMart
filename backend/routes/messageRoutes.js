const express = require('express');
const router = express.Router();
// --- ADDED deleteChat HERE ---
const { sendMessage, getConversations, getMessages, getUnreadCount, markConversationAsRead, toggleArchiveChat, getOrCreateConversation, deleteChat } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { messageLimiter } = require('../middleware/rateLimiter');

router.route('/')
  .post(protect, messageLimiter, sendMessage);

router.get('/inbox', protect, getConversations);
router.get('/unread', protect, getUnreadCount);
router.get('/:conversationId', protect, getMessages);
router.put('/:conversationId/read', protect, markConversationAsRead);
router.put('/:conversationId/archive', protect, toggleArchiveChat);
router.post('/conversation', protect, getOrCreateConversation);
router.delete('/:conversationId', protect, deleteChat);

module.exports = router;