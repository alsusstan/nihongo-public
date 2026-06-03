import { useState, useEffect, useRef } from 'react'
import { getStoredFlag } from '../utils/localSettings'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

export default function QuizCountdown({ onComplete }) {
  const skipCountdown = getStoredFlag('nihongo-countdown', '0', false)
  const [count, setCount] = useState(skipCountdown ? 0 : 3)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    if (skipCountdown) { onCompleteRef.current(); return }
    if (count === 0) {
      const t = setTimeout(() => onCompleteRef.current(), 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCount(prev => prev - 1), 700)
    return () => clearTimeout(t)
  }, [count, skipCountdown])

  return (
    <div style={s.overlay} role="status" aria-live="assertive" aria-atomic="true">
      <div style={s.countWrap} className="animate-pop" key={count}>
        <span style={{
          ...s.count,
          color: count === 0 ? 'var(--correct-text)' : count === 1 ? 'var(--incorrect-text)' : count === 2 ? 'var(--gold-text)' : '#8b5cf6',
        }}>
          {count === 0 ? 'GO!' : count}
        </span>
        {count > 0 && (
          <div style={s.ring}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke="rgba(192,132,252,0.15)" strokeWidth="4"
              />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke={count === 1 ? '#f43f5e' : count === 2 ? 'var(--gold-text)' : '#8b5cf6'}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${276.5}`}
                strokeDashoffset={`${276.5 * (1 - count / 3)}`}
                transform="rotate(-90 50 50)"
                style={{ transition: prefersReducedMotion ? 'none' : 'stroke-dashoffset 0.6s ease, stroke 0.3s' }}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.15)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 100,
  },
  countWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  count: {
    fontSize: '3rem',
    fontWeight: 900,
    zIndex: 2,
    textShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  ring: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
  },
}
