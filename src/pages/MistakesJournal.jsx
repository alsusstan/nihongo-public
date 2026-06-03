import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { loadDifficultWords, saveDifficultWords } from '../hooks/useWordTracker'

// Derive pattern insights from the difficult words list
function computeInsights(words) {
  if (words.length === 0) return null

  // Lesson breakdown (words that have a lesson field)
  const lessonMap = {}
  words.forEach(w => {
    if (w.lesson) {
      if (!lessonMap[w.lesson]) lessonMap[w.lesson] = { count: 0, misses: 0 }
      lessonMap[w.lesson].count++
      lessonMap[w.lesson].misses += w.missCount || 1
    }
  })
  const topLessons = Object.entries(lessonMap)
    .sort((a, b) => b[1].misses - a[1].misses)
    .slice(0, 5)
    .map(([lesson, data]) => ({ lesson: parseInt(lesson, 10), ...data }))

  // Source breakdown
  const sourceMap = {}
  words.forEach(w => {
    const src = w.source || 'vocab'
    if (!sourceMap[src]) sourceMap[src] = 0
    sourceMap[src] += w.missCount || 1
  })
  const topSource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0]

  // Top trouble words
  const topWords = [...words].sort((a, b) => (b.missCount || 1) - (a.missCount || 1)).slice(0, 3)

  // Insight message
  let insight = null
  if (topLessons.length > 0) {
    insight = `Lesson ${topLessons[0].lesson} gives you the most trouble`
  } else if (topSource) {
    insight = `Most mistakes come from ${topSource[0]} quizzes`
  }

  return { topLessons, topWords, topSource, insight }
}

const SORT_OPTIONS = [
  { key: 'recent', label: 'most recent' },
  { key: 'missed', label: 'most missed' },
  { key: 'alpha', label: 'alphabetical' },
]

const QUIZ_TYPES = [
  { key: 'all', label: 'all' },
  { key: 'vocab', label: 'vocab', match: s => !s || s === 'vocab' || s === 'search' || s === 'daily' || s === 'vocab-quiz' || s === 'n5-quiz' || s === 'sprint' || s === 'quiz' || s === 'lesson' || s === 'typing' || s === 'flash-cards' },
  { key: 'kana', label: 'kana', match: s => s === 'kana' },
  { key: 'kanji', label: 'kanji', match: s => s === 'kanji' },
  { key: 'grammar', label: 'grammar', match: s => s === 'grammar' },
]

export default function MistakesJournal() {
  const isMobile = useIsMobile()
  const [words, setWords] = useState(loadDifficultWords)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('missed')
  const [searchQuery, setSearchQuery] = useState('')
  const [learnedSet, setLearnedSet] = useState(new Set())
  const [showInsights, setShowInsights] = useState(true)

  const insights = useMemo(() => computeInsights(words), [words])

  const grouped = useMemo(() => {
    const groups = {}
    words.forEach(w => {
      const key = w.source || 'vocab'
      if (!groups[key]) groups[key] = []
      groups[key].push(w)
    })
    return groups
  }, [words])

  const sources = Object.keys(grouped)

  const activeType = QUIZ_TYPES.find(t => t.key === filter) || QUIZ_TYPES[0]

  const sorted = useMemo(() => {
    let base = filter === 'all'
      ? [...words]
      : words.filter(w => activeType.match && activeType.match(w.source || 'vocab'))
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      base = base.filter(w =>
        (w.japanese || '').toLowerCase().includes(q) ||
        (w.romaji || '').toLowerCase().includes(q) ||
        (w.russian || '').toLowerCase().includes(q) ||
        (w.kanji || '').toLowerCase().includes(q)
      )
    }
    if (sort === 'missed') return base.sort((a, b) => (b.missCount || 1) - (a.missCount || 1))
    if (sort === 'alpha') return base.sort((a, b) => (a.japanese || '').localeCompare(b.japanese || ''))
    // 'recent' — keep insertion order (already most recent appended last)
    return base.reverse()
  }, [words, filter, sort, activeType, searchQuery])

  const wordKey = (w) => `${w.japanese}-${w.romaji}-${w.lesson ?? ''}`

  const markLearned = (word) => {
    setLearnedSet(prev => {
      const next = new Set(prev)
      const key = wordKey(word)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const confirmLearned = (word) => {
    // Remove only the specific entry (homonym-safe: match by lesson when available)
    const updated = words.filter(w =>
      !(w.japanese === word.japanese && w.romaji === word.romaji &&
        (w.lesson == null || word.lesson == null || w.lesson === word.lesson))
    )
    setWords(updated)
    saveDifficultWords(updated)
    setLearnedSet(prev => {
      const next = new Set(prev)
      next.delete(wordKey(word))
      return next
    })
  }


  const clearAll = () => {
    if (!confirm('Clear all difficult words? This cannot be undone.')) return
    setWords([])
    saveDifficultWords([])
  }

  return (
    <div className="page">
      <style>{`
        @keyframes learnedPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .learned-pop { animation: learnedPop 0.3s ease; }
        @media (prefers-reduced-motion: reduce) {
          .learned-pop { animation: none; }
        }
      `}</style>

      <div style={s.header} className="animate-fadeInUp">
        <h1 style={s.title}>
          <span>📋</span> mistakes journal <span style={s.titleJp}>まちがいノート</span>
        </h1>
        <p style={s.subtitle}>every mistake is a step toward mastery</p>
      </div>

      {words.length === 0 ? (
        <div className="glass animate-fadeInUp" style={s.emptyCard}>
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: 8 }}>🌸</span>
          <p style={s.emptyTitle}>完璧です！</p>
          <p style={s.emptyText}>no mistakes on record!</p>
          <p style={s.emptySubtext}>
            words you get wrong in quizzes will appear here for review.
            keep practicing and they'll disappear one by one!
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            <Link to="/quiz/vocab" className="btn btn-cute">
              vocab quiz 📝
            </Link>
            <Link to="/quiz/weak" className="btn btn-secondary">
              weak sprint 🔥
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* stats bar */}
          <div className="glass-sm animate-fadeInUp" style={s.statsBar}>
            <div style={s.statItem}>
              <span style={s.statNum}>{words.length}</span>
              <span style={s.statLabel}>total</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.statItem}>
              <span style={{ ...s.statNum, color: 'var(--incorrect-text)' }}>
                {words.length > 0 ? Math.max(...words.map(w => w.missCount || 1)) : 0}
              </span>
              <span style={s.statLabel}>max misses</span>
            </div>
            <div style={s.statDivider} />
            <div style={s.statItem}>
              <span style={{ ...s.statNum, color: 'var(--correct-text)' }}>
                {words.length > 0 ? Math.round((words.filter(w => (w.hitCount || 0) >= 1).length / words.length) * 100) : 0}%
              </span>
              <span style={s.statLabel}>seen correct</span>
            </div>
            {sources.length > 1 && sources.map(src => (
              <div key={src} style={s.statItem}>
                <span style={{ ...s.statNum, color: 'var(--text-light)' }}>{grouped[src].length}</span>
                <span style={s.statLabel}>{src}</span>
              </div>
            ))}
          </div>

          {/* insights panel */}
          {insights && (
            <div className="glass-sm animate-fadeInUp" style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden' }}>
              <button
                onClick={() => setShowInsights(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', color: 'var(--text-main)', minHeight: 44,
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📊</span> error patterns
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', transition: 'transform 0.2s', transform: showInsights ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
              </button>

              {showInsights && (
                <div style={{ padding: '0 14px 14px' }}>
                  {/* insight callout */}
                  {insights.insight && (
                    <div style={{
                      padding: '7px 12px', borderRadius: 10, marginBottom: 10,
                      background: 'rgba(244,114,182,0.1)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)',
                    }}>
                      💡 {insights.insight}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                    {/* Lesson breakdown */}
                    {insights.topLessons.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                          by lesson
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {insights.topLessons.map(({ lesson, count, misses }) => {
                            const maxMisses = insights.topLessons[0].misses
                            const barW = Math.round((misses / maxMisses) * 100)
                            return (
                              <Link
                                key={lesson}
                                to={`/lessons/${lesson}`}
                                style={{ textDecoration: 'none', display: 'block' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', minWidth: 28 }}>L{lesson}</span>
                                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(192,132,252,0.12)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${barW}%`, background: 'linear-gradient(90deg, #f472b6, #c084fc)', borderRadius: 3 }} />
                                  </div>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', minWidth: 40, textAlign: 'right' }}>{count} words</span>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Top trouble words */}
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        top trouble words
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {insights.topWords.map((w, i) => {
                          const missColor = (w.missCount || 1) >= 5 ? 'var(--incorrect-text)' : (w.missCount || 1) >= 3 ? 'var(--gold-text)' : '#f472b6'
                          return (
                            <div key={w.japanese + i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', minWidth: 14, fontWeight: 900 }}>{i + 1}.</span>
                              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {((w.kanji || w.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}
                              </span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: missColor, flexShrink: 0 }}>
                                {w.missCount || 1}×
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* controls row */}
          <div style={{ ...s.controlsRow, ...(isMobile ? { flexDirection: 'column', gap: 8 } : {}) }} className="animate-fadeInUp">
            {/* text search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', opacity: 0.5 }}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
                placeholder="поиск слов..." aria-label="поиск слов"
                autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                style={{
                  width: '100%', padding: `8px ${searchQuery ? '44px' : '12px'} 8px 34px`, borderRadius: 12,
                  border: '1.5px solid rgba(192,132,252,0.25)', background: 'var(--glass-bg)',
                  fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} aria-label="clear search"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem', padding: '6px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              )}
            </div>

            {/* quiz type filter chips */}
            <div style={s.filterRow}>
              {QUIZ_TYPES.map(t => {
                const count = t.key === 'all' ? words.length
                  : words.filter(w => t.match && t.match(w.source || 'vocab')).length
                if (t.key !== 'all' && count === 0) return null
                return (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    style={{ ...s.chip, ...(filter === t.key ? s.chipActive : {}) }}
                  >
                    {t.label}{count > 0 && t.key !== 'all' ? ` ${count}` : ''}
                  </button>
                )
              })}
            </div>

            {/* sort selector */}
            <div style={s.sortRow}>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key)}
                  style={{ ...s.sortChip, ...(sort === opt.key ? s.sortChipActive : {}) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* word list */}
          <div style={s.list}>
            {sorted.map((w, i) => {
              const key = wordKey(w)
              const isMarked = learnedSet.has(key)
              const missCount = w.missCount || 1
              const hitCount = w.hitCount || 0
              const missColor = missCount >= 5 ? 'var(--incorrect-text)' : missCount >= 3 ? 'var(--gold-text)' : '#f472b6'

              return (
                <div
                  key={key}
                  className="glass-sm animate-fadeInUp"
                  style={{
                    ...s.wordCard,
                    animationDelay: `${Math.min(i * 0.03, 0.5)}s`,
                    ...(isMarked ? {
                      background: 'rgba(16,185,129,0.08)',
                      borderColor: 'rgba(16,185,129,0.3)',
                    } : {}),
                  }}
                >
                  {/* flashcard front */}
                  <div style={s.wordMain}>
                    <div style={s.wordTop}>
                      <div style={s.wordJp}>{((w.kanji || w.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim()}</div>
                      {w.romaji && (
                        <div style={s.wordRomaji}>{(w.romaji || '').replace(/\s*\[[^\]]*\]/g, '').trim()}</div>
                      )}
                    </div>
                    <div style={s.wordRu}>{w.russian}</div>

                    {/* miss/hit stats */}
                    <div style={s.wordStats}>
                      <span style={{ ...s.missTag, color: missColor, background: `${missColor}18` }}>
                        {missCount}× missed
                      </span>
                      {hitCount > 0 && (
                        <span style={s.hitTag}>
                          {hitCount}× correct ✓
                        </span>
                      )}
                      {w.source && (
                        <span style={s.sourceTag}>{w.source}</span>
                      )}
                      {w.lesson && (
                        <Link to={`/lessons/${w.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', padding: '2px 8px', borderRadius: 50, background: 'rgba(244,114,182,0.1)' }}>
                          L{w.lesson} →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* action buttons */}
                  <div style={s.wordActions}>
                    {isMarked ? (
                      <>
                        <button
                          onClick={() => confirmLearned(w)}
                          style={s.confirmBtn}
                          title="confirm — remove from list"
                          aria-label="confirm — remove from list"
                        >
                          remove ✓
                        </button>
                        <button
                          onClick={() => markLearned(w)}
                          style={s.cancelBtn}
                          title="cancel"
                          aria-label="cancel"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => markLearned(w)}
                        style={s.markBtn}
                        title="mark as learned"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {sorted.length === 0 && searchQuery.trim() && (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-light)', fontWeight: 700, fontSize: '0.95rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔍</div>
              нет слов по запросу «{searchQuery}»
            </div>
          )}

          {/* progress tip */}
          {words.length > 0 && sorted.length > 0 && (
            <div className="glass-sm animate-fadeInUp" style={s.tipCard}>
              <span style={{ fontSize: '1.1rem' }}>💡</span>
              <span style={s.tipText}>
                tap ✓ on a word when you feel confident — then confirm to remove it!
              </span>
            </div>
          )}

          {/* actions */}
          <div style={s.actions}>
            <Link to="/quiz/weak" className="btn btn-cute">
              тренировать weak words 🔥
            </Link>
            <Link to="/review" className="btn btn-secondary">
              practice with flashcards 🃏
            </Link>
            <button onClick={clearAll} className="btn-hover" style={s.clearBtn}>
              clear all entries
            </button>
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 90 }}>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.88rem' }}>
          home 🏠
        </Link>
      </div>
    </div>
  )
}

const s = {
  header: { textAlign: 'center', marginBottom: 20, padding: '8px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
    flexWrap: 'wrap',
  },
  titleJp: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },

  // Empty state
  emptyCard: {
    padding: '36px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 6,
  },
  emptyTitle: { fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-light)', marginBottom: 4 },
  emptyText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' },
  emptySubtext: {
    fontSize: '0.88rem', color: 'var(--text-light)', fontWeight: 500,
    lineHeight: 1.5, maxWidth: 320,
  },

  // Stats bar
  statsBar: {
    display: 'flex', justifyContent: 'center', gap: 16, padding: '14px 18px',
    marginBottom: 12, flexWrap: 'wrap', alignItems: 'center',
  },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statNum: { fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' },
  statLabel: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'lowercase' },
  statDivider: {
    width: 1, height: 28, background: 'rgba(192,132,252,0.2)', flexShrink: 0,
  },

  // Controls
  controlsRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, marginBottom: 14,
  },
  filterRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  sortRow: { display: 'flex', gap: 4, flexWrap: 'wrap' },

  chip: {
    padding: '5px 14px', borderRadius: 50, border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'rgba(192,132,252,0.08)', fontSize: '0.8rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    minHeight: 44,
  },
  chipActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent',
  },
  sortChip: {
    padding: '4px 10px', borderRadius: 50, border: '1px solid rgba(192,132,252,0.2)',
    background: 'none', fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--text-light)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    minHeight: 44,
  },
  sortChipActive: {
    background: 'rgba(192,132,252,0.15)', color: 'var(--text-light)',
    border: '1px solid rgba(192,132,252,0.4)',
  },

  // Word list
  list: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  wordCard: {
    display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 14,
    border: '1px solid rgba(192,132,252,0.15)', transition: 'all 0.2s ease',
  },

  wordMain: { flex: 1, minWidth: 0 },
  wordTop: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 },
  wordJp: { fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' },
  wordRomaji: { fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic' },
  wordRu: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },

  wordStats: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  missTag: {
    fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50,
  },
  hitTag: {
    fontSize: '0.75rem', fontWeight: 700, color: 'var(--correct-text)',
    background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 50,
  },
  sourceTag: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)',
    background: 'rgba(192,132,252,0.1)', padding: '2px 8px', borderRadius: 50,
  },

  wordActions: {
    display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'center',
  },
  markBtn: {
    width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.4)',
    background: 'rgba(16,185,129,0.1)', color: 'var(--correct-text)', fontSize: '1rem',
    fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0,
    fontFamily: 'inherit',
  },
  confirmBtn: {
    padding: '4px 10px', borderRadius: 50, border: '1.5px solid var(--correct-text)',
    background: 'rgba(16,185,129,0.15)', color: 'var(--correct-text)', fontSize: '0.78rem',
    fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    whiteSpace: 'nowrap', minHeight: 44,
  },
  cancelBtn: {
    padding: '4px 10px', borderRadius: 50, border: '1px solid rgba(200,200,200,0.3)',
    background: 'none', color: 'var(--text-light)', fontSize: '0.78rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    minHeight: 44,
  },

  // Tip card
  tipCard: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
    marginBottom: 14, textAlign: 'left',
  },
  tipText: { fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-light)', lineHeight: 1.4 },

  // Actions
  actions: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  clearBtn: {
    padding: '6px 16px', borderRadius: 50, border: '1.5px solid rgba(239,68,68,0.3)',
    background: 'rgba(239,68,68,0.05)', color: 'var(--incorrect-text)', fontSize: '0.72rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    minHeight: 44,
  },
}
