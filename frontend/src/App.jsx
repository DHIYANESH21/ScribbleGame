import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import JoinRoom from './components/Forms/JoinRoomForms/JoinRoom';
import Lobby from './pages/Lobby';



const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/join/:roomCode" element={<JoinRoom />} />
        <Route path="/lobby/:roomCode" element={<Lobby />} />
      </Routes>
    </Router>
  );
};

export default App;
