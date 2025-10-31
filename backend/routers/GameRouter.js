const GameRouter = require('express').Router();
const Room = require('../models/Room');
const Player = require('../models/Player');

// Create room - creator is automatically added as first player
GameRouter.post('/createroom', async (req, res) => {
  const { roomName, drawTime, totalRounds, creatorNickname } = req.body;
  
  // Validation
  if (!roomName || !drawTime || !totalRounds || !creatorNickname) {
    return res.status(400).json({
      success: false,
      message: 'Please provide roomName, drawTime, totalRounds, and creatorNickname'
    });
  }

  try {
    // Generate unique room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create creator as a player (temporary socketId, will be updated when they connect)
    const creator = new Player({
      nickname: creatorNickname,
      socketId: 'temp-' + Date.now(), // Temporary, will be updated on socket connection
      isCreator: true
    });
    await creator.save();

    // Create room with creator as first player
    const newRoom = new Room({
      roomCode,
      roomName,
      drawTime,
      totalRounds,
      players: [creator._id],
      scores: [{
        playerId: creator._id,
        totalScore: 0
      }]
    });

    await newRoom.save();
    
    return res.status(201).json({
      success: true,
      roomCode: roomCode,
      playerId: creator._id,
      message: 'Room created successfully'
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Join room
GameRouter.post('/joinroom', async (req, res) => {
  const { roomCode, nickname } = req.body;

  // Validation
  if (!roomCode || !nickname) {
    return res.status(400).json({
      success: false,
      message: 'Please provide roomCode and nickname'
    });
  }

  try {
    // Find room
    const room = await Room.findOne({ roomCode }).populate('players');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if room is full
    if (room.players.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    // Check if game already started
    if (room.gameStatus !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Game already in progress'
      });
    }

    // Create new player
    const newPlayer = new Player({
      nickname,
      socketId: 'temp-' + Date.now(), // Temporary, will be updated on socket connection
      isCreator: false
    });
    await newPlayer.save();

    // Add player to room
    room.players.push(newPlayer._id);
    room.scores.push({
      playerId: newPlayer._id,
      totalScore: 0
    });
    await room.save();

    return res.status(200).json({
      success: true,
      playerId: newPlayer._id,
      room: {
        roomCode: room.roomCode,
        roomName: room.roomName,
        drawTime: room.drawTime,
        totalRounds: room.totalRounds,
        playerCount: room.players.length
      },
      message: 'Joined room successfully'
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

module.exports = GameRouter;