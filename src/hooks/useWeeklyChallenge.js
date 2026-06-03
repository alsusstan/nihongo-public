import { useState, useEffect, useCallback, useRef } from 'react'
import { getStoredJson, setStoredJson } from '../utils/localSettings'

const STORAGE_KEY = 'nihongo-weekly-challenge'

// Challenge types with targets
const CHALLENGE_POOL = [
  { type: 'quizzes', target: 10, title: 'quiz marathon', desc: 'complete 10 quizzes this week', icon: '🎯' },
  { type: 'quizzes', target: 15, title: 'quiz sprint', desc: 'complete 15 quizzes this week', icon: '🏃' },
  { type: 'perfect', target: 3, title: 'perfectionist', desc: 'get 3 perfect scores this week', icon: '💎' },
  { type: 'perfect', target: 5, title: 'diamond streak', desc: 'get 5 perfect scores this week', icon: '✨' },
  { type: 'xp', target: 200, title: 'XP hunter', desc: 'earn 200 XP this week', icon: '⚡' },
  { type: 'xp', target: 350, title: 'XP grinder', desc: 'earn 350 XP this week', icon: '🔥' },
  { type: 'days', target: 5, title: 'consistency king', desc: 'study 5 days this week', icon: '📅' },
  { type: 'days', target: 7, title: 'full week', desc: 'study every day this week', icon: '👑' },
  { type: 'variety', target: 4, title: 'explorer', desc: 'try 4 different quiz types this week', icon: '🗺️' },
  { type: 'variety', target: 6, title: 'all-rounder', desc: 'try 6 different quiz types this week', icon: '🌟' },
]

function getWeekNumber() {
  const d = new Date()
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const days = Math.floor((d - startOfYear) / (1000 * 60 * 60 * 24))
  return `${d.getFullYear()}-W${Math.ceil((days + startOfYear.getDay() + 1) / 7)}`
}

function getWeekChallenge(weekKey) {
  let hash = 0
  for (let i = 0; i < weekKey.length; i++) {
    hash = ((hash << 5) - hash) + weekKey.charCodeAt(i)
    hash |= 0
  }
  return CHALLENGE_POOL[Math.abs(hash) % CHALLENGE_POOL.length]
}

function loadData() {
  const parsed = getStoredJson(STORAGE_KEY, null)
  if (!parsed || typeof parsed !== 'object') return null
  const progress = Number(parsed.progress)
  const xpEarned = Number(parsed.xpEarned)
  return {
    ...parsed,
    progress: Number.isFinite(progress) ? Math.max(0, progress) : 0,
    completed: parsed.completed === true,
    claimed: parsed.claimed === true,
    quizTypes: Array.isArray(parsed.quizTypes) ? parsed.quizTypes : [],
    studyDays: Array.isArray(parsed.studyDays) ? parsed.studyDays : [],
    xpEarned: Number.isFinite(xpEarned) ? Math.max(0, xpEarned) : 0,
  }
}

export function useWeeklyChallenge() {
  const weekKey = getWeekNumber()
  const challenge = getWeekChallenge(weekKey)

  const [data, setData] = useState(() => {
    const saved = loadData()
    if (saved && saved.weekKey === weekKey) return saved
    return {
      weekKey,
      challenge,
      progress: 0,
      completed: false,
      claimed: false,
      quizTypes: [],
      studyDays: [],
      xpEarned: 0,
    }
  })

  useEffect(() => {
    // Preserve claimed:true set by another instance (Home.jsx vs App.jsx run concurrently)
    const existing = getStoredJson(STORAGE_KEY, null)
    const toSave = (existing && typeof existing === 'object' && !Array.isArray(existing) && existing.weekKey === data.weekKey && existing.claimed)
      ? { ...data, claimed: true }
      : data
    setStoredJson(STORAGE_KEY, toSave)
  }, [data])

  // reset if week changed
  useEffect(() => {
    if (data.weekKey !== weekKey) {
      setData({
        weekKey,
        challenge: getWeekChallenge(weekKey),
        progress: 0,
        completed: false,
        claimed: false,
        quizTypes: [],
        studyDays: [],
        xpEarned: 0,
      })
    }
  }, [weekKey, data.weekKey])

  const recordQuiz = useCallback((quizType, score, total, xpGained) => {
    setData(prev => {
      if (prev.weekKey !== weekKey) return prev

      const today = new Date().toDateString()
      const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0
      const safeTotal = Number.isFinite(Number(total)) ? Number(total) : 0
      const safeXP = Number.isFinite(Number(xpGained)) ? Math.max(0, Number(xpGained)) : 0
      const safeQuizType = typeof quizType === 'string' && quizType.trim() ? quizType : 'misc'
      const isPerfect = safeScore === safeTotal && safeTotal > 0
      const newQuizTypes = prev.quizTypes.includes(safeQuizType)
        ? prev.quizTypes
        : [...prev.quizTypes, safeQuizType]
      const newStudyDays = prev.studyDays.includes(today)
        ? prev.studyDays
        : [...prev.studyDays, today]
      const newXP = prev.xpEarned + safeXP

      let newProgress = prev.progress
      const ch = prev.challenge || challenge

      switch (ch.type) {
        case 'quizzes':
          newProgress = prev.progress + 1
          break
        case 'perfect':
          newProgress = isPerfect ? prev.progress + 1 : prev.progress
          break
        case 'xp':
          newProgress = newXP
          break
        case 'days':
          newProgress = newStudyDays.length
          break
        case 'variety':
          newProgress = newQuizTypes.length
          break
      }

      const completed = newProgress >= ch.target

      return {
        ...prev,
        progress: newProgress,
        completed,
        quizTypes: newQuizTypes,
        studyDays: newStudyDays,
        xpEarned: newXP,
      }
    })
  }, [weekKey, challenge])

  // Use ref to avoid stale closure in event listener
  const recordQuizRef = useRef(recordQuiz)
  recordQuizRef.current = recordQuiz

  // Auto-track quiz completions via global XP event
  useEffect(() => {
    const handler = (e) => {
      const { source, amount, isPerfect } = e.detail || {}
      if (source && Number.isFinite(amount) && amount > 0) {
        const quizType = source.replace(' quiz', '').replace('quiz', '').trim() || 'misc'
        recordQuizRef.current(quizType, isPerfect ? 1 : 0, 1, amount)
      }
    }
    window.addEventListener('nihongo-xp-earned', handler)
    return () => window.removeEventListener('nihongo-xp-earned', handler)
  }, [])

  const claimReward = useCallback(() => {
    setData(prev => ({ ...prev, claimed: true }))
    return 100
  }, [])

  const ch = data.challenge || challenge
  const progressPct = ch.target > 0 ? Math.min(data.progress / ch.target, 1) : 0

  // Days until week number changes
  const daysLeft = (() => {
    const now = new Date()
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      const soy = new Date(d.getFullYear(), 0, 1)
      const days = Math.floor((d - soy) / 864e5)
      const wk = `${d.getFullYear()}-W${Math.ceil((days + soy.getDay() + 1) / 7)}`
      if (wk !== weekKey) return i
    }
    return 7
  })()

  return {
    challenge: ch,
    progress: data.progress,
    target: ch.target,
    progressPct,
    completed: data.completed,
    claimed: data.claimed,
    daysLeft,
    recordQuiz,
    claimReward,
  }
}
