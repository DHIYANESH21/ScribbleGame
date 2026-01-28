const Player = require("../../models/Player");
const Room = require("../../models/Room");

module.exports = (io, socket) => {
  // ---------------------------------------
  // DISCONNECT
  // ---------------------------------------
  socket.on("disconnect", async () => {
    try {
      const player = await Player.findOne({ socketId: socket.id });
      if (!player) return;

      const room = await Room.findOne({ players: player._id });
      if (!room) return;

      // mark offline
      player.socketId = null;
      await player.save();

      const players = await Player.find({ _id: { $in: room.players } })
        .select("nickname _id isCreator socketId");

      io.to(room._id.toString()).emit("lobby:playerList", {
        players,
        count: players.length, // ✅ keep client happy
      });
    } catch (e) {
      console.error("Disconnect cleanup error:", e);
    }
  });
};