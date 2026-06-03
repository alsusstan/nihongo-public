import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { kanji, kanjiLessonInfo } from '../data/kanji'
import { strokeData } from '../data/strokeOrder'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import StrokeOrder from '../components/StrokeOrder'
import { getStoredBkbUnlocked, getStoredQuizSize } from '../utils/localSettings'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// Kana → Romaji converter
function kanaToRomaji(str) {
  if (!str || str === '—') return null
  const map = {
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho',
    'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
    'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
    'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
    'じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo',
    'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
    'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','を':'wo','ん':'n',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
  }
  return str.split(/\s*\/\s*/).map(part => {
    // katakana → hiragana
    part = [...part].map(c => {
      const code = c.charCodeAt(0)
      return (code >= 0x30A1 && code <= 0x30F6) ? String.fromCharCode(code - 0x60) : c
    }).join('')
    let result = '', i = 0
    while (i < part.length) {
      if (part[i] === 'っ') {
        const next = map[part.slice(i+1, i+3)] || map[part[i+1]] || ''
        result += next ? next[0] : ''; i++; continue
      }
      if (part[i] === 'ー') { result += '-'; i++; continue }
      const two = part.slice(i, i+2)
      if (map[two]) { result += map[two]; i += 2; continue }
      result += map[part[i]] || part[i]; i++
    }
    return result
  }).filter(Boolean).join(' / ')
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getAnswerText(k, mode) {
  if (mode === 'reverse') return k.kanji
  if (mode === 'meaning') return k.meaning
  return `${k.kun} / ${k.on}`
}

function generateOptions(correct, pool, mode) {
  const seen = new Set([getAnswerText(correct, mode)])
  const wrong = []

  shuffle(pool).forEach(kanji => {
    const answerText = getAnswerText(kanji, mode)
    if (wrong.length >= 3 || kanji.kanji === correct.kanji || seen.has(answerText)) return
    seen.add(answerText)
    wrong.push(kanji)
  })

  return shuffle([correct, ...wrong])
}

const quizModes = [
  { key: 'meaning', label: 'значение', labelJp: '意味', emoji: '📖', question: 'что означает этот кандзи?' },
  { key: 'reading', label: 'чтение', labelJp: '読み方', emoji: '🗣️', question: 'как читается этот кандзи?' },
  { key: 'reverse', label: 'кандзи', labelJp: '書き方', emoji: '✍️', question: 'какой кандзи читается так?' },
  { key: 'both', label: 'оба', labelJp: '両方', emoji: '🎲', question: 'смешанный режим' },
]

const scoreReactions = [
  { min: 90, emoji: '🎉✨🌸', text: 'sugoi!! ты знаешь кандзи отлично!', textJp: 'すごい！' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita! хорошая работа!', textJp: 'よくできました！' },
  { min: 50, emoji: '🐱💪', text: 'mada mada~ продолжай учить!', textJp: 'まだまだ！' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! повтори ещё разок~', textJp: 'がんばって！' },
]

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

export default function KanjiQuiz() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { progress: quizProgress, saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [showCountdown, setShowCountdown] = useState(false)
  const [bkbUnlocked] = useState(getStoredBkbUnlocked)

  // setup — pre-select lesson from URL param if present
  const [selectedLessons, setSelectedLessons] = useState(() => {
    const lessonParam = searchParams.get('lesson')
    if (lessonParam) {
      const id = parseInt(lessonParam, 10)
      if (kanjiLessonInfo.some(l => l.id === id)) return [id]
    }
    // default: only unlocked lessons (mirrors KanjiStudy unlock system)
    const unlocked = getStoredBkbUnlocked()
    return kanjiLessonInfo.filter(l => l.id <= unlocked).map(l => l.id)
  })
  const [quizMode, setQuizMode] = useState('meaning')
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(15)
  const [customTimerVal, setCustomTimerVal] = useState('')
  const sharedLessonId = parseInt(searchParams.get('lesson') || '', 10)
  const sharedKanjiLesson = kanjiLessonInfo.find(l => l.id === sharedLessonId)
  const availableKanjiLessons = useMemo(() => {
    const unlocked = kanjiLessonInfo.filter(l => l.id <= bkbUnlocked)
    return sharedKanjiLesson && !unlocked.some(l => l.id === sharedKanjiLesson.id)
      ? [...unlocked, sharedKanjiLesson]
      : unlocked
  }, [bkbUnlocked, sharedKanjiLesson])

  // quiz
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [mistakes, setMistakes] = useState([])
  const [timeLeft, setTimeLeft] = useState(15)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const quickStarted = useRef(false)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)

  const toggleLesson = (id) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedLessons.length === availableKanjiLessons.length) {
      setSelectedLessons([])
    } else {
      setSelectedLessons(availableKanjiLessons.map(l => l.id))
    }
  }

  const getPool = () => kanji.filter(k => selectedLessons.includes(k.lesson))

  // Best quiz score per lesson (from kanjiQuizzes history)
  const lessonBestScores = useMemo(() => {
    const scores = {}
    ;(quizProgress?.kanjiQuizzes || []).forEach(q => {
      const pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0
      ;(q.lessons || []).forEach(id => {
        if (scores[id] === undefined || pct > scores[id]) scores[id] = pct
      })
    })
    return scores
  }, [quizProgress?.kanjiQuizzes])

  // Quick start from URL params
  useEffect(() => {
    if (quickStarted.current) return
    const quick = searchParams.get('quick')
    if (quick && phase === PHASE_SETUP) {
      quickStarted.current = true
      const count = parseInt(quick, 10) || 5
      const t = setTimeout(() => {
        const lessonParam = parseInt(searchParams.get('lesson') || '', 10)
        const quickLessons = Number.isFinite(lessonParam) && kanjiLessonInfo.some(l => l.id === lessonParam)
          ? [lessonParam]
          : kanjiLessonInfo.map(l => l.id)
        const pool = kanji.filter(k => quickLessons.includes(k.lesson))
        if (pool.length < 4) return
        setSelectedLessons(quickLessons)
        const selected = shuffle(pool).slice(0, Math.min(count, pool.length))
        const qs = selected.map(k => ({ kanji: k, options: generateOptions(k, pool, quizMode) }))
        setQuestions(qs)
        setCurrentIndex(0)
        setScore(0)
        setSelectedAnswer(null)
        setIsCorrect(null)
        setStreak(0)
        setBestStreak(0)
        setMistakes([])
        answerLockedRef.current = false
        setPhase(PHASE_QUIZ)
      }, 0)
      return () => clearTimeout(t)
    }
  }, [searchParams, phase, quizMode])

  const startMistakesQuiz = () => {
    if (mistakes.length === 0) return
    const pool = kanji
    const qs = mistakes.map(k => {
      const qmode = quizMode === 'both'
        ? (['meaning', 'reading', 'reverse'][Math.floor(Math.random() * 3)])
        : quizMode
      return { kanji: k, options: generateOptions(k, pool, qmode), qmode }
    })
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    setMistakes([])
    answerLockedRef.current = false
    setPhase(PHASE_QUIZ)
  }

  const startQuiz = () => {
    const pool = getPool()
    if (pool.length < 4) return
    xpAwardedRef.current = false

    const count = questionCount === 'all' ? pool.length : Math.min(questionCount, pool.length)
    const selected = shuffle(pool).slice(0, count)

    const qs = selected.map(k => {
      const qmode = quizMode === 'both'
        ? (['meaning', 'reading', 'reverse'][Math.floor(Math.random() * 3)])
        : quizMode
      return { kanji: k, options: generateOptions(k, pool, qmode), qmode }
    })

    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setStreak(0)
    setBestStreak(0)
    setMistakes([])
    answerLockedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  const handleAnswer = useCallback((option) => {
    if (selectedAnswer !== null || answerLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = false

    const correct = option.kanji === questions[currentIndex].kanji.kanji
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
      setStreak(0)
      setMistakes(prev => {
        const k = questions[currentIndex].kanji
        if (prev.find(m => m.kanji === k.kanji)) return prev
        return [...prev, k]
      })
    }

    const delay = correct ? 1000 : 1800

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
  }, [selectedAnswer, questions, currentIndex])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [])

  // Timer countdown
  useEffect(() => { if (isTimed && phase === PHASE_QUIZ && !showCountdown) setTimeLeft(timeLimit) }, [currentIndex, isTimed, timeLimit, phase, showCountdown])
  useEffect(() => {
    if (!isTimed || phase !== PHASE_QUIZ || showCountdown || selectedAnswer !== null) { clearInterval(countdownRef.current); return }
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(countdownRef.current)
          handleAnswer({ kanji: '__TIMEOUT__', meaning: '', kun: '', on: '' })
          return 0
        }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(countdownRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimed, phase, showCountdown, selectedAnswer, currentIndex])

  // Keyboard shortcuts: press 1-4 to select answer
  useEffect(() => {
    if (phase !== PHASE_QUIZ || showCountdown || questions.length === 0) return
    const handler = (e) => {
      if (selectedAnswer !== null) return
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
      saveQuizResult('kanji', { lessons: selectedLessons, mode: quizMode, score, total: questions.length })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'kanji quiz', score === questions.length && questions.length > 0)
    }
  }, [phase, score, questions.length, selectedLessons, quizMode, saveQuizResult, awardXP, calculateQuizXP])

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
            <div style={styles.heroKanjiRow}>
              <span style={styles.heroKanjiChar} className="kanji-hero">漢</span>
            </div>
            <h1 style={styles.title}>
              kanji quiz <span style={styles.titleJp}>漢字テスト</span>
            </h1>
            <p style={styles.subtitle}>discover the art of kanji writing 🌸</p>
          </div>

          {/* quiz mode */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabel}>
              <span>🎯</span> quiz mode
            </div>
            <div style={{ ...styles.modeRow, ...(isMobile ? styles.modeRowMobile : {}) }}>
              {quizModes.map(m => (
                <button
                  key={m.key}
                  onClick={() => setQuizMode(m.key)}
                  className="btn-hover"
                  style={{
                    ...styles.modeBtn,
                    ...(isMobile ? styles.modeBtnMobile : {}),
                    ...(quizMode === m.key ? styles.modeBtnActive : {}),
                  }}
                >
                  <span style={styles.modeBtnEmoji}>{m.emoji}</span>
                  <span style={{ color: quizMode === m.key ? '#f472b6' : 'var(--text-secondary)' }}>{m.label}</span>
                  <span style={{ ...styles.modeBtnJp, color: 'var(--text-light)' }}>{m.labelJp}</span>
                </button>
              ))}
            </div>
          </div>

          {/* lesson selection */}
          <div className="glass" style={styles.setupCard}>
            <div style={styles.setupLabelRow}>
              <div style={styles.setupLabel}>
                <span>📚</span> уроки кандзи
              </div>
              <button onClick={selectAll} className="btn-hover" style={styles.selectAllBtn}>
                {selectedLessons.length === availableKanjiLessons.length ? 'снять всё' : 'все'}
              </button>
            </div>
            <div style={styles.lessonCheckGrid}>
              {availableKanjiLessons.map(l => {
                const isSelected = selectedLessons.includes(l.id)
                const bestScore = lessonBestScores[l.id]
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLesson(l.id)}
                    className="btn-hover"
                    style={{
                      ...styles.lessonCheck,
                      ...(isSelected ? styles.lessonCheckActive : {}),
                      position: 'relative',
                    }}
                  >
                    <span style={{
                      ...styles.checkNum,
                      color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)',
                    }}>Ур. {l.id}</span>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.25,
                      color: 'var(--text-light)',
                    }}>{l.topic}</span>
                    <span style={{
                      ...styles.checkCount,
                      color: 'var(--text-light)',
                    }}>{l.count} канд.{bestScore !== undefined ? ` · ${bestScore}%` : ''}</span>
                    {isSelected && <span style={styles.checkMark}>✓</span>}
                  </button>
                )
              })}
            </div>
            {selectedLessons.length > 0 && (
              <div style={styles.poolInfo}>
                <span style={styles.poolInfoNum}>{pool.length}</span> kanji in pool 🌸
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
                <button key={n} onClick={() => setQuestionCount(Math.min(n, pool.length))} style={{
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
            <div style={styles.setupLabel}>⏱ timer per question</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[{ label: 'выкл', val: 0 }, { label: '10с', val: 10 }, { label: '15с', val: 15 }, { label: '20с', val: 20 }, { label: '30с', val: 30 }].map(({ label, val }) => (
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
            {pool.length > 0 && pool.length < 4 && (
              <p style={styles.warnText}>need at least 4 kanji in pool</p>
            )}
            <button
              className="btn btn-cute"
              onClick={startQuiz}
              disabled={pool.length < 4}
              style={{
                opacity: pool.length >= 4 ? 1 : 0.5,
                pointerEvents: pool.length >= 4 ? 'auto' : 'none',
                fontSize: '1.05rem',
                padding: '16px 40px',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              始めましょう — start quiz ✨
            </button>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <Link to="/kanji" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>study 📖</Link>
              <Link to="/kanji/practice" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>practice ✍️</Link>
              <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
            </div>
          </div>
        </div>
      )}

      {showCountdown && <QuizCountdown onComplete={() => setShowCountdown(false)} />}

      {phase === PHASE_QUIZ && questions.length > 0 && (
        <div className="animate-fadeInUp">
          {/* progress */}
          <div style={{ ...styles.progressWrap, marginTop: 28 }}>
            <div style={styles.progressInfo}>
              <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
              <span style={styles.progressText}>{currentIndex + 1} / {questions.length}</span>
              <span style={styles.scoreText} aria-live="polite" aria-atomic="true">
                score: {score} 🌸
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

          {/* question card — key forces re-mount + animate-pop on each new question */}
          {(() => {
            const q = questions[currentIndex]
            const qmode = q.qmode || quizMode
            return (
              <div
                key={`question-card-${currentIndex}`}
                className="glass animate-pop"
                style={{
                  ...styles.questionCard,
                  ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}),
                }}
              >
                <div style={styles.questionLabel}>
                  {qmode === 'meaning' ? 'что означает этот кандзи?' : qmode === 'reverse' ? 'какой кандзи читается так?' : 'как читается этот кандзи?'}
                </div>
                {qmode === 'reverse' ? (
                  <>
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      {q.kanji.on && (
                        <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f472b6', fontFamily: 'inherit' }}>
                          {q.kanji.on}
                        </span>
                      )}
                      {q.kanji.kun && (
                        <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'inherit' }}>
                          {q.kanji.kun}
                        </span>
                      )}
                    </div>
                    {(q.kanji.on || q.kanji.kun) && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 700, marginBottom: 2 }}>
                        {[kanaToRomaji(q.kanji.on), kanaToRomaji(q.kanji.kun)].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div style={styles.questionHint}>{q.kanji.meaning}</div>
                  </>
                ) : (
                  <>
                    <div
                      className="kanji-hero"
                      style={styles.questionKanji}
                    >
                      {q.kanji.kanji}
                    </div>
                    {strokeData[q.kanji.kanji]?.strokes && (
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(192,132,252,0.12)', padding: '2px 8px', borderRadius: 50 }}>
                          {strokeData[q.kanji.kanji].strokes}画
                        </span>
                      </div>
                    )}
                    {qmode === 'reading' && (
                      <div style={styles.questionHint}>{q.kanji.meaning}</div>
                    )}
                    {qmode === 'meaning' && (q.kanji.on || q.kanji.kun) && (
                      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                        {q.kanji.on && kanaToRomaji(q.kanji.on) && (
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f472b6' }}>
                            on: {kanaToRomaji(q.kanji.on)}
                          </span>
                        )}
                        {q.kanji.kun && kanaToRomaji(q.kanji.kun) && (
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-light)' }}>
                            kun: {kanaToRomaji(q.kanji.kun)}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })()}

          {/* options */}
          <div key={`question-options-${currentIndex}`} style={{ ...styles.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            {questions[currentIndex].options.map((opt, i) => {
              const qmode = questions[currentIndex].qmode || quizMode
              let optStyle = { ...styles.option }

              if (selectedAnswer) {
                if (opt.kanji === questions[currentIndex].kanji.kanji) {
                  optStyle = { ...optStyle, ...styles.optionCorrect }
                } else if (selectedAnswer.kanji === opt.kanji && !isCorrect) {
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
                  style={qmode === 'reverse' ? { ...optStyle, fontSize: '2.2rem', fontWeight: 900, minHeight: 72, lineHeight: 1 } : optStyle}
                  disabled={selectedAnswer !== null}
                >
                  <span style={styles.optionNumber}>{i + 1}</span>
                  {getAnswerText(opt, qmode)}
                </button>
              )
            })}
          </div>

          {/* keyboard hint */}
          {!selectedAnswer && (
            <div style={{ textAlign: 'center', marginTop: -8, marginBottom: 8 }}>
              <span style={styles.keyboardHint}>
                ⌨ 1–4
              </span>
            </div>
          )}

          {/* feedback */}
          {selectedAnswer && (
            <div className="animate-pop" style={styles.feedbackWrap}>
              {isCorrect ? (() => {
                const k = questions[currentIndex].kanji
                const kunRm = kanaToRomaji(k.kun)
                const onRm = kanaToRomaji(k.on)
                const reading = [kunRm, onRm].filter(Boolean).join(' · ')
                const praise = ['✨ correct! sugoi~', '🌸 yatta!', '⭐ えらい!', '💮 正解!'][Math.floor(Math.random() * 4)]
                return (
                  <div style={{ ...styles.feedback, color: 'var(--correct-text)' }}>
                    <div style={styles.feedbackPraise}>{praise}</div>
                    {reading && (
                      <div style={styles.feedbackRomaji}>
                        <span style={styles.feedbackKana}>{k.kun}</span>
                        <span style={styles.feedbackDot}>·</span>
                        <span style={styles.feedbackRomajiText}>{reading}</span>
                      </div>
                    )}
                    {k.keywords?.length > 0 && (() => {
                      const m = k.keywords[0].match(/^(.+?)\s*\(([^)]+)\)\s*(.*)$/)
                      if (!m) return null
                      return (
                        <div style={{ marginTop: 5, fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600 }}>
                          e.g. <span style={{ fontWeight: 900, color: 'var(--correct-text)' }}>{m[1].trim()}</span>
                          <span style={{ fontStyle: 'italic' }}> ({m[2].trim()})</span>
                          {m[3].trim() && <span style={{ color: 'var(--text-light)' }}> — {m[3].trim()}</span>}
                        </div>
                      )
                    })()}
                  </div>
                )
              })()
                : (
                  <div style={{ ...styles.feedback, color: 'var(--text-secondary)' }}>
                    <div style={styles.feedbackWrong}>
                      <span style={styles.feedbackWrongKanji}>{questions[currentIndex].kanji.kanji}</span>
                      <span style={styles.feedbackWrongEq}>=</span>
                      <span style={styles.feedbackWrongMeaning}>{questions[currentIndex].kanji.meaning}</span>
                    </div>
                    <div style={styles.feedbackWrongReading}>
                      {questions[currentIndex].kanji.kun} / {questions[currentIndex].kanji.on}
                      {(() => {
                        const k = questions[currentIndex].kanji
                        const kunRm = kanaToRomaji(k.kun)
                        const onRm = kanaToRomaji(k.on)
                        const rm = [kunRm, onRm].filter(Boolean).join(' · ')
                        return rm ? <span style={{ marginLeft: 8, color: 'var(--text-light)', fontWeight: 700 }}>({rm})</span> : null
                      })()}
                    </div>
                    {questions[currentIndex].kanji.keywords?.length > 0 && (() => {
                      const m = questions[currentIndex].kanji.keywords[0].match(/^(.+?)\s*\(([^)]+)\)\s*(.*)$/)
                      if (!m) return null
                      return (
                        <div style={{ marginTop: 5, fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600 }}>
                          e.g. <span style={{ fontWeight: 900, color: 'var(--text-secondary)' }}>{m[1].trim()}</span>
                          <span style={{ fontStyle: 'italic' }}> ({m[2].trim()})</span>
                          {m[3].trim() && <span> — {m[3].trim()}</span>}
                        </div>
                      )
                    })()}
                    {questions[currentIndex].kanji.lesson && (
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '2px 7px', borderRadius: 50 }}>
                          BKB L{questions[currentIndex].kanji.lesson}
                        </span>
                        <Link to={`/kanji?kanji=${encodeURIComponent(questions[currentIndex].kanji.kanji)}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                          study →
                        </Link>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          )}
          {selectedAnswer && (
            <div onClick={skipDelay} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipDelay() } }} aria-label="continue to next question" style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4, cursor: 'pointer' }}>
              нажми чтобы продолжить →
            </div>
          )}
        </div>
      )}

      {phase === PHASE_RESULTS && (
        <div className="animate-fadeInUp" style={styles.resultsWrap}>
          <div className="glass" style={{ ...styles.resultsCard, ...(isTablet ? styles.resultsCardTablet : {}) }}>
            <Confetti trigger={score === questions.length} />
            <div style={styles.resultsEmoji}>{reaction.emoji}</div>
            <h2 style={styles.resultsTitle}>{reaction.textJp}</h2>
            <p style={styles.resultsText}>{reaction.text}</p>

            <div style={styles.scoreCircle} className={score === questions.length ? 'score-perfect' : 'score-circle'}>
              <div style={styles.scoreCircleInner}>
                <span style={styles.scoreBig}>{percentage}%</span>
                <span style={styles.scoreDetail}>{score === questions.length ? 'perfect!' : `${score}/${questions.length}`}</span>
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

            {/* mistakes list */}
            {mistakes.length > 0 && (
              <div style={styles.mistakesSection}>
                <div style={styles.mistakesTitle}>review these kanji 📖</div>
                <div style={styles.mistakesList}>
                  {mistakes.map((k) => {
                    const kunRm = kanaToRomaji(k.kun)
                    const onRm = kanaToRomaji(k.on)
                    return (
                      <div key={k.kanji} style={styles.mistakeItem}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <span style={styles.mistakeKanji}>{k.kanji}</span>
                          <StrokeOrder kanji={k.kanji} size={64} autoPlay={false} />
                        </div>
                        <div style={styles.mistakeInfo}>
                          <span style={styles.mistakeMeaning}>{k.meaning}</span>
                          <span style={styles.mistakeReading}>
                            {k.kun} · {k.on}
                            {(kunRm || onRm) && (
                              <span style={styles.mistakeRomaji}>
                                {' '}({[kunRm, onRm].filter(Boolean).join(' · ')})
                              </span>
                            )}
                          </span>
                          {k.lesson && (
                            <Link to={`/kanji?lesson=${k.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                              BKB L{k.lesson} →
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={styles.resultsActions}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
                <button className="btn btn-cute" onClick={() => { setMistakes([]); setPhase(PHASE_SETUP) }} style={{ flex: 1 }}>
                  try again 🌸
                </button>
                <ShareResult quizName="kanji quiz" score={score} total={questions.length} percentage={percentage} bestStreak={bestStreak} xpEarned={calculateQuizXP(score, questions.length)} />
              </div>
              {mistakes.length > 0 && (
                <button className="btn btn-primary" onClick={startMistakesQuiz} style={{ width: '100%' }}>
                  drill mistakes ({mistakes.length}) 🔥
                </button>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/kanji" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>study 📖</Link>
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
  header: { textAlign: 'center', marginBottom: 24, padding: '8px 0' },
  heroKanjiRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  heroKanjiChar: {
    fontSize: '4rem', fontWeight: 900, lineHeight: 1,
    background: 'linear-gradient(135deg, #ec4899, #a855f7)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 2px 8px rgba(236,72,153,0.35))',
    display: 'inline-block',
  },
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
  setupLabelRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  modeRow: { display: 'flex', gap: 10 },
  modeRowMobile: { flexWrap: 'wrap' },
  modeBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '18px 14px', borderRadius: 16, background: 'var(--tint-medium)',
    border: 'none',
    boxShadow: '0 0 0 1.5px rgba(192,132,252,0.2)',
    cursor: 'pointer', transition: 'all 0.2s ease',
    fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'lowercase',
  },
  modeBtnMobile: { flex: '1 1 calc(50% - 5px)', minWidth: 0, padding: '14px 10px' },
  modeBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.18), rgba(192,132,252,0.18))',
    boxShadow: '0 0 0 2px rgba(244,114,182,0.55), 0 4px 12px rgba(244, 114, 182, 0.15)',
  },
  modeBtnEmoji: { fontSize: '1.8rem' },
  modeBtnJp: { fontSize: '0.82rem', fontWeight: 500 },
  selectAllBtn: {
    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(168, 85, 247, 0.08)',
    padding: '6px 10px', borderRadius: 12, textTransform: 'lowercase',
    cursor: 'pointer', border: 'none', flexShrink: 0,
    marginBottom: 0, minHeight: 38, minWidth: 44,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  lessonCheckGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8,
  },
  lessonCheck: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '12px 10px', borderRadius: 14, background: 'var(--tint)',
    border: 'none',
    boxShadow: '0 0 0 1.5px rgba(192,132,252,0.2)',
    cursor: 'pointer', transition: 'all 0.2s ease',
    fontSize: '0.8rem', position: 'relative', minHeight: 64,
  },
  lessonCheckActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.13), rgba(192,132,252,0.13))',
    boxShadow: '0 0 0 2px rgba(192,132,252,0.6), 0 4px 10px rgba(192,132,252,0.15)',
  },
  lessonCheckLocked: {
    opacity: 0.45,
    background: 'rgba(150,150,180,0.06)',
    boxShadow: 'none',
    justifyContent: 'center',
  },
  checkNum: { fontWeight: 800, fontSize: '0.82rem', transition: 'color 0.2s' },
  checkCount: { fontSize: '0.78rem', fontWeight: 600, transition: 'color 0.2s' },
  checkMark: {
    position: 'absolute', top: 5, right: 7,
    fontSize: '0.72rem', fontWeight: 900, color: '#f472b6',
  },
  poolInfo: {
    marginTop: 12, fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 700,
    textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  poolInfoNum: {
    fontSize: '1rem', fontWeight: 900, color: 'var(--text-light)',
  },
  sliderWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  sliderValueRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  numberInput: {
    width: 70, textAlign: 'center', fontSize: '1.3rem', fontWeight: 900,
    color: 'var(--text-main)', background: 'var(--tint)',
    border: 'none', borderRadius: 12,
    boxShadow: '0 0 0 2px rgba(192,132,252,0.3)',
    padding: '4px 8px', fontFamily: 'inherit', outline: 'none',
    transition: 'box-shadow 0.2s',
  },
  sliderLabels: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)',
  },
  allBtn: {
    padding: '5px 12px', borderRadius: 12, background: 'var(--tint-medium)',
    border: 'none', boxShadow: '0 0 0 1.5px rgba(192,132,252,0.25)',
    fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'lowercase', minHeight: 36, minWidth: 44,
  },
  allBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    boxShadow: '0 2px 8px rgba(236,72,153,0.3)', border: 'none',
  },
  startWrap: { textAlign: 'center', marginTop: 24, paddingBottom: 100 },
  warnText: { marginBottom: 10, fontSize: '0.78rem', color: 'var(--incorrect-text)', fontWeight: 600 },
  progressWrap: { marginBottom: 20 },
  progressInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' },
  scoreText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-light)' },
  progressBar: { height: 8, borderRadius: 50, background: 'var(--tint-strong)', overflow: 'hidden' },
  progressFill: {
    height: '100%', borderRadius: 50, background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    transition: 'width 0.4s ease',
  },
  questionCard: { textAlign: 'center', padding: 'clamp(20px, 5vw, 36px) clamp(14px, 4vw, 24px)', marginBottom: 20 },
  questionLabel: {
    fontSize: '1rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 20,
    textTransform: 'lowercase', letterSpacing: '0.01em',
  },
  questionKanji: {
    fontSize: 'clamp(4rem, 16vw, 6.5rem)', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1,
    marginBottom: 10,
    transition: 'transform 0.2s ease',
  },
  questionHint: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 600, fontStyle: 'italic', marginTop: 4 },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 },
  option: {
    padding: '18px 14px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center',
    cursor: 'pointer', transition: 'all 0.2s ease', border: 'none', background: 'var(--tint)',
    position: 'relative', minHeight: 62, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  optionNumber: {
    position: 'absolute', top: 4, left: 6, fontSize: '0.72rem', fontWeight: 800,
    color: 'var(--text-light)', opacity: 0.6, lineHeight: 1,
  },
  optionCorrect: {
    background: 'rgba(16, 185, 129, 0.15)', color: 'var(--correct-text)',
    boxShadow: '0 0 0 2px var(--correct-text), 0 4px 12px rgba(16, 185, 129, 0.2)',
  },
  optionIncorrect: {
    background: 'rgba(168, 85, 247, 0.12)', color: 'var(--text-main)',
    ...(prefersReducedMotion ? {} : { animation: 'shake 0.4s ease' }),
    boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.6)',
  },
  keyboardHint: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)',
    background: 'var(--tint)', padding: '3px 10px', borderRadius: 50,
    boxShadow: '0 0 0 1px rgba(192,132,252,0.2)',
  },
  feedbackWrap: { padding: '4px 0 8px' },
  feedback: { textAlign: 'center', fontSize: '0.9rem', fontWeight: 800, padding: '8px 12px' },
  feedbackPraise: { fontSize: '1rem', fontWeight: 900, marginBottom: 6 },
  feedbackRomaji: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontSize: '0.82rem', fontWeight: 700, color: 'var(--correct-text)', marginTop: 2,
  },
  feedbackKana: { color: 'var(--correct-text)', fontWeight: 700 },
  feedbackDot: { color: 'var(--correct-text)', fontWeight: 400, opacity: 0.5 },
  feedbackRomajiText: { letterSpacing: '0.05em', color: 'var(--correct-text)' },
  feedbackWrong: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  feedbackWrongKanji: { fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' },
  feedbackWrongEq: { fontSize: '0.85rem', color: 'var(--text-light)' },
  feedbackWrongMeaning: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' },
  feedbackWrongReading: {
    fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600, fontStyle: 'italic',
  },
  resultsWrap: { display: 'flex', justifyContent: 'center', paddingTop: 20, paddingBottom: 90 },
  resultsCard: { textAlign: 'center', padding: 'clamp(20px, 5vw, 32px) clamp(14px, 4vw, 24px)', maxWidth: 440, width: '100%' },
  resultsCardTablet: { maxWidth: 560, padding: '42px 34px' },
  resultsEmoji: { fontSize: '2.5rem', marginBottom: 8 },
  resultsTitle: { fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 },
  resultsText: {
    fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 20, textTransform: 'lowercase',
  },
  scoreCircle: {
    width: 130, height: 130, borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 32px rgba(236, 72, 153, 0.3), 0 0 0 4px rgba(244,114,182,0.15)',
  },
  scoreCircleInner: {
    width: 108, height: 108, borderRadius: '50%', background: 'var(--tint-solid)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  scoreBig: { fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 },
  scoreDetail: { fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600 },
  resultsActions: { display: 'flex', flexDirection: 'column', gap: 10 },
  xpBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '6px 18px', borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
    boxShadow: '0 0 0 1.5px rgba(251, 191, 36, 0.4)',
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
  mistakesSection: {
    marginTop: 4, marginBottom: 20,
    textAlign: 'left',
  },
  mistakesTitle: {
    fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)',
    marginBottom: 10, textAlign: 'center', textTransform: 'lowercase',
  },
  mistakesList: {
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  mistakeItem: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '10px 12px', borderRadius: 12, background: 'var(--tint)',
    boxShadow: '0 0 0 1px rgba(192,132,252,0.15)',
  },
  mistakeKanji: {
    fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)',
    lineHeight: 1, minWidth: 36, textAlign: 'center',
    textShadow: '0 1px 6px rgba(168,85,247,0.2)',
  },
  mistakeInfo: {
    display: 'flex', flexDirection: 'column', gap: 2, flex: 1,
  },
  mistakeMeaning: {
    fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)',
  },
  mistakeReading: {
    fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600,
  },
  mistakeRomaji: {
    color: 'var(--text-light)', fontWeight: 500,
  },
}
