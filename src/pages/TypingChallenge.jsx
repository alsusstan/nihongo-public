import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { useWordTracker } from '../hooks/useWordTracker'
import { lessons } from '../data/lessons'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { getStoredNonNegativeInt, setStoredString } from '../utils/localSettings'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const PHASE_SETUP = 'setup'
const PHASE_GAME = 'game'
const PHASE_RESULTS = 'results'

export default function TypingChallenge() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const { unlockedLessons } = useUnlockedLessons()
  const { recordMiss, recordHit } = useWordTracker()
  const [searchParams] = useSearchParams()
  const sharedLessonId = parseInt(searchParams.get('lesson') || '', 10)
  const sharedLesson = Number.isFinite(sharedLessonId) ? lessons.find(l => l.id === sharedLessonId) : null
  const lessonPool = useMemo(() => (
    sharedLesson && !unlockedLessons.some(l => l.id === sharedLesson.id)
      ? [...unlockedLessons, sharedLesson]
      : unlockedLessons
  ), [sharedLesson, unlockedLessons])
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [selectedLessons, setSelectedLessons] = useState([])
  const [wordCount, setWordCount] = useState(15)
  const [mode, setMode] = useState('jp-to-romaji') // jp-to-romaji or jp-to-russian
  const [timedMode, setTimedMode] = useState(false) // 60-second speed mode

  // game state
  const [words, setWords] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [mistakes, setMistakes] = useState([])
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong'
  const [timeLeft, setTimeLeft] = useState(60)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const streakRef = useRef(0)
  const nextRef = useRef(null)
  const focusTimerRef = useRef(null)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)
  useEffect(() => () => {
    clearTimeout(nextRef.current)
    clearTimeout(focusTimerRef.current)
  }, [])
  useEffect(() => { advanceLockedRef.current = false }, [currentIndex])

  const availableLessons = lessonPool.map(l => ({ id: l.id, count: l.vocabulary.length }))

  // Pre-select lesson from ?lesson=X URL param
  useEffect(() => {
    const lessonParam = searchParams.get('lesson')
    if (lessonParam && lessonPool.length > 0) {
      const lessonId = parseInt(lessonParam, 10)
      if (lessonPool.some(l => l.id === lessonId)) {
        setSelectedLessons([lessonId])
      }
    }
  }, [searchParams, lessonPool])

  const toggleLesson = (id) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const startGame = () => {
    const pool = lessonPool
      .filter(l => selectedLessons.includes(l.id))
      .flatMap(l => l.vocabulary)
      .filter(w => !w.japanese?.includes('[') || w.japanese.includes('[な]'))
    if (pool.length < 4) return

    // In timed mode use a long shuffled pool (repeat if needed to fill 300 slots)
    let selected
    if (timedMode) {
      const big = []
      while (big.length < 300) big.push(...shuffle(pool))
      selected = big.slice(0, 300)
    } else {
      selected = shuffle(pool).slice(0, Math.min(wordCount, pool.length))
    }

    setWords(selected)
    setCurrentIndex(0)
    setInput('')
    setCorrect(0)
    setWrong(0)
    streakRef.current = 0
    setBestStreak(0)
    setMistakes([])
    setFeedback(null)
    advanceLockedRef.current = false
    setTimeLeft(60)
    setStartTime(Date.now())
    setEndTime(null)
    xpAwardedRef.current = false
    setPhase(PHASE_GAME)
    clearTimeout(focusTimerRef.current)
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 100)
  }

  const startMistakesGame = () => {
    if (mistakes.length === 0) return
    const pool = mistakes.map(m => m.word)
    setWords(shuffle(pool))
    setCurrentIndex(0)
    setInput('')
    setCorrect(0)
    setWrong(0)
    streakRef.current = 0
    setBestStreak(0)
    setMistakes([])
    setFeedback(null)
    advanceLockedRef.current = false
    setTimeLeft(60)
    setStartTime(Date.now())
    setEndTime(null)
    setTimedMode(false)
    // xpAwardedRef stays true — no re-award on retry
    setPhase(PHASE_GAME)
    clearTimeout(focusTimerRef.current)
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 100)
  }

  // 60-second countdown
  useEffect(() => {
    if (phase !== PHASE_GAME || !timedMode) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          clearTimeout(nextRef.current)
          advanceLockedRef.current = true
          setEndTime(Date.now())
          setPhase(PHASE_RESULTS)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, timedMode])

  const getExpected = (word) => {
    if (mode === 'jp-to-romaji') return word.romaji.replace(/\s*\[.*?\]/g, '').replace(/~/g, '').toLowerCase().trim()
    return word.russian.replace(/~/g, '').replace(/\s+/g, ' ').toLowerCase().trim()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || feedback) return
    advanceLockedRef.current = false

    const word = words[currentIndex]
    const expected = getExpected(word)
    const userInput = input.trim().toLowerCase()

    // flexible matching for romaji (allow missing long vowels etc.)
    const isCorrect = mode === 'jp-to-romaji'
      ? normalizeRomaji(userInput) === normalizeRomaji(expected)
      : userInput === expected

    const newFeedback = isCorrect ? 'correct' : 'wrong'

    if (isCorrect) {
      setCorrect(prev => prev + 1)
      streakRef.current += 1
      setBestStreak(b => Math.max(b, streakRef.current))
      setFeedback('correct')
      recordHit(word)
    } else {
      setWrong(prev => prev + 1)
      streakRef.current = 0
      setMistakes(prev => [...prev, { word, userInput, expected }])
      setFeedback('wrong')
      recordMiss(word, 'typing')
    }

    clearTimeout(nextRef.current)
    nextRef.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true
      if (!timedMode && currentIndex + 1 >= words.length) {
        setEndTime(Date.now())
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentIndex(prev => prev + 1)
        setInput('')
        setFeedback(null)
        inputRef.current?.focus()
      }
    }, newFeedback === 'wrong' ? 1200 : 600)
  }

  const skip = () => {
    if (feedback || advanceLockedRef.current) return  // answer already submitted — use skipDelay instead
    advanceLockedRef.current = true
    const word = words[currentIndex]
    setWrong(prev => prev + 1)
    setMistakes(prev => [...prev, { word, userInput: '(skipped)', expected: getExpected(word) }])
    recordMiss(word, 'typing')
    if (!timedMode && currentIndex + 1 >= words.length) {
      setEndTime(Date.now())
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setInput('')
      setFeedback(null)
      inputRef.current?.focus()
    }
  }

  const skipDelay = useCallback(() => {
    if (!feedback || advanceLockedRef.current) return
    advanceLockedRef.current = true
    clearTimeout(nextRef.current)
    if (!timedMode && currentIndex + 1 >= words.length) {
      setEndTime(Date.now())
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setInput('')
      setFeedback(null)
      inputRef.current?.focus()
    }
  }, [feedback, timedMode, currentIndex, words.length])

  // calculate WPM (words per minute)
  const totalTime = endTime && startTime ? (endTime - startTime) / 1000 : 0
  const wpm = totalTime > 0 ? Math.round((correct / totalTime) * 60) : 0
  const totalAttempted = timedMode ? correct + wrong : words.length
  const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0

  const [isNewBest, setIsNewBest] = useState(false)
  const [bestWpm, setBestWpm] = useState(0)

  // award XP on results + track best WPM
  useEffect(() => {
    if (phase === PHASE_RESULTS && (correct + wrong) > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      const attempted = timedMode ? correct + wrong : words.length
      saveQuizResult('vocab', { lessons: selectedLessons, score: correct, total: attempted })
      const xp = calculateQuizXP(correct, attempted)
      if (xp > 0) awardXP(xp, 'typing challenge', correct === attempted && attempted > 0)

      // track personal best WPM
      try {
        const time = endTime && startTime ? (endTime - startTime) / 1000 : 0
        const currentWpm = time > 0 ? Math.round((correct / time) * 60) : 0
        const key = `nihongo-typing-best-${mode}`
        const prevBest = getStoredNonNegativeInt(key, 0)
        setBestWpm(prevBest)
        if (currentWpm > prevBest && currentWpm > 0) {
          setStoredString(key, currentWpm)
          setIsNewBest(true)
          setBestWpm(currentWpm)
        } else {
          setIsNewBest(false)
        }
      } catch { setIsNewBest(false) }
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const word = words[currentIndex]


  // scroll to top when results phase begins
  useEffect(() => {
    if (phase === PHASE_RESULTS) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  return (
    <div className="page">
      {phase === PHASE_SETUP && (
        <div className="animate-fadeInUp">
          <div style={s.header}>
            <h1 style={s.title}>
              <span>⌨️</span> typing <span style={s.titleJp}>タイピング</span>
            </h1>
            <p style={s.subtitle}>type romaji as fast as you can!</p>
          </div>

          <div className="glass" style={s.setupCard}>
            <div style={s.setupLabel}>mode</div>
            <div style={s.modeRow}>
              <button
                onClick={() => setMode('jp-to-romaji')}
                style={{ ...s.modeBtn, ...(mode === 'jp-to-romaji' ? s.modeBtnActive : {}) }}
              >
                日本語 → romaji
              </button>
              <button
                onClick={() => setMode('jp-to-russian')}
                style={{ ...s.modeBtn, ...(mode === 'jp-to-russian' ? s.modeBtnActive : {}) }}
              >
                日本語 → русский
              </button>
            </div>
          </div>

          <div className="glass" style={s.setupCard}>
            <div style={s.setupLabel}>lessons</div>
            <div style={s.chipsWrap}>
              <button
                onClick={() => setSelectedLessons(prev =>
                  prev.length === availableLessons.length ? [] : availableLessons.map(l => l.id)
                )}
                style={{ ...s.chip, ...(selectedLessons.length === availableLessons.length ? s.chipActive : {}) }}
              >
                all
              </button>
              {availableLessons.map(l => (
                <button
                  key={l.id}
                  onClick={() => toggleLesson(l.id)}
                  style={{ ...s.chip, ...(selectedLessons.includes(l.id) ? s.chipActive : {}) }}
                >
                  {l.id}
                </button>
              ))}
            </div>
          </div>

          {!timedMode && (
            <div className="glass" style={s.setupCard}>
              <div style={s.setupLabel}>words: {wordCount}</div>
              <input
                type="range"
                className="kawaii-slider"
                min={5}
                max={30}
                value={wordCount}
                onChange={e => setWordCount(parseInt(e.target.value, 10))}
                aria-label="number of words"
              />
            </div>
          )}

          <div className="glass" style={s.setupCard}>
            <div style={s.setupLabel}>game mode</div>
            <div style={s.modeRow}>
              <button
                onClick={() => setTimedMode(false)}
                style={{ ...s.modeBtn, ...(!timedMode ? s.modeBtnActive : {}) }}
              >
                📝 {wordCount} слов
              </button>
              <button
                onClick={() => setTimedMode(true)}
                style={{ ...s.modeBtn, ...(timedMode ? s.modeBtnActive : {}) }}
              >
                ⏱️ 60 сек
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <button
              className="btn btn-cute"
              onClick={startGame}
              disabled={selectedLessons.length === 0}
            >
              start typing! ⌨️
            </button>
            <Link to="/game/matching" className="btn btn-secondary" style={{ textAlign: 'center' }}>matching 🎮</Link>
            <Link to="/" className="btn btn-secondary" style={{ textAlign: 'center' }}>home 🏠</Link>
          </div>
        </div>
      )}

      {phase === PHASE_GAME && word && (
        <div className="animate-fadeInUp" style={{ ...s.gameWrap, ...(isTablet ? s.gameWrapTablet : {}) }}>
          {/* progress */}
          <div style={s.progressBar}>
            <div style={{
              ...s.progressFill,
              width: timedMode
                ? `${((60 - timeLeft) / 60) * 100}%`
                : `${((currentIndex + 1) / words.length) * 100}%`,
              ...(timedMode && timeLeft <= 10 ? { background: 'linear-gradient(90deg, #ef4444, #f97316)' } : {}),
            }} />
          </div>
          <div style={s.gameStats}>
            <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
            {timedMode ? (
              <span style={{
                fontWeight: 900, fontSize: '1.05rem',
                color: timeLeft <= 10 ? 'var(--incorrect-text)' : timeLeft <= 20 ? 'var(--gold-text)' : 'var(--text-light)',
              }}>⏱️ {timeLeft}s</span>
            ) : (
              <span>{currentIndex + 1}/{words.length}</span>
            )}
            <span style={{ color: 'var(--correct-text)' }} aria-live="polite" aria-atomic="true">✓ {correct}</span>
            <span style={{ color: 'var(--incorrect-text)' }} aria-live="polite" aria-atomic="true">✗ {wrong}</span>
          </div>

          {/* word display */}
          <div className="glass" style={s.wordCard}>
            <div style={{ ...s.wordJp, fontSize: isMobile ? '1.6rem' : isTablet ? '2.55rem' : '2.2rem' }}>{(word.kanji || word.japanese || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
            {word.kanji && <div style={s.wordKanji}>{(word.japanese || '').replace(/\s*\[.*?\]/g, '').trim()}</div>}
            {mode === 'jp-to-romaji' && (
              <div style={s.wordHint}>{word.russian}</div>
            )}
            {mode === 'jp-to-russian' && (
              <div style={s.wordHint}>{(word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
            )}
          </div>

          {/* input */}
          <form onSubmit={handleSubmit} style={s.inputForm}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={mode === 'jp-to-romaji' ? 'type romaji...' : 'введите перевод...'}
              aria-label={mode === 'jp-to-romaji' ? 'type romaji answer' : 'type translation'}
              style={{
                ...s.input,
                ...(isTablet ? s.inputTablet : {}),
                ...(feedback === 'correct' ? s.inputCorrect : {}),
                ...(feedback === 'wrong' ? s.inputWrong : {}),
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              disabled={!!feedback}
              onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
            />
            {input.length > 0 && !feedback && (() => {
              const expected = getExpected(words[currentIndex])
              const chars = expected.split('')
              let firstWrong = -1
              return (
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', minHeight: 20 }}>
                  {chars.map((ch, ci) => {
                    const typed = input[ci]
                    let color = '#6b7280' // untyped gray
                    if (typed !== undefined) {
                      if (typed.toLowerCase() === ch.toLowerCase()) {
                        color = 'var(--correct-text)'
                      } else if (firstWrong === -1) {
                        firstWrong = ci
                        color = 'var(--incorrect-text)'
                      } else {
                        color = '#6b7280'
                      }
                    }
                    return (
                      <span key={ci} style={{ fontSize: '0.78rem', fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>
                        {ch === ' ' ? '·' : ch}
                      </span>
                    )
                  })}
                </div>
              )
            })()}
            <div style={s.inputActions}>
              <button type="submit" className="btn btn-cute" style={{ fontSize: '0.85rem' }}>
                enter
              </button>
              <button type="button" onClick={skip} className="btn-hover" style={s.skipBtn}>
                skip →
              </button>
            </div>
          </form>

          {feedback === 'wrong' && (
            <div className="animate-pop" style={{ ...s.wrongFeedback, cursor: 'pointer' }} onClick={skipDelay} role="button" tabIndex={0} aria-label="continue to next question" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipDelay() } }}>
              correct: <strong>{getExpected(word)}</strong>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4 }}>нажми чтобы продолжить →</div>
            </div>
          )}
        </div>
      )}

      {phase === PHASE_RESULTS && (
        <div className="animate-fadeInUp" style={s.resultsWrap}>
          <div className="glass" style={{ ...s.resultsCard, ...(isTablet ? s.resultsCardTablet : {}) }}>
            {accuracy >= 90 && <Confetti trigger={true} />}
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
              {accuracy >= 90 ? '🎉⌨️✨' : accuracy >= 70 ? '🌸😊' : '🐱💪'}
            </div>
            <h2 style={s.resultsTitle}>
              {timedMode
                ? `${wpm} WPM ⚡ ${accuracy >= 90 ? 'amazing!' : accuracy >= 70 ? 'nice speed!' : 'keep going!'}`
                : accuracy >= 90 ? 'hayai! fast & accurate!' : accuracy >= 70 ? 'nice typing!' : 'keep practicing!'
              }
            </h2>
            {timedMode && (
              <div style={s.timedModeTag}>⏱️ 60 second challenge</div>
            )}

            <div style={s.resultsStatsRow}>
              <div style={s.resultsStat}>
                <span style={{ ...s.resultsNum, ...(timedMode ? { color: 'var(--text-light)', fontSize: '1.7rem' } : {}) }}>{wpm}</span>
                <span style={s.resultsLabel}>wpm</span>
              </div>
              <div style={s.resultsStat}>
                <span style={s.resultsNum}>{accuracy}%</span>
                <span style={s.resultsLabel}>accuracy</span>
              </div>
              {timedMode ? (
                <div style={s.resultsStat}>
                  <span style={s.resultsNum}>{correct}</span>
                  <span style={s.resultsLabel}>words typed</span>
                </div>
              ) : (
                <div style={s.resultsStat}>
                  <span style={s.resultsNum}>{Math.round(totalTime)}s</span>
                  <span style={s.resultsLabel}>time</span>
                </div>
              )}
              <div style={s.resultsStat}>
                <span style={s.resultsNum}>{correct}/{totalAttempted}</span>
                <span style={s.resultsLabel}>correct</span>
              </div>
              {bestStreak >= 2 && (
                <div style={s.resultsStat}>
                  <span style={{ ...s.resultsNum, color: bestStreak >= 5 ? '#f472b6' : 'var(--text-main)' }}>
                    {bestStreak >= 5 ? '🔥' : '✨'}{bestStreak}
                  </span>
                  <span style={s.resultsLabel}>best streak</span>
                </div>
              )}
            </div>

            {/* XP badge */}
            {(() => {
              const xp = calculateQuizXP(correct, totalAttempted)
              return xp > 0 ? (
                <div style={s.xpBadge} className="animate-pop">
                  <span style={s.xpIcon}>⚡</span>
                  <span style={s.xpAmount}>+{xp} XP</span>
                </div>
              ) : null
            })()}

            {isNewBest && (
              <div style={s.newBest} className="animate-pop">
                🏆 new personal best WPM!
              </div>
            )}
            {!isNewBest && bestWpm > 0 && (
              <div style={s.prevBest}>
                personal best: {bestWpm} wpm
              </div>
            )}

            {mistakes.length > 0 && (
              <div style={s.mistakesSection}>
                <div style={s.mistakesLabel}>mistakes ({mistakes.length})</div>
                {mistakes.map((m, i) => (
                  <div key={(m.word.japanese || '') + i} style={s.mistakeItem}>
                    <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{(m.word.kanji || m.word.japanese || '').replace(/\s*\[.*?\]/g, '').trim()}</span>
                    <span style={{ color: 'var(--incorrect-text)', fontSize: '0.75rem' }}>you: {m.userInput}</span>
                    <span style={{ color: 'var(--correct-text)', fontSize: '0.75rem' }}>correct: {m.expected}</span>
                    {m.word.lesson && (
                      <Link to={`/lessons/${m.word.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                        lesson {m.word.lesson} →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-cute" onClick={() => setPhase(PHASE_SETUP)}>
                try again ⌨️
              </button>
              {mistakes.length > 0 && (
                <button className="btn btn-cute" onClick={startMistakesGame} style={{ fontSize: '0.85rem' }}>
                  retry mistakes ({mistakes.length}) 🎯
                </button>
              )}
              <ShareResult
                quizName={timedMode ? 'typing challenge 60s' : 'typing challenge'}
                score={correct}
                total={totalAttempted}
                percentage={accuracy}
                bestStreak={bestStreak}
                xpEarned={calculateQuizXP(correct, totalAttempted)}
              />
              <Link to="/game/matching" className="btn btn-secondary">matching 🎮</Link>
              <Link to="/" className="btn btn-secondary">home 🏠</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// normalize romaji for flexible matching
function normalizeRomaji(s) {
  return s.toLowerCase()
    .replace(/ou/g, 'o').replace(/oo/g, 'o')
    .replace(/uu/g, 'u').replace(/ei/g, 'e')
    .replace(/[\s\-_.~]/g, '')
    .replace(/si/g, 'shi').replace(/ti/g, 'chi').replace(/tu/g, 'tsu')
    .replace(/hu/g, 'fu').replace(/zi/g, 'ji').replace(/di/g, 'ji')
    .trim()
}

const s = {
  header: { textAlign: 'center', marginBottom: 16, padding: '8px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  titleJp: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },
  setupCard: { padding: 22, marginBottom: 16, textAlign: 'center' },
  setupLabel: {
    fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12,
    textTransform: 'lowercase',
  },
  modeRow: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  modeBtn: {
    padding: '10px 18px', borderRadius: 50, border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'var(--tint-medium)', fontSize: '0.9rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    minHeight: 44,
  },
  modeBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent',
  },
  chipsWrap: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  chip: {
    padding: '4px 12px', borderRadius: 14, border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'var(--tint-medium)', fontSize: '0.78rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    minHeight: 44, minWidth: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  chipActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent',
  },
  gameWrap: { maxWidth: 500, margin: '0 auto', paddingBottom: 120 },
  gameWrapTablet: { maxWidth: 680 },
  progressBar: {
    height: 4, borderRadius: 50, background: 'rgba(192,132,252,0.15)',
    overflow: 'hidden', marginBottom: 8,
  },
  progressFill: {
    height: '100%', borderRadius: 50, background: 'linear-gradient(90deg, #f472b6, #c084fc)',
    transition: 'width 0.3s',
  },
  gameStats: {
    display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16,
    fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)',
  },
  wordCard: {
    padding: '28px 20px', textAlign: 'center', marginBottom: 16,
  },
  wordJp: { fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: 4 },
  wordKanji: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: 4 },
  wordHint: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic' },
  inputForm: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  input: {
    width: '100%', maxWidth: 300, padding: '12px 20px', borderRadius: 50,
    border: '2.5px solid rgba(192,132,252,0.3)', background: 'var(--tint-heavy)',
    fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'inherit',
    outline: 'none', textAlign: 'center', transition: 'all 0.2s',
  },
  inputTablet: {
    maxWidth: 420,
    padding: '14px 24px',
    fontSize: '1.2rem',
  },
  inputCorrect: { borderColor: 'var(--correct-text)', background: 'rgba(16,185,129,0.08)' },
  inputWrong: { borderColor: 'var(--incorrect-text)', background: 'rgba(239,68,68,0.08)' },
  inputActions: { display: 'flex', gap: 8, alignItems: 'center' },
  skipBtn: {
    padding: '6px 16px', borderRadius: 50, background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.2)', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-light)', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
  },
  wrongFeedback: {
    textAlign: 'center', marginTop: 12, fontSize: '0.85rem', fontWeight: 600,
    color: 'var(--incorrect-text)', padding: '8px 16px', borderRadius: 12,
    background: 'rgba(239,68,68,0.06)',
  },
  resultsWrap: { display: 'flex', justifyContent: 'center', padding: '20px 0', paddingBottom: 90 },
  resultsCard: {
    textAlign: 'center', padding: '32px 24px', maxWidth: 440, width: '100%',
    position: 'relative', overflow: 'hidden',
  },
  resultsCardTablet: {
    maxWidth: 560,
    padding: '42px 34px',
  },
  resultsTitle: { fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 8 },
  timedModeTag: {
    display: 'inline-flex', alignItems: 'center', padding: '3px 14px', borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(192,132,252,0.08))',
    border: '1.5px solid rgba(168,85,247,0.3)',
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)',
    marginBottom: 12,
  },
  resultsStatsRow: { display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 },
  resultsStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  resultsNum: { fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' },
  resultsLabel: { fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'lowercase' },
  mistakesSection: { marginTop: 12, textAlign: 'left' },
  mistakesLabel: {
    fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, textAlign: 'center',
  },
  mistakeItem: {
    display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px',
    borderRadius: 10, background: 'rgba(239,68,68,0.04)', marginBottom: 4,
    border: '1px solid rgba(239,68,68,0.1)',
  },
  xpBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '6px 18px', borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
    border: '1.5px solid rgba(251, 191, 36, 0.4)',
    margin: '8px auto 0', width: 'fit-content',
  },
  xpIcon: { fontSize: '1rem' },
  xpAmount: { fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold-text)' },
  newBest: {
    fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-text)',
    textAlign: 'center', marginTop: 8,
  },
  prevBest: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)',
    textAlign: 'center', marginTop: 4,
  },
}
