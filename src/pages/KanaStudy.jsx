import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { hiragana, katakana } from '../data/kana'
import StrokeOrder from '../components/StrokeOrder'
import { useIsMobile } from '../hooks/useIsMobile'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { getStoredString, setStoredString } from '../utils/localSettings'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickUniqueKanaDistractors(pool, correctRomaji, limit = 3) {
  const seen = new Set([correctRomaji])
  const picked = []

  shuffle(pool).forEach(kana => {
    if (picked.length >= limit || seen.has(kana.romaji)) return
    seen.add(kana.romaji)
    picked.push(kana)
  })

  return picked
}

// Group basic kana by row
function groupByRow(kanaList) {
  const map = new Map()
  for (const k of kanaList) {
    if (!map.has(k.row)) map.set(k.row, [])
    map.get(k.row).push(k)
  }
  return Array.from(map.entries()).map(([row, chars]) => ({ row, chars }))
}

export default function KanaStudy() {
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()
  const initState = location.state || {}
  const { saveQuizResult } = useProgress()
  const { awardXP, calculateQuizXP } = useXP()

  const [mode, setMode] = useState(initState.mode || getStoredString('nihongo-kana-study-mode', 'hiragana')) // 'hiragana' | 'katakana'
  const [category, setCategory] = useState(() => getStoredString('nihongo-kana-study-category', 'basic')) // 'basic' | 'voiced' | 'combo'
  const [fullTestActive, setFullTestActive] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoveredArrow, setHoveredArrow] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const rowGridTouchX = useRef(null)
  const miniTestTimerRef = useRef(null)
  const resultScrollTimerRef = useRef(null)
  const miniTestResultRef = useRef(null)
  const xpAwardedRef = useRef(false)
  useEffect(() => () => {
    clearTimeout(miniTestTimerRef.current)
    clearTimeout(resultScrollTimerRef.current)
  }, [])

  // Mini-test state
  const [miniTestQs, setMiniTestQs] = useState([])
  const [miniTestIdx, setMiniTestIdx] = useState(0)
  const [miniTestSelected, setMiniTestSelected] = useState(null)
  const [miniTestScore, setMiniTestScore] = useState(0)
  const [miniTestDone, setMiniTestDone] = useState(false)
  const [miniTestActive, setMiniTestActive] = useState(false)

  const rows = useMemo(() => {
    const scriptData = mode === 'hiragana' ? hiragana : katakana
    const data = category === 'voiced' ? scriptData.dakuten
      : category === 'combo' ? scriptData.combo
      : scriptData.basic
    return groupByRow(data)
  }, [mode, category])

  // Build kana → counterpart kana lookup by position (same index = same sound)
  // Position-based avoids romaji collision: じ(index 6) → ジ(index 6), ぢ(index 11) → ヂ(index 11)
  const counterpartMap = useMemo(() => {
    const src = mode === 'hiragana' ? hiragana : katakana
    const tgt = mode === 'hiragana' ? katakana : hiragana
    const srcAll = [...src.basic, ...src.dakuten, ...src.combo]
    const tgtAll = [...tgt.basic, ...tgt.dakuten, ...tgt.combo]
    const map = {}
    srcAll.forEach((k, i) => { if (tgtAll[i]) map[k.kana] = tgtAll[i].kana })
    return map
  }, [mode])

  // If navigated from KanaChart with a specific kana, pre-select its row and index
  useEffect(() => {
    if (!initState.kana) return
    const scriptData = initState.mode === 'katakana' ? katakana : hiragana
    // search basic, dakuten, and combo
    for (const cat of [scriptData.basic, scriptData.dakuten, scriptData.combo]) {
      const allRows = groupByRow(cat)
      for (const { row, chars } of allRows) {
        const idx = chars.findIndex(c => c.kana === initState.kana)
        if (idx !== -1) {
          // switch to the right category tab too
          const catKey = cat === scriptData.basic ? 'basic' : cat === scriptData.dakuten ? 'voiced' : 'combo'
          setCategory(catKey)
          setSelectedRow(row)
          setCurrentIndex(idx)
          return
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentRow = selectedRow !== null ? rows.find(r => r.row === selectedRow) : null
  const chars = useMemo(() => currentRow ? currentRow.chars : [], [currentRow])
  const currentChar = chars[currentIndex] || null

  const goNext = useCallback(() => {
    setCurrentIndex(i => Math.min(chars.length - 1, i + 1))
  }, [chars.length])

  const goPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1))
  }, [])

  // keyboard navigation
  useEffect(() => {
    if (!selectedRow) return
    const handler = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedRow, goNext, goPrev])

  const selectRow = (rowName) => {
    setSelectedRow(rowName)
    setCurrentIndex(0)
    setMiniTestActive(false)
    setMiniTestDone(false)
    setMiniTestIdx(0)
    setMiniTestQs([])
    setMiniTestScore(0)
    setMiniTestSelected(null)
    xpAwardedRef.current = false
  }

  const resetModeState = (newMode) => {
    setMode(newMode); setSelectedRow(null); setCurrentIndex(0)
    setMiniTestActive(false); setMiniTestDone(false); setMiniTestIdx(0)
    setMiniTestQs([]); setMiniTestScore(0); setMiniTestSelected(null)
    setFullTestActive(false)
    xpAwardedRef.current = false
    setStoredString('nihongo-kana-study-mode', newMode)
  }

  const startFullTest = useCallback((resetXP = true) => {
    if (resetXP) xpAwardedRef.current = false
    const scriptData = mode === 'hiragana' ? hiragana : katakana
    const catData = category === 'voiced' ? scriptData.dakuten
      : category === 'combo' ? scriptData.combo
      : scriptData.basic
    const allPool = [...scriptData.basic, ...scriptData.dakuten, ...scriptData.combo]
    const sampled = shuffle([...catData])
    const qs = sampled.map(correct => {
      const distractors = pickUniqueKanaDistractors(allPool, correct.romaji)
      return { kana: correct.kana, romaji: correct.romaji, options: shuffle([correct, ...distractors]) }
    })
    setMiniTestQs(qs); setMiniTestIdx(0); setMiniTestSelected(null)
    setMiniTestScore(0); setMiniTestDone(false); setMiniTestActive(true)
    setFullTestActive(true)
  }, [mode, category])

  const startMiniTest = useCallback(() => {
    const allPool = (() => { const sd = mode === 'hiragana' ? hiragana : katakana; return [...sd.basic, ...sd.dakuten, ...sd.combo] })()
    const count = Math.min(3, chars.length)
    const sampled = shuffle([...chars]).slice(0, count)
    const qs = sampled.map(correct => {
      const distractors = pickUniqueKanaDistractors(allPool, correct.romaji)
      return { kana: correct.kana, romaji: correct.romaji, options: shuffle([correct, ...distractors]) }
    })
    setMiniTestQs(qs)
    setMiniTestIdx(0)
    setMiniTestSelected(null)
    setMiniTestScore(0)
    setMiniTestDone(false)
    setMiniTestActive(true)
  }, [chars, mode])

  const handleMiniAnswer = useCallback((romaji) => {
    if (miniTestSelected !== null) return
    setMiniTestSelected(romaji)
    const correct = romaji === miniTestQs[miniTestIdx].romaji
    const newScore = correct ? miniTestScore + 1 : miniTestScore
    if (correct) setMiniTestScore(s => s + 1)
    clearTimeout(miniTestTimerRef.current)
    miniTestTimerRef.current = setTimeout(() => {
      if (miniTestIdx + 1 >= miniTestQs.length) {
        const total = miniTestQs.length
        if (!xpAwardedRef.current) {
          xpAwardedRef.current = true
          saveQuizResult('kana', { score: newScore, total })
          const xp = calculateQuizXP(newScore, total)
          if (xp > 0) awardXP(xp, 'kana study', newScore === total && total > 0)
        }
        setMiniTestDone(true)
      } else {
        setMiniTestIdx(i => i + 1)
        setMiniTestSelected(null)
      }
    }, 700)
  }, [miniTestSelected, miniTestQs, miniTestIdx, miniTestScore, saveQuizResult, awardXP, calculateQuizXP])

  // Scroll to result card when mini-test completes
  useEffect(() => {
    clearTimeout(resultScrollTimerRef.current)
    if (miniTestDone && miniTestResultRef.current) {
      resultScrollTimerRef.current = setTimeout(() => miniTestResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
    return () => clearTimeout(resultScrollTimerRef.current)
  }, [miniTestDone])

  // Row index for prev/next row navigation
  const currentRowIdx = rows.findIndex(r => r.row === selectedRow)
  const prevRow = currentRowIdx > 0 ? rows[currentRowIdx - 1] : null
  const nextRow = currentRowIdx < rows.length - 1 ? rows[currentRowIdx + 1] : null

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <div style={s.headerKanaDecor}>
          <span style={s.headerKanaChar}>あ</span>
          <span style={s.headerKanaChar}>ア</span>
        </div>
        <h1 style={s.title}>
          kana study <span style={s.titleJp}>かなべんきょう</span>
        </h1>
        <p style={s.subtitle}>stroke order for hiragana & katakana</p>
      </div>

      {/* mode toggle */}
      <div style={s.toggleRow} className="animate-fadeInUp">
        <button
          onClick={() => resetModeState('hiragana')}
          style={{ ...s.toggleBtn, ...(mode === 'hiragana' ? s.toggleActive : {}) }}
        >
          ひらがな
        </button>
        <button
          onClick={() => resetModeState('katakana')}
          style={{ ...s.toggleBtn, ...(mode === 'katakana' ? s.toggleActive : {}) }}
        >
          カタカナ
        </button>
      </div>

      {/* category tabs */}
      {!selectedRow && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }} className="animate-fadeInUp">
          {[
            { key: 'basic', label: 'basic', jp: 'あ–ん', count: (mode === 'hiragana' ? hiragana : katakana).basic.length },
            { key: 'voiced', label: 'voiced', jp: 'が/ざ/だ', count: (mode === 'hiragana' ? hiragana : katakana).dakuten.length },
            { key: 'combo', label: 'combo', jp: 'きゃ/にゃ', count: (mode === 'hiragana' ? hiragana : katakana).combo.length },
          ].map(({ key, label, jp, count }) => (
            <button key={key} onClick={() => { setCategory(key); setStoredString('nihongo-kana-study-category', key); setSelectedRow(null); setFullTestActive(false); setMiniTestActive(false); setMiniTestDone(false) }}
              style={{ ...s.toggleBtn, maxWidth: 120, fontSize: '0.82rem', padding: '8px 14px',
                ...(category === key ? s.toggleActive : {}) }}>
              {label} <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>{jp} ({count})</span>
            </button>
          ))}
        </div>
      )}

      {/* row selection */}
      {!selectedRow && (
        <>
          {/* full test UI (when active without a selected row) */}
          {fullTestActive && miniTestActive && !miniTestDone && miniTestQs.length > 0 && (() => {
            const q = miniTestQs[miniTestIdx]
            return (
              <div className="glass animate-fadeInUp" style={{ padding: '20px 16px', borderRadius: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)' }}>
                    test all · {miniTestIdx + 1}/{miniTestQs.length}
                  </span>
                  <button onClick={() => { setFullTestActive(false); setMiniTestActive(false) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-light)', fontFamily: 'inherit', minHeight: 44, padding: '0 8px' }}>
                    ✕ exit
                  </button>
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 900, textAlign: 'center', marginBottom: 14, color: 'var(--text-main)' }}>{q.kana}</div>
                <div key={miniTestIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {q.options.map((opt) => {
                    const isSelected = miniTestSelected === opt.romaji
                    const isCorrect = opt.romaji === q.romaji
                    let bg = 'rgba(255,255,255,0.25)', color = 'var(--text-main)'
                    if (miniTestSelected !== null) {
                      if (isCorrect) { bg = 'rgba(16,185,129,0.2)'; color = 'var(--correct-text)' }
                      else if (isSelected) { bg = 'rgba(244,63,94,0.2)'; color = 'var(--incorrect-text)' }
                      else { bg = 'rgba(192,132,252,0.05)'; color = 'var(--text-light)' }
                    }
                    return (
                      <button key={opt.romaji} onClick={() => handleMiniAnswer(opt.romaji)} className="glass-sm"
                        style={{ padding: '12px 8px', borderRadius: 12, border: 'none', cursor: miniTestSelected !== null ? 'default' : 'pointer',
                          fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 800, background: bg, color, transition: 'all 0.2s', minHeight: 52,
                          pointerEvents: miniTestSelected !== null ? 'none' : 'auto' }}>
                        {opt.romaji}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}
          {fullTestActive && miniTestDone && (
            <div ref={miniTestResultRef} className="glass animate-fadeInUp" style={{ padding: '20px 16px', borderRadius: 20, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '2rem', marginBottom: 6 }}>{miniTestScore === miniTestQs.length ? '🌟' : miniTestScore >= miniTestQs.length * 0.7 ? '🌸' : '💪'}</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: 4 }}>{miniTestScore} / {miniTestQs.length}</div>
              {calculateQuizXP(miniTestScore, miniTestQs.length) > 0 && (
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 10 }}>+{calculateQuizXP(miniTestScore, miniTestQs.length)} XP ⚡</div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => startFullTest(false)}>try again 🔁</button>
                <button className="btn btn-cute" style={{ fontSize: '0.82rem' }} onClick={() => { setFullTestActive(false); setMiniTestActive(false); setMiniTestDone(false) }}>back to rows</button>
              </div>
            </div>
          )}

          <div
            className="animate-fadeInUp"
            onTouchStart={(e) => { rowGridTouchX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (rowGridTouchX.current === null) return
              const dx = e.changedTouches[0].clientX - rowGridTouchX.current
              rowGridTouchX.current = null
              if (Math.abs(dx) < 50) return
              resetModeState(dx < 0 ? 'katakana' : 'hiragana')
            }}
          >
            <div style={s.rowsGrid} className="lessons-grid">
              {rows.map(r => (
                <button
                  key={r.row}
                  className="glass glass-hover"
                  style={{
                    ...s.rowCard,
                    ...(hoveredRow === r.row ? s.rowCardHovered : {}),
                  }}
                  onMouseEnter={() => setHoveredRow(r.row)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onFocus={() => setHoveredRow(r.row)}
                  onBlur={() => setHoveredRow(null)}
                  onClick={() => selectRow(r.row)}
                >
                  <div style={s.rowName}>{r.row}</div>
                  <div style={s.rowPreview}>
                    {r.chars.map(c => c.kana).join(' ')}
                  </div>
                  <div style={s.rowCount}>{r.chars.length} characters</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-cute" style={{ fontSize: '0.85rem' }} onClick={startFullTest}>
              test all {rows.reduce((s, r) => s + r.chars.length, 0)} ✨
            </button>
            <Link to="/kana-chart" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>kana chart 📊</Link>
            <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </>
      )}

      {/* character viewer */}
      {selectedRow && currentChar && (
        <div className="animate-fadeInUp">
          {/* top nav */}
          <div style={s.topNav}>
            <button
              onClick={() => { setSelectedRow(null); setCurrentIndex(0) }}
              style={s.backBtn}
            >
              ← all rows
            </button>
            <div style={s.rowSwitcher}>
              {prevRow && (
                <button onClick={() => selectRow(prevRow.row)} style={s.rowSwBtn}>
                  ‹ {prevRow.row}
                </button>
              )}
              <span style={s.rowBadge}>{selectedRow}</span>
              {nextRow && (
                <button onClick={() => selectRow(nextRow.row)} style={s.rowSwBtn}>
                  {nextRow.row} ›
                </button>
              )}
            </div>
          </div>

          {/* row + char counter */}
          <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 4, letterSpacing: '0.04em' }}>
            строка {currentRowIdx + 1} из {rows.length}
          </div>
          <div style={s.counter}>
            <span style={s.counterCurrent}>{currentIndex + 1}</span>
            <span style={s.counterSep}> / </span>
            <span>{chars.length}</span>
          </div>

          {/* arrow navigation */}
          <div style={s.arrowNav}>
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
              {chars.map((c, i) => (
                <div
                  key={c.kana}
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
              disabled={currentIndex === chars.length - 1}
              onMouseEnter={() => setHoveredArrow('next')}
              onMouseLeave={() => setHoveredArrow(null)}
              onFocus={() => setHoveredArrow('next')}
              onBlur={() => setHoveredArrow(null)}
              style={{
                ...s.arrowBtn,
                ...(currentIndex === chars.length - 1 ? s.arrowDisabled : {}),
                ...(hoveredArrow === 'next' && currentIndex !== chars.length - 1 ? s.arrowBtnHovered : {}),
              }}
              className="glass"
            >
              next →
            </button>
          </div>
          {!isMobile && (
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <span style={s.keyHint}>⌨ ← →</span>
            </div>
          )}

          {/* main kana card */}
          <div
            key={`${mode}-${selectedRow}-${currentIndex}`}
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
              if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
                if (dx > 0) goPrev()
                else goNext()
              }
              touchStartX.current = null
              touchStartY.current = null
            }}
          >
            {/* kana character */}
            <div style={s.kanaCharWrap}>
              <div style={{
                ...s.kanaChar,
                fontSize: isMobile ? '6rem' : '8rem',
              }}>
                {currentChar.kana}
              </div>
            </div>

            {/* romaji */}
            <div style={s.kanaMeaning}>{currentChar.romaji}</div>

            {/* counterpart kana */}
            {counterpartMap[currentChar.kana] && (
              <div style={s.counterpartRow}>
                <span style={s.counterpartLabel}>
                  {mode === 'hiragana' ? 'katakana' : 'hiragana'}:
                </span>
                <span style={s.counterpartChar}>{counterpartMap[currentChar.kana]}</span>
              </div>
            )}

            {/* stroke order */}
            <div style={s.strokeSection}>
              <div style={s.strokeHeader}>
                <span style={s.strokeToggleText}>stroke order</span>
              </div>
              <StrokeOrder kanji={currentChar.kana} size={isMobile ? 160 : 200} autoPlay />
            </div>
          </div>

          {/* mini grid */}
          <div style={s.miniGridSection}>
            <div style={s.miniGridLabel}>all characters in {selectedRow}</div>
            <div style={s.miniGrid}>
              {chars.map((c, i) => (
                <button
                  key={c.kana}
                  onClick={() => setCurrentIndex(i)}
                  title={c.romaji}
                  aria-label={`${c.kana} — ${c.romaji}`}
                  aria-current={i === currentIndex ? 'true' : undefined}
                  style={{
                    ...s.miniBtn,
                    ...(i === currentIndex ? s.miniBtnActive : {}),
                    flexDirection: 'column', gap: 1,
                  }}
                  className={i === currentIndex ? '' : 'glass-sm'}
                >
                  <span>{c.kana}</span>
                  {counterpartMap[c.kana] && (
                    <span style={{ fontSize: '0.72rem', lineHeight: 1, opacity: i === currentIndex ? 0.85 : 0.4 }}>
                      {counterpartMap[c.kana]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {chars.length >= 2 && (
              <button
                className="btn btn-cute"
                style={{ marginTop: 14, fontSize: '0.85rem', width: '100%' }}
                onClick={() => navigate('/quiz/kana', { state: { rowKana: chars, mode } })}
              >
                quiz this row ✨
              </button>
            )}
            {chars.length >= 2 && !miniTestActive && (
              <button
                className="btn btn-secondary"
                style={{ marginTop: 8, fontSize: '0.82rem', width: '100%' }}
                onClick={startMiniTest}
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
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, textAlign: 'center', marginBottom: 10, color: 'var(--text-main)' }}>
                    {q.kana}
                  </div>
                  <div key={miniTestIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {q.options.map((opt) => {
                      const isSelected = miniTestSelected === opt.romaji
                      const isCorrect = opt.romaji === q.romaji
                      let bg = 'rgba(255,255,255,0.25)'
                      let color = 'var(--text-main)'
                      if (miniTestSelected !== null) {
                        if (isCorrect) { bg = 'rgba(16,185,129,0.2)'; color = 'var(--correct-text)' }
                        else if (isSelected) { bg = 'rgba(244,63,94,0.2)'; color = 'var(--incorrect-text)' }
                        else { bg = 'rgba(192,132,252,0.05)'; color = 'var(--text-light)' }
                      }
                      return (
                        <button
                          key={opt.romaji}
                          onClick={() => handleMiniAnswer(opt.romaji)}
                          className="glass-sm"
                          style={{ padding: '8px 4px', borderRadius: 10, border: 'none', cursor: miniTestSelected !== null ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 800, background: bg, color, transition: 'all 0.2s', minHeight: 44, pointerEvents: miniTestSelected !== null ? 'none' : 'auto' }}
                        >
                          {opt.romaji}
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
                    onClick={startMiniTest}
                  >
                    try again 🔁
                  </button>
                  <Link to="/quiz/kana" className="btn btn-cute" style={{ fontSize: '0.8rem', flex: 1, textAlign: 'center' }}>
                    kana quiz ✨
                  </Link>
                </div>
              </div>
            )}
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
  headerKanaDecor: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerKanaChar: {
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

  // mode toggle
  toggleRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  toggleBtn: {
    padding: '10px 22px',
    fontSize: '0.95rem',
    fontWeight: 800,
    border: 'none',
    borderRadius: 50,
    cursor: 'pointer',
    background: 'rgba(168, 85, 247, 0.08)',
    color: 'var(--text-light)',
    transition: 'all 0.2s ease',
    flex: 1,
    maxWidth: 180,
    minHeight: 44,
  },
  toggleActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    boxShadow: '0 2px 12px rgba(244,114,182,0.3)',
  },

  // row selection grid
  rowsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
    gap: 12,
  },
  rowCard: {
    padding: '20px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    borderRadius: 20,
  },
  rowCardHovered: {
    transform: 'translateY(-2px)',
  },
  rowName: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.1)',
    padding: '3px 12px',
    borderRadius: 50,
    display: 'inline-block',
    marginBottom: 10,
    letterSpacing: '0.03em',
  },
  rowPreview: {
    fontSize: '1.5rem',
    color: 'var(--text-main)',
    letterSpacing: '0.12em',
    lineHeight: 1.6,
    wordBreak: 'break-all',
    marginBottom: 6,
  },
  rowCount: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-light)',
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
  rowSwitcher: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  rowSwBtn: {
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
  rowBadge: {
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

  // main kana card
  mainCard: {
    maxWidth: 360,
    margin: '0 auto',
    padding: '28px 20px 24px',
    textAlign: 'center',
    borderRadius: 24,
  },
  kanaCharWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: '8px 0',
  },
  kanaChar: {
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
    filter: 'drop-shadow(0 4px 14px rgba(192,132,252,0.2))',
    userSelect: 'none',
    transition: 'filter 0.2s ease',
  },
  kanaMeaning: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    marginBottom: 8,
    letterSpacing: '0.02em',
  },
  counterpartRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 18, padding: '6px 18px', borderRadius: 50,
    background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.15)',
    width: 'fit-content', margin: '0 auto 18px',
  },
  counterpartLabel: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)',
    textTransform: 'lowercase', letterSpacing: '0.04em',
  },
  counterpartChar: {
    fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-light)', lineHeight: 1,
  },

  // stroke order
  strokeSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTop: '1px solid rgba(192,132,252,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  strokeHeader: {
    marginBottom: 12,
    width: '100%',
    textAlign: 'center',
  },
  strokeToggleText: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },

  // mini grid
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
    height: 54,
    fontSize: '1.35rem',
    fontWeight: 800,
    border: 'none',
    cursor: 'pointer',
    borderRadius: 12,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
  },
  miniBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35)',
    transform: 'scale(1.08)',
  },
}
