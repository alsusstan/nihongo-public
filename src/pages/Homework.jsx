import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { getStoredJson, setStoredJson } from '../utils/localSettings'

const HASHTAG_ROUTES = {
  'kanji': '/kanji', 'кандзи': '/kanji', 'канджи': '/kanji',
  'kanji-quiz': '/quiz/kanji', 'кандзи-квиз': '/quiz/kanji',
  'vocab': '/quiz/vocab', 'vocabulary': '/quiz/vocab', 'словарь': '/quiz/vocab', 'слова': '/quiz/vocab',
  'grammar': '/grammar', 'грамматика': '/grammar',
  'grammar-quiz': '/quiz/grammar', 'грамматика-квиз': '/quiz/grammar',
  'kana': '/quiz/kana', 'кана': '/quiz/kana',
  'kana-study': '/kana', 'канаштрихи': '/kana', 'штрихи': '/kana',
  'reading': '/reading', 'чтение': '/reading',
  'lessons': '/lessons', 'уроки': '/lessons', 'урок': '/lessons',
  'mistakes': '/mistakes', 'ошибки': '/mistakes',
  'stats': '/stats', 'статистика': '/stats',
  'daily': '/daily', 'дейли': '/daily',
  'cards': '/review', 'карточки': '/review',
  'practice': '/kanji/practice', 'письмо': '/kanji/practice',
  'sprint': '/quiz/weak', 'спринт': '/quiz/weak',
  'particles': '/quiz/particles', 'частицы': '/quiz/particles',
  'teform': '/quiz/te-form', 'те': '/quiz/te-form',
  'numbers': '/quiz/numbers', 'числа': '/quiz/numbers',
  'counters': '/quiz/counters', 'счётные': '/quiz/counters',
  'adjectives': '/quiz/adjectives', 'прилагательные': '/quiz/adjectives',
  'sentences': '/quiz/sentences', 'предложения': '/quiz/sentences',
  'conjugation': '/quiz/conjugation', 'спряжение': '/quiz/conjugation',
  'verbs': '/conjugation', 'глаголы': '/conjugation',
  'n5': '/quiz/n5',
  'typing': '/game/typing', 'печать': '/game/typing',
  'matching': '/game/matching', 'пары': '/game/matching',
  'search': '/search', 'поиск': '/search',
  'chart': '/kana-chart', 'таблица': '/kana-chart',
  'fill-in': '/quiz/fill-in', 'заполни': '/quiz/fill-in',
  'materials': '/materials', 'учебники': '/materials', 'материалы': '/materials',
  'homework': '/homework', 'домашка': '/homework',
  'guide': '/guide', 'гайд': '/guide', 'справка': '/guide',
  'quiz-hub': '/quiz-hub', 'квизы': '/quiz-hub',
}

function HashtagText({ text }) {
  if (!text) return null
  const parts = text.split(/(#[\wа-яА-ЯёЁ-]+)/u)
  const hasLinks = parts.some(p => p.startsWith('#') && HASHTAG_ROUTES[p.slice(1).toLowerCase()])
  if (!hasLinks) return null
  return (
    <div style={hashStyles.wrap}>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          const route = HASHTAG_ROUTES[part.slice(1).toLowerCase()]
          if (route) return <Link key={i} to={route} style={hashStyles.link}>{part}</Link>
        }
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
      })}
    </div>
  )
}

const hashStyles = {
  wrap: {
    fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-main)',
    padding: '8px 0 4px',
  },
  link: {
    color: 'var(--text-secondary)', fontWeight: 800, textDecoration: 'none',
    background: 'rgba(124,58,237,0.1)', padding: '2px 8px',
    borderRadius: 8, transition: 'all 0.2s',
    boxShadow: '0 0 0 1px rgba(124,58,237,0.2)',
  },
}

const HW_KEY = 'nihongo-homework-v2'
const OVERRIDES_KEY = 'nihongo-schedule-overrides'
const SCHEDULE_KEY = 'nihongo-schedule-data'
const SCHEDULE_DEFAULTS = { days: [1, 5], time: '16:15' }
const MAX_HOMEWORK_IMAGES = 12
const MAX_HOMEWORK_IMAGE_BYTES = 5 * 1024 * 1024

function loadOverrides() {
  const parsed = getStoredJson(OVERRIDES_KEY, {})
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

function loadScheduleData() {
  const parsed = getStoredJson(SCHEDULE_KEY, null)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? { ...SCHEDULE_DEFAULTS, ...parsed }
    : SCHEDULE_DEFAULTS
}

function loadHomework() {
  const v2 = getStoredJson(HW_KEY, null)
  if (v2 && typeof v2 === 'object' && !Array.isArray(v2)) return v2
  const v1 = getStoredJson('nihongo-homework', null)
  if (v1 && typeof v1 === 'object' && !Array.isArray(v1)) return v1
  return {}
}

function saveHomework(data) {
  return setStoredJson(HW_KEY, data)
}

function fmt(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const DAY_NAMES = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const MONTH_NAMES = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
function displayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

// Generate lesson dates — wide range for browsing old homework
// Uses stored schedule days + overrides (cancelled/rescheduled-away dates removed, rescheduled-to dates added)
// savedHomeworkKeys: Set of dates that have saved homework — keep those visible even if rescheduled away
function getLessonDates(scheduleDays, overrides, savedHomeworkKeys) {
  const days = scheduleDays && scheduleDays.length ? scheduleDays : [1, 5]
  const ovs = overrides || {}
  const hwKeys = savedHomeworkKeys || new Set()
  // Cancelled dates: always exclude. Rescheduled-away dates: only exclude if no saved homework
  const cancelledDates = new Set(Object.entries(ovs).filter(([, o]) => o.cancelled).map(([k]) => k))
  const rescheduledAway = new Set(Object.entries(ovs).filter(([k, o]) => o.newDate && !o.cancelled && !hwKeys.has(k)).map(([k]) => k))
  const excludedDates = new Set([...cancelledDates, ...rescheduledAway])
  const rescheduledTo = new Set(Object.values(ovs).filter(o => o.newDate && !o.cancelled).map(o => o.newDate))

  const dates = new Set()
  const now = new Date()
  // go back ~6 months, forward ~2 months
  const start = new Date(now)
  start.setDate(start.getDate() - 180)
  const end = new Date(now)
  end.setDate(end.getDate() + 60)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = fmt(new Date(d))
    if (excludedDates.has(key)) continue // skip cancelled and rescheduled-away (without homework)
    if (days.includes(d.getDay())) dates.add(key)
  }
  // Add rescheduled-to dates within range
  rescheduledTo.forEach(key => {
    const d = new Date(key + 'T00:00:00')
    if (d >= start && d <= end) dates.add(key)
  })

  return [...dates].sort()
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('File reading is not available'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export default function Homework() {
  const isMobile = useIsMobile()
  const [allHw, setAllHw] = useState(loadHomework)
  const scheduleData = useMemo(() => loadScheduleData(), [])
  const overridesData = useMemo(() => loadOverrides(), [])
  const savedHwKeys = useMemo(() => new Set(Object.keys(allHw).filter(k => {
    const hw = allHw[k]
    return hw && (hw.task || hw.notes || hw.notes2 || hw.sentences || (hw.images && hw.images.length > 0))
  })), [allHw])
  const lessonDates = useMemo(() => getLessonDates(scheduleData.days, overridesData, savedHwKeys), [scheduleData, overridesData, savedHwKeys])

  // find nearest upcoming lesson date
  const today = fmt(new Date())
  const nearestIdx = lessonDates.findIndex(d => d >= today)
  const defaultDate = nearestIdx >= 0 ? lessonDates[nearestIdx] : lessonDates[lessonDates.length - 1]

  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [task, setTask] = useState('')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState([])
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [imageError, setImageError] = useState('')
  const [viewImage, setViewImage] = useState(null)
  const fileRef = useRef(null)
  const scrollRef = useRef(null)
  const autoSaveRef = useRef(null)
  const savedTimerRef = useRef(null)
  useEffect(() => () => {
    clearTimeout(autoSaveRef.current)
    clearTimeout(savedTimerRef.current)
  }, [])

  // prev/next lesson date navigation
  const currentIdx = lessonDates.indexOf(selectedDate)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < lessonDates.length - 1
  const goPrev = () => { if (hasPrev) setSelectedDate(lessonDates[currentIdx - 1]) }
  const goNext = () => { if (hasNext) setSelectedDate(lessonDates[currentIdx + 1]) }

  // scroll to selected date chip
  useEffect(() => {
    if (scrollRef.current) {
      const active = scrollRef.current.querySelector('[data-active="true"]')
      if (active) {
        active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [selectedDate])

  // load entry when date changes
  useEffect(() => {
    const entry = allHw[selectedDate]
    if (entry) {
      setTask(entry.task || entry.notes || '')
      setNotes(entry.notes2 || entry.sentences || '')
      setImages(entry.images || [])
    } else {
      setTask('')
      setNotes('')
      setImages([])
    }
    setSaved(false)
  }, [selectedDate, allHw])

  const handleSave = useCallback(() => {
    const updated = {
      ...allHw,
      [selectedDate]: { task, notes2: notes, images, updatedAt: new Date().toISOString() },
    }
    setAllHw(updated)
    const ok = saveHomework(updated)
    clearTimeout(savedTimerRef.current)
    setSaveError(!ok)
    setSaved(ok)
    if (ok) savedTimerRef.current = setTimeout(() => setSaved(false), 2200)
  }, [allHw, selectedDate, task, notes, images])

  // Auto-save: 2s after user stops typing
  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      const entry = allHw[selectedDate]
      const hasContent = task.trim() || notes.trim() || images.length > 0
      const changed = !entry
        ? hasContent
        : (entry.task || entry.notes || '') !== task
          || (entry.notes2 || entry.sentences || '') !== notes
          || JSON.stringify(entry.images || []) !== JSON.stringify(images)
      if (hasContent && changed) {
        const updated = {
          ...allHw,
          [selectedDate]: { task, notes2: notes, images, updatedAt: new Date().toISOString() },
        }
        setAllHw(updated)
        const ok = saveHomework(updated)
        clearTimeout(savedTimerRef.current)
        setSaveError(!ok)
        if (ok) {
          setSaved(true)
          savedTimerRef.current = setTimeout(() => setSaved(false), 1500)
        }
      }
    }, 2000)
    return () => clearTimeout(autoSaveRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, notes, images])

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files)
    let skipped = 0
    let failed = 0
    const nextImages = []
    setImageError('')

    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > MAX_HOMEWORK_IMAGE_BYTES) {
        skipped++
        continue
      }

      try {
        const b64 = await fileToBase64(file)
        nextImages.push(b64)
      } catch {
        failed++
      }
    }

    const availableSlots = Math.max(0, MAX_HOMEWORK_IMAGES - images.length)
    if (nextImages.length > availableSlots) skipped += nextImages.length - availableSlots
    setImages(prev => {
      const currentSlots = Math.max(0, MAX_HOMEWORK_IMAGES - prev.length)
      return [...prev, ...nextImages.slice(0, currentSlots)]
    })

    if (skipped || failed) {
      const parts = []
      if (skipped) parts.push('часть фото пропущена: лимит 12 фото и до 5MB на файл')
      if (failed) parts.push('часть фото не удалось прочитать')
      setImageError(parts.join(' · '))
    }
    e.target.value = ''
  }

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))

  const nowHour = new Date().getHours()
  const isUpcoming = selectedDate > today || (selectedDate === today && nowHour < 17)
  const isPast = !isUpcoming
  const hasContent = task || notes || images.length > 0

  // Reschedule notices for banner
  const rescheduleNotices = useMemo(() => {
    const notices = []
    const todayStr = fmt(new Date())
    const cutoff = fmt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    Object.entries(overridesData).forEach(([origDate, o]) => {
      if (origDate < todayStr && !o.newDate) return // old cancelled, skip
      if (origDate > cutoff && (!o.newDate || o.newDate > cutoff)) return
      notices.push({ origDate, ...o })
    })
    notices.sort((a, b) => (a.newDate || a.origDate).localeCompare(b.newDate || b.origDate))
    return notices
  }, [overridesData])

  // Build a set of reschedule-target dates for chip indicators
  const rescheduledTargetDates = useMemo(() => {
    const s = new Set()
    Object.values(overridesData).forEach(o => { if (o.newDate && !o.cancelled) s.add(o.newDate) })
    return s
  }, [overridesData])

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <h1 style={s.title}>📝 homework <span style={s.titleJp}>しゅくだい</span></h1>
      </div>

      {/* reschedule notices banner */}
      {rescheduleNotices.length > 0 && (
        <div className="glass animate-fadeInUp" style={{ padding: '10px 14px', marginBottom: 10, borderRadius: 14 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>переносы занятий</div>
          {rescheduleNotices.map((n) => (
            <div key={n.origDate} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              {n.cancelled ? (
                <>
                  <span style={{ fontSize: '0.82rem' }}>❌</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textDecoration: 'line-through', opacity: 0.7 }}>{displayDate(n.origDate)}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--incorrect-text)', fontWeight: 700 }}>отменено</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.82rem' }}>↪️</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', opacity: 0.7 }}>{displayDate(n.origDate)}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>→</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    📅 {displayDate(n.newDate)}{n.time ? ` ${n.time}` : ''}
                  </span>
                  {n.note && <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>· {n.note}</span>}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* lesson dates timeline with arrows on edges */}
      <div className="glass animate-fadeInUp" style={s.timelineCard}>
        <div style={s.timelineRow}>
          <button onClick={goPrev} disabled={!hasPrev} aria-label="previous lesson" style={{ ...s.navArrow, opacity: hasPrev ? 1 : 0.25 }} className="btn-hover">←</button>
          <div style={s.timeline} ref={scrollRef}>
            {lessonDates.map(date => {
              const d = new Date(date + 'T00:00:00')
              const sel = date === selectedDate
              const isToday = date === today
              const hasHw = !!allHw[date]
              const isRescheduledTarget = rescheduledTargetDates.has(date)
              return (
                <button
                  key={date}
                  data-active={sel ? 'true' : 'false'}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    ...s.dateChip,
                    ...(sel ? s.dateChipActive : {}),
                    ...(isToday && !sel ? s.dateChipToday : {}),
                    ...(isRescheduledTarget && !sel ? { borderColor: 'rgba(251,146,60,0.5)', background: 'rgba(251,146,60,0.07)' } : {}),
                  }}
                  className="btn-hover"
                >
                  <span style={{ ...s.chipDay, ...(sel ? { color: 'white' } : {}) }}>
                    {DAY_NAMES[d.getDay()]}
                  </span>
                  <span style={{ ...s.chipNum, ...(sel ? { color: 'white' } : {}) }}>
                    {d.getDate()}
                  </span>
                  <span style={{ ...s.chipMonth, ...(sel ? { color: 'rgba(255,255,255,0.8)' } : {}) }}>
                    {MONTH_NAMES[d.getMonth()]}
                  </span>
                  {hasHw && <span style={{ ...s.chipDot, ...(sel ? { background: 'white' } : {}) }} />}
                  {isRescheduledTarget && !sel && <span style={{ ...s.chipSpecial, background: '#f97316' }}>↪</span>}
                </button>
              )
            })}
          </div>
          <button onClick={goNext} disabled={!hasNext} aria-label="next lesson" style={{ ...s.navArrow, opacity: hasNext ? 1 : 0.25 }} className="btn-hover">→</button>
        </div>
      </div>

      {/* selected date info */}
      <div style={s.dateInfo} className="animate-fadeInUp">
        <span style={s.dateInfoText}>{displayDate(selectedDate)}</span>
        {isUpcoming && <span style={s.tagUpcoming}>upcoming</span>}
        {isPast && <span style={s.tagPast}>past</span>}
        {(() => {
          // Show override info for this date (as reschedule target)
          const origEntry = Object.entries(overridesData).find(([, o]) => o.newDate === selectedDate && !o.cancelled)
          if (origEntry) {
            const [, o] = origEntry
            return <span style={s.tagSpecial}>↪️ {o.time || ''}{ o.note ? ` · ${o.note}` : ''}</span>
          }
          return null
        })()}
      </div>

      {/* two-column: task + images */}
      <div style={{ ...s.twoCol, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="animate-fadeInUp">
        {/* left: task + notes — journal fields */}
        <div className="glass" style={s.colCard}>
          <div style={s.fieldLabel}>📋 задание</div>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="что задали на этот урок? 📖"
            className="textarea-journal"
            rows={6}
            aria-label="задание"
          />
          <HashtagText text={task} />
          <div style={{ ...s.fieldLabel, marginTop: 14 }}>✏️ заметки</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="что сегодня учила? новые слова, правила, сложности... 🌸"
            className="textarea-journal"
            rows={5}
            aria-label="заметки"
          />
          <HashtagText text={notes} />
        </div>

        {/* right: images */}
        <div className="glass" style={s.colCard}>
          <div style={s.fieldLabel}>
            📸 скриншоты
            <button onClick={() => fileRef.current?.click()} style={s.addBtn} className="btn-hover">
              +
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleAddImages}
          />
          {imageError && (
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--incorrect-text)', marginBottom: 8 }}>
              ⚠ {imageError}
            </div>
          )}
          {images.length > 0 ? (
            <div style={s.imgGrid}>
              {images.map((img, i) => (
                <div key={i} style={s.imgWrap}>
                  <img src={img} alt={`homework photo ${i + 1}`} style={{ ...s.img, cursor: 'pointer' }}
                    onClick={() => setViewImage(img)}
                    role="button" tabIndex={0} aria-label={`view homework photo ${i + 1}`}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewImage(img) } }}
                  />
                  <button onClick={() => removeImage(i)} style={s.imgRemove} aria-label="remove image">×</button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} style={s.imgAddMore} className="btn-hover">
                <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>+</span>
              </button>
            </div>
          ) : (
            <div
              style={s.dropZone}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="добавить скриншоты"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>📷</div>
              <div style={{ fontWeight: 700 }}>добавить скриншоты</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.55, marginTop: 3 }}>фото страниц, упражнений, заметок</div>
            </div>
          )}
        </div>
      </div>

      {/* empty state when nothing written yet */}
      {!hasContent && (
        <div className="glass animate-fadeInUp" style={s.emptyState}>
          <div style={s.emptyIcon}>🌸</div>
          <div style={s.emptyTitle}>ничего не записано</div>
          <div style={s.emptySubtitle}>напиши что учила, какие слова были новые, что было сложно — это твой личный дневник</div>
        </div>
      )}


      {/* save button */}
      <div style={s.saveRow} className="animate-fadeInUp">
        <button
          className={`btn btn-cute${saved ? ' saved' : ''}`}
          onClick={handleSave}
          style={s.saveBtn}
        >
          {saved ? '✓ сохранено!' : 'сохранить 💾'}
        </button>
        {saveError && (
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--incorrect-text)' }}>
            ⚠ хранилище заполнено — удали фото
          </span>
        )}
        {allHw[selectedDate]?.updatedAt && !saved && !saveError && (
          <span style={s.savedTime}>
            ✓ {new Date(allHw[selectedDate].updatedAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 8, paddingBottom: 90, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Link to="/lessons" className="btn btn-cute" style={{ fontSize: '0.85rem' }}>lessons 📚</Link>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
      </div>

      {/* fullscreen image viewer */}
      {viewImage && (
        <div style={s.overlay} role="dialog" aria-modal="true" aria-label="homework image" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="homework photo" style={s.overlayImg} />
          <button style={s.overlayClose} onClick={() => setViewImage(null)} aria-label="close image">✕</button>
        </div>
      )}
    </div>
  )
}

const s = {
  header: { textAlign: 'center', marginBottom: 10, padding: '4px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 0,
  },
  titleJp: { fontSize: '0.92rem', color: 'var(--text-light)', fontWeight: 600 },

  // timeline
  timelineCard: { padding: '10px 8px', marginBottom: 10 },
  timelineRow: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  timeline: {
    flex: 1, display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0',
    scrollbarWidth: 'none', msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  dateChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '8px 12px', borderRadius: 12, minWidth: 62, flexShrink: 0,
    border: '1.5px solid rgba(192,132,252,0.15)', background: 'var(--tint-medium)',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', position: 'relative',
    minHeight: 44,
  },
  dateChipActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    border: '1.5px solid rgba(244,114,182,0.5)',
    boxShadow: '0 4px 14px rgba(236,72,153,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  dateChipToday: {
    border: '2px solid #c084fc', background: 'rgba(192,132,252,0.1)',
  },
  chipDay: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' },
  chipNum: { fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 },
  chipMonth: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)' },
  chipDot: {
    position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: '50%',
    background: '#f472b6',
  },
  chipSpecial: {
    position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: '50%',
    background: '#fbbf24', color: 'white', fontSize: '0.55rem', fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // date navigation arrows — beautiful gradient buttons
  navArrow: {
    width: 44, height: 44, borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(192,132,252,0.15))',
    boxShadow: '0 0 0 1.5px rgba(192,132,252,0.3)',
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-secondary)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.2s',
  },
  dateInfo: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 10,
  },
  dateInfoText: { fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' },
  tagUpcoming: {
    padding: '3px 10px', borderRadius: 50, background: 'rgba(16,185,129,0.12)',
    color: 'var(--correct-text)', fontSize: '0.78rem', fontWeight: 800,
  },
  tagPast: {
    padding: '3px 10px', borderRadius: 50, background: 'rgba(124,58,237,0.1)',
    color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 800,
  },
  tagSpecial: {
    padding: '3px 10px', borderRadius: 50, background: 'rgba(251,191,36,0.15)',
    color: 'var(--gold-text)', fontSize: '0.78rem', fontWeight: 800,
  },

  // two column layout
  twoCol: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10,
  },
  colCard: { padding: '14px 14px' },

  fieldLabel: {
    fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6,
    display: 'flex', alignItems: 'center', gap: 6,
  },

  // empty state
  emptyState: {
    padding: '28px 20px', marginBottom: 12, textAlign: 'center',
  },
  emptyIcon: { fontSize: '2.4rem', marginBottom: 8 },
  emptyTitle: {
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto',
  },

  // hashtag preview card
  hashtagCard: {
    padding: '14px 18px', marginBottom: 12,
  },

  addBtn: {
    marginLeft: 'auto', width: 44, height: 44, borderRadius: '50%',
    border: '1.5px solid rgba(244,114,182,0.3)', background: 'rgba(244,114,182,0.08)',
    fontSize: '0.9rem', fontWeight: 700, color: '#f472b6', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
  },
  imgGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
  },
  imgWrap: {
    position: 'relative', borderRadius: 8, overflow: 'hidden',
    border: '1.5px solid rgba(192,132,252,0.15)', aspectRatio: '1',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' },
  imgRemove: {
    position: 'absolute', top: 2, right: 2, width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', fontSize: '0.85rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  imgAddMore: {
    borderRadius: 8, border: '2px dashed rgba(192,132,252,0.25)', background: 'transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    aspectRatio: '1', fontFamily: 'inherit',
  },
  dropZone: {
    padding: '24px 10px', borderRadius: 12, border: '2px dashed rgba(192,132,252,0.25)',
    textAlign: 'center', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
    color: 'var(--text-light)', transition: 'all 0.2s',
  },

  // save
  saveRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24,
  },
  saveBtn: { fontSize: '1rem', padding: '13px 36px', letterSpacing: '0.01em' },
  savedTime: { fontSize: '0.78rem', fontWeight: 700, color: 'var(--correct-text)' },

  // overlay
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)', zIndex: 3000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  overlayImg: { maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 },
  overlayClose: {
    position: 'fixed', top: 16, right: 16, width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(192,132,252,0.12)', color: 'white', border: 'none',
    fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}
