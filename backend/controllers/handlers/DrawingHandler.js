const Game = require("../../models/Game");

module.exports = (io, socket) => {
  // ---------------------------------------
  // DRAWING: broadcast drawing data
  // ---------------------------------------
  socket.on("draw:start", async ({ gameId, x, y, color, lineWidth }) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) return;

      // Only the current drawer can draw
      if (game.currentDrawer.toString() !== socket.playerId) {
        console.log("Only the drawer can draw");
        return;
      }

      // Broadcast to all other players in the game
      socket.to(gameId).emit("draw:start", { x, y, color, lineWidth });
    } catch (error) {
      console.error("Error handling draw:start:", error);
    }
  });

  socket.on("draw:move", async ({ gameId, x, y, color, lineWidth }) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) return;

      // Only the current drawer can draw
      if (game.currentDrawer.toString() !== socket.playerId) {
        return;
      }

      // Broadcast to all other players in the game
      socket.to(gameId).emit("draw:move", { x, y, color, lineWidth });
    } catch (error) {
      console.error("Error handling draw:move:", error);
    }
  });

  socket.on("draw:end", async ({ gameId }) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) return;

      // Only the current drawer can draw
      if (game.currentDrawer.toString() !== socket.playerId) {
        return;
      }

      // Broadcast to all other players in the game
      socket.to(gameId).emit("draw:end");
    } catch (error) {
      console.error("Error handling draw:end:", error);
    }
  });

  // ---------------------------------------
  // DRAWING: clear canvas
  // ---------------------------------------
  socket.on("draw:clear", async ({ gameId }) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) return;

      // Only the current drawer can clear
      if (game.currentDrawer.toString() !== socket.playerId) {
        console.log("Only the drawer can clear the canvas");
        return;
      }

      // Broadcast to all players including sender
      io.to(gameId).emit("draw:clear");
      console.log(`Canvas cleared for game ${gameId}`);
    } catch (error) {
      console.error("Error handling draw:clear:", error);
    }
  });

  // ---------------------------------------
  // DRAWING: undo last stroke
  // ---------------------------------------
  socket.on("draw:undo", async ({ gameId }) => {
    try {
      const game = await Game.findById(gameId);
      if (!game) return;

      // Only the current drawer can undo
      if (game.currentDrawer.toString() !== socket.playerId) {
        console.log("Only the drawer can undo");
        return;
      }

      // Broadcast to all players including sender
      io.to(gameId).emit("draw:undo");
      console.log(`Undo stroke for game ${gameId}`);
    } catch (error) {
      console.error("Error handling draw:undo:", error);
    }
  });
};