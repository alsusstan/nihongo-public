import { useState, useEffect, useRef, useCallback } from 'react'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

// Fetches KanjiVG SVG data and renders stroke-by-step diagrams
const KANJIVG_BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/'

// Cache fetched SVG data in memory
const svgCache = {}

// Check once at module load — avoids hook-order issues
const prefersReducedMotion = getPrefersReducedMotion()

function parseStrokes(svgText) {
  if (typeof DOMParser === 'undefined') return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  // KanjiVG stores strokes as <path> elements inside StrokePaths group
  const paths = doc.querySelectorAll('path[d]')
  return Array.from(paths).map(p => ({
    d: p.getAttribute('d'),
    id: p.getAttribute('id') || '',
  }))
}

export default function StrokeOrder({ kanji, size = 200, autoPlay = false, onError }) {
  const [strokes, setStrokes] = useState([])
  const [step, setStep] = useState(0) // 0 = all visible
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [animating, setAnimating] = useState(false)
  const animRef = useRef(null)
  const delayRef = useRef(null)
  const containerRef = useRef(null)
  const onErrorRef = useRef(onError)
  useEffect(() => { onErrorRef.current = onError })
  const visibleRef = useRef(typeof document === 'undefined' ? true : !document.hidden)
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const handler = () => { visibleRef.current = !document.hidden }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // Fetch SVG data
  useEffect(() => {
    if (!kanji) return
    setLoading(true)
    setError(false)
    setStep(0)
    setAnimating(false)
    if (animRef.current) clearInterval(animRef.current)

    const hex = kanji.codePointAt(0).toString(16).padStart(5, '0')
    const url = `${KANJIVG_BASE}${hex}.svg`

    if (svgCache[kanji]) {
      setStrokes(svgCache[kanji])
      setLoading(false)
      return
    }

    if (typeof fetch === 'undefined' || typeof AbortController === 'undefined') {
      setError(true)
      setLoading(false)
      if (onErrorRef.current) onErrorRef.current(kanji)
      return
    }

    let cancelled = false
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    fetch(url, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.text()
      })
      .then(text => {
        if (cancelled) return
        const parsed = parseStrokes(text)
        if (parsed.length === 0) throw new Error('No strokes found')
        svgCache[kanji] = parsed
        setStrokes(parsed)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
        if (onErrorRef.current) onErrorRef.current(kanji)
      })
      .finally(() => clearTimeout(timeout))

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timeout)
    }
  }, [kanji])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current)
      clearTimeout(delayRef.current)
    }
  }, [])

  // Keep a stable ref to playAnimation for use in IntersectionObserver
  const playRef = useRef(null)

  const playAnimation = useCallback(() => {
    if (animating || strokes.length === 0) return
    setAnimating(true)
    setStep(1)
    let current = 1
    animRef.current = setInterval(() => {
      if (!visibleRef.current) return // pause when tab hidden
      current++
      if (current > strokes.length) {
        clearInterval(animRef.current)
        animRef.current = null
        setAnimating(false)
        setStep(0) // show all at the end
      } else {
        setStep(current)
      }
    }, 600)
  }, [animating, strokes.length])

  // Update stable ref whenever playAnimation changes
  useEffect(() => { playRef.current = playAnimation }, [playAnimation])

  // Auto-play when scrolled into view
  useEffect(() => {
    if (!autoPlay || prefersReducedMotion || strokes.length === 0 || loading) return
    if (typeof IntersectionObserver === 'undefined') return
    const hasPlayed = { current: false }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true
          clearTimeout(delayRef.current)
          delayRef.current = setTimeout(() => playRef.current?.(), 400)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => {
      clearTimeout(delayRef.current)
      observer.disconnect()
    }
  }, [autoPlay, strokes.length, loading])

  if (loading) {
    return (
      <div style={styles.container} aria-busy="true" aria-label="loading stroke order">
        <div style={{ ...styles.box, width: size, height: size }}>
          <span style={styles.loadingText}>loading...</span>
        </div>
      </div>
    )
  }

  if (error || strokes.length === 0) {
    return null // silently hide if no SVG available
  }

  const viewBox = "0 0 109 109" // KanjiVG standard viewBox

  return (
    <div style={styles.container} ref={containerRef}>
      {/* Main SVG display */}
      <div style={{ ...styles.svgWrap, width: size, height: size }}>
        <svg
          viewBox={viewBox}
          width={size}
          height={size}
          style={styles.svg}
          aria-hidden="true"
        >
          {/* Grid lines */}
          <line x1="54.5" y1="0" x2="54.5" y2="109" stroke="rgba(192,132,252,0.15)" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1="0" y1="54.5" x2="109" y2="54.5" stroke="rgba(192,132,252,0.15)" strokeWidth="0.5" strokeDasharray="3,3" />

          {/* Stroke paths */}
          {strokes.map((s, i) => {
            const isVisible = step === 0 || i < step
            const isCurrent = step > 0 && i === step - 1
            return (
              <path
                key={i}
                d={s.d}
                fill="none"
                stroke={isCurrent ? '#ec4899' : isVisible ? 'var(--text-main, #1a1a2e)' : 'rgba(200,200,200,0.2)'}
                strokeWidth={isCurrent ? 4 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: prefersReducedMotion ? 'none' : 'all 0.3s ease',
                  opacity: isVisible ? 1 : 0.1,
                }}
              />
            )
          })}

          {/* Stroke number label on current stroke */}
          {step > 0 && strokes[step - 1] && (() => {
            // Get approximate start position from path data
            const d = strokes[step - 1].d
            const match = d.match(/M\s*([\d.]+)[,\s]+([\d.]+)/)
            if (!match) return null
            const x = parseFloat(match[1])
            const y = parseFloat(match[2])
            return (
              <g>
                <circle cx={x} cy={y} r="7" fill="#ec4899" />
                <text x={x} y={y + 3.5} textAnchor="middle" fill="white" fontSize="8" fontWeight="800">
                  {step}
                </text>
              </g>
            )
          })()}
        </svg>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{ ...styles.ctrlBtn, ...(step === 0 ? styles.ctrlDisabled : {}) }}
          aria-label="previous stroke"
        >
          ‹
        </button>
        <button
          onClick={playAnimation}
          disabled={animating}
          style={{ ...styles.playBtn, ...(animating ? styles.ctrlDisabled : {}) }}
          aria-label="play stroke animation"
        >
          {animating ? '...' : '▶'}
        </button>
        <span style={styles.stepText}>
          {step === 0 ? `${strokes.length} strokes` : `${step} / ${strokes.length}`}
        </span>
        <button
          onClick={() => setStep(s => Math.min(strokes.length, s + 1))}
          disabled={step === strokes.length}
          style={{ ...styles.ctrlBtn, ...(step === strokes.length ? styles.ctrlDisabled : {}) }}
          aria-label="next stroke"
        >
          ›
        </button>
        <button
          onClick={() => setStep(0)}
          style={styles.ctrlBtn}
          title="show all"
          aria-label="show all strokes"
        >
          ⟳
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  svgWrap: {
    background: 'var(--tint-heavy)',
    borderRadius: 16,
    padding: 8,
    boxShadow: '0 2px 12px rgba(168, 85, 247, 0.08)',
    border: '1.5px solid rgba(192,132,252,0.15)',
  },
  svg: {
    display: 'block',
  },
  loadingText: {
    fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '100%',
  },
  box: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--tint-heavy)', borderRadius: 16,
    border: '1.5px solid rgba(192,132,252,0.15)',
  },
  controls: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  ctrlBtn: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(168, 85, 247, 0.1)', border: 'none',
    cursor: 'pointer', fontSize: '1rem', fontWeight: 800,
    color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  },
  playBtn: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800,
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  },
  ctrlDisabled: {
    opacity: 0.3, cursor: 'default',
  },
  stepText: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)',
    minWidth: 60, textAlign: 'center',
  },
}
