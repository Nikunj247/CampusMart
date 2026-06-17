const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary and return the URL
// @access  Private (Only logged-in students can upload)
router.post('/', upload.single('image'), (req, res) => {
  try {
    // req.file is created by Multer. The Cloudinary URL is stored in req.file.path
    res.status(200).json({ 
      message: 'Image uploaded successfully',
      imageUrl: req.file.path 
    });
  } catch (error) {
    res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
});

module.exports = router;