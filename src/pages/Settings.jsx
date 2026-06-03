import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useTheme } from '../hooks/useTheme'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { useIsMobile } from '../hooks/useIsMobile'
import { getStoredFlag, getStoredInverseFlag, getStoredQuizSize, removeStoredKey, setStoredString } from '../utils/localSettings'

const DATA_KEYS = [
  { key: 'nihongo-progress', label: 'quiz progress & stats' },
  { key: 'nihongo-homework', label: 'homework notes (legacy)' },
  { key: 'nihongo-homework-v2', label: 'homework notes' },
  { key: 'nihongo-schedule-data', label: 'study schedule' },
  { key: 'nihongo-schedule-overrides', label: 'lesson reschedules' },
  { key: 'nihongo-study-timer', label: 'study timer' },
  { key: 'nihongo-difficult-words', label: 'difficult words' },
  { key: 'nihongo-xp', label: 'XP & levels' },
  { key: 'nihongo-daily-challenge', label: 'daily challenge' },
  { key: 'nihongo-achievements', label: 'achievements' },
  { key: 'nihongo-study-goal', label: 'study goal' },
  { key: 'nihongo-show-furigana', label: 'furigana setting' },
  { key: 'nihongo-coins', label: 'sakura coins' },
  { key: 'nihongo-freeze-count', label: 'streak freezes' },
  { key: 'nihongo-freeze-dates', label: 'freeze dates' },
  { key: 'nihongo-bkb-unlocked', label: 'BKB kanji unlock progress' },
  { key: 'nihongo-unlocked-max', label: 'unlocked lessons' },
  { key: 'nihongo-sprint-best', label: 'weak words sprint best' },
  { key: 'nihongo-reading-completed', label: 'reading completions' },
  { key: 'nihongo-theme', label: 'theme preference' },
  { key: 'nihongo-weekly-challenge', label: 'weekly challenge' },
  { key: 'nihongo-countdown', label: 'quiz countdown setting' },
  { key: 'nihongo-kanji-last-lesson', label: 'kanji study last lesson' },
  { key: 'nihongo-word-offset', label: 'word of day offset' },
  { key: 'nihongo-quiz-size', label: 'default quiz length' },
  { key: 'nihongo-quiz-romaji', label: 'romaji in quiz setting' },
  { key: 'nihongo-onboarded', label: 'onboarding seen flag' },
  { key: 'nihongo-kana-chart-hint-seen', label: 'kana chart hint dismissed' },
  { key: 'nihongo-kana-study-mode', label: 'kana study mode (hiragana/katakana)' },
  { key: 'nihongo-kana-study-category', label: 'kana study category (basic/voiced/combo)' },
]

function getGameBestKeys() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('nihongo-matching-best-') || k.startsWith('nihongo-typing-best-'))) {
        keys.push(k)
      }
    }
    return keys
  } catch {
    return []
  }
}

function getAllData() {
  const data = {}
  DATA_KEYS.forEach(({ key }) => {
    try {
      const val = localStorage.getItem(key)
      if (val) {
        try { data[key] = JSON.parse(val) }
        catch { data[key] = val }
      }
    } catch {
      // Ignore inaccessible keys during export.
    }
  })
  getGameBestKeys().forEach(key => {
    try {
      const val = localStorage.getItem(key)
      if (val) data[key] = val
    } catch {
      // Ignore inaccessible keys during export.
    }
  })
  data._exportedAt = new Date().toISOString()
  data._version = 1
  return data
}

function getStorageSize() {
  let total = 0
  DATA_KEYS.forEach(({ key }) => {
    try {
      const val = localStorage.getItem(key)
      if (val) total += val.length * 2
    } catch {
      // Ignore inaccessible keys when estimating size.
    }
  })
  getGameBestKeys().forEach(key => {
    try {
      const val = localStorage.getItem(key)
      if (val) total += val.length * 2
    } catch {
      // Ignore inaccessible keys when estimating size.
    }
  })
  if (total < 1024) return `${total} B`
  return `${(total / 1024).toFixed(1)} KB`
}

// Compact toggle switch component
function Toggle({ on, onToggle, colorOn = '#f472b6', label }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      aria-label={label}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      style={{
        width: 48, height: 26, borderRadius: 50, cursor: 'pointer',
        background: on ? `linear-gradient(135deg, ${colorOn}, #c084fc)` : 'rgba(150,150,180,0.2)',
        border: '1.5px solid ' + (on ? 'transparent' : 'rgba(192,132,252,0.25)'),
        position: 'relative', transition: 'all 0.3s', flexShrink: 0,
        boxShadow: on ? '0 2px 10px rgba(244,114,182,0.3)' : 'none',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 2,
        left: on ? 24 : 2,
        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

// Section heading
function SectionHead({ icon, title, jp }) {
  return (
    <div style={s.sectionHead}>
      <span style={s.sectionIcon}>{icon}</span>
      <div>
        <div style={s.sectionTitle}>{title}</div>
        {jp && <div style={s.sectionJp}>{jp}</div>}
      </div>
    </div>
  )
}

// Setting row (label left, control right)
function SettingRow({ label, desc, children, danger }) {
  return (
    <div style={{ ...s.row, ...(danger ? s.rowDanger : {}) }}>
      <div style={s.rowLeft}>
        <div style={{ ...s.rowLabel, ...(danger ? { color: 'var(--incorrect-text)' } : {}) }}>{label}</div>
        {desc && <div style={s.rowDesc}>{desc}</div>}
      </div>
      <div style={s.rowRight}>{children}</div>
    </div>
  )
}

export default function Settings() {
  const isMobile = useIsMobile()
  const { resetProgress } = useProgress()
  const { isDark, toggleTheme } = useTheme()
  const { dailyGoal, setDailyGoal } = useStudyTimer()
  const [importStatus, setImportStatus] = useState(null)
  const fileRef = useRef(null)
  const [countdownOn, setCountdownOn] = useState(() => getStoredInverseFlag('nihongo-countdown', '0', true))
  const toggleCountdown = () => {
    const next = !countdownOn
    setCountdownOn(next)
    setStoredString('nihongo-countdown', next ? '1' : '0')
  }
  const [furiganaOn, setFuriganaOn] = useState(() => getStoredFlag('nihongo-show-furigana', '1', false))
  const toggleFurigana = () => {
    const next = !furiganaOn
    setFuriganaOn(next)
    setStoredString('nihongo-show-furigana', next ? '1' : '0')
  }

  const [defaultQuizSize, setDefaultQuizSizeState] = useState(getStoredQuizSize)
  const setDefaultQuizSize = (n) => {
    setDefaultQuizSizeState(n)
    setStoredString('nihongo-quiz-size', n)
  }

  const [romajiInQuiz, setRomajiInQuizState] = useState(() => getStoredInverseFlag('nihongo-quiz-romaji', '0', true))
  const toggleRomajiInQuiz = () => {
    const next = !romajiInQuiz
    setRomajiInQuizState(next)
    setStoredString('nihongo-quiz-romaji', next ? '1' : '0')
  }

  const handleExport = () => {
    try {
      if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
        throw new Error('Export is not available in this browser')
      }
      const data = getAllData()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nihongo-backup-${new Date().toISOString().split('T')[0]}.json`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setImportStatus({ ok: true, msg: 'backup exported' })
    } catch {
      setImportStatus({ ok: false, msg: 'could not export backup in this browser' })
    }
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (typeof FileReader === 'undefined') {
      setImportStatus({ ok: false, msg: 'file import is not available in this browser' })
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Invalid backup shape')
        }
        let count = 0
        DATA_KEYS.forEach(({ key }) => {
          if (data[key] != null) {
            // Store strings directly; re-encode objects/arrays/numbers
            const val = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key])
            if (setStoredString(key, val)) count++
          }
        })
        Object.keys(data).forEach(key => {
          if (key.startsWith('nihongo-matching-best-') || key.startsWith('nihongo-typing-best-')) {
            if (setStoredString(key, data[key])) count++
          }
        })
        setImportStatus({ ok: true, msg: `imported ${count} data sets — reload to apply` })
      } catch {
        setImportStatus({ ok: false, msg: 'invalid file format' })
      }
    }
    reader.onerror = () => setImportStatus({ ok: false, msg: 'could not read backup file' })
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearAll = () => {
    const confirmed = typeof confirm === 'function'
      ? confirm('Delete ALL data? This cannot be undone!\n\nConsider exporting first.')
      : false
    if (!confirmed) return
    DATA_KEYS.forEach(({ key }) => removeStoredKey(key))
    getGameBestKeys().forEach(key => removeStoredKey(key))
    resetProgress()
    setImportStatus({ ok: true, msg: 'all data cleared — refresh the page' })
  }

  const dataItems = DATA_KEYS.map(({ key, label }) => ({
    label, has: !!getAllData()[key],
  }))

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <h1 style={s.title}>
          <span>⚙️</span> settings <span style={s.titleJp}>せってい</span>
        </h1>
        <p style={s.subtitle}>personalise your study experience</p>
      </div>

      {/* 2-column grid on desktop */}
      <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>

        {/* ── Appearance ── */}
        <div className="glass animate-fadeInUp" style={s.card}>
          <SectionHead icon="🎨" title="appearance" jp="みため" />
          <SettingRow
            label="dark mode"
            desc={isDark ? 'currently: dark 🌙' : 'currently: light ☀️'}
          >
            <Toggle on={isDark} onToggle={toggleTheme} label="dark mode" />
          </SettingRow>
          <SettingRow
            label="quiz countdown"
            desc={countdownOn ? '3-2-1 перед каждым квизом' : 'квиз начинается сразу'}
          >
            <Toggle on={countdownOn} onToggle={toggleCountdown} label="quiz countdown" />
          </SettingRow>
          <SettingRow
            label="furigana by default"
            desc={furiganaOn ? 'фуригана показывается в грамматике' : 'фуригана скрыта по умолчанию'}
          >
            <Toggle on={furiganaOn} onToggle={toggleFurigana} label="furigana by default" />
          </SettingRow>
        </div>

        {/* ── Study goal ── */}
        <div className="glass animate-fadeInUp" style={s.card}>
          <SectionHead icon="⏱️" title="study goal" jp="もくひょう" />
          <SettingRow label="daily target" desc={`${dailyGoal} minutes per day`}>
            <div style={s.goalChips}>
              {[15, 30, 45, 60].map(m => (
                <button
                  key={m}
                  onClick={() => setDailyGoal(m)}
                  style={{
                    ...s.chip,
                    ...(dailyGoal === m ? s.chipActive : {}),
                  }}
                >
                  {m}m
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        {/* ── Quiz Behavior ── */}
        <div className="glass animate-fadeInUp" style={s.card}>
          <SectionHead icon="🎮" title="quiz behavior" jp="クイズ設定" />
          <SettingRow label="default quiz length" desc={`${defaultQuizSize} questions per quiz`}>
            <div style={s.goalChips}>
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setDefaultQuizSize(n)}
                  style={{ ...s.chip, ...(defaultQuizSize === n ? s.chipActive : {}) }}
                >
                  {n}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow
            label="romaji in vocab quiz"
            desc={romajiInQuiz ? 'ромадзи показывается в подсказке' : 'ромадзи скрыт (сложнее)'}
          >
            <Toggle on={romajiInQuiz} onToggle={toggleRomajiInQuiz} label="romaji in vocab quiz" />
          </SettingRow>
        </div>

        {/* ── Data overview ── */}
        <div className="glass animate-fadeInUp" style={s.card}>
          <SectionHead icon="📦" title="stored data" jp="データ" />
          <div style={s.dataGrid}>
            {dataItems.map(({ label, has }) => (
              <div key={label} style={s.dataItem}>
                <span style={{ color: has ? 'var(--correct-text)' : 'rgba(150,150,180,0.4)', fontSize: '0.55rem' }}>●</span>
                <span style={{ ...s.dataLabel, color: has ? 'var(--text-secondary)' : 'var(--text-light)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={s.dataSize}>storage used: ~{getStorageSize()}</div>
        </div>

        {/* ── Backup & Restore ── */}
        <div className="glass animate-fadeInUp" style={s.card}>
          <SectionHead icon="💾" title="backup & restore" jp="バックアップ" />
          <SettingRow label="export data" desc="download progress as JSON">
            <button className="btn btn-cute" onClick={handleExport} style={s.actionBtn}>
              export 📥
            </button>
          </SettingRow>
          <SettingRow label="import data" desc="restore from JSON file">
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()} style={s.actionBtn}>
              import 📂
            </button>
          </SettingRow>
          {importStatus && (
            <div style={{ ...s.importMsg, color: importStatus.ok ? 'var(--correct-text)' : 'var(--incorrect-text)' }}>
              {importStatus.ok ? '✓' : '✗'} {importStatus.msg}
              {importStatus.ok && (
                <button
                  onClick={() => window.location.reload()}
                  style={{ marginLeft: 10, padding: '2px 10px', borderRadius: 50, border: 'none', background: 'rgba(16,185,129,0.15)', color: 'var(--correct-text)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}
                >
                  reload now
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── About ── */}
        <div className="glass animate-fadeInUp" style={s.card}>
          <SectionHead icon="🌸" title="about" jp="このアプリ" />
          {[
            ['app', 'nihongo app v2.0'],
            ['textbook', 'みんなの日本語 (1–25)'],
            ['kanji', 'Basic Kanji Book 1 (22 lessons)'],
            ['level', '~N5 (lesson 14+)'],
          ].map(([label, value]) => (
            <SettingRow key={label} label={label} desc="">
              <span style={s.aboutValue}>{value}</span>
            </SettingRow>
          ))}
          <div style={{ marginTop: 10 }}>
            <Link to="/guide" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
              textDecoration: 'none', fontSize: '0.85rem', fontWeight: 800,
              color: 'var(--text-main)',
            }}>
              🌸 знакомство с приложением →
            </Link>
          </div>
          <div style={s.aboutNote}>made with 🩷 for learning にほんご</div>
        </div>

        {/* ── Danger zone ── */}
        <div className="glass animate-fadeInUp" style={{ ...s.card, ...s.dangerCard }}>
          <SectionHead icon="⚠️" title="danger zone" jp="きけん" />
          <SettingRow label="clear all data" desc="permanently delete all progress" danger>
            <button onClick={handleClearAll} style={s.dangerBtn}>
              delete all
            </button>
          </SettingRow>
        </div>

      </div>

      <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          ← back to home
        </Link>
      </div>
    </div>
  )
}

const s = {
  header: { textAlign: 'center', marginBottom: 24, padding: '8px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  titleJp: { fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },

  grid: { display: 'grid', gap: 14, marginBottom: 16 },

  card: { padding: '18px 20px' },
  sectionHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(192,132,252,0.12)' },
  sectionIcon: { fontSize: '1.3rem', flexShrink: 0 },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase' },
  sectionJp: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 1 },

  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(192,132,252,0.07)',
  },
  rowDanger: { borderBottom: '1px solid rgba(239,68,68,0.1)' },
  rowLeft: { flex: 1, minWidth: 0 },
  rowRight: { flexShrink: 0 },
  rowLabel: { fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'lowercase' },
  rowDesc: { fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-light)', marginTop: 1 },

  goalChips: { display: 'flex', gap: 5 },
  chip: {
    padding: '4px 10px', borderRadius: 50, fontSize: '0.75rem', fontWeight: 700,
    background: 'rgba(192,132,252,0.08)', border: '1.5px solid rgba(192,132,252,0.2)',
    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44,
  },
  chipActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent', boxShadow: '0 2px 8px rgba(236,72,153,0.25)',
  },

  dataGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginBottom: 8,
  },
  dataItem: { display: 'flex', alignItems: 'center', gap: 5 },
  dataLabel: { fontSize: '0.75rem', fontWeight: 600 },
  dataSize: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', marginTop: 6 },

  actionBtn: { fontSize: '0.8rem', padding: '6px 14px', minHeight: 44 },

  importMsg: { fontSize: '0.78rem', fontWeight: 700, marginTop: 8, textAlign: 'center' },

  aboutValue: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'right' },
  aboutNote: { fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-light)', marginTop: 10, textAlign: 'center' },

  dangerCard: { borderColor: 'rgba(239,68,68,0.2)' },
  dangerBtn: {
    padding: '5px 12px', borderRadius: 50,
    background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.3)',
    color: 'var(--incorrect-text)', fontSize: '0.75rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44,
  },
}
