import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { hiragana, katakana } from '../data/kana'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import Confetti from '../components/Confetti'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { getStoredQuizSize } from '../utils/localSettings'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateOptions(correct, pool) {
  const seen = new Set([correct.romaji])
  const wrong = []

  shuffle(pool).forEach(kana => {
    if (wrong.length >= 3 || seen.has(kana.romaji)) return
    seen.add(kana.romaji)
    wrong.push(kana)
  })

  return shuffle([correct, ...wrong])
}

function getRowMates(kana) {
  if (!kana.row) return null
  const data = kana.type === 'katakana' ? katakana : hiragana
  const allKana = [...(data.basic || []), ...(data.dakuten || []), ...(data.combo || [])]
  return allKana.filter(k => k.row === kana.row)
}

const scoreReactions = [
  { min: 90, emoji: '🎉✨🐱', text: 'perfect nyaa~ ты прекрасно читаешь!', textJp: 'すごい！' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! отлично!', textJp: 'よくできました！' },
  { min: 50, emoji: '🐱💪', text: 'mou chotto~ ещё немножко!', textJp: 'もうちょっと！' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! попробуй ещё раз~', textJp: 'がんばって！' },
]

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

const kanaTypes = [
  { key: 'hiragana', label: 'hiragana', labelJp: 'ひらがな', emoji: 'あ' },
  { key: 'katakana', label: 'katakana', labelJp: 'カタカナ', emoji: 'ア' },
]

const kanaGroups = [
  { key: 'basic', label: 'basic', labelJp: '基本', emoji: '🌸' },
  { key: 'dakuten', label: 'dakuten', labelJp: '濁点', emoji: '🔥' },
  { key: 'combo', label: 'combo', labelJp: '拗音', emoji: '✨' },
]

export default function KanaQuiz() {
  const { saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [showCountdown, setShowCountdown] = useState(false)

  // setup
  const [selectedTypes, setSelectedTypes] = useState(['hiragana'])
  const [selectedGroups, setSelectedGroups] = useState(['basic'])
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(10)
  const [customTimerVal, setCustomTimerVal] = useState('')

  // quiz
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [mistakes, setMistakes] = useState([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const quickStarted = useRef(false)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)

  // Reset hint on new question
  useEffect(() => { setShowHint(false) }, [currentIndex])

  // Timer countdown
  useEffect(() => { if (isTimed && phase === PHASE_QUIZ && !showCountdown) setTimeLeft(timeLimit) }, [currentIndex, isTimed, timeLimit, phase, showCountdown])
  useEffect(() => {
    if (!isTimed || phase !== PHASE_QUIZ || showCountdown || selectedAnswer !== null) { clearInterval(countdownRef.current); return }
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(countdownRef.current)
          handleAnswer({ romaji: '__TIMEOUT__' })
          return 0
        }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(countdownRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimed, phase, showCountdown, selectedAnswer, currentIndex])

  const toggleType = (key) => {
    setSelectedTypes(prev => {
      const next = prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
      return next.length === 0 ? prev : next
    })
  }

  const toggleGroup = (key) => {
    setSelectedGroups(prev => {
      const next = prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
      return next.length === 0 ? prev : next
    })
  }

  const getPool = () => {
    let pool = []
    const addFromScript = (scriptData, scriptType) => {
      for (const group of selectedGroups) {
        if (scriptData[group]) {
          pool = pool.concat(
            scriptData[group].map(k => ({ ...k, char: k.kana, type: scriptType, group }))
          )
        }
      }
    }
    if (selectedTypes.includes('hiragana')) addFromScript(hiragana, 'hiragana')
    if (selectedTypes.includes('katakana')) addFromScript(katakana, 'katakana')
    return pool
  }

  // Quick start from KanaStudy "quiz this row"
  useEffect(() => {
    if (quickStarted.current) return
    const rowKana = location.state?.rowKana
    if (rowKana && rowKana.length >= 2 && phase === PHASE_SETUP) {
      quickStarted.current = true
      const scriptType = location.state?.mode === 'katakana' ? 'katakana' : 'hiragana'
      const pool = rowKana.map(k => ({ ...k, char: k.kana, type: scriptType, group: 'basic' }))
      // Build full pool for distractors (same script)
      const fullData = scriptType === 'katakana' ? katakana : hiragana
      let fullPool = []
      for (const group of ['basic', 'dakuten', 'combo']) {
        if (fullData[group]) fullPool = fullPool.concat(fullData[group].map(k => ({ ...k, char: k.kana, type: scriptType, group })))
      }
      const qs = pool.map(kana => ({ kana, options: generateOptions(kana, fullPool.length >= 4 ? fullPool : pool) }))
      setQuestions(qs)
      setCurrentIndex(0)
      setScore(0)
      setMistakes([])
      setSelectedAnswer(null)
      setIsCorrect(null)
      setStreak(0)
      setBestStreak(0)
      answerLockedRef.current = false
      advanceLockedRef.current = false
      xpAwardedRef.current = false
      setPhase(PHASE_QUIZ)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  // Quick start from URL params
  useEffect(() => {
    const quick = searchParams.get('quick')
    if (quick && phase === PHASE_SETUP) {
      const quickKey = `quick:${quick}`
      if (quickStarted.current === quickKey) return
      const count = parseInt(quick, 10) || 10
      const t = setTimeout(() => {
        // use all hiragana basic + dakuten
        let pool = []
        const addFromScript = (scriptData, scriptType) => {
          for (const group of ['basic', 'dakuten']) {
            if (scriptData[group]) {
              pool = pool.concat(
                scriptData[group].map(k => ({ ...k, char: k.kana, type: scriptType, group }))
              )
            }
          }
        }
        addFromScript(hiragana, 'hiragana')
        addFromScript(katakana, 'katakana')
        if (pool.length < 4) return
        quickStarted.current = quickKey
        const selected = shuffle(pool).slice(0, Math.min(count, pool.length))
        const qs = selected.map(kana => ({ kana, options: generateOptions(kana, pool) }))
        setSelectedTypes(['hiragana', 'katakana'])
        setSelectedGroups(['basic', 'dakuten'])
        setQuestions(qs)
        setCurrentIndex(0)
        setScore(0)
        setMistakes([])
        setSelectedAnswer(null)
        setIsCorrect(null)
        setStreak(0)
        setBestStreak(0)
        answerLockedRef.current = false
        advanceLockedRef.current = false
        xpAwardedRef.current = false
        setPhase(PHASE_QUIZ)
      }, 0)
      return () => clearTimeout(t)
    }
  }, [searchParams, phase])

  const startQuiz = () => {
    const pool = getPool()
    if (pool.length < 4) return
    xpAwardedRef.current = false

    const count = questionCount === 'all' ? pool.length : Math.min(questionCount, pool.length)
    const selected = shuffle(pool).slice(0, count)

    const qs = selected.map(kana => ({
      kana,
      options: generateOptions(kana, pool),
    }))

    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    answerLockedRef.current = false
    advanceLockedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const startMistakesQuiz = (repeatCount) => {
    if (mistakes.length === 0) return
    const pool = getPool()
    const mistakeKanas = mistakes.map(m => m.kana)
    let repeated = []
    for (let i = 0; i < repeatCount; i++) {
      repeated = repeated.concat(mistakeKanas)
    }
    const qs = shuffle(repeated).map(kana => ({
      kana,
      options: generateOptions(kana, pool.length >= 4 ? pool : mistakeKanas),
    }))
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    answerLockedRef.current = false
    advanceLockedRef.current = false
    xpAwardedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const handleAnswer = useCallback((option) => {
    if (showCountdown || selectedAnswer !== null || answerLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = false
    if (timerRef.current) clearTimeout(timerRef.current)

    const correct = option.romaji === questions[currentIndex].kana.romaji
    setSelectedAnswer(option)
    setIsCorrect(correct)

    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => {
        const newStreak = prev + 1
        setBestStreak(best => Math.max(best, newStreak))
        return newStreak
      })
    } else {
      setMistakes(prev => [...prev, { kana: questions[currentIndex].kana, yourAnswer: option.romaji }])
      setStreak(0)
    }

    const delay = correct ? 1000 : 1500

    timerRef.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true

      if (currentIndex + 1 >= questions.length) {
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
        answerLockedRef.current = false
      }
    }, delay)
  }, [showCountdown, selectedAnswer, questions, currentIndex])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [])

  // Keyboard shortcuts: 1-4 to select answer
  useEffect(() => {
    if (phase !== PHASE_QUIZ || showCountdown || selectedAnswer !== null || !questions[currentIndex]) return
    const handler = (e) => {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && questions[currentIndex].options[num - 1]) {
        handleAnswer(questions[currentIndex].options[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, showCountdown, selectedAnswer, questions, currentIndex, handleAnswer])

  const skipDelay = useCallback(() => {
    if (advanceLockedRef.current) return
    advanceLockedRef.current = true
    clearTimeout(timerRef.current)
    if (currentIndex + 1 >= questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      answerLockedRef.current = false
    }
  }, [currentIndex, questions.length])

  // Enter/Space to skip delay after answering
  useEffect(() => {
    if (phase !== PHASE_QUIZ || selectedAnswer === null) return
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        skipDelay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, selectedAnswer, skipDelay])

  // save scores (only once per quiz session)
  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      saveQuizResult('kana', { type: selectedTypes.join('+'), score, total: questions.length })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'kana quiz', score === questions.length && questions.length > 0)
    }
  }, [phase, score, questions.length, selectedTypes, saveQuizResult, awardXP, calculateQuizXP])

  const pool = getPool()
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const reaction = scoreReactions.find(r => percentage >= r.min) || scoreReactions[scoreReactions.length - 1]


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
          {/* header */}
          <div style={styles.header}>
            <div style={styles.headerKana}>
              <span style={styles.headerKanaChar}>あ</span>
              <span style={styles.headerKanaChar}>ア</span>
            </div>
            <h1 style={styles.title}>
              kana quiz <span style={styles.titleJp}>かなテスト</span>
            </h1>
            <p style={styles.subtitle}>practice reading hiragana & katakana — the gateway to Japanese</p>
          </div>

          {/* kana type */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>
              <span>📝</span> kana type
            </div>
            <div style={styles.typeRow}>
              {kanaTypes.map(t => (
                <button
                  key={t.key}
                  onClick={() => toggleType(t.key)}
                  style={{
                    ...styles.typeBtn,
                    ...(selectedTypes.includes(t.key) ? styles.typeBtnActive : {}),
                  }}
                >
                  <span style={styles.typeBtnEmoji}>{t.emoji}</span>
                  <span style={styles.typeBtnLabel}>{t.label}</span>
                  <span style={styles.typeBtnJp}>{t.labelJp}</span>
                  {selectedTypes.includes(t.key) && (
                    <span style={styles.typeBtnCheck}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* quick presets — group shortcuts, work with whatever kana type is selected */}
          <div className="animate-fadeInUp" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 }}>
            {[
              { label: 'basic only', emoji: '🌸', groups: ['basic'] },
              { label: 'dakuten 🔥', emoji: 'が', groups: ['dakuten'] },
              { label: 'combos ✨', emoji: 'きゃ', groups: ['combo'] },
              { label: 'all groups', emoji: '📚', groups: ['basic', 'dakuten', 'combo'] },
              { label: 'all kana 🌟', emoji: '🌟', groups: ['basic', 'dakuten', 'combo'], allTypes: true },
            ].map(p => {
              const groupsMatch = JSON.stringify([...selectedGroups].sort()) === JSON.stringify([...p.groups].sort())
              const typesMatch = !p.allTypes || (selectedTypes.includes('hiragana') && selectedTypes.includes('katakana'))
              const isActive = groupsMatch && typesMatch
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    if (isActive) {
                      // toggle off — reset to basic + current type
                      setSelectedGroups(['basic'])
                      if (p.allTypes) setSelectedTypes(['hiragana'])
                    } else {
                      setSelectedGroups(p.groups)
                      if (p.allTypes) setSelectedTypes(['hiragana', 'katakana'])
                    }
                  }}
                  style={{ ...styles.presetBtn, ...(isActive ? styles.presetBtnActive : {}) }}
                >
                  <span>{p.emoji}</span> {p.label}
                </button>
              )
            })}
          </div>

          {/* groups */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>
              <span>🎀</span> character groups
            </div>
            <div style={{ ...styles.groupRow, ...(isMobile ? styles.groupRowMobile : {}) }}>
              {kanaGroups.map(g => (
                <label
                  key={g.key}
                  style={{
                    ...styles.groupBtn,
                    ...(selectedGroups.includes(g.key) ? styles.groupBtnActive : {}),
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(g.key)}
                    onChange={() => toggleGroup(g.key)}
                    style={{ display: 'none' }}
                  />
                  <span style={styles.groupEmoji}>{g.emoji}</span>
                  <span style={styles.groupLabel}>{g.label}</span>
                  <span style={styles.groupBtnJp}>{g.labelJp}</span>
                </label>
              ))}
            </div>
            <div style={styles.poolInfo}>
              <span style={styles.poolCount}>{pool.length}</span> characters in pool
            </div>
          </div>

          {/* question count */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>
              <span>🔢</span> how many questions?
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              {[10, 20, 30].map(n => (
                <button key={n} onClick={() => setQuestionCount(Math.min(n, pool.length))} style={{
                  padding: '6px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                  background: questionCount === n ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                  color: questionCount === n ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 38,
                }}>{n}</button>
              ))}
              <button onClick={() => setQuestionCount('all')} style={{
                padding: '6px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                background: questionCount === 'all' ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                color: questionCount === 'all' ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 38,
              }}>all ({pool.length})</button>
            </div>
            <div style={styles.sliderWrap}>
              <div style={styles.sliderValueRow}>
                <input
                  type="number"
                  aria-label="number of questions"
                  min={5}
                  max={Math.max(pool.length, 5)}
                  value={questionCount === 'all' ? pool.length : questionCount}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') { setQuestionCount(5); return }
                    const v = parseInt(raw, 10)
                    if (isNaN(v)) return
                    if (v >= pool.length) setQuestionCount('all')
                    else setQuestionCount(Math.max(1, v))
                  }}
                  onBlur={() => {
                    if (questionCount !== 'all' && questionCount < 5) setQuestionCount(5)
                  }}
                  disabled={pool.length < 5}
                  style={styles.numberInput}
                />
              </div>
              <input
                type="range"
                className="kawaii-slider"
                min={5}
                max={Math.max(pool.length, 5)}
                value={questionCount === 'all' ? pool.length : questionCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  setQuestionCount(v >= pool.length ? 'all' : v)
                }}
                disabled={pool.length < 5}
                aria-label="number of questions"
              />
              <div style={styles.sliderLabels}>
                <span>5</span>
                <button
                  onClick={() => setQuestionCount('all')}
                  style={{
                    ...styles.allBtn,
                    ...(questionCount === 'all' ? styles.allBtnActive : {}),
                  }}
                >
                  all
                </button>
              </div>
            </div>
          </div>

          {/* timer */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}><span>⏱</span> timer per question</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[{ label: 'выкл', val: 0 }, { label: '5с', val: 5 }, { label: '10с', val: 10 }, { label: '15с', val: 15 }, { label: '20с', val: 20 }].map(({ label, val }) => (
                <button key={label} onClick={() => { setIsTimed(val > 0); if (val > 0) setTimeLimit(val); setCustomTimerVal('') }}
                  style={{ padding: '6px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', minHeight: 38,
                    background: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                    color: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
              <input type="number" min={3} max={60} placeholder="своё" aria-label="custom time limit in seconds"
                value={customTimerVal}
                onChange={e => { setCustomTimerVal(e.target.value); const v = parseInt(e.target.value, 10); if (v >= 3) { setIsTimed(true); setTimeLimit(v) } }}
                style={{ width: 58, padding: '6px 8px', borderRadius: 12, border: 'none', cursor: 'text', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit', textAlign: 'center', minHeight: 38,
                  background: customTimerVal ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)', color: customTimerVal ? '#fff' : 'var(--text-secondary)', outline: 'none' }} />
            </div>
          </div>

          {/* start */}
          <div style={styles.startWrap}>
            <button
              className="btn btn-cute"
              onClick={startQuiz}
              disabled={pool.length < 4}
              style={{ opacity: pool.length >= 4 ? 1 : 0.5, pointerEvents: pool.length >= 4 ? 'auto' : 'none', maxWidth: 240 }}
            >
              start quiz ✨
            </button>
            {pool.length < 4 && pool.length > 0 && (
              <p style={styles.warnText}>need at least 4 characters</p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              <Link to="/kana" className="btn btn-cute" style={{ fontSize: '0.85rem' }}>stroke order ✍️</Link>
              <Link to="/kana-chart" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>chart 📊</Link>
              <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
            </div>
          </div>
        </div>
      )}

      {showCountdown && <QuizCountdown onComplete={() => setShowCountdown(false)} />}

      {phase === PHASE_QUIZ && questions.length > 0 && (
        <div className="animate-fadeInUp">
          {/* progress */}
          <div style={styles.progressWrap}>
            <div style={styles.progressInfo}>
              <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
              <span style={styles.progressText}>{currentIndex + 1} / {questions.length}</span>
              <span style={styles.scoreText} aria-live="polite" aria-atomic="true">
                score: {score}
                {streak >= 3 && (
                  <span style={styles.streakBadge} className="animate-pop" key={streak}>
                    {streak >= 7 ? '🔥🔥' : streak >= 5 ? '🔥' : '⚡'} {streak}x
                  </span>
                )}
              </span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>
            {isTimed && (
              <div style={{ height: 4, background: 'rgba(192,132,252,0.15)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(timeLeft / timeLimit) * 100}%`, background: timeLeft <= 3 ? 'var(--incorrect-text)' : '#c084fc', borderRadius: 2, transition: 'width 0.1s linear, background 0.3s ease' }} />
              </div>
            )}
          </div>

          {/* question */}
          <div
            key={`question-card-${currentIndex}`}
            className="glass animate-pop"
            style={{
              ...styles.questionCard,
              ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
            }}
          >
            <div style={styles.questionLabel}>
              what is this character?
            </div>
            <div style={styles.questionKanaWrap}>
              <div style={styles.questionKana}>
                {questions[currentIndex].kana.char}
              </div>
            </div>
            <div style={styles.questionType}>
              {questions[currentIndex].kana.type === 'hiragana' ? 'ひらがな hiragana' : 'カタカナ katakana'}
            </div>

            {/* correct answer romaji shown after answering */}
            {selectedAnswer && isCorrect && (
              <div style={styles.correctRomajiReveal} className="animate-pop">
                {questions[currentIndex].kana.romaji}
              </div>
            )}

            {/* hint: show row mates */}
            {!selectedAnswer && questions[currentIndex].kana.row && (
              showHint
                ? (() => {
                    const mates = getRowMates(questions[currentIndex].kana)
                    return mates ? (
                      <div style={styles.hintBox} className="animate-pop">
                        <div style={styles.hintRowLabel}>{questions[currentIndex].kana.row}</div>
                        <div style={styles.hintRowChars}>
                          {mates.map(m => (
                            <span key={m.kana} style={{
                              ...styles.hintKanaChip,
                              ...(m.kana === questions[currentIndex].kana.char ? styles.hintKanaChipActive : {}),
                            }}>
                              {m.kana}
                              <span style={styles.hintKanaRom}>{m.romaji}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })()
                : <button onClick={() => setShowHint(true)} className="btn-hover" style={styles.hintBtn}>
                    💡 строка ({questions[currentIndex].kana.row})
                  </button>
            )}
          </div>

          {/* options */}
          <div key={`question-options-${currentIndex}`} style={{ ...styles.optionsGrid, gridTemplateColumns: '1fr 1fr' }}>
            {questions[currentIndex].options.map((opt) => {
              let optStyle = { ...styles.option }

              if (selectedAnswer) {
                if (opt.romaji === questions[currentIndex].kana.romaji) {
                  optStyle = { ...optStyle, ...styles.optionCorrect }
                } else if (selectedAnswer.romaji === opt.romaji && !isCorrect) {
                  optStyle = { ...optStyle, ...styles.optionIncorrect }
                } else {
                  optStyle = { ...optStyle, opacity: 0.45 }
                }
              }

              return (
                <button
                  key={`${currentIndex}-${opt.romaji}`}
                  onClick={() => handleAnswer(opt)}
                  className="glass-sm quiz-option"
                  style={optStyle}
                  disabled={showCountdown || selectedAnswer !== null}
                >
                  {opt.romaji}
                </button>
              )
            })}
          </div>

          {/* keyboard hint */}
          {!selectedAnswer && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span style={styles.keyHintChip}>⌨ 1–4</span>
            </div>
          )}

          {/* feedback */}
          {selectedAnswer && isCorrect && (
            <div style={{ ...styles.feedback, color: 'var(--correct-text)' }} className="animate-pop">
              ✨ correct! sugoi~
            </div>
          )}
          {selectedAnswer && !isCorrect && (
            <div className="glass animate-pop" style={styles.kanaExplanation}>
              <div style={styles.kanaExplWrong}>✗ wrong</div>
              <div style={styles.kanaExplChar}>{questions[currentIndex].kana.char}</div>
              <div style={styles.kanaExplRomaji}>{questions[currentIndex].kana.romaji}</div>
              <div style={styles.kanaExplYours}>you said: {selectedAnswer.romaji === '__TIMEOUT__' ? '⏱ время вышло' : selectedAnswer.romaji}</div>
            </div>
          )}
          {selectedAnswer && (
            <div style={{ ...styles.continueHint, cursor: 'pointer' }} onClick={skipDelay} role="button" tabIndex={0} aria-label="continue to next question" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipDelay() } }}>
              нажми чтобы продолжить →
            </div>
          )}
        </div>
      )}

      {phase === PHASE_RESULTS && (
        <KanaResultsScreen
          score={score}
          total={questions.length}
          percentage={percentage}
          reaction={reaction}
          mistakes={mistakes}
          bestStreak={bestStreak}
          questions={questions}
          isTablet={isTablet}
          onRetry={() => setPhase(PHASE_SETUP)}
          onRetryMistakes={startMistakesQuiz}
          calculateQuizXP={calculateQuizXP}
        />
      )}
    </div>
  )
}

function KanaResultsScreen({ score, total, percentage, reaction, mistakes, bestStreak, questions, isTablet, onRetry, onRetryMistakes, calculateQuizXP }) {
  const [repeatCount, setRepeatCount] = useState(1)

  return (
    <div className="animate-fadeInUp" style={styles.resultsWrap}>
      <div className="glass" style={{ ...styles.resultsCard, ...(isTablet ? styles.resultsCardTablet : {}) }}>
        <Confetti trigger={score === total} />
        <div style={styles.resultsEmoji}>{reaction.emoji}</div>
        <h2 style={styles.resultsTitle}>{reaction.textJp}</h2>
        <p style={styles.resultsText}>{reaction.text}</p>

        <div style={styles.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
          <div style={styles.scoreCircleInner}>
            <span style={styles.scoreBig}>{percentage}%</span>
            <span style={styles.scoreDetail}>{score === total ? 'perfect!' : `${score}/${total}`}</span>
          </div>
        </div>

        {calculateQuizXP(score, total) > 0 && (
          <div style={styles.xpBadge} className="animate-pop">
            <span style={styles.xpIcon}>⚡</span>
            <span style={styles.xpAmount}>+{calculateQuizXP(score, total)} XP</span>
          </div>
        )}

        {bestStreak >= 3 && (
          <div style={styles.bestStreak} className="animate-pop">
            {bestStreak >= 7 ? '🔥🔥' : bestStreak >= 5 ? '🔥' : '⚡'} best streak: {bestStreak}x
          </div>
        )}

        {/* hiragana / katakana breakdown */}
        {questions && (() => {
          const scripts = [
            { key: 'hiragana', label: 'hiragana あ', color: '#f472b6' },
            { key: 'katakana', label: 'katakana ア', color: '#a78bfa' },
          ]
          const rows = scripts.map(s => {
            const total = questions.filter(q => q.kana.type === s.key).length
            if (total === 0) return null
            const missed = mistakes.filter(m => m.kana.type === s.key).length
            const pct = Math.round(((total - missed) / total) * 100)
            return { ...s, total, pct }
          }).filter(Boolean)
          if (rows.length < 2) return null
          return (
            <div style={{ marginBottom: 14, width: '100%' }}>
              {rows.map(r => (
                <div key={r.key} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: r.color }}>{r.label}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 900, color: r.pct >= 80 ? 'var(--correct-text)' : r.pct >= 50 ? 'var(--gold-text)' : 'var(--incorrect-text)' }}>{r.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 50, background: 'rgba(192,132,252,0.12)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.pct}%`, borderRadius: 50, background: r.color, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* mistakes list */}
        {mistakes.length > 0 && (
          <div style={styles.mistakesSection}>
            <div style={styles.mistakesLabel}>mistakes ({mistakes.length}) ✏️</div>
            <div style={styles.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={m.kana.char + i} style={styles.mistakeItem}>
                  <div style={styles.mistakeWord}>{m.kana.char}</div>
                  <div style={styles.mistakeCorrect}>{m.kana.romaji}</div>
                  <div style={styles.mistakeYours}>you: {m.yourAnswer === '__TIMEOUT__' ? '⏱ время вышло' : m.yourAnswer}</div>
                </div>
              ))}
            </div>

            <div style={styles.retryMistakesWrap}>
              <div style={styles.repeatRow}>
                <span style={styles.repeatLabel}>repeat:</span>
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setRepeatCount(n)}
                    style={{
                      ...styles.repeatBtn,
                      ...(repeatCount === n ? styles.repeatBtnActive : {}),
                    }}
                  >
                    x{n}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onRetryMistakes(repeatCount)}
                style={{ fontSize: '0.85rem' }}
              >
                work on mistakes ({mistakes.length * repeatCount} qs)
              </button>
            </div>
          </div>
        )}

        <div style={styles.resultsActions}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-cute" onClick={onRetry} style={{ flex: 1 }}>try again 🌸</button>
            <ShareResult quizName="kana quiz" score={score} total={total} percentage={percentage} bestStreak={bestStreak} xpEarned={calculateQuizXP(score, total)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/kana" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>study kana ✍️</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: 24,
    padding: '8px 0',
  },
  headerKana: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  headerKanaChar: {
    fontSize: '3rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1,
    filter: 'drop-shadow(0 2px 6px rgba(244,114,182,0.3))',
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  titleJp: {
    fontSize: '0.9rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  setupCard: {
    padding: 22,
    marginBottom: 16,
  },
  setupLabel: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textTransform: 'lowercase',
  },
  typeRow: {
    display: 'flex',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    padding: '18px 12px',
    borderRadius: 18,
    background: 'var(--tint)',
    border: '2px solid rgba(192,132,252,0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'lowercase',
    position: 'relative',
  },
  typeBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    border: '2px solid #f472b6',
    boxShadow: '0 4px 16px rgba(244, 114, 182, 0.18)',
    color: 'var(--text-main)',
  },
  typeBtnEmoji: {
    fontSize: '2.2rem',
    fontWeight: 900,
    lineHeight: 1,
  },
  typeBtnLabel: {
    fontSize: '0.9rem',
    fontWeight: 800,
  },
  typeBtnJp: {
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  typeBtnCheck: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontSize: '0.72rem',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    width: 18,
    height: 18,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
  },
  groupRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  groupRowMobile: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  groupBtn: {
    flex: 1,
    minWidth: 90,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '12px 10px',
    borderRadius: 14,
    background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'lowercase',
    minHeight: 44,
  },
  groupBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    border: '1.5px solid #c084fc',
    boxShadow: '0 2px 10px rgba(192, 132, 252, 0.18)',
    color: 'var(--text-main)',
  },
  groupEmoji: {
    fontSize: '1.3rem',
    lineHeight: 1,
  },
  groupLabel: {
    fontSize: '0.88rem',
    fontWeight: 800,
  },
  groupBtnJp: {
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  presetBtn: {
    padding: '6px 14px', borderRadius: 50, border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'var(--tint-medium)', fontSize: '0.82rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
    minHeight: 44,
  },
  presetBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white', border: '1.5px solid transparent',
    boxShadow: '0 4px 14px rgba(236,72,153,0.3)',
  },
  poolInfo: {
    marginTop: 12,
    fontSize: '0.82rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    textAlign: 'center',
  },
  poolCount: {
    color: 'var(--text-light)',
    fontWeight: 900,
  },
  sliderWrap: {
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  sliderValueRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  numberInput: {
    width: 70, textAlign: 'center', fontSize: '1.3rem', fontWeight: 900,
    color: 'var(--text-main)', background: 'var(--tint)',
    border: '2px solid rgba(192,132,252,0.3)', borderRadius: 12,
    padding: '4px 8px', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  },
  sliderLabels: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)',
  },
  allBtn: {
    padding: '5px 12px', borderRadius: 12, background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'lowercase', minHeight: 36,
  },
  allBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent',
  },
  startWrap: {
    textAlign: 'center',
    marginTop: 20,
  },
  warnText: {
    marginTop: 8,
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  progressWrap: {
    marginTop: 28,
    marginBottom: 20,
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  scoreText: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 50,
    background: 'var(--tint-strong)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 50,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    transition: 'width 0.4s ease',
  },
  questionCard: {
    textAlign: 'center',
    padding: '28px 20px 22px',
    marginBottom: 16,
    borderRadius: 24,
    position: 'relative',
  },
  questionLabel: {
    fontSize: '0.9rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 20,
    textTransform: 'lowercase',
    letterSpacing: '0.03em',
  },
  questionKanaWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionKana: {
    fontSize: '6rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
    filter: 'drop-shadow(0 4px 12px rgba(244,114,182,0.2))',
    transition: 'transform 0.15s ease',
    userSelect: 'none',
  },
  questionType: {
    fontSize: '0.82rem',
    color: 'var(--text-light)',
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  correctRomajiReveal: {
    marginTop: 14,
    fontSize: '1.5rem',
    fontWeight: 900,
    color: 'var(--correct-text)',
    letterSpacing: '0.08em',
    textTransform: 'lowercase',
    filter: 'drop-shadow(0 2px 6px rgba(16,185,129,0.25))',
  },
  keyHintChip: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 50,
    background: 'rgba(168,85,247,0.08)', color: 'var(--text-light)',
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.02em',
  },
  hintBtn: {
    padding: '4px 14px', borderRadius: 20, border: '1.5px solid rgba(192,132,252,0.35)',
    background: 'var(--tint)', color: 'var(--text-light)', fontSize: '0.8rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  hintBox: {
    marginTop: 12, padding: '10px 14px', borderRadius: 12,
    background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)',
  },
  hintRowLabel: {
    fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)',
    marginBottom: 6, textAlign: 'center',
  },
  hintRowChars: {
    display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
  },
  hintKanaChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
    padding: '4px 8px', borderRadius: 8,
    background: 'var(--tint)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)',
  },
  hintKanaChipActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(192,132,252,0.2))',
    border: '1.5px solid #c084fc',
  },
  hintKanaRom: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', letterSpacing: '0.05em',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 16,
  },
  option: {
    padding: '18px 14px',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    background: 'var(--tint)',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
    minHeight: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  optionCorrect: {
    background: 'rgba(16, 185, 129, 0.15)',
    boxShadow: '0 0 0 2px var(--correct-text), 0 4px 16px rgba(16, 185, 129, 0.25)',
    color: 'var(--correct-text)',
  },
  optionIncorrect: {
    background: 'rgba(168, 85, 247, 0.12)',
    boxShadow: '0 0 0 2px #a855f7',
    color: 'var(--incorrect-purple-text)',
    ...(prefersReducedMotion ? {} : { animation: 'shake 0.4s ease' }),
  },
  feedback: {
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 800,
    padding: '8px 12px',
  },
  kanaExplanation: {
    padding: '14px 18px', textAlign: 'center', marginBottom: 6,
    background: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(251,113,133,0.03))',
    border: '1.5px solid rgba(244,63,94,0.2)',
  },
  kanaExplWrong: {
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--incorrect-text)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
  },
  kanaExplChar: {
    fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: 4,
  },
  kanaExplRomaji: {
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 6,
  },
  kanaExplYours: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--incorrect-text)', fontStyle: 'italic', opacity: 0.8,
  },
  continueHint: {
    textAlign: 'center',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    marginTop: 4,
  },
  resultsWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 120px)',
    paddingBottom: 90,
  },
  resultsCard: {
    textAlign: 'center',
    padding: '36px 28px',
    maxWidth: 440,
    width: '100%',
    borderRadius: 24,
  },
  resultsCardTablet: {
    maxWidth: 560,
    padding: '42px 34px',
  },
  resultsEmoji: {
    fontSize: '2.8rem',
    marginBottom: 10,
  },
  resultsTitle: {
    fontSize: '1.65rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 6,
  },
  resultsText: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginBottom: 24,
    textTransform: 'lowercase',
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 28px rgba(236, 72, 153, 0.3)',
  },
  scoreCircleInner: {
    width: 108,
    height: 108,
    borderRadius: '50%',
    background: 'var(--tint-solid)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBig: {
    fontSize: '1.9rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
  },
  scoreDetail: {
    fontSize: '0.82rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginTop: 2,
  },
  mistakesSection: {
    marginBottom: 20,
    textAlign: 'left',
  },
  mistakesLabel: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  mistakesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  mistakeItem: {
    background: 'rgba(168, 85, 247, 0.07)',
    boxShadow: '3px 0 0 0 #a855f7 inset',
    borderRadius: 10,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  mistakeWord: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    minWidth: 48,
    textAlign: 'center',
  },
  mistakeCorrect: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--correct-text)',
  },
  mistakeYours: {
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginLeft: 'auto',
  },
  retryMistakesWrap: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  repeatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  repeatLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  repeatBtn: {
    padding: '4px 12px',
    borderRadius: 50,
    background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    border: '1.5px solid transparent',
  },
  resultsActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  xpBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '6px 18px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
    border: '1.5px solid rgba(251, 191, 36, 0.4)',
    margin: '-10px auto 20px',
    width: 'fit-content',
  },
  xpIcon: {
    fontSize: '1rem',
  },
  xpAmount: {
    fontSize: '0.9rem',
    fontWeight: 800,
    color: 'var(--gold-text)',
  },
  streakBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 12px', borderRadius: 50,
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: 'white', fontSize: '0.75rem', fontWeight: 800,
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
    marginLeft: 8,
  },
  bestStreak: {
    fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-text)',
    margin: '-10px 0 16px', textAlign: 'center',
  },
}
