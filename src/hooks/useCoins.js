import { useState, useEffect, useCallback, useRef } from 'react'
import { getStoredJson, getStoredNonNegativeInt, setStoredJson, setStoredString } from '../utils/localSettings'

const COINS_KEY = 'nihongo-coins'
const FREEZES_KEY = 'nihongo-freeze-count'
const FREEZE_DATES_KEY = 'nihongo-freeze-dates'

export const FREEZE_COST = 80
export const MAX_FREEZES = 3

function sanitizeCoinHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const amount = Number(entry.amount)
  const date = typeof entry.date === 'string' ? new Date(entry.date) : null
  if (!date || Number.isNaN(date.getTime())) return null
  return {
    ...entry,
    amount: Number.isFinite(amount) ? amount : 0,
    source: typeof entry.source === 'string' && entry.source.trim() ? entry.source : 'activity',
    date: entry.date,
  }
}

function loadCoins() {
  const p = getStoredJson(COINS_KEY, null)
  if (!p || typeof p !== 'object') return { total: 0, history: [] }
  return {
    total: Number.isFinite(p.total) ? Math.max(0, p.total) : 0,
    history: Array.isArray(p.history)
      ? p.history.map(sanitizeCoinHistoryEntry).filter(Boolean).slice(-50)
      : [],
  }
}

function loadFreezes() {
  return getStoredNonNegativeInt(FREEZES_KEY, 0)
}

function sanitizeDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null
  return value
}

function sanitizeFreezeDates(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(sanitizeDateKey).filter(Boolean))].slice(-400)
}

function loadFreezeDates() {
  const parsed = getStoredJson(FREEZE_DATES_KEY, [])
  return sanitizeFreezeDates(parsed)
}

export function getDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Hook for the sakura coin economy.
 * Coins are earned automatically when XP is awarded (via nihongo-xp-earned events).
 * Coins can be spent on streak freezes.
 */
export function useCoins() {
  const [data, setData] = useState(loadCoins)
  const [freezes, setFreezes] = useState(loadFreezes)
  const [freezeDates, setFreezeDates] = useState(loadFreezeDates)

  // Refs for stable callbacks
  const earnRef = useRef(null)
  const freezesRef = useRef(freezes)
  const dataRef = useRef(data)
  useEffect(() => { freezesRef.current = freezes }, [freezes])
  useEffect(() => { dataRef.current = data }, [data])
  earnRef.current = (amount, source) => {
    setData(prev => ({
      total: prev.total + amount,
      history: [...prev.history.slice(-49), { amount, source, date: new Date().toISOString() }],
    }))
    window.dispatchEvent(new CustomEvent('nihongo-coins-earned', { detail: { amount, source } }))
  }

  useEffect(() => {
    setStoredJson(COINS_KEY, data)
  }, [data])

  useEffect(() => {
    setStoredString(FREEZES_KEY, freezes)
  }, [freezes])

  useEffect(() => {
    setStoredJson(FREEZE_DATES_KEY, freezeDates)
  }, [freezeDates])

  // Auto-earn coins whenever XP is awarded
  useEffect(() => {
    const handler = (e) => {
      const { baseAmount, source } = e.detail || {}
      if (!Number.isFinite(baseAmount) || baseAmount <= 0) return
      // 1 coin per 5 base XP, capped at 20 per event
      const coins = Math.min(Math.max(1, Math.round(baseAmount / 5)), 20)
      if (earnRef.current) earnRef.current(coins, source)
    }
    window.addEventListener('nihongo-xp-earned', handler)
    return () => window.removeEventListener('nihongo-xp-earned', handler)
  }, [])

  /**
   * Purchase a streak freeze (costs FREEZE_COST coins).
   * Returns true if successful.
   */
  const buyFreeze = useCallback(() => {
    if (freezesRef.current >= MAX_FREEZES) return
    if (dataRef.current.total < FREEZE_COST) return
    setData(prev => {
      if (prev.total < FREEZE_COST) return prev
      return {
        total: prev.total - FREEZE_COST,
        history: [...prev.history.slice(-49), { amount: -FREEZE_COST, source: 'streak freeze', date: new Date().toISOString() }],
      }
    })
    setFreezes(prev => Math.min(prev + 1, MAX_FREEZES))
  }, [])

  /**
   * Activate a freeze for today's date.
   * Consumes one freeze and marks today as protected.
   * Returns true if successful.
   */
  const useFreeze = useCallback(() => {
    if (freezesRef.current <= 0) return
    const today = getDateKey()
    setFreezes(prev => Math.max(0, prev - 1))
    setFreezeDates(d => {
      const sanitized = sanitizeFreezeDates(d)
      return sanitized.includes(today) ? sanitized : [...sanitized, today].slice(-400)
    })
  }, [])

  const today = getDateKey()
  const isTodayFrozen = freezeDates.includes(today)

  return {
    totalCoins: data.total,
    coinsHistory: data.history,
    freezesOwned: freezes,
    freezeDates,
    freezeCost: FREEZE_COST,
    maxFreezes: MAX_FREEZES,
    buyFreeze,
    useFreeze,
    isTodayFrozen,
  }
}
