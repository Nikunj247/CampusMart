const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('./sendEmail'); // IMPORT YOUR EXISTING MAILER

// --- NEW: Utility to prevent Regex crashes from special chars like "C++" ---
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const runMatchmaker = async (newItem, io) => {
  try {
    const itemText = `${newItem.title} ${newItem.category} ${newItem.description || ''}`.toLowerCase();

    const potentialUsers = await User.find({
      _id: { $ne: newItem.seller },
      'wishlist.0': { $exists: true } 
    });

    // 3. THE SMART FILTER: Tokenized Word Boundary Match
    const matchedUsers = potentialUsers.filter(user => {
      return user.wishlist.some(tag => {
        // Step A: Split the user's tag into individual words
        const tagWords = tag.toLowerCase().trim().split(/\s+/);

        // Step B: Ensure EVERY word exists
        return tagWords.every(word => {
          // --- FIX: Escape the word before creating the RegExp ---
          const safeWord = escapeRegex(word);
          const regex = new RegExp(`\\b${safeWord}\\b`, 'i');
          return regex.test(itemText);
        });
      });
    });

    if (matchedUsers.length === 0) return;

    // 1. Generate In-App Notifications
    const notifications = matchedUsers.map(user => ({
      recipient: user._id,
      sender: newItem.seller, 
      item: newItem._id,
      type: 'WISHLIST_MATCH',
      message: `Matchmaker: Someone just listed a "${newItem.title}" which matches your alerts!`
    }));

    await Notification.insertMany(notifications);
    console.log(`🤖 Matchmaker: Found ${matchedUsers.length} matches for ${newItem.title}`);

    // 2. Fire Sockets & Emails Concurrently
    await Promise.all(matchedUsers.map(async (user) => {
      
      // -- LIVE SOCKET TRIGGER --
      if (io) {
        io.in(user._id.toString()).emit('new notification');
      }

      // -- PREMIUM EMAIL TRIGGER --
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #111827;">🎉 CampusMart Matchmaker Alert!</h2>
          <p style="color: #4B5563; font-size: 16px;">Hi ${user.name},</p>
          <p style="color: #4B5563; font-size: 16px;">Great news! Someone just listed an item that matches your wishlist alerts.</p>
          
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #111827;">${newItem.title}</h3>
            <p style="margin: 0; color: #059669; font-weight: bold; font-size: 18px;">₹${newItem.price}</p>
            <p style="margin: 10px 0 0 0; color: #6B7280; font-size: 14px;">Condition: ${newItem.condition}</p>
          </div>

          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/product/${newItem._id}" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Item & Message Seller
          </a>
          
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            You are receiving this because you added a keyword to your Smart Matchmaker on CampusMart.<br>
            To stop these alerts, remove the keyword from your profile.
          </p>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject: `[CampusMart] Match Found: ${newItem.title}`,
        message: `Matchmaker Alert: Someone just listed a "${newItem.title}" for ₹${newItem.price}! Log in to CampusMart to view it.`,
        html: emailHTML
      });

    }));

    console.log(`✉️ Matchmaker: Successfully processed all alerts and emails.`);

  } catch (error) {
    console.error("Matchmaker Daemon Failed:", error);
  }
};

module.exports = runMatchmaker;