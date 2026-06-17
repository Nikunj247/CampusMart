const Item = require('../models/Item');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Generate JWT Token Function
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user and send OTP
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, degree, department, gradYear, rollNumber } = req.body;

  try {
    // 1. STRICT DOMAIN CHECK
    if (!email.endsWith('@dtu.ac.in')) {
      return res.status(403).json({ message: 'Access Denied: Only @dtu.ac.in emails are allowed.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
    const otpExpires = Date.now() + 10 * 60 * 1000; 

    // 2. CHECK FOR EXISTING USERS
    let user = await User.findOne({ email });

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ message: 'This email is already registered and verified.' });
      }
      // If they exist but aren't verified, update their OTP and resend
      user.emailVerificationOtp = otp;
      user.otpExpires = otpExpires;
      user.name = name; // Update details just in case they made a typo previously
      user.rollNumber = rollNumber;
      await user.save();
    } else {
      // Create brand new user
      user = await User.create({
        name, email, password, degree, department, gradYear, rollNumber,
        isVerified: false, 
        emailVerificationOtp: otp,
        otpExpires: otpExpires
      });
    }

    // 3. DISPATCH EMAIL
    try {
      await sendEmail({
        email: user.email,
        subject: 'CampusMart - Verify Your College Email',
        message: `Hi ${user.name},\n\nYour CampusMart verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nWelcome to the network!`,
      });
      res.status(201).json({ message: 'Verification email sent' });
    } catch (emailError) {
      // Only delete the user if it was a brand new creation that failed
      if (!user.isVerified) await User.findByIdAndDelete(user._id); 
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
  } catch (emailError) {
      // --- ADD THIS LINE ---
      console.error("🚨 EMAIL SENDING FAILED. REASON:", emailError);
      // ---------------------
      if (!user.isVerified) await User.findByIdAndDelete(user._id); 
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid college email or password' });
    }

    // --- NEW SECURITY CHECK ---
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your college email before logging in.' });
    }
    // --------------------------

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id), // Send token ONLY if verified and password matches
      });
    } else {
      res.status(401).json({ message: 'Invalid college email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP and log user in
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User is already verified' });
    
    // Check if OTP matches and is not expired
    if (user.emailVerificationOtp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please register again.' });
    }

    // Success! Mark as verified and clear the OTP fields
    user.isVerified = true;
    user.emailVerificationOtp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Now give them the token to enter the app
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      gradYear: user.gradYear,
      rollNumber: user.rollNumber,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle saving an item (Favorite/Unfavorite)
// @route   POST /api/auth/save/:id
// @access  Private
const toggleSaveItem = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const itemId = req.params.itemId || req.params.id; 

    // 1. SAFETY CHECK: Ensure we actually received an ID from the frontend
    if (!itemId) {
      return res.status(400).json({ message: "No Item ID provided." });
    }

    // 2. DATABASE CLEANUP: Silently remove any 'null' or 'undefined' junk 
    // that got stuck in your database from our earlier bugs.
    user.savedItems = user.savedItems.filter(id => id != null);

    // 3. SECURE CHECK: Now it is 100% safe to run .toString()
    const isSaved = user.savedItems.some(id => id.toString() === itemId.toString());

    if (isSaved) {
      // UNSAVE ITEM
      user.savedItems = user.savedItems.filter(id => id.toString() !== itemId.toString());
    } else {
      // SAVE ITEM
      user.savedItems.push(itemId);

      // --- GENERATE NOTIFICATION ---
      const item = await Item.findById(itemId);
      if (item && item.seller && item.seller.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: item.seller,
          sender: req.user._id,
          item: item._id,
          type: 'ITEM_SAVED',
          message: `Someone just saved your ${item.title}!`
        });
      }
    }

    // Save the cleaned and updated array back to the database
    await user.save();
    res.status(200).json(user.savedItems);
    
  } catch (error) {
    console.error("💥 BACKEND CRASH IN SAVE ITEM:", error); 
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's saved items
// @route   GET /api/auth/saved
// @access  Private
const getSavedItems = async (req, res) => {
  try {
    // We populate the savedItems array, and then deeply populate the seller data inside those items
    const user = await User.findById(req.user._id).populate({
      path: 'savedItems',
      populate: {
        path: 'seller',
        select: 'name department gradYear'
      }
    });

    res.status(200).json(user.savedItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add or remove a keyword from user's wishlist
// @route   PUT /api/auth/wishlist
// @access  Private
const updateWishlist = async (req, res) => {
  try {
    const { keyword, action } = req.body; 
    
    if (!keyword) return res.status(400).json({ message: "Keyword is required" });

    const user = await User.findById(req.user._id);
    const cleanKeyword = keyword.toLowerCase().trim();

    if (action === 'add') {
      // Prevent duplicates
      if (!user.wishlist.includes(cleanKeyword)) {
        user.wishlist.push(cleanKeyword);
      }
    } else if (action === 'remove') {
      user.wishlist = user.wishlist.filter(k => k !== cleanKeyword);
    }

    await user.save();
    
    // Return the updated user profile without the password
    const updatedUser = await User.findById(req.user._id).select('-password');
    res.status(200).json(updatedUser);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    // 1. REMOVED gradYear and rollNumber from the allowed inputs
    const { bio, flairs, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Only update the safe, customizable fields
    if (bio !== undefined) user.bio = bio;
    if (flairs !== undefined) user.flairs = flairs;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    
    const updatedUser = await User.findById(req.user._id);
    res.status(200).json(updatedUser);
    
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Delete all items listed by this user
    await Item.deleteMany({ seller: userId });

    // 2. Delete all notifications tied to this user
    await Notification.deleteMany({ recipient: userId });

    // --- NEW: THE GHOST CHAT CLEANUP ---
    // A. Find all conversations this user was a part of
    const userChats = await Conversation.find({ participants: userId });
    const chatIds = userChats.map(chat => chat._id);

    // B. Delete every single message bubble inside those conversations
    await Message.deleteMany({ conversationId: { $in: chatIds } });

    // C. Delete the conversation documents themselves
    await Conversation.deleteMany({ participants: userId });
    // -----------------------------------

    // 3. Finally, delete the user account itself
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account and associated data permanently deleted." });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: "Failed to delete account." });
  }
};

module.exports = { registerUser, loginUser, updateProfile, toggleSaveItem, getSavedItems, verifyEmail, updateWishlist, deleteAccount };