const Item = require('../models/Item');

class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    // Store actual matching titles here for fast retrieval
    this.words = new Set(); 
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    const cleanWord = word.toLowerCase().trim();
    
    for (let char of cleanWord) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
      // Store the full word at every node along the path for instant lookup
      node.words.add(cleanWord); 
    }
    node.isEndOfWord = true;
  }

  searchPrefix(prefix) {
    let node = this.root;
    const cleanPrefix = prefix.toLowerCase().trim();
    
    for (let char of cleanPrefix) {
      if (!node.children[char]) {
        return []; // Prefix not found
      }
      node = node.children[char];
    }
    
    // Convert the Set to an array and return the top 5 matches
    return Array.from(node.words).slice(0, 5); 
  }
}

// Create a global instance
const globalSearchTrie = new Trie();

// Function to pull all items from DB into RAM on server startup
const initializeSearchEngine = async () => {
  try {
    console.log("⚙️ Booting up In-Memory Search Engine...");
    const items = await Item.find({}).select('title category');
    
    items.forEach(item => {
      // Insert both the title and the category into the Trie
      globalSearchTrie.insert(item.title);
      globalSearchTrie.insert(item.category);
    });
    
    console.log(`✅ Search Engine Ready: Indexed ${items.length} marketplace items.`);
  } catch (error) {
    console.error("Failed to initialize Search Engine:", error);
  }
};

module.exports = { globalSearchTrie, initializeSearchEngine };