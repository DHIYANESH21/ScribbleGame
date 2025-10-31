import React from 'react'
import axios from 'axios';
import { useState } from 'react';

const CreateRoom = () => {
    const [roomCode, setRoomCode] = useState('');
    const [rounds, setRounds] = useState(3);
    const [time, setTime] = useState(60);
    const [nickname, setNickname] = useState('');

    const handleCreateRoom = async () => {
        if (!nickname.trim()) {
            alert('Please enter your name');
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/games/createroom', {
                roomName: `${nickname}'s Room`, 
                drawTime: time,
                totalRounds: rounds,
                creatorNickname: nickname
            });

            if (res.data.success) {
                setRoomCode(res.data.roomCode);
                alert(`Room created! Code: ${res.data.roomCode}`);
                // Store playerId in localStorage or state for later use
                localStorage.setItem('playerId', res.data.playerId);
                localStorage.setItem('roomCode', res.data.roomCode);
            }
        } catch (err) {
            console.error('Error creating room:', err);
            alert(err.response?.data?.message || 'Failed to create room');
        }
    };

    return (
        <div>
            <h1>Create Room</h1>
            <input 
                type="text" 
                placeholder='Enter your name' 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
            />
            <label htmlFor="round">Choose number of rounds:</label>
            <select id="round" value={rounds} onChange={(e) => setRounds(e.target.value)}>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
            </select>
            <p>Selected round: {rounds}</p>
            <label htmlFor="time">Time to draw in seconds:</label>
            <select id="time" value={time} onChange={(e) => setTime(e.target.value)}>
                <option value={60}>60</option>
                <option value={80}>80</option>
                <option value={120}>120</option>
            </select>
            <p>Selected time seconds: {time}</p>

            <button onClick={handleCreateRoom}>Generate room code</button>

            {roomCode && <p>Room Code: <strong>{roomCode}</strong></p>}
        </div>
    )
}

export default CreateRoom