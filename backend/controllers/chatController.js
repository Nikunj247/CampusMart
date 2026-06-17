const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Create or fetch an existing conversation
// @route   POST /api/chat
const accessChat = async (req, res) => {
  const { userId, itemId } = req.body; // userId = The person you want to message

  if (!userId || !itemId) {
    return res.status(400).json({ message: 'Missing user or item ID' });
  }

  try {
    // Check if a chat already exists between these two users for this specific item
    let chat = await Conversation.findOne({
      item: itemId,
      participants: { $all: [req.user._id, userId] }
    }).populate('participants', '-password').populate('item');

    if (chat) {
      return res.status(200).json(chat);
    }

    // If no chat exists, create a new one
    const newChat = await Conversation.create({
      participants: [req.user._id, userId],
      item: itemId
    });

    const fullChat = await Conversation.findById(newChat._id)
      .populate('participants', '-password')
      .populate('item');

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all conversations for a user (For the Inbox Sidebar)
// @route   GET /api/chat
const getChats = async (req, res) => {
  try {
    const chats = await Conversation.find({ 
      participants: req.user._id,
      deletedBy: { $ne: req.user._id } // THE FIX: Hide chats you deleted
    })
      .populate('participants', '-password')
      .populate('item')
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all messages for a specific conversation
// @route   GET /api/chat/:chatId/messages
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.chatId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 }); // Oldest to newest
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  const { conversationId, text, isOffer, offerAmount } = req.body;

  try {
    // 1. Save the message
    const message = await Message.create({
      conversationId,
      sender: req.user._id, // Attached by auth middleware
      text,
      isOffer: isOffer || false,
      offerAmount
    });

    // 2. Update the "last message" snippet on the Conversation for the sidebar
    await Conversation.findByIdAndUpdate(conversationId, { 
      lastMessage: text || `New Offer: ₹${offerAmount}` 
    });

    // 3. Populate the sender name so the frontend knows who sent it
    const populatedMessage = await message.populate('sender', 'name');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all messages in a conversation as read
// @route   PUT /api/chat/:chatId/read
const markConversationAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversationId: req.params.chatId,
        sender: { $ne: req.user._id }, // Only mark messages sent BY the OTHER person as read
        isRead: false
      },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft-delete a conversation for one user
// @route   DELETE /api/chat/:chatId
const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Conversation.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Add user to deletedBy array
    if (!chat.deletedBy.includes(userId)) {
      chat.deletedBy.push(userId);
    }

    // If BOTH users have deleted it, destroy the database records permanently
    if (chat.deletedBy.length === chat.participants.length) {
      await Message.deleteMany({ conversationId: chat._id });
      await Conversation.findByIdAndDelete(chat._id);
      return res.status(200).json({ message: "Chat permanently deleted." });
    }

    await chat.save();
    res.status(200).json({ message: "Chat removed from your inbox." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { accessChat, getChats, getMessages, sendMessage, deleteChat, markConversationAsRead };