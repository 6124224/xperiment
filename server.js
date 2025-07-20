const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active rooms and users
const rooms = new Map(); // { roomCode: { users: Set(), messages: [] } }
const users = new Map(); // { socketId: { username, roomCode } }

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to check if a room exists
app.get('/api/room/:code', (req, res) => {
  const roomCode = req.params.code;
  res.json({ exists: rooms.has(roomCode) });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Join a room (or create one)
  socket.on('join-room', (data) => {
    const { username, roomCode } = data;

    if (!username || username.trim() === '') {
      socket.emit('error', 'Username is required!');
      return;
    }

    let finalRoomCode = roomCode;

    // If no room code, generate a new one
    if (!finalRoomCode || finalRoomCode.trim() === '') {
      finalRoomCode = uuidv4().substring(0, 6).toUpperCase();
      rooms.set(finalRoomCode, {
        users: new Set(),
        messages: []
      });
    } else if (!rooms.has(finalRoomCode)) {
      socket.emit('error', 'Room does not exist!');
      return;
    }

    // Add user to room
    rooms.get(finalRoomCode).users.add(username);
    users.set(socket.id, { username, roomCode: finalRoomCode });

    // Join the Socket.io room
    socket.join(finalRoomCode);

    // Send room data to the new user
    socket.emit('room-joined', {
      roomCode: finalRoomCode,
      users: Array.from(rooms.get(finalRoomCode).users,
      messages: rooms.get(finalRoomCode).messages
    });

    // Notify others in the room
    socket.to(finalRoomCode).emit('user-joined', {
      username,
      users: Array.from(rooms.get(finalRoomCode).users)
    });
  });

  // Handle new messages
  socket.on('send-message', (message) => {
    const userData = users.get(socket.id);
    if (!userData) return;

    const { username, roomCode } = userData;
    const msgData = { username, message, timestamp: new Date().toISOString() };

    // Store message in room history
    rooms.get(roomCode).messages.push(msgData);

    // Broadcast to everyone in the room
    io.to(roomCode).emit('new-message', msgData);
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    const userData = users.get(socket.id);
    if (!userData) return;

    const { username, roomCode } = userData;
    users.delete(socket.id);

    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      room.users.delete(username);

      // Notify remaining users
      socket.to(roomCode).emit('user-left', {
        username,
        users: Array.from(room.users)
      });

      // Delete room if empty
      if (room.users.size === 0) {
        rooms.delete(roomCode);
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
