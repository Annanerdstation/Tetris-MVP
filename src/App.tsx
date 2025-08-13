import { useState, useEffect, useCallback } from 'react'
import './App.css'

// Tetromino shapes
const TETROMINOS = {
  I: {
    shape: [
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
    ],
    color: '#00f5ff',
  },
  J: {
    shape: [
      ['J', 0, 0],
      ['J', 'J', 'J'],
      [0, 0, 0],
    ],
    color: '#0000ff',
  },
  L: {
    shape: [
      [0, 0, 'L'],
      ['L', 'L', 'L'],
      [0, 0, 0],
    ],
    color: '#ff7f00',
  },
  O: {
    shape: [
      ['O', 'O'],
      ['O', 'O'],
    ],
    color: '#ffff00',
  },
  S: {
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0],
    ],
    color: '#00ff00',
  },
  T: {
    shape: [
      [0, 'T', 0],
      ['T', 'T', 'T'],
      [0, 0, 0],
    ],
    color: '#800080',
  },
  Z: {
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0],
    ],
    color: '#ff0000',
  },
}

// Game constants
const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const INITIAL_DROP_TIME = 1000

// Create empty board
const createBoard = (): (string | number)[][] => 
  Array.from({ length: BOARD_HEIGHT }, () => 
    Array.from({ length: BOARD_WIDTH }, () => 0)
  )

// Get random tetromino
const randomTetromino = () => {
  const tetrominos = 'IJLOSTZ'
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)]
  return TETROMINOS[randTetromino as keyof typeof TETROMINOS]
}

// Check collision
const checkCollision = (
  player: any,
  board: any[][],
  { x: moveX, y: moveY }: { x: number; y: number }
) => {
  for (let y = 0; y < player.tetromino.length; y += 1) {
    for (let x = 0; x < player.tetromino[y].length; x += 1) {
      // Check if we're on a tetromino cell
      if (player.tetromino[y][x] !== 0) {
        const newY = y + player.pos.y + moveY
        const newX = x + player.pos.x + moveX
        
        // Check if our move is inside the game area's height (y)
        if (newY >= board.length) {
          return true
        }
        
        // Check if our move is inside the game area's width (x)
        if (newX < 0 || newX >= board[0].length) {
          return true
        }
        
        // Check if the cell we're moving to isn't set to clear
        if (newY >= 0 && board[newY][newX] !== 0) {
          return true
        }
      }
    }
  }
  return false
}

function App() {
  const [player, setPlayer] = useState({
    pos: { x: 4, y: 0 },
    tetromino: randomTetromino().shape,
    collided: false,
  })
  const [gameOver, setGameOver] = useState(false)
  const [board, setBoard] = useState<(string | number)[][]>(createBoard())
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [dropTime, setDropTime] = useState(INITIAL_DROP_TIME)
  const [gameStarted, setGameStarted] = useState(false)
  const [clearingLines, setClearingLines] = useState<number[]>([])

  const rotate = (matrix: any[][], dir: number) => {
    // Transpose the matrix
    const rotated = matrix.map((_, index) => 
      matrix.map(col => col[index])
    )
    // Reverse each row to get a rotated matrix
    if (dir > 0) return rotated.map(row => row.reverse())
    return rotated.reverse()
  }

  const playerRotate = (board: any[][]) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player))
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, 1)

    const pos = clonedPlayer.pos.x
    let offset = 1
    while (checkCollision(clonedPlayer, board, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset
      offset = -(offset + (offset > 0 ? 1 : -1))
      if (offset > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -1)
        clonedPlayer.pos.x = pos
        return
      }
    }

    setPlayer(clonedPlayer)
  }

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, board, { x: dir, y: 0 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x + dir, y: prev.pos.y }
      }))
    }
  }

  const startGame = () => {
    const newBoard = createBoard()
    const newTetromino = randomTetromino()
    
    setBoard(newBoard)
    setPlayer({
      pos: { x: 4, y: 0 },
      tetromino: newTetromino.shape,
      collided: false,
    })
    setGameOver(false)
    setGameStarted(true)
    setScore(0)
    setLevel(1)
    setLines(0)
    setDropTime(INITIAL_DROP_TIME)
  }

  const drop = () => {
    const hasCollision = checkCollision(player, board, { x: 0, y: 1 })
    
    if (!hasCollision) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x, y: prev.pos.y + 1 }
      }))
    } else {
      // Check if game is over - only if the piece is at the very top
      if (player.pos.y <= 0) {
        setGameOver(true)
        setDropTime(0)
        setGameStarted(false)
        return
      }
      
      // Merge the tetromino with the board immediately
      const newBoard = board.map((row, y) =>
        row.map((value, x) => {
          if (x >= player.pos.x && 
              x < player.pos.x + player.tetromino[0].length &&
              y >= player.pos.y && 
              y < player.pos.y + player.tetromino.length) {
            const tetrominoY = y - player.pos.y
            const tetrominoX = x - player.pos.x
            if (player.tetromino[tetrominoY] && 
                player.tetromino[tetrominoY][tetrominoX]) {
              return player.tetromino[tetrominoY][tetrominoX]
            }
          }
          return value
        })
      )
      
      setBoard(newBoard)
      setPlayer(prev => ({ ...prev, collided: true }))
    }
  }

  const dropPlayer = () => {
    drop()
  }

  const move = useCallback(({ keyCode }: { keyCode: number }) => {
    if (!gameOver && gameStarted) {
      if (keyCode === 37) {
        movePlayer(-1)
      } else if (keyCode === 39) {
        movePlayer(1)
      } else if (keyCode === 40) {
        dropPlayer()
      } else if (keyCode === 38) {
        playerRotate(board)
      }
    }
  }, [gameOver, gameStarted, player, board])

  useEffect(() => {
    document.addEventListener('keydown', move)
    return () => {
      document.removeEventListener('keydown', move)
    }
  }, [move])

  useEffect(() => {
    let dropInterval: NodeJS.Timeout
    if (dropTime > 0 && gameStarted && !gameOver) {
      dropInterval = setInterval(() => {
        drop()
      }, dropTime)
    }
    return () => {
      clearInterval(dropInterval)
    }
  }, [dropTime, player, board, gameStarted, gameOver])

  useEffect(() => {
    if (player.collided) {
      // Check for completed lines in the current board
      const completedLines: number[] = []
      board.forEach((row, index) => {
        if (row.every(value => value !== 0)) {
          completedLines.push(index)
        }
      })

      if (completedLines.length > 0) {
        // Start line clearing animation
        setClearingLines(completedLines)
        
        // Wait for animation, then clear lines
        setTimeout(() => {
          const updatedBoard = board.filter((_, index) => !completedLines.includes(index))
          
          // Add new empty rows at the top
          while (updatedBoard.length < BOARD_HEIGHT) {
            updatedBoard.unshift(Array.from({ length: BOARD_WIDTH }, () => 0))
          }

          setBoard(updatedBoard)
          setClearingLines([])
          
          // Update score and level
          const newLines = lines + completedLines.length
          const newLevel = Math.floor(newLines / 10) + 1
          const newScore = score + (completedLines.length * 100 * newLevel)
          
          setLines(newLines)
          setLevel(newLevel)
          setScore(newScore)
          setDropTime(Math.max(100, INITIAL_DROP_TIME - (newLevel - 1) * 100))
          
          // Spawn new tetromino
          setPlayer({
            pos: { x: 4, y: 0 },
            tetromino: randomTetromino().shape,
            collided: false,
          })
        }, 500) // Animation duration
      } else {
        // No lines to clear, spawn new tetromino immediately
        setPlayer({
          pos: { x: 4, y: 0 },
          tetromino: randomTetromino().shape,
          collided: false,
        })
      }
    }
  }, [player.collided, board, lines, score])

  const renderCell = (value: any, rowIndex: number) => {
    if (value === 0) return null
    const color = Object.values(TETROMINOS).find(t => t.shape.flat().includes(value))?.color || '#000'
    const isClearing = clearingLines.includes(rowIndex)
    
    return (
      <div 
        className={`cell ${isClearing ? 'clearing' : ''}`}
        style={{ backgroundColor: color }}
      />
    )
  }

  return (
    <div className="App">
      <div className="game-container">
        <div className="game-info">
          <h1>TETRIS</h1>
          <div className="stats">
            <div className="stat">
              <label>Score:</label>
              <span>{score}</span>
            </div>
            <div className="stat">
              <label>Level:</label>
              <span>{level}</span>
            </div>
            <div className="stat">
              <label>Lines:</label>
              <span>{lines}</span>
            </div>
          </div>
          {gameOver && (
            <div className="game-over">
              <h2>Game Over!</h2>
              <button onClick={startGame}>Play Again</button>
            </div>
          )}
          {!gameOver && !gameStarted && (
            <div className="start-game">
              <button onClick={startGame}>Start Game</button>
            </div>
          )}
          {!gameOver && gameStarted && (
            <div className="controls">
              <p>← → Move</p>
              <p>↓ Drop</p>
              <p>↑ Rotate</p>
            </div>
          )}
        </div>
        
        <div className="game-board">
          {board.map((row, y) => (
            <div key={y} className={`row ${clearingLines.includes(y) ? 'clearing-row' : ''}`}>
              {row.map((cell, x) => (
                <div key={x} className="cell-container">
                  {renderCell(cell, y)}
                  {/* Render current tetromino on top of board cells */}
                  {player.tetromino.map((tetroRow, ty) =>
                    tetroRow.map((tetroCell, tx) => {
                      if (tetroCell !== 0 && 
                          y === player.pos.y + ty && 
                          x === player.pos.x + tx) {
                        return (
                          <div
                            key={`current-${ty}-${tx}`}
                            className="cell current-tetromino"
                            style={{
                              backgroundColor: Object.values(TETROMINOS).find(t => 
                                t.shape.flat().includes(tetroCell)
                              )?.color || '#000',
                            }}
                          />
                        )
                      }
                      return null
                    })
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
