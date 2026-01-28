const Game = require("../../models/Game");
const { createHint } = require("../map/wordUtils");
const { startRoundTimer } = require("../timers/roundTimer");

module.exports = (io, socket) => {
  // ---------------------------------------
  // GAME: choose word (drawer only)
  // ---------------------------------------
  socket.on("game:chooseWord", async ({ gameId, word }) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) return;

      if (game.currentDrawer.toString() !== socket.playerId) {
        console.log("Not your turn to choose word");
        return;
      }

      if (game.gameStatus !== "choosing_word") {
        console.log("Game is not in choosing_word state");
        return;
      }

      game.currentWord = word;
      game.turnStartTime = new Date();
      game.gameStatus = "playing";
      await game.save();

      const hint = createHint(word);

      // drawer sees full word
      io.to(socket.id).emit("game:wordChosen", {
        hint: word,
        timeLeft: game.drawTime,
      });

      // others see blanks
      socket.to(gameId).emit("game:wordChosen", {
        hint,
        timeLeft: game.drawTime,
      });

      // start timer
      startRoundTimer(io, gameId, game.drawTime);
      console.log(`Word "${word}" chosen for game ${gameId}`);
    } catch (error) {
      console.error("Error choosing word:", error);
    }
  });
};