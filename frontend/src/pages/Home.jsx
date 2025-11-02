import React from 'react'
import CreateRoom from '../components/Forms/CreateRoomForms/CreateRoom'
import { useState } from 'react'
import JoinRoom from '../components/Forms/JoinRoomForms/JoinRoom';

const Home = () => {
  const [join , setJoin] = useState(false);
  return (

    <div>
      <CreateRoom/>

      <h1>Join a game</h1>
      <button onClick={()=>setJoin(true)}>JOIN</button>

      <>
        {join?<JoinRoom/>:''}
      </>
    </div>
  )
}

export default Home
