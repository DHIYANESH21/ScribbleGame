import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import Whiteboard from "../components/Whiteborad/WhiteBoard";

const Game = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const playerId = localStorage.getItem("playerId");

  const [gameData, setGameData] = useState(null);
  const [wordChoices, setWordChoices] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [gameStatus, setGameStatus] = useState("waiting");

  useEffect(() => {
    console.log("Joining game:", gameId);
    socket.emit("game:join", { gameId, playerId });

    socket.on("game:state", (data) => {
      console.log("Game state received:", data);
      setGameData(data);
      setIsMyTurn(data.currentDrawer === playerId);
      setGameStatus(data.gameStatus);
      
      // ✅ Reset word and time when new round starts
      if (data.gameStatus === "choosing_word") {
        setCurrentWord("");
        setTimeLeft(0);
      }
    });

    socket.on("game:wordChoices", ({ words }) => {
      console.log("Word choices received:", words);
      setWordChoices(words);
    });

    socket.on("game:wordChosen", ({ hint, timeLeft: time }) => {
      console.log("Word chosen:", hint);
      setCurrentWord(hint);
      setTimeLeft(time);
      setWordChoices([]);
      // ✅ Update status to playing when word is chosen
      setGameStatus("playing");
    });

    socket.on("game:timerUpdate", ({ timeLeft: time }) => {
      setTimeLeft(time);
    });

    socket.on("game:roundEnd", ({ word, scores, nextDrawer }) => {
      console.log("Round ended. Word was:", word);
      alert(`Round Over! The word was: ${word}`);
      setCurrentWord("");
      setTimeLeft(0);
      setWordChoices([]);
      // ✅ Status will be updated by the next game:state event
    });

    socket.on("game:over", ({ finalScores, winner }) => {
      alert(`Game Over! Winner: ${winner.nickname}`);
      // Navigate back to lobby if you have the roomCode
      navigate("/");
    });

    return () => {
      socket.off("game:state");
      socket.off("game:wordChoices");
      socket.off("game:wordChosen");
      socket.off("game:timerUpdate");
      socket.off("game:roundEnd");
      socket.off("game:over");
    };
  }, [gameId, playerId, navigate]);

  const handleWordChoice = (word) => {
    if (isMyTurn && gameStatus === "choosing_word") {
      console.log("Choosing word:", word);
      socket.emit("game:chooseWord", { gameId, word });
    }
  };

  if (!gameData) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontFamily: "Arial"
      }}>
        <div style={{ textAlign: "center" }}>
          <h2>Loading game...</h2>
          <div style={{ 
            width: "50px", 
            height: "50px", 
            border: "5px solid #f3f3f3",
            borderTop: "5px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "20px auto"
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "20px", 
      fontFamily: "Arial",
      maxWidth: "1400px",
      margin: "0 auto"
    }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>🎨 Drawing Game</h1>
      
      {/* Game Info Bar */}
      <div style={{ 
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px", 
        padding: "15px", 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "10px",
        color: "white",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div>
          <strong>Round:</strong> {gameData.currentRound} / {gameData.totalRounds}
        </div>
        <div style={{ 
          fontSize: "24px", 
          fontWeight: "bold",
          backgroundColor: timeLeft <= 10 ? "#ff4444" : "rgba(255,255,255,0.2)",
          padding: "5px 15px",
          borderRadius: "8px",
          animation: timeLeft <= 10 ? "pulse 1s infinite" : "none"
        }}>
          ⏱️ {timeLeft}s
        </div>
        <div>
          <strong>Drawer:</strong> {
            gameData.players?.find(p => p._id === gameData.currentDrawer)?.nickname || "Unknown"
          }
        </div>
      </div>

      {/* Main Game Area */}
      <div style={{ display: "flex", gap: "20px" }}>
        {/* Left Side - Whiteboard */}
        <div style={{ flex: 1 }}>
          {/* Word Choice Section */}
          {isMyTurn && gameStatus === "choosing_word" && wordChoices.length > 0 && (
            <div style={{ 
              padding: "20px", 
              backgroundColor: "#fff3cd", 
              borderRadius: "10px",
              marginBottom: "20px",
              border: "2px solid #ffc107",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}>
              <h2 style={{ margin: "0 0 15px 0", color: "#856404" }}>
                🎯 Choose a word to draw:
              </h2>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                {wordChoices.map((word, index) => (
                  <button
                    key={index}
                    onClick={() => handleWordChoice(word)}
                    style={{
                      padding: "15px 30px",
                      fontSize: "20px",
                      cursor: "pointer",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 8px rgba(0,0,0,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Waiting for drawer message */}
          {!isMyTurn && gameStatus === "choosing_word" && (
            <div style={{ 
              padding: "30px", 
              backgroundColor: "#e3f2fd", 
              borderRadius: "10px",
              marginBottom: "20px",
              textAlign: "center",
              border: "2px solid #2196F3",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}>
              <h2 style={{ color: "#1565c0", margin: 0 }}>
                ⏳ Waiting for {gameData.players?.find(p => p._id === gameData.currentDrawer)?.nickname} to choose a word...
              </h2>
            </div>
          )}

          {/* Current Word Display */}
          {gameStatus === "playing" && (
            <div style={{ 
              padding: "15px", 
              backgroundColor: isMyTurn ? "#d4edda" : "#fff3cd",
              borderRadius: "10px",
              marginBottom: "20px",
              textAlign: "center",
              border: `2px solid ${isMyTurn ? "#28a745" : "#ffc107"}`,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}>
              <h2 style={{ 
                margin: 0, 
                color: isMyTurn ? "#155724" : "#856404",
                fontSize: "28px",
                letterSpacing: "8px",
                fontFamily: "monospace"
              }}>
                {isMyTurn ? `✏️ You are drawing: ${currentWord}` : `🤔 Guess: ${currentWord}`}
              </h2>
            </div>
          )}

          {/* Whiteboard */}
          <Whiteboard 
            gameId={gameId}
            isDrawer={isMyTurn}
            disabled={gameStatus !== "playing"}
          />
        </div>

        {/* Right Side - Players List */}
        <div style={{ 
          width: "300px",
          backgroundColor: "#f8f9fa",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ 
            marginTop: 0, 
            color: "#333",
            borderBottom: "2px solid #667eea",
            paddingBottom: "10px"
          }}>
            👥 Players
          </h3>
          <ul style={{ 
            listStyle: "none", 
            padding: 0,
            margin: 0
          }}>
            {gameData.players?.map((player) => (
              <li 
                key={player._id}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  backgroundColor: player._id === gameData.currentDrawer ? "#667eea" : "white",
                  color: player._id === gameData.currentDrawer ? "white" : "#333",
                  borderRadius: "8px",
                  fontWeight: player._id === gameData.currentDrawer ? "bold" : "normal",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s",
                  cursor: "default"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(5px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{player.nickname}</span>
                  {player._id === gameData.currentDrawer && <span>🎨</span>}
                </div>
              </li>
            ))}
          </ul>

          {/* Game Status Info */}
          <div style={{ 
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#667eea" }}>Game Status</h4>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Status:</strong> {gameStatus === "choosing_word" ? "Choosing Word" : gameStatus === "playing" ? "Playing" : gameStatus}
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Players:</strong> {gameData.players?.length}
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default Game;