const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    match: /^[A-Za-z0-9]{6}$/ 
  },
  roomName: {
    type: String,
    required: true
  },
  drawTime: {
    type: Number,
    required: true
  },
  totalRounds: {
    type: Number,
    required: true
  },
  currentRound: {
    type: Number,
    default: 1
  },
  gameStatus: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  players: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }],
    validate: {
      validator: function (val) {
        return val.length <= 5;  // ✅ Now validates the array length
      },
      message: 'A room cannot have more than 5 players.'
    }
  },
  scores: [{
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    totalScore: {
      type: Number,
      default: 0
    }
  }]
});

module.exports = mongoose.model('Room', roomSchema);