import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { lessons } from '../data/lessons'
import { loadDifficultWords } from '../hooks/useWordTracker'
import { useXP } from '../hooks/useXP'
import { useAchievements } from '../hooks/useAchievements'
import { useIsMobile } from '../hooks/useIsMobile'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { useCoins } from '../hooks/useCoins'
import { copyTextToClipboard } from '../utils/clipboard'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const prefersReducedMotion = getPrefersReducedMotion()

// Get local YYYY-MM-DD string from a Date object (avoids UTC off-by-one for UTC+ users)
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseValidDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function localDateStrSafe(value) {
  const date = parseValidDate(value)
  return date ? localDateStr(date) : null
}

function toDateStringSafe(value) {
  return parseValidDate(value)?.toDateString() || null
}

function getQuizHistory(progress) {
  const all = [
    ...(progress.vocabQuizzes || []).map(q => ({ ...q, type: 'vocab' })),
    ...(progress.kanaQuizzes || []).map(q => ({ ...q, type: 'kana' })),
    ...(progress.kanjiQuizzes || []).map(q => ({ ...q, type: 'kanji' })),
    ...(progress.grammarQuizzes || []).map(q => ({ ...q, type: 'grammar' })),
  ].sort((a, b) => (parseValidDate(a.date)?.getTime() || 0) - (parseValidDate(b.date)?.getTime() || 0))
  return all
}

function getQuizTypeStats(quizHistory) {
  const types = ['vocab', 'kana', 'kanji', 'grammar']
  const typeIcons = { vocab: '📚', kana: 'あ', kanji: '漢', grammar: '文' }
  return types.map(type => {
    const qs = quizHistory.filter(q => q.type === type)
    return {
      type,
      icon: typeIcons[type],
      count: qs.length,
      avgScore: qs.length > 0
        ? Math.round(qs.reduce((s, q) => s + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / qs.length)
        : 0,
      bestScore: qs.length > 0
        ? Math.max(...qs.map(q => q.total > 0 ? Math.round((q.score / q.total) * 100) : 0))
        : 0,
    }
  }).filter(t => t.count > 0)
}

function getAccuracyTrend(quizHistory) {
  if (quizHistory.length < 2) return []
  const weeks = {}
  quizHistory.forEach(q => {
    const d = parseValidDate(q.date)
    if (!d) return
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = localDateStr(weekStart)
    if (!weeks[key]) weeks[key] = []
    weeks[key].push(q)
  })
  return Object.entries(weeks).map(([week, qs]) => ({
    week,
    avgScore: Math.round(qs.reduce((s, q) => s + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / qs.length),
    count: qs.length,
  })).slice(-8)
}

function getMotivationalMessage(totalXP, totalQuizzes) {
  if (totalQuizzes === 0) return { text: 'your journey begins here', sub: 'take your first quiz and start earning XP!', emoji: '🌸' }
  if (totalXP >= 5000) return { text: 'you are unstoppable', sub: 'a true nihongo warrior', emoji: '⚔️' }
  if (totalXP >= 2000) return { text: 'incredible dedication', sub: 'you keep showing up — and it shows', emoji: '🌟' }
  if (totalXP >= 1000) return { text: 'amazing progress', sub: 'every quiz brings you closer to fluency', emoji: '🎌' }
  if (totalXP >= 500) return { text: 'you\'re building momentum', sub: 'consistency is your superpower', emoji: '🔥' }
  if (totalXP >= 100) return { text: 'off to a great start', sub: 'keep going — every word counts', emoji: '✨' }
  return { text: 'the journey of a thousand words...', sub: '...begins with a single quiz 🌸', emoji: '🌱' }
}

export default function Stats() {
  const isMobile = useIsMobile()
  const { progress, getStats } = useProgress()
  const { formatTime } = useStudyTimer()
  const { totalXP, level, title: levelTitle, levelProgress, history: xpHistory } = useXP()
  const { unlockedLessons } = useUnlockedLessons()
  const { freezeDates } = useCoins()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedHeatDay, setSelectedHeatDay] = useState(null)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const copiedSummaryRef = useRef(null)
  useEffect(() => () => clearTimeout(copiedSummaryRef.current), [])

  const stats = useMemo(() => getStats(), [getStats])
  const quizHistory = useMemo(() => getQuizHistory(progress), [progress])
  const typeStats = useMemo(() => getQuizTypeStats(quizHistory), [quizHistory])
  const trend = useMemo(() => getAccuracyTrend(quizHistory), [quizHistory])
  const difficultWords = useMemo(() => loadDifficultWords(), [])

  const weekComparison = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0=Sun
    const startThisWeek = new Date(now)
    startThisWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7)) // Mon
    startThisWeek.setHours(0, 0, 0, 0)
    const startLastWeek = new Date(startThisWeek)
    startLastWeek.setDate(startThisWeek.getDate() - 7)

    const thisWeekQ = quizHistory.filter(q => {
      const date = parseValidDate(q.date)
      return date && date >= startThisWeek
    })
    const lastWeekQ = quizHistory.filter(q => {
      const date = parseValidDate(q.date)
      return date && date >= startLastWeek && date < startThisWeek
    })

    const xp = xpHistory || []
    const thisXP = xp.filter(e => {
      const date = parseValidDate(e.date)
      return date && date >= startThisWeek
    }).reduce((s, e) => s + (e.amount || 0), 0)
    const lastXP = xp.filter(e => {
      const date = parseValidDate(e.date)
      return date && date >= startLastWeek && date < startThisWeek
    }).reduce((s, e) => s + (e.amount || 0), 0)

    return {
      thisCount: thisWeekQ.length,
      lastCount: lastWeekQ.length,
      thisXP,
      lastXP,
      countDiff: thisWeekQ.length - lastWeekQ.length,
    }
  }, [quizHistory, xpHistory])

  const totalQuizzes = quizHistory.length
  const overallAvg = totalQuizzes > 0
    ? Math.round(quizHistory.reduce((s, q) => s + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / totalQuizzes)
    : 0
  const perfectScores = quizHistory.filter(q => q.total > 0 && q.score === q.total).length

  // best day (max XP in a single day)
  const bestDayXP = useMemo(() => {
    if (!xpHistory || xpHistory.length === 0) return 0
    const byDay = {}
    xpHistory.forEach(h => {
      const day = localDateStrSafe(h.date)
      if (day) byDay[day] = (byDay[day] || 0) + (h.amount || 0)
    })
    return Math.max(...Object.values(byDay), 0)
  }, [xpHistory])

  // total sessions = distinct days with at least one quiz (all types)
  const totalSessions = useMemo(() => {
    const xpDays = xpHistory.map(e => localDateStrSafe(e.date)).filter(Boolean)
    const quizDays = quizHistory.map(q => localDateStrSafe(q.date)).filter(Boolean)
    return new Set([...xpDays, ...quizDays]).size
  }, [quizHistory, xpHistory])

  const motivation = useMemo(() => getMotivationalMessage(totalXP, totalQuizzes), [totalXP, totalQuizzes])

  // Study insights (uses combined xpHistory + quizHistory for activity-based metrics)
  const studyInsights = useMemo(() => {
    const allActivity = [
      ...xpHistory.map(e => ({ date: e.date })),
      ...quizHistory.map(q => ({ date: q.date })),
    ]
    if (allActivity.length < 3) return null

    const hourCounts = Array(24).fill(0)
    allActivity.forEach(e => {
      const h = parseValidDate(e.date)?.getHours()
      if (Number.isInteger(h)) hourCounts[h]++
    })
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
    const peakLabel = peakHour < 6 ? 'night owl 🌙'
      : peakHour < 12 ? 'morning person 🌅'
      : peakHour < 18 ? 'afternoon learner ☀️'
      : 'evening studier 🌆'

    const today = new Date()
    let activeDays = 0
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = localDateStr(d)
      if (allActivity.some(e => localDateStrSafe(e.date) === dateStr)) activeDays++
    }
    const consistency = Math.round((activeDays / 14) * 100)

    const activeDaysAll = new Set(allActivity.map(e => localDateStrSafe(e.date)).filter(Boolean)).size
    const avgPerDay = activeDaysAll > 0 ? (allActivity.length / activeDaysAll).toFixed(1) : 0

    const typeCounts = {}
    quizHistory.forEach(q => { typeCounts[q.type] = (typeCounts[q.type] || 0) + 1 })
    const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]

    const weekdayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
    allActivity.forEach(e => {
      const d = parseValidDate(e.date)
      if (d) weekdayCounts[d.getDay()]++
    })
    const peakWeekdayIdx = weekdayCounts.indexOf(Math.max(...weekdayCounts))
    const peakWeekday = Math.max(...weekdayCounts) > 0 ? weekdayNames[peakWeekdayIdx] : null

    let improvement = null
    if (quizHistory.length >= 10) {
      const first5 = quizHistory.slice(0, 5)
      const last5 = quizHistory.slice(-5)
      const firstAvg = Math.round(first5.reduce((s, q) => s + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / 5)
      const lastAvg = Math.round(last5.reduce((s, q) => s + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / 5)
      improvement = lastAvg - firstAvg
    }

    return { peakHour, peakLabel, consistency, activeDays, activeDaysAll, avgPerDay, favoriteType, improvement, peakWeekday }
  }, [quizHistory, xpHistory])

  const augmentedStreak = useMemo(() => {
    const allActivity = [
      ...progress.vocabQuizzes,
      ...progress.kanaQuizzes,
      ...(progress.kanjiQuizzes || []),
      ...(progress.grammarQuizzes || []),
      ...(xpHistory || []),
    ]
    const activeDates = new Set(allActivity.map(q => toDateStringSafe(q.date)).filter(Boolean))
    freezeDates.forEach(dateStr => {
      const frozenDate = toDateStringSafe(dateStr + 'T12:00:00')
      if (frozenDate) activeDates.add(frozenDate)
    })
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 400; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      if (activeDates.has(d.toDateString())) {
        streak++
      } else if (i === 0) {
        continue
      } else {
        break
      }
    }
    return streak
  }, [progress, xpHistory, freezeDates])

  const achievementStats = useMemo(() => ({
    totalQuizzes,
    vocabQuizCount: stats.vocabQuizCount || 0,
    kanaQuizCount: stats.kanaQuizCount || 0,
    kanjiQuizCount: stats.kanjiQuizCount || 0,
    grammarQuizCount: stats.grammarQuizCount || 0,
    streak: augmentedStreak,
    bestVocabScore: stats.bestVocabScore || 0,
    bestKanaScore: stats.bestKanaScore || 0,
    lessonsViewedCount: stats.lessonsViewedCount || 0,
    totalLessons: unlockedLessons.length,
    totalXP,
    level,
    perfectScores,
    difficultWordsCleared: difficultWords.length === 0 && totalQuizzes > 0,
    nightStudy: new Date().getHours() >= 0 && new Date().getHours() < 5,
    earlyStudy: new Date().getHours() >= 5 && new Date().getHours() < 7,
    weekendStudy: [0, 6].includes(new Date().getDay()),
  }), [totalQuizzes, stats, totalXP, level, perfectScores, difficultWords.length, unlockedLessons.length, augmentedStreak])

  const { achievements, unlockedCount, totalCount, newBadgeCount, clearNewBadges } = useAchievements(achievementStats)

  // 8-week heatmap data (7 rows × 8 cols, Mon–Sun, newest week rightmost, includes current partial week)
  const weekHeatmap = useMemo(() => {
    const today = new Date()
    // Find the upcoming Sunday (end of current week, or today if today is Sunday)
    const dayOfWeek = today.getDay() // 0=Sun,1=Mon,...,6=Sat
    const endSunday = new Date(today)
    endSunday.setDate(today.getDate() + (7 - dayOfWeek) % 7)
    // Start from 8 weeks ago Monday (endSunday - 55 days = always a Monday)
    const startDay = new Date(endSunday)
    startDay.setDate(endSunday.getDate() - 55)

    const days = []
    for (let i = 0; i <= 55; i++) {
      const d = new Date(startDay)
      d.setDate(startDay.getDate() + i)
      const dateStr = localDateStr(d)
      // Use XP history for activity count (covers all quiz types), fall back to legacy quizHistory
      const dayXPEntries = xpHistory.filter(e => localDateStrSafe(e.date) === dateStr)
      const dayLegacyCount = quizHistory.filter(q => localDateStrSafe(q.date) === dateStr).length
      const dayXP = dayXPEntries.reduce((s, e) => s + (e.amount || 0), 0)
      days.push({
        date: dateStr,
        count: Math.max(dayXPEntries.length, dayLegacyCount),
        xp: dayXP,
        dow: d.getDay(), // 0=Sun,1=Mon,...,6=Sat
        isFuture: d > today,
      })
    }
    // Organize into 8 weeks (columns), each with 7 days (rows Mon–Sun)
    const weeks = []
    for (let w = 0; w < 8; w++) {
      weeks.push(days.slice(w * 7, w * 7 + 7))
    }
    return weeks
  }, [quizHistory, xpHistory])

  // Combined vocab + grammar quizzes for lesson-level analytics
  const lessonQuizzes = useMemo(() => [
    ...(progress.vocabQuizzes || []),
    ...(progress.grammarQuizzes || []),
  ], [progress.vocabQuizzes, progress.grammarQuizzes])

  // Top-5 hardest lessons (lowest average score, at least 1 quiz attempt)
  const hardestLessons = useMemo(() => {
    return lessons
      .map(l => {
        const qs = lessonQuizzes.filter(q => q.lessons?.includes(l.id))
        if (qs.length === 0) return null
        const avg = Math.round(qs.reduce((s, q) => s + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / qs.length)
        return { id: l.id, title: l.title, titleJp: l.titleJp, avg, attempts: qs.length }
      })
      .filter(Boolean)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5)
  }, [lessonQuizzes])

  // Top-3 best lessons (highest average score, at least 1 quiz attempt)
  const bestLessons = useMemo(() => {
    return lessons
      .map(l => {
        const qs = lessonQuizzes.filter(q => q.lessons?.includes(l.id))
        if (qs.length === 0) return null
        const avg = Math.round(qs.reduce((s, q) => s + (q.total > 0 ? (q.score / q.total) * 100 : 0), 0) / qs.length)
        return { id: l.id, title: l.title, titleJp: l.titleJp, avg, attempts: qs.length }
      })
      .filter(Boolean)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
  }, [lessonQuizzes])

  // Top-5 most practiced lessons (by quiz count)
  const mostPracticedLessons = useMemo(() => {
    return lessons
      .map(l => {
        const count = lessonQuizzes.filter(q => q.lessons?.includes(l.id)).length
        if (count === 0) return null
        return { id: l.id, titleJp: l.titleJp, count }
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [lessonQuizzes])

  // Top-5 most mastered words (highest hitCount in difficult words list)
  const topMasteredWords = useMemo(() => {
    return [...difficultWords]
      .filter(w => (w.hitCount || 0) > 0)
      .sort((a, b) => (b.hitCount || 0) - (a.hitCount || 0))
      .slice(0, 5)
  }, [difficultWords])

  // Count unique words studied (vocab from all quizzed lessons)
  const wordsStudied = useMemo(() => {
    const quizzedLessonIds = new Set(
      progress.vocabQuizzes.flatMap(q => q.lessons || [])
    )
    return lessons
      .filter(l => quizzedLessonIds.has(l.id))
      .reduce((sum, l) => sum + l.vocabulary.length, 0)
  }, [progress.vocabQuizzes])

  // Count grammar patterns from quizzed lessons
  const patternsStudied = useMemo(() => {
    const quizzedLessonIds = new Set(
      (progress.grammarQuizzes || []).flatMap(q => q.lessons || [])
    )
    return lessons
      .filter(l => quizzedLessonIds.has(l.id))
      .reduce((sum, l) => sum + (l.grammar?.length || 0), 0)
  }, [progress.grammarQuizzes])

  // Last 7 days XP bar chart data
  const last7DaysXP = useMemo(() => {
    const days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = localDateStr(d)
      const dayXP = xpHistory
        .filter(e => localDateStrSafe(e.date) === dateStr)
        .reduce((sum, e) => sum + e.amount, 0)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      days.push({ date: dateStr, xp: dayXP, dayLabel: i === 0 ? 'today' : dayNames[d.getDay()] })
    }
    return days
  }, [xpHistory])

  const maxDayXP = Math.max(...last7DaysXP.map(d => d.xp), 1)

  // Best streak: max combo value in XP history
  const bestStreak = useMemo(() => {
    if (!xpHistory || xpHistory.length === 0) return 0
    return Math.max(0, ...xpHistory.map(h => h.combo || 0))
  }, [xpHistory])

  // Best day streak: longest consecutive study days ever (all quiz types)
  const bestDayStreak = useMemo(() => {
    const xpDays = xpHistory.map(e => localDateStrSafe(e.date)).filter(Boolean)
    const quizDays = quizHistory.map(q => localDateStrSafe(q.date)).filter(Boolean)
    const days = [...new Set([...xpDays, ...quizDays])].sort()
    if (days.length === 0) return 0
    let max = 1, cur = 1
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1])
      const curr = new Date(days[i])
      const diff = (curr - prev) / (1000 * 60 * 60 * 24)
      if (diff === 1) { cur++; if (cur > max) max = cur }
      else cur = 1
    }
    return max
  }, [quizHistory, xpHistory])

  const tabs = [
    { key: 'overview', label: 'overview', icon: '📊' },
    { key: 'achievements', label: `badges${newBadgeCount > 0 ? ` (${newBadgeCount})` : ''}`, icon: '🏅' },
    { key: 'history', label: 'activity', icon: '📅' },
    { key: 'words', label: 'weak words', icon: '💪' },
  ]

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <h1 style={s.title}>
          <span>📊</span> statistics <span style={s.titleJp}>とうけい</span>
        </h1>
        <p style={s.subtitle}>your learning analytics</p>
        <button
          onClick={() => {
            const lines = [
              `📊 nihongo app — статистика`,
              `⚡ XP: ${totalXP} · уровень ${level} (${levelTitle})`,
              `🎯 квизов: ${totalQuizzes} · средний балл: ${overallAvg}%`,
              wordsStudied > 0 ? `📝 слов изучено: ${wordsStudied}` : '',
              patternsStudied > 0 ? `文 паттернов: ${patternsStudied}` : '',
              studyInsights?.activeDaysAll > 0 ? `📅 дней в приложении: ${studyInsights.activeDaysAll}` : '',
              augmentedStreak > 0 ? `🔥 текущий streak: ${augmentedStreak} дней` : '',
              studyInsights?.peakWeekday ? `📆 активный день: ${studyInsights.peakWeekday}` : '',
              ``,
              `日本語の勉強、がんばってます！`,
            ].filter(Boolean).join('\n')
            copyTextToClipboard(lines).then((success) => {
              if (!success) return
              setCopiedSummary(true)
              clearTimeout(copiedSummaryRef.current)
              copiedSummaryRef.current = setTimeout(() => setCopiedSummary(false), 2000)
            })
          }}
          style={{ marginTop: 8, padding: '5px 14px', borderRadius: 50, border: '1.5px solid rgba(192,132,252,0.25)', background: 'rgba(192,132,252,0.07)', color: copiedSummary ? 'var(--correct-text)' : 'var(--text-light)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minHeight: 44 }}
        >
          {copiedSummary ? '✓ скопировано' : '📋 скопировать сводку'}
        </button>
      </div>

      {/* motivational banner */}
      <div className="glass-sm animate-fadeInUp" style={s.motivationBanner}>
        <span style={s.motivationEmoji}>{motivation.emoji}</span>
        <div style={s.motivationText}>
          <div style={s.motivationMain}>{motivation.text}</div>
          <div style={s.motivationSub}>{motivation.sub}</div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ ...s.tabRow, ...(isMobile ? { flexWrap: 'wrap' } : {}) }} className="animate-fadeInUp">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              ...s.tab,
              ...(activeTab === t.key ? s.tabActive : {}),
              ...(isMobile ? { padding: '7px 12px', fontSize: '0.78rem' } : {}),
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="animate-fadeInUp">
          {/* big numbers */}
          <div style={s.bigNumRow}>
            <div className="glass-sm" style={s.bigNumCard}>
              <div style={{ ...s.bigNum, ...(isMobile ? { fontSize: '1.6rem' } : {}) }}>{totalQuizzes}</div>
              <div style={s.bigNumLabel}>quizzes taken</div>
              {totalQuizzes === 0 && <div style={s.bigNumHint}>start your first! 🌸</div>}
            </div>
            <div className="glass-sm" style={s.bigNumCard}>
              <div style={{
                ...s.bigNum,
                ...(isMobile ? { fontSize: '1.6rem' } : {}),
                color: overallAvg >= 90 ? 'var(--correct-text)' : overallAvg >= 70 ? '#f472b6' : 'var(--text-main)',
              }}>{overallAvg}%</div>
              <div style={s.bigNumLabel}>avg accuracy</div>
            </div>
            <div className="glass-sm" style={s.bigNumCard}>
              <div style={{ ...s.bigNum, ...(isMobile ? { fontSize: '1.6rem' } : {}), color: augmentedStreak > 0 ? 'var(--gold-text)' : 'var(--text-main)' }}>{augmentedStreak}</div>
              <div style={s.bigNumLabel}>day streak {augmentedStreak > 0 ? '🔥' : ''}</div>
            </div>
            <div className="glass-sm" style={s.bigNumCard}>
              <div style={{ ...s.bigNum, ...(isMobile ? { fontSize: '1.6rem' } : {}), color: 'var(--text-light)' }}>{perfectScores}</div>
              <div style={s.bigNumLabel}>perfect scores ✨</div>
            </div>
            <div className="glass-sm" style={s.bigNumCard}>
              <div style={{ ...s.bigNum, ...(isMobile ? { fontSize: '1.6rem' } : {}), color: 'var(--gold-text)' }}>{bestDayXP}</div>
              <div style={s.bigNumLabel}>best day XP 🏆</div>
            </div>
            <div className="glass-sm" style={s.bigNumCard}>
              <div style={{ ...s.bigNum, ...(isMobile ? { fontSize: '1.6rem' } : {}) }}>{totalSessions}</div>
              <div style={s.bigNumLabel}>sessions 📅</div>
            </div>
            {bestStreak > 0 && (
              <div className="glass-sm" style={s.bigNumCard}>
                <div style={{ ...s.bigNum, ...(isMobile ? { fontSize: '1.6rem' } : {}), color: '#f472b6' }}>{bestStreak}x</div>
                <div style={s.bigNumLabel}>best combo 🔥</div>
              </div>
            )}
            {bestDayStreak > 1 && (
              <div className="glass-sm" style={s.bigNumCard}>
                <div style={{ ...s.bigNum, ...(isMobile ? { fontSize: '1.6rem' } : {}), color: 'var(--gold-text)' }}>{bestDayStreak}</div>
                <div style={s.bigNumLabel}>best day streak 📅</div>
              </div>
            )}
            {studyInsights?.activeDaysAll > 0 && (
              <div className="glass-sm" style={s.bigNumCard}>
                <div style={{ ...s.bigNum, ...(isMobile ? { fontSize: '1.6rem' } : {}), color: 'var(--correct-text)' }}>{studyInsights.activeDaysAll}</div>
                <div style={s.bigNumLabel}>days in app 📆</div>
              </div>
            )}
          </div>

          {/* words studied */}
          {wordsStudied > 0 && (
            <div className="glass-sm" style={s.wordsStudiedBar}>
              <span style={s.wordsStudiedNum}>{wordsStudied}</span>
              <span style={s.wordsStudiedLabel}> words studied 📖</span>
              <span style={s.wordsStudiedTotal}>of {lessons.reduce((n, l) => n + l.vocabulary.length, 0)} total</span>
            </div>
          )}
          {patternsStudied > 0 && (
            <div className="glass-sm" style={s.wordsStudiedBar}>
              <span style={{ ...s.wordsStudiedNum, color: 'var(--text-light)' }}>{patternsStudied}</span>
              <span style={s.wordsStudiedLabel}> grammar patterns 文</span>
              <span style={s.wordsStudiedTotal}>of {lessons.reduce((n, l) => n + (l.grammar?.length || 0), 0)} total</span>
            </div>
          )}

          {/* this week vs last week */}
          {(weekComparison.thisCount > 0 || weekComparison.lastCount > 0) && (
            <div className="glass" style={s.card}>
              <div style={s.cardTitle}>эта неделя vs прошлая 📅</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'эта неделя', count: weekComparison.thisCount, xp: weekComparison.thisXP, highlight: true },
                  { label: 'прошлая неделя', count: weekComparison.lastCount, xp: weekComparison.lastXP, highlight: false },
                ].map((w, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 12, background: w.highlight ? 'rgba(244,114,182,0.07)' : 'rgba(192,132,252,0.04)', border: w.highlight ? '1.5px solid rgba(244,114,182,0.2)' : '1.5px solid rgba(192,132,252,0.1)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: 4 }}>{w.label}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: w.highlight ? '#f472b6' : 'var(--text-light)', lineHeight: 1 }}>{w.count}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 2 }}>квизов</div>
                    {w.xp > 0 && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold-text)', marginTop: 4 }}>+{w.xp} XP</div>}
                  </div>
                ))}
              </div>
              {weekComparison.countDiff !== 0 && (
                <div style={{ marginTop: 10, textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: weekComparison.countDiff > 0 ? 'var(--correct-text)' : 'var(--incorrect-text)' }}>
                  {weekComparison.countDiff > 0 ? `+${weekComparison.countDiff} квизов по сравнению с прошлой ↑` : `${weekComparison.countDiff} квизов по сравнению с прошлой ↓`}
                </div>
              )}
            </div>
          )}

          {/* XP & level — RPG character sheet feel */}
          <div className="glass" style={s.card}>
            <div style={s.cardTitle}>level & XP ✨</div>
            <div style={s.xpRow}>
              <div style={s.xpBadge}>
                <span style={s.xpBadgeNum}>{level}</span>
              </div>
              <div style={s.xpInfo}>
                <div style={s.xpTitle}>{levelTitle}</div>
                <div style={s.xpBarTrack}>
                  <div style={{ ...s.xpBarFill, width: `${Math.max(levelProgress * 100, 4)}%` }} />
                </div>
                <div style={s.xpBottomRow}>
                  <div style={s.xpNum}>
                    <span style={s.xpNumBig}>{totalXP}</span>
                    <span style={s.xpNumLabel}> total XP</span>
                  </div>
                  <div style={s.xpPct}>{Math.round(levelProgress * 100)}% to next level</div>
                </div>
              </div>
            </div>
          </div>

          {/* quiz type breakdown */}
          {typeStats.length > 0 ? (
            <div className="glass" style={s.card}>
              <div style={s.cardTitle}>quiz breakdown 📋</div>
              {typeStats.map(t => (
                <div key={t.type} style={s.breakdownRow}>
                  <span style={s.breakdownIcon}>{t.icon}</span>
                  <span style={s.breakdownType}>{t.type}</span>
                  <div style={s.breakdownBar}>
                    <div style={{
                      ...s.breakdownFill,
                      width: `${Math.max(t.avgScore, 2)}%`,
                      background: t.avgScore >= 80
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : t.avgScore >= 60
                          ? 'linear-gradient(90deg, #f472b6, #c084fc)'
                          : 'linear-gradient(90deg, #fbbf24, #fcd34d)',
                    }} />
                  </div>
                  <span style={s.breakdownScore}>{t.avgScore}%</span>
                  <span style={s.breakdownBest}>best: {t.bestScore}%</span>
                  <span style={s.breakdownCount}>×{t.count}</span>
                  <Link
                    to={t.type === 'vocab' ? '/quiz/vocab' : t.type === 'kana' ? '/quiz/kana' : t.type === 'kanji' ? '/quiz/kanji' : '/quiz/grammar'}
                    style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.6, textDecoration: 'none', flexShrink: 0, padding: '2px 6px' }}
                  >→</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass" style={s.card}>
              <div style={s.cardTitle}>quiz breakdown 📋</div>
              <div style={s.emptyMsg}>take some quizzes to see your breakdown!</div>
            </div>
          )}

          {/* accuracy trend */}
          {trend.length >= 2 && (
            <div className="glass" style={s.card}>
              <div style={s.cardTitle}>weekly trend 📈</div>
              <div style={s.trendChart}>
                {trend.map((w, i) => (
                  <div key={w.week} style={s.trendCol}>
                    <div style={s.trendBarWrap}>
                      <div style={{
                        ...s.trendBar,
                        height: `${w.avgScore}%`,
                        background: w.avgScore >= 80
                          ? 'linear-gradient(to top, #10b981, #34d399)'
                          : w.avgScore >= 60
                            ? 'linear-gradient(to top, #f472b6, #f9a8d4)'
                            : 'linear-gradient(to top, #fbbf24, #fcd34d)',
                      }} />
                    </div>
                    <div style={s.trendLabel}>{w.avgScore}%</div>
                    <div style={s.trendWeek}>w{i + 1}</div>
                  </div>
                ))}
              </div>
              {trend.length >= 2 && (() => {
                const diff = trend[trend.length - 1].avgScore - trend[0].avgScore
                return (
                  <div style={{
                    ...s.trendSummary,
                    color: diff >= 0 ? 'var(--correct-text)' : 'var(--incorrect-text)',
                    background: diff >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                  }}>
                    {diff >= 0 ? '📈' : '📉'} {diff >= 0 ? '+' : ''}{diff}% over {trend.length} weeks
                  </div>
                )
              })()}
            </div>
          )}

          {/* lesson completion */}
          <div className="glass" style={s.card}>
            <div style={s.cardTitle}>lesson progress 📚</div>
            <div style={s.lessonGrid}>
              {lessons.map(l => {
                const viewed = stats.lessonsViewed?.includes(l.id)
                const quizzes = lessonQuizzes.filter(q => q.lessons?.includes(l.id))
                const bestScore = quizzes.length > 0
                  ? Math.max(...quizzes.map(q => q.total > 0 ? Math.round((q.score / q.total) * 100) : 0))
                  : null
                return (
                  <Link key={l.id} to={`/lessons/${l.id}`} style={{
                    ...s.lessonDot,
                    background: bestScore !== null
                      ? bestScore >= 90 ? '#10b981'
                        : bestScore >= 70 ? '#fbbf24'
                          : '#f472b6'
                      : viewed ? 'rgba(192,132,252,0.4)' : 'rgba(200,200,200,0.2)',
                    color: bestScore !== null || viewed ? 'white' : 'var(--text-light)',
                    textDecoration: 'none', cursor: 'pointer',
                  }} title={`L${l.id}${bestScore !== null ? `: ${bestScore}%` : ''}`}>
                    {l.id}
                  </Link>
                )
              })}
            </div>
            <div style={s.legendRow}>
              <span style={s.legendItem}><span style={{ ...s.legendDot, background: '#10b981' }} /> 90%+</span>
              <span style={s.legendItem}><span style={{ ...s.legendDot, background: '#fbbf24' }} /> 70%+</span>
              <span style={s.legendItem}><span style={{ ...s.legendDot, background: '#f472b6' }} /> &lt;70%</span>
              <span style={s.legendItem}><span style={{ ...s.legendDot, background: 'rgba(192,132,252,0.4)' }} /> viewed</span>
            </div>
          </div>

          {/* hardest lessons */}
          {hardestLessons.length > 0 && (
            <div className="glass" style={s.card}>
              <div style={s.cardTitle}>hardest lessons 💀</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                {hardestLessons.map((l, i) => (
                  <div key={l.id} style={s.hardRow}>
                    <span style={s.hardRank}>#{i + 1}</span>
                    <Link to={`/lessons/${l.id}`} style={{ ...s.hardInfo, textDecoration: 'none' }}>
                      <span style={s.hardLesson}>L{l.id}</span>
                      <span style={s.hardTitle}>{l.titleJp || l.title}</span>
                    </Link>
                    <div style={s.hardBarWrap}>
                      <div style={{
                        ...s.hardBarFill,
                        width: `${l.avg}%`,
                        background: l.avg >= 70
                          ? 'linear-gradient(90deg, #fbbf24, #fcd34d)'
                          : 'linear-gradient(90deg, #f472b6, #f9a8d4)',
                      }} />
                    </div>
                    <span style={{
                      ...s.hardScore,
                      color: l.avg >= 70 ? 'var(--gold-text)' : 'var(--incorrect-text)',
                    }}>{l.avg}%</span>
                    <span style={s.hardAttempts}>×{l.attempts}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                average score across all vocab quiz attempts per lesson
              </div>
            </div>
          )}

          {/* best lessons */}
          {bestLessons.length > 0 && (
            <div className="glass" style={s.card}>
              <div style={s.cardTitle}>best lessons 🏅</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                {bestLessons.map((l, i) => (
                  <div key={l.id} style={s.hardRow}>
                    <span style={s.hardRank}>#{i + 1}</span>
                    <Link to={`/lessons/${l.id}`} style={{ ...s.hardInfo, textDecoration: 'none' }}>
                      <span style={s.hardLesson}>L{l.id}</span>
                      <span style={s.hardTitle}>{l.titleJp || l.title}</span>
                    </Link>
                    <div style={s.hardBarWrap}>
                      <div style={{
                        ...s.hardBarFill,
                        width: `${l.avg}%`,
                        background: 'linear-gradient(90deg, #34d399, #6ee7b7)',
                      }} />
                    </div>
                    <span style={{ ...s.hardScore, color: 'var(--correct-text)' }}>{l.avg}%</span>
                    <span style={s.hardAttempts}>×{l.attempts}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                top 3 lessons by average vocab quiz score
              </div>
            </div>
          )}

          {/* top-5 most practiced lessons */}
          {mostPracticedLessons.length > 0 && (
            <div className="glass" style={s.card}>
              <div style={s.cardTitle}>most practiced 🔥</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {mostPracticedLessons.map((l, i) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...s.hardRank, color: i === 0 ? 'var(--gold-text)' : i === 1 ? '#94a3b8' : i === 2 ? 'var(--amber-text)' : 'var(--text-light)' }}>#{i + 1}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', minWidth: 28 }}>L{l.id}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1 }}>{l.titleJp}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: 'rgba(192,132,252,0.1)', padding: '2px 8px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                      {l.count} {l.count === 1 ? 'quiz' : 'quizzes'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                top 5 lessons by number of vocab quizzes
              </div>
            </div>
          )}

          {/* top-5 mastered words */}
          {topMasteredWords.length > 0 && (
            <div className="glass" style={s.card}>
              <div style={s.cardTitle}>top mastered words 🏆</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {topMasteredWords.map((w, i) => (
                  <div key={w.japanese + i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...s.hardRank, color: i === 0 ? 'var(--gold-text)' : i === 1 ? '#94a3b8' : i === 2 ? 'var(--amber-text)' : 'var(--text-light)' }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{w.kanji || (w.japanese || '').replace(/\[.*?\]/g, '').trim()}</span>
                      {w.romaji && <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginLeft: 6, fontStyle: 'italic' }}>{(w.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</span>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1 }}>{w.russian}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--correct-text)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                      ✓ ×{w.hitCount}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                words you once struggled with but now get right
              </div>
            </div>
          )}

          {/* 7-day XP bar chart */}
          <div className="glass" style={s.card}>
            <div style={s.cardTitle}>last 7 days XP 📅</div>
            <div style={s.xpChart}>
              {last7DaysXP.map(d => (
                <div key={d.date} style={s.xpChartCol}>
                  <div style={s.xpChartXpLabel}>{d.xp > 0 ? d.xp : ''}</div>
                  <div style={s.xpChartBarWrap}>
                    <div style={{
                      ...s.xpChartBar,
                      height: `${Math.max((d.xp / maxDayXP) * 100, d.xp > 0 ? 4 : 0)}%`,
                      background: d.dayLabel === 'today'
                        ? 'linear-gradient(to top, #f472b6, #c084fc)'
                        : 'linear-gradient(to top, #a855f7, #c084fc)',
                    }} />
                  </div>
                  <div style={{
                    ...s.xpChartDayLabel,
                    color: d.dayLabel === 'today' ? '#f472b6' : 'var(--text-light)',
                    fontWeight: d.dayLabel === 'today' ? 800 : 600,
                  }}>{d.dayLabel}</div>
                </div>
              ))}
            </div>
            {last7DaysXP.every(d => d.xp === 0) && (
              <div style={s.emptyMsg}>no XP yet — take some quizzes! 🌸</div>
            )}
          </div>

          {/* study time */}
          <div className="glass" style={s.card}>
            <div style={s.cardTitle}>today's session ⏱️</div>
            <div style={s.studyTime}>{formatTime()}</div>
            <div style={s.studyTimeLabel}>time spent studying today</div>
          </div>

          {/* study insights */}
          {studyInsights && (
            <div className="glass" style={s.card}>
              <div style={s.cardTitle}>study insights 🧠</div>
              <div style={{ ...s.insightsGrid, ...(isMobile ? { gridTemplateColumns: '1fr' } : {}) }}>
                <div style={s.insightItem}>
                  <div style={s.insightIcon}>🕐</div>
                  <div style={s.insightContent}>
                    <div style={s.insightLabel}>peak hour</div>
                    <div style={s.insightValue}>{studyInsights.peakHour}:00</div>
                    <div style={s.insightDesc}>{studyInsights.peakLabel}</div>
                  </div>
                </div>
                <div style={s.insightItem}>
                  <div style={s.insightIcon}>📅</div>
                  <div style={s.insightContent}>
                    <div style={s.insightLabel}>consistency (14d)</div>
                    <div style={s.insightValue}>{studyInsights.consistency}%</div>
                    <div style={s.insightDesc}>{studyInsights.activeDays}/14 active days</div>
                  </div>
                </div>
                <div style={s.insightItem}>
                  <div style={s.insightIcon}>📝</div>
                  <div style={s.insightContent}>
                    <div style={s.insightLabel}>avg per day</div>
                    <div style={s.insightValue}>{studyInsights.avgPerDay}</div>
                    <div style={s.insightDesc}>quizzes on active days</div>
                  </div>
                </div>
                {studyInsights.favoriteType && (
                  <div style={s.insightItem}>
                    <div style={s.insightIcon}>
                      {studyInsights.favoriteType[0] === 'vocab' ? '📚' : studyInsights.favoriteType[0] === 'kana' ? 'あ' : studyInsights.favoriteType[0] === 'kanji' ? '漢' : '文'}
                    </div>
                    <div style={s.insightContent}>
                      <div style={s.insightLabel}>favorite quiz</div>
                      <div style={s.insightValue}>{studyInsights.favoriteType[0]}</div>
                      <div style={s.insightDesc}>{studyInsights.favoriteType[1]}× played</div>
                    </div>
                  </div>
                )}
                {studyInsights.peakWeekday && (
                  <div style={s.insightItem}>
                    <div style={s.insightIcon}>📅</div>
                    <div style={s.insightContent}>
                      <div style={s.insightLabel}>активный день</div>
                      <div style={s.insightValue}>{studyInsights.peakWeekday}</div>
                      <div style={s.insightDesc}>чаще всего учишься</div>
                    </div>
                  </div>
                )}
              </div>
              {studyInsights.improvement !== null && (
                <div style={{
                  ...s.improvementBadge,
                  color: studyInsights.improvement >= 0 ? 'var(--correct-text)' : 'var(--incorrect-text)',
                  background: studyInsights.improvement >= 0
                    ? 'rgba(16,185,129,0.08)'
                    : 'rgba(244,63,94,0.08)',
                  borderColor: studyInsights.improvement >= 0
                    ? 'rgba(16,185,129,0.25)'
                    : 'rgba(244,63,94,0.25)',
                }}>
                  {studyInsights.improvement >= 0 ? '📈' : '📉'} accuracy trend: {studyInsights.improvement >= 0 ? '+' : ''}{studyInsights.improvement}% (first 5 vs last 5 quizzes)
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="animate-fadeInUp">
          <div className="glass" style={s.card}>
            <div style={s.cardTitle}>
              achievements {unlockedCount}/{totalCount} 🏅
            </div>
            <div style={s.achieveProgress}>
              <div style={s.achieveBarTrack}>
                <div style={{ ...s.achieveBarFill, width: `${(unlockedCount / totalCount) * 100}%` }} />
              </div>
              <span style={s.achieveBarLabel}>{Math.round((unlockedCount / totalCount) * 100)}%</span>
            </div>
          </div>

          {unlockedCount === 0 && (
            <div className="glass-sm" style={{ ...s.card, textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏅</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: 6 }}>no badges yet</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>take quizzes to start unlocking achievements 🌸</div>
            </div>
          )}

          {newBadgeCount > 0 && (
            <div className="glass" style={{ ...s.card, background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(192,132,252,0.08))' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold-text)', marginBottom: 8 }}>
                {newBadgeCount} new badge{newBadgeCount > 1 ? 's' : ''} unlocked! 🎉
              </div>
              <div style={s.newBadgeRow}>
                {achievements.filter(a => a.isNew).map(a => (
                  <div key={a.id} style={s.newBadgeItem} className="animate-pop">
                    <span style={{ fontSize: '1.6rem' }}>{a.icon}</span>
                    <span style={s.newBadgeName}>{a.title}</span>
                  </div>
                ))}
              </div>
              <button onClick={clearNewBadges} className="btn-hover" style={s.clearNewBtn}>dismiss</button>
            </div>
          )}

          <div style={s.achieveGrid}>
            {achievements.map(a => (
              <div
                key={a.id}
                className={a.unlocked ? 'glass-sm glass-hover' : ''}
                style={{
                  ...s.achieveCard,
                  ...(a.unlocked ? s.achieveCardUnlocked : s.achieveCardLocked),
                  ...(a.isNew ? { boxShadow: '0 4px 20px rgba(251, 191, 36, 0.3)', borderColor: 'rgba(251, 191, 36, 0.5)' } : {}),
                }}
              >
                <div style={{
                  ...s.achieveIcon,
                  ...(a.unlocked ? {} : { filter: 'grayscale(1)', opacity: 0.4 }),
                }}>
                  {a.icon}
                </div>
                <div style={s.achieveInfo}>
                  <div style={{
                    ...s.achieveName,
                    color: a.unlocked ? 'var(--text-main)' : 'var(--text-light)',
                  }}>
                    {a.title}
                  </div>
                  <div style={s.achieveNameJp}>{a.titleJp}</div>
                  <div style={s.achieveDesc}>{a.description}</div>
                </div>
                {a.unlocked && (
                  <div style={s.achieveCheck}>✓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-fadeInUp">
          {/* 8-week heatmap */}
          <div className="glass" style={s.card}>
            <div style={s.cardTitle}>8 weeks activity 📅</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
              {/* day labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 2 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} style={{ width: 14, height: 14, fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</div>
                ))}
              </div>
              {/* weeks columns */}
              <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                {weekHeatmap.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    {week.map((day, di) => (
                      <div
                        key={day.date || di}
                        onClick={() => !day.isFuture && day.count > 0 && setSelectedHeatDay(day)}
                        onMouseEnter={() => !day.isFuture && day.count > 0 && setSelectedHeatDay(day)}
                        onMouseLeave={() => setSelectedHeatDay(null)}
                        onFocus={() => !day.isFuture && day.count > 0 && setSelectedHeatDay(day)}
                        onBlur={() => setSelectedHeatDay(null)}
                        tabIndex={!day.isFuture && day.count > 0 ? 0 : undefined}
                        role={!day.isFuture && day.count > 0 ? 'button' : undefined}
                        aria-label={!day.isFuture && day.count > 0 ? `${day.date}: ${day.count} quiz${day.count === 1 ? '' : 'zes'}${day.xp > 0 ? `, +${day.xp} XP` : ''}` : undefined}
                        style={{
                          height: 14, borderRadius: 3,
                          background: day.isFuture ? 'transparent'
                            : day.count === 0 ? 'rgba(192,132,252,0.1)'
                            : day.count === 1 ? 'rgba(168,85,247,0.35)'
                            : day.count <= 3 ? 'rgba(168,85,247,0.6)'
                            : 'rgba(168,85,247,0.9)',
                          border: day.isFuture ? 'none' : '1px solid rgba(192,132,252,0.1)',
                          cursor: !day.isFuture && day.count > 0 ? 'pointer' : 'default',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...s.heatmapLegend, marginTop: 8 }}>
              <span style={s.heatmapLegendItem}>less</span>
              {['rgba(192,132,252,0.1)', 'rgba(168,85,247,0.35)', 'rgba(168,85,247,0.6)', 'rgba(168,85,247,0.9)'].map((bg) => (
                <span key={bg} style={{ ...s.heatmapLegendDot, background: bg }} />
              ))}
              <span style={s.heatmapLegendItem}>more</span>
            </div>
            {selectedHeatDay && (
              <div style={{ marginTop: 8, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textAlign: 'center', animation: prefersReducedMotion ? undefined : 'fadeIn 0.15s ease' }} role="status" aria-live="polite">
                📅 {selectedHeatDay.date} · {selectedHeatDay.count} {selectedHeatDay.count === 1 ? 'quiz' : 'quizzes'}{selectedHeatDay.xp > 0 ? ` · +${selectedHeatDay.xp} XP` : ''}
              </div>
            )}
          </div>

          {/* recent quiz history */}
          <div className="glass" style={s.card}>
            <div style={s.cardTitle}>recent quizzes 📋</div>
            {quizHistory.length === 0 ? (
              <div style={s.emptyMsgWarm}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🌸</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>no quizzes yet!</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>start your first quiz and watch this fill up</div>
              </div>
            ) : (
              <div style={s.historyList}>
                {quizHistory.slice(-15).reverse().map((q, i) => {
                  const pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0
                  const d = parseValidDate(q.date)
                  return (
                    <div key={q.date + q.type + i} style={s.historyItem}>
                      <span style={{
                        ...s.historyDot,
                        background: pct >= 90 ? '#10b981' : pct >= 70 ? '#fbbf24' : '#f472b6',
                      }} />
                      <span style={s.historyType}>{q.type}</span>
                      <span style={{
                        ...s.historyScore,
                        color: pct >= 90 ? 'var(--correct-text)' : pct >= 70 ? 'var(--gold-text)' : '#f472b6',
                      }}>{pct}%</span>
                      <span style={s.historyDetail}>{q.score}/{q.total}</span>
                      <span style={s.historyDate}>
                        {d ? `${d.getDate()}/${d.getMonth() + 1}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'words' && (
        <div className="animate-fadeInUp">
          <div className="glass" style={s.card}>
            <div style={s.cardTitle}>difficult words ({difficultWords.length}) 💪</div>
            {difficultWords.length === 0 ? (
              <div style={s.emptyMsgWarm}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>no difficult words!</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-light)' }}>amazing — you're on top of everything 完璧です！</div>
              </div>
            ) : (
              <div style={s.wordList}>
                {difficultWords
                  .sort((a, b) => (b.missCount || 1) - (a.missCount || 1))
                  .slice(0, 30)
                  .map((w, i) => (
                    <div key={(w.japanese || '') + (w.lesson || '') + i} style={s.wordItem}>
                      <span style={s.wordJp}>{w.kanji || (w.japanese || '').replace(/\[.*?\]/g, '').trim()}</span>
                      <span style={s.wordRomaji}>{(w.romaji || '').replace(/\s*\[.*?\]/g, '').trim()}</span>
                      <span style={s.wordRu}>{w.russian}</span>
                      <span style={s.wordMiss}>
                        {w.missCount || 1}× missed
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {difficultWords.length > 0 && (
              <Link to="/quiz/weak" className="btn btn-cute" style={{ marginTop: 14, fontSize: '0.88rem' }}>
                drill them in weak sprint 🔥
              </Link>
            )}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 90, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/mistakes" className="btn btn-cute" style={{ fontSize: '0.88rem' }}>
          mistakes journal 📒
        </Link>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.88rem' }}>
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
  titleJp: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 4 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },

  // Motivational banner
  motivationBanner: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 18px', marginBottom: 16, textAlign: 'left',
  },
  motivationEmoji: { fontSize: '1.8rem', flexShrink: 0 },
  motivationText: { flex: 1 },
  motivationMain: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 },
  motivationSub: { fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-light)' },

  tabRow: {
    display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center',
  },
  tab: {
    padding: '9px 18px', borderRadius: 50, fontSize: '0.88rem', fontWeight: 700,
    color: 'var(--text-secondary)', background: 'none', border: '1.5px solid rgba(192,132,252,0.2)',
    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 4, minHeight: 44,
  },
  tabActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    borderColor: 'transparent', boxShadow: '0 4px 14px rgba(236,72,153,0.3)',
  },

  // Big numbers — 4 across
  bigNumRow: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16,
  },
  bigNumCard: {
    padding: '16px 8px', textAlign: 'center',
  },
  bigNum: {
    fontSize: '1.9rem', fontWeight: 900,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1.1, marginBottom: 4,
  },
  bigNumLabel: {
    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'lowercase',
  },
  bigNumHint: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 2,
  },

  card: { padding: 18, marginBottom: 14, textAlign: 'center' },
  cardTitle: {
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12,
    textTransform: 'lowercase',
  },

  // XP row — enhanced
  xpRow: { display: 'flex', alignItems: 'center', gap: 16 },
  xpBadge: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: '0 6px 20px rgba(236, 72, 153, 0.3)',
  },
  xpBadgeNum: { fontSize: '1.4rem', fontWeight: 900, color: 'white' },
  xpInfo: { flex: 1, minWidth: 0, textAlign: 'left' },
  xpTitle: {
    fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)',
    textTransform: 'lowercase', marginBottom: 6,
  },
  xpBarTrack: {
    height: 8, borderRadius: 50, background: 'rgba(192,132,252,0.15)',
    overflow: 'hidden', marginBottom: 6,
  },
  xpBarFill: {
    height: '100%', borderRadius: 50,
    background: 'linear-gradient(90deg, #f472b6, #c084fc)',
    transition: 'width 0.8s ease',
  },
  xpBottomRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  xpNum: { display: 'flex', alignItems: 'baseline', gap: 2 },
  xpNumBig: { fontSize: '1rem', fontWeight: 900, color: 'var(--text-light)' },
  xpNumLabel: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)' },
  xpPct: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)' },

  // Quiz breakdown
  breakdownRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  breakdownIcon: { fontSize: '1rem', flexShrink: 0, width: 20, textAlign: 'center' },
  breakdownType: {
    fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: 48, textAlign: 'right',
    textTransform: 'lowercase',
  },
  breakdownBar: {
    flex: 1, height: 10, borderRadius: 50, background: 'rgba(200,200,200,0.2)', overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%', borderRadius: 50, transition: 'width 0.6s ease',
  },
  breakdownScore: {
    fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)', minWidth: 36,
  },
  breakdownBest: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', minWidth: 56,
    display: 'flex', alignItems: 'center',
  },
  breakdownCount: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', minWidth: 24,
  },

  // Trend chart
  trendChart: {
    display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'flex-end', height: 120, marginBottom: 8,
  },
  trendCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
  },
  trendBarWrap: {
    width: '100%', height: 80, display: 'flex', alignItems: 'flex-end',
  },
  trendBar: {
    width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease', minHeight: 2,
  },
  trendLabel: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', marginTop: 4,
  },
  trendWeek: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)' },
  trendSummary: {
    marginTop: 10, padding: '7px 14px', borderRadius: 10,
    fontSize: '0.78rem', fontWeight: 700, textAlign: 'center',
  },

  // Lesson grid
  lessonGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
    gap: 4, marginBottom: 10,
  },
  lessonDot: {
    width: '100%', aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, transition: 'all 0.2s',
  },
  legendRow: {
    display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600,
    color: 'var(--text-light)',
  },
  legendDot: { width: 8, height: 8, borderRadius: 2, display: 'inline-block' },

  // Study time
  studyTime: {
    fontSize: '2.2rem', fontWeight: 900,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    marginBottom: 4,
  },
  studyTimeLabel: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)',
  },

  // Heatmap
  heatmapGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3, marginBottom: 10,
  },
  heatmapCell: {
    aspectRatio: '1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.2s', cursor: 'help',
  },
  heatmapLegend: {
    display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
  },
  heatmapLegendItem: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)' },
  heatmapLegendDot: { width: 10, height: 10, borderRadius: 2 },

  // History list
  historyList: { display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' },
  historyItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
    borderRadius: 10, background: 'rgba(192,132,252,0.1)',
  },
  historyDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  historyType: {
    fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: 54,
    textTransform: 'lowercase',
  },
  historyScore: { fontSize: '0.95rem', fontWeight: 900, minWidth: 38 },
  historyDetail: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', flex: 1 },
  historyDate: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)' },

  // Empty states
  emptyMsg: {
    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', padding: 16,
  },
  emptyMsgWarm: {
    padding: '20px 16px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600,
    color: 'var(--text-main)',
  },

  // Weak words
  wordList: {
    display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', maxHeight: 400,
    overflowY: 'auto',
  },
  wordItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
    borderRadius: 10, background: 'rgba(192,132,252,0.1)', flexWrap: 'wrap',
  },
  wordJp: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', minWidth: 60 },
  wordRomaji: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic', minWidth: 60 },
  wordRu: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', flex: 1 },
  wordMiss: {
    fontSize: '0.78rem', fontWeight: 700, color: '#f472b6',
    background: 'rgba(244,114,182,0.1)', padding: '2px 8px', borderRadius: 50,
  },

  // Achievements
  achieveProgress: { display: 'flex', alignItems: 'center', gap: 10 },
  achieveBarTrack: {
    flex: 1, height: 10, borderRadius: 50, background: 'rgba(192,132,252,0.15)', overflow: 'hidden',
  },
  achieveBarFill: {
    height: '100%', borderRadius: 50,
    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
    transition: 'width 0.8s ease', minWidth: 4,
  },
  achieveBarLabel: { fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-text)', minWidth: 30 },
  achieveGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  achieveCard: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
    borderRadius: 14, transition: 'all 0.2s',
  },
  achieveCardUnlocked: { border: '1.5px solid rgba(192,132,252,0.2)' },
  achieveCardLocked: {
    background: 'rgba(200,200,200,0.06)', border: '1.5px solid rgba(200,200,200,0.1)',
  },
  achieveIcon: { fontSize: '1.6rem', lineHeight: 1, flexShrink: 0, width: 36, textAlign: 'center' },
  achieveInfo: { flex: 1, minWidth: 0, textAlign: 'left' },
  achieveName: { fontSize: '0.95rem', fontWeight: 800, textTransform: 'lowercase' },
  achieveNameJp: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 1 },
  achieveDesc: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 2 },
  achieveCheck: {
    width: 24, height: 24, borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    color: 'white', fontSize: '0.72rem', fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  newBadgeRow: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 10 },
  newBadgeItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  newBadgeName: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)' },
  clearNewBtn: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)',
    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    textDecoration: 'underline', minHeight: 44,
  },

  // Hardest lessons
  hardRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
    borderBottom: '1px solid rgba(192,132,252,0.08)',
  },
  hardRank: {
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', minWidth: 20,
  },
  hardInfo: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 90 },
  hardLesson: {
    fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-light)',
    background: 'rgba(168,85,247,0.1)', padding: '2px 7px', borderRadius: 50,
  },
  hardTitle: {
    fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)',
    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 100,
  },
  hardBarWrap: {
    flex: 1, height: 8, borderRadius: 50, background: 'rgba(200,200,200,0.2)', overflow: 'hidden',
  },
  hardBarFill: { height: '100%', borderRadius: 50, transition: 'width 0.6s ease' },
  hardScore: { fontSize: '0.9rem', fontWeight: 900, minWidth: 36, textAlign: 'right' },
  hardAttempts: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', minWidth: 20,
  },

  // Words studied bar
  wordsStudiedBar: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
    marginBottom: 14, justifyContent: 'center',
  },
  wordsStudiedNum: {
    fontSize: '1.6rem', fontWeight: 900,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    lineHeight: 1,
  },
  wordsStudiedLabel: {
    fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)',
  },
  wordsStudiedTotal: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)', marginLeft: 4,
  },

  // 7-day XP chart
  xpChart: {
    display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'flex-end', height: 130, marginBottom: 8,
  },
  xpChartCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
  },
  xpChartXpLabel: {
    fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', minHeight: 18,
    marginBottom: 2,
  },
  xpChartBarWrap: {
    width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end',
  },
  xpChartBar: {
    width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease', minHeight: 0,
  },
  xpChartDayLabel: {
    fontSize: '0.72rem', marginTop: 4, textAlign: 'center',
  },

  // Insights
  insightsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  insightItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 12, background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.08)',
  },
  insightIcon: { fontSize: '1.3rem', lineHeight: 1, flexShrink: 0 },
  insightContent: { flex: 1, minWidth: 0 },
  insightLabel: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)',
    textTransform: 'lowercase', marginBottom: 2,
  },
  insightValue: { fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2 },
  insightDesc: { fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 2 },
  improvementBadge: {
    marginTop: 12, padding: '8px 14px', borderRadius: 10, border: '1.5px solid',
    fontSize: '0.78rem', fontWeight: 700, textAlign: 'center',
  },
}
