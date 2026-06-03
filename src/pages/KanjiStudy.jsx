import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { kanji, kanjiLessonInfo } from '../data/kanji'
import { getAllVocabulary } from '../data/lessons'
import { strokeData } from '../data/strokeOrder'
import StrokeOrder from '../components/StrokeOrder'
import { useIsMobile } from '../hooks/useIsMobile'
import { kanaToRomaji } from '../utils/kanaToRomaji'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { copyTextToClipboard } from '../utils/clipboard'
import { DEFAULT_BKB_UNLOCKED, getStoredBkbUnlocked, getStoredString, removeStoredKey, resetStoredBkbUnlocked, setStoredBkbUnlocked, setStoredString } from '../utils/localSettings'

// Parse "日曜日 (nichiyoubi) воскресенье" → { word, romaji, meaning }
function parseKeyword(kw) {
  const match = kw.match(/^(.+?)\s*\(([^)]+)\)\s*(.*)$/)
  if (match) return { word: match[1].trim(), romaji: match[2].trim(), meaning: match[3].trim() }
  return { word: kw, romaji: '', meaning: '' }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickUniqueMeaningDistractors(pool, correctMeaning, limit = 3) {
  const seen = new Set([correctMeaning])
  const picked = []

  shuffle(pool).forEach(kanjiItem => {
    if (picked.length >= limit || seen.has(kanjiItem.meaning)) return
    seen.add(kanjiItem.meaning)
    picked.push(kanjiItem)
  })

  return picked
}

// Convert a reading string (may contain / and ・) to romaji, preserving separators
function readingToRomaji(reading) {
  if (!reading) return ''
  return reading
    .split(' / ')
    .map(part => kanaToRomaji(part.replace(/[〜～]/g, '').replace(/・/g, '')))
    .join(' / ')
}

export default function KanjiStudy() {
  const isMobile = useIsMobile()
  const [searchParams] = useSearchParams()
  const { progress: quizProgress, saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()
  const [bkbUnlocked, setBkbUnlocked] = useState(getStoredBkbUnlocked)
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState(() => {
    const saved = getStoredString('nihongo-kanji-last-lesson', '')
    if (!saved) return null
    const parsed = parseInt(saved, 10)
    return Number.isFinite(parsed) && kanjiLessonInfo.some(l => l.id === parsed) ? parsed : null
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [noStrokeSet, setNoStrokeSet] = useState(() => new Set())
  const [hoveredArrow, setHoveredArrow] = useState(null)
  const [hoveredLesson, setHoveredLesson] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const xpAwardedRef = useRef(false)
  const [kanjiCopied, setKanjiCopied] = useState(false)
  const copyTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(copyTimerRef.current), [])
  const [tableView, setTableView] = useState(false)

  const copyKanji = useCallback((char) => {
    copyTextToClipboard(char).then((success) => {
      if (!success) return
      setKanjiCopied(true)
      clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setKanjiCopied(false), 1200)
    })
  }, [])

  // Mini-test state
  const [miniTestQs, setMiniTestQs] = useState([])
  const [miniTestIdx, setMiniTestIdx] = useState(0)
  const [miniTestSelected, setMiniTestSelected] = useState(null)
  const [miniTestScore, setMiniTestScore] = useState(0)
  const [miniTestDone, setMiniTestDone] = useState(false)
  const [miniTestActive, setMiniTestActive] = useState(false)
  const miniTestTimerRef = useRef(null)
  const resultScrollTimerRef = useRef(null)
  const miniTestResultRef = useRef(null)
  useEffect(() => () => {
    clearTimeout(miniTestTimerRef.current)
    clearTimeout(resultScrollTimerRef.current)
  }, [])

  const unlockedKanjiCount = useMemo(
    () => kanji.filter(k => k.lesson <= bkbUnlocked).length,
    [bkbUnlocked]
  )

  const mnnVocab = useMemo(() => {
    if (!selectedLesson) return {}
    const allWords = getAllVocabulary()
    const byLesson = {}
    kanji.filter(k => k.lesson === selectedLesson).forEach(k => {
      byLesson[k.kanji] = allWords
        .filter(w => w.kanji && w.kanji.includes(k.kanji))
        .sort((a, b) => (a.lesson || 99) - (b.lesson || 99))
        .slice(0, 5)
    })
    return byLesson
  }, [selectedLesson])

  const lessonBestScores = useMemo(() => {
    const scores = {}
    ;(quizProgress?.kanjiQuizzes || []).forEach(q => {
      const pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0
      ;(q.lessons || []).forEach(id => {
        if (scores[id] === undefined || pct > scores[id]) scores[id] = pct
      })
    })
    return scores
  }, [quizProgress?.kanjiQuizzes])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.trim().toLowerCase()
    return kanji.filter(k =>
      k.kanji.includes(q) ||
      k.meaning.toLowerCase().includes(q) ||
      k.kun.toLowerCase().includes(q) ||
      k.on.toLowerCase().includes(q) ||
      k.keywords.some(kw => kw.toLowerCase().includes(q))
    )
  }, [searchQuery])

  const handleSearchSelect = (k) => {
    const lessonK = kanji.filter(kk => kk.lesson === k.lesson)
    const idx = lessonK.findIndex(kk => kk.kanji === k.kanji)
    setSelectedLesson(k.lesson)
    setCurrentIndex(idx >= 0 ? idx : 0)
    setSearchQuery('')
    if (k.lesson) setStoredString('nihongo-kanji-last-lesson', k.lesson)
  }

  // read ?lesson=X and ?kanji=K from URL on mount
  useEffect(() => {
    const lessonParam = searchParams.get('lesson')
    const kanjiParam = searchParams.get('kanji')
    if (kanjiParam) {
      const k = kanji.find(kk => kk.kanji === kanjiParam)
      if (k) {
        const lessonK = kanji.filter(kk => kk.lesson === k.lesson)
        const idx = lessonK.findIndex(kk => kk.kanji === k.kanji)
        setSelectedLesson(k.lesson)
        setCurrentIndex(idx >= 0 ? idx : 0)
        return
      }
    }
    if (lessonParam) {
      const lessonId = parseInt(lessonParam, 10)
      if (!isNaN(lessonId)) {
        setSelectedLesson(lessonId)
        setCurrentIndex(0)
      }
    }
  }, [searchParams])

  const lessonKanji = selectedLesson
    ? kanji.filter(k => k.lesson === selectedLesson)
    : []

  const currentKanji = lessonKanji[currentIndex] || null

  const goNext = useCallback(() => {
    setKanjiCopied(false)
    setCurrentIndex(i => Math.min(lessonKanji.length - 1, i + 1))
  }, [lessonKanji.length])

  const goPrev = useCallback(() => {
    setKanjiCopied(false)
    setCurrentIndex(i => Math.max(0, i - 1))
  }, [])

  // keyboard navigation
  useEffect(() => {
    if (!selectedLesson) return
    const handler = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedLesson, goNext, goPrev])

  const hasMoreToUnlock = bkbUnlocked < 22
  const nextLockId = bkbUnlocked + 1
  const lessonHasData = (id) => kanji.some(k => k.lesson === id)
  const unlockNext = () => {
    const next = setStoredBkbUnlocked(bkbUnlocked + 1)
    setBkbUnlocked(next)
    setShowUnlockConfirm(false)
  }

  const resetMiniTest = () => {
    setMiniTestActive(false)
    setMiniTestDone(false)
    setMiniTestIdx(0)
    setMiniTestQs([])
    setMiniTestScore(0)
    setMiniTestSelected(null)
    clearTimeout(miniTestTimerRef.current)
  }

  const goToLesson = (lessonId) => {
    setSelectedLesson(lessonId)
    setCurrentIndex(0)
    resetMiniTest()
    setTableView(false)
    xpAwardedRef.current = false
    if (lessonId) setStoredString('nihongo-kanji-last-lesson', lessonId)
    else removeStoredKey('nihongo-kanji-last-lesson')
  }

  const startMiniTest = useCallback((lessonKanjiList) => {
    const count = Math.min(3, lessonKanjiList.length)
    const sampled = shuffle([...lessonKanjiList]).slice(0, count)
    const qs = sampled.map(correct => {
      const distractors = pickUniqueMeaningDistractors(kanji, correct.meaning)
      return { kanji: correct.kanji, meaning: correct.meaning, options: shuffle([correct, ...distractors]) }
    })
    setMiniTestQs(qs)
    setMiniTestIdx(0)
    setMiniTestSelected(null)
    setMiniTestScore(0)
    setMiniTestDone(false)
    setMiniTestActive(true)
  }, [])

  const handleMiniAnswer = useCallback((meaning) => {
    if (miniTestSelected !== null) return
    setMiniTestSelected(meaning)
    const correct = meaning === miniTestQs[miniTestIdx].meaning
    const newScore = correct ? miniTestScore + 1 : miniTestScore
    if (correct) setMiniTestScore(s => s + 1)
    clearTimeout(miniTestTimerRef.current)
    miniTestTimerRef.current = setTimeout(() => {
      if (miniTestIdx + 1 >= miniTestQs.length) {
        const total = miniTestQs.length
        if (!xpAwardedRef.current) {
          xpAwardedRef.current = true
          saveQuizResult('kanji', { score: newScore, total, lessons: [selectedLesson] })
          const xp = calculateQuizXP(newScore, total)
          if (xp > 0) awardXP(xp, 'kanji study', newScore === total && total > 0)
        }
        setMiniTestDone(true)
      } else {
        setMiniTestIdx(i => i + 1)
        setMiniTestSelected(null)
      }
    }, 700)
  }, [miniTestSelected, miniTestQs, miniTestIdx, miniTestScore, selectedLesson, saveQuizResult, awardXP, calculateQuizXP])

  // Scroll to result card when mini-test completes
  useEffect(() => {
    clearTimeout(resultScrollTimerRef.current)
    if (miniTestDone && miniTestResultRef.current) {
      resultScrollTimerRef.current = setTimeout(() => miniTestResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
    return () => clearTimeout(resultScrollTimerRef.current)
  }, [miniTestDone])

  const prevLessonId = selectedLesson > 1
    ? kanjiLessonInfo.find(l => l.id === selectedLesson - 1)?.id || null
    : null
  const nextLessonId = selectedLesson
    ? kanjiLessonInfo.find(l => l.id === selectedLesson + 1)?.id || null
    : null

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <div style={s.headerKanjiDecor}>
          <span style={s.headerKanjiChar}>漢</span>
          <span style={s.headerKanjiChar}>字</span>
        </div>
        <h1 style={s.title}>
          kanji study <span style={s.titleJp}>漢字べんきょう</span>
        </h1>
        <p style={s.subtitle}>Basic Kanji Book 1 — browse, learn, and explore</p>
        {/* Global progress */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 900 }}>{unlockedKanjiCount}</span>
            <span style={{ opacity: 0.6 }}> / 250 кандзи разблокировано</span>
          </div>
          <div style={{ width: 180, height: 5, background: 'rgba(192,132,252,0.15)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(unlockedKanjiCount / 250) * 100}%`, background: 'linear-gradient(90deg, #f472b6, #c084fc)', borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* lesson selection */}
      {!selectedLesson && (
        <div className="animate-fadeInUp">

          {/* search */}
          <div className="glass" style={{ padding: '12px 16px', marginBottom: 14 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', pointerEvents: 'none', opacity: 0.45 }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
                placeholder="поиск по всем 250 кандзи: 日, огонь, ひ, fire..."
                aria-label="search kanji"
                autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                style={{
                  width: '100%', padding: '10px 36px 10px 36px', borderRadius: 14,
                  border: '2px solid rgba(192,132,252,0.3)', background: 'var(--glass-bg)',
                  fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1rem', padding: '6px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="clear search"
                >✕</button>
              )}
            </div>
            {searchQuery.trim() && (
              <div style={{ marginTop: 8, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textAlign: 'center' }}>
                {searchResults.length} {searchResults.length === 1 ? 'кандзи' : 'кандзи'}
              </div>
            )}
          </div>

          {/* search results */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {searchResults.map(k => {
                const isLocked = k.lesson > bkbUnlocked
                return (
                  <button
                    key={k.kanji}
                    className="glass glass-hover"
                    onClick={() => handleSearchSelect(k)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%', fontFamily: 'inherit', opacity: isLocked ? 0.6 : 1 }}
                  >
                    <span style={{ fontSize: '2rem', lineHeight: 1, minWidth: 40, textAlign: 'center', color: 'var(--text-main)' }}>{k.kanji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{k.meaning}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)' }}>
                        {k.kun && <span>訓 {k.kun}</span>}
                        {k.kun && k.on && <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>}
                        {k.on && <span>音 {k.on}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: isLocked ? 'rgba(100,100,100,0.15)' : 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50 }}>
                        {isLocked ? '🔒' : ''} ур.{k.lesson}
                      </span>
                      {strokeData[k.kanji]?.strokes && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', opacity: 0.7 }}>
                          {strokeData[k.kanji].strokes}画
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {searchQuery.trim() && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>
              <span style={{ fontSize: '1.5rem' }}>🤔</span>
              <div style={{ marginTop: 4 }}>не найдено</div>
            </div>
          )}

          {!searchQuery.trim() && <div style={s.lessonsGrid} className="lessons-grid">
            {kanjiLessonInfo.map((l, i) => {
              const isLocked = l.id > bkbUnlocked
              const hasData = lessonHasData(l.id)
              const lessonKanjiList = kanji.filter(k => k.lesson === l.id)
              const accentColors = ['#f472b6','#60a5fa','#34d399','#f97316','#a78bfa','#fbbf24','#f472b6','#60a5fa','#34d399','#f97316','#a78bfa','#fbbf24','#f472b6','#60a5fa','#34d399','#f97316','#a78bfa','#fbbf24','#f472b6','#60a5fa','#34d399','#f97316']
              const accent = accentColors[i] || '#c084fc'
              return (
                <button
                  key={l.id}
                  className={isLocked ? 'glass' : 'glass glass-hover'}
                  style={{
                    ...s.lessonCard,
                    ...(hoveredLesson === l.id && !isLocked ? s.lessonCardHovered : {}),
                    ...(isLocked ? s.lessonCardLocked : {}),
                    position: 'relative',
                    cursor: isLocked ? 'default' : 'pointer',
                    borderTop: isLocked ? undefined : `3px solid ${accent}`,
                  }}
                  onMouseEnter={() => !isLocked && setHoveredLesson(l.id)}
                  onMouseLeave={() => setHoveredLesson(null)}
                  onFocus={() => !isLocked && setHoveredLesson(l.id)}
                  onBlur={() => setHoveredLesson(null)}
                  onClick={() => { if (!isLocked) goToLesson(l.id) }}
                >
                  {isLocked && (
                    <div style={s.lockedOverlay}>
                      <span style={{ fontSize: '1.6rem' }}>🔒</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', marginTop: 4 }}>{hasData ? 'locked' : 'soon'}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: isLocked ? 'rgba(255,255,255,0.4)' : '#fff', background: isLocked ? 'rgba(192,132,252,0.15)' : accent, padding: '2px 9px', borderRadius: 50 }}>#{l.id}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {!isLocked && lessonBestScores[l.id] !== undefined && (
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 800,
                          color: lessonBestScores[l.id] >= 80 ? 'var(--correct-text)' : lessonBestScores[l.id] >= 60 ? 'var(--gold-text)' : 'var(--incorrect-text)',
                          background: lessonBestScores[l.id] >= 80 ? 'rgba(22,163,74,0.12)' : lessonBestScores[l.id] >= 60 ? 'rgba(217,119,6,0.12)' : 'rgba(220,38,38,0.12)',
                          padding: '2px 6px', borderRadius: 50,
                        }}>
                          {lessonBestScores[l.id]}%
                        </span>
                      )}
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', opacity: isLocked ? 0.4 : 1 }}>{l.count}字</span>
                    </div>
                  </div>
                  <div style={{ ...s.lessonPreview, fontSize: '1.35rem', letterSpacing: 2, lineHeight: 1.5, opacity: isLocked ? 0.2 : 1, marginBottom: 8 }}>
                    {lessonKanjiList.map(k => k.kanji).join('')}
                  </div>
                  <div style={{ ...s.lessonTitleJp, fontSize: '0.78rem', opacity: isLocked ? 0.3 : 1 }}>{l.titleJp}</div>
                </button>
              )
            })}
          </div>}

          {!searchQuery.trim() && hasMoreToUnlock && (
            <div style={{ textAlign: 'center', margin: '16px 0 8px' }} className="animate-fadeInUp">
              {showUnlockConfirm ? (
                <div className="glass" style={{ display: 'inline-block', padding: '16px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
                    unlock lesson {nextLockId}?
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button className="btn btn-primary btn-hover" style={{ fontSize: '0.82rem', padding: '8px 20px' }} onClick={unlockNext}>
                      yes, unlock! 🔓
                    </button>
                    <button className="btn btn-secondary btn-hover" style={{ fontSize: '0.82rem', padding: '8px 20px' }} onClick={() => setShowUnlockConfirm(false)}>
                      cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-cute btn-hover" style={{ fontSize: '0.9rem' }} onClick={() => setShowUnlockConfirm(true)}>
                  🔓 unlock lesson {nextLockId}
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
              <Link to="/quiz/kanji" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
                квиз по кандзи ✨
              </Link>
              <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
            </div>
            {bkbUnlocked > DEFAULT_BKB_UNLOCKED && (
              <div style={{ textAlign: 'center' }}>
                <button
                  className="btn btn-secondary btn-hover"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => {
                    setBkbUnlocked(resetStoredBkbUnlocked())
                    setSelectedLesson(null)
                  }}
                >
                  🔒 сбросить до ур. {DEFAULT_BKB_UNLOCKED}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* empty lesson placeholder (lesson unlocked but no data yet) */}
      {selectedLesson && !currentKanji && (
        <div className="animate-fadeInUp" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="glass" style={{ display: 'inline-block', padding: '32px 40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚧</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 6 }}>Lesson {selectedLesson} — coming soon</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 20 }}>Kanji data for this lesson is not added yet</div>
            <button className="btn btn-secondary" onClick={() => { setSelectedLesson(null); removeStoredKey('nihongo-kanji-last-lesson') }}>
              ← back to lessons
            </button>
          </div>
        </div>
      )}

      {/* kanji viewer for selected lesson */}
      {selectedLesson && currentKanji && (
        <div className="animate-fadeInUp">
          {/* top nav */}
          <div style={s.topNav}>
            <button
              onClick={() => { setSelectedLesson(null); setCurrentIndex(0); removeStoredKey('nihongo-kanji-last-lesson') }}
              style={s.backBtn}
            >
              ← all lessons
            </button>
            <div style={s.lessonSwitcher}>
              {prevLessonId && (
                <button onClick={() => goToLesson(prevLessonId)} style={s.lessonSwBtn}>
                  ‹ L{prevLessonId}
                </button>
              )}
              <span style={s.lessonBadge}>Lesson {selectedLesson}</span>
              {nextLessonId && (
                <button onClick={() => goToLesson(nextLessonId)} style={s.lessonSwBtn}>
                  L{nextLessonId} ›
                </button>
              )}
            </div>
          </div>
          {/* progress bar */}
          <div style={{ height: 4, background: 'rgba(192,132,252,0.15)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${lessonKanji.length > 0 ? ((currentIndex + 1) / lessonKanji.length) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #f472b6, #c084fc)',
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* kanji counter + view toggle */}
          <div style={{ ...s.counter, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {!tableView && (
              <span>
                <span style={s.counterCurrent}>{currentIndex + 1}</span>
                <span style={s.counterSep}> / </span>
                <span>{lessonKanji.length}</span>
              </span>
            )}
            {tableView && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700 }}>
                {lessonKanji.length} кандзи
              </span>
            )}
            <button
              onClick={() => setTableView(v => !v)}
              style={{
                fontSize: '0.72rem', fontWeight: 800,
                background: tableView ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
                color: tableView ? '#fff' : 'var(--text-light)',
                border: 'none', borderRadius: 50, padding: '4px 12px', cursor: 'pointer',
                transition: 'all 0.2s', minHeight: 44,
              }}
            >
              {tableView ? '☰ таблица' : '☷ таблица'}
            </button>
          </div>

          {/* Table view */}
          {tableView && (
            <div className="glass animate-fadeInUp" style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 12 }}>
              {lessonKanji.map((k, i) => (
                <button
                  key={k.kanji}
                  onClick={() => { setCurrentIndex(i); setTableView(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '10px 16px', border: 'none', cursor: 'pointer',
                    background: i === currentIndex ? 'rgba(244,114,182,0.1)' : i % 2 === 0 ? 'transparent' : 'rgba(192,132,252,0.04)',
                    borderBottom: i < lessonKanji.length - 1 ? '1px solid rgba(192,132,252,0.1)' : 'none',
                    textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, minWidth: 36, textAlign: 'center', lineHeight: 1, color: i === currentIndex ? '#f472b6' : 'var(--text-main)' }}>{k.kanji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>{k.meaning}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 1 }}>
                      {k.kun && <span>訓 {k.kun}</span>}
                      {k.kun && k.on && <span style={{ margin: '0 5px', opacity: 0.35 }}>·</span>}
                      {k.on && <span>音 {k.on}</span>}
                    </div>
                  </div>
                  {strokeData[k.kanji]?.strokes && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', background: 'rgba(192,132,252,0.1)', padding: '2px 6px', borderRadius: 50, flexShrink: 0 }}>
                      {strokeData[k.kanji].strokes}画
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div style={{ ...s.arrowNav, ...(tableView ? { display: 'none' } : {}) }}>
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              onMouseEnter={() => setHoveredArrow('prev')}
              onMouseLeave={() => setHoveredArrow(null)}
              onFocus={() => setHoveredArrow('prev')}
              onBlur={() => setHoveredArrow(null)}
              style={{
                ...s.arrowBtn,
                ...(currentIndex === 0 ? s.arrowDisabled : {}),
                ...(hoveredArrow === 'prev' && currentIndex !== 0 ? s.arrowBtnHovered : {}),
              }}
              className="glass"
            >
              ← prev
            </button>
            <div style={s.arrowProgress}>
              {lessonKanji.map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...s.arrowDot,
                    ...(i === currentIndex ? s.arrowDotActive : {}),
                    ...(i < currentIndex ? s.arrowDotDone : {}),
                  }}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              disabled={currentIndex === lessonKanji.length - 1}
              onMouseEnter={() => setHoveredArrow('next')}
              onMouseLeave={() => setHoveredArrow(null)}
              onFocus={() => setHoveredArrow('next')}
              onBlur={() => setHoveredArrow(null)}
              style={{
                ...s.arrowBtn,
                ...(currentIndex === lessonKanji.length - 1 ? s.arrowDisabled : {}),
                ...(hoveredArrow === 'next' && currentIndex !== lessonKanji.length - 1 ? s.arrowBtnHovered : {}),
              }}
              className="glass"
            >
              next →
            </button>
          </div>
          {!isMobile && !tableView && (
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <span style={s.keyHint}>⌨ ← →</span>
            </div>
          )}

          {/* main kanji card */}
          {!tableView && <div
            key={`kanji-card-${currentIndex}`}
            style={s.mainCard}
            className="glass animate-pop"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX
              touchStartY.current = e.touches[0].clientY
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return
              const dx = e.changedTouches[0].clientX - touchStartX.current
              const dy = e.changedTouches[0].clientY - touchStartY.current
              // only trigger if swipe is primarily horizontal (not a vertical scroll)
              if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
                if (dx > 0) goPrev()
                else goNext()
              }
              touchStartX.current = null
              touchStartY.current = null
            }}
          >
            {/* kanji character — massive and beautiful */}
            <div style={s.kanjiCharWrap}>
              <button
                onClick={() => copyKanji(currentKanji.kanji)}
                title={kanjiCopied ? 'скопировано!' : 'нажми чтобы скопировать'}
                aria-label="copy kanji"
                style={{
                  ...s.kanjiChar,
                  fontSize: isMobile ? '6rem' : '8rem',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                  position: 'relative',
                }}
              >
                {currentKanji.kanji}
                {kanjiCopied && (
                  <span style={{
                    position: 'absolute', top: -8, right: -8,
                    fontSize: '0.72rem', fontWeight: 800, color: 'var(--correct-text)',
                    background: 'rgba(16,185,129,0.12)', borderRadius: 50, padding: '2px 6px',
                    pointerEvents: 'none', animation: 'fadeIn 0.2s ease',
                  }}>✓</span>
                )}
              </button>
            </div>

            {/* meaning */}
            <div style={s.kanjiMeaning}>{currentKanji.meaning}</div>

            {/* readings */}
            <div style={s.readingRow}>
              <div style={s.readingBlock}>
                <span style={s.readingLabel}>kun'yomi 訓読み</span>
                <span style={s.readingValue}>{currentKanji.kun}</span>
                <span style={s.readingRomaji}>{readingToRomaji(currentKanji.kun)}</span>
                <span style={s.readingHint}>Japanese reading</span>
              </div>
              <div style={s.readingDivider} />
              <div style={s.readingBlock}>
                <span style={s.readingLabel}>on'yomi 音読み</span>
                <span style={s.readingValue}>{currentKanji.on}</span>
                <span style={s.readingRomaji}>{readingToRomaji(currentKanji.on)}</span>
                <span style={s.readingHint}>Chinese-derived</span>
              </div>
            </div>

            {/* examples / keywords */}
            {currentKanji.keywords && currentKanji.keywords.length > 0 && (
              <div style={s.examplesSection}>
                <div style={s.examplesTitle}>
                  <span style={s.examplesDot} />
                  examples
                  <span style={s.examplesDot} />
                </div>
                <div style={s.examplesGrid}>
                  {currentKanji.keywords.map((kw, j) => {
                    const { word, romaji, meaning } = parseKeyword(kw)
                    return (
                      <div key={j} style={s.exampleRow}>
                        <span style={s.exampleWord}>{word}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={s.exampleRomaji}>{romaji}</div>
                          {meaning && <div style={s.exampleMeaning}>{meaning}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* MNN vocabulary using this kanji */}
            {mnnVocab[currentKanji.kanji] && mnnVocab[currentKanji.kanji].length > 0 && (
              <div style={s.mnnVocabSection}>
                <div style={s.examplesTitle}>
                  <span style={s.examplesDot} />
                  слова из MNN
                  <span style={s.examplesDot} />
                </div>
                <div style={s.examplesGrid}>
                  {mnnVocab[currentKanji.kanji].map((w, i) => {
                    const kanaClean = w.japanese.replace(/\s*\[な\]/g, '').replace(/~/g, '')
                    const rm = readingToRomaji(kanaClean)
                    return (
                      <div key={i} style={s.mnnVocabItem}>
                        <span style={s.mnnVocabKanji}>{w.kanji.replace(/\s*\[な\]/g, '')}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={s.exampleRomaji}>{kanaClean}{rm ? <span style={{ opacity: 0.6, marginLeft: 5 }}>({rm})</span> : null}</div>
                          <div style={s.exampleMeaning}>{w.russian}</div>
                        </div>
                        <Link to={`/lessons/${w.lesson}`} style={s.mnnVocabLesson}>L{w.lesson}</Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* stroke order — always visible, auto-plays on scroll */}
            <div style={s.strokeSection}>
              <div style={s.strokeHeader}>
                <div style={s.strokeTitleRow}>
                  <span style={s.strokeToggleText}>stroke order</span>
                  {strokeData[currentKanji.kanji] && (
                    <span style={s.strokeBadge}>{strokeData[currentKanji.kanji].strokes} strokes</span>
                  )}
                </div>
              </div>
              <StrokeOrder
                kanji={currentKanji.kanji}
                size={isMobile ? 160 : 200}
                autoPlay
                onError={k => setNoStrokeSet(prev => { const s = new Set(prev); s.add(k); return s })}
              />
              {strokeData[currentKanji.kanji]?.order?.length > 0 && (
                <div style={{ marginTop: 10, textAlign: 'left', width: '100%', maxWidth: isMobile ? 200 : 240 }}>
                  {strokeData[currentKanji.kanji].order.map((desc, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ec4899', minWidth: 16, textAlign: 'right' }}>{i + 1}.</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', lineHeight: 1.4 }}>{desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>}

          {/* mini grid — thumbnail gallery of all kanji in lesson */}
          <div style={s.miniGridSection}>
            <div style={s.miniGridLabel}>all kanji in this lesson</div>
            <div style={s.miniGrid}>
              {lessonKanji.map((k, i) => (
                <button
                  key={k.kanji}
                  onClick={() => { setCurrentIndex(i); setTableView(false) }}
                  title={k.meaning}
                  aria-label={`${k.kanji} — ${k.meaning}`}
                  aria-current={i === currentIndex ? 'true' : undefined}
                  style={{
                    ...s.miniBtn,
                    ...(i === currentIndex ? s.miniBtnActive : {}),
                    ...(i < currentIndex ? s.miniBtnDone : {}),
                    flexDirection: 'column', gap: 1,
                  }}
                  className={i === currentIndex ? '' : 'glass-sm'}
                >
                  <span style={{ position: 'relative' }}>
                    {k.kanji}
                    {noStrokeSet.has(k.kanji) && (
                      <span style={{ position: 'absolute', top: -3, right: -5, width: 6, height: 6, borderRadius: '50%', background: 'rgba(192,132,252,0.55)', display: 'block' }} />
                    )}
                  </span>
                  <span style={{ fontSize: '0.72rem', lineHeight: 1, opacity: i === currentIndex ? 0.9 : 0.4, fontWeight: 600, maxWidth: 44, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {(k.kun || k.on || '').split('、')[0].split('・')[0].replace(/[〜～.]/g, '') || ''}
                  </span>
                </button>
              ))}
            </div>

            {/* mini-test */}
            {lessonKanji.length >= 2 && !miniTestActive && (
              <button
                className="btn btn-secondary"
                style={{ marginTop: 12, fontSize: '0.82rem', width: '100%' }}
                onClick={() => startMiniTest(lessonKanji)}
              >
                mini test 🎯 (3 questions)
              </button>
            )}
            {miniTestActive && !miniTestDone && miniTestQs.length > 0 && (() => {
              const q = miniTestQs[miniTestIdx]
              return (
                <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 16, background: 'rgba(244,114,182,0.06)', border: '1.5px solid rgba(244,114,182,0.18)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', marginBottom: 8, textAlign: 'center' }}>
                    question {miniTestIdx + 1} / {miniTestQs.length}
                  </div>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, textAlign: 'center', marginBottom: 10, color: 'var(--text-main)', lineHeight: 1.2 }}>
                    {q.kanji}
                  </div>
                  <div key={miniTestIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {q.options.map((opt) => {
                      const isSelected = miniTestSelected === opt.meaning
                      const isCorrect = opt.meaning === q.meaning
                      let bg = 'rgba(255,255,255,0.25)'
                      let color = 'var(--text-main)'
                      if (miniTestSelected !== null) {
                        if (isCorrect) { bg = 'rgba(16,185,129,0.2)'; color = 'var(--correct-text)' }
                        else if (isSelected) { bg = 'rgba(244,63,94,0.2)'; color = 'var(--incorrect-text)' }
                        else { bg = 'rgba(192,132,252,0.05)'; color = 'var(--text-light)' }
                      }
                      return (
                        <button
                          key={`${miniTestIdx}-${opt.meaning}`}
                          onClick={() => handleMiniAnswer(opt.meaning)}
                          className="glass-sm"
                          style={{ padding: '8px 6px', borderRadius: 10, border: 'none', cursor: miniTestSelected !== null ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 800, background: bg, color, transition: 'all 0.2s', minHeight: 44, pointerEvents: miniTestSelected !== null ? 'none' : 'auto', textAlign: 'center' }}
                        >
                          {opt.meaning}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
            {miniTestActive && miniTestDone && (
              <div ref={miniTestResultRef} style={{ marginTop: 12, padding: '14px 16px', borderRadius: 16, background: 'rgba(244,114,182,0.06)', border: '1.5px solid rgba(244,114,182,0.18)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>
                  {miniTestScore === miniTestQs.length ? '🌟' : miniTestScore >= miniTestQs.length * 0.67 ? '🌸' : '💪'}
                </div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-main)', marginBottom: 4 }}>
                  {miniTestScore} / {miniTestQs.length} correct
                </div>
                {calculateQuizXP(miniTestScore, miniTestQs.length) > 0 && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>
                    +{calculateQuizXP(miniTestScore, miniTestQs.length)} XP ⚡
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', flex: 1 }}
                    onClick={() => startMiniTest(lessonKanji)}
                  >
                    try again 🔁
                  </button>
                  <Link to={`/quiz/kanji?lesson=${selectedLesson}`} className="btn btn-cute" style={{ fontSize: '0.8rem', flex: 1, textAlign: 'center' }}>
                    kanji quiz ✨
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* bottom actions */}
          <div style={{ marginTop: 22, marginBottom: 90 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <Link to={`/quiz/kanji?lesson=${selectedLesson}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center', fontSize: '0.88rem' }}>
                quiz ✨
              </Link>
              <Link to={`/kanji/practice?lesson=${selectedLesson}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.88rem' }}>
                practice ✍️
              </Link>
            </div>
            <Link to="/" className="btn btn-secondary" style={{ display: 'block', textAlign: 'center', fontSize: '0.85rem' }}>
              home 🏠
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  keyHint: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 50,
    background: 'rgba(168,85,247,0.08)', color: 'var(--text-light)',
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.02em',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
    padding: '8px 0',
  },
  headerKanjiDecor: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerKanjiChar: {
    fontSize: '2.8rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1,
    filter: 'drop-shadow(0 2px 8px rgba(192,132,252,0.35))',
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  titleJp: {
    fontSize: '0.9rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },

  // lesson selection grid
  lessonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: 12,
  },
  lessonCard: {
    padding: '12px 10px 10px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
  },
  lessonCardHovered: {
    transform: 'translateY(-2px)',
  },
  lessonCardLocked: {
    opacity: 0.55,
    cursor: 'default',
    filter: 'grayscale(0.5)',
  },
  lockedOverlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(1px)',
    WebkitBackdropFilter: 'blur(1px)',
  },
  lessonNum: {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.1)',
    padding: '3px 12px',
    borderRadius: 50,
    display: 'inline-block',
    marginBottom: 10,
    letterSpacing: '0.03em',
  },
  lessonTitleJp: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 4,
  },
  lessonCount: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    marginBottom: 10,
  },
  lessonPreview: {
    fontSize: '1.5rem',
    color: 'var(--text-main)',
    letterSpacing: '0.12em',
    lineHeight: 1.6,
    wordBreak: 'break-all',
  },

  // top nav
  topNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  backBtn: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    transition: 'color 0.2s ease',
    minHeight: 44,
  },
  lessonSwitcher: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  lessonSwBtn: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.08)',
    border: '1px solid rgba(168, 85, 247, 0.2)',
    cursor: 'pointer',
    padding: '5px 12px',
    borderRadius: 50,
    transition: 'all 0.2s ease',
    minHeight: 44,
  },
  lessonBadge: {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: 'white',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    padding: '5px 16px',
    borderRadius: 50,
    boxShadow: '0 2px 8px rgba(244,114,182,0.3)',
  },

  // counter
  counter: {
    textAlign: 'center',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    marginBottom: 12,
    letterSpacing: '0.02em',
  },
  counterCurrent: {
    color: 'var(--text-main)',
    fontWeight: 900,
    fontSize: '1rem',
  },
  counterSep: {
    color: 'var(--text-light)',
  },

  // main kanji card
  mainCard: {
    maxWidth: 360,
    margin: '0 auto',
    padding: '28px 20px 24px',
    textAlign: 'center',
    borderRadius: 24,
  },
  kanjiCharWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: '8px 0',
  },
  kanjiChar: {
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
    filter: 'drop-shadow(0 4px 14px rgba(192,132,252,0.2))',
    userSelect: 'none',
    transition: 'filter 0.2s ease',
  },
  kanjiMeaning: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    marginBottom: 20,
    letterSpacing: '0.02em',
  },

  // readings
  readingRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
    marginBottom: 20,
    background: 'var(--tint)',
    borderRadius: 16,
    padding: '16px 12px',
  },
  readingBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  readingDivider: {
    width: 1,
    height: 50,
    background: 'rgba(192,132,252,0.25)',
    margin: '0 4px',
  },
  readingLabel: {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  readingValue: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    letterSpacing: '0.05em',
  },
  readingRomaji: {
    fontSize: '0.82rem',
    color: 'var(--text-light)',
    fontStyle: 'italic',
    fontWeight: 600,
    marginTop: 2,
  },
  readingHint: {
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 500,
    opacity: 0.7,
  },

  // examples
  examplesSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTop: '1px solid rgba(192,132,252,0.15)',
  },
  examplesTitle: {
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  examplesDot: {
    width: 20,
    height: 1,
    background: 'rgba(192,132,252,0.4)',
    display: 'inline-block',
  },
  examplesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    alignItems: 'stretch',
  },
  exampleRow: {
    display: 'flex',
    gap: 12,
    background: 'rgba(192,132,252,0.07)',
    borderRadius: 10,
    padding: '7px 12px',
    alignItems: 'center',
  },
  exampleWord: {
    fontSize: '1rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    minWidth: 56,
    flexShrink: 0,
  },
  exampleRomaji: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    lineHeight: 1.3,
  },
  exampleMeaning: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    lineHeight: 1.3,
  },
  mnnVocabSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTop: '1px solid rgba(192,132,252,0.15)',
  },
  mnnVocabItem: {
    display: 'flex',
    gap: 10,
    background: 'rgba(244,114,182,0.06)',
    borderRadius: 10,
    padding: '7px 12px',
    alignItems: 'center',
  },
  mnnVocabKanji: {
    fontSize: '1.15rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    minWidth: 60,
    flexShrink: 0,
    letterSpacing: '0.03em',
  },
  mnnVocabLesson: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#f472b6',
    background: 'rgba(244,114,182,0.1)',
    padding: '2px 7px',
    borderRadius: 50,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    textDecoration: 'none',
    cursor: 'pointer',
  },

  // stroke order
  strokeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid rgba(192,132,252,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  strokeHeader: {
    marginBottom: 12,
    width: '100%',
  },
  strokeTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  strokeToggleText: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  strokeBadge: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'white',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    padding: '3px 10px',
    borderRadius: 50,
    boxShadow: '0 2px 6px rgba(244,114,182,0.25)',
  },

  // arrow navigation
  arrowNav: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    margin: '18px 0 10px',
  },
  arrowBtn: {
    padding: '10px 20px',
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 16,
    transition: 'all 0.2s ease',
    letterSpacing: '0.02em',
    minHeight: 44,
  },
  arrowBtnHovered: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    boxShadow: '0 0 0 1.5px rgba(192,132,252,0.4)',
    transform: 'scale(1.04)',
  },
  arrowDisabled: {
    opacity: 0.3,
    cursor: 'default',
    transform: 'none',
  },
  arrowProgress: {
    display: 'flex',
    gap: 5,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 120,
  },
  arrowDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--tint-strong)',
    transition: 'all 0.2s ease',
  },
  arrowDotActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    width: 10,
    height: 10,
    boxShadow: '0 0 6px rgba(244,114,182,0.5)',
  },
  arrowDotDone: {
    background: 'rgba(192,132,252,0.5)',
  },

  // mini grid thumbnail gallery
  miniGridSection: {
    margin: '8px 0 16px',
  },
  miniGridLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'lowercase',
    letterSpacing: '0.04em',
  },
  miniGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
  },
  miniBtn: {
    width: 46,
    height: 56,
    fontSize: '1.35rem',
    fontWeight: 800,
    border: '1.5px solid rgba(192,132,252,0.2)',
    cursor: 'pointer',
    borderRadius: 12,
    color: 'var(--text-main)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(192,132,252,0.08)',
    overflow: 'hidden',
  },
  miniBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35)',
    transform: 'scale(1.08)',
  },
  miniBtnDone: {
    opacity: 0.65,
  },

  bottomActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
    marginBottom: 90,
    flexWrap: 'wrap',
  },

  // legacy (kept for safety)
  strokesInfo: {
    marginTop: 12,
    fontSize: '0.75rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  strokesLabel: { color: 'var(--text-light)', fontWeight: 800 },
}
