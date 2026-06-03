import { useState, useEffect, useCallback } from 'react'
import { getStoredJson, removeStoredKey, setStoredJson } from '../utils/localSettings'

const STORAGE_KEY = 'nihongo-progress'

const DEFAULT_PROGRESS = {
  vocabQuizzes: [],    // [{ date, lessons, score, total }]
  kanaQuizzes: [],     // [{ date, type, score, total }]
  kanjiQuizzes: [],    // [{ date, lessons, score, total }]
  grammarQuizzes: [],  // [{ date, lessons, score, total }]
  lessonsViewed: [],   // [1, 2, 3, ...]
  bookmarkedLesson: null, // lesson id (number) or null
}

function sanitizeQuizEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const rawScore = Number(entry.score)
  const rawTotal = Number(entry.total)
  const total = Number.isFinite(rawTotal) ? Math.max(0, rawTotal) : 0
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(rawScore, total)) : 0
  const parsedDate = typeof entry.date === 'string' ? new Date(entry.date) : null
  const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? entry.date : new Date().toISOString()
  const lessons = sanitizeLessonList(entry.lessons)

  const sanitizedEntry = {
    ...entry,
    date,
    score,
    total,
  }

  if (lessons.length > 0) {
    sanitizedEntry.lessons = lessons
  } else {
    delete sanitizedEntry.lessons
  }

  return sanitizedEntry
}

function toDateStringSafe(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toDateString()
}

function sanitizeQuizList(value) {
  if (!Array.isArray(value)) return []
  return value.map(sanitizeQuizEntry).filter(Boolean).slice(-500)
}

function sanitizeLessonId(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function sanitizeLessonList(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(sanitizeLessonId).filter(v => v != null))].sort((a, b) => a - b)
}

function sanitizeLessonsViewed(value) {
  return sanitizeLessonList(value)
}

/**
 * Load progress from localStorage.
 * Returns DEFAULT_PROGRESS if nothing is stored or data is corrupted.
 */
function loadProgress() {
  const parsed = getStoredJson(STORAGE_KEY, null)
  if (!parsed || typeof parsed !== 'object') return DEFAULT_PROGRESS

  // Validate shape -- fall back to defaults for any missing keys
  return {
    vocabQuizzes: sanitizeQuizList(parsed.vocabQuizzes),
    kanaQuizzes: sanitizeQuizList(parsed.kanaQuizzes),
    kanjiQuizzes: sanitizeQuizList(parsed.kanjiQuizzes),
    grammarQuizzes: sanitizeQuizList(parsed.grammarQuizzes),
    lessonsViewed: sanitizeLessonsViewed(parsed.lessonsViewed),
    bookmarkedLesson: sanitizeLessonId(parsed.bookmarkedLesson),
  }
}

/**
 * Persist progress to localStorage.
 */
function persistProgress(progress) {
  try {
    setStoredJson(STORAGE_KEY, progress)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('Failed to save progress to localStorage:', err)
    }
  }
}

/**
 * Custom hook for tracking learning progress.
 *
 * Usage:
 *   const { progress, saveQuizResult, markLessonViewed, getStats, resetProgress } = useProgress()
 */
export function useProgress() {
  const [progress, setProgress] = useState(loadProgress)

  // Sync to localStorage whenever progress changes
  useEffect(() => {
    persistProgress(progress)
  }, [progress])

  /**
   * Save a quiz result.
   * @param {'vocab' | 'kana' | 'kanji' | 'grammar'} quizType
   * @param {Object} result
   *   - For vocab: { lessons: number[], score: number, total: number }
   *   - For kana:  { type: string, score: number, total: number }
   *     type examples: 'hiragana-basic', 'katakana-dakuten', 'hiragana-all', etc.
   */
  const saveQuizResult = useCallback((quizType, result) => {
    setProgress((prev) => {
      const entry = sanitizeQuizEntry({
        date: new Date().toISOString(),
        ...result,
      })
      if (!entry) return prev

      const keyMap = {
        vocab: 'vocabQuizzes',
        kana: 'kanaQuizzes',
        kanji: 'kanjiQuizzes',
        grammar: 'grammarQuizzes',
      }
      const key = keyMap[quizType]
      if (!key) return prev

      return {
        ...prev,
        [key]: [...prev[key], entry].slice(-500),
      }
    })
  }, [])

  /**
   * Mark a lesson as viewed (idempotent -- won't duplicate).
   * @param {number} lessonNumber
   */
  const markLessonViewed = useCallback((lessonNumber) => {
    const normalizedLessonNumber = sanitizeLessonId(lessonNumber)
    if (normalizedLessonNumber == null) return
    setProgress((prev) => {
      if (prev.lessonsViewed.includes(normalizedLessonNumber)) return prev
      return {
        ...prev,
        lessonsViewed: [...prev.lessonsViewed, normalizedLessonNumber].sort((a, b) => a - b),
      }
    })
  }, [])

  /**
   * Compute aggregate stats from stored quiz data.
   * Returns an object with useful summary information.
   */
  const getStats = useCallback(() => {
    const { vocabQuizzes, kanaQuizzes, kanjiQuizzes, grammarQuizzes, lessonsViewed } = progress

    // --- Vocab quiz stats ---
    const vocabTotal = vocabQuizzes.length
    const vocabAvgScore =
      vocabTotal > 0
        ? Math.round(
            (vocabQuizzes.reduce((sum, q) => sum + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) /
              vocabTotal) *
              10
          ) / 10
        : 0
    const lastVocabQuiz = vocabTotal > 0 ? vocabQuizzes[vocabTotal - 1] : null

    // --- Kana quiz stats ---
    const kanaTotal = kanaQuizzes.length
    const kanaAvgScore =
      kanaTotal > 0
        ? Math.round(
            (kanaQuizzes.reduce((sum, q) => sum + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) /
              kanaTotal) *
              10
          ) / 10
        : 0
    const lastKanaQuiz = kanaTotal > 0 ? kanaQuizzes[kanaTotal - 1] : null

    // --- Best scores ---
    const bestVocabScore =
      vocabTotal > 0
        ? Math.max(...vocabQuizzes.map((q) => q.total > 0 ? Math.round((q.score / q.total) * 100) : 0))
        : 0
    const bestKanaScore =
      kanaTotal > 0
        ? Math.max(...kanaQuizzes.map((q) => q.total > 0 ? Math.round((q.score / q.total) * 100) : 0))
        : 0

    // --- Streak (consecutive days with at least one quiz of any type) ---
    const allDates = [...new Set(
      [...(vocabQuizzes || []), ...(kanaQuizzes || []), ...(kanjiQuizzes || []), ...(grammarQuizzes || [])]
        .map((q) => toDateStringSafe(q.date))
        .filter(Boolean)
    )].sort((a, b) => new Date(b) - new Date(a)) // unique dates, newest first

    let streak = 0
    const today = new Date()
    // if today has no activity yet, start checking from yesterday
    const startOffset = allDates.length > 0 && allDates[0] !== today.toDateString() ? 1 : 0
    for (let i = 0; i < allDates.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - (i + startOffset))
      if (allDates[i] === expected.toDateString()) {
        streak++
      } else {
        break
      }
    }

    // --- Max streak (longest consecutive streak ever) ---
    let maxStreak = 0
    let tempStreak = 1
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const curr = new Date(allDates[i])
        const prev = new Date(allDates[i - 1])
        const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak)
    }

    const kanjiTotal = (kanjiQuizzes || []).length
    const grammarTotal = (grammarQuizzes || []).length

    return {
      totalQuizzes: vocabTotal + kanaTotal + kanjiTotal + grammarTotal,
      vocabQuizCount: vocabTotal,
      kanaQuizCount: kanaTotal,
      kanjiQuizCount: kanjiTotal,
      grammarQuizCount: grammarTotal,
      vocabAvgScore,
      kanaAvgScore,
      bestVocabScore,
      bestKanaScore,
      lastVocabQuiz,
      lastKanaQuiz,
      lessonsViewedCount: lessonsViewed.length,
      lessonsViewed,
      streak,
      maxStreak,
    }
  }, [progress])

  /**
   * Toggle bookmark on a lesson. If already bookmarked, removes it.
   * @param {number} lessonId
   */
  const toggleBookmark = useCallback((lessonId) => {
    const normalizedLessonId = sanitizeLessonId(lessonId)
    setProgress((prev) => ({
      ...prev,
      bookmarkedLesson: prev.bookmarkedLesson === normalizedLessonId ? null : normalizedLessonId,
    }))
  }, [])

  /**
   * Get the currently bookmarked lesson id (or null).
   */
  const getBookmarkedLesson = useCallback(() => {
    return progress.bookmarkedLesson
  }, [progress])

  /**
   * Clear all progress data (asks no questions -- caller should confirm).
   */
  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS)
    removeStoredKey(STORAGE_KEY)
  }, [])

  return {
    progress,
    saveQuizResult,
    markLessonViewed,
    getStats,
    toggleBookmark,
    getBookmarkedLesson,
    resetProgress,
  }
}
