import { useEffect, useState } from 'react'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const COLORS = ['#f472b6', '#c084fc', '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa']
const prefersReducedMotion = getPrefersReducedMotion()

export default function Confetti({ trigger }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!trigger || prefersReducedMotion) return
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      duration: 2 + Math.random() * 2,
    }))
    setPieces(newPieces)
    const timer = setTimeout(() => setPieces([]), 4000)
    return () => clearTimeout(timer)
  }, [trigger])

  if (pieces.length === 0) return null

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
