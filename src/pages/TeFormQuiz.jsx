import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { lessons } from '../data/lessons'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import QuizCountdown from '../components/QuizCountdown'
import { getStoredQuizSize } from '../utils/localSettings'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// te-form conversion rules
function toTeForm(word) {
  const j = word.japanese
  const type = word.type

  if (type === 'гл. III') {
    if (j === 'します' || j.endsWith('します')) return j.replace(/します$/, 'して')
    if (j === 'きます') return 'きて'
    return j.replace(/ます$/, 'て')
  }

  if (type === 'гл. II') {
    return j.replace(/ます$/, 'て')
  }

  // гл. I (godan)
  if (j.endsWith('います') || j.endsWith('ちます') || j.endsWith('ります')) {
    return j.replace(/(います|ちます|ります)$/, (m) => {
      if (m === 'います') return 'って'
      if (m === 'ちます') return 'って'
      if (m === 'ります') return 'って'
      return 'って'
    })
  }
  if (j.endsWith('にます') || j.endsWith('びます') || j.endsWith('みます')) {
    return j.replace(/(にます|びます|みます)$/, 'んで')
  }
  if (j.endsWith('きます')) {
    // special case: いきます -> いって
    if (j === 'いきます') return 'いって'
    return j.replace(/きます$/, 'いて')
  }
  if (j.endsWith('ぎます')) {
    return j.replace(/ぎます$/, 'いで')
  }
  if (j.endsWith('します')) {
    return j.replace(/します$/, 'して')
  }

  return j.replace(/ます$/, 'て')
}

function toTeFormRomaji(word) {
  const r = word.romaji
  const type = word.type

  if (type === 'гл. III') {
    if (r === 'shimasu' || r.endsWith('shimasu')) return r.replace(/shimasu$/, 'shite')
    if (r === 'kimasu') return 'kite'
    return r.replace(/masu$/, 'te')
  }

  if (type === 'гл. II') {
    return r.replace(/masu$/, 'te')
  }

  // гл. I — longer suffixes must be checked before the generic 'imasu' catch-all
  if (r.endsWith('nimasu') || r.endsWith('bimasu') || r.endsWith('mimasu')) {
    return r.replace(/(nimasu|bimasu|mimasu)$/, 'nde')
  }
  if (r.endsWith('chimasu')) return r.replace(/chimasu$/, 'tte')
  if (r.endsWith('rimasu')) return r.replace(/rimasu$/, 'tte')
  if (r.endsWith('kimasu')) {
    if (r === 'ikimasu') return 'itte'
    return r.replace(/kimasu$/, 'ite')
  }
  if (r.endsWith('gimasu')) return r.replace(/gimasu$/, 'ide')
  if (r.endsWith('shimasu')) return r.replace(/shimasu$/, 'shite')
  if (r.endsWith('imasu')) return r.replace(/imasu$/, 'tte')

  return r.replace(/masu$/, 'te')
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Extract Group I verb stem for generating plausible wrong answers
function extractG1Stem(jp, rom) {
  const patterns = [
    { jp: 'います', rom: 'imasu' },
    { jp: 'ちます', rom: 'chimasu' },
    { jp: 'ります', rom: 'rimasu' },
    { jp: 'にます', rom: 'nimasu' },
    { jp: 'びます', rom: 'bimasu' },
    { jp: 'みます', rom: 'mimasu' },
    { jp: 'きます', rom: 'kimasu' },
    { jp: 'ぎます', rom: 'gimasu' },
    { jp: 'します', rom: 'shimasu' },
  ]
  for (const p of patterns) {
    if (jp.endsWith(p.jp) && rom.endsWith(p.rom)) {
      return { jpStem: jp.slice(0, -p.jp.length), romStem: rom.slice(0, -p.rom.length) }
    }
  }
  return null
}

// Generate pedagogically useful wrong options (same verb, wrong rule)
function generateWrongOptions(verb, correctTe, allVerbs) {
  const pickUniqueWrongForms = (forms) => {
    const seen = new Set([correctTe])
    const picked = []

    shuffle(forms).forEach(option => {
      if (picked.length >= 3 || !option?.text || seen.has(option.text)) return
      seen.add(option.text)
      picked.push({ ...option, correct: false })
    })

    return picked
  }

  if (verb.type !== 'гл. I') {
    return pickUniqueWrongForms(
      allVerbs
        .filter(v => v.japanese !== verb.japanese && toTeForm(v) !== correctTe)
        .map(v => ({ text: toTeForm(v), romaji: toTeFormRomaji(v) }))
    )
  }
  const stem = extractG1Stem(verb.japanese, verb.romaji)
  if (!stem) {
    return pickUniqueWrongForms(
      allVerbs
        .filter(v => v.japanese !== verb.japanese && toTeForm(v) !== correctTe)
        .map(v => ({ text: toTeForm(v), romaji: toTeFormRomaji(v) }))
    )
  }
  const { jpStem, romStem } = stem
  const wrongForms = [
    { text: jpStem + 'って', romaji: romStem + 'tte' },
    { text: jpStem + 'んで', romaji: romStem + 'nde' },
    { text: jpStem + 'いて', romaji: romStem + 'ite' },
    { text: jpStem + 'いで', romaji: romStem + 'ide' },
    { text: jpStem + 'して', romaji: romStem + 'shite' },
    { text: verb.japanese.replace(/ます$/, 'て'), romaji: verb.romaji.replace(/masu$/, 'te') },
  ].filter(o => o.text !== correctTe)
  return pickUniqueWrongForms(wrongForms)
}

// Returns rule explanation for the verb (hint)
function getVerbRule(verb) {
  const j = verb.japanese
  const type = verb.type
  if (type === 'гл. II') return 'Гл. II: убрать ます → て (просто!)'
  if (type === 'гл. III') {
    if (j === 'いきます') return '⚠️ исключение: いきます → いって'
    if (j === 'きます' || j === '来ます') return 'Гл. III (неправ.): きます → きて'
    return 'Гл. III (неправ.): します → して'
  }
  if (j === 'いきます') return '⚠️ исключение: いきます → いって (не いいて!)'
  if (j.endsWith('います') || j.endsWith('ちます') || j.endsWith('ります')) return 'Гл. I: います / ちます / ります → って (удвоение!)'
  if (j.endsWith('にます') || j.endsWith('びます') || j.endsWith('みます')) return 'Гл. I: にます / びます / みます → んで'
  if (j.endsWith('きます')) return 'Гл. I: きます → いて'
  if (j.endsWith('ぎます')) return 'Гл. I: ぎます → いで'
  if (j.endsWith('します')) return 'Гл. I: します → して'
  return 'Гл. I: по правилу'
}

const scoreReactions = [
  { min: 90, emoji: '🎉✨', text: 'sugoi!! て-форма освоена!', textJp: 'すごい！', encouragement: 'て-форма открывает целый мир: просьбы, ~ている, ~てから... Ты готова!' },
  { min: 70, emoji: '🌸😊', text: 'yoku dekimashita!', textJp: 'よくできました！', encouragement: 'Хорошая работа! て-форма — ключ к связным предложениям. Продолжай!' },
  { min: 50, emoji: '🐱💪', text: 'mada mada~ повторяем!', textJp: 'まだまだ！', encouragement: 'Гл. I немного сложнее — но ты справишься. Повтори правила って/んで/いて.' },
  { min: 0, emoji: '🌙📚', text: 'ganbatte! ещё разок~', textJp: 'がんばって！', encouragement: 'て-форма требует практики. Запомни: гл. II → -て, гл. I — по правилам. Давай снова!' },
]

// Verb type labels for display
const verbTypeLabels = {
  'гл. I': { label: 'Гл. I (u-verb)', color: 'var(--gold-text)' },
  'гл. II': { label: 'Гл. II (ru-verb)', color: 'var(--correct-text)' },
  'гл. III': { label: 'Гл. III (irregular)', color: 'var(--incorrect-text)' },
}

const correctPhrases = [
  '✨ correct! sugoi~',
  '🌸 kanpeki! идеально!',
  '⚡ hai, sou desu! верно!',
  '🎉 yoku dekita! отлично!',
  '✔ exactly right!',
]

const wrongPhrases = [
  '✗ не совсем...',
  '✗ ошибочка! смотри:',
  '✗ почти! правильно:',
  '✗ попробуй ещё раз~',
]

let correctIdx = 0
let wrongIdx = 0
function nextCorrect() { const p = correctPhrases[correctIdx % correctPhrases.length]; correctIdx++; return p }
function nextWrong() { const p = wrongPhrases[wrongIdx % wrongPhrases.length]; wrongIdx++; return p }

const PHASE_SETUP = 'setup'
const PHASE_QUIZ = 'quiz'
const PHASE_RESULTS = 'results'

export default function TeFormQuiz() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [showCountdown, setShowCountdown] = useState(false)
  const [mode, setMode] = useState('choose') // 'choose' or 'type'
  const [questionCount, setQuestionCount] = useState(getStoredQuizSize)
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(15)
  const [customTimerVal, setCustomTimerVal] = useState('')

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [feedbackPhrase, setFeedbackPhrase] = useState('')
  const [typedAnswer, setTypedAnswer] = useState('')
  const [mistakes, setMistakes] = useState([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [questionKey, setQuestionKey] = useState(0)
  const [showRomaji, setShowRomaji] = useState(false)
  const [showVerbHint, setShowVerbHint] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const inputRef = useRef(null)
  const answerLockedRef = useRef(false)
  const advanceLockedRef = useRef(false)
  const xpAwardedRef = useRef(false)

  const [searchParams] = useSearchParams()
  const { unlockedLessons } = useUnlockedLessons()
  const sharedLessonId = parseInt(searchParams.get('lesson') || '', 10)
  const sharedLesson = Number.isFinite(sharedLessonId) ? lessons.find(l => l.id === sharedLessonId) : null
  const lessonPool = useMemo(() => (
    sharedLesson && !unlockedLessons.some(l => l.id === sharedLesson.id)
      ? [...unlockedLessons, sharedLesson]
      : unlockedLessons
  ), [sharedLesson, unlockedLessons])

  // Pre-select lesson from URL param (?lesson=X), e.g. when coming from LessonDetail
  const [selectedLessons, setSelectedLessons] = useState(() => {
    const lessonParam = searchParams.get('lesson')
    if (lessonParam) {
      const lid = parseInt(lessonParam, 10)
      const hasVerbs = lessons.some(l => l.id === lid && l.vocabulary.some(w => w.type && w.type.startsWith('гл.')))
      if (hasVerbs) return [lid]
    }
    return [] // empty = all unlocked
  })

  // verb pool organized by lesson. A direct ?lesson=X link may add one shared lesson.
  // exclude context-annotated entries like "います [こどもが〜]" — brackets indicate usage notes, not standalone verbs
  const verbsByLesson = {}
  lessonPool.forEach(l => {
    const vs = l.vocabulary.filter(w => w.type && w.type.startsWith('гл.') && !w.japanese.includes('['))
    if (vs.length > 0) verbsByLesson[l.id] = vs
  })

  // all active/shared verbs (for generating plausible wrong options)
  const allVerbs = lessonPool
    .flatMap(l => l.vocabulary.filter(w => w.type && w.type.startsWith('гл.') && !w.japanese.includes('[')))

  // active verb pool (filtered by selected lessons, or all unlocked)
  const activeVerbs = selectedLessons.length === 0
    ? allVerbs
    : selectedLessons.flatMap(lid => verbsByLesson[lid] || [])


  const startMistakesQuiz = () => {
    if (mistakes.length === 0) return
    const missedVerbs = mistakes.map(m => m.verb)
    correctIdx = 0
    wrongIdx = 0
    const qs = missedVerbs.map(verb => {
      const correctTe = toTeForm(verb)
      if (mode === 'choose') {
        const wrongOptions = generateWrongOptions(verb, correctTe, allVerbs)
        const options = shuffle([
          { text: correctTe, romaji: toTeFormRomaji(verb), correct: true },
          ...wrongOptions,
        ])
        return { verb, correctTe, correctRomaji: toTeFormRomaji(verb), options }
      }
      return { verb, correctTe, correctRomaji: toTeFormRomaji(verb) }
    })
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setStreak(0)
    setBestStreak(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setFeedbackPhrase('')
    setTypedAnswer('')
    setQuestionKey(0)
    answerLockedRef.current = false
    advanceLockedRef.current = false
    setPhase(PHASE_QUIZ)
  }

  const startQuiz = () => {
    if (activeVerbs.length < 4) return
    xpAwardedRef.current = false
    correctIdx = 0
    wrongIdx = 0
    const count = questionCount === 'all' ? activeVerbs.length : Math.min(questionCount, activeVerbs.length)
    const selected = shuffle(activeVerbs).slice(0, count)

    const qs = selected.map(verb => {
      const correctTe = toTeForm(verb)
      if (mode === 'choose') {
        const wrongOptions = generateWrongOptions(verb, correctTe, allVerbs)
        const options = shuffle([
          { text: correctTe, romaji: toTeFormRomaji(verb), correct: true },
          ...wrongOptions,
        ])
        return { verb, correctTe, correctRomaji: toTeFormRomaji(verb), options }
      }
      return { verb, correctTe, correctRomaji: toTeFormRomaji(verb) }
    })

    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMistakes([])
    setStreak(0)
    setBestStreak(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setFeedbackPhrase('')
    setTypedAnswer('')
    setQuestionKey(0)
    answerLockedRef.current = false
    advanceLockedRef.current = false
    setShowCountdown(true)
    setPhase(PHASE_QUIZ)
  }

  // focus input in type mode
  useEffect(() => {
    if (phase === PHASE_QUIZ && !showCountdown && mode === 'type' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase, showCountdown, currentIndex, mode])

  const advance = useCallback(() => {
    if (advanceLockedRef.current) return
    advanceLockedRef.current = true
    if (currentIndex + 1 >= questions.length) {
      setPhase(PHASE_RESULTS)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setFeedbackPhrase('')
      setTypedAnswer('')
      setQuestionKey(prev => prev + 1)
      setShowVerbHint(false)
      answerLockedRef.current = false
    }
  }, [currentIndex, questions.length])

  const skipDelay = useCallback(() => {
    clearTimeout(timerRef.current)
    advance()
  }, [advance])

  const handleChoose = useCallback((option) => {
    if (selectedAnswer !== null || answerLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = false
    setSelectedAnswer(option)
    const correct = option.correct
    setIsCorrect(correct)
    setFeedbackPhrase(correct ? nextCorrect() : nextWrong())
    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => { const n = prev + 1; setBestStreak(b => Math.max(b, n)); return n })
    } else {
      setMistakes(prev => [...prev, { verb: questions[currentIndex].verb, correct: questions[currentIndex].correctTe, correctRomaji: questions[currentIndex].correctRomaji }])
      setStreak(0)
    }

    timerRef.current = setTimeout(advance, correct ? 1000 : 3500)
  }, [selectedAnswer, questions, currentIndex, advance])

  const handleTypeSubmit = useCallback(() => {
    if (showCountdown) return
    if (isCorrect !== null || answerLockedRef.current) return
    answerLockedRef.current = true
    advanceLockedRef.current = false
    const q = questions[currentIndex]
    const answer = typedAnswer.trim().toLowerCase()
    const correct = answer === q.correctRomaji.toLowerCase() || answer === q.correctTe
    setIsCorrect(correct)
    setFeedbackPhrase(correct ? nextCorrect() : nextWrong())
    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => { const n = prev + 1; setBestStreak(b => Math.max(b, n)); return n })
    } else {
      setMistakes(prev => [...prev, { verb: q.verb, correct: q.correctTe, correctRomaji: q.correctRomaji }])
      setStreak(0)
    }

    timerRef.current = setTimeout(advance, correct ? 1000 : 3500)
  }, [showCountdown, typedAnswer, questions, currentIndex, isCorrect, advance])

  // keyboard shortcuts in choose mode
  useEffect(() => {
    if (phase !== PHASE_QUIZ || showCountdown || mode !== 'choose' || selectedAnswer !== null) return
    const handler = (e) => {
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && questions[currentIndex]?.options?.[num - 1]) {
        handleChoose(questions[currentIndex].options[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, showCountdown, mode, selectedAnswer, questions, currentIndex, handleChoose])

  useEffect(() => { if (isTimed && mode === 'choose' && phase === PHASE_QUIZ && !showCountdown) setTimeLeft(timeLimit) }, [currentIndex, isTimed, timeLimit, phase, mode, showCountdown])
  useEffect(() => {
    if (!isTimed || mode !== 'choose' || phase !== PHASE_QUIZ || showCountdown || selectedAnswer !== null) { clearInterval(countdownRef.current); return }
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) { clearInterval(countdownRef.current); handleChoose({ correct: false, text: '__TIMEOUT__', romaji: '__TIMEOUT__' }); return 0 }
        return Math.max(0, prev - 0.1)
      })
    }, 100)
    return () => clearInterval(countdownRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimed, mode, phase, showCountdown, selectedAnswer, currentIndex])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); clearInterval(countdownRef.current) }
  }, [])

  useEffect(() => {
    if (phase === PHASE_RESULTS && questions.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      const lessons = selectedLessons.length > 0
        ? selectedLessons
        : lessonPool
            .filter(l => l.vocabulary.some(w => w.type && w.type.startsWith('гл.') && !w.japanese.includes('[')))
            .map(l => l.id)
      saveQuizResult('grammar', { type: 'te-form', lessons, score, total: questions.length })
      const xp = calculateQuizXP(score, questions.length)
      if (xp > 0) awardXP(xp, 'te-form quiz', score === questions.length && questions.length > 0)
    }
  }, [phase, score, questions.length, selectedLessons, lessonPool, saveQuizResult, awardXP, calculateQuizXP])

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
          <div style={s.header}>
            <h1 style={s.title}>
              <span style={s.titleIcon}>て</span> te-form quiz <span style={s.titleJp}>て形テスト</span>
            </h1>
            <p style={s.subtitle}>master verb conjugation — unlock requests, progressive tense & more 🌸</p>
          </div>

          {/* te-form rules quick reference */}
          <div className="glass" style={s.setupCard}>
            <div style={s.setupLabel}><span>📋</span> te-form rules</div>

            {/* Group II */}
            <div style={s.groupHeader}>
              <span style={{ ...s.groupBadge, background: 'rgba(16,185,129,0.15)', color: 'var(--correct-text)', border: '1.5px solid rgba(16,185,129,0.35)' }}>гл. II</span>
              <span style={s.groupSubtitle}>ru-verbs — просто убираем ます → て</span>
            </div>
            <div style={s.groupBox}>
              <div style={s.bigRule}>
                <span style={s.bigRuleEnding}>〜ます</span>
                <span style={s.bigRuleArrow}>→</span>
                <span style={{ ...s.bigRuleResult, color: 'var(--correct-text)' }}>〜て</span>
              </div>
              <div style={s.examplesRow}>
                <span style={s.exItem}>たべ<b>ます</b> → たべ<b style={{color:'var(--correct-text)'}}>て</b> <span style={s.exRom}>(tabete)</span></span>
                <span style={s.exItem}>み<b>ます</b> → み<b style={{color:'var(--correct-text)'}}>て</b> <span style={s.exRom}>(mite)</span></span>
                <span style={s.exItem}>おき<b>ます</b> → おき<b style={{color:'var(--correct-text)'}}>て</b> <span style={s.exRom}>(okite)</span></span>
              </div>
            </div>

            {/* Group I */}
            <div style={{ ...s.groupHeader, marginTop: 14 }}>
              <span style={{ ...s.groupBadge, background: 'rgba(245,158,11,0.15)', color: 'var(--gold-text)', border: '1.5px solid rgba(245,158,11,0.35)' }}>гл. I</span>
              <span style={s.groupSubtitle}>u-verbs — меняем окончание по правилу</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { ends: 'います / ちます / ります', result: 'って', note: 'удвоение!', examples: ['かいます→かって', 'まちます→まって', 'とります→とって'], roms: ['katte','matte','totte'] },
                { ends: 'にます / びます / みます', result: 'んで', note: 'озвончение', examples: ['しにます→しんで', 'よびます→よんで', 'のみます→のんで'], roms: ['shinde','yonde','nonde'] },
                { ends: 'きます', result: 'いて', note: '', examples: ['かきます→かいて', 'ひきます→ひいて'], roms: ['kaite','hiite'] },
                { ends: 'ぎます', result: 'いで', note: '', examples: ['およぎます→およいで', 'いそぎます→いそいで'], roms: ['oyoide','isoide'] },
                { ends: 'します', result: 'して', note: '', examples: ['はなします→はなして', 'かします→かして'], roms: ['hanashite','kashite'] },
              ].map(({ ends, result, note, examples, roms }) => (
                <div key={ends} style={s.ruleBlock}>
                  <div style={s.ruleBlockHeader}>
                    <span style={s.ruleEnding}>{ends}</span>
                    <span style={s.ruleArrow}>→</span>
                    <span style={{ ...s.ruleResultBig, color: 'var(--gold-text)' }}>{result}</span>
                    {note && <span style={s.ruleNote2}>{note}</span>}
                  </div>
                  <div style={s.examplesRow}>
                    {examples.map((ex, i) => {
                      const [from, to] = ex.split('→')
                      return (
                        <span key={i} style={s.exItem}>
                          {from}→<b style={{color:'var(--gold-text)'}}>{to}</b> <span style={s.exRom}>({roms[i]})</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Exception */}
            <div style={s.exceptionBox}>
              <span style={s.exceptionIcon}>⚠️</span>
              <span style={s.exceptionText}>исключение: <b>いきます</b> → <b style={{color:'var(--incorrect-text)'}}>いって</b> <span style={s.exRom}>(itte)</span></span>
            </div>

            {/* Group III */}
            <div style={{ ...s.groupHeader, marginTop: 14 }}>
              <span style={{ ...s.groupBadge, background: 'rgba(244,63,94,0.12)', color: 'var(--incorrect-text)', border: '1.5px solid rgba(244,63,94,0.3)' }}>гл. III</span>
              <span style={s.groupSubtitle}>неправильные — учим наизусть</span>
            </div>
            <div style={s.groupBox}>
              <div style={s.examplesRow}>
                <span style={s.exItem}><b>します</b> → <b style={{color:'var(--incorrect-text)'}}>して</b> <span style={s.exRom}>(shite)</span></span>
                <span style={s.exItem}><b>きます</b> → <b style={{color:'var(--incorrect-text)'}}>きて</b> <span style={s.exRom}>(kite)</span></span>
              </div>
            </div>
          </div>

          {/* lesson filter */}
          <div className="glass" style={s.setupCard}>
            <div style={{ ...s.setupLabel, gap: 10 }}>
              <span>📖</span> lessons
              <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600 }}>
                {selectedLessons.length === 0 ? 'all unlocked' : `${selectedLessons.length} selected · ${activeVerbs.length} verbs`}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                onClick={() => setSelectedLessons([])}
                style={{
                  padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                  background: selectedLessons.length === 0 ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                  color: selectedLessons.length === 0 ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s', minHeight: 44,
                }}
              >all</button>
              {Object.keys(verbsByLesson).map(lid => {
                const id = parseInt(lid, 10)
                const active = selectedLessons.includes(id)
                return (
                  <button key={id}
                    onClick={() => setSelectedLessons(prev =>
                      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                    )}
                    style={{
                      padding: '4px 12px', borderRadius: 50, border: 'none', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                      background: active ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s', minHeight: 44,
                    }}
                  >L{id}</button>
                )
              })}
            </div>
            {activeVerbs.length < 4 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--incorrect-text)', marginTop: 8, fontWeight: 700 }}>
                need at least 4 verbs to start
              </div>
            )}
          </div>

          {/* mode */}
          <div className="glass" style={s.setupCard}>
            <div style={s.setupLabel}><span>🎯</span> quiz mode</div>
            <div style={s.modeRow}>
              <button
                onClick={() => setMode('choose')}
                style={{ ...s.modeBtn, ...(mode === 'choose' ? s.modeBtnActive : {}) }}
              >
                <span style={{ fontSize: '1.4rem' }}>🅰️</span>
                <span>choose</span>
                <span style={s.modeJp}>выбери ответ</span>
              </button>
              <button
                onClick={() => setMode('type')}
                style={{ ...s.modeBtn, ...(mode === 'type' ? s.modeBtnActive : {}) }}
              >
                <span style={{ fontSize: '1.4rem' }}>⌨️</span>
                <span>type</span>
                <span style={s.modeJp}>напиши ромадзи</span>
              </button>
            </div>
          </div>

          {/* count */}
          <div className="glass" style={s.setupCard}>
            <div style={s.setupLabel}><span>🔢</span> how many questions?</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              {[5, 10, 20].map(n => (
                <button key={n} onClick={() => setQuestionCount(Math.min(n, activeVerbs.length))} style={{
                  padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                  background: questionCount === n ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                  color: questionCount === n ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 44,
                }}>{n}</button>
              ))}
              <button onClick={() => setQuestionCount('all')} style={{
                padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                background: questionCount === 'all' ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                color: questionCount === 'all' ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s', minHeight: 44,
              }}>all ({activeVerbs.length})</button>
            </div>
            <div style={s.sliderWrap}>
              <div style={s.sliderValueRow}>
                <input
                  type="number"
                  aria-label="number of questions"
                  min={5}
                  max={Math.max(activeVerbs.length, 5)}
                  value={questionCount === 'all' ? activeVerbs.length : questionCount}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') { setQuestionCount(5); return }
                    const v = parseInt(raw, 10)
                    if (isNaN(v)) return
                    if (v >= activeVerbs.length) setQuestionCount('all')
                    else setQuestionCount(Math.max(1, v))
                  }}
                  onBlur={() => {
                    if (questionCount !== 'all' && questionCount < 5) setQuestionCount(5)
                  }}
                  disabled={activeVerbs.length < 5}
                  style={s.numberInput}
                />
              </div>
              <input
                type="range"
                className="kawaii-slider"
                min={5}
                max={Math.max(activeVerbs.length, 5)}
                value={questionCount === 'all' ? activeVerbs.length : questionCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  setQuestionCount(v >= activeVerbs.length ? 'all' : v)
                }}
                aria-label="number of questions"
              />
              <div style={s.sliderLabels}>
                <span>5</span>
                <button
                  onClick={() => setQuestionCount('all')}
                  style={{ ...s.allBtn, ...(questionCount === 'all' ? s.allBtnActive : {}) }}
                >all</button>
              </div>
            </div>
          </div>

          {mode === 'choose' && (
            <div className="glass" style={s.setupCard}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>⏱ timer per question</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[{ label: 'выкл', val: 0 }, { label: '10с', val: 10 }, { label: '15с', val: 15 }, { label: '20с', val: 20 }, { label: '30с', val: 30 }].map(({ label, val }) => (
                  <button key={label} onClick={() => { setIsTimed(val > 0); if (val > 0) setTimeLimit(val); setCustomTimerVal('') }}
                    style={{ padding: '4px 14px', borderRadius: 50, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit', minHeight: 44,
                      background: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                      color: (!isTimed && val === 0) || (isTimed && timeLimit === val && !customTimerVal) ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                    {label}
                  </button>
                ))}
                <input type="number" min={5} max={60} placeholder="своё" aria-label="custom time limit in seconds" value={customTimerVal}
                  onChange={e => { setCustomTimerVal(e.target.value); const v = parseInt(e.target.value, 10); if (v >= 5) { setIsTimed(true); setTimeLimit(v) } }}
                  style={{ width: 55, padding: '4px 8px', borderRadius: 50, border: 'none', cursor: 'text', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit', textAlign: 'center', minHeight: 44,
                    background: customTimerVal ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)', color: customTimerVal ? '#fff' : 'var(--text-secondary)', outline: 'none' }} />
              </div>
            </div>
          )}

          <div style={s.startWrap}>
            <button className="btn btn-cute" onClick={startQuiz} style={{ maxWidth: 260 }} disabled={activeVerbs.length < 4}>
              start quiz ✨
            </button>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Link to="/quiz/conjugation" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>conj quiz 🔀</Link>
              <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
            </div>
          </div>
        </div>
      )}

      {showCountdown && <QuizCountdown onComplete={() => setShowCountdown(false)} />}

      {phase === PHASE_QUIZ && questions.length > 0 && (
        <div className="animate-fadeInUp">
          {/* progress */}
          <div style={s.progressWrap}>
            <div style={s.progressInfo}>
              <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
              <span style={s.progressText}>{currentIndex + 1} / {questions.length}</span>
              <span style={s.scoreText} aria-live="polite" aria-atomic="true">
                score: {score} 🌸
                {streak >= 3 && (
                  <span style={s.streakBadge} className="animate-pop" key={streak}>
                    {streak >= 7 ? '🔥🔥' : streak >= 5 ? '🔥' : '⚡'} {streak}x
                  </span>
                )}
              </span>
            </div>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>
            {isTimed && mode === 'choose' && (
              <div style={{ height: 4, background: 'rgba(192,132,252,0.15)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(timeLeft / timeLimit) * 100}%`, background: timeLeft <= 3 ? '#ef4444' : '#c084fc', borderRadius: 2, transition: 'width 0.1s linear, background 0.3s ease' }} />
              </div>
            )}
          </div>

          {/* question */}
          <div
            className="glass animate-pop"
            key={`question-${questionKey}`}
            style={{ ...s.questionCard, ...(!prefersReducedMotion && isCorrect === false ? { animation: 'shake 0.4s ease' } : {}) }}
          >
            <div style={s.questionLabel}>
              {mode === 'choose' ? 'choose the て-form' : 'type the て-form in romaji ⌨️'}
            </div>

            {/* verb display — prominent */}
            <div style={s.verbDisplayWrap}>
              <div style={{ ...s.questionWord, fontSize: isMobile ? '2rem' : '2.6rem' }}>
                {questions[currentIndex].verb.kanji || questions[currentIndex].verb.japanese}
              </div>
              <div style={s.questionRomaji}>{questions[currentIndex].verb.romaji}</div>
            </div>

            <div style={s.questionRu}>{questions[currentIndex].verb.russian}</div>

            {/* verb type badge */}
            {questions[currentIndex].verb.type && verbTypeLabels[questions[currentIndex].verb.type] && (
              <div style={{
                ...s.verbTypeBadge,
                color: verbTypeLabels[questions[currentIndex].verb.type].color,
                borderColor: verbTypeLabels[questions[currentIndex].verb.type].color + '44',
                background: verbTypeLabels[questions[currentIndex].verb.type].color + '12',
              }}>
                {verbTypeLabels[questions[currentIndex].verb.type].label}
              </div>
            )}

            {/* verb rule hint */}
            {(showVerbHint || (selectedAnswer !== null && !isCorrect))
              ? <div style={s.verbHintText} className="animate-pop">{getVerbRule(questions[currentIndex].verb)}</div>
              : <button onClick={() => setShowVerbHint(true)} className="btn-hover" style={s.hintBtn}>💡 правило</button>
            }

            <div style={s.arrowRow}>
              <span style={s.arrowLabel}>→ て-form?</span>
            </div>
          </div>

          {/* keyboard hint + romaji toggle */}
          {mode === 'choose' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              {!selectedAnswer && <span style={s.keyHintChip}>⌨ 1–4 to answer</span>}
              {selectedAnswer && <span />}
              <button onClick={() => setShowRomaji(r => !r)} className="btn-hover" style={s.romajiToggleBtn}>
                {showRomaji ? 'скрыть ромадзи' : 'あ ромадзи'}
              </button>
            </div>
          )}

          {/* choose mode */}
          {mode === 'choose' && (
            <div key={`options-${currentIndex}`} style={{ ...s.optionsGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              {questions[currentIndex].options.map((opt, i) => {
                let optStyle = { ...s.option, flexDirection: 'column', gap: 3 }
                if (selectedAnswer) {
                  if (opt.correct) optStyle = { ...optStyle, ...s.optionCorrect }
                  else if (selectedAnswer === opt && !isCorrect) optStyle = { ...optStyle, ...s.optionIncorrect }
                  else optStyle = { ...optStyle, opacity: 0.5 }
                }
                return (
                  <button
                    key={`${currentIndex}-${i}`}
                    onClick={() => handleChoose(opt)}
                    className="glass-sm quiz-option"
                    style={optStyle}
                    disabled={selectedAnswer !== null}
                  >
                    <span style={s.optionNumBadge}>{i + 1}</span>
                    <span>{opt.text}</span>
                    {showRomaji && opt.romaji && <span style={s.optionRomaji}>{opt.romaji}</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* type mode */}
          {mode === 'type' && (
            <div style={s.typeWrap}>
              <input
                ref={inputRef}
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTypeSubmit() }}
                onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                placeholder="romaji..."
                aria-label="type romaji answer"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={isCorrect !== null}
                style={{
                  ...s.typeInput,
                  ...(isCorrect === true ? s.typeInputCorrect : {}),
                  ...(isCorrect === false ? s.typeInputIncorrect : {}),
                }}
              />
              {isCorrect === null && (
                <button className="btn btn-primary" onClick={handleTypeSubmit} style={{ fontSize: '0.85rem' }}>
                  check ✨
                </button>
              )}
            </div>
          )}

          {/* feedback */}
          {isCorrect !== null && (
            <div style={{ ...s.feedback, color: isCorrect ? 'var(--correct-text)' : 'var(--incorrect-text)' }} className="animate-pop">
              {isCorrect ? (
                feedbackPhrase
              ) : (
                <span>
                  {feedbackPhrase}{' '}
                  <span style={s.feedbackCorrectAnswer}>
                    {questions[currentIndex].correctTe}
                  </span>
                  <span style={s.feedbackCorrectRomaji}>
                    {' '}({questions[currentIndex].correctRomaji})
                  </span>
                </span>
              )}
            </div>
          )}
          {isCorrect === false && (
            <div style={s.verbHintText} className="animate-pop">
              {getVerbRule(questions[currentIndex].verb)}
              {questions[currentIndex].verb.lesson && (
                <Link to={`/lessons/${questions[currentIndex].verb.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginLeft: 8 }}>
                  lesson {questions[currentIndex].verb.lesson} →
                </Link>
              )}
            </div>
          )}
          {isCorrect !== null && (
            <div onClick={skipDelay} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipDelay() } }} aria-label="continue to next question" style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 4, cursor: 'pointer' }}>
              нажми чтобы продолжить →
            </div>
          )}
        </div>
      )}

      {phase === PHASE_RESULTS && (
        <div className="animate-fadeInUp" style={s.resultsWrap}>
          <div className="glass" style={{ ...s.resultsCard, ...(isTablet ? s.resultsCardTablet : {}) }}>
            {percentage >= 90 && <Confetti trigger={true} />}
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{reaction.emoji}</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 }}>{reaction.textJp}</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 16 }}>{reaction.text}</p>

            <div style={s.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
              <div style={s.scoreCircleInner}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{percentage}%</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>{score}/{questions.length}</span>
              </div>
            </div>

            {calculateQuizXP(score, questions.length) > 0 && (
              <div style={s.xpBadge} className="animate-pop">
                <span style={s.xpIcon}>⚡</span>
                <span style={s.xpAmount}>+{calculateQuizXP(score, questions.length)} XP</span>
              </div>
            )}

            {bestStreak >= 3 && (
              <div style={s.bestStreak} className="animate-pop">
                {bestStreak >= 7 ? '🔥🔥' : bestStreak >= 5 ? '🔥' : '⚡'} best streak: {bestStreak}x
              </div>
            )}

            {/* group accuracy breakdown */}
            {questions.length > 0 && (() => {
              const groups = [
                { type: 'гл. II', label: 'гл. II', sublabel: 'ru-verbs', color: 'var(--correct-text)' },
                { type: 'гл. I', label: 'гл. I', sublabel: 'u-verbs', color: 'var(--gold-text)' },
                { type: 'гл. III', label: 'гл. III', sublabel: 'irregular', color: 'var(--incorrect-text)' },
              ]
              const rows = groups.map(g => {
                const total = questions.filter(q => q.verb.type === g.type).length
                if (total === 0) return null
                const missed = mistakes.filter(m => m.verb.type === g.type).length
                const pct = Math.round(((total - missed) / total) * 100)
                return { ...g, total, pct }
              }).filter(Boolean)
              if (rows.length < 2) return null
              return (
                <div style={{ marginBottom: 14, width: '100%' }}>
                  {rows.map(r => (
                    <div key={r.type} style={{ marginBottom: 7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'baseline' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: r.color }}>{r.label} <span style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '0.72rem' }}>{r.sublabel}</span></span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: r.pct >= 80 ? 'var(--correct-text)' : r.pct >= 50 ? 'var(--gold-text)' : 'var(--incorrect-text)' }}>{r.pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 50, background: 'rgba(192,132,252,0.12)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${r.pct}%`, borderRadius: 50, background: r.pct >= 80 ? 'var(--correct-text)' : r.pct >= 50 ? 'var(--gold-text)' : 'var(--incorrect-text)', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* encouraging message */}
            <div style={s.encouragement}>
              {reaction.encouragement}
            </div>

            {mistakes.length > 0 && (
              <div style={s.mistakesSection}>
                <div style={s.mistakesLabel}>mistakes ({mistakes.length}) ✏️</div>
                {mistakes.map((m, i) => (
                  <div key={(m.verb.japanese || '') + i} style={s.mistakeItem}>
                    <div style={s.mistakeVerbRow}>
                      <span style={s.mistakeVerb}>{m.verb.kanji || m.verb.japanese}</span>
                      <span style={s.mistakeRu}>{m.verb.russian}</span>
                      {m.verb.lesson && (
                        <Link to={`/lessons/${m.verb.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginLeft: 'auto', flexShrink: 0 }}>
                          lesson {m.verb.lesson} →
                        </Link>
                      )}
                    </div>
                    <div style={s.mistakeTeRow}>
                      <span style={s.mistakeArrow}>→</span>
                      <span style={s.mistakeCorrect}>{m.correct}</span>
                      <span style={s.mistakeRomaji}>({m.correctRomaji})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-cute" onClick={() => setPhase(PHASE_SETUP)} style={{ flex: 1 }}>try again 🌸</button>
                <ShareResult quizName="te-form quiz" score={score} total={questions.length} percentage={percentage} bestStreak={bestStreak} xpEarned={calculateQuizXP(score, questions.length)} />
              </div>
              {mistakes.length > 0 && (
                <button className="btn btn-primary" onClick={startMistakesQuiz} style={{ width: '100%' }}>
                  drill mistakes ({mistakes.length}) 🔥
                </button>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/quiz/conjugation" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>conj quiz 🔀</Link>
                <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  header: { textAlign: 'center', marginBottom: 20, padding: '8px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  titleIcon: {
    fontSize: '1.8rem', fontWeight: 900,
    background: 'linear-gradient(135deg, #f472b6, #a855f7)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  titleJp: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },
  setupCard: { padding: 18, marginBottom: 14 },
  setupLabel: {
    fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 8, textTransform: 'lowercase',
  },
  groupHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  groupBadge: {
    fontSize: '0.8rem', fontWeight: 800, padding: '3px 12px', borderRadius: 50,
  },
  groupSubtitle: {
    fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600,
  },
  groupBox: {
    background: 'var(--tint)', borderRadius: 10, padding: '10px 12px', marginBottom: 4,
  },
  bigRule: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  bigRuleEnding: {
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-secondary)',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  bigRuleArrow: { color: 'var(--text-light)', fontWeight: 700, fontSize: '1rem' },
  bigRuleResult: {
    fontSize: '1.1rem', fontWeight: 900,
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  examplesRow: {
    display: 'flex', flexWrap: 'wrap', gap: '4px 12px',
  },
  exItem: {
    fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: "'Noto Sans JP', sans-serif",
  },
  exRom: {
    fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic', fontFamily: 'inherit',
  },
  ruleBlock: {
    background: 'var(--tint)', borderRadius: 10, padding: '8px 12px',
  },
  ruleBlockHeader: {
    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5,
  },
  ruleEnding: {
    fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-secondary)',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  ruleArrow: { color: 'var(--text-light)', fontWeight: 700 },
  ruleResultBig: {
    fontSize: '0.95rem', fontWeight: 900, fontFamily: "'Noto Sans JP', sans-serif",
  },
  ruleNote2: {
    fontSize: '0.72rem', background: 'rgba(245,158,11,0.12)', color: 'var(--gold-text)',
    border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, padding: '1px 6px', fontWeight: 700,
  },
  exceptionBox: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
    background: 'rgba(244,63,94,0.08)', border: '1.5px solid rgba(244,63,94,0.2)',
    borderRadius: 10, padding: '8px 12px',
  },
  exceptionIcon: { fontSize: '0.9rem' },
  exceptionText: {
    fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: "'Noto Sans JP', sans-serif",
  },
  ruleNote: { fontSize: '0.72rem', color: 'var(--text-light)', fontStyle: 'italic' },
  modeRow: { display: 'flex', gap: 10 },
  modeBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '14px 12px', borderRadius: 16, background: 'var(--tint-medium)',
    border: '2px solid rgba(192,132,252,0.25)', cursor: 'pointer', transition: 'all 0.2s ease',
    fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'lowercase',
  },
  modeBtnActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    border: '2px solid #f472b6', boxShadow: '0 4px 12px rgba(244, 114, 182, 0.15)',
    color: 'var(--text-main)',
  },
  modeJp: { fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 500 },
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
    padding: '3px 14px', borderRadius: 50, background: 'var(--tint-medium)',
    border: '1.5px solid rgba(192,132,252,0.25)', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease', minHeight: 44,
  },
  allBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent',
  },
  startWrap: { textAlign: 'center', marginTop: 20 },
  progressWrap: { marginTop: 28, marginBottom: 20 },
  progressInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' },
  scoreText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-light)' },
  progressBar: { height: 8, borderRadius: 50, background: 'var(--tint-strong)', overflow: 'hidden' },
  progressFill: {
    height: '100%', borderRadius: 50, background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    transition: 'width 0.4s ease',
  },
  questionCard: { textAlign: 'center', padding: '24px 20px', marginBottom: 14 },
  questionLabel: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 16, textTransform: 'lowercase' },
  verbDisplayWrap: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.06), rgba(168,85,247,0.06))',
    borderRadius: 16, padding: '14px 20px', marginBottom: 10, display: 'inline-block',
    border: '1.5px solid rgba(168,85,247,0.12)',
  },
  questionWord: { fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4, lineHeight: 1.2 },
  questionRomaji: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 600, fontStyle: 'italic' },
  questionRu: { fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10 },
  verbTypeBadge: {
    display: 'inline-block', fontSize: '0.72rem', fontWeight: 800,
    padding: '3px 12px', borderRadius: 50, border: '1.5px solid',
    marginBottom: 10, textTransform: 'none',
  },
  arrowRow: { marginTop: 4 },
  arrowLabel: {
    fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-light)',
    background: 'rgba(192,132,252,0.1)', padding: '3px 14px', borderRadius: 50,
  },
  keyHintChip: {
    fontSize: '0.78rem', fontWeight: 700,
    color: 'var(--text-light)',
  },
  romajiToggleBtn: {
    padding: '4px 12px', borderRadius: 20, border: '1.5px solid rgba(192,132,252,0.4)',
    background: 'var(--tint)', color: 'var(--text-light)', fontSize: '0.78rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
  },
  hintBtn: {
    padding: '4px 14px', borderRadius: 20, border: '1.5px solid rgba(192,132,252,0.35)',
    background: 'var(--tint)', color: 'var(--text-light)', fontSize: '0.8rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6, minHeight: 44,
  },
  verbHintText: {
    fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-text)',
    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 8, padding: '4px 12px', marginBottom: 6,
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  optionRomaji: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)',
    fontStyle: 'italic', fontFamily: 'inherit',
  },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 },
  option: {
    padding: '18px 14px', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center',
    cursor: 'pointer', transition: 'all 0.2s ease', border: 'none', background: 'var(--tint)',
    minHeight: 62, position: 'relative', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  optionNumBadge: {
    position: 'absolute', top: 5, left: 8, fontSize: '0.72rem', fontWeight: 800,
    color: 'var(--text-light)', opacity: 0.7, background: 'rgba(192,132,252,0.12)',
    borderRadius: 4, padding: '1px 4px',
  },
  optionCorrect: {
    background: 'rgba(16, 185, 129, 0.15)', border: '2px solid var(--correct-text)', color: 'var(--correct-text)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
  },
  optionIncorrect: {
    background: 'rgba(244, 63, 94, 0.12)', border: '2px solid var(--incorrect-text)', color: 'var(--incorrect-text)',
    ...(prefersReducedMotion ? {} : { animation: 'shake 0.4s ease' }),
  },
  typeWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  typeInput: {
    width: '100%', maxWidth: 300, padding: '14px 20px', borderRadius: 16,
    background: 'var(--tint-heavy)', border: '2px solid rgba(192,132,252,0.3)',
    fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center',
    outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s ease',
  },
  typeInputCorrect: { border: '2px solid var(--correct-text)', background: 'rgba(16, 185, 129, 0.1)' },
  typeInputIncorrect: { border: '2px solid var(--incorrect-text)', background: 'rgba(244, 63, 94, 0.1)' },
  feedback: { textAlign: 'center', fontSize: '1rem', fontWeight: 800, padding: 12 },
  feedbackCorrectAnswer: {
    fontSize: '1.1rem', fontWeight: 900, color: 'var(--correct-text)',
    background: 'rgba(16,185,129,0.1)', padding: '2px 10px', borderRadius: 8,
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  feedbackCorrectRomaji: {
    fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic',
  },
  resultsWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', paddingBottom: 90 },
  resultsCard: { textAlign: 'center', padding: '32px 24px', maxWidth: 440, width: '100%' },
  resultsCardTablet: { maxWidth: 560, padding: '42px 34px' },
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
  encouragement: {
    fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500, fontStyle: 'italic',
    marginBottom: 20, lineHeight: 1.5,
  },
  mistakesSection: { marginBottom: 20, textAlign: 'left' },
  mistakesLabel: {
    fontSize: '0.82rem', fontWeight: 800, color: 'var(--incorrect-text)', textTransform: 'lowercase',
    marginBottom: 10, textAlign: 'center',
  },
  mistakeItem: {
    background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.12)',
    borderLeft: '3px solid var(--incorrect-text)', borderRadius: 10, padding: '10px 14px', marginBottom: 8,
  },
  mistakeVerbRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
  },
  mistakeVerb: {
    fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  mistakeRu: {
    fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
  },
  mistakeTeRow: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  mistakeArrow: { color: 'var(--text-light)', fontWeight: 600 },
  mistakeCorrect: {
    fontSize: '1rem', fontWeight: 900, color: 'var(--correct-text)',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  mistakeRomaji: {
    fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600, fontStyle: 'italic',
  },
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
