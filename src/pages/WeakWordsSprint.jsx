import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { lessons } from '../data/lessons'
import { useWordTracker } from '../hooks/useWordTracker'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import ShareResult from '../components/ShareResult'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import Confetti from '../components/Confetti'
import { getStoredNonNegativeInt, setStoredString } from '../utils/localSettings'
import { getTrackedLessons } from '../utils/lessonProgress'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const stripBr = s => (s || '').replace(/\[.*?\]/g, '').trim()

function isSameTrackedWord(a, b) {
  return stripBr(a?.japanese || a?.kanji) === stripBr(b?.japanese || b?.kanji)
    && stripBr(a?.romaji) === stripBr(b?.romaji)
    && (a?.lesson == null || b?.lesson == null || a.lesson === b.lesson)
}

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

// Generate 4 multiple choice options (1 correct + 3 wrong from same lesson data)
function getWordType(word) {
  if (word.type && word.type.includes('гл.')) return 'verb'
  if (word.japanese && word.japanese.includes('[な]')) return 'na-adj'
  const canonical = (word.kanji || word.japanese || '').replace(/\[.*?\]/g, '').trim()
  if (canonical.endsWith('い') && (!word.type || !word.type.includes('гл.'))) return 'i-adj'
  return 'noun'
}

function pickUniqueDistractors(pools, correctWord) {
  const seenJapanese = new Set([stripBr(correctWord.japanese || correctWord.kanji)])
  const seenRussian = new Set([correctWord.russian || ''])
  const options = []

  for (const pool of pools) {
    for (const word of shuffle(pool)) {
      const japaneseKey = stripBr(word.japanese || word.kanji)
      const russianKey = word.russian || ''
      if (!japaneseKey || !russianKey || seenJapanese.has(japaneseKey) || seenRussian.has(russianKey)) continue
      seenJapanese.add(japaneseKey)
      seenRussian.add(russianKey)
      options.push(word)
      if (options.length >= 3) return options
    }
  }

  return options
}

function generateOptions(correctWord, allWords) {
  const correctType = getWordType(correctWord)
  const wrongPool = allWords.filter(w => w.russian !== correctWord.russian)

  // Priority: same lesson + same type → same lesson → same type → any
  const sameLessonSameType = wrongPool.filter(w => w.lesson === correctWord.lesson && getWordType(w) === correctType)
  const sameLessonAny = wrongPool.filter(w => w.lesson === correctWord.lesson)
  const sameTypeAny = wrongPool.filter(w => getWordType(w) === correctType)

  const wrongOptions = pickUniqueDistractors(
    [sameLessonSameType, sameLessonAny, sameTypeAny, wrongPool],
    correctWord
  )

  return shuffle([correctWord, ...wrongOptions])
}

const confettiColors = ['#f472b6', '#c084fc', '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa']

// Mini confetti for single-word mastered celebration
function MiniCelebration() {
  const stars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    color: confettiColors[i % confettiColors.length],
    delay: `${i * 0.04}s`,
  }))
  return (
    <div style={styles.miniCelebWrap}>
      {stars.map(s => (
        <div key={s.id} style={{
          '--angle': `${s.angle}deg`,
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: s.color,
          left: '50%',
          top: '50%',
          animation: `miniCeleb 0.8s ${s.delay} ease-out forwards`,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  )
}

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

const scoreReactions = [
  { min: 100, emoji: '🎉✨🌟', text: 'perfect! все слабые слова побеждены!', textJp: 'かんぺき！' },
  { min: 80, emoji: '🎉✨', text: 'sugoi! почти всё правильно!', textJp: 'すごい！' },
  { min: 60, emoji: '🌸💪', text: 'yoku dekimashita! хороший прогресс!', textJp: 'よくできました！' },
  { min: 40, emoji: '🐱📚', text: 'mada mada~ давай ещё потренируемся!', textJp: 'まだまだ！' },
  { min: 0, emoji: '🌙💪', text: 'ganbatte! повторение — мать учения~', textJp: 'がんばって！' },
]

const SPRINT_BEST_KEY = 'nihongo-sprint-best'

export default function WeakWordsSprint() {
  const wordTracker = useWordTracker()
  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [sprintBest, setSprintBest] = useState(() => getStoredNonNegativeInt(SPRINT_BEST_KEY, 0))

  // quiz state
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const streakRef = useRef(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [mistakes, setMistakes] = useState([])
  const [correctWords, setCorrectWords] = useState([])
  const [masteredWords, setMasteredWords] = useState([])
  const [showMastered, setShowMastered] = useState(false)
  const [isNewBest, setIsNewBest] = useState(false)
  const timerRef = useRef(null)
  const masteredTimerRef = useRef(null)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)

  // timer state
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(10)
  const [customTimerVal, setCustomTimerVal] = useState('')
  const [timeLeft, setTimeLeft] = useState(10)
  const countdownRef = useRef(null)
  useEffect(() => { advanceLockedRef.current = false }, [currentIndex])

  // count weak words for setup screen
  const weakWords = wordTracker.getWeakWords(50)
  const weakCount = weakWords.length

  const startSprint = () => {
    const allPool = lessons.flatMap(l => l.vocabulary)
    if (allPool.length < 4) return

    const weak = wordTracker.getWeakWords(50)
    if (weak.length === 0) return

    const sprintWords = weak
      .map(dw => {
        // Prefer lesson-specific match to correctly handle homonyms
        // (e.g. かみ=paper/L6 vs かみ=hair/L16)
        const match = (dw.lesson != null && allPool.find(
          w => stripBr(w.japanese) === stripBr(dw.japanese) && stripBr(w.romaji) === stripBr(dw.romaji) && w.lesson === dw.lesson
        )) || allPool.find(
          w => stripBr(w.japanese) === stripBr(dw.japanese) && stripBr(w.romaji) === stripBr(dw.romaji)
        )
        if (match) {
          return { ...match, missCount: dw.missCount || 1, hitCount: dw.hitCount || 0 }
        }
        if (dw.russian) {
          return { ...dw, missCount: dw.missCount || 1, hitCount: dw.hitCount || 0 }
        }
        return null
      })
      .filter(Boolean)

    if (sprintWords.length === 0) return

    const qs = sprintWords.map(word => ({
      word,
      options: generateOptions(word, allPool.length >= 4 ? allPool : sprintWords),
      missCount: word.missCount,
      hitCount: word.hitCount,
    }))

    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    streakRef.current = 0
    setBestStreak(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setMistakes([])
    setCorrectWords([])
    setMasteredWords([])
    setShowMastered(false)
    xpAwardedRef.current = false
    answerLockedRef.current = false
    advanceLockedRef.current = false
    setIsNewBest(false)
    setPhase(PHASE_QUIZ)
  }

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
      setShowMastered(false)
      answerLockedRef.current = false
    }
  }, [currentIndex, questions.length])

  const handleSkip = useCallback(() => {
    if (selectedAnswer !== null || answerLockedRef.current || advanceLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = true
    clearTimeout(timerRef.current)
    streakRef.current = 0
    if (currentIndex + 1 >= questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setShowMastered(false)
      answerLockedRef.current = false
    }
  }, [selectedAnswer, currentIndex, questions.length])

  const handleAnswer = useCallback((option) => {
    if (selectedAnswer !== null || answerLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = false

    const currentQuestion = questions[currentIndex]
    const correct = isSameTrackedWord(option, currentQuestion.word)
    setSelectedAnswer(option)
    setIsCorrect(correct)

    if (correct) {
      setScore(prev => prev + 1)
      streakRef.current += 1
      setBestStreak(b => Math.max(b, streakRef.current))
      setCorrectWords(prev => [...prev, currentQuestion.word])
      wordTracker.recordHit(currentQuestion.word)

      const newHitCount = (currentQuestion.hitCount || 0) + 1
      if (newHitCount >= 3) {
        setMasteredWords(prev => [...prev, currentQuestion.word])
        setShowMastered(true)
        clearTimeout(masteredTimerRef.current)
        masteredTimerRef.current = setTimeout(() => setShowMastered(false), 1500)
      }
    } else {
      streakRef.current = 0
      setMistakes(prev => [...prev, {
        word: currentQuestion.word,
        yourAnswer: option.russian,
      }])
      wordTracker.recordMiss(currentQuestion.word, 'sprint')
    }

    const delay = correct ? 1200 : 3500

    timerRef.current = setTimeout(() => {
      if (advanceLockedRef.current) return
      advanceLockedRef.current = true

      if (currentIndex + 1 >= questions.length) {
        setPhase(PHASE_RESULTS)
      } else {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setIsCorrect(null)
        setShowMastered(false)
        answerLockedRef.current = false
      }
    }, delay)
  }, [selectedAnswer, questions, currentIndex, wordTracker])

  // keyboard support: 1-4 for answer selection
  useEffect(() => {
    if (phase !== PHASE_QUIZ) return
    const handler = (e) => {
      if (selectedAnswer !== null) return
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && questions[currentIndex]) {
        const option = questions[currentIndex].options[num - 1]
        if (option) handleAnswer(option)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, selectedAnswer, questions, currentIndex, handleAnswer])

  // cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (masteredTimerRef.current) clearTimeout(masteredTimerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [])

  // reset countdown on new question
  useEffect(() => {
    if (isTimed && phase === PHASE_QUIZ) setTimeLeft(timeLimit)
  }, [currentIndex, isTimed, timeLimit, phase])

  // run countdown
  useEffect(() => {
    if (!isTimed || phase !== PHASE_QUIZ || selectedAnswer !== null) {
      clearInterval(countdownRef.current)
      return
    }
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(countdownRef.current)
          handleAnswer({ russian: '__TIMEOUT__', japanese: '', romaji: '' })
          return 0
        }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(countdownRef.current)
  }, [isTimed, phase, selectedAnswer, currentIndex, handleAnswer])

  const retryMistakesOnly = () => {
    if (mistakes.length === 0) return
    const allPool = lessons.flatMap(l => l.vocabulary)
    const qs = mistakes.map(m => ({
      word: m.word,
      options: generateOptions(m.word, allPool.length >= 4 ? allPool : mistakes.map(x => x.word)),
      missCount: m.word.missCount,
      hitCount: m.word.hitCount,
    }))
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setMistakes([])
    setCorrectWords([])
    setMasteredWords([])
    setShowMastered(false)
    streakRef.current = 0
    setBestStreak(0)
    setIsNewBest(false)
    answerLockedRef.current = false
    setPhase(PHASE_QUIZ)
  }

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const reaction = scoreReactions.find(r => percentage >= r.min) || scoreReactions[scoreReactions.length - 1]

  // Save best sprint score + award XP
  useEffect(() => {
    if (phase === PHASE_RESULTS && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      const newBest = percentage > 0 && percentage > sprintBest
      setIsNewBest(newBest)
      if (newBest) {
        setSprintBest(percentage)
        setStoredString(SPRINT_BEST_KEY, percentage)
      }
      saveQuizResult('vocab', {
        lessons: getTrackedLessons(questions, q => q.word?.lesson),
        score,
        total: questions.length,
      })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'weak words sprint', score === questions.length && questions.length > 0)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps


  // scroll to top when results phase begins
  useEffect(() => {
    if (phase === PHASE_RESULTS) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  return (
    <div className="page">
      <style>{`
        @keyframes miniCeleb {
          0% { transform: rotate(var(--angle, 0deg)) translateY(0); opacity: 1; }
          100% { transform: rotate(var(--angle, 0deg)) translateY(-40px); opacity: 0; }
        }
        @keyframes masteredPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sprintGlowPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(244, 63, 94, 0.2); }
          50% { box-shadow: 0 4px 32px rgba(244, 63, 94, 0.5); }
        }
        @keyframes wordEntrance {
          0% { opacity: 0; transform: translateY(-8px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .miniCeleb { animation: none !important; }
          .sprintGlowPulse { animation: none !important; }
        }
      `}</style>

      {phase === PHASE_SETUP && (
        <SetupScreen
          weakCount={weakCount}
          weakWords={weakWords}
          onStart={startSprint}
          isTimed={isTimed} setIsTimed={setIsTimed}
          timeLimit={timeLimit} setTimeLimit={setTimeLimit}
          customTimerVal={customTimerVal} setCustomTimerVal={setCustomTimerVal}
        />
      )}

      {phase === PHASE_QUIZ && questions.length > 0 && (
        <QuizScreen
          question={questions[currentIndex]}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          selectedAnswer={selectedAnswer}
          isCorrect={isCorrect}
          score={score}
          onAnswer={handleAnswer}
          onSkip={handleSkip}
          onSkipDelay={skipDelay}
          showMastered={showMastered}
          isTimed={isTimed}
          timeLeft={timeLeft}
          timeLimit={timeLimit}
        />
      )}

      {phase === PHASE_RESULTS && (
        <ResultsScreen
          score={score}
          total={questions.length}
          percentage={percentage}
          reaction={reaction}
          mistakes={mistakes}
          correctWords={correctWords}
          masteredWords={masteredWords}
          sprintBest={sprintBest}
          isNewBest={isNewBest}
          bestStreak={bestStreak}
          onRetry={startSprint}
          onRetryMistakes={retryMistakesOnly}
          onSetup={() => setPhase(PHASE_SETUP)}
          calculateQuizXP={calculateQuizXP}
        />
      )}
    </div>
  )
}

function SetupScreen({ weakCount, weakWords, onStart, isTimed, setIsTimed, timeLimit, setTimeLimit, customTimerVal, setCustomTimerVal }) {
  const isMobile = useIsMobile()

  if (weakCount === 0) {
    return (
      <div className="animate-fadeInUp" style={{ paddingBottom: 100 }}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <span>🔥</span> weak words sprint <span style={styles.titleJp}>にがてスプリント</span>
          </h1>
        </div>

        <div className="glass" style={styles.emptyCard}>
          <div style={styles.emptyEmoji}>🌟</div>
          <h2 style={styles.emptyTitle}>no weak words!</h2>
          <p style={styles.emptyText}>
            sugoi! you don't have any difficult words yet.
            take some quizzes first and words you miss will appear here.
            then come back and drill them into memory!
          </p>
          <div style={styles.emptyActions}>
            <Link to="/quiz/vocab" className="btn btn-cute">
              vocab quiz 📝
            </Link>
            <Link to="/review" className="btn btn-secondary">
              flash cards 🃏
            </Link>
            <Link to="/" className="btn btn-secondary">
              home 🏠
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Group weak words by lesson for preview
  const byLesson = {}
  weakWords.forEach(w => {
    const key = w.lesson || '?'
    if (!byLesson[key]) byLesson[key] = []
    byLesson[key].push(w)
  })

  const avgMisses = weakWords.length > 0
    ? (weakWords.reduce((s, w) => s + (w.missCount || 1), 0) / weakWords.length).toFixed(1)
    : 0

  return (
    <div className="animate-fadeInUp" style={{ paddingBottom: 100 }}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span>🔥</span> weak words sprint <span style={styles.titleJp}>にがてスプリント</span>
        </h1>
        <p style={styles.subtitle}>drill your hardest words until they click</p>
      </div>

      {/* stats card */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}>
          <span>📊</span> sprint overview
        </div>
        <div style={{ ...styles.statsRow, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)' }}>
          <div style={styles.statBlock}>
            <span style={styles.statNumBig}>{weakCount}</span>
            <span style={styles.statLabelSm}>weak words</span>
          </div>
          <div style={styles.statBlock}>
            <span style={{ ...styles.statNumBig, color: 'var(--incorrect-text)' }}>
              {weakWords.length > 0 ? Math.max(...weakWords.map(w => w.missCount || 1)) : 0}
            </span>
            <span style={styles.statLabelSm}>max misses</span>
          </div>
          <div style={styles.statBlock}>
            <span style={{ ...styles.statNumBig, color: 'var(--text-light)' }}>
              {Object.keys(byLesson).length}
            </span>
            <span style={styles.statLabelSm}>lessons</span>
          </div>
        </div>
        <div style={styles.setupHint}>
          avg {avgMisses} misses per word — hardest words come first
        </div>
      </div>

      {/* word preview */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}>
          <span>💪</span> words to practice
        </div>
        <div style={styles.previewList}>
          {weakWords.slice(0, 10).map((w, i) => (
            <div key={(w.japanese || '') + i} style={styles.previewItem}>
              <span style={styles.previewJp}>{w.kanji || (w.japanese || '').replace(/\[.*?\]/g, '').trim()}</span>
              <span style={styles.previewRomaji}>{(w.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</span>
              {w.lesson && (
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '2px 7px', borderRadius: 50, flexShrink: 0 }}>
                  L{w.lesson}
                </span>
              )}
              <span style={{
                ...styles.previewMiss,
                color: (w.missCount || 1) >= 5 ? 'var(--incorrect-text)' : (w.missCount || 1) >= 3 ? 'var(--gold-text)' : '#f472b6',
                background: (w.missCount || 1) >= 5
                  ? 'rgba(244, 63, 94, 0.12)'
                  : (w.missCount || 1) >= 3
                    ? 'rgba(217,119,6,0.12)'
                    : 'rgba(244, 114, 182, 0.12)',
              }}>
                {w.missCount || 1}× missed
              </span>
            </div>
          ))}
          {weakCount > 10 && (
            <div style={styles.previewMore}>
              +{weakCount - 10} more words...
            </div>
          )}
        </div>
      </div>

      {/* keyboard hint */}
      <div className="glass-sm" style={styles.hintCard}>
        <div style={styles.hintIcon}>⌨️</div>
        <div style={styles.hintText}>
          press <strong>1-4</strong> to select answers quickly — get 3 correct in a row to master a word!
        </div>
      </div>

      {/* timer */}
      <div className="glass" style={{ ...styles.setupCard, marginBottom: 8 }}>
        <div style={styles.setupLabel}>⏱ timer per question</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[0, 10, 15, 20, 30].map(val => (
            <button key={val} onClick={() => {
              if (val === 0) { setIsTimed(false); setCustomTimerVal('') }
              else { setIsTimed(true); setTimeLimit(val); setCustomTimerVal('') }
            }} style={{
              padding: '8px 14px', borderRadius: 20, border: 'none', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', minHeight: 44, transition: 'all 0.15s',
              background: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
              color: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? '#fff' : 'var(--text-secondary)',
            }}>
              {val === 0 ? 'выкл' : `${val}с`}
            </button>
          ))}
          <input
            type="number" min="5" max="60" placeholder="сек"
            aria-label="custom time limit in seconds"
            value={customTimerVal}
            onChange={e => {
              const v = e.target.value
              setCustomTimerVal(v)
              const n = parseInt(v, 10)
              if (n >= 5 && n <= 60) { setIsTimed(true); setTimeLimit(n) }
            }}
            style={{ width: 64, padding: '8px 10px', borderRadius: 20, border: 'none', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.88rem', background: customTimerVal ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)', color: customTimerVal ? '#fff' : 'var(--text-secondary)', textAlign: 'center', outline: 'none', minHeight: 44 }}
          />
        </div>
      </div>

      {/* start button */}
      <div style={styles.startWrap}>
        <button className="btn btn-cute" onClick={onStart} style={{ maxWidth: 260, fontSize: '1rem', padding: '14px 28px' }}>
          start sprint 🔥
        </button>
        <p style={styles.startHint}>
          drill it until you nail it — you've got this!
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Link to="/quiz/vocab" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>vocab quiz ✨</Link>
          <Link to="/mistakes" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>mistakes 📒</Link>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
        </div>
      </div>
    </div>
  )
}

function QuizScreen({ question, currentIndex, totalQuestions, selectedAnswer, isCorrect, score, onAnswer, onSkip, onSkipDelay, showMastered, isTimed, timeLeft, timeLimit }) {
  const isMobile = useIsMobile()
  const progress = ((currentIndex + 1) / totalQuestions) * 100

  return (
    <div className="animate-fadeInUp">
      {/* mastered overlay */}
      {showMastered && (
        <div style={styles.masteredOverlay} className="animate-pop">
          <MiniCelebration />
          <div style={styles.masteredBadge}>
            <div style={styles.masteredStar}>🌟</div>
            <div style={styles.masteredText}>mastered!</div>
            <div style={styles.masteredSubtext}>3 correct in a row!</div>
          </div>
        </div>
      )}

      {/* progress */}
      <div style={styles.progressWrap}>
        <div style={styles.progressInfo}>
          <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
          <span style={styles.progressText}>
            {currentIndex + 1} <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>/ {totalQuestions}</span>
          </span>
          <span style={styles.scoreText} aria-live="polite" aria-atomic="true">🔥 {score} correct</span>
          {!selectedAnswer && (
            <button onClick={onSkip} style={styles.skipBtn}>skip →</button>
          )}
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        {isTimed && (
          <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
            <div style={{ height: '100%', width: `${(timeLeft / timeLimit) * 100}%`, background: timeLeft <= 3 ? '#ef4444' : '#c084fc', borderRadius: 2, transition: 'width 0.1s linear, background 0.3s ease' }} />
          </div>
        )}
        <div style={styles.progressPct}>{Math.round(progress)}% done</div>
      </div>

      {/* miss count badge */}
      {question.missCount > 1 && (
        <div style={{
          ...styles.missCountBadge,
          color: question.missCount >= 5 ? 'var(--incorrect-text)' : 'var(--gold-text)',
          background: question.missCount >= 5 ? 'rgba(244,63,94,0.1)' : 'rgba(217,119,6,0.1)',
        }}>
          missed {question.missCount}× before — you can do it this time!
        </div>
      )}

      {/* question card */}
      <div
        className="glass"
        style={{
          ...styles.questionCard,
          animation: isCorrect === null
            ? (prefersReducedMotion ? undefined : 'wordEntrance 0.35s ease forwards')
            : (!prefersReducedMotion && isCorrect === false ? 'shake 0.4s ease' : undefined),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={styles.questionLabel}>what does this mean? 🤔</div>
          {question.word.lesson && (
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50 }}>
              L{question.word.lesson}
            </span>
          )}
        </div>
        <div style={{
          ...styles.questionWord,
          fontSize: isMobile ? '2rem' : '2.6rem',
        }}>{((question.word.kanji || question.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
        {question.word.kanji && (
          <div style={styles.questionKanji}>{question.word.japanese}</div>
        )}
        <div style={styles.questionRomaji}>{(question.word.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
      </div>

      {/* options */}
      <div key={`options-${currentIndex}`} style={{ ...styles.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {question.options.map((opt, i) => {
          let optStyle = { ...styles.option }

          if (selectedAnswer) {
            if (isSameTrackedWord(opt, question.word)) {
              optStyle = { ...optStyle, ...styles.optionCorrect }
            } else if (isSameTrackedWord(selectedAnswer, opt) && !isCorrect) {
              optStyle = { ...optStyle, ...styles.optionIncorrect }
            } else {
              optStyle = { ...optStyle, opacity: 0.4 }
            }
          }

          return (
            <button
              key={`${currentIndex}-${i}`}
              onClick={() => onAnswer(opt)}
              className="glass-sm quiz-option"
              style={optStyle}
              disabled={selectedAnswer !== null}
            >
              <span style={styles.optionNum}>{i + 1}</span>
              {opt.russian}
            </button>
          )
        })}
      </div>

      {/* feedback */}
      {selectedAnswer && isCorrect && (
        <div
          style={{ ...styles.feedback, color: 'var(--correct-text)', background: 'rgba(16,185,129,0.08)', borderRadius: 12, padding: '12px 20px' }}
          className="animate-pop"
        >
          ✨ correct! sugoi~
        </div>
      )}
      {selectedAnswer && !isCorrect && (
        <div className="glass animate-pop" style={styles.wrongCard}>
          <div style={styles.wrongLabel}>✗ もう一度!</div>
          <div style={styles.wrongAnswer}>{question.word.russian}</div>
          <div style={styles.wrongJp}>{((question.word.kanji || question.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
          <div style={styles.wrongRomaji}>{(question.word.romaji || '').replace(/\s*\[[^\]]*\]/g, '').trim()}</div>
          <div style={styles.wrongYours}>your answer: {selectedAnswer.russian === '__TIMEOUT__' ? '⏱ время вышло' : selectedAnswer.russian}</div>
          {question.word.lesson && (
            <Link to={`/lessons/${question.word.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
              lesson {question.word.lesson} →
            </Link>
          )}
        </div>
      )}
      {selectedAnswer && (
        <div onClick={onSkipDelay} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSkipDelay() } }} aria-label="continue to next question" style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4, cursor: 'pointer' }}>
          нажми чтобы продолжить →
        </div>
      )}
    </div>
  )
}

function ResultsScreen({ score, total, percentage, reaction, mistakes, correctWords, masteredWords, sprintBest, isNewBest, bestStreak, onRetry, onRetryMistakes, onSetup, calculateQuizXP }) {
  const isTablet = useIsTablet()
  const nonMasteredCorrect = correctWords.filter(
    cw => !masteredWords.some(mw => isSameTrackedWord(mw, cw))
  )

  return (
    <div className="animate-fadeInUp" style={styles.resultsWrap}>
      <div className="glass" style={{ ...styles.resultsCard, ...(isTablet ? styles.resultsCardTablet : {}) }}>
        {percentage >= 90 && <Confetti trigger={true} />}
        <div style={styles.resultsEmoji}>{reaction.emoji}</div>
        <h2 style={styles.resultsTitle}>{reaction.textJp}</h2>
        <p style={styles.resultsText}>{reaction.text}</p>

        {isNewBest && (
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f472b6', background: 'rgba(244,114,182,0.1)', borderRadius: 10, padding: '4px 12px', marginBottom: 10, display: 'inline-block' }} className="animate-pop">
            🏆 новый рекорд!
          </div>
        )}
        {!isNewBest && sprintBest > 0 && (
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 10 }}>
            лучший: {sprintBest}%
          </div>
        )}
        <div
          style={styles.scoreCircle}
          className={percentage >= 90 ? 'score-perfect' : 'score-circle'}
        >
          <div style={styles.scoreCircleInner}>
            <span style={styles.scoreBig}>{percentage}%</span>
            <span style={styles.scoreDetail}>{score}/{total}</span>
          </div>
        </div>

        {/* mastered words */}
        {masteredWords.length > 0 && (
          <div style={styles.masteredSection}>
            <div style={styles.masteredLabel}>
              🌟 mastered! ({masteredWords.length}) — removed from weak list
            </div>
            <div style={styles.masteredList}>
              {masteredWords.map((w, i) => (
                <div key={(w.japanese || '') + i} style={styles.masteredItem}>
                  <span style={styles.mItemJp}>{w.kanji || (w.japanese || '').replace(/\[.*?\]/g, '').trim()}</span>
                  <span style={styles.mItemRomaji}>{(w.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</span>
                  <span style={styles.mItemRu}>{w.russian}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* correct words (non-mastered) */}
        {nonMasteredCorrect.length > 0 && (
          <div style={styles.correctSection}>
            <div style={styles.correctLabel}>
              correct ({nonMasteredCorrect.length}) ✨
            </div>
            <div style={styles.correctList}>
              {nonMasteredCorrect.map((w, i) => (
                <div key={(w.japanese || '') + i} style={styles.correctItem}>
                  <span style={styles.cItemJp}>{w.kanji || (w.japanese || '').replace(/\[.*?\]/g, '').trim()}</span>
                  <span style={styles.cItemRu}>{w.russian}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* mistakes */}
        {mistakes.length > 0 && (
          <div style={styles.mistakesSection}>
            <div style={styles.mistakesLabel}>
              still working on it ({mistakes.length}) — keep going!
            </div>
            <div style={styles.mistakesList}>
              {mistakes.map((m, i) => (
                <div key={(m.word.japanese || '') + i} style={styles.mistakeItem}>
                  <div style={styles.mistakeWord}>{((m.word.kanji || m.word.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
                  <div style={styles.mistakeCorrect}>{m.word.russian}</div>
                  <div style={styles.mistakeYours}>you said: {m.yourAnswer}</div>
                  {m.word.lesson && (
                    <Link to={`/lessons/${m.word.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                      lesson {m.word.lesson} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* actions — 2+1 layout */}
        <div style={styles.resultsActions}>
          {mistakes.length > 0 && (
            <button className="btn btn-cute" onClick={onRetryMistakes} style={{ width: '100%' }}>
              повторить ошибки ({mistakes.length}) 🔁
            </button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-cute" onClick={onRetry} style={{ flex: 1 }}>
              sprint again 🔥
            </button>
            <ShareResult
              quizName="weak words sprint"
              score={score}
              total={total}
              percentage={percentage}
              bestStreak={bestStreak || 0}
              xpEarned={calculateQuizXP ? calculateQuizXP(score, total) : 0}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/quiz/vocab" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              vocab quiz 📝
            </Link>
            <button className="btn btn-primary" onClick={onSetup} style={{ flex: 1, fontSize: '0.85rem' }}>
              back to setup 📊
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/mistakes" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>
              mistakes 📒
            </Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>
              home 🏠
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  // Header
  header: {
    textAlign: 'center',
    marginBottom: 20,
    padding: '8px 0',
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
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  titleJp: {
    fontSize: '0.9rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },

  // Empty state
  emptyCard: {
    textAlign: 'center',
    padding: '40px 24px',
  },
  emptyEmoji: {
    fontSize: '3rem',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: '1.4rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  emptyText: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    lineHeight: 1.6,
    marginBottom: 24,
    maxWidth: 320,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  emptyActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
  },

  // Setup
  setupCard: {
    padding: 18,
    marginBottom: 14,
  },
  setupLabel: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    textTransform: 'lowercase',
  },
  setupHint: {
    marginTop: 10,
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  statBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  statNumBig: {
    fontSize: '1.8rem',
    fontWeight: 900,
    color: '#f472b6',
    lineHeight: 1,
  },
  statLabelSm: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
  },
  previewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  previewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: 'rgba(244, 63, 94, 0.04)',
    border: '1px solid rgba(244, 63, 94, 0.1)',
    borderLeft: '3px solid #f472b6',
    borderRadius: 10,
  },
  previewJp: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    minWidth: 80,
  },
  previewRomaji: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    flex: 1,
  },
  previewMiss: {
    fontSize: '0.78rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 50,
    whiteSpace: 'nowrap',
  },
  previewMore: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    textAlign: 'center',
    padding: '6px 0',
    fontStyle: 'italic',
  },
  hintCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    marginBottom: 14,
  },
  hintIcon: {
    fontSize: '1.2rem',
    flexShrink: 0,
  },
  hintText: {
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  startWrap: {
    textAlign: 'center',
    marginTop: 20,
  },
  startHint: {
    marginTop: 10,
    fontSize: '0.82rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    fontStyle: 'italic',
  },

  // Quiz
  progressWrap: {
    marginTop: 28,
    marginBottom: 16,
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  progressText: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  scoreText: {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#f472b6',
  },
  progressBar: {
    height: 8,
    borderRadius: 50,
    background: 'var(--tint-strong)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 50,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    transition: 'width 0.4s ease',
  },
  progressPct: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    textAlign: 'right',
  },
  skipBtn: {
    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)',
    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    padding: '2px 8px', borderRadius: 50, transition: 'color 0.15s',
    textDecoration: 'underline dotted', minHeight: 44,
  },
  missCountBadge: {
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '5px 16px',
    borderRadius: 50,
    marginBottom: 12,
    display: 'block',
    width: 'fit-content',
    marginLeft: 'auto',
    marginRight: 'auto',
    textTransform: 'lowercase',
  },
  questionCard: {
    textAlign: 'center',
    padding: '32px 20px',
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginBottom: 14,
    textTransform: 'lowercase',
  },
  questionWord: {
    fontSize: '2.6rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 6,
    lineHeight: 1.2,
  },
  questionKanji: {
    fontSize: '0.88rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    marginBottom: 4,
  },
  questionRomaji: {
    fontSize: '1.05rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    fontStyle: 'italic',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 16,
  },
  option: {
    padding: '18px 14px',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    background: 'var(--tint)',
    position: 'relative',
    minHeight: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNum: {
    position: 'absolute',
    top: 4,
    left: 8,
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    opacity: 0.6,
  },
  optionCorrect: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '2px solid var(--correct-text)',
    color: 'var(--correct-text)',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)',
  },
  optionIncorrect: {
    background: 'rgba(244, 63, 94, 0.12)',
    border: '2px solid var(--incorrect-text)',
    color: 'var(--incorrect-text)',
    ...(prefersReducedMotion ? {} : { animation: 'shake 0.4s ease' }),
  },
  feedback: {
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 800,
  },
  wrongCard: {
    padding: '14px 18px', textAlign: 'center', marginBottom: 8,
    background: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(251,113,133,0.03))',
    border: '1.5px solid rgba(244,63,94,0.2)',
  },
  wrongLabel: {
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--incorrect-text)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
  },
  wrongAnswer: {
    fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: 2,
  },
  wrongJp: {
    fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 2,
  },
  wrongRomaji: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 6,
  },
  wrongYours: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--incorrect-text)', fontStyle: 'italic', opacity: 0.8,
  },

  // Mastered overlay
  masteredOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.15)',
    zIndex: 100,
    pointerEvents: 'none',
  },
  masteredBadge: {
    textAlign: 'center',
    background: 'var(--tint-solid)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 24,
    padding: '28px 44px',
    boxShadow: '0 12px 40px rgba(168, 85, 247, 0.3)',
    border: '2px solid #c084fc',
    ...(prefersReducedMotion ? {} : { animation: 'masteredPulse 0.5s ease forwards' }),
  },
  masteredStar: { fontSize: '2.5rem', marginBottom: 6 },
  masteredText: {
    fontSize: '1.4rem',
    fontWeight: 900,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
  },
  masteredSubtext: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    marginTop: 4,
  },
  miniCelebWrap: {
    position: 'absolute',
    width: 0,
    height: 0,
  },

  // Results
  resultsWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 'calc(100vh - 120px)',
    paddingBottom: 100,
  },
  resultsCard: {
    textAlign: 'center',
    padding: '32px 24px',
    maxWidth: 460,
    width: '100%',
  },
  resultsCardTablet: {
    maxWidth: 560,
    padding: '42px 34px',
  },
  resultsEmoji: { fontSize: '2.5rem', marginBottom: 8 },
  resultsTitle: {
    fontSize: '1.5rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 4,
  },
  resultsText: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginBottom: 20,
    textTransform: 'lowercase',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 24px rgba(236, 72, 153, 0.25)',
  },
  scoreCircleInner: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'var(--tint-solid)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBig: {
    fontSize: '1.8rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
  },
  scoreDetail: {
    fontSize: '0.82rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },

  // Mastered section in results
  masteredSection: { marginBottom: 16, textAlign: 'left' },
  masteredLabel: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  masteredList: { display: 'flex', flexDirection: 'column', gap: 6 },
  masteredItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(168, 85, 247, 0.08)',
    border: '1px solid rgba(168, 85, 247, 0.2)',
    borderLeft: '3px solid #a855f7',
    borderRadius: 10,
    padding: '8px 12px',
  },
  mItemJp: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', minWidth: 70 },
  mItemRomaji: { fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', flex: 1 },
  mItemRu: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' },
  masteredNote: {
    marginTop: 6, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)',
    textAlign: 'center', fontStyle: 'italic',
  },

  // Correct section in results
  correctSection: { marginBottom: 16, textAlign: 'left' },
  correctLabel: {
    fontSize: '0.82rem', fontWeight: 800, color: 'var(--correct-text)',
    textTransform: 'lowercase', marginBottom: 8, textAlign: 'center',
  },
  correctList: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  correctItem: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: 50, padding: '4px 12px',
  },
  cItemJp: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' },
  cItemRu: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' },

  // Mistakes section in results
  mistakesSection: { marginBottom: 20, textAlign: 'left' },
  mistakesLabel: {
    fontSize: '0.82rem', fontWeight: 800, color: 'var(--incorrect-text)',
    textTransform: 'lowercase', marginBottom: 8, textAlign: 'center',
  },
  mistakesList: { display: 'flex', flexDirection: 'column', gap: 6 },
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.06)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderLeft: '3px solid var(--incorrect-text)',
    borderRadius: 10, padding: '8px 12px',
  },
  mistakeWord: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' },
  mistakeCorrect: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--correct-text)' },
  mistakeYours: { fontSize: '0.75rem', fontWeight: 500, color: 'var(--incorrect-text)', fontStyle: 'italic' },

  // Result actions
  resultsActions: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 },
}
