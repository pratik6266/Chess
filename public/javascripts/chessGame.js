const socket = io();
const chess = new Chess();
let boardElement = document.querySelector('.chessboard');
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  boardElement.innerHTML = "";
  const board = chess.board();
  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareElement = document.createElement('div');
      squareElement.classList.add('square', (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark');
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;

      if (square) {
        const pieceElement = document.createElement('div');
        pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener('dragstart', (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: colIndex };
            e.dataTransfer.setData('text/plain', '');
          }
        });

        pieceElement.addEventListener('dragend', () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener('dragover', (e) => e.preventDefault());

      squareElement.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = { row: rowIndex, col: colIndex };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === 'b') {
    boardElement.classList.add('flipped');
  } else {
    boardElement.classList.remove('flipped');
  }
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: 'q',
  };

  socket.emit('move', move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔',
    P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚',
  };
  return unicodePieces[piece.type] || "";
};

socket.on('playerRole', (role) => {
  playerRole = role;
  renderBoard();
});

socket.on('spectatorRole', () => {
  playerRole = null;
  renderBoard();
});

socket.on('boardState', (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on('move', (move) => {
  chess.move(move);
  renderBoard();
});

socket.on('gameOver', (data) => {
  const gameOverMessage = document.getElementById('gameOverMessage');
  const winnerText = document.getElementById('winnerText');

  winnerText.innerText = `${data.winner} wins by checkmate!`;
  gameOverMessage.classList.remove('hidden');

  document.getElementById('closeGameOverMessage').addEventListener('click', () => {
    gameOverMessage.classList.add('hidden');
  });
});


renderBoard();