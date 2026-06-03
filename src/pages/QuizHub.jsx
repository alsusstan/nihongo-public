import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useProgress } from '../hooks/useProgress'
import { useXP } from '../hooks/useXP'
import { useIsMobile } from '../hooks/useIsMobile'
import { getStoredJson, getStoredNonNegativeInt } from '../utils/localSettings'

function getReadingCompleted() {
  const parsed = getStoredJson('nihongo-reading-completed', [])
  return Array.isArray(parsed) ? parsed.length : 0
}
function getSprintBest() {
  return getStoredNonNegativeInt('nihongo-sprint-best', 0)
}
function isDailyDone() {
  const data = getStoredJson('nihongo-daily-challenge', null)
  if (!data || typeof data !== 'object') return false
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  return data.lastSeed === seed && data.completed
}

const QUIZ_GROUPS = [
  {
    label: 'Vocabulary & Reading',
    items: [
      {
        path: '/quiz/vocab',
        icon: '✨',
        name: 'Vocab Quiz',
        desc: 'Multiple-choice from lessons 1–25',
        type: 'vocab',
      },
      {
        path: '/quiz/kana',
        icon: 'あ',
        name: 'Kana Quiz',
        desc: 'Hiragana & katakana recognition',
        type: 'kana',
      },
      {
        path: '/quiz/kanji',
        icon: '漢',
        name: 'Kanji Quiz',
        desc: 'Kanji meaning & reading',
        type: 'kanji',
      },
      {
        path: '/quiz/furigana',
        icon: '読',
        name: 'Reading Builder',
        desc: 'Pick readings for each kanji in a word',
        type: 'kanji',
      },
      {
        path: '/quiz/n5',
        icon: '🏅',
        name: 'N5 Quiz',
        desc: 'JLPT N5 level vocabulary',
        type: null,
      },
      {
        path: '/quiz/weak',
        icon: '🎯',
        name: 'Weak Words Sprint',
        desc: 'Focus on words you miss most',
        type: null,
      },
    ],
  },
  {
    label: 'Grammar & Conjugation',
    items: [
      {
        path: '/quiz/grammar',
        icon: '文',
        name: 'Grammar Quiz',
        desc: 'Pick the right grammar pattern',
        type: 'grammar',
      },
      {
        path: '/quiz/fill-in',
        icon: '✏️',
        name: 'Fill-in Exercises',
        desc: 'Type the missing word',
        type: null,
      },
      {
        path: '/quiz/particles',
        icon: '助',
        name: 'Particle Quiz',
        desc: 'は/が/を/に/で/へ and more',
        type: null,
      },
      {
        path: '/quiz/te-form',
        icon: '🔄',
        name: 'Te-Form Quiz',
        desc: 'Verb て-form conjugation',
        type: null,
      },
      {
        path: '/quiz/conjugation',
        icon: '🔀',
        name: 'Conjugation Quiz',
        desc: '9 verb forms incl. potential & passive',
        type: null,
      },
      {
        path: '/quiz/adjectives',
        icon: '形',
        name: 'Adjective Quiz',
        desc: 'い & な adjective forms',
        type: null,
      },
      {
        path: '/quiz/sentences',
        icon: '🧩',
        name: 'Sentence Builder',
        desc: 'Arrange words into sentences',
        type: null,
      },
    ],
  },
  {
    label: 'Numbers & Counters',
    items: [
      {
        path: '/quiz/numbers',
        icon: '🔢',
        name: 'Numbers',
        desc: 'Read and write Japanese numbers',
        type: null,
      },
      {
        path: '/quiz/counters',
        icon: '数',
        name: 'Counters',
        desc: 'Counting with the right suffix',
        type: null,
      },
    ],
  },
  {
    label: 'Study & Review',
    items: [
      {
        path: '/review',
        icon: '🃏',
        name: 'Flash Cards',
        desc: 'Review vocab with flip cards',
        type: null,
      },
      {
        path: '/reading',
        icon: '📰',
        name: 'Reading Practice',
        desc: 'Comprehension with dialog texts',
        type: null,
      },
      {
        path: '/kanji/practice',
        icon: '✍️',
        name: 'Kanji Writing',
        desc: 'Practice drawing kanji from memory',
        type: null,
      },
    ],
  },
  {
    label: 'Challenges',
    items: [
      {
        path: '/daily',
        icon: '🌅',
        name: 'Daily Challenge',
        desc: '8 mixed questions per day',
        type: null,
      },
      {
        path: '/game/matching',
        icon: '🎮',
        name: 'Matching Game',
        desc: 'Match kana/kanji pairs fast',
        type: null,
      },
      {
        path: '/game/typing',
        icon: '⌨️',
        name: 'Typing Challenge',
        desc: 'Type Japanese romaji at speed',
        type: null,
      },
    ],
  },
]

function pct(score, total) {
  if (!total) return 0
  return Math.round((score / total) * 100)
}

function ScorePill({ score, total }) {
  const p = pct(score, total)
  const color = p >= 80 ? 'var(--correct-text)' : p >= 60 ? 'var(--gold-text)' : 'var(--incorrect-text)'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: '0.72rem', fontWeight: 800,
      color, padding: '2px 7px', borderRadius: 20,
      background: p >= 80 ? 'rgba(22,163,74,0.12)' : p >= 60 ? 'rgba(217,119,6,0.12)' : 'rgba(220,38,38,0.12)',
    }}>
      {score}/{total} · {p}%
    </span>
  )
}

export default function QuizHub() {
  const { progress } = useProgress()
  const { level, totalXP } = useXP()
  const isMobile = useIsMobile()

  // Last results per tracked type
  const lastScores = useMemo(() => {
    const get = (arr) => arr.length > 0 ? arr[arr.length - 1] : null
    return {
      vocab: get(progress.vocabQuizzes),
      kana: get(progress.kanaQuizzes),
      kanji: get(progress.kanjiQuizzes),
      grammar: get(progress.grammarQuizzes),
    }
  }, [progress.vocabQuizzes, progress.kanaQuizzes, progress.kanjiQuizzes, progress.grammarQuizzes])

  // Extra badges for specific quizzes
  const badges = useMemo(() => {
    const readingDone = getReadingCompleted()
    const sprintBest = getSprintBest()
    const dailyDone = isDailyDone()
    return {
      '/reading': readingDone > 0 ? `${readingDone}/25` : null,
      '/quiz/weak': sprintBest > 0 ? `best ${sprintBest}%` : null,
      '/daily': dailyDone ? '✓ done' : null,
    }
  }, [])

  // Total quizzes done
  const totalDone = progress.vocabQuizzes.length + progress.kanaQuizzes.length +
    progress.kanjiQuizzes.length + progress.grammarQuizzes.length

  return (
    <div className="page animate-fadeInUp">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: 4 }}>
          Quiz Hub 🎯
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: 14, ...(isMobile ? { paddingLeft: 54 } : {}) }}>
          All quizzes in one place · Level {level} · {totalXP.toLocaleString()} XP
        </p>

        {/* Quick stats strip */}
        {totalDone > 0 && (
          <div className="glass-sm" style={{
            display: 'flex', gap: 12, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 14,
          }}>
            {[
              { label: 'vocab', count: progress.vocabQuizzes.length },
              { label: 'kana', count: progress.kanaQuizzes.length },
              { label: 'kanji', count: progress.kanjiQuizzes.length },
              { label: 'grammar', count: progress.grammarQuizzes.length },
            ].filter(s => s.count > 0).map(s => (
              <span key={s.label} style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 900 }}>{s.count}</span> {s.label}
              </span>
            ))}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginLeft: 'auto' }}>
              quizzes completed
            </span>
          </div>
        )}
      </div>

      {/* Groups */}
      {QUIZ_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--text-light)', opacity: 0.7,
            marginBottom: 10, paddingLeft: 2,
          }}>
            {group.label}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 10,
          }}>
            {group.items.map(item => {
              const last = item.type ? lastScores[item.type] : null
              const badge = badges[item.path] || null
              return (
                <QuizCard key={item.path} item={item} last={last} badge={badge} />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function QuizCard({ item, last, badge }) {
  const isDone = badge === '✓ done'
  return (
    <div className="glass-sm" style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 16,
      transition: 'transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease',
    }}>
      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(244,114,182,0.18), rgba(192,132,252,0.18))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.45rem', lineHeight: 1,
      }}>
        {item.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {item.name}
          </span>
          {last && <ScorePill score={last.score} total={last.total} />}
          {badge && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 800,
              color: isDone ? 'var(--correct-text)' : 'var(--text-light)',
              background: isDone ? 'rgba(22,163,74,0.12)' : 'rgba(192,132,252,0.1)',
              padding: '2px 7px', borderRadius: 20,
            }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', lineHeight: 1.35 }}>
          {item.desc}
        </div>
      </div>

      {/* Start button */}
      <Link
        to={item.path}
        aria-label={`start ${item.name}`}
        style={{
          flexShrink: 0,
          padding: '8px 14px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #f472b6, #c084fc)',
          color: 'white',
          fontWeight: 800,
          fontSize: '0.82rem',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 10px rgba(236,72,153,0.3)',
          minHeight: 44,
          display: 'flex', alignItems: 'center',
          transition: 'opacity 0.15s ease',
        }}
      >
        start →
      </Link>
    </div>
  )
}
