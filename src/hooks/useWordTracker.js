import { useCallback } from 'react'
import { getStoredJson, setStoredJson } from '../utils/localSettings'

const STORAGE_KEY = 'nihongo-difficult-words'

const stripBrackets = s => (s || '').replace(/\[.*?\]/g, '').trim()

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizeNonNegativeInt(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback
}

function sanitizeLesson(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function sanitizeDate(value) {
  if (typeof value !== 'string') return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : value
}

function sanitizeDifficultWord(entry) {
  if (!entry || typeof entry !== 'object') return null
  const japanese = sanitizeString(entry.japanese)
  const romaji = sanitizeString(entry.romaji)
  const russian = sanitizeString(entry.russian)
  const kanji = sanitizeString(entry.kanji)
  if (!japanese && !kanji) return null

  const now = new Date().toISOString()
  return {
    japanese,
    kanji: kanji || undefined,
    romaji,
    russian,
    lesson: sanitizeLesson(entry.lesson),
    source: sanitizeString(entry.source) || 'quiz',
    missCount: sanitizeNonNegativeInt(entry.missCount, 1) || 1,
    hitCount: sanitizeNonNegativeInt(entry.hitCount, 0),
    addedAt: sanitizeDate(entry.addedAt) || now,
    lastMissed: sanitizeDate(entry.lastMissed) || sanitizeDate(entry.addedAt) || now,
  }
}

function sanitizeDifficultWords(words) {
  if (!Array.isArray(words)) return []
  return words.map(sanitizeDifficultWord).filter(Boolean).slice(-500)
}

// Match a stored difficult word against an incoming word.
// If both have a lesson, require it to match (prevents homonyms like
// かみ=paper/L6 and かみ=hair/L16 from being conflated).
// Falls back to japanese+romaji only when lesson is absent (old data).
// Strips bracket annotations before comparing so words stored from FlashCards
// (stripped) match those from LessonDetail (raw), e.g. "います" === "います [こどもが〜]".
function wordMatches(stored, incoming) {
  if (stripBrackets(stored.japanese) !== stripBrackets(incoming.japanese) || stripBrackets(stored.romaji) !== stripBrackets(incoming.romaji)) return false
  if (stored.lesson != null && incoming.lesson != null) return stored.lesson === incoming.lesson
  return true
}

/**
 * Load difficult words from localStorage.
 * Returns an array of word objects with metadata.
 */
export function loadDifficultWords() {
  const parsed = getStoredJson(STORAGE_KEY, [])
  return sanitizeDifficultWords(parsed)
}

/**
 * Save difficult words to localStorage.
 */
export function saveDifficultWords(words) {
  setStoredJson(STORAGE_KEY, sanitizeDifficultWords(words))
}

/**
 * Hook for tracking word difficulty across quizzes.
 * Provides functions to record answers and get weak words.
 */
export function useWordTracker() {
  /**
   * Record a wrong answer — adds to difficult words or increments miss count.
   */
  const recordMiss = useCallback((word, source = 'quiz') => {
    const current = loadDifficultWords()
    const existing = current.find(w => wordMatches(w, word))

    if (existing) {
      existing.missCount = (existing.missCount || 0) + 1
      existing.lastMissed = new Date().toISOString()
      saveDifficultWords(current)
    } else {
      current.push({
        japanese: word.japanese,
        kanji: word.kanji,
        romaji: word.romaji,
        russian: word.russian,
        lesson: word.lesson,
        source,
        missCount: 1,
        hitCount: 0,
        addedAt: new Date().toISOString(),
        lastMissed: new Date().toISOString(),
      })
      saveDifficultWords(current)
    }
  }, [])

  /**
   * Record a correct answer on a difficult word — increments hit count.
   * If hit count reaches threshold, remove from difficult list.
   */
  const recordHit = useCallback((word) => {
    const current = loadDifficultWords()
    const existing = current.find(w => wordMatches(w, word))

    if (!existing) return

    existing.hitCount = (existing.hitCount || 0) + 1
    // remove if answered correctly 3+ times total
    if (existing.hitCount >= 3) {
      const filtered = current.filter(w => w !== existing)
      saveDifficultWords(filtered)
    } else {
      saveDifficultWords(current)
    }
  }, [])

  /**
   * Get the most difficult words (sorted by miss frequency).
   */
  const getWeakWords = useCallback((limit = 20) => {
    const words = loadDifficultWords()
    return words
      .sort((a, b) => (b.missCount || 1) - (a.missCount || 1))
      .slice(0, limit)
  }, [])

  /**
   * Get count of difficult words.
   */
  const getDifficultCount = useCallback(() => {
    return loadDifficultWords().length
  }, [])

  return {
    recordMiss,
    recordHit,
    getWeakWords,
    getDifficultCount,
    loadDifficultWords,
    saveDifficultWords,
  }
}
