const Room = require("../../models/Room");
const Game = require("../../models/Game");

module.exports = (io, socket) => {
  // ---------------------------------------
  // GAME: start by host
  // ---------------------------------------
  socket.on("game:start", async ({ roomCode }) => {
    try {
      // ❌ was .populate("Players")
      const room = await Room.findOne({ roomCode }).populate("players"); // ✅ correct

      if (!room) {
        console.error("Room not found");
        return;
      }

      // ✅ verify host (need populated players to read isCreator)
      const host = room.players.find(
        (p) => p._id.toString() === socket.playerId
      );
      if (!host || !host.isCreator) {
        console.log("Only host can start the game");
        return;
      }

      // ✅ random turn order (shuffle a copy)
      const turnOrderDocs = [...room.players].sort(() => Math.random() - 0.5);

      // ✅ create Game
      const game = await Game.create({
        roomId: room._id,
        totalRounds: room.totalRounds, // make sure these exist on Room schema
        turnOrder: turnOrderDocs.map((p) => p._id),
        currentTurnIndex: 0,
        drawTime: room.drawTime || 60,
        currentDrawer: turnOrderDocs[0]._id,
        gameStatus: "choosing_word",
        // scores: new Map() // if your schema needs init
      });

      room.gameStatus = "in-progress";
      await room.save();

      io.to(room._id.toString()).emit("game:started", {
        gameId: game._id,
        drawer: {
          _id: turnOrderDocs[0]._id,
          nickname: turnOrderDocs[0].nickname,
          isCreator: turnOrderDocs[0].isCreator,
        },
      });
    } catch (error) {
      console.error("Error starting game:", error);
    }
  });
};