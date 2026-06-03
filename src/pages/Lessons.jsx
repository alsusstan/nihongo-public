import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { lessons } from '../data/lessons'
import { kanji, kanjiLessonInfo } from '../data/kanji'
import { strokeData } from '../data/strokeOrder'
import { useProgress } from '../hooks/useProgress'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { getStoredBkbUnlocked, setStoredBkbUnlocked } from '../utils/localSettings'

// Standard JLPT N5 kanji set (~80 kanji)
const N5_KANJI = new Set([
  '日','月','火','水','木','金','土','山','川','田',
  '人','口','目','手','足','一','二','三','四','五',
  '六','七','八','九','十','百','千','万','円','年',
  '時','分','前','後','今','上','下','左','右','中',
  '大','小','長','高','新','古','白','黒','赤','青',
  '外','国','語','学','生','先','本','文','男','女',
  '子','父','母','毎','来','出','入','見','聞','話',
  '読','書','食','飲','行','帰','休','天','気','東',
  '西','南','北','門','午','間',
])

const lessonMeta = [
  { id: 1, topic: 'знакомство', topicJp: 'しょうかい', emoji: '👋' },
  { id: 2, topic: 'указательные', topicJp: 'これ・それ', emoji: '👆' },
  { id: 3, topic: 'места', topicJp: 'ここ・そこ', emoji: '📍' },
  { id: 4, topic: 'время & глаголы', topicJp: 'じかん', emoji: '⏰' },
  { id: 5, topic: 'движение', topicJp: 'いきます', emoji: '🚃' },
  { id: 6, topic: 'еда & действия', topicJp: 'たべます', emoji: '🍱' },
  { id: 7, topic: 'давать & получать', topicJp: 'あげます', emoji: '🎁' },
  { id: 8, topic: 'прилагательные', topicJp: 'おおきい', emoji: '🌟' },
  { id: 9, topic: 'нравится & умею', topicJp: 'すき', emoji: '💕' },
  { id: 10, topic: 'есть & находится', topicJp: 'あります', emoji: '🗾' },
  { id: 11, topic: 'счётные суффиксы', topicJp: 'いくつ', emoji: '🔢' },
  { id: 12, topic: 'прошедшее время', topicJp: 'かこ', emoji: '📅' },
  { id: 13, topic: 'желания', topicJp: '~たい', emoji: '🌈' },
  { id: 14, topic: 'て-форма', topicJp: '~てください', emoji: '🙏' },
  { id: 15, topic: 'разрешение', topicJp: '~てもいい', emoji: '✅' },
  { id: 16, topic: 'соединение', topicJp: '~てから', emoji: '🔗' },
  { id: 17, topic: 'ない-форма', topicJp: '~ないで', emoji: '🚫' },
  { id: 18, topic: 'словарная форма', topicJp: 'じしょけい', emoji: '📖' },
  { id: 19, topic: 'た-форма & опыт', topicJp: '~たことがある', emoji: '🌍' },
  { id: 20, topic: 'простая форма', topicJp: '~とおもう', emoji: '💭' },
  { id: 21, topic: 'мнения и цитаты', topicJp: 'いけん', emoji: '🗣️' },
  { id: 22, topic: 'определения сущ.', topicJp: 'めいししゅうしょく', emoji: '🧩' },
  { id: 23, topic: 'условные формы', topicJp: 'とき・と', emoji: '🔀' },
  { id: 24, topic: 'давать & получать', topicJp: 'てくれる・てもらう', emoji: '🤝' },
  { id: 25, topic: 'условие (たら)', topicJp: 'もし~たら', emoji: '🔮' },
]

function getBestScoreForLesson(quizzes, lessonId) {
  const relevant = quizzes.filter(q => q.lessons && q.lessons.includes(lessonId))
  if (relevant.length === 0) return null
  return Math.max(...relevant.map(q => q.total > 0 ? Math.round((q.score / q.total) * 100) : 0))
}

function getScoreBadge(score) {
  if (score === 100) return { emoji: '💎', color: '#8b5cf6', label: 'perfect' }
  if (score >= 90) return { emoji: '🌟', color: 'var(--gold-text)', label: 'great' }
  if (score >= 70) return { emoji: '✨', color: 'var(--correct-text)', label: 'good' }
  if (score >= 50) return { emoji: '🌱', color: '#6366f1', label: 'growing' }
  return { emoji: '💪', color: '#ec4899', label: 'keep going' }
}

export default function Lessons() {
  const [tab, setTab] = useState('minna')
  const [search, setSearch] = useState('')
  const { progress, getBookmarkedLesson } = useProgress()
  const { isUnlocked, unlockNext, hasMoreToUnlock, nextLockId } = useUnlockedLessons()
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false)
  const [bkbUnlocked, setBkbUnlocked] = useState(getStoredBkbUnlocked)
  const [showBkbUnlockConfirm, setShowBkbUnlockConfirm] = useState(false)
  const [pendingUnlock, setPendingUnlock] = useState(null) // 'minna' | 'kanji'
  const [kanjiSearch, setKanjiSearch] = useState('')
  const navigate = useNavigate()

  // Use progress.lessonsViewed (stored in nihongo-progress) — not the legacy 'viewedLessons' key
  const viewedLessons = progress.lessonsViewed || []
  const minnaPracticeQuizzes = useMemo(() => [
    ...(progress.vocabQuizzes || []),
    ...(progress.grammarQuizzes || []),
  ], [progress.vocabQuizzes, progress.grammarQuizzes])

  const kanjiSearchResults = useMemo(() => {
    const q = kanjiSearch.trim().toLowerCase()
    if (!q) return []
    return kanji.filter(k =>
      k.kanji.includes(q) ||
      k.meaning.toLowerCase().includes(q) ||
      k.kun.toLowerCase().includes(q) ||
      k.on.toLowerCase().includes(q) ||
      k.keywords.some(kw => kw.toLowerCase().includes(q))
    ).slice(0, 30)
  }, [kanjiSearch])
  const bookmarkedLesson = getBookmarkedLesson()

  useEffect(() => {
    if (bookmarkedLesson) {
      const hasData = lessons.find(l => l.id === bookmarkedLesson)
      if (hasData) {
        navigate(`/lessons/${bookmarkedLesson}`, { replace: true })
      }
    }
  }, [bookmarkedLesson, navigate])

  const getLessonData = (id) => lessons.find(l => l.id === id)

  const totalWords = lessons.reduce((sum, l) => sum + l.vocabulary.length, 0)
  const viewedCount = viewedLessons.filter(id => lessons.find(l => l.id === id)).length
  const completionPct = lessons.length > 0 ? Math.round((viewedCount / lessons.length) * 100) : 0

  const nextLesson = lessonMeta.find(m => {
    const hasData = lessons.find(l => l.id === m.id)
    return hasData && !viewedLessons.includes(m.id)
  })

  const lastViewedId = viewedLessons.length > 0 ? Math.max(...viewedLessons) : null
  const lastViewedMeta = lastViewedId ? lessonMeta.find(m => m.id === lastViewedId) : null

  return (
    <div className="page">
      <div style={s.header} className="animate-fadeInUp">
        <h1 style={s.title}>
          <span>📚</span> lessons <span style={s.titleJp}>べんきょう</span>
        </h1>
        <p style={s.headerSub}>your entire japanese learning journey</p>
      </div>

      <div style={s.tabSegmented} className="animate-fadeInUp">
        <button type="button" style={{ ...s.segBtn, ...(tab === 'minna' ? s.segBtnActive : {}) }} onClick={() => setTab('minna')}>
          <span style={s.segEmoji}>📖</span>
          <span style={s.segLabel}>минна</span>
          <span style={s.segSub}>уроки 1–25</span>
        </button>
        <button type="button" style={{ ...s.segBtn, ...(tab === 'kanji' ? s.segBtnActive : {}) }} onClick={() => setTab('kanji')}>
          <span style={s.segEmoji}>漢</span>
          <span style={s.segLabel}>кандзи</span>
          <span style={s.segSub}>иероглифы</span>
        </button>
      </div>

      {tab === 'minna' && (
        <>
          <div className="glass animate-fadeInUp" style={s.progressBar}>
            <div style={s.progressStats}>
              <div style={s.progressStat}>
                <span style={s.statNum}>{viewedCount}</span>
                <span style={s.statLabel}>уроков пройдено</span>
              </div>
              <div style={s.progressDivider} />
              <div style={s.progressStat}>
                <span style={s.statNum}>{totalWords}</span>
                <span style={s.statLabel}>слов изучено</span>
              </div>
              <div style={s.progressDivider} />
              <div style={s.progressStat}>
                <span style={s.statNum}>{completionPct}%</span>
                <span style={s.statLabel}>выполнено</span>
              </div>
            </div>
            <div style={s.progressTrackWrap}>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${completionPct}%` }} />
              </div>
              <span style={s.progressPctLabel}>{viewedCount}/{lessons.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {lastViewedMeta && (
                <Link to={`/lessons/${lastViewedMeta.id}`} style={{ ...s.continueLink, background: 'rgba(244,114,182,0.1)', color: '#f472b6' }}>
                  ↩ последний урок: {lastViewedMeta.id} — {lastViewedMeta.topicJp} {lastViewedMeta.emoji}
                </Link>
              )}
              {nextLesson && (
                <Link to={`/lessons/${nextLesson.id}`} style={s.continueLink}>
                  ▶ продолжить: урок {nextLesson.id} — {nextLesson.topicJp} {nextLesson.emoji}
                </Link>
              )}
            </div>
          </div>

          <div style={s.sectionDivider} className="animate-fadeInUp">
            <div style={s.sectionLine} />
            <span style={s.sectionLabel}>все уроки</span>
            <div style={s.sectionLine} />
          </div>

          {/* Border legend */}
          {viewedCount > 0 && (
            <div style={{ display: 'flex', gap: 14, fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, paddingLeft: 2, marginBottom: 6 }} className="animate-fadeInUp">
              <span><span style={{ color: 'var(--correct-text)', fontWeight: 900 }}>▎</span> посещён</span>
              <span><span style={{ color: '#a855f7', fontWeight: 900 }}>▎</span> квиз 90%+</span>
            </div>
          )}

          <div style={s.searchRow} className="animate-fadeInUp">
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', pointerEvents: 'none', opacity: 0.5 }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="урок 5, еда, 食べ物..."
              aria-label="search lessons and vocabulary"
              autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
              style={{ ...s.searchInput, paddingLeft: 36 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={s.searchClear} aria-label="clear search">✕</button>
            )}
          </div>

          <div style={s.grid} className="lessons-grid">
            {lessonMeta.filter(m => {
              if (!search) return true
              const q = search.toLowerCase()
              return String(m.id).includes(q) || m.topic.toLowerCase().includes(q) || m.topicJp.includes(search)
            }).map((meta, i) => {
              const data = getLessonData(meta.id)
              const isViewed = viewedLessons.includes(meta.id)
              const hasData = !!data
              const unlocked = isUnlocked(meta.id)
              const accessible = hasData && unlocked
              const bestScore = getBestScoreForLesson(minnaPracticeQuizzes, meta.id)
              const badge = bestScore !== null ? getScoreBadge(bestScore) : null
              const isCompleted = isViewed && unlocked

              let cardGlow = {}
              if (isCompleted && bestScore !== null && bestScore >= 90) {
                cardGlow = { boxShadow: '0 0 0 2px rgba(168,85,247,0.35), 0 8px 28px rgba(168,85,247,0.18)' }
              } else if (isCompleted) {
                cardGlow = { boxShadow: '0 0 0 2px rgba(16,185,129,0.3), 0 6px 20px rgba(16,185,129,0.1)' }
              }

              return (
                <Link
                  key={meta.id}
                  to={accessible ? `/lessons/${meta.id}` : '#'}
                  className="glass animate-pop"
                  style={{
                    ...s.card,
                    ...cardGlow,
                    animationDelay: `${i * 0.04}s`,
                    opacity: accessible ? 1 : 0.5,
                    cursor: (accessible || (hasData && hasMoreToUnlock)) ? 'pointer' : 'default',
                  }}
                  onClick={e => {
                    if (!accessible) {
                      e.preventDefault()
                      if (hasData && hasMoreToUnlock) setPendingUnlock('minna')
                    }
                  }}
                >
                  <div style={s.cardTop}>
                    <div style={s.badge}>
                      <span style={s.badgeNum}>{meta.id}</span>
                    </div>
                    <div style={s.cardTopRight}>
                      {bookmarkedLesson === meta.id && (
                        <span style={s.starBadge}>⭐</span>
                      )}
                      {isCompleted && (
                        <div style={s.viewedBadge}>✓</div>
                      )}
                    </div>
                  </div>

                  <div style={s.emojiWrap}>
                    {bestScore !== null && unlocked && (
                      <svg width="54" height="54" viewBox="0 0 54 54" style={s.masteryRing}>
                        <circle cx="27" cy="27" r="24" fill="none" stroke="rgba(192,132,252,0.1)" strokeWidth="3" />
                        <circle
                          cx="27" cy="27" r="24" fill="none"
                          stroke={bestScore >= 90 ? '#a855f7' : bestScore >= 70 ? '#f472b6' : '#fbbf24'}
                          strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${(bestScore / 100) * 150.8} 150.8`}
                          transform="rotate(-90 27 27)"
                          style={{ transition: 'stroke-dasharray 0.6s ease' }}
                        />
                      </svg>
                    )}
                    <span style={s.emoji}>{meta.emoji}</span>
                  </div>

                  <div style={s.cardTitleJp}>{meta.topicJp}</div>
                  <div style={s.cardTopic}>{meta.topic}</div>

                  {data && unlocked && (
                    <>
                      {/* vocab preview chips */}
                      <div style={s.vocabPreview}>
                        {data.vocabulary.slice(0, 3).map((w) => (
                          <span key={w.japanese} style={s.vocabChip}>{w.kanji || (w.japanese || '').replace(/\[.*?\]/g, '').trim()}</span>
                        ))}
                      </div>
                      <div style={s.cardFooter}>
                        <div style={s.wordCount}>{data.vocabulary.length} сл · {data.grammar.length} пат.</div>
                        {badge ? (
                          <div style={{ ...s.scoreBadge, background: `${badge.color}18`, color: badge.color }}>
                            {badge.emoji} {bestScore}%
                          </div>
                        ) : (
                          <div style={s.scoreBadgeEmpty}>
                            — 0%
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {isCompleted && (
                    <div style={s.completionBar}>
                      <div style={{
                        ...s.completionFill,
                        width: bestScore ? `${bestScore}%` : '100%',
                        background: bestScore && bestScore >= 90
                          ? 'linear-gradient(90deg, #a855f7, #c084fc)'
                          : bestScore && bestScore >= 70
                            ? 'linear-gradient(90deg, #f472b6, #c084fc)'
                            : 'linear-gradient(90deg, #10b981, #34d399)',
                      }} />
                    </div>
                  )}

                  {!accessible && (
                    <div style={s.lockedOverlay}>
                      <span style={s.lockIcon}>🔒</span>
                      <span style={s.lockText}>{hasData ? 'locked' : 'soon'}</span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          {hasMoreToUnlock && (
            <div style={s.unlockSection} className="animate-fadeInUp">
              {showUnlockConfirm ? (
                <div className="glass" style={s.unlockConfirm}>
                  <div style={s.unlockConfirmText}>unlock lesson {nextLockId}?</div>
                  <div style={s.unlockConfirmBtns}>
                    <button
                      className="btn btn-primary btn-hover"
                      style={{ fontSize: '0.82rem', padding: '8px 20px' }}
                      onClick={() => { unlockNext(); setShowUnlockConfirm(false) }}
                    >
                      yes, unlock! 🔓
                    </button>
                    <button
                      className="btn btn-secondary btn-hover"
                      style={{ fontSize: '0.82rem', padding: '8px 20px' }}
                      onClick={() => setShowUnlockConfirm(false)}
                    >
                      cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-cute btn-hover"
                  style={{ fontSize: '0.9rem' }}
                  onClick={() => setShowUnlockConfirm(true)}
                >
                  🔓 unlock lesson {nextLockId}
                </button>
              )}
            </div>
          )}

          <div style={s.footer} className="animate-fadeInUp">
            <p style={s.footerText}>
              🌸 {lessons.filter(l => isUnlocked(l.id)).length}/{lessons.length} lessons unlocked 🌸
            </p>
          </div>
        </>
      )}

      {tab === 'kanji' && (
        <>
          <div className="glass animate-fadeInUp" style={s.progressBar}>
            <div style={s.progressStats}>
              <div style={s.progressStat}>
                <span style={s.statNum}>{bkbUnlocked}</span>
                <span style={s.statLabel}>уроков открыто</span>
              </div>
              <div style={s.progressDivider} />
              <div style={s.progressStat}>
                <span style={s.statNum}>
                  {kanji.filter(k => k.lesson <= bkbUnlocked).length}
                  <span style={{ fontSize: '0.55em', fontWeight: 600, opacity: 0.55, marginLeft: 1 }}>/{kanji.length}</span>
                </span>
                <span style={s.statLabel}>иероглифов</span>
              </div>
              <div style={s.progressDivider} />
              <div style={s.progressStat}>
                <span style={s.statNum}>
                  {kanji.filter(k => k.lesson <= bkbUnlocked && N5_KANJI.has(k.kanji)).length}
                  <span style={{ fontSize: '0.55em', fontWeight: 600, opacity: 0.55, marginLeft: 1 }}>/{N5_KANJI.size}</span>
                </span>
                <span style={s.statLabel}>из N5</span>
              </div>
            </div>
          </div>

          {/* kanji search */}
          <div className="glass animate-fadeInUp" style={{ padding: '10px 14px', marginBottom: 10 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', pointerEvents: 'none', opacity: 0.45 }}>🔍</span>
              <input
                type="text"
                value={kanjiSearch}
                onChange={e => setKanjiSearch(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setKanjiSearch('')}
                onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                placeholder="поиск: 日, огонь, ひ, hi..."
                aria-label="search kanji"
                autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                style={{ width: '100%', padding: '9px 34px 9px 34px', borderRadius: 12, border: '2px solid rgba(192,132,252,0.3)', background: 'var(--glass-bg)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
              {kanjiSearch && (
                <button onClick={() => setKanjiSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1rem', padding: '6px', minWidth: 44, minHeight: 44 }} aria-label="clear search">✕</button>
              )}
            </div>
            {kanjiSearch.trim() && (
              <div style={{ marginTop: 6, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textAlign: 'center' }}>
                {kanjiSearchResults.length} {kanjiSearchResults.length === 1 ? 'кандзи' : 'кандзи'}{kanjiSearchResults.length === 30 ? ' (уточните запрос)' : ''}
              </div>
            )}
          </div>

          {/* search results */}
          {kanjiSearch.trim() && kanjiSearchResults.length > 0 && (
            <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {kanjiSearchResults.map(k => {
                const isLocked = k.lesson > bkbUnlocked
                return (
                  <Link
                    key={k.kanji}
                    to={`/kanji?kanji=${encodeURIComponent(k.kanji)}`}
                    className="glass-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', textDecoration: 'none', color: 'inherit', opacity: isLocked ? 0.55 : 1 }}
                  >
                    <span style={{ fontSize: '1.8rem', lineHeight: 1, minWidth: 40, textAlign: 'center', fontWeight: 900, color: 'var(--text-main)' }}>{k.kanji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 }}>{k.meaning}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {k.kun && <span>訓 {k.kun}</span>}
                        {k.on && <span>音 {k.on}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', background: isLocked ? 'rgba(100,100,100,0.12)' : 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                        {isLocked ? '🔒 ' : ''}ур.{k.lesson}
                      </span>
                      {strokeData[k.kanji]?.strokes && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', opacity: 0.7 }}>
                          {strokeData[k.kanji].strokes}画
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {kanjiSearch.trim() && kanjiSearchResults.length === 0 && (
            <div className="animate-fadeInUp" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-light)', fontSize: '0.88rem', fontWeight: 600, marginBottom: 14 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🤔</div>
              не найдено
            </div>
          )}

          {!kanjiSearch.trim() && (
            <div style={s.sectionDivider} className="animate-fadeInUp">
              <div style={s.sectionLine} />
              <span style={s.sectionLabel}>basic kanji book 1</span>
              <div style={s.sectionLine} />
            </div>
          )}

          {!kanjiSearch.trim() && <div style={s.grid} className="lessons-grid animate-fadeInUp">
            {kanjiLessonInfo.map((l, i) => {
              const lessonKanji = kanji.filter(k => k.lesson === l.id)
              const isLocked = l.id > bkbUnlocked
              const accentColors = ['#f472b6','#60a5fa','#34d399','#f97316','#a78bfa','#fbbf24','#f472b6','#60a5fa','#34d399','#f97316','#a78bfa','#fbbf24','#f472b6','#60a5fa','#34d399','#f97316','#a78bfa','#fbbf24','#f472b6','#60a5fa','#34d399','#f97316']
              const accent = accentColors[i] || '#c084fc'
              return isLocked ? (
                <div
                  key={l.id}
                  className="glass"
                  style={{ ...s.kanjiCard, animationDelay: `${i * 0.05}s`, cursor: bkbUnlocked < kanjiLessonInfo.length ? 'pointer' : 'default' }}
                  onClick={() => { if (bkbUnlocked < kanjiLessonInfo.length) setPendingUnlock('kanji') }}
                  role={bkbUnlocked < kanjiLessonInfo.length ? 'button' : undefined}
                  tabIndex={bkbUnlocked < kanjiLessonInfo.length ? 0 : undefined}
                  aria-label={bkbUnlocked < kanjiLessonInfo.length ? `unlock kanji lesson ${l.id}` : undefined}
                  onKeyDown={bkbUnlocked < kanjiLessonInfo.length ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPendingUnlock('kanji') } }) : undefined}
                >
                  <div style={s.lockedOverlay}>
                    <span style={s.lockIcon}>🔒</span>
                    <span style={s.lockText}>locked</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-light)', background: 'rgba(192,132,252,0.15)', padding: '2px 9px', borderRadius: 50 }}>#{l.id}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', opacity: 0.4 }}>{l.count}字</span>
                  </div>
                  <div style={{ ...s.kanjiPreview, fontSize: '1.35rem', letterSpacing: 2, opacity: 0.2, lineHeight: 1.5 }}>
                    {lessonKanji.map(k => k.kanji).join('')}
                  </div>
                  <div style={{ ...s.cardTitleJp, fontSize: '0.78rem', opacity: 0.3 }}>{l.titleJp}</div>
                </div>
              ) : (
                <Link
                  key={l.id}
                  to={`/kanji?lesson=${l.id}`}
                  className="glass glass-hover animate-pop"
                  style={{ ...s.kanjiCard, animationDelay: `${i * 0.05}s`, borderTop: `3px solid ${accent}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fff', background: accent, padding: '2px 9px', borderRadius: 50 }}>#{l.id}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)' }}>{l.count}字</span>
                  </div>
                  <div style={{ ...s.kanjiPreview, fontSize: '1.35rem', letterSpacing: 2, lineHeight: 1.5 }}>
                    {lessonKanji.map(k => k.kanji).join('')}
                  </div>
                  <div style={{ ...s.cardTitleJp, fontSize: '0.78rem' }}>{l.titleJp}</div>
                </Link>
              )
            })}
          </div>}

          {/* unlock next kanji lesson */}
          {bkbUnlocked < kanjiLessonInfo.length && (
            <div style={{ textAlign: 'center', margin: '8px 0 16px' }} className="animate-fadeInUp">
              {showBkbUnlockConfirm ? (
                <div className="glass" style={{ display: 'inline-block', padding: '16px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>
                    открыть урок {bkbUnlocked + 1}?
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button className="btn btn-primary btn-hover" style={{ fontSize: '0.82rem', padding: '8px 20px' }} onClick={() => {
                      const next = setStoredBkbUnlocked(bkbUnlocked + 1)
                      setBkbUnlocked(next)
                      setShowBkbUnlockConfirm(false)
                    }}>
                      да, открыть! 🔓
                    </button>
                    <button className="btn btn-secondary btn-hover" style={{ fontSize: '0.82rem', padding: '8px 20px' }} onClick={() => setShowBkbUnlockConfirm(false)}>
                      отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-cute btn-hover" style={{ fontSize: '0.9rem' }} onClick={() => setShowBkbUnlockConfirm(true)}>
                  🔓 открыть урок {bkbUnlocked + 1}
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }} className="animate-fadeInUp">
            <Link to="/kanji" className="btn btn-secondary btn-hover" style={{ fontSize: '0.82rem' }}>
              📖 kanji study
            </Link>
            <Link to="/quiz/kanji" className="btn btn-primary btn-hover" style={{ fontSize: '0.82rem' }}>
              ✨ kanji quiz
            </Link>
            <Link to="/kanji/practice" className="btn btn-secondary btn-hover" style={{ fontSize: '0.82rem' }}>
              ✍️ practice
            </Link>
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 90, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/homework" className="btn btn-cute" style={{ fontSize: '0.85rem' }}>homework 📝</Link>
        <Link to="/search" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>search 🔍</Link>
        <Link to="/materials" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>materials 📖</Link>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
      </div>

      {pendingUnlock && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="unlock lesson"
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 20,
            WebkitTapHighlightColor: 'transparent',
          }}
          onClick={() => setPendingUnlock(null)}
        >
          <div
            className="glass"
            style={{ padding: '28px 24px', borderRadius: 24, maxWidth: 320, width: '100%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🔓</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
              {pendingUnlock === 'minna'
                ? `открыть урок ${nextLockId}?`
                : `открыть урок кандзи ${bkbUnlocked + 1}?`}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: 22 }}>
              урок будет постоянно разблокирован
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn btn-primary btn-hover"
                style={{ fontSize: '0.88rem', padding: '11px 22px', minHeight: 44 }}
                onClick={() => {
                  if (pendingUnlock === 'minna') {
                    unlockNext()
                  } else {
                    const next = setStoredBkbUnlocked(bkbUnlocked + 1)
                    setBkbUnlocked(next)
                  }
                  setPendingUnlock(null)
                }}
              >
                да, открыть! 🔓
              </button>
              <button
                className="btn btn-secondary btn-hover"
                style={{ fontSize: '0.88rem', padding: '11px 22px', minHeight: 44 }}
                onClick={() => setPendingUnlock(null)}
              >
                отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  header: { textAlign: 'center', marginBottom: 12, padding: '8px 0' },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)',
    textTransform: 'lowercase', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginBottom: 4,
  },
  titleJp: { fontSize: '1.1rem', color: 'var(--text-light)', fontWeight: 700, marginLeft: 4 },
  headerSub: {
    fontSize: '0.88rem', color: 'var(--text-light)', fontWeight: 600,
    textTransform: 'lowercase', letterSpacing: '0.02em',
  },
  tabSegmented: {
    display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16,
  },
  segBtn: {
    flex: 1, maxWidth: 160, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 2, padding: '12px 16px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
    border: '2px solid rgba(192,132,252,0.25)', background: 'var(--glass-bg)',
    color: 'var(--text-secondary)', transition: 'all 0.2s ease', WebkitTapHighlightColor: 'transparent',
  },
  segBtnActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    border: '2px solid transparent',
    color: 'white',
    boxShadow: '0 4px 16px rgba(236,72,153,0.35)',
  },
  segEmoji: { fontSize: '1.4rem', lineHeight: 1 },
  segLabel: { fontSize: '0.88rem', fontWeight: 800 },
  segSub: { fontSize: '0.72rem', fontWeight: 600, opacity: 0.75 },
  progressBar: { padding: '18px 20px', marginBottom: 12, textAlign: 'center' },
  progressStats: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: 4, marginBottom: 12,
  },
  progressDivider: { width: 1, height: 32, background: 'rgba(192,132,252,0.2)', margin: '0 4px' },
  progressStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52 },
  statNum: { fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 },
  statLabel: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'lowercase' },
  progressTrackWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  progressTrack: {
    flex: 1, height: 7, borderRadius: 50,
    background: 'rgba(192, 132, 252, 0.12)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 50,
    background: 'linear-gradient(90deg, #f472b6, #c084fc)',
    transition: 'width 0.8s ease', minWidth: 4,
  },
  progressPctLabel: { fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', whiteSpace: 'nowrap' },
  continueLink: {
    fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '6px 14px',
    borderRadius: 50, background: 'rgba(109, 40, 217, 0.08)',
    border: '1px solid rgba(109, 40, 217, 0.2)', transition: 'all 0.2s',
    wordBreak: 'break-word', textAlign: 'center', minHeight: 44,
  },
  searchRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, position: 'relative' },
  searchInput: {
    flex: 1, padding: '10px 16px', borderRadius: 50, fontSize: '1rem', fontWeight: 600,
    background: 'var(--tint-medium)', border: '1.5px solid rgba(192,132,252,0.25)',
    color: 'var(--text-main)', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  },
  searchClear: {
    flexShrink: 0, width: 44, height: 44, borderRadius: '50%', fontSize: '0.75rem',
    background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.25)',
    color: 'var(--text-light)', cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  sectionDivider: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 4 },
  sectionLine: { flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.3), transparent)' },
  sectionLabel: {
    fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)',
    textTransform: 'lowercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10, marginBottom: 28,
  },
  card: {
    position: 'relative', display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '12px 10px 10px',
    textDecoration: 'none', color: 'inherit',
    transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease',
    overflow: 'hidden',
  },
  kanjiCard: {
    position: 'relative', display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '12px 10px 10px',
    textDecoration: 'none', color: 'inherit',
    transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease',
    overflow: 'hidden',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', marginBottom: 6,
  },
  cardTopRight: { display: 'flex', alignItems: 'center', gap: 4 },
  badge: {
    width: 26, height: 26, borderRadius: '50%',
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, boxShadow: '0 2px 8px rgba(244,114,182,0.3)',
  },
  badgeNum: { fontSize: '0.72rem', fontWeight: 900, color: 'white' },
  starBadge: { fontSize: '0.8rem', filter: 'drop-shadow(0 1px 2px rgba(251,191,36,0.5))' },
  viewedBadge: {
    width: 22, height: 22, borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.72rem', fontWeight: 900, boxShadow: '0 2px 6px rgba(16,185,129,0.35)',
  },
  emojiWrap: {
    position: 'relative', width: 54, height: 54,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  masteryRing: { position: 'absolute', top: 0, left: 0 },
  emoji: { fontSize: '1.65rem', lineHeight: 1 },
  cardTitleJp: {
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)',
    marginBottom: 2, textAlign: 'center', letterSpacing: '-0.01em',
  },
  cardTopic: {
    fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600,
    textTransform: 'lowercase', marginBottom: 6, textAlign: 'center',
  },
  vocabPreview: {
    display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, margin: '6px 0 4px',
  },
  vocabChip: {
    fontSize: '0.78rem', fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600,
    color: 'var(--text-secondary)', background: 'rgba(168,85,247,0.08)',
    padding: '2px 7px', borderRadius: 6,
  },
  cardFooter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, marginTop: 2 },
  wordCount: {
    fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 800,
    background: 'rgba(109, 40, 217, 0.1)', padding: '2px 8px', borderRadius: 50,
  },
  scoreBadge: { fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 50 },
  scoreBadgeEmpty: {
    fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50,
    color: 'var(--text-light)', background: 'rgba(192,132,252,0.07)',
  },
  completionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
    background: 'rgba(192,132,252,0.1)',
    borderRadius: '0 0 var(--radius) var(--radius)', overflow: 'hidden',
  },
  completionFill: {
    height: '100%', borderRadius: '0 0 var(--radius) var(--radius)',
    transition: 'width 0.8s ease', minWidth: 8,
  },
  lockedOverlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--tint-heavy)', backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)', borderRadius: 'var(--radius)', gap: 4, zIndex: 2,
  },
  lockIcon: { fontSize: '1.4rem' },
  lockText: { fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'lowercase' },
  kanjiPreview: {
    fontSize: '1.7rem', fontWeight: 900, color: 'var(--text-main)',
    lineHeight: 1.2, marginTop: 6, marginBottom: 4, letterSpacing: 3,
  },
  unlockSection: { textAlign: 'center', marginBottom: 16 },
  unlockConfirm: { padding: '16px 20px', textAlign: 'center' },
  unlockConfirmText: {
    fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)',
    marginBottom: 12, textTransform: 'lowercase',
  },
  unlockConfirmBtns: { display: 'flex', gap: 10, justifyContent: 'center' },
  footer: { textAlign: 'center', padding: '12px 0' },
  footerText: { fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 500 },
}
