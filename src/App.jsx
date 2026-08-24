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
      <div className="winner-modal" role="dialog" aria-modal="true" aria-label="Statistics">
        <div className="stats-card" tabIndex={-1}>
          <h3 className="stats-title">📊 Game Statistics</h3>
          
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-value">{totalGames}</div>
              <div className="stat-label">Total Games</div>
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
          
          <div className="stats-actions">
            <button className="primary-btn" onClick={onClose}>Close</button>
            <button className="secondary-btn" onClick={() => { if(confirm('Clear all game history?')) setGameHistory([]) }}>Clear History</button>
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
      <div className="winner-modal" role="dialog" aria-modal="true" aria-label="Achievements">
        <div className="achievements-card" tabIndex={-1}>
          <h3 className="achievements-title">🏅 Achievements</h3>
          <div className="achievements-grid">
            {achievementsList.map(ach => (
              <div key={ach.id} className={`achievement-badge ${achievements[ach.id] ? 'unlocked' : 'locked'}`}>
                <div className="badge-emoji">{ach.emoji}</div>
                <div className="badge-title">{ach.title}</div>
                <div className="badge-desc">{ach.desc}</div>
              </div>
            ))}
          </div>
          <button className="primary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  // Settings Modal
  function SettingsModal({ open, onClose }) {
    if (!open) return null

    const themes = ['indigo', 'purple', 'blue', 'coral', 'green']

    return (
      <div className="winner-modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="settings-card" tabIndex={-1}>
          <h3 className="settings-title">⚙️ Settings</h3>
          
          <div className="settings-section">
            <h4 className="section-title">🎨 Theme</h4>
            <div className="theme-selector">
              {themes.map(t => (
                <button
                  key={t}
                  className={`theme-btn ${theme === t ? 'active' : ''}`}
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
            <h4 className="section-title">🔊 Sound Settings</h4>
            <label className="sound-toggle">
              <input 
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-text">Enable Sound Effects</span>
            </label>
            
            <div className="volume-control">
              <label>Sound Volume: {Math.round(soundVolume * 100)}%</label>
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

          <div className="settings-actions">
            <button className="primary-btn" onClick={onClose}>Close</button>
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
      <div className="winner-modal" role="dialog" aria-modal="true" aria-label="Winner">
        <div className="winner-card" tabIndex={-1}>
          <div className="winner-badge">🎉</div>
          <h3 className="winner-title">Winner</h3>
          <p className="winner-name">{playerName} <span className="winner-mark">({winner})</span></p>
          <p className="winner-score">Score: {points}</p>

          <div className="winner-actions">
            <button className="primary-btn" onClick={() => { onClose(); handleResetBoard() }}>Play Again</button>
            <button className="secondary-btn" onClick={() => { onClose(); }}>Close</button>
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
        <h1 className='title'>Tic‑Tac‑Toe 🎮</h1>

        {!started ? (
          <div className="start-modal">
            <div className="start-card" role="dialog" aria-modal="true" aria-labelledby="start-title">
              <div className="avatar" aria-hidden>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="6" fill="#4F46E5"/>
                  <path d="M12 12a3 3 0 100-6 3 3 0 000 6z" fill="#fff"/>
                  <path d="M4 19a8 8 0 0116 0" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>

              <h2 id="start-title">Welcome to Tic‑Tac‑Toe</h2>
              <p className="muted">Choose your game mode to begin.</p>

              {!gameMode ? (
                <>
                  <div className="mode-selector">
                    <button 
                      onClick={() => setGameMode('pvp')}
                      className="mode-btn"
                    >
                      <span className="mode-icon">👥</span>
                      <span className="mode-label">Player vs Player</span>
                      <span className="mode-desc">Play with a friend</span>
                    </button>
                    <button 
                      onClick={() => setGameMode('pva')}
                      className="mode-btn"
                    >
                      <span className="mode-icon">🤖</span>
                      <span className="mode-label">Player vs AI</span>
                      <span className="mode-desc">Challenge the AI</span>
                    </button>
                  </div>

                  <div className="timed-mode-toggle">
                    <label className="toggle-label">
                      <input 
                        type="checkbox" 
                        checked={timedMode}
                        onChange={(e) => setTimedMode(e.target.checked)}
                        className="toggle-input"
                      />
                      <span className="toggle-text">⏱️ Enable Timed Mode</span>
                    </label>
                    {timedMode && (
                      <div className="time-selector">
                        <label>Time per move: {timePerMove}s</label>
                        <input 
                          type="range"
                          min="5"
                          max="30"
                          value={timePerMove}
                          onChange={(e) => setTimePerMove(parseInt(e.target.value))}
                          className="time-slider"
                        />
                      </div>
                    )}
                  </div>

                  <button onClick={handleResetScore} className="secondary-btn">Reset Score</button>
                </>
              ) : gameMode === 'pvp' ? (
                <>
                  <div className="input-grid">
                    <label className="input-group">
                      <span className="label-small">Player X</span>
                      <input
                        value={names.X}
                        onChange={(e) => handleNameChange('X', e.target.value)}
                        placeholder="Enter player X name"
                        className="input"
                      />
                    </label>

                    <label className="input-group">
                      <span className="label-small">Player O</span>
                      <input
                        value={names.O}
                        onChange={(e) => handleNameChange('O', e.target.value)}
                        placeholder="Enter player O name"
                        className="input"
                      />
                    </label>
                  </div>

                  <div className="actions">
                    <button onClick={() => startGame('pvp')} className="primary-btn">Start Game</button>
                    <button onClick={() => setGameMode(null)} className="secondary-btn">Back</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-grid">
                    <label className="input-group">
                      <span className="label-small">Your Name</span>
                      <input
                        value={names.X}
                        onChange={(e) => handleNameChange('X', e.target.value)}
                        placeholder="Enter your name"
                        className="input"
                      />
                    </label>
                  </div>

                  <div className="difficulty-selector">
                    <p className="label-small">Choose Difficulty</p>
                    <div className="difficulty-buttons">
                      <button 
                        className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                        onClick={() => setDifficulty('easy')}
                      >
                        Easy
                      </button>
                      <button 
                        className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                        onClick={() => setDifficulty('medium')}
                      >
                        Medium
                      </button>
                      <button 
                        className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                        onClick={() => setDifficulty('hard')}
                      >
                        Hard
                      </button>
                    </div>
                  </div>

                  <div className="actions">
                    <button onClick={() => startGame('pva')} className="primary-btn">Start Game</button>
                    <button onClick={() => setGameMode(null)} className="secondary-btn">Back</button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className='top-controls'>
              <button 
                onClick={() => setShowStats(true)} 
                className='icon-btn'
                aria-label="View statistics"
                title="View statistics"
              >
                📊 View Statistics
              </button>
              <button 
                onClick={() => setShowAchievements(true)} 
                className='icon-btn'
                aria-label="View achievements"
                title="View achievements"
              >
                🏅
              </button>
              <button 
                onClick={() => setShowSettings(true)} 
                className='icon-btn'
                aria-label="Settings"
                title="Settings"
              >
                ⚙️
              </button>
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className='icon-btn'
                aria-label="Toggle dark mode"
                title="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>

            {timedMode && (
              <div className={`timer-display ${timeRemaining <= 3 ? 'warning' : ''}`}>
                ⏱️ {timeRemaining}s
              </div>
            )}
            <div className='controls'>
              <div className='name-inputs' style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div><strong>{names.X}</strong></div>
                <div><strong>{names.O}</strong></div>
              </div>

              <div className='scoreboard'>
                <div className='score-item'>
                  <strong>{names.X}</strong>
                  <span className='score-value'>{score.X}</span>
                </div>
                <div className='score-item'>
                  <strong>{names.O}</strong>
                  <span className='score-value'>{score.O}</span>
                </div>
              </div>

              <div className='buttons'>
                <button onClick={handleUndo} disabled={!canUndo || aiThinking} className='btn' title="Undo move">↶ Undo</button>
                <button onClick={handleRedo} disabled={!canRedo || aiThinking} className='btn' title="Redo move">↷ Redo</button>
                <button onClick={handleResetBoard} className='btn'>Reset Board</button>
                <button onClick={editNames} className='btn outline'>Edit Names</button>
              </div>
            </div>

            <Board
              squares={squares}
              onClick={handleClick}
              lastMove={lastMove}
              winningLine={winningLine}
            />

            <p className='status'>
              {winner ? `🎉 Winner: ${names[winner]} (${winner})` : aiThinking ? '🤖 AI is thinking...' : `Next: ${xIsNext ? names.X : names.O}`}
            </p>
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
