const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateProfile, getSavedItems, toggleSaveItem, verifyEmail, updateWishlist, deleteAccount} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { strictLimiter } = require('../middleware/rateLimiter');

router.post('/login', strictLimiter, loginUser);
router.post('/register', strictLimiter, registerUser);
router.put('/profile', protect, updateProfile);
router.get('/saved', protect, getSavedItems); 
router.post('/save/:id', protect, toggleSaveItem); 
router.post('/verify-otp', verifyEmail);
router.put('/wishlist', protect, updateWishlist);
router.delete('/profile', protect, deleteAccount);

module.exports = router;