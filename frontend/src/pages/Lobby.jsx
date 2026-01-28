import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";

const Lobby = () => {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const playerId = localStorage.getItem("playerId");
  const storedRoomCode = localStorage.getItem("roomCode");

  const [playerCount, setPlayerCount] = useState(1);
  const [playerList, setPlayerList] = useState([]);

  useEffect(() => {
    if (!playerId || storedRoomCode !== roomCode) {
      navigate(`/join/${roomCode}`);
      return;
    }

    socket.emit("player:connect", { playerId });

    socket.on("lobby:playerList", ({ players, count }) => {
      console.log("PLAYERS RECEIVED FROM BACKEND:", players);
  console.log("Your playerId:", playerId);
      setPlayerList(players);
      setPlayerCount(count);
      
      // ✅ Use the fresh 'players' data from the event, not 'playerList' state
      const isHost = players.find((p) => p._id === playerId)?.isCreator;
      console.log("Is host?", isHost);
    });

    socket.on("game:started", ({ gameId, drawer }) => {
      console.log("Game started, navigating to:", gameId);
      navigate(`/game/${gameId}`);
    });

    return () => {
      socket.off("lobby:playerList");
      socket.off("game:started");
    };
  }, [playerId, roomCode, storedRoomCode, navigate]);

  // ✅ Calculate host status directly from playerList state
  const isHost = playerList.find((p) => p._id === playerId)?.isCreator;

  const handleStartGame = () => {
    console.log("Starting game for room:", roomCode);
    socket.emit("game:start", { roomCode });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Lobby - Room: {roomCode}</h1>
      <p>Your Player ID: {playerId}</p>

      <h2>Players in Lobby: {playerCount}</h2>

      <ul>
        {playerList.map((p) => (
          <li key={p._id}>
            {p.nickname} {p.isCreator && "(Host)"}
            {p.socketId ? " 🟢" : " 🔴"}
          </li>
        ))}
      </ul>

      <p>Waiting for others to join...</p>

      {/* ✅ Use isHost calculated from current playerList */}
      {isHost && (
        <button 
          onClick={handleStartGame}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            marginTop: "10px"
          }}
        >
          Start Game
        </button>
      )}
    </div>
  );
};

export default Lobby;