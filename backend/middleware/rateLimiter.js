const rateLimit = require('express-rate-limit');

// General API Limiter (Standard Protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Strict Limiter (For Auth)
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { message: 'Security trigger: Too many attempts. Please try again in an hour.' }
});

// NEW: Item Creation Limiter (Stop spam-uploading products)
const itemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 items per 15 minutes
  message: { message: 'You are posting too fast! Please wait a few minutes before listing another item.' }
});

// NEW: Chat Spam Limiter (Allow fast typing, block inhuman script spam)
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Max 1 message per second average
  message: { message: 'Whoa, slow down! You are sending messages too quickly.' }
});

module.exports = { apiLimiter, strictLimiter, itemLimiter, messageLimiter };