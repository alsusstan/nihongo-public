import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { lessons } from '../data/lessons'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import { useWordTracker } from '../hooks/useWordTracker'
import ShareResult from '../components/ShareResult'
import Confetti from '../components/Confetti'
import { getStoredJson, setStoredJson } from '../utils/localSettings'

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const STORAGE_KEY = 'nihongo-difficult-words'

function loadDifficultWords() {
  const parsed = getStoredJson(STORAGE_KEY, [])
  return Array.isArray(parsed) ? parsed : []
}

function saveDifficultWords(words) {
  setStoredJson(STORAGE_KEY, words)
}


const PHASE_SETUP = 'setup'
const PHASE_REVIEW = 'review'
const PHASE_SUMMARY = 'summary'

export default function FlashCards() {
  const [phase, setPhase] = useState(PHASE_SETUP)
  const { unlockedLessons } = useUnlockedLessons()
  const [searchParams] = useSearchParams()
  const sharedLessonId = parseInt(searchParams.get('lesson') || '', 10)
  const sharedLesson = Number.isFinite(sharedLessonId) ? lessons.find(l => l.id === sharedLessonId) : null
  const lessonPool = useMemo(() => (
    sharedLesson && !unlockedLessons.some(l => l.id === sharedLesson.id)
      ? [...unlockedLessons, sharedLesson]
      : unlockedLessons
  ), [sharedLesson, unlockedLessons])

  // setup state
  const [selectedLessons, setSelectedLessons] = useState([])
  const [reviewDifficultOnly, setReviewDifficultOnly] = useState(false)
  const [direction, setDirection] = useState('ja-ru') // 'ja-ru' or 'ru-ja'
  const [cardMode, setCardMode] = useState('flip') // 'flip' or 'test'
  const [wordTypeFilter, setWordTypeFilter] = useState('all') // 'all' | 'verb' | 'adj' | 'noun'

  // review state
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knewIt, setKnewIt] = useState([])
  const [needPractice, setNeedPractice] = useState([])
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(3)

  const { awardXP } = useXP()
  const { saveQuizResult } = useProgress()
  const { recordMiss, recordHit } = useWordTracker()
  const xpAwardedRef = useRef(false)
  const advanceLockedRef = useRef(false)

  useEffect(() => {
    advanceLockedRef.current = false
  }, [currentIndex])

  useEffect(() => {
    if (phase === PHASE_SUMMARY && cards.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true
      const total = knewIt.length + needPractice.length
      const percentage = total > 0 ? Math.round((knewIt.length / total) * 100) : 0
      const xp = knewIt.length * 2 + (percentage >= 80 ? 10 : 0)
      if (xp > 0) awardXP(xp, 'flash cards', knewIt.length === total && total > 0)
      saveQuizResult('vocab', { lessons: selectedLessons, score: knewIt.length, total })
    }
    if (phase === PHASE_SUMMARY) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Pre-select lesson from ?lesson=X URL param
  const lessonParamHandled = useRef(false)
  useEffect(() => {
    if (lessonParamHandled.current || phase !== PHASE_SETUP) return
    const lessonParam = searchParams.get('lesson')
    if (!lessonParam) return
    const id = parseInt(lessonParam, 10)
    if (lessonPool.some(l => l.id === id)) {
      lessonParamHandled.current = true
      setSelectedLessons([id])
    }
  }, [lessonPool, phase, searchParams])

  const difficultWords = loadDifficultWords()

  const availableLessons = lessonPool.map(l => ({
    id: l.id,
    title: l.title,
    titleJp: l.titleJp,
    count: l.vocabulary.length,
  }))

  const toggleLesson = (id) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedLessons.length === availableLessons.length) {
      setSelectedLessons([])
    } else {
      setSelectedLessons(availableLessons.map(l => l.id))
    }
  }

  const filterByWordType = (words) => {
    if (wordTypeFilter === 'all') return words
    return words.filter(w => {
      const t = w.type || ''
      if (wordTypeFilter === 'verb') return t.includes('гл.')
      if (wordTypeFilter === 'adj') return t.includes('прил.') || w.japanese?.includes('[な]') || (!t.includes('гл.') && (w.kanji || w.japanese)?.endsWith('い'))
      if (wordTypeFilter === 'noun') return !t.includes('гл.') && !t.includes('прил.') && !w.japanese?.includes('[な]') && !(w.kanji || w.japanese)?.endsWith('い')
      return true
    })
  }

  const startReview = () => {
    let pool
    if (reviewDifficultOnly) {
      pool = difficultWords.map(w => ({ ...w, romaji: (w.romaji || '').replace(/\s*\[[^\]]*\]/g, '').trim() }))
    } else {
      pool = lessonPool
        .filter(l => selectedLessons.includes(l.id))
        .flatMap(l => l.vocabulary)
        .map(w => ({
          ...w,
          japanese: (w.japanese || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim(),
          romaji: (w.romaji || '').replace(/\s*\[[^\]]*\]/g, '').trim(),
        }))
      pool = filterByWordType(pool)
    }
    if (pool.length === 0) return

    const shuffled = shuffle(pool)
    setCards(shuffled)
    setCurrentIndex(0)
    setFlipped(false)
    setKnewIt([])
    setNeedPractice([])
    xpAwardedRef.current = false
    advanceLockedRef.current = false
    setPhase(PHASE_REVIEW)
  }

  const handleFlip = useCallback(() => {
    setFlipped(prev => !prev)
  }, [])

  const advanceCard = useCallback(() => {
    if (currentIndex + 1 >= cards.length) {
      setPhase(PHASE_SUMMARY)
    } else {
      setCurrentIndex(prev => prev + 1)
      setFlipped(false)
    }
  }, [currentIndex, cards.length])

  const handleKnew = useCallback(() => {
    if (advanceLockedRef.current) return
    advanceLockedRef.current = true
    const card = cards[currentIndex]
    setKnewIt(prev => [...prev, card])
    recordHit(card)
    advanceCard()
  }, [cards, currentIndex, advanceCard, recordHit])

  const handleNeedPractice = useCallback(() => {
    if (advanceLockedRef.current) return
    advanceLockedRef.current = true
    const card = cards[currentIndex]
    setNeedPractice(prev => [...prev, card])
    recordMiss(card, 'flash-cards')
    advanceCard()
  }, [cards, currentIndex, advanceCard, recordMiss])

  const handleShuffle = useCallback(() => {
    const remaining = cards.slice(currentIndex)
    const done = cards.slice(0, currentIndex)
    setCards([...done, ...shuffle(remaining)])
    setFlipped(false)
  }, [cards, currentIndex])


  const filteredCount = reviewDifficultOnly
    ? difficultWords.length
    : filterByWordType(
        lessonPool
          .filter(l => selectedLessons.includes(l.id))
          .flatMap(l => l.vocabulary)
      ).length

  const canStart = reviewDifficultOnly
    ? difficultWords.length > 0 && (cardMode !== 'test' || difficultWords.length >= 4)
    : filteredCount > 0 && (cardMode !== 'test' || filteredCount >= 4)

  const totalWords = filteredCount

  return (
    <div className="page">
      <style>{`
        @keyframes cardFlipIn {
          0% { transform: rotateY(90deg) scale(0.95); opacity: 0; }
          60% { transform: rotateY(-8deg) scale(1.02); }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes cardSlideLeft {
          0% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(-120%) rotate(-15deg); opacity: 0; }
        }
        @keyframes cardSlideRight {
          0% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(120%) rotate(15deg); opacity: 0; }
        }
        @keyframes cardPulseGreen {
          0% { box-shadow: 0 8px 32px rgba(16, 185, 129, 0); }
          50% { box-shadow: 0 8px 40px rgba(16, 185, 129, 0.35), 0 0 0 4px rgba(16,185,129,0.15); }
          100% { box-shadow: 0 8px 32px rgba(16, 185, 129, 0); }
        }
        .flashcard-inner {
          transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          position: relative;
          width: 100%;
          min-height: clamp(220px, 40vw, 280px);
        }
        .flashcard-inner.flipped {
          transform: rotateY(180deg);
        }
        .flashcard-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(16px, 5vw, 32px) clamp(12px, 4vw, 24px);
          border-radius: 24px;
          background: rgba(255,255,255,0.48);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1.5px solid rgba(192,132,252,0.25);
          box-shadow: 0 12px 40px rgba(168, 85, 247, 0.1), 0 2px 8px rgba(0,0,0,0.06);
        }
        [data-theme="dark"] .flashcard-face {
          background: rgba(30,20,50,0.75);
          border: 1.5px solid rgba(192,132,252,0.2);
        }
        .flashcard-back {
          transform: rotateY(180deg);
          background: rgba(244,114,182,0.06);
          border: 1.5px solid rgba(244,114,182,0.2);
        }
        [data-theme="dark"] .flashcard-back {
          background: rgba(40,15,40,0.8);
        }
        .flashcard-wrapper {
          perspective: 1200px;
          cursor: pointer;
          margin-bottom: 22px;
          border-radius: 24px;
          transition: transform 0.2s ease;
        }
        .flashcard-wrapper:hover {
          transform: translateY(-3px);
        }
        .flashcard-wrapper:active {
          transform: scale(0.98) translateY(-1px);
        }
        .fc-btn-practice:hover {
          background: rgba(244, 63, 94, 0.18) !important;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 20px rgba(244, 63, 94, 0.2) !important;
        }
        .fc-btn-knew:hover {
          background: rgba(16, 185, 129, 0.18) !important;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.2) !important;
        }
        .fc-lesson-chip:hover {
          transform: scale(1.04);
          box-shadow: 0 2px 10px rgba(244, 114, 182, 0.15);
        }
        @media (prefers-reduced-motion: reduce) {
          .flashcard-inner { transition: none; }
          .flashcard-wrapper { transition: none; }
          .flashcard-wrapper:hover, .flashcard-wrapper:active { transform: none; }
          .fc-btn-practice:hover, .fc-btn-knew:hover { transform: none !important; }
          .fc-lesson-chip:hover { transform: none; }
        }
      `}</style>

      {phase === PHASE_SETUP && (
        <SetupScreen
          availableLessons={availableLessons}
          selectedLessons={selectedLessons}
          toggleLesson={toggleLesson}
          selectAll={selectAll}
          reviewDifficultOnly={reviewDifficultOnly}
          setReviewDifficultOnly={setReviewDifficultOnly}
          difficultCount={difficultWords.length}
          totalWords={totalWords}
          canStart={canStart}
          onStart={startReview}
          direction={direction}
          setDirection={setDirection}
          cardMode={cardMode}
          setCardMode={setCardMode}
          wordTypeFilter={wordTypeFilter}
          setWordTypeFilter={setWordTypeFilter}
        />
      )}

      {phase === PHASE_REVIEW && cards.length > 0 && (
        <ReviewScreen
          card={cards[currentIndex]}
          cards={cards}
          currentIndex={currentIndex}
          totalCards={cards.length}
          flipped={flipped}
          onFlip={handleFlip}
          onKnew={handleKnew}
          onNeedPractice={handleNeedPractice}
          knewCount={knewIt.length}
          needPracticeCount={needPractice.length}
          autoPlay={autoPlay}
          setAutoPlay={setAutoPlay}
          autoPlaySpeed={autoPlaySpeed}
          setAutoPlaySpeed={setAutoPlaySpeed}
          direction={direction}
          onShuffle={handleShuffle}
          cardMode={cardMode}
        />
      )}

      {phase === PHASE_SUMMARY && (
        <SummaryScreen
          knewIt={knewIt}
          needPractice={needPractice}
          onRetry={() => setPhase(PHASE_SETUP)}
          onReviewDifficult={() => {
            setReviewDifficultOnly(true)
            setPhase(PHASE_SETUP)
          }}
        />
      )}
    </div>
  )
}

function SetupScreen({
  availableLessons, selectedLessons, toggleLesson, selectAll,
  reviewDifficultOnly, setReviewDifficultOnly, difficultCount,
  totalWords, canStart, onStart, direction, setDirection, cardMode, setCardMode,
  wordTypeFilter, setWordTypeFilter,
}) {
  return (
    <div className="animate-fadeInUp" style={{ paddingBottom: 100 }}>
      {/* header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>🃏</div>
        <h1 style={styles.title}>
          flash cards
          <span style={styles.titleJp}>フラッシュカード</span>
        </h1>
        <p style={styles.subtitle}>
          the classic way to learn — flip, recall, repeat~
        </p>
      </div>

      {/* difficult words toggle */}
      {difficultCount > 0 && (
        <div className="glass" style={styles.setupCard}>
          <div style={styles.setupLabel}>
            <span>🔥</span> difficult words
          </div>
          <label style={styles.difficultToggle}>
            <input
              type="checkbox"
              checked={reviewDifficultOnly}
              onChange={(e) => setReviewDifficultOnly(e.target.checked)}
              style={{ display: 'none' }}
            />
            <div style={{
              ...styles.toggleTrack,
              ...(reviewDifficultOnly ? styles.toggleTrackActive : {}),
            }}>
              <div style={{
                ...styles.toggleThumb,
                ...(reviewDifficultOnly ? styles.toggleThumbActive : {}),
              }} />
            </div>
            <span style={styles.toggleLabel}>
              review only difficult words <span style={{ color: '#f472b6', fontWeight: 800 }}>({difficultCount})</span>
            </span>
          </label>
          {reviewDifficultOnly && (
            <div style={styles.difficultNote} className="animate-fadeInUp">
              these are the words that challenged you before — time to master them!
            </div>
          )}
        </div>
      )}

      {/* lesson selection */}
      {!reviewDifficultOnly && (
        <div className="glass" style={styles.setupCard}>
          <div style={styles.setupLabel}>
            <span>📚</span> choose your lessons
          </div>
          <button onClick={selectAll} className="btn-hover" style={styles.selectAllBtn}>
            {selectedLessons.length === availableLessons.length ? 'deselect all' : 'select all'}
          </button>
          <div style={styles.lessonCheckGrid}>
            {availableLessons.map(l => (
              <label
                key={l.id}
                className="fc-lesson-chip"
                style={{
                  ...styles.lessonCheck,
                  ...(selectedLessons.includes(l.id) ? styles.lessonCheckActive : {}),
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLessons.includes(l.id)}
                  onChange={() => toggleLesson(l.id)}
                  style={{ display: 'none' }}
                />
                <span style={styles.checkNum}>{l.id}</span>
                <span style={styles.checkJp}>{l.titleJp}</span>
                <span style={styles.checkCount}>{l.count}w</span>
              </label>
            ))}
          </div>
          {selectedLessons.length > 0 && (
            <div style={styles.poolInfo} className="animate-fadeInUp">
              <span style={{ fontWeight: 900, color: '#f472b6', fontSize: '1.1rem' }}>{totalWords}</span>
              {' '}words ready for review 🌸
            </div>
          )}
        </div>
      )}

      {/* direction toggle */}
      {/* word type filter */}
      {!reviewDifficultOnly && (
        <div className="glass" style={styles.setupCard}>
          <div style={styles.setupLabel}><span>🏷️</span> word type</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'all' },
              { key: 'verb', label: '動詞 verb' },
              { key: 'adj', label: '形容詞 adj' },
              { key: 'noun', label: '名詞 noun' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setWordTypeFilter(opt.key)}
                style={{
                  padding: '8px 14px', borderRadius: 50, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700,
                  background: wordTypeFilter === opt.key ? 'linear-gradient(135deg, #f472b6, #c084fc)' : 'rgba(168,85,247,0.08)',
                  color: wordTypeFilter === opt.key ? 'white' : 'var(--text-light)',
                  transition: 'all 0.15s', minHeight: 44,
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>
      )}

      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}><span>🔀</span> direction</div>
        <div style={{ display: 'flex', gap: 0, borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(192,132,252,0.2)' }}>
          {[
            { key: 'ja-ru', label: '日本語 → рус' },
            { key: 'ru-ja', label: 'рус → 日本語' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setDirection(opt.key)}
              style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700,
                background: direction === opt.key ? 'linear-gradient(135deg, #f472b6, #c084fc)' : 'transparent',
                color: direction === opt.key ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s', minHeight: 44,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* mode toggle: flip vs test */}
      <div className="glass" style={styles.setupCard}>
        <div style={styles.setupLabel}><span>🎯</span> mode</div>
        <div style={{ display: 'flex', gap: 0, borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(192,132,252,0.2)' }}>
          {[
            { key: 'flip', label: '🃏 flip cards' },
            { key: 'test', label: '✏️ test (4 choices)' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setCardMode(opt.key)}
              style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700,
                background: cardMode === opt.key ? 'linear-gradient(135deg, #f472b6, #c084fc)' : 'transparent',
                color: cardMode === opt.key ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s', minHeight: 44,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* how it works */}
      <div className="glass" style={{ ...styles.setupCard, padding: '16px 20px' }}>
        <div style={styles.howItWorksRow}>
          <div style={styles.howItem}>
            <span style={styles.howIcon}>👁️</span>
            <span style={styles.howText}>{direction === 'ja-ru' ? 'see japanese' : 'see russian'}</span>
          </div>
          <span style={styles.howArrow}>→</span>
          <div style={styles.howItem}>
            <span style={styles.howIcon}>🔄</span>
            <span style={styles.howText}>flip to check</span>
          </div>
          <span style={styles.howArrow}>→</span>
          <div style={styles.howItem}>
            <span style={styles.howIcon}>✨</span>
            <span style={styles.howText}>mark &amp; move on</span>
          </div>
        </div>
        <div style={styles.howTip}>
          swipe right = knew it &nbsp;·&nbsp; swipe left = need practice &nbsp;·&nbsp; ⌨ Space = flip &nbsp;·&nbsp; → / ← = move
        </div>
      </div>

      {/* start button */}
      <div style={styles.startWrap}>
        <button
          className="btn btn-cute"
          onClick={onStart}
          disabled={!canStart}
          style={{
            opacity: canStart ? 1 : 0.45,
            pointerEvents: canStart ? 'auto' : 'none',
            fontSize: '1rem',
            padding: '14px 36px',
            letterSpacing: '0.02em',
          }}
        >
          start review 🃏
        </button>
        {!canStart && reviewDifficultOnly && cardMode === 'test' && (
          <p style={styles.warnText}>test mode needs at least 4 words — switch to flip mode or mark more words</p>
        )}
        {!canStart && !reviewDifficultOnly && selectedLessons.length === 0 && (
          <p style={styles.warnText}>select at least one lesson to begin</p>
        )}
        {!canStart && !reviewDifficultOnly && selectedLessons.length > 0 && totalWords > 0 && totalWords < 4 && cardMode === 'test' && (
          <p style={styles.warnText}>test mode needs at least 4 words — switch to flip mode or broaden the filter</p>
        )}
        {!canStart && !reviewDifficultOnly && selectedLessons.length > 0 && totalWords === 0 && (
          <p style={styles.warnText}>no {wordTypeFilter !== 'all' ? wordTypeFilter + 's' : 'words'} in selected lessons — try a different filter</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/quiz/vocab" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>vocab quiz ✨</Link>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>home 🏠</Link>
      </div>
    </div>
  )
}

function ReviewScreen({
  card, cards, currentIndex, totalCards, flipped,
  onFlip, onKnew, onNeedPractice, knewCount, needPracticeCount,
  autoPlay, setAutoPlay, autoPlaySpeed, setAutoPlaySpeed, direction, onShuffle, cardMode,
}) {
  const isMobile = useIsMobile()
  const progress = ((currentIndex + 1) / totalCards) * 100
  const touchRef = useRef({ startX: 0, startY: 0 })
  const autoPlayRef = useRef(null)
  const [showRomaji, setShowRomaji] = useState(false)

  // reset romaji hint on each new card
  useEffect(() => {
    setShowRomaji(false)
  }, [currentIndex])

  useEffect(() => {
    if (!autoPlay) return
    if (autoPlayRef.current) clearTimeout(autoPlayRef.current)

    if (!flipped) {
      autoPlayRef.current = setTimeout(() => onFlip(), autoPlaySpeed * 1000)
    } else {
      autoPlayRef.current = setTimeout(() => onKnew(), autoPlaySpeed * 1000)
    }

    return () => { if (autoPlayRef.current) clearTimeout(autoPlayRef.current) }
  }, [autoPlay, flipped, autoPlaySpeed, onFlip, onKnew, currentIndex])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        onFlip()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        onKnew()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onNeedPractice()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onFlip, onKnew, onNeedPractice])

  const handleTouchStart = useCallback((e) => {
    touchRef.current.startX = e.touches[0].clientX
    touchRef.current.startY = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX
    const dy = e.changedTouches[0].clientY - touchRef.current.startY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > 60 && absDx > absDy) {
      if (dx > 0) onKnew()
      else onNeedPractice()
    }
  }, [onKnew, onNeedPractice])

  const handleFlipClick = () => {
    onFlip()
  }

  const getVerbType = (word) => {
    const jp = word.japanese || ''
    if (jp.endsWith('ます')) return 'verb (masu-form)'
    if (jp.endsWith('る')) return 'verb (ru)'
    if (jp.endsWith('う') || jp.endsWith('く') || jp.endsWith('す') ||
        jp.endsWith('つ') || jp.endsWith('ぬ') || jp.endsWith('ぶ') ||
        jp.endsWith('む') || jp.endsWith('ぐ')) return 'verb (u)'
    return null
  }

  const verbType = getVerbType(card)
  const knewPercent = currentIndex > 0 ? Math.round((knewCount / currentIndex) * 100) : null

  // Test mode state
  const [testSelected, setTestSelected] = useState(null)
  const testTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(testTimerRef.current), [])

  // Reset on card change — also cancel any pending auto-advance timer
  useEffect(() => {
    clearTimeout(testTimerRef.current)
    setTestSelected(null)
  }, [currentIndex])

  // Generate test options (stable per card index)
  const testOptions = useMemo(() => {
    if (cardMode !== 'test') return []
    const correctAnswer = direction === 'ja-ru' ? card.russian : (card.kanji || card.japanese)
    const pool = cards.filter((_, i) => i !== currentIndex)
    const shuffledPool = shuffle(pool)
    const distractors = shuffledPool
      .map(c => direction === 'ja-ru' ? c.russian : (c.kanji || c.japanese))
      .filter((v, i, arr) => v !== correctAnswer && arr.indexOf(v) === i)
      .slice(0, 3)
    const all = [correctAnswer, ...distractors]
    return shuffle(all)
  }, [currentIndex, cardMode, cards, card, direction])

  const handleTestAnswer = (answer) => {
    if (testSelected !== null) return
    const correct = direction === 'ja-ru' ? card.russian : (card.kanji || card.japanese)
    setTestSelected(answer)
    const isCorrect = answer === correct
    clearTimeout(testTimerRef.current)
    testTimerRef.current = setTimeout(() => {
      if (isCorrect) onKnew()
      else onNeedPractice()
    }, 900)
  }

  return (
    <div className="animate-fadeInUp">
      {/* progress section */}
      <div style={styles.progressWrap}>
        <div style={styles.progressInfo}>
          <div style={styles.progressLeft}>
            <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0, marginRight: 4 }} aria-label="exit quiz">✕</Link>
            <span style={styles.cardCounter}>{currentIndex + 1}</span>
            <span style={styles.cardCounterOf}>/ {totalCards}</span>
          </div>
          <div style={styles.scoreChips}>
            <span style={styles.scoreChipGreen}>✓ {knewCount}</span>
            <span style={styles.scoreChipRed}>✗ {needPracticeCount}</span>
          </div>
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        {/* know / don't-know split bar */}
        {(knewCount > 0 || needPracticeCount > 0) && (
          <div style={{ height: 5, borderRadius: 4, background: 'rgba(192,132,252,0.1)', overflow: 'hidden', marginTop: 4, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(knewCount / totalCards) * 100}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', transition: 'width 0.4s ease' }} />
            <div style={{ position: 'absolute', left: `${(knewCount / totalCards) * 100}%`, top: 0, bottom: 0, width: `${(needPracticeCount / totalCards) * 100}%`, background: 'linear-gradient(90deg,#f43f5e,#fb7185)', transition: 'all 0.4s ease' }} />
          </div>
        )}
        {knewPercent !== null && (
          <div style={styles.progressSubtext}>
            {knewPercent >= 80 ? '🌸 you\'re doing great!' : knewPercent >= 50 ? '💪 keep going!' : '📚 keep reviewing~'}
          </div>
        )}
      </div>

      {/* auto-play controls — flip mode only */}
      {cardMode !== 'test' && (
        <div style={styles.autoPlayRow}>
          <button
            onClick={() => setAutoPlay(prev => !prev)}
            style={{
              ...styles.autoPlayBtn,
              ...(autoPlay ? styles.autoPlayBtnActive : {}),
            }}
          >
            {autoPlay ? '⏸ pause' : '▶ auto-play'}
          </button>
          <button onClick={onShuffle} style={styles.shuffleBtn} title="shuffle remaining cards" aria-label="shuffle remaining cards">
            🔀
          </button>
          {autoPlay && (
            <div style={styles.autoPlaySpeeds}>
              {[2, 3, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setAutoPlaySpeed(s)}
                  style={{
                    ...styles.autoPlaySpeedBtn,
                    ...(autoPlaySpeed === s ? styles.autoPlaySpeedBtnActive : {}),
                  }}
                >
                  {s}s
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {cardMode === 'test' ? (
        /* ── TEST MODE ── */
        <div>
          {/* question card */}
          <div className="glass" style={styles.testQuestionCard}>
            <div style={styles.cardWatermark}>{currentIndex + 1}</div>
            {direction === 'ja-ru' ? (
              <>
                <div style={{
                  ...styles.cardJapanese,
                  fontSize: isMobile
                    ? ((card.kanji || card.japanese) && (card.kanji || card.japanese).length > 6 ? '1.8rem' : '2.4rem')
                    : ((card.kanji || card.japanese) && (card.kanji || card.japanese).length > 6 ? '2.2rem' : '3rem'),
                }}>
                  {card.kanji || card.japanese}
                </div>
                {card.kanji && <div style={styles.cardKanji}>{card.japanese}</div>}
                {showRomaji ? (
                  <div style={styles.cardRomaji}>{card.romaji}</div>
                ) : (
                  <button onClick={() => setShowRomaji(true)} style={styles.showRomajiBtn}>
                    show romaji
                  </button>
                )}
              </>
            ) : (
              <div style={styles.cardRussian}>{card.russian}</div>
            )}
          </div>

          {/* 4 options */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            {testOptions.map((opt) => {
              const correct = direction === 'ja-ru' ? card.russian : (card.kanji || card.japanese)
              const isCorrect = opt === correct
              const isSelected = testSelected === opt
              let bg = 'rgba(255,255,255,0.35)'
              let color = 'var(--text-main)'
              let borderColor = 'rgba(192,132,252,0.2)'
              if (testSelected !== null) {
                if (isCorrect) { bg = 'rgba(16,185,129,0.15)'; color = 'var(--correct-text)'; borderColor = 'var(--correct-text)' }
                else if (isSelected) { bg = 'rgba(239,68,68,0.12)'; color = 'var(--incorrect-text)'; borderColor = 'var(--incorrect-text)' }
                else { bg = 'rgba(150,150,180,0.08)'; color = 'var(--text-light)' }
              }
              return (
                <button
                  key={opt}
                  onClick={() => handleTestAnswer(opt)}
                  disabled={testSelected !== null}
                  style={{
                    padding: '14px 12px', borderRadius: 16, border: `2px solid ${borderColor}`,
                    background: bg, color, fontSize: '0.92rem', fontWeight: 700,
                    cursor: testSelected !== null ? 'default' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.25s',
                    textAlign: 'center', lineHeight: 1.3, minHeight: 60,
                  }}
                >
                  {isSelected && isCorrect && '✓ '}{isSelected && !isCorrect && '✗ '}{!isSelected && testSelected !== null && isCorrect && '✓ '}{opt}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        /* ── FLIP MODE ── */
        <>
          {/* tap hint */}
          <div style={styles.tapHint}>
            {autoPlay
              ? `auto-playing · ${autoPlaySpeed}s per side`
              : flipped
                ? 'swipe ← need practice  ·  swipe → knew it'
                : 'tap card to flip  ·  swipe to sort'}
          </div>

          {/* flashcard */}
          <div
            className="flashcard-wrapper"
            onClick={handleFlipClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="button"
            tabIndex={0}
            aria-label={flipped ? 'flip card back' : 'flip card'}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlipClick() } }}
          >
            <div className={`flashcard-inner${flipped ? ' flipped' : ''}`}>
              {/* front face */}
              <div className="flashcard-face">
                <div style={styles.cardWatermark}>{currentIndex + 1}</div>

                {direction === 'ja-ru' ? (
                  <>
                    <div style={{
                      ...styles.cardJapanese,
                      fontSize: isMobile
                        ? ((card.kanji || card.japanese) && (card.kanji || card.japanese).length > 6 ? '1.8rem' : '2.4rem')
                        : ((card.kanji || card.japanese) && (card.kanji || card.japanese).length > 6 ? '2.2rem' : '3rem'),
                    }}>
                      {card.kanji || card.japanese}
                    </div>
                    {card.kanji && <div style={styles.cardKanji}>{card.japanese}</div>}
                    {showRomaji ? (
                      <div style={styles.cardRomaji}>{card.romaji}</div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowRomaji(true) }}
                        style={styles.showRomajiBtn}
                      >
                        show romaji
                      </button>
                    )}
                  </>
                ) : (
                  <div style={styles.cardRussian}>{card.russian}</div>
                )}

                <div style={styles.flipHintBadge}>
                  <span style={styles.flipHintIcon}>🔄</span>
                  <span style={styles.flipHintText}>tap to reveal</span>
                </div>
              </div>

              {/* back face */}
              <div className="flashcard-face flashcard-back">
                {direction === 'ja-ru' ? (
                  <>
                    <div style={styles.cardRussian}>{card.russian}</div>
                    {verbType && <div style={styles.cardVerbType}>{verbType}</div>}
                    <div style={styles.divider} />
                    <div style={styles.cardJapaneseSm}>{card.kanji || card.japanese}</div>
                    {card.kanji && <div style={{ ...styles.cardRomajiSm, marginTop: 0 }}>{card.japanese}</div>}
                    <div style={styles.cardRomajiSm}>{card.romaji}</div>
                  </>
                ) : (
                  <>
                    <div style={{
                      ...styles.cardJapanese,
                      fontSize: isMobile
                        ? ((card.kanji || card.japanese) && (card.kanji || card.japanese).length > 6 ? '1.8rem' : '2.4rem')
                        : ((card.kanji || card.japanese) && (card.kanji || card.japanese).length > 6 ? '2.2rem' : '3rem'),
                    }}>
                      {card.kanji || card.japanese}
                    </div>
                    {card.kanji && <div style={styles.cardKanji}>{card.japanese}</div>}
                    <div style={styles.divider} />
                    <div style={styles.cardRomajiSm}>{card.romaji}</div>
                    {verbType && <div style={styles.cardVerbType}>{verbType}</div>}
                  </>
                )}
                {card.lesson && (
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(192,132,252,0.65)', marginTop: 10, letterSpacing: '0.04em' }}>
                    L{card.lesson}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <button
              onClick={onNeedPractice}
              className="fc-btn-practice"
              style={styles.btnNeedPractice}
            >
              <span style={styles.btnIcon}>😓</span>
              <div>
                <div style={styles.btnLabel}>need practice</div>
                <div style={styles.btnSub}>swipe ←</div>
              </div>
            </button>
            <button
              onClick={onKnew}
              className="fc-btn-knew"
              style={styles.btnKnewIt}
            >
              <div>
                <div style={styles.btnLabel}>knew it!</div>
                <div style={styles.btnSub}>swipe →</div>
              </div>
              <span style={styles.btnIcon}>✨</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryScreen({ knewIt, needPractice, onRetry, onReviewDifficult }) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const total = knewIt.length + needPractice.length
  const percentage = total > 0 ? Math.round((knewIt.length / total) * 100) : 0
  const xp = knewIt.length * 2 + (percentage >= 80 ? 10 : 0)

  const clearDifficult = () => {
    saveDifficultWords([])
  }

  const getMessage = () => {
    if (percentage >= 90) return { emoji: '🎉✨', jp: 'かんぺき！', text: 'kanpeki! you absolutely nailed it~', color: 'var(--correct-text)' }
    if (percentage >= 70) return { emoji: '🌸✨', jp: 'すごい！', text: 'sugoi! you know these words well~', color: 'var(--text-light)' }
    if (percentage >= 50) return { emoji: '💪🌸', jp: 'いい感じ！', text: 'ii kanji! good progress, keep going~', color: '#f472b6' }
    return { emoji: '📚🔥', jp: 'がんばって！', text: 'ganbatte! practice makes perfect~', color: 'var(--gold-text)' }
  }

  const msg = getMessage()

  return (
    <div className="animate-fadeInUp" style={styles.summaryWrap}>
      <div className="glass" style={{ ...styles.summaryCard, ...(isTablet ? styles.summaryCardTablet : {}) }}>
        {percentage >= 90 && <Confetti trigger={true} />}
        {/* celebration */}
        <div style={styles.summaryEmoji}>{msg.emoji}</div>
        <div style={{ ...styles.summaryJp, color: msg.color }}>{msg.jp}</div>
        <p style={styles.summaryText}>{msg.text}</p>

        {/* score circle */}
        <div style={{ ...styles.scoreCircle, background: `conic-gradient(${msg.color} ${percentage * 3.6}deg, rgba(192,132,252,0.15) 0deg)` }} className={percentage >= 90 ? 'score-perfect' : 'score-circle'}>
          <div style={styles.scoreCircleInner}>
            <span style={{ ...styles.scoreBig, color: msg.color }}>{percentage}%</span>
            <span style={styles.scoreDetail}>known</span>
          </div>
        </div>

        {xp > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168,85,247,0.1)', borderRadius: 50, padding: '4px 14px', marginBottom: 12 }} className="animate-pop">
            <span style={{ fontSize: '0.9rem' }}>⚡</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>+{xp} XP</span>
          </div>
        )}

        {/* stats */}
        <div style={{ ...styles.statsRow, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
          <div style={styles.statBlock}>
            <span style={{ ...styles.statNum, color: 'var(--correct-text)' }}>{knewIt.length}</span>
            <span style={styles.statLabel}>knew it ✨</span>
          </div>
          <div style={styles.statBlock}>
            <span style={{ ...styles.statNum, color: 'var(--incorrect-text)' }}>{needPractice.length}</span>
            <span style={styles.statLabel}>need practice</span>
          </div>
          <div style={styles.statBlock}>
            <span style={styles.statNum}>{total}</span>
            <span style={styles.statLabel}>total cards</span>
          </div>
        </div>

        {/* warm completion message */}
        <div style={styles.warmMessage}>
          {percentage >= 80
            ? '🌟 every card you flip is a step closer to fluency. you\'re doing beautifully~'
            : percentage >= 50
              ? '🌸 learning is a journey, not a race. you\'re making real progress~'
              : '🍃 the brain learns through repetition. these hard words will click soon~'}
        </div>

        {/* need practice list */}
        {needPractice.length > 0 && (
          <div style={styles.needPracticeSection}>
            <div style={styles.needPracticeLabel}>
              words to practice ({needPractice.length}) 📝
            </div>
            <div style={styles.needPracticeList}>
              {needPractice.map((w, i) => (
                <div key={(w.japanese || '') + i} style={styles.needPracticeItem}>
                  <span style={styles.npJapanese}>{w.kanji || w.japanese}</span>
                  <span style={styles.npRomaji}>{w.romaji}</span>
                  <span style={styles.npRussian}>{w.russian}</span>
                  {w.lesson && (
                    <Link to={`/lessons/${w.lesson}`} style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textDecoration: 'none', marginLeft: 'auto', flexShrink: 0 }}>
                      lesson {w.lesson} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <p style={styles.savedNote}>💾 saved to your difficult words list</p>
          </div>
        )}

        {/* actions */}
        <div style={styles.summaryActions}>
          <button className="btn btn-cute" onClick={onRetry}>
            review again 🌸
          </button>
          {needPractice.length > 0 && (
            <button className="btn btn-primary" onClick={onReviewDifficult} style={{ fontSize: '0.9rem' }}>
              drill difficult words 🔥
            </button>
          )}
          <ShareResult
            quizName="flash cards"
            score={knewIt.length}
            total={total}
            percentage={percentage}
            xpEarned={xp}
          />
          <button onClick={clearDifficult} style={styles.clearBtn}>
            clear difficult words list
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/quiz/vocab" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>vocab quiz ✨</Link>
            <Link to="/" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}>home 🏠</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: 24,
    padding: '12px 0 4px',
  },
  headerIcon: {
    fontSize: '2.8rem',
    marginBottom: 8,
    filter: 'drop-shadow(0 4px 12px rgba(244,114,182,0.3))',
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    textTransform: 'lowercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  titleJp: {
    fontSize: '0.88rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  setupCard: {
    padding: '20px 20px 18px',
    marginBottom: 14,
  },
  setupLabel: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textTransform: 'lowercase',
  },
  selectAllBtn: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    background: 'rgba(168, 85, 247, 0.08)',
    padding: '5px 14px',
    borderRadius: 50,
    marginBottom: 12,
    textTransform: 'lowercase',
    cursor: 'pointer',
    border: '1px solid rgba(168,85,247,0.2)',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  lessonCheckGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(110px, 44%), 1fr))',
    gap: 8,
  },
  lessonCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '11px 12px',
    borderRadius: 14,
    background: 'var(--tint)',
    border: '1.5px solid rgba(192,132,252,0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.9rem',
    minHeight: 44,
  },
  lessonCheckActive: {
    background: 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(192,132,252,0.12))',
    border: '1.5px solid #f472b6',
    boxShadow: '0 2px 10px rgba(244, 114, 182, 0.15)',
  },
  checkNum: {
    fontWeight: 900,
    color: 'var(--text-light)',
    fontSize: '0.82rem',
    minWidth: 18,
    textAlign: 'center',
  },
  checkJp: {
    fontWeight: 600,
    color: 'var(--text-main)',
    flex: 1,
    fontSize: '0.78rem',
  },
  checkCount: {
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 700,
  },
  poolInfo: {
    marginTop: 12,
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    textAlign: 'center',
  },
  difficultToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    cursor: 'pointer',
    minHeight: 44,
  },
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 50,
    background: 'var(--tint-strong)',
    border: '1.5px solid rgba(192,132,252,0.25)',
    position: 'relative',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  toggleTrackActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    border: '1.5px solid transparent',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'white',
    position: 'absolute',
    top: 2,
    left: 2,
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  toggleThumbActive: {
    left: 22,
  },
  toggleLabel: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  difficultNote: {
    marginTop: 12,
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#f472b6',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '8px 14px',
    background: 'rgba(244,114,182,0.06)',
    borderRadius: 10,
    border: '1px solid rgba(244,114,182,0.15)',
  },
  howItWorksRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  howItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  howIcon: {
    fontSize: '1.2rem',
  },
  howText: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'lowercase',
  },
  howArrow: {
    fontSize: '1rem',
    color: 'var(--text-light)',
    fontWeight: 700,
  },
  howTip: {
    fontSize: '0.72rem',
    color: 'var(--text-light)',
    fontWeight: 600,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  startWrap: {
    textAlign: 'center',
    marginTop: 24,
  },
  warnText: {
    marginTop: 8,
    fontSize: '0.78rem',
    color: 'var(--incorrect-text)',
    fontWeight: 600,
  },

  // review
  progressWrap: {
    marginBottom: 18,
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  cardCounter: {
    fontSize: '1.5rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
  },
  cardCounterOf: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-light)',
  },
  scoreChips: {
    display: 'flex',
    gap: 8,
  },
  scoreChipGreen: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--correct-text)',
    background: 'rgba(16,185,129,0.1)',
    padding: '3px 10px',
    borderRadius: 50,
    border: '1px solid rgba(16,185,129,0.2)',
  },
  scoreChipRed: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--incorrect-text)',
    background: 'rgba(244,63,94,0.08)',
    padding: '3px 10px',
    borderRadius: 50,
    border: '1px solid rgba(244,63,94,0.15)',
  },
  progressTrack: {
    height: 10,
    borderRadius: 50,
    background: 'var(--tint-strong)',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 50,
    background: 'linear-gradient(90deg, #f472b6, #c084fc, #a855f7)',
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 4px rgba(168,85,247,0.25)',
  },
  progressSubtext: {
    marginTop: 6,
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  autoPlayRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  autoPlayBtn: {
    padding: '6px 16px',
    borderRadius: 50,
    border: '1.5px solid rgba(192,132,252,0.25)',
    background: 'rgba(192,132,252,0.06)',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  shuffleBtn: {
    padding: '6px 10px',
    borderRadius: 50,
    border: '1.5px solid rgba(192,132,252,0.25)',
    background: 'rgba(192,132,252,0.06)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  autoPlayBtnActive: {
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    color: 'white',
    border: '1.5px solid transparent',
    boxShadow: '0 2px 10px rgba(168,85,247,0.3)',
  },
  autoPlaySpeeds: {
    display: 'flex',
    gap: 4,
  },
  autoPlaySpeedBtn: {
    padding: '4px 10px',
    borderRadius: 50,
    border: '1px solid rgba(192,132,252,0.2)',
    background: 'transparent',
    color: 'var(--text-light)',
    fontSize: '0.72rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
  autoPlaySpeedBtnActive: {
    background: 'rgba(168,85,247,0.15)',
    color: 'var(--text-light)',
    border: '1px solid rgba(168,85,247,0.35)',
  },
  tapHint: {
    textAlign: 'center',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    marginBottom: 14,
    textTransform: 'lowercase',
    letterSpacing: '0.01em',
  },

  testQuestionCard: {
    padding: 'clamp(16px, 5vw, 32px) clamp(12px, 4vw, 24px)', borderRadius: 24, marginBottom: 16, minHeight: 140,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    position: 'relative', textAlign: 'center',
  },

  // card front
  cardWatermark: {
    position: 'absolute',
    top: 14,
    right: 18,
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'rgba(192,132,252,0.3)',
    letterSpacing: '0.05em',
  },
  cardJapanese: {
    fontSize: 'clamp(2rem, 7vw, 2.8rem)',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 8,
    lineHeight: 1.2,
    textAlign: 'center',
    letterSpacing: '0.02em',
  },
  cardKanji: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    marginBottom: 6,
  },
  cardRomaji: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    marginBottom: 18,
  },
  showRomajiBtn: {
    padding: '5px 16px',
    borderRadius: 50,
    border: '1px solid rgba(192,132,252,0.3)',
    background: 'rgba(192,132,252,0.07)',
    color: 'var(--text-light)',
    fontSize: '0.72rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Nunito, sans-serif',
    marginBottom: 18,
    transition: 'all 0.2s',
    textTransform: 'lowercase',
    minHeight: 44,
  },
  flipHintBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 14px',
    borderRadius: 50,
    background: 'rgba(192,132,252,0.08)',
    border: '1px solid rgba(192,132,252,0.18)',
  },
  flipHintIcon: {
    fontSize: '0.85rem',
  },
  flipHintText: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
    letterSpacing: '0.02em',
  },

  // card back
  cardRussian: {
    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
    fontWeight: 900,
    color: 'var(--text-main)',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 1.3,
  },
  cardVerbType: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'white',
    background: 'linear-gradient(135deg, #a855f7, #c084fc)',
    padding: '4px 14px',
    borderRadius: 50,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(168,85,247,0.25)',
  },
  divider: {
    width: '40px',
    height: 2,
    borderRadius: 2,
    background: 'rgba(192,132,252,0.25)',
    margin: '8px auto 12px',
  },
  cardJapaneseSm: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: 3,
  },
  cardRomajiSm: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  },

  // action buttons
  btnNeedPractice: {
    padding: '16px 20px',
    borderRadius: 18,
    background: 'rgba(244, 63, 94, 0.08)',
    border: '2px solid rgba(244, 63, 94, 0.25)',
    color: 'var(--incorrect-text)',
    fontSize: '0.95rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Nunito, sans-serif',
    textTransform: 'lowercase',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  btnKnewIt: {
    padding: '16px 20px',
    borderRadius: 18,
    background: 'rgba(16, 185, 129, 0.08)',
    border: '2px solid rgba(16, 185, 129, 0.25)',
    color: 'var(--correct-text)',
    fontSize: '0.95rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Nunito, sans-serif',
    textTransform: 'lowercase',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  btnIcon: {
    fontSize: '1.3rem',
  },
  btnLabel: {
    fontSize: '0.95rem',
    fontWeight: 800,
    lineHeight: 1.2,
  },
  btnSub: {
    fontSize: '0.72rem',
    fontWeight: 600,
    opacity: 0.6,
    fontStyle: 'italic',
  },

  // summary
  summaryWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    textAlign: 'center',
    padding: 'clamp(20px, 5vw, 36px) clamp(14px, 4vw, 26px)',
    maxWidth: 460,
    width: '100%',
  },
  summaryCardTablet: {
    maxWidth: 600,
  },
  summaryEmoji: {
    fontSize: '2.8rem',
    marginBottom: 6,
  },
  summaryJp: {
    fontSize: '1.4rem',
    fontWeight: 900,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginBottom: 24,
    textTransform: 'lowercase',
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 28px rgba(236, 72, 153, 0.2)',
    transition: 'all 0.5s ease',
  },
  scoreCircleInner: {
    width: 106,
    height: 106,
    borderRadius: '50%',
    background: 'var(--tint-solid)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBig: {
    fontSize: '1.8rem',
    fontWeight: 900,
    lineHeight: 1,
  },
  scoreDetail: {
    fontSize: '0.78rem',
    color: 'var(--text-light)',
    fontWeight: 600,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 18,
  },
  statBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '12px 8px',
    borderRadius: 14,
    background: 'var(--tint)',
  },
  statNum: {
    fontSize: '1.5rem',
    fontWeight: 900,
    color: 'var(--text-main)',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textTransform: 'lowercase',
  },
  warmMessage: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '12px 16px',
    borderRadius: 14,
    background: 'rgba(192,132,252,0.06)',
    border: '1px solid rgba(192,132,252,0.12)',
    marginBottom: 20,
    lineHeight: 1.5,
  },
  needPracticeSection: {
    marginBottom: 20,
    textAlign: 'left',
  },
  needPracticeLabel: {
    fontSize: '0.82rem',
    fontWeight: 800,
    color: 'var(--incorrect-text)',
    textTransform: 'lowercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  needPracticeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  needPracticeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(244, 63, 94, 0.05)',
    border: '1px solid rgba(244, 63, 94, 0.12)',
    borderLeft: '3px solid var(--incorrect-text)',
    borderRadius: 12,
    padding: '9px 14px',
  },
  npJapanese: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-main)',
    minWidth: 80,
  },
  npRomaji: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    fontStyle: 'italic',
    flex: 1,
  },
  npRussian: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textAlign: 'right',
  },
  savedNote: {
    marginTop: 10,
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-light)',
    textAlign: 'center',
  },
  summaryActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
    maxWidth: 280,
    margin: '0 auto',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-light)',
    cursor: 'pointer',
    padding: '4px 8px',
    textDecoration: 'underline',
    textTransform: 'lowercase',
    fontFamily: 'Nunito, sans-serif',
    minHeight: 44,
  },
}
