const express = require('express');
const socket = require('socket.io');
const http = require('http');
const path = require('path');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = new socket.Server(server);

const chess = new Chess();

let player = {};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'Chess Game' });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  if (!player.white) {
    player.white = socket.id;
    socket.emit("playerRole", 'w');
  } else if (!player.black) {
    player.black = socket.id;
    socket.emit('playerRole', 'b');
  } else {
    socket.emit('spectatorRole'); 
  }

  socket.on('disconnect', () => {
    if (socket.id === player.white) {
      delete player.white;
    } else if (socket.id === player.black) {
      delete player.black;
    }
    io.emit('boardState', chess.fen()); 
  });

  socket.on('move', (move) => { 
    try {
      if (chess.turn() === 'w' && socket.id !== player.white) return;
      if (chess.turn() === 'b' && socket.id !== player.black) return;

      const result = chess.move(move);
      if (result) {
        io.emit('move', move);
        io.emit('boardState', chess.fen());
        if (chess.isCheckmate()) {
          io.emit('gameOver', { winner: chess.turn() === 'w' ? 'Black' : 'White' });
        }
      } else {
        console.log("Invalid Move: ", move);
        socket.emit('invalidMove', move);
      }
    } catch (error) {
      console.log(error);
      socket.emit('invalidMove', move);
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running at 3000');
});
