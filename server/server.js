const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 8080;

// Initialize the game state
let gameState = {
  board: Array(5).fill(null).map(() => Array(5).fill(null)),
  players: {},
  turn: 'A',
  winner: null
};

// Function to broadcast game state to all clients
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Handle client connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'init':
        handleInit(ws, data);
        break;
      case 'move':
        handleMove(ws, data);
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Initialize the game with characters
const handleInit = (ws, data) => {
  const { player, characters } = data;
  if (!gameState.players[player]) {
    gameState.players[player] = characters;
    if (Object.keys(gameState.players).length === 2) {
      // Both players are ready, start the game
      broadcast({ type: 'start', gameState });
    }
  }
};

// Handle player moves
const handleMove = (ws, data) => {
  const { player, move } = data;
  if (player !== gameState.turn) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
    return;
  }

  const { fromRow, fromCol, toRow, toCol } = move;

  // Ensure move is within bounds
  if (
    fromRow < 0 || fromRow >= 5 || fromCol < 0 || fromCol >= 5 ||
    toRow < 0 || toRow >= 5 || toCol < 0 || toCol >= 5
  ) {
    ws.send(JSON.stringify({ type: 'error', message: 'Move out of bounds' }));
    return;
  }

  // Ensure the source cell has the player's piece
  if (!gameState.board[fromRow][fromCol] || gameState.board[fromRow][fromCol].type !== player) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid move' }));
    return;
  }

  // Move the piece
  gameState.board[toRow][toCol] = gameState.board[fromRow][fromCol];
  gameState.board[fromRow][fromCol] = null;

  // Example win condition - replace with your actual logic
  if (checkWinCondition(gameState.board, player)) {
    gameState.winner = player;
    broadcast({ type: 'end', message: `Player ${player} wins!`, gameState });
    return;
  }

  // Example draw condition - replace with your actual logic
  if (checkDrawCondition(gameState.board)) {
    broadcast({ type: 'end', message: 'The game is a draw!', gameState });
    return;
  }

  // Toggle turn
  gameState.turn = gameState.turn === 'A' ? 'B' : 'A';

  broadcast({ type: 'update', gameState });
};

// Check win condition
const checkWinCondition = (board, player) => {
  // Example: Check rows, columns, and diagonals for a win
  const winCondition = (arr) => arr.every(cell => cell && cell.type === player);

  // Check rows
  for (let i = 0; i < 5; i++) {
    if (winCondition(board[i])) return true;
  }

  // Check columns
  for (let i = 0; i < 5; i++) {
    if (winCondition(board.map(row => row[i]))) return true;
  }

  // Check diagonals
  if (winCondition(board.map((row, i) => row[i]))) return true;
  if (winCondition(board.map((row, i) => row[4 - i]))) return true;

  return false;
};

// Check draw condition
const checkDrawCondition = (board) => {
  return board.flat().every(cell => cell !== null);
};

// Start the server
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
