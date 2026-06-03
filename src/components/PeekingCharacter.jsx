import { useState, useEffect, useRef, useCallback } from 'react'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'
import { useIsMobile } from '../hooks/useIsMobile'

import cinnamoroll1 from '../assets/sanrio/cinnamoroll-1.png'
import cinnamoroll2 from '../assets/sanrio/cinnamoroll-2.png'
import cinnamoroll3 from '../assets/sanrio/cinnamoroll-3.png'
import helloKitty1 from '../assets/sanrio/hello-kitty-1.png'
import helloKitty2 from '../assets/sanrio/hello-kitty-2.png'
import helloKitty3 from '../assets/sanrio/hello-kitty-3.png'
import keroppi1 from '../assets/sanrio/keroppi-1.png'
import keroppi2 from '../assets/sanrio/keroppi-2.png'
import keroppi3 from '../assets/sanrio/keroppi-3.png'
import kuromi1 from '../assets/sanrio/kuromi-1.png'
import kuromi2 from '../assets/sanrio/kuromi-2.png'
import kuromi3 from '../assets/sanrio/kuromi-3.png'
import littleTwinStars1 from '../assets/sanrio/little-twin-stars-1.png'
import littleTwinStars2 from '../assets/sanrio/little-twin-stars-2.png'
import littleTwinStars3 from '../assets/sanrio/little-twin-stars-3.png'
import myMelody1 from '../assets/sanrio/my-melody-1.png'
import myMelody2 from '../assets/sanrio/my-melody-2.png'
import myMelody3 from '../assets/sanrio/my-melody-3.png'
import pochacco1 from '../assets/sanrio/pochacco-1.png'
import pochacco2 from '../assets/sanrio/pochacco-2.png'
import pochacco3 from '../assets/sanrio/pochacco-3.png'
import pompompurin1 from '../assets/sanrio/pompompurin-1.png'
import pompompurin2 from '../assets/sanrio/pompompurin-2.png'
import pompompurin3 from '../assets/sanrio/pompompurin-3.png'

const ALL_CHARS = [
  cinnamoroll1, cinnamoroll2, cinnamoroll3,
  helloKitty1, helloKitty2, helloKitty3,
  keroppi1, keroppi2, keroppi3,
  kuromi1, kuromi2, kuromi3,
  littleTwinStars1, littleTwinStars2, littleTwinStars3,
  myMelody1, myMelody2, myMelody3,
  pochacco1, pochacco2, pochacco3,
  pompompurin1, pompompurin2, pompompurin3,
]

const MESSAGES = [
  'がんばって！', 'すごい！', '上手！', 'かわいい♡',
  'ファイト！', 'もうちょっと！', 'にゃ〜♪', 'えへへ♡',
  '一緒に！', '楽しい！', 'やったね！', 'おつかれ！',
  'わーい！', 'ふふふ♪', 'だいすき！', 'よくできた！',
]

// peek from right side, from left side, or from bottom
const PEEK_MODES = ['right', 'left', 'bottom']

const prefersReducedMotion = getPrefersReducedMotion()

const PEEK_DURATION = 4200  // ms the character is visible

function rand(min, max) {
  return min + Math.random() * (max - min)
}

export default function PeekingCharacter() {
  const isMobile = useIsMobile(600)
  const [config, setConfig] = useState(null)   // { src, posStyle, animation, flipped }
  const [bouncing, setBouncing] = useState(false)
  const [msg, setMsg] = useState(null)
  const hideTimerRef = useRef(null)
  const bounceTimerRef = useRef(null)
  const intervalRef = useRef(null)

  const showPeek = useCallback(() => {
    const src = ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)]
    const mode = PEEK_MODES[Math.floor(Math.random() * PEEK_MODES.length)]

    let posStyle, animation, flipped

    if (mode === 'right') {
      // peek from right edge at random vertical position (avoid top nav + bottom nav)
      const topPct = rand(18, 68)
      posStyle = { right: 0, top: `${topPct}%` }
      animation = 'peekIn'
      flipped = false
    } else if (mode === 'left') {
      const topPct = rand(18, 68)
      posStyle = { left: 0, top: `${topPct}%` }
      animation = 'peekInLeft'
      flipped = true
    } else {
      // peek from bottom at random horizontal position
      const leftPct = rand(10, 75)
      posStyle = { bottom: 0, left: `${leftPct}%` }
      animation = 'peekFromBottom'
      flipped = false
    }

    setBouncing(false)
    setMsg(null)
    setConfig({ src, posStyle, animation, flipped })

    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      setConfig(null)
      setMsg(null)
      setBouncing(false)
    }, PEEK_DURATION)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion || isMobile) {
      setConfig(null)
      setMsg(null)
      setBouncing(false)
      return undefined
    }

    // first peek after 6-12s
    const initialTimer = setTimeout(() => {
      showPeek()
      // then every 14-28s
      intervalRef.current = setInterval(showPeek, rand(14000, 28000))
    }, rand(6000, 12000))

    return () => {
      clearTimeout(initialTimer)
      clearTimeout(hideTimerRef.current)
      clearTimeout(bounceTimerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isMobile, showPeek])

  const handleClick = useCallback(() => {
    if (!config) return
    setBouncing(true)
    setMsg(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
    clearTimeout(bounceTimerRef.current)
    bounceTimerRef.current = setTimeout(() => {
      setBouncing(false)
      setMsg(null)
    }, 1600)
  }, [config])

  if (prefersReducedMotion || isMobile || !config) return null

  const isBottom = config.animation === 'peekFromBottom'

  return (
    <div
      style={{
        position: 'fixed',
        ...config.posStyle,
        zIndex: 50,
        pointerEvents: 'none',
        animation: `${config.animation} ${PEEK_DURATION}ms ease-in-out forwards`,
      }}
    >
      {/* speech bubble */}
      {msg && (
        <div style={{
          position: 'absolute',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(8px)',
          borderRadius: 14,
          padding: '5px 10px',
          fontSize: '0.82rem',
          fontWeight: 900,
          color: '#c084fc',
          whiteSpace: 'nowrap',
          boxShadow: '0 3px 12px rgba(192,132,252,0.3)',
          pointerEvents: 'none',
          ...(isBottom
            ? { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 }
            : config.posStyle.right !== undefined
              ? { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 }
              : { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 }
          ),
        }}>
          {msg}
        </div>
      )}

      {/* character image — this part is clickable */}
      <img
        src={config.src}
        alt=""
        onClick={handleClick}
        style={{
          width: 68,
          height: 'auto',
          display: 'block',
          filter: 'drop-shadow(0 2px 10px rgba(236,72,153,0.25))',
          transform: config.flipped ? 'scaleX(-1)' : 'none',
          cursor: 'pointer',
          pointerEvents: 'auto',
          animation: bouncing ? 'peekCharBounce 0.45s ease-in-out 2' : 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />
    </div>
  )
}
