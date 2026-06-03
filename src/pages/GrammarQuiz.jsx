import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { lessons } from '../data/lessons'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import { useIsTablet } from '../hooks/useIsMobile'
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

function pickUniqueGrammarOptions(candidates, grammar, limit = 3) {
  const seen = new Set([`${grammar.pattern}::${grammar.meaning}`])
  const picked = []

  candidates.forEach(option => {
    const key = `${option.pattern}::${option.meaning}`
    if (picked.length >= limit || seen.has(key)) return
    seen.add(key)
    picked.push(option)
  })

  return picked
}

// Build grammar questions from lesson data
function buildGrammarQuestions(selectedLessons, count, lessonPool) {
  const allGrammar = lessonPool
    .filter(l => selectedLessons.includes(l.id))
    .flatMap(l => l.grammar.map(g => ({ ...g, lessonId: l.id })))

  if (allGrammar.length < 4) return []

  const selected = count === 'all'
    ? shuffle(allGrammar)
    : shuffle(allGrammar).slice(0, Math.min(count, allGrammar.length))

  return selected.map(grammar => {
    // Generate wrong options — prefer items with different meaning, fill gaps with pattern-only pool
    const strictPool = shuffle(allGrammar.filter(g => g.pattern !== grammar.pattern && g.meaning !== grammar.meaning))
    const loosePool = shuffle(allGrammar.filter(g => g.pattern !== grammar.pattern && g.meaning === grammar.meaning))
    const wrongOptions = pickUniqueGrammarOptions([...strictPool, ...loosePool], grammar)
    const options = shuffle([grammar, ...wrongOptions])

    return { grammar, options }
  })
}

const scoreReactions = [
  { min: 90, emoji: '🎉✨📚', text: 'kanpeki!! грамматика на высоте!', textJp: '完璧！', encouragement: 'Ты настоящий мастер грамматики. Язык течёт через тебя.' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! отлично!', textJp: 'よくできました！', encouragement: 'Грамматика крепчает. Ещё немного — и будет совсем легко.' },
  { min: 50, emoji: '🐱💪', text: 'mou chotto~ ещё немного!', textJp: 'もうちょっと！', encouragement: 'Хорошее начало! Повторение — мать учения.' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! повтори грамматику~', textJp: 'がんばって！', encouragement: 'Грамматика — скелет языка. Построй его ещё раз, крепче.' },
]

const correctPhrases = [
  '✨ correct! sugoi~',
  '🌸 perfect! yoku dekita!',
  '⚡ hai, sou desu! верно!',
  '🎉 素晴らしい! subarashii!',
  '✔ exactly right!',
  '🌟 kanpeki! идеально!',
]

const wrongPhrases = [
  '✗ не совсем...',
  '✗ попробуй ещё раз~',
  '✗ ошибочка, смотри:',
  '✗ почти! правильный ответ:',
]

let correctPhraseIdx = 0
let wrongPhraseIdx = 0

function nextCorrectPhrase() {
  const p = correctPhrases[correctPhraseIdx % correctPhrases.length]
  correctPhraseIdx++
  return p
}

function nextWrongPhrase() {
  const p = wrongPhrases[wrongPhraseIdx % wrongPhrases.length]
  wrongPhraseIdx++
  return p
}

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

export default function GrammarQuiz() {
  const { saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()
  const isTablet = useIsTablet()
  const { unlockedLessons } = useUnlockedLessons()
  const [searchParams] = useSearchParams()
  const sharedLessonId = parseInt(searchParams.get('lesson') || '', 10)
  const sharedLesson = Number.isFinite(sharedLessonId) ? lessons.find(l => l.id === sharedLessonId) : null
  const lessonPool = useMemo(() => (
    sharedLesson && !unlockedLessons.some(l => l.id === sharedLesson.id)
      ? [...unlockedLessons, sharedLesson]
      : unlockedLessons
  ), [sharedLesson, unlockedLessons])
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [showCountdown, setShowCountdown] = useState(false)

  // setup
  const [selectedLessons, setSelectedLessons] = useState([])
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)
  const [quizMode, setQuizMode] = useState('meaning') // 'meaning' = show meaning guess pattern, 'pattern' = show pattern guess meaning
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(20)
  const [customTimerVal, setCustomTimerVal] = useState('')

  // quiz
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [feedbackPhrase, setFeedbackPhrase] = useState('')
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [questionKey, setQuestionKey] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const quickStarted = useRef(false)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)
  const [mistakesList, setMistakesList] = useState([])
  const mistakesRef = useRef([])

  // Reset hint on new question
  useEffect(() => { setShowHint(false) }, [currentIndex])

  // Timer countdown
  useEffect(() => { if (isTimed && phase === PHASE_QUIZ) setTimeLeft(timeLimit) }, [currentIndex, isTimed, timeLimit, phase])
  useEffect(() => {
    if (!isTimed || phase !== PHASE_QUIZ || selectedAnswer !== null) { clearInterval(countdownRef.current); return }
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(countdownRef.current)
          handleAnswer({ pattern: '__TIMEOUT__', meaning: '__TIMEOUT__' })
          return 0
        }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(countdownRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimed, phase, selectedAnswer, currentIndex])

  // Auto-select lessons on first load; if ?lesson=N param, pre-select just that lesson
  useEffect(() => {
    if (lessonPool.length > 0 && selectedLessons.length === 0) {
      const lessonParam = searchParams.get('lesson')
      const lessonId = lessonParam ? parseInt(lessonParam, 10) : null
      if (lessonId && lessonPool.some(l => l.id === lessonId)) {
        setSelectedLessons([lessonId])
      } else {
        setSelectedLessons(lessonPool.map(l => l.id))
      }
    }
  }, [lessonPool, searchParams, selectedLessons.length])

  // Quick start: ?quick=N auto-starts with N questions
  useEffect(() => {
    if (quickStarted.current || lessonPool.length === 0 || selectedLessons.length === 0 || phase !== PHASE_SETUP) return
    const quick = searchParams.get('quick')
    if (!quick) return
    quickStarted.current = true
    const count = parseInt(quick, 10) || 5
    setQuestionCount(count)
    const t = setTimeout(() => {
      const qs = buildGrammarQuestions(selectedLessons, count, lessonPool)
      if (qs.length >= 1) { xpAwardedRef.current = false; resetQuizState(qs) }
    }, 300)
    return () => clearTimeout(t)
  }, [lessonPool, selectedLessons, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const availableLessons = lessonPool.map(l => ({
    id: l.id,
    title: l.title,
    titleJp: l.titleJp,
    topic: l.topic,
    count: l.grammar.length,
  }))

  const toggleLesson = (id) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedLessons.length === availableLessons.length) {
      setSelectedLessons([])
    } else {
      setSelectedLessons(availableLessons.map(l => l.id))
    }
  }

  const totalGrammar = lessonPool
    .filter(l => selectedLessons.includes(l.id))
    .reduce((sum, l) => sum + l.grammar.length, 0)

  const resetQuizState = (qs) => {
    correctPhraseIdx = 0
    wrongPhraseIdx = 0
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setFeedbackPhrase('')
    setStreak(0)
    setBestStreak(0)
    setQuestionKey(0)
    answerLockedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const startQuiz = () => {
    const qs = buildGrammarQuestions(selectedLessons, questionCount, lessonPool)
    if (qs.length < 1) return
    xpAwardedRef.current = false
    resetQuizState(qs)
  }

  const startMistakesQuiz = () => {
    if (mistakesList.length === 0) return
    const allGrammar = lessonPool.flatMap(l => l.grammar.map(g => ({ ...g, lessonId: l.id })))
    const missedGrammar = mistakesList.map(m => m.grammar)
    const qs = missedGrammar.map(grammar => {
      const wrongPool = shuffle(allGrammar.filter(g => g.pattern !== grammar.pattern && g.meaning !== grammar.meaning))
      const wrongOptions = pickUniqueGrammarOptions(wrongPool, grammar)
      return { grammar, options: shuffle([grammar, ...wrongOptions]) }
    })
    if (qs.length === 0) return
    setMistakesList([])
    resetQuizState(qs)
  }

  const handleAnswer = useCallback((option) => {
    if (selectedAnswer !== null || answerLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = false

    const correct = quizMode === 'meaning'
      ? option.pattern === questions[currentIndex].grammar.pattern
      : option.meaning === questions[currentIndex].grammar.meaning
    setSelectedAnswer(option)
    setIsCorrect(correct)
    setFeedbackPhrase(correct ? nextCorrectPhrase() : nextWrongPhrase())

    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => {
        const newStreak = prev + 1
        setBestStreak(best => Math.max(best, newStreak))
        return newStreak
      })
    } else {
      mistakesRef.current = [...mistakesRef.current, {
        grammar: questions[currentIndex].grammar,
        yourAnswer: option,
      }]
      setStreak(0)
    }

    const delay = correct ? 6000 : 9000

    timerRef.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true

      if (currentIndex + 1 >= questions.length) {
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
        setFeedbackPhrase('')
        setQuestionKey(prev => prev + 1)
        answerLockedRef.current = false
      }
    }, delay)
  }, [selectedAnswer, questions, currentIndex, quizMode])

  const handleNext = useCallback(() => {
    if (!selectedAnswer || advanceLockedRef.current) return
    advanceLockedRef.current = true
    clearTimeout(timerRef.current)
    if (currentIndex + 1 >= questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setFeedbackPhrase('')
      setQuestionKey(prev => prev + 1)
      answerLockedRef.current = false
    }
  }, [selectedAnswer, currentIndex, questions.length])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Keyboard shortcuts: press 1-4 to select answer
  useEffect(() => {
    if (phase !== PHASE_QUIZ || questions.length === 0) return
    const handler = (e) => {
      if (selectedAnswer !== null) return
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && questions[currentIndex].options[num - 1]) {
        handleAnswer(questions[currentIndex].options[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, selectedAnswer, questions, currentIndex, handleAnswer])

  // Enter/Space to skip delay after answering
  useEffect(() => {
    if (phase !== PHASE_QUIZ || selectedAnswer === null) return
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, selectedAnswer, handleNext])

  // save scores (only once per quiz session)
  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      saveQuizResult('grammar', { lessons: selectedLessons, score, total: questions.length })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'grammar quiz', score === questions.length && questions.length > 0)
    }
  }, [phase, score, questions.length, selectedLessons, saveQuizResult, awardXP, calculateQuizXP])

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const reaction = scoreReactions.find(r => percentage >= r.min) || scoreReactions[scoreReactions.length - 1]

  useEffect(() => {
    if (phase === PHASE_RESULTS) {
      setMistakesList(mistakesRef.current)
    }
    if (phase === PHASE_QUIZ) {
      mistakesRef.current = []
    }
  }, [phase])


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
          <div style={styles.header}>
            <h1 style={styles.title}>
              <span>文</span> grammar quiz <span style={styles.titleJp}>ぶんぽうテスト</span>
            </h1>
            <p style={styles.subtitle}>test your grammar patterns — the skeleton of Japanese 📚</p>
          </div>

          {/* lesson selection */}
          <div className="glass" style={styles.setupCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={styles.setupLabel}>
                <span>📖</span> уроки
              </div>
              <button onClick={selectAll} className="btn-hover" style={styles.selectAllBtn}>
                {selectedLessons.length === availableLessons.length ? 'снять всё' : 'все'}
              </button>
            </div>
            <div style={styles.lessonCheckGrid}>
              {availableLessons.map(l => (
                <label
                  key={l.id}
                  style={{
                    ...styles.lessonCheck,
                    ...(selectedLessons.includes(l.id) ? styles.lessonCheckActive : {}),
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedLessons.includes(l.id)}
                    onChange={() => toggleLesson(l.id)}
                    style={{ display: 'none' }}
                  />
                  <span style={styles.checkNum}>{l.id}</span>
                  <span style={{ ...styles.checkJp, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.topic || l.title}</span>
                  <span style={styles.checkCount}>{l.count} гр.</span>
                </label>
              ))}
            </div>
            {selectedLessons.length > 0 && (
              <div style={styles.poolInfo}>
                {totalGrammar} grammar patterns in pool 📚
              </div>
            )}
          </div>

          {/* question count */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>
              <span>🔢</span> how many questions?
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              {[5, 10, 20].map(n => (
                <button key={n} onClick={() => setQuestionCount(Math.min(n, totalGrammar))} style={{
                  padding: '6px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                  background: questionCount === n ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                  color: questionCount === n ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 38, minWidth: 44,
                }}>{n}</button>
              ))}
              <button onClick={() => setQuestionCount('all')} style={{
                padding: '6px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                background: questionCount === 'all' ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                color: questionCount === 'all' ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 38, minWidth: 44,
              }}>all ({totalGrammar})</button>
            </div>
            <div style={styles.sliderWrap}>
              <div style={styles.sliderValueRow}>
                <input
                  type="number"
                  aria-label="number of questions"
                  min={4}
                  max={Math.max(totalGrammar, 4)}
                  value={questionCount === 'all' ? totalGrammar : questionCount}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') { setQuestionCount(4); return }
                    const v = parseInt(raw, 10)
                    if (isNaN(v)) return
                    if (v >= totalGrammar) setQuestionCount('all')
                    else setQuestionCount(Math.max(1, v))
                  }}
                  onBlur={() => {
                    if (questionCount !== 'all' && questionCount < 4) setQuestionCount(4)
                  }}
                  disabled={totalGrammar < 4}
                  style={styles.numberInput}
                />
              </div>
              <input
                type="range"
                className="kawaii-slider"
                min={4}
                max={Math.max(totalGrammar, 4)}
                value={questionCount === 'all' ? totalGrammar : questionCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  setQuestionCount(v >= totalGrammar ? 'all' : v)
                }}
                aria-label="number of questions"
                disabled={totalGrammar < 4}
              />
              <div style={styles.sliderLabels}>
                <span>4</span>
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

          {/* quiz mode */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>
              <span>🔄</span> quiz mode
            </div>
            <div style={styles.modeRow}>
              <button
                onClick={() => setQuizMode('meaning')}
                style={{
                  ...styles.modeBtn,
                  ...(quizMode === 'meaning' ? styles.modeBtnActive : {}),
                }}
              >
                <span style={styles.modeBtnIcon}>💡</span>
                meaning → pattern
              </button>
              <button
                onClick={() => setQuizMode('pattern')}
                style={{
                  ...styles.modeBtn,
                  ...(quizMode === 'pattern' ? styles.modeBtnActive : {}),
                }}
              >
                <span style={styles.modeBtnIcon}>📖</span>
                pattern → meaning
              </button>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
              {quizMode === 'meaning' ? 'see meaning, guess the grammar pattern' : 'see pattern, guess what it means'}
            </div>
          </div>

          {/* timer */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>⏱ timer per question</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[{ label: 'выкл', val: 0 }, { label: '15с', val: 15 }, { label: '20с', val: 20 }, { label: '30с', val: 30 }, { label: '45с', val: 45 }].map(({ label, val }) => (
                <button key={label} onClick={() => { setIsTimed(val > 0); if (val > 0) setTimeLimit(val); setCustomTimerVal('') }}
                  style={{ padding: '6px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit', minHeight: 38,
                    background: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                    color: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
              <input type="number" min={5} max={120} placeholder="своё" aria-label="custom time limit in seconds"
                value={customTimerVal}
                onChange={e => { setCustomTimerVal(e.target.value); const v = parseInt(e.target.value, 10); if (v >= 5) { setIsTimed(true); setTimeLimit(v) } }}
                style={{ width: 58, padding: '6px 8px', borderRadius: 12, border: 'none', cursor: 'text', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit', textAlign: 'center', minHeight: 38,
                  background: customTimerVal ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)', color: customTimerVal ? '#fff' : 'var(--text-secondary)', outline: 'none' }} />
            </div>
          </div>

          {/* start */}
          <div style={styles.startWrap}>
            <button
              className="btn btn-cute"
              onClick={startQuiz}
              disabled={totalGrammar < 4}
              style={{ opacity: totalGrammar >= 4 ? 1 : 0.5, pointerEvents: totalGrammar >= 4 ? 'auto' : 'none', maxWidth: 260 }}
            >
              start quiz ✨
            </button>
            <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem', marginTop: 8 }}>home 🏠</Link>
            {totalGrammar > 0 && totalGrammar < 4 && (
              <p style={styles.warnText}>need at least 4 grammar patterns</p>
            )}
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
                score: {score} 📚
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
                <div style={{ height: '100%', width: `${(timeLeft / timeLimit) * 100}%`, background: timeLeft <= 5 ? '#ef4444' : '#c084fc', borderRadius: 2, transition: 'width 0.1s linear, background 0.3s ease' }} />
              </div>
            )}
          </div>

          {/* question */}
          <div
            className="glass animate-pop"
            key={`question-${questionKey}`}
            style={{
              ...styles.questionCard,
              ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
            }}
          >
            {quizMode === 'meaning' ? (
              <>
                <div style={styles.questionLabel}>
                  какая конструкция имеет это значение?
                </div>
                <div style={styles.questionMeaning}>
                  {questions[currentIndex].grammar.meaning}
                </div>
                <div style={styles.questionHintChip}>
                  meaning → pattern
                </div>
              </>
            ) : (
              <>
                <div style={styles.questionLabel}>
                  что означает эта конструкция?
                </div>
                <div style={styles.questionPatternWrap}>
                  <span style={styles.questionPattern}>
                    {questions[currentIndex].grammar.pattern}
                  </span>
                </div>
                <div style={styles.questionHintChip}>
                  pattern → meaning
                </div>
              </>
            )}
            {questions[currentIndex].grammar.lessonId && (
              <div style={styles.questionLesson}>
                урок {questions[currentIndex].grammar.lessonId}
              </div>
            )}

            {/* hint: show first example sentence */}
            {!selectedAnswer && (
              showHint
                ? (() => {
                    const ex = questions[currentIndex].grammar.examples?.[0]
                    return ex ? (
                      <div style={styles.hintBox} className="animate-pop">
                        <div style={styles.hintJp}>{ex.jp}</div>
                        <div style={styles.hintRu}>{ex.ru}</div>
                      </div>
                    ) : null
                  })()
                : <button onClick={() => setShowHint(true)} className="btn-hover" style={styles.hintBtn}>
                    💡 пример
                  </button>
            )}
          </div>

          {/* keyboard hint */}
          {!selectedAnswer && (
            <div style={styles.keyHintChip}>
              ⌨ 1–4 to answer · enter to skip
            </div>
          )}

          {/* options */}
          <div key={`options-${currentIndex}`} style={styles.optionsGridGrammar}>
            {questions[currentIndex].options.map((opt, i) => {
              let optStyle = { ...styles.optionGrammar }
              const isOptionCorrect = quizMode === 'meaning'
                ? opt.pattern === questions[currentIndex].grammar.pattern
                : opt.meaning === questions[currentIndex].grammar.meaning
              const isSelectedWrong = quizMode === 'meaning'
                ? selectedAnswer?.pattern === opt.pattern && !isCorrect
                : selectedAnswer?.meaning === opt.meaning && !isCorrect

              if (selectedAnswer) {
                if (isOptionCorrect) {
                  optStyle = { ...optStyle, ...styles.optionCorrect }
                } else if (isSelectedWrong) {
                  optStyle = { ...optStyle, ...styles.optionIncorrect }
                } else {
                  optStyle = { ...optStyle, opacity: 0.5 }
                }
              }

              return (
                <button
                  key={`${currentIndex}-${i}`}
                  onClick={() => handleAnswer(opt)}
                  className="glass-sm quiz-option"
                  style={optStyle}
                  disabled={selectedAnswer !== null}
                >
                  <span style={styles.optionNumber}>{i + 1}</span>
                  {quizMode === 'meaning' ? (
                    <span style={isOptionCorrect && selectedAnswer ? styles.optionTextCorrect : undefined}>
                      {opt.pattern}
                    </span>
                  ) : (
                    opt.meaning
                  )}
                </button>
              )
            })}
          </div>

          {/* feedback with explanation */}
          {selectedAnswer && (
            <div className="animate-pop">
              <div
                style={{
                  ...styles.feedback,
                  color: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)',
                }}
              >
                {isCorrect ? (
                  <>
                    {feedbackPhrase}
                    {questions[currentIndex].grammar.examples?.[0] && (
                      <span style={styles.correctExample}> — {questions[currentIndex].grammar.examples[0].jp}</span>
                    )}
                  </>
                ) : feedbackPhrase}
              </div>
              {selectedAnswer && (
                <div className="glass" style={styles.explanationCard}>
                  <div style={styles.explanationPatternRow}>
                    <span style={styles.explanationPatternLabel}>{isCorrect ? 'pattern:' : 'correct answer:'}</span>
                    <span style={styles.explanationTitle}>
                      {questions[currentIndex].grammar.pattern}
                    </span>
                  </div>
                  <div style={styles.explanationMeaning}>
                    {questions[currentIndex].grammar.meaning}
                  </div>
                  {(!isCorrect && questions[currentIndex].grammar.explanation) && (
                    <div style={styles.explanationText}>
                      {questions[currentIndex].grammar.explanation}
                    </div>
                  )}
                  {questions[currentIndex].grammar.lessonId && (
                    <Link to={`/lessons/${questions[currentIndex].grammar.lessonId}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', display: 'inline-block', marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
                      lesson {questions[currentIndex].grammar.lessonId} →
                    </Link>
                  )}
                  {questions[currentIndex].grammar.examples && questions[currentIndex].grammar.examples.length > 0 && (
                    <div style={styles.exampleSection}>
                      <div style={styles.exampleLabel}>example:</div>
                      {questions[currentIndex].grammar.examples.slice(0, 1).map((ex, i) => (
                        <div key={i} style={styles.exampleItem}>
                          <div style={styles.exampleJp}>{ex.jp}</div>
                          <div style={styles.exampleRomaji}>{ex.romaji}</div>
                          <div style={styles.exampleRu}>{ex.ru}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {selectedAnswer && (
            <div style={{ textAlign: 'center', marginTop: 6, marginBottom: 2 }}>
              <span style={{ ...styles.keyHintChip, marginBottom: 0, fontSize: '0.72rem' }}>⌨ enter ↵ · далее</span>
            </div>
          )}
          {selectedAnswer && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <button
                onClick={handleNext}
                style={{
                  padding: '10px 28px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #f472b6, #c084fc)',
                  color: '#fff',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(196,85,252,0.3)',
                  minHeight: 44,
                }}
              >
                далее →
              </button>
            </div>
          )}
        </div>
      )}

      {phase === PHASE_RESULTS && (
        <div className="animate-fadeInUp" style={styles.resultsWrap}>
          <div className="glass" style={{ ...styles.resultsCard, ...(isTablet ? styles.resultsCardTablet : {}) }}>
            {percentage >= 90 && <Confetti trigger={true} />}
            <div style={styles.resultsEmoji}>{reaction.emoji}</div>
            <h2 style={styles.resultsTitle}>{reaction.textJp}</h2>
            <p style={styles.resultsText}>{reaction.text}</p>

            <div style={styles.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
              <div style={styles.scoreCircleInner}>
                <span style={styles.scoreBig}>{percentage}%</span>
                <span style={styles.scoreDetail}>{score}/{questions.length}</span>
              </div>
            </div>

            {calculateQuizXP(score, questions.length) > 0 && (
              <div style={styles.xpBadge} className="animate-pop">
                <span style={styles.xpIcon}>⚡</span>
                <span style={styles.xpAmount}>+{calculateQuizXP(score, questions.length)} XP</span>
              </div>
            )}

            {bestStreak >= 3 && (
              <div style={styles.bestStreak} className="animate-pop">
                {bestStreak >= 7 ? '🔥🔥' : bestStreak >= 5 ? '🔥' : '⚡'} best streak: {bestStreak}x
              </div>
            )}

            {/* encouraging message */}
            <div style={styles.encouragement}>
              {reaction.encouragement}
            </div>

            {/* mistakes review */}
            {mistakesList.length > 0 && (
              <div style={styles.mistakesSection}>
                <div style={styles.mistakesLabel}>mistakes ({mistakesList.length}) ✏️</div>
                <div style={styles.mistakesList}>
                  {mistakesList.map((m, i) => (
                    <div key={(m.grammar.pattern || '') + i} style={styles.mistakeItem}>
                      <div style={styles.mistakePattern}>
                        {m.grammar.pattern}
                      </div>
                      <div style={styles.mistakeMeaning}>
                        {m.grammar.meaning}
                      </div>
                      {m.grammar.examples?.[0] && (
                        <div style={styles.mistakeExample}>
                          {m.grammar.examples[0].jp}
                        </div>
                      )}
                      {m.grammar.lessonId && (
                        <Link to={`/lessons/${m.grammar.lessonId}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                          lesson {m.grammar.lessonId} →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.resultsActions}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-cute" onClick={() => { setMistakesList([]); setPhase(PHASE_SETUP) }} style={{ flex: 1 }}>try again 📚</button>
                <ShareResult quizName="grammar quiz" score={score} total={questions.length} percentage={percentage} bestStreak={bestStreak} xpEarned={calculateQuizXP(score, questions.length)} />
              </div>
              {mistakesList.length > 0 && (
                <button className="btn btn-primary" onClick={startMistakesQuiz} style={{ width: '100%' }}>
                  drill mistakes ({mistakesList.length}) 🔥
                </button>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/quiz/fill-in" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>fill-in ✏️</Link>
                <Link to="/grammar" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>explore 📜</Link>
                <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  header: { textAlign: 'center', marginBottom: 20, padding: '8px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  titleJp: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },
  setupCard: { padding: 22, marginBottom: 16 },
  setupLabel: {
    fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 8, textTransform: 'lowercase',
  },
  selectAllBtn: {
    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(168, 85, 247, 0.08)',
    padding: '6px 10px', borderRadius: 12, marginBottom: 10, textTransform: 'lowercase',
    cursor: 'pointer', border: 'none', minHeight: 38,
  },
  lessonCheckGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8,
  },
  lessonCheck: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12,
    background: 'var(--tint)', border: '1.5px solid rgba(192,132,252,0.25)',
    cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '0.8rem', minHeight: 44,
  },
  lessonCheckActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    border: '1.5px solid rgba(192,132,252,0.6)', boxShadow: '0 2px 8px rgba(192,132,252,0.12)',
  },
  checkNum: { fontWeight: 800, color: 'var(--text-light)', fontSize: '0.8rem', minWidth: 18, textAlign: 'center' },
  checkJp: { fontWeight: 600, color: 'var(--text-main)', flex: 1, fontSize: '0.78rem' },
  checkCount: { fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600 },
  poolInfo: { marginTop: 10, fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 700, textAlign: 'center' },
  sliderWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
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
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'lowercase', minHeight: 36, minWidth: 44,
  },
  allBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent',
  },
  modeRow: {
    display: 'flex', gap: 8, justifyContent: 'center',
  },
  modeBtn: {
    flex: 1, padding: '14px 12px', borderRadius: 12,
    border: '1.5px solid rgba(192,132,252,0.2)', background: 'var(--tint-light)',
    fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 52,
  },
  modeBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.18), rgba(192,132,252,0.18))',
    border: '1.5px solid #f472b6', color: 'var(--text-light)',
    boxShadow: '0 2px 8px rgba(244, 114, 182, 0.2)',
  },
  modeBtnIcon: { fontSize: '1rem' },
  startWrap: { textAlign: 'center', marginTop: 20, marginBottom: 100 },
  warnText: { marginTop: 8, fontSize: '0.75rem', color: 'var(--incorrect-text)', fontWeight: 600 },
  progressWrap: { marginTop: 28, marginBottom: 20 },
  progressInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' },
  scoreText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-light)' },
  progressBar: { height: 8, borderRadius: 50, background: 'var(--tint-strong)', overflow: 'hidden' },
  progressFill: {
    height: '100%', borderRadius: 50, background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    transition: 'width 0.4s ease',
  },
  questionCard: { textAlign: 'center', padding: '28px 20px', marginBottom: 14 },
  questionLabel: {
    fontSize: '1rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 16, textTransform: 'lowercase',
  },
  questionMeaning: {
    fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.4, marginBottom: 10,
  },
  questionPatternWrap: {
    display: 'flex', justifyContent: 'center', marginBottom: 10,
  },
  questionPattern: {
    fontSize: '1.7rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.3,
    fontFamily: "'Noto Sans JP', sans-serif",
    background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(244,114,182,0.08))',
    padding: '6px 18px', borderRadius: 12,
    border: '1.5px solid rgba(168,85,247,0.2)',
    display: 'inline-block',
  },
  questionHintChip: {
    display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--text-light)', background: 'rgba(192,132,252,0.1)',
    padding: '3px 10px', borderRadius: 50, marginTop: 4,
  },
  questionLesson: { fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, marginTop: 8 },
  hintBtn: {
    padding: '4px 14px', borderRadius: 20, border: '1.5px solid rgba(192,132,252,0.35)',
    background: 'var(--tint)', color: 'var(--text-light)', fontSize: '0.8rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10, display: 'inline-block', minHeight: 44,
  },
  hintBox: {
    marginTop: 10, padding: '8px 12px', borderRadius: 10,
    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
    textAlign: 'left',
  },
  hintJp: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 },
  hintRu: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)' },
  keyHintChip: {
    textAlign: 'center', fontSize: '0.78rem', fontWeight: 700,
    color: 'var(--text-light)', marginBottom: 10,
    display: 'flex', justifyContent: 'center',
  },
  optionsGridGrammar: {
    display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 16,
  },
  optionGrammar: {
    padding: '18px 28px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center',
    cursor: 'pointer', transition: 'all 0.2s ease', border: 'none', background: 'var(--tint)',
    position: 'relative', minHeight: 62, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  optionTextCorrect: {
    color: 'var(--correct-text)',
  },
  optionNumber: {
    position: 'absolute', top: 6, left: 8, fontSize: '0.72rem', fontWeight: 800,
    color: 'var(--text-light)', opacity: 0.7, lineHeight: 1,
    background: 'rgba(192,132,252,0.15)', borderRadius: 4,
    padding: '1px 4px',
  },
  optionCorrect: {
    background: 'rgba(16, 185, 129, 0.15)', border: '2px solid var(--correct-text)', color: 'var(--correct-text)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
  },
  optionIncorrect: {
    background: 'rgba(168, 85, 247, 0.12)', border: '2px solid rgba(168, 85, 247, 0.6)', color: 'var(--text-main)',
    ...(prefersReducedMotion ? {} : { animation: 'shake 0.4s ease' }),
  },
  feedback: { textAlign: 'center', fontSize: '1rem', fontWeight: 800, padding: '10px 12px' },
  explanationCard: { padding: 18, marginBottom: 16 },
  explanationPatternRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap',
  },
  explanationPatternLabel: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase',
  },
  explanationTitle: {
    fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-light)',
    background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(244,114,182,0.08))',
    padding: '2px 10px', borderRadius: 8,
  },
  explanationMeaning: {
    fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8,
  },
  explanationText: {
    fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, fontWeight: 500,
    marginBottom: 6,
  },
  correctExample: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--correct-text)', display: 'block', marginTop: 2,
  },
  exampleSection: {
    marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(192,132,252,0.15)',
  },
  exampleLabel: {
    fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 6,
  },
  exampleItem: {
    textAlign: 'left',
  },
  exampleJp: {
    fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2,
  },
  exampleRomaji: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 2,
  },
  exampleRu: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)',
  },
  resultsWrap: { display: 'flex', justifyContent: 'center', paddingTop: 20, paddingBottom: 90 },
  resultsCard: { textAlign: 'center', padding: '32px 24px', maxWidth: 440, width: '100%' },
  resultsCardTablet: { maxWidth: 560, padding: '42px 34px' },
  resultsEmoji: { fontSize: '2.5rem', marginBottom: 8 },
  resultsTitle: { fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 },
  resultsText: {
    fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 16, textTransform: 'lowercase',
  },
  encouragement: {
    fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500, fontStyle: 'italic',
    marginBottom: 20, lineHeight: 1.5,
  },
  scoreCircle: {
    width: 120, height: 120, borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(236, 72, 153, 0.25)',
  },
  scoreCircleInner: {
    width: 100, height: 100, borderRadius: '50%', background: 'var(--tint-solid)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  scoreBig: { fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 },
  scoreDetail: { fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 },
  mistakesSection: { marginBottom: 20, textAlign: 'left' },
  mistakesLabel: {
    fontSize: '0.82rem', fontWeight: 800, color: 'var(--incorrect-text)', textTransform: 'lowercase',
    marginBottom: 10, textAlign: 'center',
  },
  mistakesList: { display: 'flex', flexDirection: 'column', gap: 8 },
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.05)',
    border: '1px solid rgba(244, 63, 94, 0.12)',
    borderLeft: '3px solid var(--incorrect-text)',
    borderRadius: 10, padding: '10px 14px',
  },
  mistakePattern: {
    fontSize: '1rem', fontWeight: 900, color: 'var(--text-light)', marginBottom: 2,
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  mistakeMeaning: {
    fontSize: '0.85rem', fontWeight: 600, color: 'var(--correct-text)', marginBottom: 4,
  },
  mistakeExample: {
    fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
  },
  resultsActions: { display: 'flex', flexDirection: 'column', gap: 10 },
  xpBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '6px 18px', borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
    border: '1.5px solid rgba(251, 191, 36, 0.4)',
    margin: '-10px auto 20px', width: 'fit-content',
  },
  xpIcon: { fontSize: '1rem' },
  xpAmount: { fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold-text)' },
  streakBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 12px', borderRadius: 50,
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: 'white', fontSize: '0.75rem', fontWeight: 800,
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
    marginLeft: 8,
  },
  bestStreak: {
    fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-text)',
    margin: '-10px 0 16px', textAlign: 'center',
  },
}
