import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { hiragana, katakana } from '../data/kana'
import { getStoredString, setStoredString } from '../utils/localSettings'

const vowels = ['a', 'i', 'u', 'e', 'o']
const rows = ['', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w']
const rowLabels = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ']
const dakutenRows = ['g', 'z', 'd', 'b', 'p']
const dakutenLabels = ['が', 'ざ', 'だ', 'ば', 'ぱ']

// special romaji mappings
const specialReadings = {
  'si': 'shi', 'ti': 'chi', 'tu': 'tsu', 'hu': 'fu',
  'zi': 'ji', 'di': 'ji', 'du': 'zu',
}

function buildChart(data) {
  const map = {}
  const all = [...(data.basic || []), ...(data.dakuten || [])]
  // First writer wins so じ/ず take the 'ji'/'zu' keys (not ぢ/づ which come later)
  all.forEach(k => { if (!map[k.romaji]) map[k.romaji] = k.kana })
  // ぢ and づ share romaji with じ/ず — add row-specific alt keys so D-row shows the right kana
  // Store as {kana, romaji} objects so getKana can return the correct display romaji
  all
    .filter(k => k.row === 'だ行' || k.row === 'ダ行')
    .forEach(k => {
      const vowel = k.romaji.slice(-1) // 'ji'→'i', 'zu'→'u'
      if (vowel === 'i' || vowel === 'u') map['d' + vowel] = { kana: k.kana, romaji: k.romaji }
    })
  return map
}

function resolve(entry, fallbackRomaji) {
  if (!entry) return null
  if (typeof entry === 'object') return entry
  return { kana: entry, romaji: fallbackRomaji }
}

function getKana(map, consonant, vowel) {
  // try direct lookup
  const romaji = consonant + vowel
  const direct = map[romaji]
  if (direct) return resolve(direct, romaji)

  // try special readings
  for (const [alt, real] of Object.entries(specialReadings)) {
    if (real === romaji && map[alt]) return resolve(map[alt], real)
    if (alt === romaji && map[real]) return resolve(map[real], real)
  }

  // special cases
  if (consonant === '' && map[vowel]) return { kana: map[vowel], romaji: vowel }
  if (consonant === 'y' && (vowel === 'i' || vowel === 'e')) return null
  if (consonant === 'w' && vowel !== 'a' && vowel !== 'o') {
    if (vowel === 'o' && map['wo']) return { kana: map['wo'], romaji: 'wo' }
    return null
  }
  if (consonant === 'w' && vowel === 'o') {
    return map['wo'] ? { kana: map['wo'], romaji: 'wo' } : null
  }

  // try the romaji directly
  if (map[romaji]) return { kana: map[romaji], romaji }
  return null
}

function ChartTable({ data, rowDefs, rowLabelDefs, title, mode }) {
  const map = useMemo(() => buildChart(data), [data])
  const nChar = useMemo(() => data.basic?.find(k => k.romaji === 'n' && k.kana.length === 1)?.kana || 'ん', [data])
  const [active, setActive] = useState(null)
  const navigate = useNavigate()

  const handleCellClick = (kana) => {
    if (!kana) return
    navigate('/kana', { state: { kana, mode } })
  }

  return (
    <div style={s.chartWrap}>
      <div style={s.chartTitle}>{title}</div>
      <div style={s.tableScroll}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}></th>
              {vowels.map(v => <th key={v} style={s.th}>{v}</th>)}
            </tr>
          </thead>
          <tbody>
            {rowDefs.map((consonant, ri) => (
              <tr key={consonant}>
                <td style={s.rowLabel}>{rowLabelDefs[ri]}</td>
                {vowels.map(vowel => {
                  const entry = getKana(map, consonant, vowel)
                  const key = `${consonant}${vowel}`
                  const isActive = active === key
                  return (
                    <td
                      key={vowel}
                      style={{
                        ...s.cell,
                        ...(entry ? { cursor: 'pointer' } : s.cellEmpty),
                        ...(isActive ? s.cellHovered : {}),
                      }}
                      onMouseEnter={() => entry && setActive(key)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => entry && setActive(key)}
                      onBlur={() => setActive(null)}
                      onTouchStart={() => entry && setActive(key)}
                      onTouchEnd={() => setActive(null)}
                      onClick={() => entry && handleCellClick(entry.kana)}
                      tabIndex={entry ? 0 : undefined}
                      title={entry ? `открыть порядок черт для ${entry.kana}` : undefined}
                      aria-label={entry ? `${entry.kana} — ${entry.romaji} — открыть порядок черт` : undefined}
                      role={entry ? 'button' : undefined}
                    >
                      {entry ? (
                        <>
                          <span style={s.kanaChar}>{entry.kana}</span>
                          <span style={s.romajiLabel}>{entry.romaji}</span>
                        </>
                      ) : (
                        <span style={s.emptyMark}>-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            {/* n row */}
            <tr>
              <td style={s.rowLabel}>ん</td>
              <td
                colSpan={5}
                style={{ ...s.cell, ...s.nCell, cursor: 'pointer', ...(active === 'n' ? s.cellHovered : {}) }}
                onMouseEnter={() => setActive('n')}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive('n')}
                onBlur={() => setActive(null)}
                onTouchStart={() => setActive('n')}
                onTouchEnd={() => setActive(null)}
                onClick={() => handleCellClick(nChar)}
                tabIndex={0}
              >
                <span style={s.kanaChar}>{nChar}</span>
                <span style={s.romajiLabel}>n</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ComboTable({ data, title, mode }) {
  const combos = data.combo || []
  const rows = []
  const seen = new Set()
  combos.forEach(k => {
    if (!seen.has(k.row)) { seen.add(k.row); rows.push(k.row) }
  })
  const [active, setActive] = useState(null)
  const navigate = useNavigate()

  const handleCellClick = (kana) => {
    if (!kana) return
    navigate('/kana', { state: { kana, mode } })
  }

  return (
    <div style={s.chartWrap}>
      <div style={s.chartTitle}>{title}</div>
      <div style={s.tableScroll}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}></th>
              <th style={s.th}>ya</th>
              <th style={s.th}>yu</th>
              <th style={s.th}>yo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const cells = combos.filter(k => k.row === row)
              const label = row.replace('行', '')
              return (
                <tr key={row}>
                  <td style={s.rowLabel}>{label}</td>
                  {['ya', 'yu', 'yo'].map(pos => {
                    const entry = cells.find(k => k.romaji.endsWith(pos))
                    const key = `${row}-${pos}`
                    const isActive = active === key
                    return (
                      <td
                        key={pos}
                        style={{
                          ...s.cell,
                          ...(entry ? { cursor: 'pointer' } : s.cellEmpty),
                          ...(isActive ? s.cellHovered : {}),
                        }}
                        onMouseEnter={() => entry && setActive(key)}
                        onMouseLeave={() => setActive(null)}
                        onFocus={() => entry && setActive(key)}
                        onBlur={() => setActive(null)}
                        onTouchStart={() => entry && setActive(key)}
                        onTouchEnd={() => setActive(null)}
                        onClick={() => entry && handleCellClick(entry.kana)}
                        tabIndex={entry ? 0 : undefined}
                        title={entry ? `открыть порядок черт для ${entry.kana}` : undefined}
                        aria-label={entry ? `${entry.kana} — ${entry.romaji} — открыть порядок черт` : undefined}
                        role={entry ? 'button' : undefined}
                      >
                        {entry ? (
                          <>
                            <span style={s.kanaChar}>{entry.kana}</span>
                            <span style={s.romajiLabel}>{entry.romaji}</span>
                          </>
                        ) : <span style={s.emptyMark}>-</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const tips = [
  { emoji: '👂', title: 'し = shi (not si)', text: 'pronounced like "she" in English' },
  { emoji: '👅', title: 'ち = chi (not ti)', text: 'like "chi" in "cheese"' },
  { emoji: '💨', title: 'つ = tsu', text: 'like "ts" in "cats" + "u"' },
  { emoji: '🌬️', title: 'ふ = fu/hu', text: 'between "fu" and "hu" — gentle blow' },
  { emoji: '🔊', title: 'ん = n', text: 'nasal sound, changes before b/p/m' },
  { emoji: '⏳', title: 'long vowels', text: 'hold the vowel 2x: おばさん (aunt) vs おばあさん (grandmother)' },
  { emoji: '⏸️', title: 'っ small tsu', text: 'a tiny pause: きて (come) vs きって (stamp)' },
  { emoji: '🔥', title: 'dakuten ゛', text: 'voicing: か→が, さ→ざ, た→だ, は→ば' },
  { emoji: '⭕', title: 'handakuten ゜', text: 'は→ぱ — only for h-row' },
]

const HINT_KEY = 'nihongo-kana-chart-hint-seen'

export default function KanaChart() {
  const [tab, setTab] = useState('hiragana')
  const [showHint, setShowHint] = useState(() => !getStoredString(HINT_KEY))

  const dismissHint = () => {
    setStoredString(HINT_KEY, '1')
    setShowHint(false)
  }

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <h1 style={s.titleMain}>
          <span>📊</span> kana chart <span style={s.titleJp}>かなひょう</span>
        </h1>
        <p style={s.subtitle}>reference chart & pronunciation tips</p>
      </div>

      {/* tab selector */}
      <div style={s.tabRow} className="animate-fadeInUp">
        <button
          onClick={() => setTab('hiragana')}
          style={{ ...s.tab, ...(tab === 'hiragana' ? s.tabActive : {}) }}
        >
          ひらがな hiragana
        </button>
        <button
          onClick={() => setTab('katakana')}
          style={{ ...s.tab, ...(tab === 'katakana' ? s.tabActive : {}) }}
        >
          カタカナ katakana
        </button>
      </div>

      {/* first-visit hint */}
      {showHint && (
        <div style={s.hint} className="animate-fadeInUp">
          <span>💡 нажми на любой символ, чтобы увидеть порядок черт</span>
          <button onClick={dismissHint} style={s.hintClose} aria-label="dismiss hint">✕</button>
        </div>
      )}

      {/* charts */}
      <div className="glass animate-fadeInUp" style={s.chartCard} onClick={dismissHint}>
        {tab === 'hiragana' ? (
          <>
            <ChartTable data={hiragana} rowDefs={rows} rowLabelDefs={rowLabels} title="basic ひらがな" mode="hiragana" />
            <ChartTable data={hiragana} rowDefs={dakutenRows} rowLabelDefs={dakutenLabels} title="dakuten & handakuten" mode="hiragana" />
            <ComboTable data={hiragana} title="combo sounds 拗音 (きゃ, しゅ, にょ…)" mode="hiragana" />
          </>
        ) : (
          <>
            <ChartTable data={katakana} rowDefs={rows} rowLabelDefs={rowLabels.map((_, i) => ['ア','カ','サ','タ','ナ','ハ','マ','ヤ','ラ','ワ'][i])} title="basic カタカナ" mode="katakana" />
            <ChartTable data={katakana} rowDefs={dakutenRows} rowLabelDefs={['ガ','ザ','ダ','バ','パ']} title="dakuten & handakuten" mode="katakana" />
            <ComboTable data={katakana} title="combo sounds 拗音 (キャ, シュ, ニョ…)" mode="katakana" />
          </>
        )}
      </div>

      {/* pronunciation tips */}
      <div className="animate-fadeInUp" style={s.tipsSection}>
        <div style={s.tipsTitle}>pronunciation tips 🎤</div>
        <div style={s.tipsList}>
          {tips.map((tip, i) => (
            <div key={i} className="glass-sm" style={s.tipCard}>
              <span style={s.tipEmoji}>{tip.emoji}</span>
              <div>
                <div style={s.tipHead}>{tip.title}</div>
                <div style={s.tipText}>{tip.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0 90px', display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/kana" className="btn btn-cute">
          stroke order ✍️
        </Link>
        <Link to="/quiz/kana" className="btn btn-secondary">
          kana quiz あ
        </Link>
        <Link to="/" className="btn btn-secondary">
          home 🏠
        </Link>
      </div>
    </div>
  )
}

const s = {
  header: { textAlign: 'center', marginBottom: 16, padding: '8px 0' },
  titleMain: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  titleJp: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },
  tabRow: {
    display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16,
  },
  tab: {
    padding: '8px 18px', borderRadius: 50,
    background: 'var(--tint-medium)', border: '1.5px solid rgba(192,132,252,0.25)',
    fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)',
    cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit',
    minHeight: 44,
  },
  tabActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent', boxShadow: '0 4px 14px rgba(236,72,153,0.3)',
  },
  hint: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    padding: '10px 14px', borderRadius: 12, marginBottom: 12,
    background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.25)',
    fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)',
  },
  hintClose: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem',
    color: 'var(--text-light)', padding: '4px 8px', flexShrink: 0, fontFamily: 'inherit',
    minHeight: 44, display: 'flex', alignItems: 'center',
  },
  chartCard: { padding: 16, marginBottom: 16, overflowX: 'auto' },
  chartWrap: { marginBottom: 20 },
  chartTitle: {
    fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-light)',
    textTransform: 'lowercase', marginBottom: 8, textAlign: 'center',
  },
  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '6px 4px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-light)',
    textAlign: 'center', borderBottom: '2px solid rgba(192,132,252,0.15)',
  },
  rowLabel: {
    padding: '4px 8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-light)',
    textAlign: 'center', minWidth: 30,
  },
  cell: {
    padding: '8px 4px', textAlign: 'center', borderRadius: 8,
    transition: 'all 0.2s', cursor: 'default', position: 'relative',
  },
  cellEmpty: { opacity: 0.3 },
  cellHovered: {
    background: 'rgba(244,114,182,0.12)', transform: 'scale(1.1)',
  },
  kanaChar: {
    display: 'block', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2,
  },
  romajiLabel: {
    display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)',
  },
  emptyMark: { color: 'var(--text-light)', fontSize: '0.72rem' },
  nCell: { textAlign: 'center' },
  tipsSection: { marginBottom: 20 },
  tipsTitle: {
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)',
    textTransform: 'lowercase', marginBottom: 10, textAlign: 'center',
  },
  tipsList: { display: 'flex', flexDirection: 'column', gap: 8 },
  tipCard: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
  },
  tipEmoji: { fontSize: '1.2rem', flexShrink: 0 },
  tipHead: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 },
  tipText: { fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.4 },
}
