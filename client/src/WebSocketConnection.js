import React, { useState, useEffect, useRef } from 'react';
import './WebSocketConnection.css';

const WebSocketConnection = () => {
  const [gameState, setGameState] = useState(null);
  const [player, setPlayer] = useState('');
  const [message, setMessage] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case 'start':
        case 'update':
        case 'end':
          setGameState(data.gameState);
          setMessage(data.message || '');
          break;
        case 'error':
          alert(data.message);
          break;
        default:
          break;
      }
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const initGame = () => {
    const characters = [
      { type: 'P', id: 'P1', position: 'e2' },
      { type: 'H', id: 'H1', position: 'd1' },
      { type: 'H', id: 'H2', position: 'e1' },
      { type: 'H', id: 'H3', position: 'f1' }
    ];
    ws.current.send(JSON.stringify({ type: 'init', player, characters }));
  };

  const makeMove = (from, to) => {
    const [fromRow, fromCol] = positionToIndices(from);
    const [toRow, toCol] = positionToIndices(to);
    ws.current.send(JSON.stringify({ type: 'move', player, move: { fromRow, fromCol, toRow, toCol } }));
  };

  // Helper function to convert board positions from strings to indices
  const positionToIndices = (position) => {
    const column = position.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 5 - parseInt(position[1]);
    return [row, column];
  };

  return (
    <div className="game-container">
      <h1>Chess-Like Game</h1>
      <input
        type="text"
        placeholder="Enter Player ID (A or B)"
        value={player}
        onChange={(e) => setPlayer(e.target.value)}
      />
      <button onClick={initGame}>Start Game</button>
      {gameState && (
        <div>
          <h2>Game Board</h2>
          <div className="board">
            {gameState.board.map((row, rowIndex) => (
              <div key={rowIndex} className="row">
                {row.map((cell, cellIndex) => (
                  <div key={cellIndex} className="cell">
                    {cell ? (
                      <span className={`piece ${cell.type}`}>
                        {cell.id}
                      </span>
                    ) : (
                      ''
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <h3>Current Turn: {gameState.turn}</h3>
          {message && <div className="game-message">{message}</div>}
          {/* Example move buttons */}
          <button onClick={() => makeMove('e2', 'e4')}>Move P1 from e2 to e4</button>
          {/* Add more move buttons as needed */}
        </div>
      )}
    </div>
  );
};

export default WebSocketConnection;
