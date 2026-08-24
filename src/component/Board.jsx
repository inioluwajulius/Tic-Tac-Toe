
import './Board.css'

export default function Board({ squares = [], onClick, lastMove, winningLine }) {
  // ensure squares is an array length 9
  const cells = Array.isArray(squares) ? squares : Array(9).fill(null)

  return (
    <div className='board' role='grid' aria-label='Tic Tac Toe board'>
      {cells.map((value, i) => {
        const isLast = lastMove === i
        const isWinnerCell = Array.isArray(winningLine) && winningLine.includes(i)
        const classes = [
          'cell',
          value ? 'played' : '',
          value === 'X' ? 'x' : '',
          value === 'O' ? 'o' : '',
          isLast ? 'last' : '',
          isWinnerCell ? 'winner' : ''
        ].join(' ').trim()
        return (
          <button
            key={i}
            type='button'                     // prevent accidental form submits
            className={classes}
            aria-label={`Cell ${i + 1} ${value ? `: ${value}` : ''}`}
            onClick={() => onClick && onClick(i)}   // guard in case onClick is undefined
          >
            {value}
          </button>
        )
      })}
    </div>
  )
}