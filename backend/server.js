const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const http = require('http'); 
const { Server } = require('socket.io'); 
const { initializeSearchEngine } = require('./utils/searchEngine');
// const { apiLimiter } = require('./middleware/rateLimiter'); // Limiter successfully disabled

// Load env vars
dotenv.config();

// 1. Trigger the connection process
connectDB();

// 2. Wait for MongoDB to explicitly say "I am open" before pulling the data
mongoose.connection.once('open', () => {
  console.log('📦 MongoDB connection confirmed. Firing up the Search Engine...');
  initializeSearchEngine();
});

const app = express();

// Wrap Express with HTTP Server
const server = http.createServer(app);

// --- NEW: Dynamic CORS Configuration ---
// This uses your production URL if deployed, or localhost if you are testing on your machine.
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

// Initialize Socket.io and allow CORS
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"], // explicitly allow these methods
    credentials: true // required if you ever use cookies/sessions
  },
});

app.set('io', io);

// Middleware
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// --- API ROUTES ---
// REMOVED the broken app.use('/api'); line here
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// --- REAL-TIME SOCKET LOGIC ---
io.on('connection', (socket) => {
  console.log(`User connected to WebSockets: ${socket.id}`);

  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log(`User Joined Room: ${room}`);
  });

  socket.on('new message', (newMessageRecieved) => {
    let chat = newMessageRecieved.conversation;

    if (!chat.participants) return console.log('chat.participants not defined');

    chat.participants.forEach((user) => {
      if (user._id === newMessageRecieved.sender._id) return;
      socket.in(user._id).emit('message recieved', newMessageRecieved);
    });
  });

  socket.on('send notification', (recipientId) => {
    socket.in(recipientId).emit('new notification');
  });

  socket.on('disconnect', () => {
    console.log('USER DISCONNECTED');
  });
});

app.get('/', (req, res) => {
  res.send('CampusMart Backend API + WebSockets running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});