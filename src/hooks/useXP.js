import { useState, useCallback, useEffect, useRef } from 'react'
import { getStoredJson, setStoredJson } from '../utils/localSettings'

const STORAGE_KEY = 'nihongo-xp'

const LEVEL_THRESHOLDS = [
  0, 50, 120, 210, 320, 450, 600, 780, 1000, 1260,      // 1-10
  1560, 1900, 2300, 2760, 3280, 3860, 4500, 5200, 6000, 7000, // 11-20
  8200, 9600, 11200, 13000, 15000, 17500, 20500, 24000, 28000, 33000, // 21-30
]

const LEVEL_TITLES = {
  1: 'beginner',
  5: 'student',
  10: 'apprentice',
  15: 'learner',
  20: 'scholar',
  25: 'master',
  30: 'sensei',
}

function getLevelTitle(level) {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a)
  for (const threshold of keys) {
    if (level >= threshold) return LEVEL_TITLES[threshold]
  }
  return 'beginner'
}

const MAX_TABLE_LEVEL = LEVEL_THRESHOLDS.length // 30
const MAX_TABLE_XP = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] // 33000
const XP_PER_LEVEL_BEYOND = 5000

function getLevelForXP(xp) {
  // beyond the table: each 5000 XP = one level past 30
  if (xp >= MAX_TABLE_XP) {
    return MAX_TABLE_LEVEL + Math.floor((xp - MAX_TABLE_XP) / XP_PER_LEVEL_BEYOND)
  }
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function getXPForNextLevel(level) {
  if (level >= MAX_TABLE_LEVEL) {
    return MAX_TABLE_XP + (level - MAX_TABLE_LEVEL + 1) * XP_PER_LEVEL_BEYOND
  }
  return LEVEL_THRESHOLDS[level] // level is 1-indexed, threshold is 0-indexed
}

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sanitizeXPHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const amount = Number(entry.amount)
  const baseAmount = Number(entry.baseAmount)
  const combo = Number(entry.combo)
  const date = typeof entry.date === 'string' ? new Date(entry.date) : null
  if (!date || Number.isNaN(date.getTime())) return null
  return {
    ...entry,
    amount: Number.isFinite(amount) ? amount : 0,
    baseAmount: Number.isFinite(baseAmount) ? Math.max(0, baseAmount) : 0,
    combo: Number.isFinite(combo) ? Math.max(0, combo) : 0,
    date: entry.date,
    source: typeof entry.source === 'string' && entry.source.trim() ? entry.source : 'quiz',
    comeback: entry.comeback === true,
  }
}

function loadXPData() {
  const parsed = getStoredJson(STORAGE_KEY, null)
  if (!parsed || typeof parsed !== 'object') {
    return { totalXP: 0, history: [], comboDate: null, comboCount: 0, lastQuizDate: null }
  }
  return {
    totalXP: Number.isFinite(parsed.totalXP) ? Math.max(0, parsed.totalXP) : 0,
    history: Array.isArray(parsed.history)
      ? parsed.history.map(sanitizeXPHistoryEntry).filter(Boolean).slice(-300)
      : [],
    comboDate: typeof parsed.comboDate === 'string' ? parsed.comboDate : null,
    comboCount: Number.isFinite(parsed.comboCount) ? Math.max(0, parsed.comboCount) : 0,
    lastQuizDate: typeof parsed.lastQuizDate === 'string' ? parsed.lastQuizDate : null,
  }
}

/**
 * Get combo multiplier based on quizzes completed today
 */
function getComboMultiplier(count) {
  if (count >= 7) return 2.0
  if (count >= 5) return 1.75
  if (count >= 3) return 1.5
  return 1.0
}

/**
 * Check if user is returning after 2+ days away
 */
function isComeback(lastQuizDate) {
  if (!lastQuizDate) return false
  // lastQuizDate is a local date string "YYYY-MM-DD" — parse as local midnight
  // (new Date("YYYY-MM-DD") would parse as UTC, causing off-by-hours for non-UTC users)
  const [y, m, d] = lastQuizDate.split('-').map(Number)
  const last = new Date(y, m - 1, d)
  const now = new Date()
  const diffDays = (now - last) / (1000 * 60 * 60 * 24)
  return diffDays >= 2
}

/**
 * Hook for XP and leveling system.
 * XP is earned by completing quizzes, daily challenges, and other activities.
 */
export function useXP() {
  const [data, setData] = useState(loadXPData)
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])

  useEffect(() => {
    setStoredJson(STORAGE_KEY, data)
  }, [data])

  const level = getLevelForXP(data.totalXP)
  const title = getLevelTitle(level)
  const currentLevelXP = level > MAX_TABLE_LEVEL
    ? MAX_TABLE_XP + (level - MAX_TABLE_LEVEL) * XP_PER_LEVEL_BEYOND
    : (LEVEL_THRESHOLDS[level - 1] || 0)
  const nextLevelXP = getXPForNextLevel(level)
  const progressInLevel = data.totalXP - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP
  const levelProgress = xpNeededForLevel > 0 ? Math.min(progressInLevel / xpNeededForLevel, 1) : 1

  // combo info
  const today = getTodayStr()
  const todayCombo = data.comboDate === today ? data.comboCount : 0
  const comboMultiplier = getComboMultiplier(todayCombo)
  const comebackActive = isComeback(data.lastQuizDate)

  /**
   * Award XP for an action.
   * @param {number} amount - XP amount
   * @param {string} source - description (e.g., 'vocab quiz', 'daily challenge')
   * @returns {{ leveledUp: boolean, newLevel: number, xpGained: number, combo: number, comboMultiplier: number, comeback: boolean }}
   */
  const awardXP = useCallback((amount, source = 'quiz', isPerfect = false) => {
    const baseAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0
    if (baseAmount <= 0) {
      return {
        leveledUp: false,
        newLevel: getLevelForXP(dataRef.current.totalXP),
        xpGained: 0,
        baseXP: 0,
        combo: dataRef.current.comboCount || 0,
        comboMultiplier: getComboMultiplier(dataRef.current.comboCount || 0),
        comeback: false,
      }
    }
    // Use ref so this callback is stable (never changes reference)
    // This prevents infinite re-render loops in quiz useEffects that list awardXP as a dep
    const d = dataRef.current
    const todayKey = getTodayStr()
    const currentCombo = d.comboDate === todayKey ? d.comboCount + 1 : 1
    const mult = getComboMultiplier(currentCombo)
    const comeback = isComeback(d.lastQuizDate)
    const comebackMult = comeback ? 2.0 : 1.0
    const finalAmount = Math.round(baseAmount * mult * comebackMult)

    const oldLevel = getLevelForXP(d.totalXP)
    const newTotal = d.totalXP + finalAmount
    const newLevel = getLevelForXP(newTotal)

    setData(prev => ({
      totalXP: prev.totalXP + finalAmount,
      history: [
        ...prev.history.slice(-299),
        { amount: finalAmount, baseAmount, source, date: new Date().toISOString(), combo: currentCombo, comeback },
      ],
      comboDate: todayKey,
      comboCount: currentCombo,
      lastQuizDate: todayKey,
    }))
    // Update ref synchronously so rapid successive awardXP calls see the latest comboCount
    dataRef.current = { ...d, totalXP: d.totalXP + finalAmount, comboDate: todayKey, comboCount: currentCombo, lastQuizDate: todayKey }

    const leveledUp = newLevel > oldLevel
    window.dispatchEvent(new CustomEvent('nihongo-xp-earned', {
      detail: {
        amount: finalAmount,
        baseAmount,
        source,
        isPerfect,
        leveledUp,
        newLevel,
        combo: currentCombo,
        comboMultiplier: mult,
        comeback,
      },
    }))

    return {
      leveledUp,
      newLevel,
      xpGained: finalAmount,
      baseXP: baseAmount,
      combo: currentCombo,
      comboMultiplier: mult,
      comeback,
    }
  }, []) // stable — no deps needed, reads data via ref

  /**
   * Calculate XP for a quiz result.
   * Base: 5 XP per correct answer + bonus for high accuracy.
   */
  const calculateQuizXP = useCallback((score, total) => {
    const base = score * 5
    const pct = total > 0 ? score / total : 0
    let bonus = 0
    if (pct >= 1.0) bonus = 20       // perfect
    else if (pct >= 0.9) bonus = 10   // great
    else if (pct >= 0.8) bonus = 5    // good
    return base + bonus
  }, [])

  return {
    totalXP: data.totalXP,
    level,
    title,
    levelProgress,
    progressInLevel,
    xpNeededForLevel,
    currentLevelXP,
    nextLevelXP,
    awardXP,
    calculateQuizXP,
    history: data.history,
    comboCount: todayCombo,
    comboMultiplier,
    comebackActive,
  }
}
