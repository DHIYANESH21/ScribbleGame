const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  
  // Game progress tracking
  currentRound: {
    type: Number,
    default: 1
  },
  
  totalRounds: {
    type: Number,
    default: 3
  },
  
  // Turn management
  turnOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  
  currentTurnIndex: {
    type: Number,
    default: 0
  },
  
  currentDrawer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  // Word & Timer
  currentWord: {
    type: String,
    default: null
  },
  
  drawTime: {
    type: Number,
    default: 80 // seconds
  },
  
  turnStartTime: {
    type: Date,
    default: null
  },
  
  // Game status
  gameStatus: {
    type: String,
    enum: ['waiting', 'choosing_word', 'playing', 'round_end', 'game_over'],
    default: 'waiting'
  },
  
  // Scores (track throughout game)
  scores: {
    type: Map,
    of: Number,
    default: {}
  }
  
}, { timestamps: true });

// Helper method to get current drawer
GameSchema.methods.getCurrentDrawer = function() {
  return this.turnOrder[this.currentTurnIndex];
};

// Helper method to move to next turn
GameSchema.methods.nextTurn = function() {
  this.currentTurnIndex++;
  
  // If all players have drawn, increment round
  if (this.currentTurnIndex >= this.turnOrder.length) {
    this.currentTurnIndex = 0;
    this.currentRound++;
  }
  
  this.currentDrawer = this.getCurrentDrawer();
  this.currentWord = null;
  this.turnStartTime = null;
  this.gameStatus = 'choosing_word';
};

// Check if game is complete
GameSchema.methods.isGameComplete = function() {
  return this.currentRound > this.totalRounds;
};

module.exports = mongoose.model('Game', GameSchema);