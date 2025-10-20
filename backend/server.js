const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const httpserver = http.createServer(app);
const io = new Server(httpserver,{
    cors:{
        origin:"http://localhost::5173",
        methods:["GET","POST"]
    }
});

const PORT = process.env.PORT || 5000;


io.on('connection',(socket)=>{
    console.log('A user connected :',socket.id);
});

app.get('/', (req, res) => {
  res.send('Scribble backend is running!');
});


httpserver.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

