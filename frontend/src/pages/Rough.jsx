import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";

const Rough = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const playerId = localStorage.getItem("playerId");

  const [socket, setSocket] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [wordChoices, setWordChoices] = useState([]); // Words to choose from
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [gameStatus, setGameStatus] = useState("waiting");

  useEffect(() => {
    // ✅ Connect to socket
    const s = io("http://localhost:5000");
    setSocket(s);

    // ✅ Join the game room
    s.emit("game:join", { gameId, playerId });

    // ✅ Listen for game state updates
    s.on("game:state", (data) => {
      setGameData(data);
      setIsMyTurn(data.currentDrawer === playerId);
      setGameStatus(data.gameStatus);
    });

    // ✅ Receive word choices (only for drawer)
    s.on("game:wordChoices", ({ words }) => {
      setWordChoices(words);
    });

    // ✅ Word has been chosen - start the round
    s.on("game:wordChosen", ({ hint, timeLeft: time }) => {
      setCurrentWord(hint); // Show hint with blanks for guessers
      setTimeLeft(time);
      setWordChoices([]); // Clear word choices
    });

    // ✅ Timer update every second
    s.on("game:timerUpdate", ({ timeLeft: time }) => {
      setTimeLeft(time);
    });

    // ✅ Round ended
    s.on("game:roundEnd", ({ word, scores, nextDrawer }) => {
      alert(`Round Over! The word was: ${word}`);
      setCurrentWord("");
      setTimeLeft(0);
      // You can show scores here if needed
    });

    // ✅ Game completely finished
    s.on("game:over", ({ finalScores, winner }) => {
      alert(`Game Over! Winner: ${winner.nickname}`);
      navigate(`/lobby/${gameData?.roomCode}`);
    });

    // ✅ Cleanup
    return () => {
      s.disconnect();
    };
  }, [gameId, playerId, navigate]);

  // ✅ Handle word selection by drawer
  const handleWordChoice = (word) => {
    if (socket && isMyTurn) {
      socket.emit("game:chooseWord", { gameId, word });
    }
  };

  // If game data not loaded yet
  if (!gameData) {
    return <div>Loading game...</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Game Room</h1>
      
      <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc" }}>
        <p><strong>Round:</strong> {gameData.currentRound} / {gameData.totalRounds}</p>
        <p><strong>Status:</strong> {gameStatus}</p>
        <p><strong>Time Left:</strong> {timeLeft}s</p>
      </div>

      {/* ✅ Show word choices if it's your turn and you need to pick */}
      {isMyTurn && gameStatus === "choosing_word" && wordChoices.length > 0 && (
        <div style={{ padding: "20px", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
          <h2>Choose a word to draw:</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            {wordChoices.map((word, index) => (
              <button
                key={index}
                onClick={() => handleWordChoice(word)}
                style={{
                  padding: "15px 30px",
                  fontSize: "18px",
                  cursor: "pointer",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "5px"
                }}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Show drawing area when game is playing */}
      {gameStatus === "playing" && (
        <div style={{ marginTop: "20px" }}>
          {isMyTurn ? (
            <div>
              <h2>You are drawing: {currentWord}</h2>
              <p>Draw here (whiteboard will be implemented later)</p>
            </div>
          ) : (
            <div>
              <h2>Guess the word: {currentWord}</h2>
              <p>Watch and guess! (chat will be implemented later)</p>
            </div>
          )}
        </div>
      )}

      {/* ✅ Player list */}
      <div style={{ marginTop: "30px" }}>
        <h3>Players:</h3>
        <ul>
          {gameData.players?.map((player) => (
            <li key={player._id}>
              {player.nickname} 
              {player._id === gameData.currentDrawer && " 🎨 (Drawing)"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Rough
