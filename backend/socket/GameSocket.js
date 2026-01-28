const Room = require("../models/Room");
const Player = require("../models/Player");
const Game = require("../models/Game");
const { startRoundTimer, clearGameTimer } = require("../controllers/timers/roundTimer");
const { getRandomWords, createHint } = require("../controllers/map/wordUtils");

module.exports = (io) => {
  io.on("connection", (socket) => {
    // Import and attach all handlers
    require("../controllers/handlers/playerHandler")(io, socket);
    require("../controllers/handlers/gameStartHandler")(io, socket);
    require("../controllers/handlers/gameJoinHandler")(io, socket);
    require("../controllers/handlers/wordChoiceHandler")(io, socket);
    require("../controllers/handlers/drawingHandler")(io, socket);
    require("../controllers/handlers/disconnectHandler")(io, socket);
  });
};