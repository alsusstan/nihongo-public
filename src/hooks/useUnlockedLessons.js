import { useState, useCallback, useMemo } from 'react'
import { lessons } from '../data/lessons'
import { getStoredNonNegativeInt, setStoredString } from '../utils/localSettings'

const STORAGE_KEY = 'nihongo-unlocked-max'
const DEFAULT_UNLOCKED = 15

function getUnlockedMax() {
  return getStoredNonNegativeInt(STORAGE_KEY, DEFAULT_UNLOCKED) || DEFAULT_UNLOCKED
}

export function useUnlockedLessons() {
  const [unlockedMax, setUnlockedMax] = useState(getUnlockedMax)

  const unlockNext = useCallback(() => {
    setUnlockedMax(prev => {
      const next = prev + 1
      setStoredString(STORAGE_KEY, next)
      return next
    })
  }, [])

  const isUnlocked = useCallback((lessonId) => {
    return lessonId <= unlockedMax
  }, [unlockedMax])

  const unlockedLessons = useMemo(() => lessons.filter(l => l.id <= unlockedMax), [unlockedMax])
  const nextLockId = unlockedMax + 1
  const hasMoreToUnlock = useMemo(() => lessons.some(l => l.id > unlockedMax), [unlockedMax])

  return {
    unlockedMax,
    unlockedLessons,
    isUnlocked,
    unlockNext,
    nextLockId,
    hasMoreToUnlock,
    allLessons: lessons,
  }
}
