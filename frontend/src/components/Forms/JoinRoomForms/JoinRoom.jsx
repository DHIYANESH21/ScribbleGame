import axios from 'axios';
import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom';

const JoinRoom = () => {

  const { roomCode } = useParams(); // This gets roomCode from URL
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState(roomCode || ''); // Renamed to avoid confusion

  const handleJoinClick = async () => {
    try {
      if (!nickname || !roomCodeInput) {
        alert('enter all fields');
        return
      }

      const res = await axios.post('http://localhost:5000/api/games/joinroom', {
        roomCode: roomCodeInput,
        nickname: nickname
      });

      if (res.data.success) {
        localStorage.setItem('playerId', res.data.playerId);
        localStorage.setItem('roomCode', roomCodeInput); 

        navigate(`/lobby/${roomCodeInput}`); // Use roomCodeInput, not roomCode
      }

    } catch (err) {
      console.error('error while joining', err)
      alert(err.response?.data?.message || 'Failed to join room');
    }
  }

  useEffect(() => {
    // If roomCode comes from URL, set it
    if (roomCode) {
      setRoomCodeInput(roomCode);
    }
  }, []);

  return (
    <div>
      <h1>Join Room</h1>

      <label htmlFor="nickname"> Enter Your Name </label>
      <input 
        type="text" 
        id="nickname"
        placeholder='Enter your name' 
        value={nickname}
        onChange={e => setNickname(e.target.value)}
      />

      <label htmlFor="roomcode">Enter room code</label>
      <input 
        type="text"
        id="roomcode"
        value={roomCodeInput}
        onChange={e => setRoomCodeInput(e.target.value)}
        disabled={!!roomCode} // Disable only if roomCode came from URL
        placeholder={roomCode ? '' : 'Enter room code'}
      />

      <button onClick={handleJoinClick}>Join room 1</button>

    </div>
  )
}

export default JoinRoom