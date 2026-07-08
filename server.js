const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/code-editor')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Room Schema
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  code: { type: String, default: '// Start coding here...\n' },
  language: { type: String, default: 'javascript' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', roomSchema);

// Active rooms in memory
const activeRooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', async (roomId, username) => {
    socket.join(roomId);
    socket.username = username || 'Anonymous';
    socket.roomId = roomId;

    // Initialize room in memory if not exists
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, {
        users: new Map(),
        code: '// Start coding here...\n',
        language: 'javascript'
      });
    }

    const room = activeRooms.get(roomId);
    room.users.set(socket.id, {
      id: socket.id,
      username: socket.username,
      cursor: { lineNumber: 1, column: 1 }
    });

    // Notify others in room
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      username: socket.username
    });

    // Send current room state to new user
    socket.emit('room-state', {
      code: room.code,
      language: room.language,
      users: Array.from(room.users.values())
    });

    console.log(`👤 ${username} joined room: ${roomId}`);
  });

  // Handle code changes
  socket.on('code-change', (data) => {
    const room = activeRooms.get(socket.roomId);
    if (room) {
      room.code = data.code;
      room.language = data.language || room.language;

      // Broadcast to all other users in room
      socket.to(socket.roomId).emit('code-update', {
        code: data.code,
        language: room.language,
        changedBy: socket.username,
        cursor: data.cursor
      });
    }
  });

  // Handle cursor movement
  socket.on('cursor-move', (position) => {
    const room = activeRooms.get(socket.roomId);
    if (room && room.users.has(socket.id)) {
      room.users.get(socket.id).cursor = position;
      socket.to(socket.roomId).emit('cursor-update', {
        userId: socket.id,
        username: socket.username,
        position: position
      });
    }
  });

  // Handle language change
  socket.on('language-change', (language) => {
    const room = activeRooms.get(socket.roomId);
    if (room) {
      room.language = language;
      socket.to(socket.roomId).emit('language-update', language);
    }
  });

  // Handle typing indicator
  socket.on('typing', () => {
    socket.to(socket.roomId).emit('user-typing', socket.username);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const room = activeRooms.get(socket.roomId);
    if (room) {
      room.users.delete(socket.id);
      socket.to(socket.roomId).emit('user-left', socket.id);

      // Clean up empty rooms
      if (room.users.size === 0) {
        activeRooms.delete(socket.roomId);
      }
    }
    console.log(`👤 User disconnected: ${socket.id}`);
  });
});

// REST API Routes
app.post('/api/rooms', async (req, res) => {
  try {
    const roomId = uuidv4().substring(0, 8);
    const room = new Room({ roomId });
    await room.save();
    res.json({ roomId, url: `/room/${roomId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rooms/:roomId', async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId },
      { code: req.body.code, language: req.body.language, updatedAt: Date.now() },
      { new: true }
    );
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', activeRooms: activeRooms.size });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
