import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import Board from './component/Board'

function calculateWinner(squares) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ]
  for (const [a,b,c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a,b,c] }
    }
  }
  return { winner: null, line: null }
}

// AI Minimax algorithm with difficulty levels
function getBestAIMove(squares, difficulty = 'medium') {
  const availableMoves = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null)
  
  if (availableMoves.length === 0) return null

  // Easy: random move
  if (difficulty === 'easy') {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)]
  }

  // Medium: minimax with occasional random (70% optimal, 30% random)
  if (difficulty === 'medium') {
    if (Math.random() < 0.3) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    }
    return minimax(squares, 0, true).index
  }

  // Hard: perfect minimax (unbeatable)
  return minimax(squares, 0, true).index
}

function minimax(squares, depth, isMaximizing) {
  const result = calculateWinner(squares)
  
  // Terminal states
  if (result.winner === 'O') return { score: 10 - depth } // AI wins
  if (result.winner === 'X') return { score: depth - 10 } // Human wins
  if (!squares.includes(null)) return { score: 0 } // Draw

  const availableMoves = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null)

  if (isMaximizing) {
    let bestScore = -Infinity
    let bestIndex = availableMoves[0]
    for (const index of availableMoves) {
      const newSquares = squares.slice()
      newSquares[index] = 'O'
      const { score } = minimax(newSquares, depth + 1, false)
      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    }
    return { score: bestScore, index: bestIndex }
  } else {
    let bestScore = Infinity
    let bestIndex = availableMoves[0]
    for (const index of availableMoves) {
      const newSquares = squares.slice()
      newSquares[index] = 'X'
      const { score } = minimax(newSquares, depth + 1, true)
      if (score < bestScore) {
        bestScore = score
        bestIndex = index
      }
    }
    return { score: bestScore, index: bestIndex }
  }
}

export default function App() {
  const [xIsNext, setXIsNext] = useState(true)
  const [squares, setSquares] = useState(Array(9).fill(null))
  const [score, setScore] = useState({ X: 0, O: 0 })
  const [names, setNames] = useState({ X: '', O: '' })
  const [lastMove, setLastMove] = useState(null)
  const [winningLine, setWinningLine] = useState(null)
  const [started, setStarted] = useState(false)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [gameMode, setGameMode] = useState(null) // null | 'pvp' | 'pva'
  const [difficulty, setDifficulty] = useState('medium') // easy | medium | hard
  const [aiThinking, setAiThinking] = useState(false)
  const [history, setHistory] = useState([{ squares: Array(9).fill(null), xIsNext: true }])
  const [currentMove, setCurrentMove] = useState(0)
  const [gameHistory, setGameHistory] = useState([])
  const [showStats, setShowStats] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  
  // Timed Mode
  const [timedMode, setTimedMode] = useState(false)
  const [timePerMove, setTimePerMove] = useState(10) // seconds
  const [timeRemaining, setTimeRemaining] = useState(10)
  const [gameActive, setGameActive] = useState(false)
  
  // Achievements & Themes
  const [achievements, setAchievements] = useState({})
  const [theme, setTheme] = useState('indigo') // indigo | purple | blue | coral | green
  const [showSettings, setShowSettings] = useState(false)
  
  // Sound Settings
  const [soundVolume, setSoundVolume] = useState(0.25)
  const [musicVolume, setMusicVolume] = useState(0.3)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const clickSound = useRef(null)
  const winSound = useRef(null)
  const canUndo = currentMove > 0
  const canRedo = currentMove < history.length - 1
  const timerRef = useRef(null)

  useEffect(() => {
    const savedScore = localStorage.getItem('tic-tac-toe-score')
    const savedNames = localStorage.getItem('tic-tac-toe-names')
    const savedGameHistory = localStorage.getItem('tic-tac-toe-game-history')
    const savedDarkMode = localStorage.getItem('tic-tac-toe-dark-mode')
    const savedTheme = localStorage.getItem('tic-tac-toe-theme')
    const savedAchievements = localStorage.getItem('tic-tac-toe-achievements')
    const savedSoundVolume = localStorage.getItem('tic-tac-toe-sound-volume')
    const savedMusicVolume = localStorage.getItem('tic-tac-toe-music-volume')
    const savedSoundEnabled = localStorage.getItem('tic-tac-toe-sound-enabled')
    
    if (savedScore) setScore(JSON.parse(savedScore))
    if (savedNames) {
      try { setNames(JSON.parse(savedNames)) } catch { /* ignore invalid saved data */ }
    }
    if (savedGameHistory) {
      try { setGameHistory(JSON.parse(savedGameHistory)) } catch { /* ignore invalid saved data */ }
    }
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode))
    if (savedTheme) setTheme(JSON.parse(savedTheme))
    if (savedAchievements) {
      try { setAchievements(JSON.parse(savedAchievements)) } catch { /* ignore invalid saved data */ }
    }
    if (savedSoundVolume) setSoundVolume(JSON.parse(savedSoundVolume))
    if (savedMusicVolume) setMusicVolume(JSON.parse(savedMusicVolume))
    if (savedSoundEnabled !== null) setSoundEnabled(JSON.parse(savedSoundEnabled))

    clickSound.current = new Audio('/sounds/click.mp3')
    winSound.current = new Audio('/sounds/win.mp3')
    if (clickSound.current) clickSound.current.volume = 0.25
    if (winSound.current) winSound.current.volume = 0.5
  }, [])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Apply dark mode class to root when toggled
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark-mode')
    else document.documentElement.classList.remove('dark-mode')
  }, [darkMode])

  // Persist theme, achievements, sound settings
  useEffect(() => {
    localStorage.setItem('tic-tac-toe-theme', JSON.stringify(theme))
  }, [theme])

  useEffect(() => {
    localStorage.setItem('tic-tac-toe-achievements', JSON.stringify(achievements))
  }, [achievements])

  useEffect(() => {
    localStorage.setItem('tic-tac-toe-score', JSON.stringify(score))
  }, [score])

  useEffect(() => {
    localStorage.setItem('tic-tac-toe-names', JSON.stringify(names))
  }, [names])

  useEffect(() => {
    localStorage.setItem('tic-tac-toe-game-history', JSON.stringify(gameHistory))
  }, [gameHistory])

  useEffect(() => {
    localStorage.setItem('tic-tac-toe-dark-mode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('tic-tac-toe-sound-volume', JSON.stringify(soundVolume))
    if (clickSound.current) clickSound.current.volume = soundVolume * (soundEnabled ? 1 : 0)
    if (winSound.current) winSound.current.volume = soundVolume * (soundEnabled ? 1 : 0)
  }, [soundVolume, soundEnabled])

  useEffect(() => {
    localStorage.setItem('tic-tac-toe-music-volume', JSON.stringify(musicVolume))
  }, [musicVolume])

  useEffect(() => {
    localStorage.setItem('tic-tac-toe-sound-enabled', JSON.stringify(soundEnabled))
  }, [soundEnabled])

  // AI Move Handler (must be defined before timer effect)
  const triggerAIMove = useCallback((currentSquares, isXNext, currentHistory, moveIndex) => {
    const aiIndex = getBestAIMove(currentSquares, difficulty)
    if (aiIndex === null) {
      setAiThinking(false)
      return
    }

    const nextSquares = currentSquares.slice()
    nextSquares[aiIndex] = 'O'
    const nextXIsNext = true
    
    // Update history for AI move
    const newHistory = currentHistory.slice(0, moveIndex + 1)
    newHistory.push({ squares: nextSquares, xIsNext: nextXIsNext })
    setHistory(newHistory)
    setCurrentMove(newHistory.length - 1)
    
    setSquares(nextSquares)
    setLastMove(aiIndex)
    setXIsNext(nextXIsNext)

    if (clickSound.current) {
      clickSound.current.currentTime = 0
      void clickSound.current.play().catch(() => {})
    }

    const result = calculateWinner(nextSquares)
    if (result.winner) {
      setWinningLine(result.line)
      setScore((prev) => ({ ...prev, [result.winner]: prev[result.winner] + 1 }))
      
      // Save game to history
      const gameRecord = {
        date: new Date().toISOString(),
        winner: result.winner,
        playerX: names.X,
        playerO: names.O,
        mode: gameMode,
        moves: newHistory.length - 1,
        difficulty: difficulty
      }
      setGameHistory(prev => [gameRecord, ...prev].slice(0, 50))
      
      if (winSound.current) {
        winSound.current.currentTime = 0
        void winSound.current.play().catch(() => {})
      }
      setTimeout(() => setShowWinnerModal(true), 280)
    }
    setAiThinking(false)
  }, [difficulty, gameMode, names])

  // Timer for timed mode
  useEffect(() => {
    if (!timedMode || !gameActive || !started) return
    const { winner } = calculateWinner(squares)
    if (winner || !squares.includes(null)) return

    if (timerRef.current) clearInterval(timerRef.current)

    setTimeRemaining(timePerMove)
    let remaining = timePerMove

    timerRef.current = setInterval(() => {
      remaining -= 1
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        clearInterval(timerRef.current)
        alert(`Time's up! ${xIsNext ? names.X : names.O} loses this turn.`)
        const nextIsX = !xIsNext
        setXIsNext(nextIsX)
        if (gameMode === 'pva' && !nextIsX) {
          setAiThinking(true)
          setTimeout(() => triggerAIMove(squares, nextIsX, history, currentMove), 600)
        }
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timedMode, gameActive, xIsNext, gameMode, started, timePerMove, names, squares, history, currentMove, triggerAIMove])

  // Check for achievements
  useEffect(() => {
    if (!started) return

    const newAchievements = { ...achievements }
    const totalGamesPlayed = gameHistory.length

    // First Win
    if (totalGamesPlayed === 1) {
      newAchievements.firstWin = true
    }

    // Win Streak
    const recentWins = gameHistory.slice(0, 5).filter(g => g.winner === 'X').length
    if (recentWins >= 5) newAchievements.streaker = true

    // AI Conqueror (beat Hard AI)
    if (gameHistory.some(g => g.difficulty === 'hard' && g.winner === 'X')) {
      newAchievements.aiConqueror = true
    }

    // Century (100 total games)
    if (totalGamesPlayed >= 100) {
      newAchievements.century = true
    }

    // Speed Demon (win in under 10 moves with timer)
    if (timedMode && gameHistory.length > 0) {
      const lastGame = gameHistory[0]
      if (lastGame.moves < 10 && lastGame.winner === 'X') {
        newAchievements.speedDemon = true
      }
    }

    if (JSON.stringify(newAchievements) !== JSON.stringify(achievements)) {
      setAchievements(newAchievements)
    }
  }, [gameHistory, achievements, timedMode, started])

  const handleClick = (index) => {
    const { winner } = calculateWinner(squares)
    if (squares[index] || winner || aiThinking) return

    if (clickSound.current) {
      clickSound.current.currentTime = 0
      void clickSound.current.play().catch(() => {})
    }

    const nextSquares = squares.slice()
    nextSquares[index] = xIsNext ? 'X' : 'O'
    const nextXIsNext = !xIsNext
    
    // Update history for undo/redo
    const newHistory = history.slice(0, currentMove + 1)
    newHistory.push({ squares: nextSquares, xIsNext: nextXIsNext })
    setHistory(newHistory)
    setCurrentMove(newHistory.length - 1)
    
    setSquares(nextSquares)
    setLastMove(index)
    setXIsNext(nextXIsNext)

    const result = calculateWinner(nextSquares)
    if (result.winner) {
      setWinningLine(result.line)
      setScore((prev) => ({ ...prev, [result.winner]: prev[result.winner] + 1 }))
      
      // Save game to history
      const gameRecord = {
        date: new Date().toISOString(),
        winner: result.winner,
        playerX: names.X,
        playerO: names.O,
        mode: gameMode,
        moves: newHistory.length - 1,
        difficulty: gameMode === 'pva' ? difficulty : null
      }
      setGameHistory(prev => [gameRecord, ...prev].slice(0, 50)) // Keep last 50 games
      
      if (winSound.current) {
        winSound.current.currentTime = 0
        void winSound.current.play().catch(() => {})
      }
      setTimeout(() => setShowWinnerModal(true), 280)
    }
    // If PvA mode and it's AI's turn next, trigger AI move
    else if (gameMode === 'pva') {
      setAiThinking(true)
      setTimeout(() => triggerAIMove(nextSquares, nextXIsNext, newHistory, newHistory.length - 1), 600)
    }
  }

  const handleResetBoard = () => {
    setSquares(Array(9).fill(null))
    setLastMove(null)
    setWinningLine(null)
    setXIsNext(true)
    setShowWinnerModal(false)
    setAiThinking(false)
    setHistory([{ squares: Array(9).fill(null), xIsNext: true }])
    setCurrentMove(0)
    setGameActive(timedMode) // Auto-start timer if timed mode
    setTimeRemaining(timePerMove)
  }

  const handleResetScore = () => {
    setScore({ X: 0, O: 0 })
  }

  const handleUndo = () => {
    if (!canUndo || aiThinking) return
    const winner = calculateWinner(squares).winner
    if (winner) return // Don't allow undo after game ends
    
    let newMove = currentMove - 1
    // In PvA mode, undo two moves (player + AI)
    if (gameMode === 'pva' && newMove > 0) {
      newMove = currentMove - 2
    }
    if (newMove < 0) newMove = 0
    
    const historyState = history[newMove]
    setCurrentMove(newMove)
    setSquares(historyState.squares)
    setXIsNext(historyState.xIsNext)
    setLastMove(null)
  }

  const handleRedo = () => {
    if (!canRedo || aiThinking) return
    
    let newMove = currentMove + 1
    // In PvA mode, redo two moves (player + AI)
    if (gameMode === 'pva' && newMove < history.length - 1) {
      newMove = currentMove + 2
    }
    if (newMove >= history.length) newMove = history.length - 1
    
    const historyState = history[newMove]
    setCurrentMove(newMove)
    setSquares(historyState.squares)
    setXIsNext(historyState.xIsNext)
    setLastMove(null)
  }

  const handleNameChange = (side, value) => {
    setNames((prev) => ({ ...prev, [side]: value }))
  }

  const startGame = (mode) => {
    setGameMode(mode)
    if (mode === 'pvp') {
      const a = (names.X || '').trim()
      const b = (names.O || '').trim()
      if (!a || !b) {
        alert('Please enter both player names.')
        return
      }
      setNames({ X: a, O: b })
    } else if (mode === 'pva') {
      const playerName = (names.X || '').trim()
      if (!playerName) {
        alert('Please enter your name.')
        return
      }
      setNames({ X: playerName, O: 'AI Opponent' })
    }
    setStarted(true)
    setGameActive(timedMode) // Start timer if enabled
    setTimeRemaining(timePerMove)
  }

  const editNames = () => {
    setStarted(false)
    setGameMode(null)
  }

  const result = calculateWinner(squares)
  const winner = result.winner

  // auto reset board shortly after win (keeps modal visible briefly)
  useEffect(() => {
    if (!winningLine) return
    const timer = setTimeout(() => {
      // keep modal open until user presses play again; only clear board visuals
      setSquares(Array(9).fill(null))
      setLastMove(null)
      setWinningLine(null)
    }, 2400)
    return () => clearTimeout(timer)
  }, [winningLine])

  // Stats Modal component
  function StatsModal({ open, onClose }) {
    if (!open) return null
    
    const totalGames = gameHistory.length
    const xWins = gameHistory.filter(g => g.winner === 'X').length
    const oWins = gameHistory.filter(g => g.winner === 'O').length
    const avgMoves = totalGames > 0 ? (gameHistory.reduce((sum, g) => sum + g.moves, 0) / totalGames).toFixed(1) : 0
    
    const recentGames = gameHistory.slice(0, 10)
    
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Statistics">
        <div className="bottom-sheet" tabIndex={-1}>
          <div className="sheet-header">
            <h3 className="sheet-title">📊 Statistics</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-value">{totalGames}</div>
              <div className="stat-label">Games</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{xWins}</div>
              <div className="stat-label">X Wins</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{oWins}</div>
              <div className="stat-label">O Wins</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{avgMoves}</div>
              <div className="stat-label">Avg Moves</div>
            </div>
          </div>
          
          {recentGames.length > 0 && (
            <div className="recent-games">
              <h4 className="recent-title">Recent Games</h4>
              <div className="game-list">
                {recentGames.map((game, idx) => (
                  <div key={idx} className="game-item">
                    <div className="game-date">{new Date(game.date).toLocaleDateString()}</div>
                    <div className="game-info">
                      <span className="game-winner">🏆 {game.winner === 'X' ? game.playerX : game.playerO}</span>
                      <span className="game-mode">{game.mode === 'pva' ? `vs AI (${game.difficulty})` : 'vs Player'}</span>
                      <span className="game-moves">{game.moves} moves</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="stats-actions" style={{marginTop: 16}}>
            <button className="btn btn-secondary" style={{width: '100%'}} onClick={() => { if(confirm('Clear all game history?')) setGameHistory([]) }}>Clear History</button>
          </div>
        </div>
      </div>
    )
  }

  // Achievements Modal
  function AchievementsModal({ open, onClose }) {
    if (!open) return null
    
    const achievementsList = [
      { id: 'firstWin', emoji: '🏆', title: 'First Win', desc: 'Win your first game' },
      { id: 'streaker', emoji: '🔥', title: 'Streaker', desc: 'Win 5 games in a row' },
      { id: 'aiConqueror', emoji: '👑', title: 'AI Conqueror', desc: 'Beat AI on Hard mode' },
      { id: 'century', emoji: '💯', title: 'Century', desc: 'Play 100+ games' },
      { id: 'speedDemon', emoji: '⚡', title: 'Speed Demon', desc: 'Win in under 10 moves (Timed)' }
    ]

    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Achievements">
        <div className="bottom-sheet" tabIndex={-1}>
          <div className="sheet-header">
            <h3 className="sheet-title">🏅 Achievements</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="grid-list">
            {achievementsList.map(ach => (
              <div key={ach.id} className={`ach-item ${achievements[ach.id] ? 'unlocked' : 'locked'}`}>
                <div className="ach-icon">{ach.emoji}</div>
                <div className="ach-info">
                  <h4>{ach.title}</h4>
                  <p>{ach.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Settings Modal
  function SettingsModal({ open, onClose }) {
    if (!open) return null

    const themes = ['indigo', 'purple', 'blue', 'coral', 'green']

    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="bottom-sheet" tabIndex={-1}>
          <div className="sheet-header">
            <h3 className="sheet-title">⚙️ Settings</h3>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="settings-section">
            <h4 className="section-title" style={{marginBottom: 12}}>🎨 Theme Color</h4>
            <div className="theme-bubbles">
              {themes.map(t => (
                <button
                  key={t}
                  className={`t-bubble ${theme === t ? 'active' : ''}`}
                  onClick={() => setTheme(t)}
                  title={t.charAt(0).toUpperCase() + t.slice(1)}
                  style={{ background: `var(--theme-${t})` }}
                >
                  {theme === t && '✓'}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h4 className="section-title" style={{marginBottom: 12}}>🔊 Audio</h4>
            <label className="sound-toggle-wrapper">
              <span className="toggle-text">Enable Sound Effects</span>
              <input 
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{width: 24, height: 24}}
              />
            </label>
            
            <div className="volume-control">
              <label>Volume: {Math.round(soundVolume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                disabled={!soundEnabled}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Winner modal component (inline)
  function WinnerModal({ open, onClose, winner }) {
    if (!open || !winner) return null
    const playerName = names[winner] || (winner === 'X' ? 'Player X' : 'Player O')
    const points = score[winner] ?? 0
    // small confetti pieces
    const confetti = new Array(18).fill(0).map((_, i) => ({
      key: i,
      left: Math.round(Math.random() * 80) + '%',
      delay: `${(Math.random() * 400).toFixed(0)}ms`,
      bg: ['#F97316','#F43F5E','#10B981','#60A5FA','#FBBF24'][i % 5]
    }))

    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Winner">
        <div className="winner-card" tabIndex={-1}>
          <div className="winner-badge">🎉</div>
          <h3 className="winner-title">{playerName} Wins!</h3>
          <p className="winner-name">Score: {points}</p>

          <div className="game-actions" style={{marginTop: 32}}>
            <button className="btn btn-primary" style={{flex: 1}} onClick={() => { onClose(); handleResetBoard() }}>Play Again</button>
            <button className="btn btn-secondary" style={{flex: 1}} onClick={() => { onClose(); }}>Close</button>
          </div>

          <div className="confetti-wrap" aria-hidden>
            {confetti.map(c => (
              <span
                key={c.key}
                className="confetti"
                style={{ left: c.left, background: c.bg, animationDelay: c.delay }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='app-root'>
        {!started ? (
          <div className="modal-overlay start-menu">
            <div className="menu-card" role="dialog" aria-modal="true" aria-labelledby="start-title">
              <div className="game-logo" aria-hidden>🎮</div>
              <h2 id="start-title">Tic-Tac-Toe</h2>
              <p>A premium classic experience</p>

              {!gameMode ? (
                <>
                  <button onClick={() => setGameMode('pvp')} className="big-btn btn-primary">
                    <span className="mode-icon">👥</span> Play vs Friend
                  </button>
                  <button onClick={() => setGameMode('pva')} className="big-btn btn-primary">
                    <span className="mode-icon">🤖</span> Play vs AI
                  </button>

                  <div className="sound-toggle-wrapper" style={{marginTop: 24, padding: 12}}>
                    <label className="toggle-label" style={{display: 'flex', gap: 12, alignItems: 'center', width: '100%', cursor: 'pointer'}}>
                      <input 
                        type="checkbox" 
                        checked={timedMode}
                        onChange={(e) => setTimedMode(e.target.checked)}
                        style={{width: 20, height: 20}}
                      />
                      <span className="toggle-text" style={{fontSize: 14, fontWeight: 600}}>⏱️ Timed Mode</span>
                    </label>
                  </div>
                  {timedMode && (
                    <div style={{marginBottom: 24, textAlign: 'left'}}>
                      <label style={{fontSize: 12, fontWeight: 700, color: 'var(--muted)'}}>Time per move: {timePerMove}s</label>
                      <input 
                        type="range" min="5" max="30" value={timePerMove}
                        onChange={(e) => setTimePerMove(parseInt(e.target.value))}
                        className="volume-slider" style={{marginTop: 8}}
                      />
                    </div>
                  )}
                  <button onClick={handleResetScore} className="btn btn-secondary" style={{width: '100%', marginTop: 12}}>Reset Score</button>
                </>
              ) : gameMode === 'pvp' ? (
                <>
                  <input
                    value={names.X} onChange={(e) => handleNameChange('X', e.target.value)}
                    placeholder="Player X Name" className="input-box"
                  />
                  <input
                    value={names.O} onChange={(e) => handleNameChange('O', e.target.value)}
                    placeholder="Player O Name" className="input-box"
                  />
                  <button onClick={() => startGame('pvp')} className="big-btn btn-primary" style={{marginTop: 8}}>Start Game</button>
                  <button onClick={() => setGameMode(null)} className="big-btn btn-secondary">Back</button>
                </>
              ) : (
                <>
                  <input
                    value={names.X} onChange={(e) => handleNameChange('X', e.target.value)}
                    placeholder="Your Name" className="input-box"
                  />
                  <div style={{display: 'flex', gap: 8, marginBottom: 24, marginTop: 12}}>
                    {['easy', 'medium', 'hard'].map(level => (
                      <button 
                        key={level}
                        className={`btn ${difficulty === level ? 'btn-primary' : 'btn-secondary'}`}
                        style={{flex: 1, padding: '10px 0', fontSize: 13, textTransform: 'capitalize'}}
                        onClick={() => setDifficulty(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => startGame('pva')} className="big-btn btn-primary">Start Game</button>
                  <button onClick={() => setGameMode(null)} className="big-btn btn-secondary">Back</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="app-bar">
              <h1 className="title">Tic-Tac-Toe</h1>
              <span className="mode-badge">{gameMode === 'pva' ? `vs AI (${difficulty})` : 'vs Friend'}</span>
            </div>

            {timedMode && (
              <div className={`timer-display ${timeRemaining <= 3 ? 'warning' : ''}`}>
                ⏱️ {timeRemaining}s
              </div>
            )}

            <div className="game-area">
              <div className="scoreboard-wrapper">
                <div className="scoreboard">
                  <div className={`score-player player-x ${xIsNext && !winner ? 'active' : ''}`}>
                    <div className="avatar">X</div>
                    <div className="score-info">
                      <span className="score-name">{names.X || 'Player X'}</span>
                      <span className="score-points">{score.X}</span>
                    </div>
                  </div>
                  <div className="score-divider">:</div>
                  <div className={`score-player player-o ${!xIsNext && !winner ? 'active' : ''}`}>
                    <div className="score-info" style={{alignItems: 'flex-end'}}>
                      <span className="score-name">{names.O || 'Player O'}</span>
                      <span className="score-points">{score.O}</span>
                    </div>
                    <div className="avatar">O</div>
                  </div>
                </div>
              </div>

              <Board squares={squares} onClick={handleClick} lastMove={lastMove} winningLine={winningLine} />

              <div className="status-text">
                {winner ? `🎉 Winner: ${names[winner]} (${winner})` : aiThinking ? '🤖 AI is thinking...' : `Your turn, ${xIsNext ? names.X : names.O}`}
              </div>

              <div className="game-actions">
                <button onClick={handleUndo} disabled={!canUndo || aiThinking} className="btn">↶ Undo</button>
                <button onClick={handleRedo} disabled={!canRedo || aiThinking} className="btn">↷ Redo</button>
                <button onClick={handleResetBoard} className="btn">Reset</button>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bottom-nav">
              <button className="nav-item" onClick={() => setShowStats(true)}>
                <span className="nav-icon">📊</span>
                <span>Stats</span>
              </button>
              <button className="nav-item" onClick={() => setShowAchievements(true)}>
                <span className="nav-icon">🏅</span>
                <span>Badges</span>
              </button>
              <button className="nav-item main-action" onClick={editNames}>
                <span className="nav-icon">✏️</span>
                <span>Edit</span>
              </button>
              <button className="nav-item" onClick={() => setShowSettings(true)}>
                <span className="nav-icon">⚙️</span>
                <span>Settings</span>
              </button>
              <button className="nav-item" onClick={() => setDarkMode(!darkMode)}>
                <span className="nav-icon">{darkMode ? '☀️' : '🌙'}</span>
                <span>Theme</span>
              </button>
            </div>
          </>
        )}
      </div>

      <WinnerModal open={showWinnerModal && Boolean(winner)} onClose={() => setShowWinnerModal(false)} winner={winner} />
      <StatsModal open={showStats} onClose={() => setShowStats(false)} />
      <AchievementsModal open={showAchievements} onClose={() => setShowAchievements(false)} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
