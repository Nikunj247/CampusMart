const Item = require('../models/Item'); //[cite: 8]
const runMatchmaker = require('../utils/matchmaker'); //[cite: 8]
const { globalSearchTrie } = require('../utils/searchEngine'); //[cite: 8]

// @desc    Create a new listing
// @route   POST /api/items
// @access  Private (Requires Token)
const createItem = async (req, res) => { //[cite: 8]
  try {
    const { title, description, price, category, condition, images, meetupLocation } = req.body; //[cite: 8]

    if (!title || !description || !price || !category || !condition || !meetupLocation) { //[cite: 8]
      return res.status(400).json({ message: 'Please provide all required fields' }); //[cite: 8]
    }

    const item = await Item.create({ //[cite: 8]
      seller: req.user._id, //[cite: 8]
      title, //[cite: 8]
      description, //[cite: 8]
      price, //[cite: 8]
      category, //[cite: 8]
      condition, //[cite: 8]
      images: images || [],  //[cite: 8]
      meetupLocation, //[cite: 8]
    });

    const io = req.app.get('io'); //[cite: 8]
    
    // FIX: Inject both title and category into the Trie instantly
    globalSearchTrie.insert(item.title); //[cite: 8]
    globalSearchTrie.insert(item.category);
    
    runMatchmaker(item, io); //[cite: 8]

    res.status(201).json(item); //[cite: 8]
  } catch (error) {
    res.status(500).json({ message: error.message }); //[cite: 8]
  }
};

// @desc    Fetch all items (with Search, Category filters, and Cursor Pagination)
const getItems = async (req, res) => {
  try {
    const { keyword, category, cursor } = req.query;
    
    let query = {};

    if (keyword) {
      query.title = { $regex: keyword, $options: 'i' }; 
    }

    if (category && category !== 'All Categories' && category !== '') {
      query.category = category;
    }

    // --- CURSOR PAGINATION LOGIC ---
    // If a cursor is provided, only find items older (less than) that specific ID
    if (cursor) {
      query._id = { $lt: cursor }; 
    }

    // Limit to 12 items per request
    const LIMIT = 12;

    const items = await Item.find(query)
      .populate('seller', 'name department gradYear')
      .sort({ _id: -1 }) // Sort by newest first
      .limit(LIMIT);

    // Determine the next cursor to send to the frontend
    const nextCursor = items.length === LIMIT ? items[items.length - 1]._id : null;

    // Send back the items AND the cursor for the next page
    res.status(200).json({
      items,
      nextCursor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single item by ID (Product Detail Page)
// @route   GET /api/items/:id
// @access  Private
const getItemById = async (req, res) => { //[cite: 8]
  try {
    const item = await Item.findById(req.params.id) //[cite: 8]
      .populate('seller', 'name gradYear department createdAt'); //[cite: 8]

    if (!item) { //[cite: 8]
      return res.status(404).json({ message: 'Item not found' }); //[cite: 8]
    }

    res.status(200).json(item); //[cite: 8]
  } catch (error) {
    if (error.kind === 'ObjectId') { //[cite: 8]
      return res.status(404).json({ message: 'Item not found' }); //[cite: 8]
    }
    res.status(500).json({ message: error.message }); //[cite: 8]
  }
};

const getMyItems = async (req, res) => { //[cite: 8]
  try {
    const items = await Item.find({ seller: req.user._id }).sort({ createdAt: -1 }); //[cite: 8]
    res.status(200).json(items); //[cite: 8]
  } catch (error) {
    res.status(500).json({ message: error.message }); //[cite: 8]
  }
};

const deleteItem = async (req, res) => { //[cite: 8]
  try {
    const item = await Item.findById(req.params.id); //[cite: 8]

    if (!item) { //[cite: 8]
      return res.status(404).json({ message: 'Item not found' }); //[cite: 8]
    }

    if (item.seller.toString() !== req.user._id.toString()) { //[cite: 8]
      return res.status(401).json({ message: 'User not authorized to delete this item' }); //[cite: 8]
    }

    await item.deleteOne(); //[cite: 8]
    
    res.status(200).json({ message: 'Item removed successfully' }); //[cite: 8]
  } catch (error) {
    res.status(500).json({ message: error.message }); //[cite: 8]
  }
};

module.exports = { //[cite: 8]
  createItem, //[cite: 8]
  getItems, //[cite: 8]
  getItemById, //[cite: 8]
  getMyItems, //[cite: 8]
  deleteItem, //[cite: 8]
};