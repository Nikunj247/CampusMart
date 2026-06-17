const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Node.js automatically lowercases headers, so we check for 'authorization'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Split "Bearer [token]" and grab just the token
      token = req.headers.authorization.split(' ')[1];

      // Verify token matches your JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user and attach it to the request (minus the password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };