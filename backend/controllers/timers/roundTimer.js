const Game = require("../../models/Game");
const { getRandomWords } = require("../map/wordUtils");

// ✅ keep timers per gameId so you don't duplicate timers
const activeTimers = new Map();

// ---------------------------------------
// TIMER (per game)
// ---------------------------------------
function startRoundTimer(io, gameId, duration) {
  let timeLeft = duration;

  // clear existing timer if any
  if (activeTimers.has(gameId)) {
    clearInterval(activeTimers.get(gameId));
    activeTimers.delete(gameId);
  }

  const timer = setInterval(async () => {
    timeLeft--;

    io.to(gameId).emit("game:timerUpdate", { timeLeft });

    if (timeLeft <= 0) {
      clearInterval(timer);
      activeTimers.delete(gameId);

      try {
        const game = await Game.findById(gameId).populate("turnOrder currentDrawer");
        if (!game) return;

        game.gameStatus = "round_end";
        await game.save();

        io.to(gameId).emit("game:roundEnd", {
          word: game.currentWord,
          scores: Object.fromEntries(game.scores || new Map()),
          nextDrawer: null,
        });

        // small delay, then next turn or game over
        setTimeout(async () => {
          // ✅ Check if game is complete BEFORE moving to next turn
          if (typeof game.isGameComplete === "function" && game.isGameComplete()) {
            game.gameStatus = "game_over";
            await game.save();

            const winner = game.turnOrder.reduce((prev, current) => {
              const prevScore = (game.scores && game.scores.get(prev._id.toString())) || 0;
              const currScore = (game.scores && game.scores.get(current._id.toString())) || 0;
              return currScore > prevScore ? current : prev;
            });

            io.to(gameId).emit("game:over", {
              finalScores: Object.fromEntries(game.scores || new Map()),
              winner,
            });

            console.log(`Game ${gameId} over. Winner: ${winner?.nickname}`);
          } else {
            // ✅ Move to next turn
            if (typeof game.nextTurn === "function") {
              game.nextTurn();
            }
            
            await game.save();

            // ✅ RE-POPULATE turnOrder after nextTurn() to get fresh socketIds
            await game.populate("turnOrder currentDrawer");

            // ✅ Emit updated game state to all players
            io.to(gameId).emit("game:state", {
              currentRound: game.currentRound,
              totalRounds: game.totalRounds,
              currentDrawer: game.currentDrawer._id.toString(),
              gameStatus: game.gameStatus,
              players: game.turnOrder,
            });

            // ✅ Send word choices to the NEW drawer
            const newDrawer = game.turnOrder.find(
              (p) => p._id.toString() === game.currentDrawer._id.toString()
            );

            if (newDrawer && newDrawer.socketId) {
              const words = getRandomWords(3);
              console.log(`Sending word choices to ${newDrawer.nickname} (${newDrawer.socketId})`);
              io.to(newDrawer.socketId).emit("game:wordChoices", { words });
            } else {
              console.error("New drawer not found or has no socketId:", newDrawer);
            }

            console.log(`Starting round ${game.currentRound} for game ${gameId}, drawer: ${newDrawer?.nickname}`);
          }
        }, 3000);
      } catch (error) {
        console.error("Error ending round:", error);
      }
    }
  }, 1000);

  activeTimers.set(gameId, timer);
}

function clearGameTimer(gameId) {
  if (activeTimers.has(gameId)) {
    clearInterval(activeTimers.get(gameId));
    activeTimers.delete(gameId);
  }
}

module.exports = {
  startRoundTimer,
  clearGameTimer,
};