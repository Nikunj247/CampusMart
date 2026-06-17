const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, itemId, text } = req.body;
    const senderId = req.user._id;

    // 1. Check if a conversation already exists between these two for this item
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      item: itemId,
    });

    // 2. If no conversation exists, create a new one
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        item: itemId,
      });
    }

    // 3. Create the actual message bubble
    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      text,
    });

    // 4. Update the Conversation's "lastMessage" so the inbox looks updated
    conversation.lastMessage = {
      text: text,
      sender: senderId,
    };
    await conversation.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all messages for a specific conversation (The Chat Room)
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Fetch all message bubbles for this chat
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 }); // Oldest to newest (top to bottom reading)

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all messages in a conversation as read
// @route   PUT /api/messages/:conversationId/read
// @access  Private
const markConversationAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversationId: req.params.conversationId,
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

// @desc    Toggle Archive status for a conversation
// @route   PUT /api/messages/:conversationId/archive
const toggleArchiveChat = async (req, res) => {
  try {
    const chat = await Conversation.findById(req.params.conversationId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const userId = req.user._id.toString(); // Assuming you have an auth middleware
    const isArchived = chat.archivedBy.includes(userId);

    if (isArchived) {
      // Unarchive: Remove user ID from array
      chat.archivedBy = chat.archivedBy.filter(id => id.toString() !== userId);
    } else {
      // Archive: Add user ID to array
      chat.archivedBy.push(userId);
    }

    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get or Create an empty conversation (for the Message Seller button)
// @route   POST /api/messages/conversation
const getOrCreateConversation = async (req, res) => {
  try {
    // 1. Accept the new itemTitle from the frontend
    const { itemId, sellerId, itemTitle } = req.body; 
    const buyerId = req.user._id;

    let conversation = await Conversation.findOne({
      item: itemId,
      participants: { $all: [buyerId, sellerId] }
    })
    .populate('participants', 'name')
    .populate('item', 'title');

    let isNew = false;

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [buyerId, sellerId],
        item: itemId,
        itemName: itemTitle // 2. THE FIX: Save the permanent snapshot here!
      });
      
      conversation = await conversation.populate('participants', 'name');
      // No need to populate item here since it might be null later anyway, but we do it for consistency
      conversation = await conversation.populate('item', 'title');
      isNew = true;
    }

    res.status(200).json({ conversation, isNew });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all conversations for the logged-in user (The Inbox)
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: { $in: [userId] },
      deletedBy: { $ne: userId } // THE FIX: Hide chats you deleted
    })
      .populate('participants', 'name department gradYear avatar')
      .populate('item', 'title price images')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get total unread chats count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Find active chats (not archived or deleted by this user)
    const activeChats = await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId },
      deletedBy: { $ne: userId }
    }).select('_id');

    const activeChatIds = activeChats.map(chat => chat._id);

    // 2. THE FIX: Find distinct conversation IDs instead of counting total messages
    const unreadConversations = await Message.distinct('conversationId', {
      conversationId: { $in: activeChatIds },
      sender: { $ne: userId },
      isRead: false
    });

    // 3. Return the length of the array (number of unread chats)
    res.status(200).json({ count: unreadConversations.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft-delete a conversation for one user
// @route   DELETE /api/messages/:conversationId
const deleteChat = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const chat = await Conversation.findById(conversationId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Add user to deletedBy array
    if (!chat.deletedBy.includes(userId)) {
      chat.deletedBy.push(userId);
    }

    // If BOTH users have deleted it, we can destroy the database records permanently
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

// Don't forget to export it!
module.exports = { sendMessage, getConversations, getMessages, getUnreadCount, markConversationAsRead, toggleArchiveChat, getOrCreateConversation, deleteChat };