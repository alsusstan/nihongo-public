import { useState, useEffect, useCallback, useRef } from 'react'
import { getStoredJson, getStoredNonNegativeInt, setStoredJson, setStoredString } from '../utils/localSettings'

const TIMER_KEY = 'nihongo-study-timer'
const GOAL_KEY = 'nihongo-study-goal'

function getToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadTimer() {
  const raw = getStoredJson(TIMER_KEY, {})
  if (!raw || typeof raw !== 'object') {
    return { date: getToday(), seconds: 0 }
  }
  const today = getToday()
  if (raw.date !== today) {
    return { date: getToday(), seconds: 0 }
  }
  const seconds = Number(raw.seconds)
  return { date: raw.date, seconds: Number.isFinite(seconds) ? Math.max(0, seconds) : 0 }
}

function loadGoal() {
  return getStoredNonNegativeInt(GOAL_KEY, 30) || 30
}

export function useStudyTimer() {
  const [timer, setTimer] = useState(loadTimer)
  const [dailyGoal, setDailyGoalState] = useState(loadGoal)
  const activeRef = useRef(typeof document === 'undefined' ? true : !document.hidden)

  // pause when tab is hidden / phone screen off
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const handler = () => { activeRef.current = !document.hidden }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // tick every 30 seconds to avoid excessive writes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeRef.current) return
      setTimer(prev => {
        const today = getToday()
        if (prev.date !== today) {
          return { date: today, seconds: 30 }
        }
        return { ...prev, seconds: prev.seconds + 30 }
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // persist on change — only write if value is not going backwards
  // (guards against multi-instance staleness when Home/Stats mounts after App has advanced)
  useEffect(() => {
    const saved = getStoredJson(TIMER_KEY, {})
    if (saved && typeof saved === 'object' && saved.date === timer.date && saved.seconds > timer.seconds) return
    setStoredJson(TIMER_KEY, timer)
  }, [timer])

  const setDailyGoal = useCallback((minutes) => {
    setDailyGoalState(minutes)
    setStoredString(GOAL_KEY, minutes)
  }, [])

  const formatTime = useCallback(() => {
    const mins = Math.floor(timer.seconds / 60)
    if (mins < 60) return `${mins} мин`
    const hours = Math.floor(mins / 60)
    const remainMins = mins % 60
    return `${hours}ч ${remainMins}м`
  }, [timer.seconds])

  const todayMinutes = Math.floor(timer.seconds / 60)
  const goalProgress = dailyGoal > 0 ? Math.min(todayMinutes / dailyGoal, 1) : 0
  const goalReached = todayMinutes >= dailyGoal

  return {
    todayMinutes,
    formatTime,
    dailyGoal,
    setDailyGoal,
    goalProgress,
    goalReached,
  }
}
