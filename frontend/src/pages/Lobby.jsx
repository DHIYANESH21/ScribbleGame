import React from 'react'
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'

const Lobby = () => {
    const navigate = useNavigate();
    const { roomCode } = useParams();
    const playerId = localStorage.getItem('playerId'); // Fixed: was 'PlayerId', should be 'playerId'
    const storedRoomCode = localStorage.getItem('roomCode');

    useEffect(() => {
        // Check if player is authenticated and in the correct room
        if (!playerId || storedRoomCode !== roomCode) {
            // If not authenticated or wrong room, redirect to join page
            navigate(`/join/${roomCode}`);
        }
    }, [roomCode, playerId, storedRoomCode, navigate]);

    return (
        <div>
            <h1>Lobby - Room: {roomCode}</h1>
            <p>Welcome! Player ID: {playerId}</p>
        </div>
    )
}

export default Lobby    