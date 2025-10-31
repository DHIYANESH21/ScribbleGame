const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config(); 
const GameRouter = require('./routers/GameRouter.js');
const cors = require("cors");

const app = express();
const httpserver = http.createServer(app);

const io = new Server(httpserver, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/scribbleDB";

mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => console.error("❌ MongoDB connection error:", err));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

app.use(express.json());
app.use(cors());
app.use('/api/games', GameRouter);

app.get('/', (req, res) => {
  res.send('Scribble backend is running!');
});

httpserver.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { io };