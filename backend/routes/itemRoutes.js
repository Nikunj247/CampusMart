const express = require('express');
const router = express.Router();
const { createItem, getItems, getItemById, getMyItems, deleteItem } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');
const { globalSearchTrie } = require('../utils/searchEngine');
const { itemLimiter } = require('../middleware/rateLimiter');

router.get('/autocomplete', (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);
    
    // If this function throws an error, the catch block will save the server
    const suggestions = globalSearchTrie.searchPrefix(query);
    res.json(suggestions);

  } catch (error) {
    // This will print the EXACT reason it is failing to your backend terminal
    console.error("🚨 TRIE ENGINE CRASH:", error);
    res.status(500).json({ message: "Search Engine Failed", error: error.message });
  }
});

// Group routes by path
router.route('/')
  .get(protect, getItems)      // View the feed
  .post(protect, itemLimiter, createItem)  // List an item

// THIS MUST BE ABOVE /:id
router.get('/me', protect, getMyItems);

// Removed the semicolon so they chain together properly
router.route('/:id')
  .get(protect, getItemById)   // View specific item details
  .delete(protect, deleteItem); // Delete specific item

module.exports = router;