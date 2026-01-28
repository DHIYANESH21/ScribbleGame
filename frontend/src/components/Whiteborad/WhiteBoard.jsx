import React, { useRef, useEffect, useState } from "react";
import { socket } from "../../Socket";

const Whiteboard = ({ gameId, isDrawer, disabled }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [strokes, setStrokes] = useState([]); // Store all strokes for undo functionality
  const currentStroke = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Set canvas background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set default drawing styles
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    // Listen for drawing events from other players
    socket.on("draw:start", ({ x, y, color: c, lineWidth: lw }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = c;
      ctx.lineWidth = lw;
    });

    socket.on("draw:move", ({ x, y, color: c, lineWidth: lw }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.lineTo(x, y);
      ctx.strokeStyle = c;
      ctx.lineWidth = lw;
      ctx.stroke();
    });

    socket.on("draw:end", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.closePath();
    });

    socket.on("draw:clear", () => {
      clearCanvas();
    });

    socket.on("draw:undo", () => {
      undoLastStroke();
    });

    return () => {
      socket.off("draw:start");
      socket.off("draw:move");
      socket.off("draw:end");
      socket.off("draw:clear");
      socket.off("draw:undo");
    };
  }, [strokes]);

  const startDrawing = (e) => {
    if (!isDrawer || disabled) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    currentStroke.current = [{ x, y, color, lineWidth }];

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // Emit to other players
    socket.emit("draw:start", { gameId, x, y, color, lineWidth });
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawer || disabled) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStroke.current.push({ x, y, color, lineWidth });

    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Emit to other players
    socket.emit("draw:move", { gameId, x, y, color, lineWidth });
  };

  const stopDrawing = () => {
    if (!isDrawing || !isDrawer || disabled) return;

    setIsDrawing(false);
    
    // Save the stroke for undo functionality
    if (currentStroke.current.length > 0) {
      setStrokes([...strokes, currentStroke.current]);
      currentStroke.current = [];
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.closePath();

    // Emit to other players
    socket.emit("draw:end", { gameId });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    currentStroke.current = [];
  };

  const handleClear = () => {
    if (!isDrawer || disabled) return;
    clearCanvas();
    socket.emit("draw:clear", { gameId });
  };

  const undoLastStroke = () => {
    if (strokes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Remove last stroke
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);

    // Redraw canvas
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all remaining strokes
    newStrokes.forEach((stroke) => {
      if (stroke.length === 0) return;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      ctx.strokeStyle = stroke[0].color;
      ctx.lineWidth = stroke[0].lineWidth;

      stroke.forEach((point, index) => {
        if (index > 0) {
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }
      });

      ctx.closePath();
    });
  };

  const handleUndo = () => {
    if (!isDrawer || disabled || strokes.length === 0) return;
    undoLastStroke();
    socket.emit("draw:undo", { gameId });
  };

  const colors = [
    "#000000", // Black
    "#FFFFFF", // White (eraser)
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
    "#A52A2A", // Brown
    "#808080", // Gray
  ];

  const lineWidths = [1, 3, 5, 8, 12];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Drawing Tools - Only show for drawer */}
      {isDrawer && !disabled && (
        <div style={{ 
          marginBottom: "10px", 
          padding: "15px", 
          backgroundColor: "#f5f5f5", 
          borderRadius: "8px",
          display: "flex",
          gap: "20px",
          alignItems: "center"
        }}>
          {/* Color Palette */}
          <div>
            <label style={{ fontWeight: "bold", marginRight: "10px" }}>Color:</label>
            <div style={{ display: "inline-flex", gap: "5px" }}>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: "30px",
                    height: "30px",
                    backgroundColor: c,
                    border: color === c ? "3px solid #333" : "1px solid #ccc",
                    cursor: "pointer",
                    borderRadius: "4px"
                  }}
                  title={c === "#FFFFFF" ? "Eraser" : c}
                />
              ))}
            </div>
          </div>

          {/* Line Width */}
          <div>
            <label style={{ fontWeight: "bold", marginRight: "10px" }}>Width:</label>
            <div style={{ display: "inline-flex", gap: "5px" }}>
              {lineWidths.map((width) => (
                <button
                  key={width}
                  onClick={() => setLineWidth(width)}
                  style={{
                    padding: "5px 10px",
                    backgroundColor: lineWidth === width ? "#4CAF50" : "#fff",
                    color: lineWidth === width ? "#fff" : "#000",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                    borderRadius: "4px",
                    fontWeight: lineWidth === width ? "bold" : "normal"
                  }}
                >
                  {width}px
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              style={{
                padding: "8px 15px",
                backgroundColor: strokes.length === 0 ? "#ccc" : "#ff9800",
                color: "white",
                border: "none",
                cursor: strokes.length === 0 ? "not-allowed" : "pointer",
                borderRadius: "4px",
                fontWeight: "bold"
              }}
            >
              ↶ Undo
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: "8px 15px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
                fontWeight: "bold"
              }}
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          border: "2px solid #333",
          borderRadius: "8px",
          cursor: isDrawer && !disabled ? "crosshair" : "default",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
      />

      {/* Instructions */}
      {!isDrawer && (
        <p style={{ marginTop: "10px", color: "#666", fontStyle: "italic" }}>
          Watch the drawer create their masterpiece!
        </p>
      )}
      {isDrawer && disabled && (
        <p style={{ marginTop: "10px", color: "#666", fontStyle: "italic" }}>
          Choose a word to start drawing
        </p>
      )}
    </div>
  );
};

export default Whiteboard;