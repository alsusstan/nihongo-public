import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { kanji, kanjiLessonInfo } from '../data/kanji'
import { strokeData } from '../data/strokeOrder'
import StrokeOrder from '../components/StrokeOrder'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import ShareResult from '../components/ShareResult'
import { kanaToRomaji } from '../utils/kanaToRomaji'
import { getStoredBkbUnlocked } from '../utils/localSettings'

function readingToRomaji(reading) {
  if (!reading) return ''
  return reading
    .split(' / ')
    .map(part => kanaToRomaji(part.replace(/[〜～]/g, '').replace(/・/g, '')))
    .join(' / ')
}

// ─── Phases ───
const PHASE = { SETUP: 'setup', STUDY: 'study', QUIZ: 'quiz' }

// Parse "日曜日 (nichiyoubi) воскресенье" → { word, romaji, meaning }
function parseKeyword(kw) {
  const match = kw.match(/^(.+?)\s*\(([^)]+)\)\s*(.*)$/)
  if (match) return { word: match[1].trim(), romaji: match[2].trim(), meaning: match[3].trim() }
  return { word: kw, romaji: '', meaning: '' }
}

// ─── Shuffle helper ───
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Drawing Canvas Component ───
function DrawingCanvas({ width = 300, height = 300, onClear }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPos = useRef(null)
  const clearCountRef = useRef(0)

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const drawGrid = useCallback((ctx) => {
    ctx.clearRect(0, 0, width, height)
    // background
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    // grid lines
    ctx.strokeStyle = 'rgba(200, 180, 210, 0.25)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])

    // cross lines
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // diagonal lines
    ctx.strokeStyle = 'rgba(200, 180, 210, 0.12)'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(width, height)
    ctx.moveTo(width, 0)
    ctx.lineTo(0, height)
    ctx.stroke()

    ctx.setLineDash([])

    // border
    ctx.strokeStyle = 'rgba(168, 106, 154, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, width, height)
  }, [width, height])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    drawGrid(ctx)
  }, [drawGrid])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    drawGrid(ctx)
    clearCountRef.current++
  }

  // expose clear externally (declared after clearCanvas to avoid TDZ reference)
  useEffect(() => {
    if (onClear) onClear(() => clearCanvas())
  })

  const startDraw = (e) => {
    e.preventDefault()
    drawing.current = true
    lastPos.current = getPos(e)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const pos = getPos(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#4a1942'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = (e) => {
    e.preventDefault()
    drawing.current = false
    lastPos.current = null
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={s.canvas}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={startDraw}
      onTouchMove={draw}
      onTouchEnd={endDraw}
    />
  )
}

// ─── Main Component ───
export default function KanjiPractice() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const viewportWidth = typeof window === 'undefined' ? 348 : window.innerWidth
  const canvasSize = isMobile ? Math.min(300, viewportWidth - 48) : (isTablet ? 360 : 300)
  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState(PHASE.SETUP)

  // setup state — pre-select lesson from URL param if present
  const [selectedLessons, setSelectedLessons] = useState(() => {
    const lessonParam = searchParams.get('lesson')
    if (lessonParam) {
      const id = parseInt(lessonParam, 10)
      if (kanjiLessonInfo.some(l => l.id === id)) return [id]
    }
    // default: unlocked lessons only
    const unlocked = getStoredBkbUnlocked()
    return kanjiLessonInfo.filter(l => l.id <= unlocked).map(l => l.id)
  })
  const [mode, setMode] = useState('study') // 'study' | 'quiz'
  const [count, setCount] = useState(10)

  // practice state
  const [deck, setDeck] = useState([])
  const [index, setIndex] = useState(0)
  const [showStrokeCount, setShowStrokeCount] = useState(false)
  const clearCanvasRef = useRef(null)

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const xpAwardedRef = useRef(false)

  // quiz state
  const [revealed, setRevealed] = useState(false)
  const [scores, setScores] = useState({ knew: 0, almost: 0, didnt: 0 })
  const [quizDone, setQuizDone] = useState(false)
  const [showCheck, setShowCheck] = useState(false)

  // Award XP and save result when quiz is done
  useEffect(() => {
    if (quizDone && phase === PHASE.QUIZ && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      const total = scores.knew + scores.almost + scores.didnt
      if (total > 0) {
        saveQuizResult('kanji', { lessons: selectedLessons, score: scores.knew, total })
        const xp = calculateQuizXP(scores.knew, total)
        if (xp > 0) awardXP(xp, 'kanji practice', scores.knew === total && total > 0)
      }
    }
  }, [quizDone]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Setup handlers ───
  const toggleLesson = (id) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedLessons.length === kanjiLessonInfo.length) {
      setSelectedLessons([])
    } else {
      setSelectedLessons(kanjiLessonInfo.map(l => l.id))
    }
  }

  const startPractice = () => {
    if (selectedLessons.length === 0) return
    const pool = kanji.filter(k => selectedLessons.includes(k.lesson))
    const shuffled = shuffle(pool)
    const finalDeck = shuffled.slice(0, Math.min(count, shuffled.length))
    setDeck(finalDeck)
    setIndex(0)
    setRevealed(false)
    setShowStrokeCount(mode === 'study')
    setScores({ knew: 0, almost: 0, didnt: 0 })
    xpAwardedRef.current = false
    setQuizDone(false)
    setPhase(mode === 'study' ? PHASE.STUDY : PHASE.QUIZ)
  }

  const availableCount = kanji.filter(k => selectedLessons.includes(k.lesson)).length

  // ─── Navigation ───
  const goNext = () => {
    if (clearCanvasRef.current) clearCanvasRef.current()
    setShowStrokeCount(mode === 'study')
    setRevealed(false)
    setShowCheck(false)
    if (index < deck.length - 1) {
      setIndex(i => i + 1)
    }
  }

  const goPrev = () => {
    if (clearCanvasRef.current) clearCanvasRef.current()
    setShowStrokeCount(mode === 'study')
    setRevealed(false)
    setShowCheck(false)
    if (index > 0) {
      setIndex(i => i - 1)
    }
  }

  const clearCanvas = () => {
    if (clearCanvasRef.current) clearCanvasRef.current()
  }

  // ─── Quiz grading ───
  const grade = (level) => {
    setScores(prev => ({ ...prev, [level]: prev[level] + 1 }))
    if (clearCanvasRef.current) clearCanvasRef.current()
    setRevealed(false)
    if (index < deck.length - 1) {
      setIndex(i => i + 1)
    } else {
      setQuizDone(true)
    }
  }

  const current = deck[index]

  // ─── SETUP SCREEN ───
  if (phase === PHASE.SETUP) {
    return (
      <div className="page" style={s.page}>
        <div style={s.header} className="animate-fadeInUp">
          <h1 style={s.title}>
            <span>✍️</span> kanji writing practice
            <span style={s.titleJp}>漢字れんしゅう</span>
          </h1>
          <p style={s.subtitle}>practice drawing kanji from memory</p>
        </div>

        <div className="glass animate-fadeInUp" style={{ ...s.setupCard, ...(isTablet ? s.practiceCardTablet : {}) }}>
          {/* lesson selection */}
          <div style={s.sectionTitle}>choose lessons</div>
          <div style={s.lessonChips}>
            <button
              className={selectedLessons.length === kanjiLessonInfo.length ? 'btn btn-cute' : 'btn btn-secondary'}
              style={s.chip}
              onClick={selectAll}
            >
              all
            </button>
            {kanjiLessonInfo.map(l => (
              <button
                key={l.id}
                className={selectedLessons.includes(l.id) ? 'btn btn-cute' : 'btn btn-secondary'}
                style={s.chip}
                onClick={() => toggleLesson(l.id)}
              >
                {l.id}
              </button>
            ))}
          </div>
          {selectedLessons.length > 0 && (
            <p style={s.availableText}>{availableCount} kanji available</p>
          )}

          {/* mode selection */}
          <div style={{ ...s.sectionTitle, marginTop: 24 }}>mode</div>
          <div style={s.modeRow}>
            <button
              className={mode === 'study' ? 'btn btn-cute' : 'btn btn-secondary'}
              style={s.modeBtn}
              onClick={() => setMode('study')}
            >
              <span style={{ fontSize: '1.4rem' }}>📖</span>
              <span style={s.modeBtnLabel}>study</span>
              <span style={s.modeBtnDesc}>see kanji + draw</span>
            </button>
            <button
              className={mode === 'quiz' ? 'btn btn-cute' : 'btn btn-secondary'}
              style={s.modeBtn}
              onClick={() => setMode('quiz')}
            >
              <span style={{ fontSize: '1.4rem' }}>🧠</span>
              <span style={s.modeBtnLabel}>quiz</span>
              <span style={s.modeBtnDesc}>draw from memory</span>
            </button>
          </div>

          {/* count */}
          <div style={{ ...s.sectionTitle, marginTop: 24 }}>how many</div>
          <div style={s.countRow}>
            {[5, 10, 15, 20, 30].map(n => (
              <button
                key={n}
                className={count === n ? 'btn btn-cute' : 'btn btn-secondary'}
                style={s.countChip}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>

          {/* start */}
          <button
            className="btn btn-cute"
            style={s.startBtn}
            onClick={startPractice}
            disabled={selectedLessons.length === 0}
          >
            start {mode === 'study' ? 'studying' : 'quiz'} ✍️
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/kanji" style={s.linkBack}>
            ← back to kanji study
          </Link>
          <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
      </div>
    )
  }

  // ─── STUDY MODE ───
  if (phase === PHASE.STUDY && current) {
    return (
      <div className="page" style={s.page}>
        <div style={s.topBar} className="animate-fadeInUp">
          <button
            className="btn btn-secondary"
            style={s.smallBtn}
            onClick={() => setPhase(PHASE.SETUP)}
          >
            ← back
          </button>
          <span style={s.progress}>
            {index + 1} / {deck.length}
          </span>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', marginLeft: 'auto', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
        </div>

        <div style={s.progressBarTrack}>
          <div style={{ ...s.progressBarFill, width: `${((index + 1) / deck.length) * 100}%` }} className="progress-fill" />
        </div>

        <div
          className="glass animate-fadeInUp"
          style={{ ...s.studyCard, ...(isTablet ? s.practiceCardTablet : {}) }}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return
            const dx = e.changedTouches[0].clientX - touchStartX.current
            const dy = e.changedTouches[0].clientY - touchStartY.current
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
              if (dx > 0) goPrev()
              else goNext()
            }
            touchStartX.current = null
            touchStartY.current = null
          }}
        >
          {/* kanji display */}
          <div style={s.kanjiDisplay}>
            {current.kanji}
          </div>
          <div style={s.meaningText}>{current.meaning}</div>

          {/* readings */}
          <div style={s.readingsRow}>
            <div style={s.readingBox}>
              <span style={s.readingLabel}>ON</span>
              <span style={s.readingValue}>{current.on}</span>
              {readingToRomaji(current.on) && <span style={s.readingRomaji}>{readingToRomaji(current.on)}</span>}
            </div>
            <div style={s.readingBox}>
              <span style={s.readingLabel}>KUN</span>
              <span style={s.readingValue}>{current.kun}</span>
              {readingToRomaji(current.kun) && <span style={s.readingRomaji}>{readingToRomaji(current.kun)}</span>}
            </div>
          </div>

          {/* keywords / examples */}
          {current.keywords && current.keywords.length > 0 && (
            <div style={s.keywordsSection}>
              <div style={s.keywordsTitle}>examples</div>
              {current.keywords.map((kw, i) => {
                const { word, romaji, meaning } = parseKeyword(kw)
                return (
                  <div key={i} style={s.keywordItem}>
                    <span style={s.keywordWord}>{word}</span>
                    <span style={s.keywordRomaji}>{romaji}</span>
                    {meaning && <span style={s.keywordMeaning}>{meaning}</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* stroke order info */}
          {(() => {
            const sd = strokeData[current.kanji]
            return (
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn btn-secondary"
                  style={s.strokeBtn}
                  onClick={() => setShowStrokeCount(!showStrokeCount)}
                >
                  {showStrokeCount ? 'hide stroke order' : sd ? `stroke order (${sd.strokes} strokes)` : 'stroke order'}
                </button>
                {showStrokeCount && (
                  <div style={{ marginTop: 10 }}>
                    <StrokeOrder kanji={current.kanji} size={160} />
                  </div>
                )}
                {showStrokeCount && sd?.order?.length > 0 && (
                  <div style={s.strokeOrderList}>
                    {sd.order.map((stroke, i) => (
                      <div key={i} style={s.strokeOrderItem}>
                        <span style={s.strokeOrderNum}>{i + 1}</span>
                        <span style={s.strokeOrderDesc}>{stroke}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showStrokeCount && sd && sd.order.length === 0 && (
                  <div style={{ ...s.strokeInfo, marginTop: 8, fontSize: '0.72rem', color: 'var(--text-light)', textAlign: 'center' }}>
                    step-by-step guide available for lessons 1–10
                  </div>
                )}
                {showStrokeCount && !sd && (
                  <div style={s.strokeInfo}>
                    lesson {current.lesson} | {kanjiLessonInfo.find(l => l.id === current.lesson)?.topic}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* drawing area */}
        <div className="glass animate-fadeInUp" style={{ ...s.canvasCard, ...(isTablet ? s.practiceCardTablet : {}) }}>
          <div style={s.canvasLabel}>practice drawing</div>
          <div style={showCheck ? s.checkCompare : s.canvasOnlyWrap}>
            <div style={s.canvasWrap}>
              {!showCheck && <div style={s.ghostKanji}>{current.kanji}</div>}
              <DrawingCanvas
                width={canvasSize}
                height={canvasSize}
                onClear={(fn) => { clearCanvasRef.current = fn }}
              />
            </div>
            {showCheck && (
              <div style={s.checkReference}>
                <div style={s.checkRefLabel}>correct</div>
                <div style={s.checkRefKanji}>{current.kanji}</div>
              </div>
            )}
          </div>
          <div style={s.canvasBtnRow}>
            <button
              className="btn btn-secondary"
              style={s.clearBtn}
              onClick={() => { clearCanvas(); setShowCheck(false) }}
            >
              clear
            </button>
            <button
              className="btn btn-cute"
              style={s.clearBtn}
              onClick={() => setShowCheck(!showCheck)}
            >
              {showCheck ? 'hide' : 'check'} ✓
            </button>
          </div>
        </div>

        {/* navigation */}
        <div style={{ ...s.navRow, ...(isTablet ? s.navRowTablet : {}) }} className="animate-fadeInUp">
          <button
            className="btn btn-secondary"
            style={s.navBtn}
            onClick={goPrev}
            disabled={index === 0}
          >
            ← prev
          </button>
          <button
            className="btn btn-cute"
            style={s.navBtn}
            onClick={goNext}
            disabled={index === deck.length - 1}
          >
            next →
          </button>
        </div>
      </div>
    )
  }

  // ─── QUIZ MODE — done ───
  if (phase === PHASE.QUIZ && quizDone) {
    const total = scores.knew + scores.almost + scores.didnt
    const pct = total > 0 ? Math.round((scores.knew / total) * 100) : 0

    return (
      <div className="page" style={s.page}>
        <div className="glass animate-fadeInUp" style={{ ...s.resultsCard, ...(isTablet ? s.resultsCardTablet : {}) }}>
          <div style={s.resultsEmoji}>
            {pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📝'}
          </div>
          <h2 style={s.resultsTitle}>quiz complete!</h2>
          <div style={s.resultsGrid}>
            <div style={s.resultItem}>
              <span style={s.resultNum}>{scores.knew}</span>
              <span style={{ ...s.resultLabel, color: 'var(--correct-text)' }}>knew it</span>
            </div>
            <div style={s.resultItem}>
              <span style={s.resultNum}>{scores.almost}</span>
              <span style={{ ...s.resultLabel, color: 'var(--gold-text)' }}>almost</span>
            </div>
            <div style={s.resultItem}>
              <span style={s.resultNum}>{scores.didnt}</span>
              <span style={{ ...s.resultLabel, color: 'var(--incorrect-text)' }}>didn't know</span>
            </div>
          </div>
          <div style={s.resultsPct}>{pct}% perfect</div>
          {calculateQuizXP(scores.knew, total) > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168,85,247,0.1)', borderRadius: 50, padding: '4px 14px', marginBottom: 12 }} className="animate-pop">
              <span>⚡</span>
              <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>+{calculateQuizXP(scores.knew, total)} XP</span>
            </div>
          )}
          <div style={s.resultsActions}>
            <button
              className="btn btn-cute"
              style={s.resultBtn}
              onClick={() => setPhase(PHASE.SETUP)}
            >
              try again
            </button>
            <ShareResult
              quizName="kanji practice"
              score={scores.knew}
              total={total}
              percentage={pct}
              xpEarned={calculateQuizXP(scores.knew, total)}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/kanji" className="btn btn-secondary" style={{ ...s.resultBtn, flex: 1, textAlign: 'center' }}>
                kanji study 📖
              </Link>
              <Link to="/quiz/kanji" className="btn btn-secondary" style={{ ...s.resultBtn, flex: 1, textAlign: 'center' }}>
                kanji quiz ✨
              </Link>
              <Link to="/" className="btn btn-secondary" style={{ ...s.resultBtn, flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>
                home 🏠
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── QUIZ MODE — in progress ───
  if (phase === PHASE.QUIZ && current) {
    return (
      <div className="page" style={s.page}>
        <div style={s.topBar} className="animate-fadeInUp">
          <button
            className="btn btn-secondary"
            style={s.smallBtn}
            onClick={() => setPhase(PHASE.SETUP)}
          >
            ← back
          </button>
          <span style={s.progress}>
            {index + 1} / {deck.length}
          </span>
          <span style={s.scoreInline}>
            ✓{scores.knew} ~{scores.almost} ✗{scores.didnt}
          </span>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', marginLeft: 'auto', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
        </div>

        <div style={s.progressBarTrack}>
          <div style={{ ...s.progressBarFill, width: `${((index + 1) / deck.length) * 100}%` }} className="progress-fill" />
        </div>

        {/* hint: meaning + readings only */}
        <div
          className="glass animate-fadeInUp"
          style={{ ...s.quizHintCard, ...(isTablet ? s.practiceCardTablet : {}) }}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return
            const dx = e.changedTouches[0].clientX - touchStartX.current
            const dy = e.changedTouches[0].clientY - touchStartY.current
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
              if (dx > 0) goPrev()
              else goNext()
            }
            touchStartX.current = null
            touchStartY.current = null
          }}
        >
          <div style={s.quizLabel}>draw this kanji:</div>
          <div style={s.quizMeaning}>{current.meaning}</div>
          <div style={s.readingsRow}>
            <div style={s.readingBox}>
              <span style={s.readingLabel}>ON</span>
              <span style={s.readingValue}>{current.on}</span>
              {readingToRomaji(current.on) && <span style={s.readingRomaji}>{readingToRomaji(current.on)}</span>}
            </div>
            <div style={s.readingBox}>
              <span style={s.readingLabel}>KUN</span>
              <span style={s.readingValue}>{current.kun}</span>
              {readingToRomaji(current.kun) && <span style={s.readingRomaji}>{readingToRomaji(current.kun)}</span>}
            </div>
          </div>
          {strokeData[current.kanji]?.strokes && (
            <div style={{ marginTop: 6, textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(192,132,252,0.12)', padding: '2px 8px', borderRadius: 50 }}>
                {strokeData[current.kanji].strokes}画
              </span>
            </div>
          )}
          {current.keywords && current.keywords.length > 0 && (
            <div style={s.keywordHint}>
              hint: <strong>{parseKeyword(current.keywords[0]).word}</strong>
            </div>
          )}
        </div>

        {/* drawing area */}
        <div className="glass animate-fadeInUp" style={{ ...s.canvasCard, ...(isTablet ? s.practiceCardTablet : {}) }}>
          <DrawingCanvas
            width={canvasSize}
            height={canvasSize}
            onClear={(fn) => { clearCanvasRef.current = fn }}
          />
          <div style={s.canvasBtnRow}>
            <button
              className="btn btn-secondary"
              style={s.clearBtn}
              onClick={clearCanvas}
            >
              clear
            </button>
            {!revealed && (
              <button
                className="btn btn-cute"
                style={s.clearBtn}
                onClick={() => setRevealed(true)}
              >
                reveal kanji
              </button>
            )}
          </div>
        </div>

        {/* revealed kanji */}
        {revealed && (
          <div className="glass animate-pop" style={{ ...s.revealCard, ...(isTablet ? s.practiceCardTablet : {}) }}>
            <div style={s.revealKanji}>{current.kanji}</div>
            <StrokeOrder kanji={current.kanji} size={100} autoPlay />
            <div style={s.revealMeaning}>{current.meaning}</div>
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginBottom: 10 }}>
              {current.on && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>ON</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{current.on}</div>
                  {readingToRomaji(current.on) && <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic' }}>{readingToRomaji(current.on)}</div>}
                </div>
              )}
              {current.kun && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>KUN</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{current.kun}</div>
                  {readingToRomaji(current.kun) && <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic' }}>{readingToRomaji(current.kun)}</div>}
                </div>
              )}
            </div>
            <div style={s.gradeLabel}>how did you do?</div>
            <div style={s.gradeRow}>
              <button
                className="btn btn-cute"
                style={{ ...s.gradeBtn, background: 'linear-gradient(135deg, #10b981, #34d399)' }}
                onClick={() => grade('knew')}
              >
                knew it ✓
              </button>
              <button
                className="btn btn-cute"
                style={{ ...s.gradeBtn, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
                onClick={() => grade('almost')}
              >
                almost ~
              </button>
              <button
                className="btn btn-cute"
                style={{ ...s.gradeBtn, background: 'linear-gradient(135deg, #ef4444, #f87171)' }}
                onClick={() => grade('didnt')}
              >
                nope ✗
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

// ─── Styles ───
const s = {
  page: {},
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  titleJp: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    marginTop: 4,
  },

  // setup
  setupCard: {
    padding: '24px 20px',
    borderRadius: 20,
    maxWidth: 500,
    margin: '0 auto',
  },
  practiceCardTablet: {
    maxWidth: 620,
    padding: '28px 26px',
  },
  sectionTitle: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  },
  lessonChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    fontSize: '0.8rem',
    padding: '6px 14px',
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
    fontWeight: 700,
  },
  availableText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: 8,
  },
  modeRow: {
    display: 'flex',
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '14px 10px',
    borderRadius: 16,
    textAlign: 'center',
  },
  modeBtnLabel: {
    fontSize: '0.9rem',
    fontWeight: 800,
  },
  modeBtnDesc: {
    fontSize: '0.78rem',
    opacity: 0.7,
  },
  countRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  countChip: {
    fontSize: '0.8rem',
    padding: '6px 14px',
    borderRadius: 12,
    fontWeight: 700,
    minWidth: 40,
    minHeight: 44,
  },
  startBtn: {
    marginTop: 28,
    padding: '14px 28px',
    fontSize: '1rem',
    fontWeight: 800,
    borderRadius: 16,
    display: 'block',
    margin: '28px auto 0',
    maxWidth: 260,
  },
  linkBack: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
  },

  // top bar
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 4,
    background: 'var(--bar-track)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    background: 'linear-gradient(90deg, #f472b6, #c084fc)',
    transition: 'width 0.4s ease',
  },
  smallBtn: {
    fontSize: '0.8rem',
    padding: '6px 14px',
    borderRadius: 12,
    minHeight: 44,
  },
  progress: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  scoreInline: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginLeft: 'auto',
  },

  // study card
  studyCard: {
    padding: '24px 20px',
    borderRadius: 20,
    maxWidth: 500,
    margin: '0 auto 16px',
    textAlign: 'center',
  },
  kanjiDisplay: {
    fontSize: '5rem',
    fontWeight: 400,
    color: 'var(--text-main)',
    lineHeight: 1.1,
    marginBottom: 8,
    fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif',
  },
  meaningText: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 12,
  },
  readingsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  readingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  readingLabel: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  readingValue: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  readingRomaji: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  },
  keywordsSection: {
    marginTop: 12,
    textAlign: 'left',
    padding: '10px 14px',
    background: 'rgba(168, 85, 247, 0.06)',
    borderRadius: 12,
  },
  keywordsTitle: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  keywordItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 0',
    borderBottom: '1px solid rgba(192,132,252,0.1)',
  },
  keywordWord: {
    fontSize: '0.95rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    minWidth: 56,
    flexShrink: 0,
  },
  keywordRomaji: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  },
  keywordMeaning: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginLeft: 'auto',
  },
  strokeBtn: {
    marginTop: 12,
    fontSize: '0.75rem',
    padding: '6px 16px',
    borderRadius: 12,
    minHeight: 44,
  },
  strokeInfo: {
    marginTop: 8,
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  strokeOrderList: {
    marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3,
    textAlign: 'left', padding: '8px 12px',
    background: 'rgba(168, 85, 247, 0.05)', borderRadius: 12,
  },
  strokeOrderItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0',
  },
  strokeOrderNum: {
    width: 20, height: 20, borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white', fontSize: '0.72rem', fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  strokeOrderDesc: {
    fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)',
  },

  // canvas
  canvasCard: {
    padding: '16px',
    borderRadius: 20,
    maxWidth: 500,
    margin: '0 auto 16px',
    textAlign: 'center',
  },
  canvasLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  },
  canvasOnlyWrap: {
    display: 'flex',
    justifyContent: 'center',
  },
  checkCompare: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  checkReference: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 16,
    background: 'rgba(168, 85, 247, 0.06)',
    borderRadius: 16,
    border: '2px solid rgba(192, 132, 252, 0.25)',
  },
  checkRefLabel: {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--correct-text)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  checkRefKanji: {
    fontSize: '8rem',
    lineHeight: 1,
    color: 'var(--text-main)',
    fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif',
  },
  canvasWrap: {
    position: 'relative',
    display: 'inline-block',
  },
  ghostKanji: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '12rem',
    fontWeight: 400,
    color: 'rgba(200, 180, 220, 0.15)',
    lineHeight: 1,
    pointerEvents: 'none',
    zIndex: 2,
    fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif',
    userSelect: 'none',
  },
  canvas: {
    borderRadius: 12,
    maxWidth: '100%',
    height: 'auto',
    touchAction: 'none',
    cursor: 'crosshair',
    boxShadow: '0 2px 12px rgba(74, 25, 66, 0.08)',
    position: 'relative',
    zIndex: 1,
  },
  canvasBtnRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
  },
  clearBtn: {
    fontSize: '0.78rem',
    padding: '8px 18px',
    borderRadius: 12,
    minHeight: 44,
  },

  // nav row
  navRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    maxWidth: 500,
    margin: '0 auto',
  },
  navRowTablet: {
    maxWidth: 620,
  },
  navBtn: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '0.9rem',
    fontWeight: 800,
    borderRadius: 14,
    minHeight: 44,
  },

  // quiz hint
  quizHintCard: {
    padding: '20px',
    borderRadius: 20,
    maxWidth: 500,
    margin: '0 auto 16px',
    textAlign: 'center',
  },
  quizLabel: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
  },
  quizMeaning: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 12,
  },
  keywordHint: {
    marginTop: 8,
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    opacity: 0.8,
  },

  // reveal
  revealCard: {
    padding: '20px',
    borderRadius: 20,
    maxWidth: 500,
    margin: '0 auto 16px',
    textAlign: 'center',
  },
  revealKanji: {
    fontSize: '4rem',
    color: 'var(--text-main)',
    lineHeight: 1.1,
    fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif',
  },
  revealMeaning: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: 12,
  },
  gradeLabel: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  },
  gradeRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  gradeBtn: {
    padding: '10px 16px',
    fontSize: '0.82rem',
    fontWeight: 800,
    borderRadius: 12,
    color: 'white',
    border: 'none',
    minHeight: 44,
  },

  // results
  resultsCard: {
    padding: '32px 24px',
    borderRadius: 24,
    maxWidth: 420,
    margin: '40px auto 0',
    textAlign: 'center',
  },
  resultsCardTablet: {
    maxWidth: 560,
    padding: '42px 34px',
  },
  resultsEmoji: {
    fontSize: '3rem',
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 20,
  },
  resultsGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  resultNum: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  resultLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  resultsPct: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    marginBottom: 20,
  },
  resultsActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  resultBtn: {
    padding: '10px 20px',
    fontSize: '0.85rem',
    fontWeight: 700,
    borderRadius: 14,
    minHeight: 44,
  },
}
