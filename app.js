// BACKEND
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// FRONTEND (Served as HTML)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chat App</title>
      <style>
        body { font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; }
        #chat { height: 300px; overflow-y: scroll; border: 1px solid #ddd; padding: 10px; }
        input, button { padding: 8px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <h1>Chat Rooms</h1>
      <div id="join">
        <input id="name" placeholder="Your Name">
        <input id="room" placeholder="Room Code (leave blank to create)">
        <button onclick="joinRoom()">Join</button>
      </div>
      <div id="chat" style="display:none">
        <div id="messages"></div>
        <input id="msg" placeholder="Type message...">
        <button onclick="sendMsg()">Send</button>
      </div>
      <script src="/socket.io/socket.io.js"></script>
      <script>
        let socket;
        function joinRoom() {
          const name = document.getElementById('name').value;
          const room = document.getElementById('room').value;
          if (!name) return alert('Enter name!');
          
          socket = io();
          socket.emit('join', { name, room });
          
          socket.on('joined', room => {
            document.getElementById('join').style.display = 'none';
            document.getElementById('chat').style.display = 'block';
            document.title = `Room: ${room}`;
          });
          
          socket.on('msg', msg => {
            document.getElementById('messages').innerHTML += `<div>${msg}</div>`;
          });
        }
        
        function sendMsg() {
          const msg = document.getElementById('msg').value;
          if (msg) socket.emit('msg', msg);
          document.getElementById('msg').value = '';
        }
      </script>
    </body>
    </html>
  `);
});

// CHAT LOGIC
const rooms = new Map();

io.on('connection', socket => {
  socket.on('join', ({ name, room }) => {
    room = room || uuidv4().slice(0, 6);
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(socket.id);
    
    socket.join(room);
    socket.emit('joined', room);
    io.to(room).emit('msg', `${name} joined!`);
    
    socket.on('msg', msg => {
      io.to(room).emit('msg', `${name}: ${msg}`);
    });
    
    socket.on('disconnect', () => {
      rooms.get(room).delete(socket.id);
      if (rooms.get(room).size === 0) rooms.delete(room);
      io.to(room).emit('msg', `${name} left!`);
    });
  });
});

// START SERVER
server.listen(3000, () => console.log('Running on http://localhost:3000'));
