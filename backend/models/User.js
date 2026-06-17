const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- ADDED BCRYPT

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    degree: { type: String, required: true },
    department: { type: String, required: true },
    gradYear: { type: Number, required: true },
    rollNumber: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    emailVerificationOtp: { type: String },
    otpExpires: { type: Date },
    savedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    wishlist: [{ type: String, lowercase: true, trim: true }],
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    flairs: { type: [String], default: ['Active Member'] }
  },
  {
    timestamps: true,
  }
);

// --- THE ENCRYPTION ENGINE ---
// This runs automatically right before user.save() or User.create()
userSchema.pre('save', async function () {
  // If the password wasn't modified (like during OTP verification), skip this step!
  if (!this.isModified('password')) {
    return; // <-- FIX: Use 'return' instead of 'next()' for modern async hooks
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;