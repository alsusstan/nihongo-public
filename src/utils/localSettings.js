const DEFAULT_QUIZ_SIZE = 10
const VALID_QUIZ_SIZES = [5, 10, 15, 20]
export const DEFAULT_BKB_UNLOCKED = 8

function parseStoredInt(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw == null ? fallback : parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function getStoredQuizSize() {
  const parsed = parseStoredInt('nihongo-quiz-size', DEFAULT_QUIZ_SIZE)
  return VALID_QUIZ_SIZES.includes(parsed) ? parsed : DEFAULT_QUIZ_SIZE
}

export function getStoredFlag(key, enabledValue = '1', fallback = false) {
  try {
    return localStorage.getItem(key) === enabledValue ? true : fallback
  } catch {
    return fallback
  }
}

export function getStoredInverseFlag(key, disabledValue = '0', fallback = true) {
  try {
    return localStorage.getItem(key) !== disabledValue
  } catch {
    return fallback
  }
}

export function getStoredString(key, fallback = '') {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

export function getStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function getStoredNonNegativeInt(key, fallback = 0) {
  return Math.max(0, parseStoredInt(key, fallback))
}

export function setStoredString(key, value) {
  try {
    localStorage.setItem(key, String(value))
    return true
  } catch {
    return false
  }
}

export function setStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStoredKey(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function getStoredBkbUnlocked() {
  return Math.max(DEFAULT_BKB_UNLOCKED, parseStoredInt('nihongo-bkb-unlocked', DEFAULT_BKB_UNLOCKED))
}

export function setStoredBkbUnlocked(value) {
  const normalized = Math.max(DEFAULT_BKB_UNLOCKED, parseStoredIntValue(value, DEFAULT_BKB_UNLOCKED))
  try {
    localStorage.setItem('nihongo-bkb-unlocked', String(normalized))
  } catch {
    // Ignore storage write failures and still return the normalized value.
  }
  return normalized
}

export function resetStoredBkbUnlocked() {
  return setStoredBkbUnlocked(DEFAULT_BKB_UNLOCKED)
}

function parseStoredIntValue(value, fallback) {
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}
