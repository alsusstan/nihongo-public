import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { lessons } from '../data/lessons'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { copyTextToClipboard } from '../utils/clipboard'

function highlightPattern(text, pattern) {
  if (!pattern || !text) return text
  // Extract key part: strip leading 〜/～ and whitespace
  const key = pattern.replace(/^[〜～\s]+/, '').replace(/\s/g, '').split('／')[0]
  if (!key || key.length < 2) return text
  const idx = text.indexOf(key)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color: '#f472b6', fontWeight: 900 }}>{text.slice(idx, idx + key.length)}</strong>
      {text.slice(idx + key.length)}
    </>
  )
}

export default function GrammarExplorer() {
  const { unlockedMax } = useUnlockedLessons()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [selectedLessons, setSelectedLessons] = useState(() => {
    const lessonParam = searchParams.get('lesson')
    if (lessonParam) {
      const id = parseInt(lessonParam, 10)
      if (lessons.some(l => l.id === id)) return [id]
    }
    return []
  })
  const [expandedCard, setExpandedCard] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)
  const [sortMode, setSortMode] = useState('lesson')
  const [copiedAll, setCopiedAll] = useState(false)
  const cardsRef = useRef(null)
  const copyAllTimerRef = useRef(null)
  const copyKeyTimerRef = useRef(null)
  useEffect(() => () => { clearTimeout(copyAllTimerRef.current); clearTimeout(copyKeyTimerRef.current) }, [])

  // Scroll to cards list when lesson filter changes (but not on first render)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (selectedLessons.length > 0 && cardsRef.current) {
      cardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedLessons])

  const handleCopyAll = () => {
    const text = results.map(g => `${g.pattern}${g.patternJp ? ' ' + g.patternJp : ''} — ${g.meaning}`).join('\n')
    copyTextToClipboard(text).then((success) => {
      if (!success) return
      setCopiedAll(true)
      clearTimeout(copyAllTimerRef.current)
      copyAllTimerRef.current = setTimeout(() => setCopiedAll(false), 1800)
    })
  }

  const allGrammar = useMemo(() =>
    lessons.flatMap(l =>
      (l.grammar || []).map(g => ({ ...g, lessonId: l.id }))
    ), []
  )

  const lessonIds = useMemo(() =>
    [...new Set(lessons.map(l => l.id))].sort((a, b) => a - b), []
  )

  const toggleLesson = (id) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const results = useMemo(() => {
    let pool = allGrammar
    if (selectedLessons.length > 0) {
      pool = pool.filter(g => selectedLessons.includes(g.lessonId))
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      pool = pool.filter(g =>
        g.pattern?.toLowerCase().includes(q) ||
        g.patternJp?.toLowerCase().includes(q) ||
        g.meaning?.toLowerCase().includes(q) ||
        g.explanation?.toLowerCase().includes(q) ||
        g.examples?.some(ex =>
          ex.jp?.toLowerCase().includes(q) ||
          ex.romaji?.toLowerCase().includes(q) ||
          ex.ru?.toLowerCase().includes(q)
        )
      )
    }
    if (sortMode === 'alpha') {
      pool = [...pool].sort((a, b) => (a.pattern || '').localeCompare(b.pattern || '', 'ja'))
    }
    return pool
  }, [query, selectedLessons, allGrammar, sortMode])

  const toggleExpand = (key) => {
    setExpandedCard(prev => prev === key ? null : key)
  }

  const handleCopy = (e, key, text) => {
    e.stopPropagation()
    copyTextToClipboard(text).then((success) => {
      if (!success) return
      setCopiedKey(key)
      clearTimeout(copyKeyTimerRef.current)
      copyKeyTimerRef.current = setTimeout(() => setCopiedKey(null), 1500)
    })
  }

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <h1 style={s.title}>
          <span>文</span> grammar explorer <span style={s.titleJp}>ぶんぽう</span>
        </h1>
        <p style={s.subtitle}>browse all grammar patterns across lessons</p>
      </div>

      {/* search input */}
      <div className="glass animate-fadeInUp" style={s.searchCard}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="pattern, explanation or example..." aria-label="search grammar patterns"
          autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
          style={s.input}
          autoFocus
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        />
        <div style={s.resultCount} role="status" aria-live="polite">
          {results.length} {results.length === 1 ? 'pattern' : 'patterns'}
          {query && ` for "${query}"`}
          {results.length > 0 && (
            <>
              <button
                onClick={() => setShowAll(p => !p)}
                style={{ marginLeft: 10, fontSize: '0.72rem', fontWeight: 800, color: showAll ? '#f472b6' : 'var(--text-light)', background: showAll ? 'rgba(244,114,182,0.1)' : 'rgba(168,85,247,0.08)', border: 'none', borderRadius: 10, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
              >
                {showAll ? 'collapse all −' : 'expand all +'}
              </button>
              <button
                onClick={handleCopyAll}
                style={{ marginLeft: 6, fontSize: '0.72rem', fontWeight: 800, color: copiedAll ? 'var(--correct-text)' : 'var(--text-light)', background: copiedAll ? 'rgba(16,185,129,0.1)' : 'rgba(168,85,247,0.08)', border: 'none', borderRadius: 10, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44 }}
              >
                {copiedAll ? '✓ скопировано' : '📋 copy all'}
              </button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 6 }}>
          {[{ key: 'lesson', label: 'по уроку' }, { key: 'alpha', label: 'по алфавиту' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortMode(key)}
              style={{
                padding: '2px 10px', borderRadius: 50, border: '1.5px solid rgba(192,132,252,0.3)',
                background: sortMode === key ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.08)',
                color: sortMode === key ? 'white' : 'var(--text-light)',
                fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', minHeight: 44,
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* lesson filter chips */}
      <div className="animate-fadeInUp" style={s.chipsWrap}>
        <button
          onClick={() => setSelectedLessons([])}
          style={{
            ...s.chip,
            ...(selectedLessons.length === 0 ? s.chipActive : {}),
          }}
        >
          all
        </button>
        {lessonIds.map(id => {
          const locked = id > unlockedMax
          return (
            <button
              key={id}
              onClick={() => toggleLesson(id)}
              style={{
                ...s.chip,
                ...(selectedLessons.includes(id) ? s.chipActive : {}),
                ...(locked ? { opacity: 0.45 } : {}),
              }}
              title={locked ? 'locked — unlock in Settings' : undefined}
            >
              L{id}{locked ? ' 🔒' : ''}
            </button>
          )
        })}
      </div>

      {/* practice button when single lesson selected */}
      {selectedLessons.length === 1 && (
        <div className="animate-fadeInUp" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <Link
            to={`/lessons/${selectedLessons[0]}`}
            className="btn btn-cute"
            style={{ fontSize: '0.85rem' }}
          >
            lesson {selectedLessons[0]} →
          </Link>
          <Link
            to={`/quiz/fill-in?lesson=${selectedLessons[0]}`}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            fill-in ✏️
          </Link>
          <Link
            to={`/quiz/grammar?lesson=${selectedLessons[0]}`}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            grammar quiz →
          </Link>
        </div>
      )}

      {/* grammar cards */}
      <div ref={cardsRef} style={s.cardsList}>
        {results.map((g, i) => {
          const key = `${g.lessonId}-${g.id || g.pattern}-${i}`
          const isExpanded = showAll || expandedCard === key

          return (
            <div
              key={key}
              className="glass animate-fadeInUp"
              style={{
                ...s.grammarCard,
                animationDelay: `${Math.min(i * 0.03, 0.6)}s`,
              }}
              onClick={() => toggleExpand(key)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-label={g.pattern}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(key) } }}
            >
              {/* compact view */}
              <div style={s.cardTop}>
                <div style={s.cardHeader}>
                  <div style={s.patternRow}>
                    <span style={s.patternText}>{g.pattern}</span>
                    <Link to={`/lessons/${g.lessonId}`} style={{ ...s.lessonBadge, textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>L{g.lessonId}</Link>
                  </div>
                  {g.patternJp && (
                    <div style={s.patternJp}>{g.patternJp}</div>
                  )}
                  <div style={s.meaning}>{g.meaning}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    style={{
                      ...s.copyBtn,
                      ...(copiedKey === key ? s.copyBtnDone : {}),
                    }}
                    onClick={(e) => handleCopy(e, key, g.pattern)}
                    title="copy pattern"
                    aria-label={copiedKey === key ? 'copied!' : 'copy pattern'}
                  >
                    {copiedKey === key ? '✓' : '⎘'}
                  </button>
                  <div style={s.expandIcon}>
                    {isExpanded ? '−' : '+'}
                  </div>
                </div>
              </div>

              {/* expanded details */}
              {isExpanded && (
                <div style={s.details} className="animate-fadeInUp">
                  <div style={s.explanation}>{g.explanation}</div>

                  {g.examples && g.examples.length > 0 && (
                    <div style={s.examplesWrap}>
                      <div style={s.examplesLabel}>examples</div>
                      {g.examples.map((ex, j) => (
                        <div key={j} style={s.exampleCard}>
                          <div style={s.exJp}>{highlightPattern(ex.jp, g.patternJp || g.pattern)}</div>
                          <div style={s.exRomaji}>{ex.romaji}</div>
                          <div style={s.exRu}>{ex.ru}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {results.length === 0 && query && (
          <div style={s.emptyState}>
            <span style={{ fontSize: '2rem' }}>🤔</span>
            <p>no grammar patterns found for "{query}"</p>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 90, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/quiz/grammar" className="btn btn-cute" style={{ fontSize: '0.85rem' }}>grammar quiz 文</Link>
        <Link to="/quiz/fill-in" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>fill-in ✏️</Link>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
      </div>
    </div>
  )
}

const s = {
  header: { textAlign: 'center', marginBottom: 16, padding: '8px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  titleJp: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },
  searchCard: { padding: 18, marginBottom: 12 },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: 16,
    border: '2px solid rgba(192,132,252,0.3)', background: 'var(--glass-bg)',
    fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.2s',
  },
  resultCount: {
    marginTop: 8, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textAlign: 'center',
  },
  chipsWrap: {
    display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
    marginBottom: 16, padding: '0 8px',
  },
  chip: {
    padding: '4px 12px', borderRadius: 14, border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'var(--tint-medium)', fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
    minHeight: 44, minWidth: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  chipActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent', boxShadow: '0 2px 8px rgba(236,72,153,0.25)',
  },
  cardsList: {
    display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24,
  },
  grammarCard: {
    padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s ease',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
  },
  cardHeader: { flex: 1, minWidth: 0 },
  patternRow: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3,
  },
  patternText: {
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3,
  },
  lessonBadge: {
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)',
    background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50,
    flexShrink: 0,
  },
  patternJp: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 3,
  },
  meaning: {
    fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.4,
  },
  expandIcon: {
    fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-light)', flexShrink: 0,
    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', background: 'rgba(192,132,252,0.1)',
  },
  copyBtn: {
    fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-light)', flexShrink: 0,
    width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', background: 'rgba(168,85,247,0.1)',
    border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
  },
  copyBtnDone: {
    background: 'rgba(16,185,129,0.15)', color: 'var(--correct-text)',
  },
  details: { marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(192,132,252,0.15)' },
  explanation: {
    fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.6,
    marginBottom: 12,
  },
  examplesWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  examplesLabel: {
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: 2,
  },
  exampleCard: {
    background: 'rgba(192,132,252,0.06)', borderRadius: 12, padding: '10px 14px',
  },
  exJp: {
    fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 3, lineHeight: 1.5,
  },
  exRomaji: {
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 3,
  },
  exRu: {
    fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.4,
  },
  emptyState: {
    textAlign: 'center', padding: 32, color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600,
  },
}
