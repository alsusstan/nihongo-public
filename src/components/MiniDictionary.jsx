import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { strokeData } from '../data/strokeOrder'
import { useIsTablet } from '../hooks/useIsMobile'

export default function MiniDictionary() {
  const isTablet = useIsTablet()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const [allWords, setAllWords] = useState([])
  const [allKanji, setAllKanji] = useState([])
  const dataLoaded = useRef(false)
  const focusTimerRef = useRef(null)

  // Load data lazily on first open
  useEffect(() => {
    if (!open || dataLoaded.current) return
    let cancelled = false
    dataLoaded.current = true
    Promise.all([
      import('../data/lessons'),
      import('../data/kanji'),
      import('../data/supplementary'),
    ]).then(([{ lessons }, { kanji }, { supplementaryVocab }]) => {
      if (cancelled) return
      const main = lessons.flatMap(l => l.vocabulary.map(w => ({ ...w, lessonId: l.id })))
      const supp = Object.entries(supplementaryVocab).flatMap(([lid, data]) =>
        data.words.map(w => ({ ...w, lessonId: parseInt(lid, 10) }))
      )
      setAllWords([...main, ...supp])
      setAllKanji(kanji)
    })
    return () => { cancelled = true }
  }, [open])

  // keyboard shortcut: Ctrl+K or Cmd+K to toggle
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // auto-focus input when opened
  useEffect(() => {
    clearTimeout(focusTimerRef.current)
    if (open) {
      setQuery('')
      focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 100)
    }
    return () => clearTimeout(focusTimerRef.current)
  }, [open])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()

    // search vocabulary
    const wordResults = allWords.filter(w =>
      w.japanese?.toLowerCase().includes(q) ||
      w.romaji?.toLowerCase().includes(q) ||
      w.russian?.toLowerCase().includes(q) ||
      w.kanji?.toLowerCase().includes(q)
    ).slice(0, 6).map(w => ({ ...w, _type: 'word' }))

    // search kanji
    const kanjiResults = allKanji.filter(k =>
      k.kanji?.includes(q) ||
      k.on?.toLowerCase().includes(q) ||
      k.kun?.toLowerCase().includes(q) ||
      k.meaning?.toLowerCase().includes(q)
    ).slice(0, 2).map(k => ({ ...k, _type: 'kanji' }))

    return [...wordResults, ...kanjiResults].slice(0, 8)
  }, [query, allWords, allKanji])

  // Hide on search page (full search already there — FAB is redundant and covers content)
  if (pathname === '/search') return null

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={s.fab}
        title="Quick search (⌘K)"
        aria-label="Open mini dictionary"
      >
        📖
      </button>
    )
  }

  return (
    <>
      {/* backdrop */}
      <div style={s.backdrop} onClick={() => setOpen(false)} role="button" tabIndex={0} aria-label="close dictionary" onKeyDown={e => { if (e.key === 'Escape' || e.key === 'Enter') setOpen(false) }} />

      {/* popup */}
      <div style={{ ...s.popup, ...(isTablet ? s.popupTablet : {}) }} className="animate-fadeInUp" role="dialog" aria-modal="true" aria-label="quick dictionary lookup">
        <div style={s.popupHeader}>
          <span style={s.popupTitle}>quick lookup</span>
          <button onClick={() => setOpen(false)} style={s.closeBtn} aria-label="close dictionary">✕</button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="type to search..."
          aria-label="search dictionary"
          autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
          style={s.input}
        />

        <div style={s.resultsList}>
          {results.length > 0 ? (
            results.map((item, i) =>
              item._type === 'kanji' ? (
                <div key={`kanji-${item.kanji}-${i}`} style={s.resultItem}>
                  <div style={s.resultMain}>
                    <span style={s.kanjiChar}>{item.kanji}</span>
                    <span style={s.resultKanji}>{item.meaning}</span>
                  </div>
                  <div style={s.resultRomaji}>
                    {item.on && `ON: ${item.on}`}
                    {item.on && item.kun && ' | '}
                    {item.kun && `KUN: ${item.kun}`}
                  </div>
                  <div style={s.resultBottom}>
                    <span style={s.kanjiTag}>kanji</span>
                    {strokeData[item.kanji]?.strokes && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', opacity: 0.7 }}>{strokeData[item.kanji].strokes}画</span>
                    )}
                    <Link to={`/kanji?kanji=${encodeURIComponent(item.kanji)}`} onClick={() => setOpen(false)} style={{ ...s.resultLesson, textDecoration: 'none', cursor: 'pointer' }}>L{item.lesson} →</Link>
                  </div>
                </div>
              ) : (
                <div key={`${item.lessonId}-${item.japanese}-${i}`} style={s.resultItem}>
                  <div style={s.resultMain}>
                    <span style={s.resultJp}>{item.kanji || (item.japanese || '').replace(/\[.*?\]/g, '').trim()}</span>
                    {item.kanji && <span style={s.resultKanji}>{(item.japanese || '').replace(/\[.*?\]/g, '').trim()}</span>}
                  </div>
                  <div style={s.resultRomaji}>{(item.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</div>
                  <div style={s.resultBottom}>
                    <span style={s.resultRu}>{item.russian}</span>
                    <Link to={`/lessons/${item.lessonId}`} onClick={() => setOpen(false)} style={{ ...s.resultLesson, textDecoration: 'none', cursor: 'pointer' }}>L{item.lessonId} →</Link>
                  </div>
                </div>
              )
            )
          ) : query.trim() ? (
            allWords.length === 0 ? (
              <div style={s.empty}>loading... 🌸</div>
            ) : (
              <div style={s.empty}>no results for "{query}"</div>
            )
          ) : (
            <div style={s.hint}>
              <span style={{ fontSize: '1.2rem' }}>🔍</span>
              <span>search by japanese, romaji or russian</span>
              <span style={s.shortcutHint}>⌘K to toggle</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const s = {
  fab: {
    position: 'fixed',
    bottom: 'calc(98px + env(safe-area-inset-bottom, 0px))',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    border: 'none',
    fontSize: '1.3rem',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(236, 72, 153, 0.35)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    zIndex: 1000,
  },
  popup: {
    position: 'fixed',
    bottom: 'calc(158px + env(safe-area-inset-bottom, 0px))',
    right: 20,
    left: 20,
    maxWidth: 420,
    marginLeft: 'auto',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid var(--glass-border)',
    borderRadius: 20,
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
    zIndex: 1001,
    padding: 16,
    maxHeight: '70vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  popupTablet: {
    left: 'auto',
    width: 520,
    maxWidth: 'calc(100vw - 40px)',
    padding: 20,
  },
  popupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  popupTitle: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(192, 132, 252, 0.1)',
    color: 'var(--text-light)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    fontWeight: 700,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 14,
    border: '2px solid rgba(192, 132, 252, 0.3)',
    background: 'var(--glass-bg)',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  resultsList: {
    marginTop: 10,
    overflowY: 'auto',
    maxHeight: '45vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  resultItem: {
    padding: '10px 12px',
    borderRadius: 12,
    background: 'rgba(192, 132, 252, 0.06)',
    border: '1px solid rgba(192, 132, 252, 0.12)',
  },
  resultMain: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  resultJp: {
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--text-main)',
  },
  resultKanji: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  resultRomaji: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  resultBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  resultRu: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  resultLesson: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.1)',
    padding: '2px 7px',
    borderRadius: 50,
  },
  empty: {
    textAlign: 'center',
    padding: 20,
    color: 'var(--text-light)',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  hint: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 20,
    color: 'var(--text-light)',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  shortcutHint: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    background: 'rgba(192, 132, 252, 0.1)',
    padding: '2px 8px',
    borderRadius: 6,
    marginTop: 4,
  },
  kanjiChar: {
    fontSize: '1.4rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginRight: 6,
  },
  kanjiTag: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#f472b6',
    background: 'rgba(244, 114, 182, 0.1)',
    padding: '2px 7px',
    borderRadius: 50,
    textTransform: 'uppercase',
  },
}
