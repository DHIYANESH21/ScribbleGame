const Player = require("../../models/Player");
const Room = require("../../models/Room");

module.exports = (io, socket) => {
  // ---------------------------------------
  // LOBBY: identify socket & broadcast list
  // ---------------------------------------
  socket.on("player:connect", async ({ playerId }) => {
    const player = await Player.findById(playerId);
    if (!player) return;

    socket.playerId = playerId;          // ✅ remember who owns this socket
    player.socketId = socket.id;         // ✅ store for targeted emits
    await player.save();

    const room = await Room.findOne({ players: playerId });
    if (!room) return;

    socket.join(room._id.toString());

    const players = await Player.find({ _id: { $in: room.players } })
      .select("nickname _id isCreator socketId");

    io.to(room._id.toString()).emit("lobby:playerList", {
      players,
      count: players.length,
    });
  });
};