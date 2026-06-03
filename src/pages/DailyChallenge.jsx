import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { kanji } from '../data/kanji'
import { strokeData } from '../data/strokeOrder'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { hiragana, katakana } from '../data/kana'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useWordTracker } from '../hooks/useWordTracker'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import { getStoredBkbUnlocked, getStoredJson, setStoredJson } from '../utils/localSettings'
import { getTrackedLessons } from '../utils/lessonProgress'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

const STORAGE_KEY = 'nihongo-daily-challenge'

// Particle sentences for Q7 — basic particles only (は, が, を, に, で, へ, と, も, の)
const particleBank = [
  { sentence: 'わたし＿＿マイク・ミラーです。', particle: 'は', russian: 'Я -- Майк Миллер.' },
  { sentence: 'きょう＿＿いい天気ですね。', particle: 'は', russian: 'Сегодня хорошая погода.' },
  { sentence: 'にほんご＿＿おもしろいです。', particle: 'は', russian: 'Японский язык интересный.' },
  { sentence: 'わたしはさかな＿＿すきです。', particle: 'が', russian: 'Я люблю рыбу.' },
  { sentence: 'だれ＿＿きましたか。', particle: 'が', russian: 'Кто пришёл?' },
  { sentence: 'あたま＿＿いたいです。', particle: 'が', russian: 'У меня болит голова.' },
  { sentence: 'まいにちコーヒー＿＿のみます。', particle: 'を', russian: 'Каждый день пью кофе.' },
  { sentence: 'てがみ＿＿かきます。', particle: 'を', russian: 'Пишу письмо.' },
  { sentence: 'にほんご＿＿べんきょうします。', particle: 'を', russian: 'Изучаю японский язык.' },
  { sentence: '7じ＿＿おきます。', particle: 'に', russian: 'Встаю в 7 часов.' },
  { sentence: 'がっこう＿＿いきます。', particle: 'に', russian: 'Иду в школу.' },
  { sentence: 'ともだち＿＿でんわをかけます。', particle: 'に', russian: 'Звоню другу.' },
  { sentence: 'としょかん＿＿べんきょうします。', particle: 'で', russian: 'Учусь в библиотеке.' },
  { sentence: 'はし＿＿たべます。', particle: 'で', russian: 'Ем палочками.' },
  { sentence: 'バス＿＿かいしゃへいきます。', particle: 'で', russian: 'Еду на работу на автобусе.' },
  { sentence: 'にほん＿＿いきたいです。', particle: 'へ', russian: 'Хочу поехать в Японию.' },
  { sentence: 'うち＿＿かえります。', particle: 'へ', russian: 'Возвращаюсь домой.' },
  { sentence: 'ともだち＿＿えいがをみました。', particle: 'と', russian: 'Смотрел фильм с другом.' },
  { sentence: 'パン＿＿たまごをたべます。', particle: 'と', russian: 'Ем хлеб и яйцо.' },
  { sentence: 'わたし＿＿にほんじんです。', particle: 'も', russian: 'Я тоже японец.' },
  { sentence: 'これはわたし＿＿かばんです。', particle: 'の', russian: 'Это моя сумка.' },
  { sentence: 'とうきょう＿＿ちずをください。', particle: 'の', russian: 'Дайте, пожалуйста, карту Токио.' },
  { sentence: 'まど＿＿あけてください。', particle: 'を', russian: 'Откройте окно, пожалуйста.' },
  { sentence: 'でんき＿＿けしてください。', particle: 'を', russian: 'Выключите свет, пожалуйста.' },
  { sentence: 'にちようび＿＿こうえんへいきました。', particle: 'に', russian: 'В воскресенье ходил в парк.' },
  { sentence: 'どようび＿＿ひまです。', particle: 'は', russian: 'В субботу я свободен.' },
  { sentence: 'いす＿＿すわってください。', particle: 'に', russian: 'Пожалуйста, садитесь на стул.' },
  { sentence: 'でんしゃ＿＿のりました。', particle: 'に', russian: 'Сел в поезд.' },
  { sentence: 'ここ＿＿たばこをすわないでください。', particle: 'で', russian: 'Пожалуйста, не курите здесь.' },
  { sentence: 'やまださん＿＿プレゼントをあげました。', particle: 'に', russian: 'Подарил Ямаде подарок.' },
]
const particleDistractors = { 'は': ['が', 'を', 'に'], 'が': ['は', 'を', 'で'], 'を': ['が', 'に', 'で'], 'に': ['は', 'を', 'で'], 'で': ['に', 'を', 'へ'], 'へ': ['に', 'で', 'を'], 'と': ['に', 'も', 'で'], 'も': ['は', 'が', 'に'], 'の': ['は', 'に', 'も'] }

// Te-form bank for Q8 — masu form → te-form + Russian meaning
const teFormBank = [
  { masu: '食べます', te: '食べて', russian: 'есть (кушать)', distractors: ['食べで', '食べって', '食べいて'], hint: 'Группа II: основа + て　(食べ → 食べて)' },
  { masu: '飲みます', te: '飲んで', russian: 'пить', distractors: ['飲んて', '飲みて', '飲いて'], hint: 'Группа I: み → んで　(飲み → 飲んで)' },
  { masu: '書きます', te: '書いて', russian: 'писать', distractors: ['書いで', '書きて', '書って'], hint: 'Группа I: き → いて　(書き → 書いて)' },
  { masu: '読みます', te: '読んで', russian: 'читать', distractors: ['読みて', '読んて', '読いて'], hint: 'Группа I: み → んで　(読み → 読んで)' },
  { masu: '聞きます', te: '聞いて', russian: 'слушать', distractors: ['聞いで', '聞きて', '聞んで'], hint: 'Группа I: き → いて　(聞き → 聞いて)' },
  { masu: '見ます', te: '見て', russian: 'смотреть', distractors: ['見んで', '見って', '見いて'], hint: 'Группа II: основа + て　(見 → 見て)' },
  { masu: '話します', te: '話して', russian: 'разговаривать', distractors: ['話しんで', '話いて', '話って'], hint: 'Группа I: し → して　(話し → 話して)' },
  { masu: '待ちます', te: '待って', russian: 'ждать', distractors: ['待ちて', '待いて', '待んで'], hint: 'Группа I: ち → って　(待ち → 待って)' },
  { masu: '帰ります', te: '帰って', russian: 'возвращаться', distractors: ['帰りて', '帰いて', '帰んで'], hint: 'Группа I: り → って　(帰り → 帰って)' },
  { masu: '買います', te: '買って', russian: 'покупать', distractors: ['買いて', '買んで', '買いで'], hint: 'Группа I: い → って　(買い → 買って)' },
  { masu: '起きます', te: '起きて', russian: 'вставать', distractors: ['起きって', '起いて', '起んで'], hint: 'Группа II: основа + て　(起き → 起きて)' },
  { masu: '寝ます', te: '寝て', russian: 'спать', distractors: ['寝んで', '寝って', '寝いて'], hint: 'Группа II: основа + て　(寝 → 寝て)' },
  { masu: '行きます', te: '行って', russian: 'идти', distractors: ['行いて', '行きて', '行んで'], hint: 'Группа I (исключение!): 行き → 行って (обычно き→いて, но 行く — особый случай)' },
  { masu: 'します', te: 'して', russian: 'делать', distractors: ['しんで', 'していて', 'しって'], hint: 'Группа III (неправильный): します → して' },
  { masu: '洗います', te: '洗って', russian: 'мыть', distractors: ['洗いて', '洗んで', '洗いで'], hint: 'Группа I: い → って　(洗い → 洗って)' },
  { masu: '開けます', te: '開けて', russian: 'открывать', distractors: ['開けって', '開けんで', '開けいて'], hint: 'Группа II: основа + て　(開け → 開けて)' },
  { masu: '閉めます', te: '閉めて', russian: 'закрывать', distractors: ['閉めって', '閉めんで', '閉いて'], hint: 'Группа II: основа + て　(閉め → 閉めて)' },
  { masu: '使います', te: '使って', russian: 'использовать', distractors: ['使いて', '使んで', '使いで'], hint: 'Группа I: い → って　(使い → 使って)' },
  { masu: '出します', te: '出して', russian: 'вынимать', distractors: ['出しんで', '出いて', '出って'], hint: 'Группа I: し → して　(出し → 出して)' },
  { masu: '来ます', te: '来て', russian: 'приходить', distractors: ['来って', '来んで', '来いて'], hint: 'Группа III (неправильный): 来ます → 来て' },
  { masu: 'つけます', te: 'つけて', russian: 'включать', distractors: ['つけって', 'つけんで', 'つけいて'], hint: 'Группа II: основа + て　(つけ → つけて)' },
  { masu: '消します', te: '消して', russian: 'выключать', distractors: ['消しんで', '消いて', '消って'], hint: 'Группа I: し → して　(消し → 消して)' },
  { masu: '急ぎます', te: '急いで', russian: 'спешить', distractors: ['急ぎて', '急いて', '急って'], hint: 'Группа I: ぎ → いで　(急ぎ → 急いで)' },
  { masu: '持ちます', te: '持って', russian: 'держать', distractors: ['持ちて', '持いて', '持んで'], hint: 'Группа I: ち → って　(持ち → 持って)' },
  { masu: '取ります', te: '取って', russian: 'брать', distractors: ['取りて', '取いて', '取んで'], hint: 'Группа I: り → って　(取り → 取って)' },
  { masu: '呼びます', te: '呼んで', russian: 'звать', distractors: ['呼んて', '呼びて', '呼いて'], hint: 'Группа I: び → んで　(呼び → 呼んで)' },
  { masu: '見せます', te: '見せて', russian: 'показывать', distractors: ['見せって', '見せんで', '見せいて'], hint: 'Группа II: основа + て　(見せ → 見せて)' },
  { masu: '座ります', te: '座って', russian: 'садиться', distractors: ['座りて', '座いて', '座んで'], hint: 'Группа I: り → って　(座り → 座って)' },
  { masu: '入ります', te: '入って', russian: 'входить', distractors: ['入りて', '入いて', '入んで'], hint: 'Группа I: り → って　(入り → 入って)' },
  { masu: '出ます', te: '出て', russian: 'выходить', distractors: ['出って', '出んで', '出いて'], hint: 'Группа II: основа + て　(出 → 出て)' },
  { masu: '泳ぎます', te: '泳いで', russian: 'плавать', distractors: ['泳ぎて', '泳いて', '泳って'], hint: 'Группа I: ぎ → いで　(泳ぎ → 泳いで)' },
  { masu: '歌います', te: '歌って', russian: 'петь', distractors: ['歌いて', '歌んで', '歌いで'], hint: 'Группа I: い → って　(歌い → 歌って)' },
]

function getTodaySeed() {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function seededShuffle(arr, rand) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildUniqueOptions(answer, candidates, rand) {
  const seen = new Set([answer])
  const distractors = []

  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue
    seen.add(candidate)
    distractors.push(candidate)
    if (distractors.length >= 3) break
  }

  return seededShuffle([answer, ...distractors], rand)
}

function loadChallengeState() {
  const parsed = getStoredJson(STORAGE_KEY, null)
  if (!parsed || typeof parsed !== 'object') return null
  return {
    ...parsed,
    completed: parsed.completed === true,
    completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
    lastScore: Number.isFinite(parsed.lastScore) ? parsed.lastScore : 0,
  }
}

function saveChallengeState(state) {
  setStoredJson(STORAGE_KEY, state)
}

function getBkbUnlocked() {
  return getStoredBkbUnlocked()
}

const stripBrackets = (s) => (s || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()
const displayJp = (w) => stripBrackets(w.kanji || w.japanese)

function generateQuestions(seed, lessonPool) {
  const rand = seededRandom(seed)
  const questions = []
  const bkbUnlocked = getBkbUnlocked()
  const unlockedKanji = kanji.filter(k => (k.lesson || 1) <= bkbUnlocked)

  // get all vocab
  const allVocab = lessonPool.flatMap(l => l.vocabulary)
  const allKana = [
    ...hiragana.basic.map(k => ({ ...k, type: 'hiragana' })),
    ...katakana.basic.map(k => ({ ...k, type: 'katakana' })),
  ]

  // Q1: Vocab → Russian (what does X mean?)
  if (allVocab.length >= 4) {
    const shuffled = seededShuffle(allVocab, rand)
    const correct = shuffled[0]
    const options = buildUniqueOptions(correct.russian, shuffled.slice(1).map(w => w.russian), rand)
    questions.push({
      type: 'vocab',
      prompt: displayJp(correct),
      wordKey: correct.japanese,
      promptSub: (correct.romaji || '').replace(/\s*\[.*?\]/g, '').trim(),
      question: 'что значит это слово?',
      answer: correct.russian,
      options,
      icon: '✨',
      lessonId: correct.lesson,
      word: correct,
    })
  }

  // Q2: Kana → Romaji
  if (allKana.length >= 4) {
    const shuffled = seededShuffle(allKana, rand)
    const correct = shuffled[0]
    const options = buildUniqueOptions(correct.romaji, shuffled.slice(1).map(k => k.romaji), rand)
    questions.push({
      type: 'kana',
      prompt: correct.kana,
      promptSub: correct.type,
      question: 'как читается?',
      answer: correct.romaji,
      options,
      icon: 'あ',
    })
  }

  // Q3: Russian → Japanese (translate to Japanese)
  if (allVocab.length >= 4) {
    const shuffled = seededShuffle(allVocab.filter(w => w.japanese !== questions[0]?.wordKey), rand)
    const correct = shuffled[0]
    const answer = displayJp(correct)
    const options = buildUniqueOptions(answer, shuffled.slice(1).map(w => displayJp(w)), rand)
    questions.push({
      type: 'vocab-reverse',
      prompt: correct.russian,
      promptSub: (correct.romaji || '').replace(/\s*\[.*?\]/g, '').trim(),
      question: 'как по-японски?',
      answer,
      wordKey: correct.japanese,
      options,
      icon: '🇯🇵',
      lessonId: correct.lesson,
      word: correct,
    })
  }

  // Q4: Kanji → Meaning (only unlocked BKB lessons)
  if (unlockedKanji.length >= 4) {
    const shuffled = seededShuffle(unlockedKanji, rand)
    const correct = shuffled[0]
    const options = buildUniqueOptions(correct.meaning, shuffled.slice(1).map(k => k.meaning), rand)
    questions.push({
      type: 'kanji',
      prompt: correct.kanji,
      promptSub: `${correct.kun || ''} / ${correct.on || ''}`,
      question: 'что значит этот кандзи?',
      answer: correct.meaning,
      options,
      icon: '漢',
      kanjiLesson: correct.lesson,
      kanjiChar: correct.kanji,
    })
  }

  // Q5: Vocab Romaji → Japanese
  if (allVocab.length >= 4) {
    const usedJp = questions.map(q => q.answer).concat(questions.map(q => q.wordKey || q.prompt))
    const available = allVocab.filter(w => !usedJp.includes(w.japanese))
    const shuffled = seededShuffle(available.length >= 4 ? available : allVocab, rand)
    const correct = shuffled[0]
    const stripRm = s => (s || '').replace(/\s*\[.*?\]/g, '').trim()
    const correctRm = stripRm(correct.romaji)
    const options = buildUniqueOptions(correctRm, shuffled.slice(1).map(w => stripRm(w.romaji)), rand)
    questions.push({
      type: 'reading',
      prompt: displayJp(correct),
      wordKey: correct.japanese,
      promptSub: correct.russian,
      question: 'как читается?',
      answer: correctRm,
      options,
      icon: '📖',
      lessonId: correct.lesson,
      word: correct,
    })
  }

  // Q6: Grammar pattern — show example sentence, pick the correct meaning
  const allGrammar = lessonPool.flatMap(l => (l.grammar || []).map(g => ({ ...g, lessonId: l.id }))).filter(g => g.meaning && g.examples && g.examples.length > 0)
  if (allGrammar.length >= 4) {
    const shuffled = seededShuffle(allGrammar, rand)
    const correct = shuffled[0]
    const example = correct.examples[0]
    const distractors = shuffled
      .filter(g => g.meaning !== correct.meaning)
      .map(g => g.meaning)
      .filter((m, i, arr) => arr.indexOf(m) === i)
      .slice(0, 3)
    const options = seededShuffle([correct.meaning, ...distractors], rand)
    questions.push({
      type: 'grammar',
      prompt: example.jp,
      promptSub: example.romaji || '',
      question: 'что значит эта конструкция?',
      answer: correct.meaning,
      options,
      icon: '文',
      lessonId: correct.lessonId,
    })
  }

  // Q7: Particle fill-in
  if (particleBank.length >= 4) {
    const shuffled = seededShuffle(particleBank, rand)
    const correct = shuffled[0]
    const options = buildUniqueOptions(correct.particle, particleDistractors[correct.particle] || ['は', 'が', 'を'], rand)
    questions.push({
      type: 'particle',
      prompt: correct.sentence,
      promptSub: correct.russian,
      question: 'выбери правильную частицу:',
      answer: correct.particle,
      options,
      icon: '助',
    })
  }

  // Q8: Te-form — show verb in masu form, choose correct te-form
  if (teFormBank.length >= 4) {
    const shuffled = seededShuffle(teFormBank, rand)
    const correct = shuffled[0]
    const options = buildUniqueOptions(correct.te, correct.distractors, rand)
    questions.push({
      type: 'te-form',
      prompt: correct.masu,
      promptSub: correct.russian,
      question: 'て-форма:',
      answer: correct.te,
      options,
      icon: 'て',
      teHint: correct.hint || '',
    })
  }

  return questions
}

function getStreak() {
  const data = getStoredJson(STORAGE_KEY, null)
  if (!data?.completedDays || !Array.isArray(data.completedDays)) return 0

  const daySet = new Set(data.completedDays)
  const today = getTodaySeed()
  let streak = 0
  // iterate up to 400 days back; today-not-completed is skipped via continue
  for (let i = 0; i <= 400; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const expected = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
    if (daySet.has(expected)) {
      streak++
    } else if (expected === today) {
      continue // today not yet completed, still check yesterday
    } else {
      break
    }
  }
  return streak
}

const reactions = [
  { min: 100, emoji: '🎉', text: 'perfect!', textJp: 'かんぺき！', color: 'var(--correct-text)' },
  { min: 80, emoji: '🌟', text: 'great job!', textJp: 'すごい！', color: 'var(--text-light)' },
  { min: 60, emoji: '😊', text: 'nice try!', textJp: 'いいね！', color: '#f472b6' },
  { min: 40, emoji: '💪', text: 'keep going!', textJp: 'がんばって！', color: 'var(--gold-text)' },
  { min: 0, emoji: '📚', text: 'study more!', textJp: 'もっと べんきょう！', color: 'var(--incorrect-text)' },
]

export default function DailyChallenge() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { awardXP, calculateQuizXP } = useXP()
  const { saveQuizResult } = useProgress()
  const { recordMiss, recordHit } = useWordTracker()
  const { unlockedLessons } = useUnlockedLessons()
  const seed = useMemo(() => getTodaySeed(), [])
  const generatedQs = useMemo(() => generateQuestions(seed, unlockedLessons), [seed, unlockedLessons])
  const [questions, setQuestions] = useState(generatedQs)
  const isRetryRef = useRef(false)

  // Sync questions when generated questions change (e.g. lessons unlocked), but not during retry
  useEffect(() => {
    if (!isRetryRef.current) setQuestions(generatedQs)
  }, [generatedQs])

  const saved = useMemo(() => loadChallengeState(), [])
  const todayCompleted = saved?.lastSeed === seed && saved?.completed

  const [phase, setPhase] = useState(todayCompleted ? 'done' : 'intro')
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(todayCompleted ? (saved?.lastScore || 0) : 0)
  const [selected, setSelected] = useState(null)
  const [shake, setShake] = useState(false)
  const [mistakes, setMistakes] = useState([])
  const [showHint, setShowHint] = useState(false)
  const [bestStreak, setBestStreak] = useState(0)
  const timerRef = useRef(null)
  const shakeTimerRef = useRef(null)
  const quizStreakRef = useRef(0)
  const pendingAdvanceRef = useRef(null)
  useEffect(() => () => clearTimeout(shakeTimerRef.current), [])

  const handleAnswer = useCallback((option) => {
    if (selected !== null) return
    const q = questions[current]
    const isCorrect = option === q.answer

    setSelected(option)
    if (isCorrect) {
      setScore(prev => prev + 1)
      quizStreakRef.current += 1
      setBestStreak(b => Math.max(b, quizStreakRef.current))
      if (q.word) recordHit(q.word)
    } else {
      quizStreakRef.current = 0
      setShake(true)
      setMistakes(prev => [...prev, { question: q, chosen: option }])
      clearTimeout(shakeTimerRef.current)
      shakeTimerRef.current = setTimeout(() => setShake(false), 500)
      if (q.word) recordMiss(q.word, 'daily')
    }

    // Store the advance function so user can tap to skip the wrong-answer delay
    const finalScore = isCorrect ? score + 1 : score
    const doAdvance = () => {
      pendingAdvanceRef.current = null
      if (current + 1 < questions.length) {
        setCurrent(prev => prev + 1)
        setSelected(null)
        setShowHint(false)
      } else {
        setPhase('results')
        if (!isRetryRef.current) {
          const state = loadChallengeState() || { completedDays: [] }
          saveChallengeState({
            ...state,
            lastSeed: seed,
            lastScore: finalScore,
            completed: true,
            completedDays: [...new Set([...(state.completedDays || []), seed])],
          })
          saveQuizResult('vocab', {
            lessons: getTrackedLessons(questions, q => q.lessonId),
            score: finalScore,
            total: questions.length,
          })
          const xp = calculateQuizXP(finalScore, questions.length) + 10
          if (xp > 0) awardXP(xp, 'daily challenge', finalScore === questions.length && questions.length > 0)
        }
      }
    }
    pendingAdvanceRef.current = doAdvance
    timerRef.current = setTimeout(doAdvance, isCorrect ? 1000 : 3000)
  }, [selected, current, questions, score, seed, saveQuizResult, awardXP, calculateQuizXP, recordMiss, recordHit])

  const skipWrongDelay = useCallback(() => {
    if (pendingAdvanceRef.current && selected !== null) {
      clearTimeout(timerRef.current)
      pendingAdvanceRef.current()
    }
  }, [selected])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const startMistakesQuiz = () => {
    if (mistakes.length === 0) return
    isRetryRef.current = true
    const rand = seededRandom(Date.now() % 2147483647)
    setQuestions(seededShuffle(mistakes.map(m => m.question), rand))
    setCurrent(0)
    setScore(0)
    setMistakes([])
    setSelected(null)
    setShowHint(false)
    quizStreakRef.current = 0
    setBestStreak(0)
    setPhase('quiz')
  }

  // Keyboard shortcuts: 1-4 to select answer; Enter/Space to advance after wrong answer
  useEffect(() => {
    if (phase !== 'quiz') return
    const q = questions[current]
    if (!q) return
    const handler = (e) => {
      if (selected !== null) {
        // wrong answer: Enter/Space skips the delay
        if ((e.key === 'Enter' || e.key === ' ') && selected !== q.answer) {
          e.preventDefault()
          skipWrongDelay()
        }
        return
      }
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 4 && q.options[num - 1]) {
        handleAnswer(q.options[num - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, selected, questions, current, handleAnswer, skipWrongDelay])

  // scroll to top when results phase begins
  useEffect(() => {
    if (phase === 'results') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const reaction = reactions.find(r => percentage >= r.min) || reactions[reactions.length - 1]
  const streak = getStreak()

  const today = new Date()
  const dateStr = `${today.getDate()}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="page">
        <div className="animate-fadeInUp" style={{ textAlign: 'center', paddingTop: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🌅</div>
          <h1 style={s.title}>daily challenge</h1>
          <p style={s.titleJp}>きょうの ちゃれんじ</p>
          <p style={s.date}>{dateStr}</p>

          <div className="glass" style={{ ...s.infoCard, ...(isTablet ? s.infoCardTablet : {}) }}>
            <div style={s.infoRow}>
              <span style={s.infoIcon}>❓</span>
              <span style={s.infoText}>{questions.length} mixed questions</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoIcon}>📝</span>
              <span style={s.infoText}>vocab, kana, kanji mix</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoIcon}>🔥</span>
              <span style={s.infoText}>current streak: {streak} {streak === 1 ? 'day' : 'days'}</span>
            </div>
          </div>

          <button className="btn btn-cute" onClick={() => setPhase('quiz')} style={{ marginTop: 20 }}>
            start challenge 🚀
          </button>

          <div style={{ marginTop: 16 }}>
            <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              home 🏠
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Already completed today
  if (phase === 'done') {
    return (
      <div className="page">
        <div className="animate-fadeInUp" style={{ textAlign: 'center', paddingTop: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>✅</div>
          <h1 style={s.title}>challenge complete!</h1>
          <p style={s.titleJp}>きょうの ちゃれんじ おわり！</p>

          <div className="glass" style={{ ...s.doneCard, ...(isTablet ? s.doneCardTablet : {}) }}>
            <div style={s.doneScore}>{saved?.lastScore || 0}/{questions.length}</div>
            <p style={s.doneText}>you already completed today's challenge</p>
            <p style={s.doneStreak}>🔥 streak: {streak} {streak === 1 ? 'day' : 'days'}</p>
            <p style={s.doneHint}>come back tomorrow for a new challenge!</p>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <Link to="/quiz/vocab" className="btn btn-cute">vocab quiz 📝</Link>
            <Link to="/quiz/grammar" className="btn btn-secondary">grammar 文</Link>
            <Link to="/" className="btn btn-secondary">home 🏠</Link>
          </div>
        </div>
      </div>
    )
  }

  // Quiz phase
  if (phase === 'quiz') {
    const q = questions[current]
    if (!q) return null

    return (
      <div className="page">
        {/* progress bar */}
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${((current + 1) / questions.length) * 100}%` }} className="progress-fill" />
          </div>
          <div style={{ ...s.progressText, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }} aria-label="exit quiz">✕</Link>
            <span role="status" aria-live="polite">{current + 1}/{questions.length} | score: {score}</span>
          </div>
        </div>

        {/* question card */}
        <div
          className="glass animate-fadeInUp"
          style={{ ...s.questionCard, animation: (!prefersReducedMotion && shake) ? 'shake 0.5s ease' : undefined }}
        >
          <div style={s.questionIcon}>{q.icon}</div>
          <div style={{ ...s.questionPrompt, fontSize: q.type === 'particle' ? (isMobile ? '1.1rem' : '1.3rem') : (isMobile ? '1.6rem' : '2rem'), lineHeight: (q.type === 'particle' || q.type === 'te-form') ? 1.5 : 1.2 }}>{q.prompt}</div>
          {q.type === 'kanji' && strokeData[q.prompt]?.strokes && (
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(192,132,252,0.12)', padding: '2px 8px', borderRadius: 50, marginBottom: 4, display: 'inline-block' }}>
              {strokeData[q.prompt].strokes}画
            </span>
          )}
          {(q.type === 'kanji' || q.type === 'vocab-reverse' || q.type === 'vocab') ? (
            showHint
              ? <div style={s.questionSub}>{q.promptSub}</div>
              : <button onClick={() => setShowHint(true)} className="btn-hover" style={s.hintBtn}>
                  {q.type === 'kanji' ? '💡 показать чтение' : '💡 показать чтение'}
                </button>
          ) : (
            q.promptSub && <div style={s.questionSub}>{q.promptSub}</div>
          )}
          <div style={s.questionText}>{q.question}</div>
        </div>

        {/* options */}
        {selected === null && (
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <span style={s.keyHintChip}>⌨ 1–4</span>
          </div>
        )}
        <div key={`daily-options-${current}`} style={{ ...s.optionsGrid, gridTemplateColumns: (q.type === 'particle' || q.type === 'te-form' || !isMobile) ? '1fr 1fr' : '1fr', marginBottom: selected !== null && selected !== q.answer ? 10 : 90 }}>
          {q.options.map((opt, i) => {
            const isCorrect = opt === q.answer
            const isSelected = opt === selected
            let bg = 'var(--glass-bg)'
            let borderVal = 'rgba(192,132,252,0.2)'
            let opacity = 1
            let boxShadow = undefined
            if (selected !== null) {
              if (isCorrect) {
                bg = 'rgba(16, 185, 129, 0.18)'
                borderVal = 'var(--correct-text)'
                boxShadow = '0 0 0 2px var(--correct-text), 0 4px 16px rgba(16,185,129,0.25)'
              } else if (isSelected) {
                bg = 'rgba(244, 63, 94, 0.15)'
                borderVal = 'var(--incorrect-text)'
                boxShadow = '0 0 0 2px var(--incorrect-text)'
              } else {
                opacity = 0.4
              }
            }
            return (
              <button
                key={`${current}-${opt}`}
                onClick={() => handleAnswer(opt)}
                disabled={selected !== null}
                className="quiz-option glass-sm"
                style={{
                  ...s.option,
                  background: bg,
                  border: `2px solid ${borderVal}`,
                  opacity,
                  ...(boxShadow ? { boxShadow } : {}),
                  ...(!prefersReducedMotion && selected === null ? { animationDelay: `${i * 0.06}s` } : { animation: 'none' }),
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {/* wrong-answer feedback — tap to advance */}
        {selected !== null && selected !== q.answer && (
          <div
            className="animate-pop"
            onClick={skipWrongDelay}
            role="button"
            tabIndex={0}
            aria-label="continue to next question"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipWrongDelay() } }}
            style={{
              marginBottom: 90, padding: '14px 18px', borderRadius: 16,
              background: 'rgba(244,63,94,0.08)',
              border: '1.5px solid rgba(244,63,94,0.2)',
              textAlign: 'center', cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--incorrect-text)', marginBottom: 4 }}>
              ✗ правильный ответ: <span style={{ color: 'var(--text-main)' }}>{q.answer}</span>
            </div>
            {q.teHint && (
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '4px 0 6px', background: 'rgba(168,85,247,0.08)', padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                {q.teHint}
              </div>
            )}
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)' }}>
              нажми чтобы продолжить →
            </div>
          </div>
        )}
      </div>
    )
  }

  // Results phase
  return (
    <div className="page">
      <div className="animate-fadeInUp" style={{ textAlign: 'center', paddingTop: 20 }}>
        {percentage >= 90 && <Confetti trigger={true} />}

        <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>{reaction.emoji}</div>
        <h2 style={s.resultsTitle}>{reaction.textJp}</h2>
        <p style={{ ...s.resultsSubtitle, color: reaction.color }}>{reaction.text}</p>

        <div style={s.scoreCircle} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
          <div style={s.scoreInner}>
            <span style={s.scoreBig}>{percentage}%</span>
            <span style={s.scoreSmall}>{score}/{questions.length}</span>
          </div>
        </div>

        {!isRetryRef.current && (
          <div style={s.xpBadge} className="animate-pop">
            <span style={s.xpIcon}>⚡</span>
            <span style={s.xpAmount}>+{calculateQuizXP(score, questions.length) + 10} XP</span>
          </div>
        )}

        {streak > 0 && (
          <div className="glass-sm" style={s.streakBadge}>
            🔥 {streak} day streak!
          </div>
        )}

        {/* mistakes */}
        {mistakes.length > 0 && (
          <div className="glass" style={{ ...s.mistakesCard, ...(isTablet ? s.mistakesCardTablet : {}) }}>
            <div style={s.mistakesTitle}>review ({mistakes.length})</div>
            {mistakes.map((m, i) => (
              <div key={(m.question.prompt || '') + i} style={s.mistakeRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {m.question.icon && <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{m.question.icon}</span>}
                  <div style={s.mistakePrompt}>{m.question.prompt}</div>
                </div>
                <div style={s.mistakeCorrect}>✓ {m.question.answer}</div>
                <div style={s.mistakeWrong}>✗ {m.chosen}</div>
                {m.question.lessonId && (
                  <Link to={`/lessons/${m.question.lessonId}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                    lesson {m.question.lessonId} →
                  </Link>
                )}
                {m.question.kanjiLesson && (
                  <Link to={m.question.kanjiChar ? `/kanji?kanji=${encodeURIComponent(m.question.kanjiChar)}` : `/kanji?lesson=${m.question.kanjiLesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none' }}>
                    {m.question.kanjiChar ? `${m.question.kanjiChar} →` : `BKB L${m.question.kanjiLesson} →`}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, marginBottom: 90, flexWrap: 'wrap' }}>
          {mistakes.length > 0 && (
            <button className="btn btn-cute" onClick={startMistakesQuiz} style={{ fontSize: '0.85rem' }}>
              retry mistakes ({mistakes.length} qs) 🎯
            </button>
          )}
          <Link to="/" className="btn btn-cute">home 🏠</Link>
          <ShareResult quizName="daily challenge" score={score} total={questions.length} percentage={percentage} bestStreak={bestStreak} xpEarned={isRetryRef.current ? 0 : calculateQuizXP(score, questions.length) + 10} />
          <Link to="/quiz/vocab" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            more quizzes ✨
          </Link>
        </div>
      </div>
    </div>
  )
}

const s = {
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)',
    textTransform: 'lowercase', marginBottom: 4,
  },
  titleJp: {
    fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 4,
  },
  date: {
    fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 20,
  },
  infoCard: {
    padding: 20, textAlign: 'left', maxWidth: 300, margin: '0 auto',
    background: 'var(--glass-bg)',
    border: '1.5px solid rgba(192, 132, 252, 0.2)',
  },
  infoCardTablet: {
    maxWidth: 420,
    padding: 28,
  },
  infoRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
  },
  infoIcon: { fontSize: '1.1rem' },
  infoText: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' },
  doneCard: {
    padding: 24, textAlign: 'center', maxWidth: 300, margin: '20px auto 0',
  },
  doneCardTablet: {
    maxWidth: 420,
    padding: 34,
  },
  doneScore: {
    fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 8,
  },
  doneText: {
    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6,
  },
  doneStreak: {
    fontSize: '0.9rem', fontWeight: 700, color: '#f472b6', marginBottom: 6,
  },
  doneHint: {
    fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-light)', fontStyle: 'italic',
  },
  progressWrap: { marginBottom: 20 },
  progressTrack: {
    height: 6, borderRadius: 50, background: 'var(--tint-light)', overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%', borderRadius: 50,
    background: 'linear-gradient(90deg, #f472b6, #c084fc)',
    transition: 'width 0.5s ease',
  },
  progressText: {
    fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)', textAlign: 'center',
  },
  questionCard: {
    padding: 28, textAlign: 'center', marginBottom: 16,
    background: 'var(--glass-bg)',
    border: '1.5px solid rgba(192, 132, 252, 0.2)',
  },
  questionIcon: { fontSize: '1.5rem', marginBottom: 8 },
  questionPrompt: {
    fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4,
  },
  questionSub: {
    fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 8,
  },
  questionText: {
    fontSize: '1rem', fontWeight: 700, color: 'var(--text-light)',
  },
  hintBtn: {
    padding: '5px 14px', borderRadius: 20, border: '1.5px solid rgba(192,132,252,0.4)',
    background: 'var(--tint)', color: 'var(--text-light)', fontSize: '0.82rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6, minHeight: 44,
    display: 'inline-flex', alignItems: 'center',
  },
  optionsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
  },
  option: {
    padding: '18px 14px', borderRadius: 14, fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-main)', border: '1.5px solid', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.2s',
    animation: prefersReducedMotion ? undefined : 'fadeInUp 0.3s ease forwards',
    background: 'var(--tint)',
    minHeight: 60, textAlign: 'center',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  resultsTitle: {
    fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 2,
  },
  resultsSubtitle: {
    fontSize: '0.9rem', fontWeight: 700, marginBottom: 16,
  },
  scoreCircle: {
    width: 110, height: 110, borderRadius: '50%', margin: '0 auto 16px',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(236, 72, 153, 0.3)',
  },
  scoreInner: {
    width: 90, height: 90, borderRadius: '50%',
    background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  scoreBig: { fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' },
  scoreSmall: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)' },
  streakBadge: {
    display: 'inline-block', padding: '8px 20px', borderRadius: 50,
    fontSize: '0.85rem', fontWeight: 700, color: '#f472b6', marginBottom: 16,
  },
  mistakesCard: {
    padding: 16, textAlign: 'left', marginTop: 16, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto',
  },
  mistakesCardTablet: {
    maxWidth: 560,
    padding: 24,
  },
  mistakesTitle: {
    fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)',
    textTransform: 'lowercase', marginBottom: 10, textAlign: 'center',
  },
  mistakeRow: {
    padding: '8px 0', borderBottom: '1px solid rgba(192,132,252,0.15)',
  },
  mistakePrompt: {
    fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 2,
  },
  mistakeCorrect: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--correct-text)',
  },
  mistakeWrong: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--incorrect-text)',
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
  keyHintChip: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 50,
    background: 'rgba(168,85,247,0.08)', color: 'var(--text-light)',
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.02em',
  },
}
