import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { lessons } from '../data/lessons'
import { kanji as kanjiData } from '../data/kanji'
import { strokeData } from '../data/strokeOrder'
import { supplementaryVocab } from '../data/supplementary'
import { loadDifficultWords, saveDifficultWords } from '../hooks/useWordTracker'
import { useIsMobile } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { copyTextToClipboard } from '../utils/clipboard'

const stripBr = s => (s || '').replace(/\[.*?\]/g, '').trim()

export default function VocabSearch() {
  const isMobile = useIsMobile()
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
  const [selectedType, setSelectedType] = useState(null)
  const [tab, setTab] = useState('words') // 'words', 'grammar', or 'kanji'
  const [exportOpen, setExportOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(copiedTimerRef.current), [])
  const [showKana, setShowKana] = useState(false)
  const [expandedWordKey, setExpandedWordKey] = useState(null)
  const [difficultWords, setDifficultWords] = useState(() => loadDifficultWords())
  const [markedAllMsg, setMarkedAllMsg] = useState(null)
  const markedAllTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(markedAllTimerRef.current), [])
  const exportRef = useRef(null)

  // close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [exportOpen])

  const isWordDifficult = useCallback((w) => {
    return difficultWords.some(d =>
      stripBr(d.japanese) === stripBr(w.japanese) && stripBr(d.romaji) === stripBr(w.romaji) &&
      (d.lesson == null || w.lessonId == null || d.lesson === w.lessonId)
    )
  }, [difficultWords])

  const toggleDifficultWord = useCallback((w) => {
    const current = loadDifficultWords()
    const idx = current.findIndex(d =>
      stripBr(d.japanese) === stripBr(w.japanese) && stripBr(d.romaji) === stripBr(w.romaji) &&
      (d.lesson == null || w.lessonId == null || d.lesson === w.lessonId)
    )
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      current.push({
        japanese: w.japanese,
        kanji: w.kanji,
        romaji: w.romaji,
        russian: w.russian,
        lesson: w.lessonId,
        source: 'search',
        missCount: 1,
        hitCount: 0,
        addedAt: new Date().toISOString(),
        lastMissed: new Date().toISOString(),
      })
    }
    saveDifficultWords(current)
    setDifficultWords(current)
  }, [])

  const allWords = useMemo(() => {
    const main = lessons.flatMap(l =>
      l.vocabulary.map(w => ({ ...w, lessonId: l.id }))
    )
    const supp = Object.entries(supplementaryVocab).flatMap(([lid, data]) =>
      data.words.map(w => ({ ...w, lessonId: parseInt(lid, 10), _supp: true }))
    )
    return [...main, ...supp]
  }, [])

  const allGrammar = useMemo(() =>
    lessons.flatMap(l =>
      l.grammar.map(g => ({ ...g, lessonId: l.id }))
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

  const getWordCategory = (w) => {
    if (w.type) return w.type // 'гл. I', 'гл. II', 'гл. III'
    const jp = w.japanese || ''
    if (jp.includes('[な]')) return 'na-adj'
    const canonical = (w.kanji || jp).replace(/[。．！？…（）[\]～〜]/g, '')
    if (/い$/.test(canonical) && !canonical.includes('。')) return 'i-adj'
    return 'noun'
  }

  const results = useMemo(() => {
    if (tab === 'words') {
      let pool = allWords
      if (selectedLessons.length > 0) {
        pool = pool.filter(w => selectedLessons.includes(w.lessonId))
      }
      if (selectedType) {
        pool = pool.filter(w => getWordCategory(w) === selectedType)
      }
      if (!query.trim()) return pool
      const q = query.trim().toLowerCase()
      return pool.filter(w =>
        w.japanese?.toLowerCase().includes(q) ||
        w.romaji?.toLowerCase().includes(q) ||
        w.russian?.toLowerCase().includes(q) ||
        w.kanji?.toLowerCase().includes(q)
      )
    } else {
      let pool = allGrammar
      if (selectedLessons.length > 0) {
        pool = pool.filter(g => selectedLessons.includes(g.lessonId))
      }
      if (!query.trim()) return pool
      const q = query.trim().toLowerCase()
      return pool.filter(g =>
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
  }, [query, selectedLessons, selectedType, allWords, allGrammar, tab])

  const kanjiResults = useMemo(() => {
    if (tab !== 'kanji') return []
    if (!query.trim()) return kanjiData
    const q = query.trim().toLowerCase()
    return kanjiData.filter(k =>
      k.kanji.includes(query.trim()) ||
      k.meaning?.toLowerCase().includes(q) ||
      k.kun?.toLowerCase().includes(q) ||
      k.on?.toLowerCase().includes(q) ||
      String(k.lesson) === q.replace(/[^\d]/g, '')
    )
  }, [query, tab])

  const exportableResults = useMemo(() =>
    tab === 'words' ? results.slice(0, 100) : results.slice(0, 50)
  , [results, tab])

  const copyToClipboard = useCallback((format) => {
    if (exportableResults.length === 0) return

    let text = ''
    if (tab === 'words') {
      if (format === 'anki') {
        text = exportableResults.map(w =>
          `${w.japanese}${w.kanji ? ` (${w.kanji})` : ''}\t${(w.romaji || '').replace(/\s*\[.*?\]/g, '').trim()} — ${w.russian}`
        ).join('\n')
      } else if (format === 'list') {
        text = exportableResults.map(w =>
          `${w.japanese}${w.kanji ? ` (${w.kanji})` : ''} — ${(w.romaji || '').replace(/\s*\[.*?\]/g, '').trim()} — ${w.russian}`
        ).join('\n')
      } else if (format === 'japanese') {
        text = exportableResults.map(w => w.japanese).join('\n')
      }
    } else {
      text = exportableResults.map(g =>
        `${g.pattern} — ${g.meaning}${g.examples?.[0] ? `\n  例: ${g.examples[0].jp} (${g.examples[0].ru})` : ''}`
      ).join('\n\n')
    }

    copyTextToClipboard(text).then((success) => {
      if (!success) return
      setCopied(true)
      clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    })
    setExportOpen(false)
  }, [exportableResults, tab])

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <h1 style={s.title}>
          <span>🔍</span> search <span style={s.titleJp}>けんさく</span>
        </h1>
        <p style={s.subtitle}>find any word or grammar pattern</p>
      </div>

      {/* tabs */}
      <div className="animate-fadeInUp" style={s.tabRow}>
        <button onClick={() => setTab('words')} style={{ ...s.tabBtn, ...(tab === 'words' ? s.tabBtnActive : {}) }}>
          words ({allWords.length})
        </button>
        <button onClick={() => setTab('grammar')} style={{ ...s.tabBtn, ...(tab === 'grammar' ? s.tabBtnActive : {}) }}>
          grammar ({allGrammar.length})
        </button>
        <button onClick={() => setTab('kanji')} style={{ ...s.tabBtn, ...(tab === 'kanji' ? s.tabBtnActive : {}) }}>
          kanji ({kanjiData.length})
        </button>
      </div>

      {/* search input */}
      <div className="glass animate-fadeInUp" style={s.searchCard}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'words' ? 'japanese, romaji or russian...' : tab === 'grammar' ? 'pattern, meaning or example...' : 'kanji 日, meaning, reading kun/on...'}
          aria-label="search vocabulary"
          autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
          style={s.input}
          autoFocus
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div style={s.resultCount} role="status" aria-live="polite">
            {tab === 'kanji' ? `${kanjiResults.length} kanji` : `${results.length} ${results.length === 1 ? (tab === 'words' ? 'word' : 'pattern') : (tab === 'words' ? 'words' : 'patterns')}`}
            {query && ` for "${query}"`}
          </div>
          {(query || selectedLessons.length > 0 || selectedType !== null) && (
            <button
              onClick={() => { setQuery(''); setSelectedLessons([]); setSelectedType(null) }}
              style={s.resetBtn}
            >
              сбросить ✕
            </button>
          )}
        </div>
      </div>

      {/* mark all + practice in sprint */}
      {tab === 'words' && results.length > 0 && results.length <= 100 && (
        <div className="animate-fadeInUp" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const current = loadDifficultWords()
              let added = 0
              results.slice(0, 100).forEach(w => {
                const exists = current.some(d =>
                  stripBr(d.japanese) === stripBr(w.japanese) && stripBr(d.romaji) === stripBr(w.romaji) &&
                  (d.lesson == null || w.lessonId == null || d.lesson === w.lessonId)
                )
                if (!exists) {
                  current.push({ japanese: w.japanese, kanji: w.kanji, romaji: w.romaji, russian: w.russian, lesson: w.lessonId, source: 'search', missCount: 1, hitCount: 0, addedAt: new Date().toISOString(), lastMissed: new Date().toISOString() })
                  added++
                }
              })
              saveDifficultWords(current)
              setDifficultWords(current)
              setMarkedAllMsg(added > 0 ? `✓ +${added} добавлено` : '✓ уже все добавлены')
              clearTimeout(markedAllTimerRef.current)
              markedAllTimerRef.current = setTimeout(() => setMarkedAllMsg(null), 2200)
            }}
            style={{ padding: '5px 14px', borderRadius: 50, border: '1.5px solid rgba(217,119,6,0.3)', background: markedAllMsg ? 'rgba(16,185,129,0.1)' : 'rgba(217,119,6,0.07)', color: markedAllMsg ? 'var(--correct-text)' : '#d97706', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44 }}
          >
            {markedAllMsg || '★ добавить все в сложные'}
          </button>
          {difficultWords.length > 0 && (
            <Link to="/quiz/weak" style={{ padding: '5px 14px', borderRadius: 50, border: '1.5px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.07)', color: 'var(--incorrect-text)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              ⚡ sprint по сложным
            </Link>
          )}
        </div>
      )}

      {/* export button */}
      {results.length > 0 && (
        <div className="animate-fadeInUp" style={s.exportWrap} ref={exportRef}>
          <div style={s.exportBtnWrap}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              style={s.exportBtn}
            >
              {copied ? '✓ copied!' : `📋 copy ${exportableResults.length} ${tab === 'words' ? 'words' : 'patterns'}`}
            </button>
          </div>
          {exportOpen && (
            <div className="glass-sm animate-pop" style={s.exportDropdown}>
              {tab === 'words' ? (
                <>
                  <button onClick={() => copyToClipboard('anki')} style={s.exportOption}>
                    <span style={s.exportOptionIcon}>📇</span>
                    <div>
                      <div style={s.exportOptionTitle}>anki (TSV)</div>
                      <div style={s.exportOptionDesc}>front: japanese — back: romaji + russian</div>
                    </div>
                  </button>
                  <button onClick={() => copyToClipboard('list')} style={s.exportOption}>
                    <span style={s.exportOptionIcon}>📝</span>
                    <div>
                      <div style={s.exportOptionTitle}>full list</div>
                      <div style={s.exportOptionDesc}>japanese — romaji — russian</div>
                    </div>
                  </button>
                  <button onClick={() => copyToClipboard('japanese')} style={s.exportOption}>
                    <span style={s.exportOptionIcon}>🇯🇵</span>
                    <div>
                      <div style={s.exportOptionTitle}>japanese only</div>
                      <div style={s.exportOptionDesc}>just the japanese words</div>
                    </div>
                  </button>
                </>
              ) : (
                <button onClick={() => copyToClipboard('grammar')} style={s.exportOption}>
                  <span style={s.exportOptionIcon}>📝</span>
                  <div>
                    <div style={s.exportOptionTitle}>copy grammar</div>
                    <div style={s.exportOptionDesc}>patterns with meanings & examples</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
              {id}{locked ? ' 🔒' : ''}
            </button>
          )
        })}
      </div>

      {/* practice button when single lesson selected */}
      {selectedLessons.length === 1 && (
        <div className="animate-fadeInUp" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          {tab === 'words' ? (
            <Link to={`/quiz/vocab?lesson=${selectedLessons[0]}`} className="btn btn-cute" style={{ fontSize: '0.85rem' }}>
              vocab quiz →
            </Link>
          ) : (
            <Link to={`/quiz/grammar?lesson=${selectedLessons[0]}`} className="btn btn-cute" style={{ fontSize: '0.85rem' }}>
              grammar quiz →
            </Link>
          )}
          <Link to={`/quiz/fill-in?lesson=${selectedLessons[0]}`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            fill-in →
          </Link>
          {tab === 'words' && (
            <Link to={`/quiz/te-form?lesson=${selectedLessons[0]}`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              て-form →
            </Link>
          )}
          {tab === 'words' && (
            <Link to="/quiz/conjugation" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              conj →
            </Link>
          )}
          <Link to={`/review?lesson=${selectedLessons[0]}`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            cards 🃏
          </Link>
          <Link to={`/lessons/${selectedLessons[0]}`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            lesson {selectedLessons[0]} →
          </Link>
        </div>
      )}

      {/* word type filter chips (words tab only) */}
      {tab === 'words' && (
        <div className="animate-fadeInUp" style={{ ...s.chipsWrap, marginTop: -8 }}>
          {[
            { key: null, label: 'all types' },
            { key: 'гл. I', label: 'гл. I' },
            { key: 'гл. II', label: 'гл. II' },
            { key: 'гл. III', label: 'гл. III' },
            { key: 'i-adj', label: 'い-прил.' },
            { key: 'na-adj', label: 'な-прил.' },
            { key: 'noun', label: 'сущ.' },
          ].map(({ key, label }) => (
            <button
              key={String(key)}
              onClick={() => setSelectedType(key)}
              style={{
                ...s.chip,
                ...(selectedType === key ? s.chipTypeActive : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* kana toggle (mobile only) */}
      {tab === 'words' && isMobile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <button
            onClick={() => setShowKana(v => !v)}
            style={{
              fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 50,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44,
              background: showKana ? 'linear-gradient(135deg,#f472b6,#c084fc)' : 'rgba(192,132,252,0.12)',
              color: showKana ? 'white' : 'var(--text-light)',
            }}
          >
            {showKana ? 'скрыть кану' : 'показать кану あ'}
          </button>
        </div>
      )}

      {/* kanji results */}
      {tab === 'kanji' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {kanjiResults.slice(0, 80).map((k, i) => (
            <Link
              key={`${k.kanji}-${i}`}
              to={`/kanji?kanji=${encodeURIComponent(k.kanji)}`}
              className="glass-sm animate-fadeInUp"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', textDecoration: 'none', color: 'inherit', animationDelay: `${Math.min(i * 0.015, 0.4)}s` }}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1, minWidth: 44, textAlign: 'center', color: 'var(--text-main)', fontWeight: 900 }}>{k.kanji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 }}>{k.meaning}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {k.kun && <span>訓 {k.kun}</span>}
                  {k.on && <span>音 {k.on}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(168,85,247,0.1)', padding: '2px 10px', borderRadius: 50 }}>
                  ур.{k.lesson}
                </span>
                {strokeData[k.kanji]?.strokes && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', opacity: 0.7 }}>
                    {strokeData[k.kanji].strokes}画
                  </span>
                )}
              </div>
            </Link>
          ))}
          {kanjiResults.length === 0 && query.trim() && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: 600 }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🤔</div>
              не найдено
            </div>
          )}
          {kanjiResults.length > 80 && (
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, padding: '8px 0' }}>
              showing 80 of {kanjiResults.length} — уточните запрос
            </div>
          )}
        </div>
      )}

      {/* results list */}
      {tab !== 'kanji' && <div style={s.resultsList}>
        {tab === 'words' ? results.slice(0, 100).map((w, i) => {
          const wKey = `${w.lessonId}-${w.japanese}-${i}`
          const isExpanded = expandedWordKey === wKey
          const category = getWordCategory(w)
          return (
            <div
              key={wKey}
              className="glass-sm animate-fadeInUp"
              style={{ ...s.wordCard, animationDelay: `${Math.min(i * 0.02, 0.5)}s`, cursor: 'pointer', flexDirection: 'column', gap: 6 }}
              onClick={() => setExpandedWordKey(isExpanded ? null : wKey)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-label={`${w.kanji || w.japanese} — ${w.russian}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedWordKey(isExpanded ? null : wKey) } }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px' }}>
                {/* kanji (primary) */}
                <span style={s.wordJp}>{w.kanji || w.japanese}</span>
                {/* kana — always on desktop, toggle on mobile */}
                {(w.kanji && (!isMobile || showKana)) && (
                  <span style={s.wordKana}>{w.japanese}</span>
                )}
                <span style={s.wordRomaji}>{(w.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</span>
                <span style={{ ...s.wordRu, flex: 1 }}>{w.russian}</span>
                <Link to={`/lessons/${w.lessonId}`} style={{ ...s.wordLesson, textDecoration: 'none' }}>L{w.lessonId}{w._supp ? '+' : ''}</Link>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleDifficultWord(w) }}
                  style={{
                    ...s.markBtn,
                    ...(isWordDifficult(w) ? s.markBtnActive : {}),
                  }}
                  title={isWordDifficult(w) ? 'remove from difficult' : 'mark as difficult'}
                >
                  {isWordDifficult(w) ? '★' : '☆'}
                </button>
              </div>
              {isExpanded && (
                <div style={s.wordDetail}>
                  {w.kanji && <span style={s.wordDetailField}><span style={s.wordDetailLabel}>кана:</span> {w.japanese}</span>}
                  <span style={s.wordDetailField}><span style={s.wordDetailLabel}>ромадзи:</span> {(w.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</span>
                  <span style={{ ...s.wordDetailField, ...s.typeBadge }}>{category}</span>
                  <span style={s.wordDetailField}><span style={s.wordDetailLabel}>урок:</span> <Link to={`/lessons/${w.lessonId}`} style={{ color: '#f472b6', fontWeight: 700, textDecoration: 'none' }}>L{w.lessonId} →</Link></span>
                </div>
              )}
            </div>
          )
        }) : results.slice(0, 50).map((g, i) => (
          <div
            key={`${g.lessonId}-${g.pattern}-${i}`}
            className="glass-sm animate-fadeInUp"
            style={{ ...s.grammarCard, animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}
          >
            <div style={s.grammarHeader}>
              <span style={s.grammarPattern}>{g.pattern}</span>
              <Link to={`/lessons/${g.lessonId}`} style={{ ...s.wordLesson, textDecoration: 'none' }}>lesson {g.lessonId}</Link>
            </div>
            {g.patternJp && <div style={s.grammarPatternJp}>{g.patternJp}</div>}
            <div style={s.grammarMeaning}>{g.meaning}</div>
            {g.examples?.[0] && (
              <div style={s.grammarExample}>
                <div style={s.grammarExJp}>{g.examples[0].jp}</div>
                <div style={s.grammarExRomaji}>{g.examples[0].romaji}</div>
                <div style={s.grammarExRu}>{g.examples[0].ru}</div>
              </div>
            )}
          </div>
        ))}
        {results.length > 100 && (
          <div style={s.moreNote}>
            showing 100 of {results.length} results — refine your search
          </div>
        )}
        {results.length === 0 && (query || selectedLessons.length > 0 || selectedType !== null) && (
          <div style={s.emptyState}>
            <span style={{ fontSize: '2rem' }}>🐱</span>
            <p>{query ? `no words found for "${query}"` : 'no words match your filters'}</p>
          </div>
        )}
      </div>}

      <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 90 }}>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          home 🏠
        </Link>
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
    marginTop: 4, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)',
  },
  resetBtn: {
    padding: '3px 10px', borderRadius: 50, border: '1.5px solid rgba(244,63,94,0.3)',
    background: 'rgba(244,63,94,0.06)', color: 'var(--incorrect-text)', fontSize: '0.72rem',
    fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44,
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
  chipTypeActive: {
    background: 'linear-gradient(135deg, #818cf8, #c084fc)', color: 'white',
    border: '1.5px solid transparent', boxShadow: '0 2px 8px rgba(129,140,248,0.25)',
  },
  resultsList: {
    display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24,
  },
  wordCard: {
    padding: '12px 16px', display: 'flex',
    alignItems: 'center', gap: '4px 12px',
  },
  wordDetail: {
    display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center',
    padding: '8px 10px', borderRadius: 10,
    background: 'rgba(192,132,252,0.07)', border: '1px solid rgba(192,132,252,0.15)',
  },
  wordDetailField: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)',
  },
  wordDetailLabel: {
    fontWeight: 700, color: 'var(--text-light)',
  },
  typeBadge: {
    padding: '1px 8px', borderRadius: 50,
    background: 'linear-gradient(135deg,#818cf8,#c084fc)', color: 'white',
    fontWeight: 700, fontSize: '0.72rem',
  },
  wordMain: {
    display: 'flex', alignItems: 'baseline', gap: 6,
  },
  wordJp: {
    fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)',
  },
  wordKana: {
    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)',
  },
  wordRomaji: {
    fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic',
  },
  wordRu: {
    fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', flex: 1,
  },
  wordLesson: {
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)',
    background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50,
  },
  moreNote: {
    textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)',
    padding: 12, fontStyle: 'italic',
  },
  emptyState: {
    textAlign: 'center', padding: 32, color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600,
  },
  exportWrap: {
    textAlign: 'center', marginBottom: 12, position: 'relative',
  },
  exportBtnWrap: {
    display: 'flex', justifyContent: 'center',
  },
  exportBtn: {
    padding: '6px 16px', borderRadius: 50, border: '1.5px solid rgba(168,85,247,0.3)',
    background: 'rgba(168,85,247,0.08)', fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--text-light)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
    minHeight: 44,
  },
  exportDropdown: {
    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
    marginTop: 6, padding: 6, zIndex: 20, minWidth: 'min(240px, 80vw)',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  exportOption: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 10, border: 'none', background: 'transparent',
    cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'inherit',
    textAlign: 'left', width: '100%', minHeight: 44,
  },
  exportOptionIcon: { fontSize: '1.1rem', flexShrink: 0 },
  exportOptionTitle: {
    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)',
  },
  exportOptionDesc: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)',
  },
  markBtn: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
    color: 'var(--text-light)', padding: '0 4px', transition: 'all 0.2s',
    fontFamily: 'inherit', flexShrink: 0, marginLeft: 'auto', minHeight: 44, minWidth: 44,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  markBtnActive: {
    color: 'var(--gold-text)', transform: 'scale(1.15)',
  },
  tabRow: {
    display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12,
  },
  tabBtn: {
    padding: '6px 16px', borderRadius: 50, border: '1.5px solid rgba(192,132,252,0.3)',
    background: 'var(--tint-medium)', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
    minHeight: 44,
  },
  tabBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent', boxShadow: '0 2px 8px rgba(236,72,153,0.25)',
  },
  grammarCard: {
    padding: '14px 16px',
  },
  grammarHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4,
  },
  grammarPattern: {
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)',
  },
  grammarPatternJp: {
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 4,
  },
  grammarMeaning: {
    fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8,
  },
  grammarExample: {
    padding: '8px 12px', borderRadius: 10,
    background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.1)',
  },
  grammarExJp: {
    fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)',
  },
  grammarExRomaji: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic',
  },
  grammarExRu: {
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2,
  },
}
