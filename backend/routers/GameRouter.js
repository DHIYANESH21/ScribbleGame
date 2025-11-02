// routes/GameRouter.js
const express = require('express');
const GameRouter = express.Router();
const { createGame, joinGame } = require('../controllers/JoiningGame.js');

GameRouter.post('/createroom', createGame);
GameRouter.post('/joinroom', joinGame);

module.exports = GameRouter;
