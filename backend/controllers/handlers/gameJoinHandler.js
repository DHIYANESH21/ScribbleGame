const Game = require("../../models/Game");
const { getRandomWords } = require("../map/wordUtils");

module.exports = (io, socket) => {
  // ---------------------------------------
  // GAME: join
  // ---------------------------------------
  socket.on("game:join", async ({ gameId, playerId }) => {
    try {
      const game = await Game.findById(gameId).populate("turnOrder");
      if (!game) {
        console.error("Game not found");
        return;
      }

      socket.join(gameId); // ✅ game room is gameId

      io.to(socket.id).emit("game:state", {
        currentRound: game.currentRound,
        totalRounds: game.totalRounds,
        currentDrawer: game.currentDrawer.toString(),
        gameStatus: game.gameStatus,
        players: game.turnOrder, // populated player docs
      });

      // send word choices to the drawer only
      if (
        game.gameStatus === "choosing_word" &&
        game.currentDrawer.toString() === playerId
      ) {
        const words = getRandomWords(3);
        io.to(socket.id).emit("game:wordChoices", { words });
      }

      console.log(`Player ${playerId} joined game ${gameId}`);
    } catch (error) {
      console.error("Error joining game:", error);
    }
  });
};