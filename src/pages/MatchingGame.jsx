import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useXP } from '../hooks/useXP'
import { useProgress } from '../hooks/useProgress'
import { useUnlockedLessons } from '../hooks/useUnlockedLessons'
import { lessons } from '../data/lessons'
import { useIsMobile, useIsTablet } from '../hooks/useIsMobile'
import Confetti from '../components/Confetti'
import ShareResult from '../components/ShareResult'
import { getStoredNonNegativeInt, setStoredString } from '../utils/localSettings'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const PHASE_SETUP = 'setup'
const PHASE_GAME = 'game'
const PHASE_RESULTS = 'results'

export default function MatchingGame() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { awardXP } = useXP()
  const { saveQuizResult } = useProgress()
  const { unlockedLessons } = useUnlockedLessons()
  const [searchParams] = useSearchParams()
  const sharedLessonId = parseInt(searchParams.get('lesson') || '', 10)
  const sharedLesson = Number.isFinite(sharedLessonId) ? lessons.find(l => l.id === sharedLessonId) : null
  const lessonPool = useMemo(() => (
    sharedLesson && !unlockedLessons.some(l => l.id === sharedLesson.id)
      ? [...unlockedLessons, sharedLesson]
      : unlockedLessons
  ), [sharedLesson, unlockedLessons])
  const [phase, setPhase] = useState(PHASE_SETUP)
  const [selectedLessons, setSelectedLessons] = useState([])
  const [pairCount, setPairCount] = useState(6)
  const [timed, setTimed] = useState(false)
  const [hardMode, setHardMode] = useState(false)

  // game state
  const [cards, setCards] = useState([])
  const [selected, setSelected] = useState(null)
  const [matched, setMatched] = useState([])
  const [wrong, setWrong] = useState(null)
  const [moves, setMoves] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const [recentlyMatched, setRecentlyMatched] = useState([]) // for celebration glow
  const timerRef = useRef(null)
  const recentlyMatchedTimerRef = useRef(null)
  const wrongTimerRef = useRef(null)
  const phaseTimerRef = useRef(null)
  const xpAwardedRef = useRef(false)
  useEffect(() => () => {
    clearInterval(timerRef.current)
    clearTimeout(phaseTimerRef.current)
    clearTimeout(recentlyMatchedTimerRef.current)
    clearTimeout(wrongTimerRef.current)
  }, [])

  const availableLessons = lessonPool.map(l => ({ id: l.id, count: l.vocabulary.length }))

  // Pre-select lesson from ?lesson=X URL param
  useEffect(() => {
    const lessonParam = searchParams.get('lesson')
    if (lessonParam && lessonPool.length > 0) {
      const lessonId = parseInt(lessonParam, 10)
      if (lessonPool.some(l => l.id === lessonId)) {
        setSelectedLessons([lessonId])
      }
    }
  }, [searchParams, lessonPool])

  const toggleLesson = (id) => {
    setSelectedLessons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedLessons(prev =>
      prev.length === availableLessons.length ? [] : availableLessons.map(l => l.id)
    )
  }

  const startGame = () => {
    const pool = lessonPool
      .filter(l => selectedLessons.includes(l.id))
      .flatMap(l => l.vocabulary)

    if (pool.length < pairCount) return

    const words = shuffle(pool).slice(0, pairCount)

    const pairs = words.flatMap((w, i) => [
      { id: `jp-${i}`, pairId: i, text: ((w.kanji || w.japanese) || '').replace(/\s*\[(?!な)[^\]]*\]/g, '').trim(), type: 'jp', romaji: (w.romaji || '').replace(/\s*\[[^\]]*\]/g, '').trim() },
      { id: `ru-${i}`, pairId: i, text: w.russian, type: 'ru', word: w },
    ])

    setCards(shuffle(pairs))
    setSelected(null)
    setMatched([])
    setWrong(null)
    setMoves(0)
    setCombo(0)
    setMaxCombo(0)
    setElapsed(0)
    setRecentlyMatched([])
    setStartTime(Date.now())
    xpAwardedRef.current = false
    setPhase(PHASE_GAME)
  }

  // timer — always running during game (shown in results, highlighted when timed mode)
  useEffect(() => {
    if (phase !== PHASE_GAME) return
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, startTime])

  // check win condition
  useEffect(() => {
    if (phase === PHASE_GAME && matched.length === cards.length && cards.length > 0) {
      clearInterval(timerRef.current)
      const pairs = cards.length / 2
      const eff = moves > 0 ? pairs / moves : 1
      const comboBonus = maxCombo >= 5 ? 15 : maxCombo >= 3 ? 8 : maxCombo >= 2 ? 3 : 0
      const xp = Math.round(pairs * 3 * Math.min(eff, 1)) + (eff >= 0.8 ? 10 : 0) + comboBonus
      if (!xpAwardedRef.current) {
        xpAwardedRef.current = true
        if (xp > 0) awardXP(xp, 'matching game', moves === pairs)
        saveQuizResult('vocab', { lessons: selectedLessons, score: pairs, total: pairs })
      }

      try {
        const key = `nihongo-matching-best-${pairs}`
        const prevBest = getStoredNonNegativeInt(key, 0)
        const currentEff = moves > 0 ? Math.round((pairs / moves) * 100) : 100
        if (currentEff > prevBest) {
          setStoredString(key, currentEff)
          setIsNewBest(true)
        } else {
          setIsNewBest(false)
        }
      } catch { setIsNewBest(false) }

      phaseTimerRef.current = setTimeout(() => setPhase(PHASE_RESULTS), 700)
    }
  }, [matched.length, cards.length, phase, moves, maxCombo, selectedLessons, awardXP, saveQuizResult])

  const handleCardClick = (index) => {
    if (wrong !== null) return
    if (matched.includes(index)) return
    if (selected === index) return

    if (selected === null) {
      setSelected(index)
      return
    }

    const first = cards[selected]
    const second = cards[index]
    setMoves(prev => prev + 1)

    if (first.pairId === second.pairId && first.type !== second.type) {
      const newCombo = combo + 1
      setCombo(newCombo)
      if (newCombo > maxCombo) setMaxCombo(newCombo)
      const newMatched = [selected, index]
      setMatched(prev => [...prev, ...newMatched])
      setRecentlyMatched(newMatched)
      clearTimeout(recentlyMatchedTimerRef.current)
      recentlyMatchedTimerRef.current = setTimeout(() => setRecentlyMatched([]), 900)
      setSelected(null)
    } else {
      setCombo(0)
      setWrong([selected, index])
      clearTimeout(wrongTimerRef.current)
      wrongTimerRef.current = setTimeout(() => {
        setWrong(null)
        setSelected(null)
      }, 800)
    }
  }

  const formatTime = (s) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return min > 0 ? `${min}:${sec.toString().padStart(2, '0')}` : `${sec}s`
  }

  const perfectMoves = cards.length / 2
  const efficiency = moves > 0 ? Math.round((perfectMoves / moves) * 100) : 0
  const matchedPairs = matched.length / 2
  const totalPairs = cards.length / 2


  // scroll to top when results phase begins
  useEffect(() => {
    if (phase === PHASE_RESULTS) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  return (
    <div className="page">
      <style>{`
        @keyframes matchSuccess {
          0% { transform: scale(1); }
          30% { transform: scale(1.12); }
          60% { transform: scale(0.97); }
          100% { transform: scale(1); }
        }
        @keyframes wrongShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-7px) rotate(-2deg); }
          40% { transform: translateX(7px) rotate(2deg); }
          60% { transform: translateX(-5px) rotate(-1deg); }
          80% { transform: translateX(5px) rotate(1deg); }
        }
        @keyframes cardHoverLift {
          to { transform: translateY(-4px) scale(1.03); }
        }
        @keyframes matchGlow {
          0% { box-shadow: 0 4px 16px rgba(16,185,129,0.2); }
          50% { box-shadow: 0 6px 28px rgba(16,185,129,0.55), 0 0 0 3px rgba(16,185,129,0.2); }
          100% { box-shadow: 0 4px 16px rgba(16,185,129,0.2); }
        }
        .mg-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.3s ease;
          cursor: pointer;
        }
        .mg-card:not(:disabled):not(.matched):hover {
          transform: translateY(-4px) scale(1.04);
          box-shadow: 0 8px 24px rgba(192,132,252,0.2);
        }
        .mg-card:not(:disabled):not(.matched):active {
          transform: scale(0.97);
        }
        .mg-card.recently-matched {
          animation: matchSuccess 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards, matchGlow 0.9s ease forwards;
        }
        .mg-card.wrong-anim {
          animation: wrongShake 0.45s ease-in-out forwards;
        }
        .mg-preset-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 8px 20px rgba(192,132,252,0.2);
        }
        @media (prefers-reduced-motion: reduce) {
          .mg-card.recently-matched { animation: none; }
          .mg-card.wrong-anim { animation: none; }
          .mg-card { transition: none; }
          .mg-card:not(:disabled):not(.matched):hover { transform: none; }
          .mg-card:not(:disabled):not(.matched):active { transform: none; }
        }
      `}</style>

      {phase === PHASE_SETUP && (
        <SetupScreen
          isMobile={isMobile}
          availableLessons={availableLessons}
          selectedLessons={selectedLessons}
          toggleLesson={toggleLesson}
          selectAll={selectAll}
          pairCount={pairCount}
          setPairCount={setPairCount}
          timed={timed}
          setTimed={setTimed}
          hardMode={hardMode}
          setHardMode={setHardMode}
          onStart={startGame}
        />
      )}

      {phase === PHASE_GAME && (
        <GameScreen
          isMobile={isMobile}
          cards={cards}
          selected={selected}
          matched={matched}
          wrong={wrong}
          recentlyMatched={recentlyMatched}
          moves={moves}
          combo={combo}
          elapsed={elapsed}
          timed={timed}
          hardMode={hardMode}
          pairCount={pairCount}
          matchedPairs={matchedPairs}
          totalPairs={totalPairs}
          formatTime={formatTime}
          onCardClick={handleCardClick}
        />
      )}

      {phase === PHASE_RESULTS && (
        <ResultsScreen
          efficiency={efficiency}
          moves={moves}
          cards={cards}
          maxCombo={maxCombo}
          timed={timed}
          hardMode={hardMode}
          pairCount={pairCount}
          elapsed={elapsed}
          isNewBest={isNewBest}
          formatTime={formatTime}
          isTablet={isTablet}
          onPlayAgain={() => setPhase(PHASE_SETUP)}
        />
      )}
    </div>
  )
}

function SetupScreen({ isMobile, availableLessons, selectedLessons, toggleLesson, selectAll, pairCount, setPairCount, timed, setTimed, hardMode, setHardMode, onStart }) {
  return (
    <div className="animate-fadeInUp" style={{ paddingBottom: 100 }}>
      {/* header */}
      <div style={s.header}>
        <div style={s.headerIcon}>🎮</div>
        <h1 style={s.title}>
          matching game
          <span style={s.titleJp}>マッチング</span>
        </h1>
        <p style={s.subtitle}>pair japanese words with their translations~</p>
      </div>

      {/* quick start presets */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}>quick start</div>
        <div style={{ ...s.presetsRow, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
          {[
            { icon: '🌸', name: 'easy', desc: '4 pairs · relaxed', pairs: 4, timer: false, color: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
            { icon: '🔥', name: 'hard', desc: '8 pairs · timed', pairs: 8, timer: true, color: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
            { icon: '💥', name: 'expert', desc: '12 pairs · timed', pairs: 12, timer: true, color: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
          ].map(preset => (
            <button
              key={preset.name}
              onClick={() => {
                selectAll()
                setPairCount(preset.pairs)
                setTimed(preset.timer)
              }}
              className="mg-preset-btn glass-sm"
              style={{
                ...s.presetBtn,
                background: preset.color,
                border: `1.5px solid ${preset.border}`,
              }}
            >
              <span style={s.presetIcon}>{preset.icon}</span>
              <span style={s.presetName}>{preset.name}</span>
              <span style={s.presetDesc}>{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* lesson selection */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}>lessons</div>
        <div style={s.chipsWrap}>
          <button
            onClick={selectAll}
            style={{ ...s.chip, ...(selectedLessons.length === availableLessons.length ? s.chipActive : {}) }}
          >
            all
          </button>
          {availableLessons.map(l => (
            <button
              key={l.id}
              onClick={() => toggleLesson(l.id)}
              style={{ ...s.chip, ...(selectedLessons.includes(l.id) ? s.chipActive : {}) }}
            >
              {l.id}
            </button>
          ))}
        </div>
      </div>

      {/* pair count */}
      <div className="glass" style={s.setupCard}>
        <div style={s.setupLabel}>
          кол-во пар: <span style={{ color: '#f472b6', fontWeight: 900, marginLeft: 6 }}>{pairCount}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600, marginLeft: 6 }}>= {pairCount * 2} карточек</span>
        </div>
        <input
          type="range"
          className="kawaii-slider"
          min={4}
          max={12}
          value={pairCount}
          onChange={e => setPairCount(parseInt(e.target.value, 10))}
          aria-label="number of pairs"
        />
        <div style={s.pairHint}>
          {pairCount <= 6 ? '🌸 легко — отличная разминка' : pairCount <= 9 ? '🔥 средне — хорошая тренировка' : '💎 сложно — режим эксперта'}
        </div>
      </div>

      {/* timed mode */}
      <div className="glass" style={s.setupCard}>
        <label style={s.timedLabel}>
          <div
            role="switch" aria-checked={timed} aria-label="timed mode" tabIndex={0}
            style={{ ...s.timedToggleTrack, ...(timed ? s.timedToggleActive : {}) }}
            onClick={() => setTimed(p => !p)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTimed(p => !p) } }}
          >
            <div style={{ ...s.timedToggleThumb, ...(timed ? s.timedToggleThumbActive : {}) }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>timed mode ⏱️</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600, marginTop: 2 }}>
              {timed ? 'stopwatch running — how fast can you go?' : 'off — take your time, no pressure~'}
            </div>
          </div>
        </label>
      </div>

      {/* hard mode */}
      <div className="glass" style={s.setupCard}>
        <label style={s.timedLabel}>
          <div
            role="switch" aria-checked={hardMode} aria-label="hard mode" tabIndex={0}
            style={{ ...s.timedToggleTrack, ...(hardMode ? { background: 'linear-gradient(135deg,#f472b6,#c084fc)', borderColor: 'transparent' } : {}) }}
            onClick={() => setHardMode(p => !p)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHardMode(p => !p) } }}
          >
            <div style={{ ...s.timedToggleThumb, ...(hardMode ? s.timedToggleThumbActive : {}) }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>hard mode 🧠</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600, marginTop: 2 }}>
              {hardMode ? 'cards flip face-down — memorize their positions!' : 'off — cards stay face-up~'}
            </div>
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
        <button
          className="btn btn-cute"
          onClick={onStart}
          disabled={selectedLessons.length === 0}
          style={{
            opacity: selectedLessons.length === 0 ? 0.45 : 1,
            pointerEvents: selectedLessons.length === 0 ? 'none' : 'auto',
            fontSize: '1rem',
            padding: '14px 36px',
          }}
        >
          start game! 🎮
        </button>
        <Link to="/game/typing" className="btn btn-secondary" style={{ textAlign: 'center' }}>typing ⌨️</Link>
        <Link to="/" className="btn btn-secondary" style={{ textAlign: 'center' }}>home 🏠</Link>
      </div>
      {selectedLessons.length === 0 && (
        <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--incorrect-text)', fontWeight: 600, textAlign: 'center' }}>
          select at least one lesson
        </p>
      )}
    </div>
  )
}

function GameScreen({ isMobile, cards, selected, matched, wrong, recentlyMatched, moves, combo, elapsed, timed, hardMode, pairCount, matchedPairs, totalPairs, formatTime, onCardClick }) {
  const cols = isMobile ? 3 : (pairCount <= 6 ? 3 : 4)

  return (
    <div className="animate-fadeInUp">
      {/* status bar */}
      <div style={s.statusBar} className="glass-sm">
        <div style={s.statusItem}>
          <span style={s.statusLabel}>matched</span>
          <span style={s.statusValue} aria-live="polite" aria-atomic="true">{matchedPairs} / {totalPairs}</span>
        </div>
        <div style={{ ...s.statusItem, borderLeft: '1px solid rgba(192,132,252,0.15)', borderRight: '1px solid rgba(192,132,252,0.15)', padding: '0 16px' }}>
          <span style={s.statusLabel}>moves</span>
          <span style={s.statusValue}>{moves}</span>
        </div>
        {timed ? (
          <div style={s.statusItem}>
            <span style={s.statusLabel}>time</span>
            <span style={{ ...s.statusValue, color: elapsed > 60 ? 'var(--incorrect-text)' : 'var(--text-main)' }}>
              {formatTime(elapsed)}
            </span>
          </div>
        ) : (
          <div style={s.statusItem}>
            <span style={s.statusLabel}>left</span>
            <span style={s.statusValue}>{totalPairs - matchedPairs}</span>
          </div>
        )}
      </div>

      {/* progress mini bar */}
      <div style={s.miniProgress}>
        <div style={{ ...s.miniProgressFill, width: `${(matchedPairs / totalPairs) * 100}%` }} />
      </div>
      <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 4 }}>
        <Link to="/" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', opacity: 0.5, textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '0 8px' }}>✕ quit</Link>
      </div>

      {/* combo badge */}
      {combo >= 2 && (
        <div className="animate-pop" style={s.comboBadge}>
          <span style={s.comboText}>
            {combo >= 5 ? '💥' : '🔥'}{combo >= 3 ? '🔥' : ''} {combo}x combo{combo >= 3 ? '!' : ''}{combo >= 5 ? '!' : ''}
          </span>
        </div>
      )}

      {/* card grid */}
      <div style={{ ...s.grid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((card, i) => {
          const isMatched = matched.includes(i)
          const isSelected = selected === i
          const isWrong = wrong && wrong.includes(i)
          const isRevealed = isSelected || isWrong
          const isRecentlyMatched = recentlyMatched.includes(i)

          let cardClass = 'mg-card'
          if (isMatched) cardClass += ' matched'
          if (isRecentlyMatched) cardClass += ' recently-matched'
          if (isWrong) cardClass += ' wrong-anim'

          return (
            <button
              key={card.id}
              onClick={() => onCardClick(i)}
              disabled={isMatched}
              className={isMatched ? cardClass : `${cardClass} glass-sm`}
              style={{
                ...s.card,
                ...(isMatched ? s.cardMatched : {}),
                ...(isSelected ? s.cardSelected : {}),
                ...(isWrong ? s.cardWrong : {}),
              }}
            >
              {/* card content */}
              {isMatched ? (
                <span style={{ ...s.cardText, ...s.cardTextMatched, fontSize: card.type === 'jp' ? '1rem' : '0.8rem' }}>
                  {card.text}
                </span>
              ) : isRevealed ? (
                <>
                  <span style={{ ...s.cardText, ...(card.type === 'jp' ? s.cardTextJp : s.cardTextRu) }}>
                    {card.text}
                  </span>
                  {card.type === 'jp' && card.romaji && (
                    <span style={s.cardRomaji}>{card.romaji}</span>
                  )}
                </>
              ) : hardMode ? (
                <span style={{ fontSize: '1.4rem', opacity: 0.35 }}>？</span>
              ) : (
                <>
                  <span style={{ ...s.cardText, ...(card.type === 'jp' ? s.cardTextJp : s.cardTextRu) }}>
                    {card.text}
                  </span>
                  <span style={s.cardTypeTag}>{card.type === 'jp' ? '日' : 'RU'}</span>
                </>
              )}

              {/* matched checkmark */}
              {isMatched && (
                <span style={s.matchedCheck}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* encouraging message */}
      {matchedPairs > 0 && matchedPairs < totalPairs && (
        <div style={s.encouragement} className="animate-fadeInUp">
          {matchedPairs >= totalPairs * 0.75
            ? '🌸 almost there! just a few more~'
            : matchedPairs >= totalPairs * 0.5
              ? '🔥 halfway! you\'re on fire~'
              : '✨ great start! keep going~'}
        </div>
      )}
    </div>
  )
}

function ResultsScreen({ efficiency, moves, cards, maxCombo, timed, hardMode, pairCount, elapsed, isNewBest, formatTime, isTablet, onPlayAgain }) {
  const perfectMoves = cards.length / 2

  const xp = (() => {
    const pairs = cards.length / 2
    const eff = moves > 0 ? pairs / moves : 1
    const comboBonus = maxCombo >= 5 ? 15 : maxCombo >= 3 ? 8 : maxCombo >= 2 ? 3 : 0
    return Math.round(pairs * 3 * Math.min(eff, 1)) + (eff >= 0.8 ? 10 : 0) + comboBonus
  })()

  const getResult = () => {
    if (efficiency >= 90) return { emoji: '🎉✨', title: 'sugoi!! perfect!', color: 'var(--correct-text)' }
    if (efficiency >= 70) return { emoji: '🌸😊', title: 'yoku dekimashita!', color: 'var(--text-light)' }
    if (efficiency >= 50) return { emoji: '💪🐱', title: 'good effort!', color: '#f472b6' }
    return { emoji: '🌙📚', title: 'ganbatte!', color: 'var(--gold-text)' }
  }

  const res = getResult()
  const effColor = efficiency >= 80 ? 'var(--correct-text)' : efficiency >= 60 ? 'var(--gold-text)' : 'var(--incorrect-text)'

  return (
    <div className="animate-fadeInUp" style={s.resultsWrap}>
      <div className="glass" style={{ ...s.resultsCard, ...(isTablet ? s.resultsCardTablet : {}) }}>
        {efficiency >= 100 && <Confetti trigger={true} />}

        <div style={{ fontSize: '3rem', marginBottom: 10 }}>{res.emoji}</div>
        <h2 style={{ ...s.resultsTitle, color: res.color }}>{res.title}</h2>

        {/* difficulty context */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={s.diffBadge}>{pairCount} pairs</span>
          {timed && <span style={{ ...s.diffBadge, background: 'rgba(244,114,182,0.15)', color: '#f472b6' }}>⏱ timed</span>}
          {hardMode && <span style={{ ...s.diffBadge, background: 'rgba(239,68,68,0.12)', color: 'var(--incorrect-text)' }}>💀 hard</span>}
        </div>

        <div style={s.resultsStats}>
          <div style={s.resultsStat}>
            <span style={s.resultsStatNum}>{moves}</span>
            <span style={s.resultsStatLabel}>moves</span>
          </div>
          <div style={{ ...s.resultsStat, borderLeft: '1px solid rgba(192,132,252,0.15)', borderRight: '1px solid rgba(192,132,252,0.15)', padding: '0 16px' }}>
            <span style={{ ...s.resultsStatNum, color: effColor }}>{efficiency}%</span>
            <span style={s.resultsStatLabel}>efficiency</span>
          </div>
          <div style={s.resultsStat}>
            <span style={s.resultsStatNum}>
              {maxCombo >= 5 ? '💥' : maxCombo >= 2 ? '🔥' : ''} {maxCombo}x
            </span>
            <span style={s.resultsStatLabel}>best combo</span>
          </div>
          <div style={s.resultsStat}>
            <span style={{ ...s.resultsStatNum, ...(timed ? { color: '#f472b6' } : {}) }}>
              {formatTime(elapsed)}
            </span>
            <span style={s.resultsStatLabel}>time</span>
          </div>
        </div>

        {/* efficiency bar */}
        <div style={s.effBar}>
          <div style={{ ...s.effBarFill, width: `${Math.min(efficiency, 100)}%`, background: res.color }} />
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 600, marginBottom: 16 }}>
          perfect = {perfectMoves} moves · you used {moves}
        </div>

        {/* XP */}
        {xp > 0 && (
          <div style={s.xpBadge} className="animate-pop">
            <span>⚡</span>
            <span style={{ fontWeight: 800, color: 'var(--gold-text)' }}>+{xp} XP</span>
            {maxCombo >= 2 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-text)', fontWeight: 600 }}>
                (incl. {maxCombo >= 5 ? 15 : maxCombo >= 3 ? 8 : 3} combo bonus)
              </span>
            )}
          </div>
        )}

        {isNewBest && (
          <div style={s.newBest} className="animate-pop">
            🏆 new personal best!
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button className="btn btn-cute" onClick={onPlayAgain}>
            play again 🎮
          </button>
          <ShareResult
            quizName="matching game"
            score={cards.length / 2}
            total={moves}
            percentage={efficiency}
            bestStreak={maxCombo}
            xpEarned={xp}
          />
          <Link to="/game/typing" className="btn btn-secondary">typing ⌨️</Link>
          <Link to="/" className="btn btn-secondary">home 🏠</Link>
        </div>
      </div>
    </div>
  )
}

const s = {
  diffBadge: {
    padding: '3px 10px', borderRadius: 50,
    background: 'rgba(192,132,252,0.12)', color: 'var(--text-light)',
    fontSize: '0.72rem', fontWeight: 700,
  },
  header: { textAlign: 'center', marginBottom: 22, padding: '12px 0 4px' },
  headerIcon: {
    fontSize: '2.8rem',
    marginBottom: 8,
    filter: 'drop-shadow(0 4px 12px rgba(168,85,247,0.3))',
  },
  title: {
    fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap', gap: 10, marginBottom: 6,
  },
  titleJp: { fontSize: '0.88rem', color: 'var(--text-light)', fontWeight: 600 },
  subtitle: { fontSize: '1rem', color: 'var(--text-light)', fontWeight: 500 },
  setupCard: { padding: '20px 20px 18px', marginBottom: 14, textAlign: 'center' },
  setupLabel: {
    fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14,
    textTransform: 'lowercase', textAlign: 'left',
  },
  chipsWrap: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  chip: {
    padding: '5px 14px', borderRadius: 50, border: '1.5px solid rgba(192,132,252,0.25)',
    background: 'var(--tint)', fontSize: '0.78rem', fontWeight: 700,
    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s', minHeight: 44,
  },
  chipActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)', color: 'white',
    border: '1.5px solid transparent', boxShadow: '0 2px 10px rgba(244,114,182,0.25)',
  },
  pairHint: { marginTop: 8, fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600, fontStyle: 'italic' },
  timedLabel: {
    display: 'flex', alignItems: 'center', gap: 14,
    cursor: 'pointer', textAlign: 'left',
  },
  timedToggleTrack: {
    width: 46, height: 26, borderRadius: 50,
    background: 'var(--tint-strong)', border: '1.5px solid rgba(192,132,252,0.2)',
    position: 'relative', transition: 'all 0.3s ease', flexShrink: 0, cursor: 'pointer',
  },
  timedToggleActive: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    border: '1.5px solid transparent',
  },
  timedToggleThumb: {
    width: 20, height: 20, borderRadius: '50%', background: 'white',
    position: 'absolute', top: 2, left: 2,
    transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  timedToggleThumbActive: { left: 22 },
  presetsRow: { display: 'grid', gap: 10 },
  presetBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '16px 10px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s ease', minHeight: 44,
  },
  presetIcon: { fontSize: '1.6rem', lineHeight: 1, marginBottom: 2 },
  presetName: { fontSize: '0.88rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'lowercase' },
  presetDesc: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-light)' },

  // game
  statusBar: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: 0, marginBottom: 10, padding: '12px 20px', borderRadius: 16,
  },
  statusItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '0 16px',
  },
  statusLabel: {
    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-light)',
    textTransform: 'lowercase', letterSpacing: '0.04em',
  },
  statusValue: { fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' },
  miniProgress: {
    height: 5, borderRadius: 50, background: 'var(--tint-strong)',
    overflow: 'hidden', marginBottom: 14,
  },
  miniProgressFill: {
    height: '100%', borderRadius: 50,
    background: 'linear-gradient(90deg, #f472b6, #c084fc)',
    transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
  },
  comboBadge: { display: 'flex', justifyContent: 'center', marginBottom: 10 },
  comboText: {
    display: 'inline-block', padding: '5px 18px', borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(244,114,182,0.12))',
    border: '1.5px solid rgba(251,191,36,0.4)',
    fontSize: '0.88rem', fontWeight: 900, color: 'var(--gold-text)',
    letterSpacing: '0.02em',
  },
  grid: {
    display: 'grid', gap: 10, maxWidth: 'min(520px, 100%)', margin: '0 auto 16px',
  },
  card: {
    padding: '14px 8px', borderRadius: 16, minHeight: 76,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 5, border: '2px solid transparent', fontFamily: 'inherit',
    position: 'relative', overflow: 'hidden',
  },
  cardSelected: {
    border: '2px solid #c084fc',
    boxShadow: '0 4px 20px rgba(192,132,252,0.35), 0 0 0 2px rgba(192,132,252,0.1)',
    transform: 'translateY(-3px) scale(1.04)',
  },
  cardMatched: {
    background: 'rgba(16,185,129,0.08)',
    border: '2px solid rgba(16,185,129,0.25)',
    opacity: 0.65,
    cursor: 'default',
  },
  cardWrong: {
    boxShadow: '0 0 0 2px var(--incorrect-text), 0 0 0 4px rgba(239,68,68,0.1)',
    background: 'rgba(239,68,68,0.08)',
  },
  cardText: {
    fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.3,
    textAlign: 'center', wordBreak: 'break-word',
  },
  cardTextJp: { color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 800 },
  cardTextRu: { color: 'var(--text-secondary)', fontSize: '0.82rem' },
  cardTextMatched: { opacity: 0.55, color: 'var(--correct-text)', fontSize: '0.85rem' },
  cardRomaji: {
    fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-light)', fontStyle: 'italic',
  },
  cardTypeTag: {
    position: 'absolute', top: 5, right: 7,
    fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-light)',
    letterSpacing: '0.04em',
  },
  matchedCheck: {
    position: 'absolute', top: 4, left: 7,
    fontSize: '0.75rem', fontWeight: 900, color: 'var(--correct-text)',
  },
  encouragement: {
    textAlign: 'center', fontSize: '0.82rem', fontWeight: 700,
    color: 'var(--text-light)', fontStyle: 'italic', marginTop: 4,
  },

  // results
  resultsWrap: { display: 'flex', justifyContent: 'center', padding: '20px 0 80px', paddingBottom: 90 },
  resultsCard: {
    textAlign: 'center', padding: '36px 26px', maxWidth: 420, width: '100%',
    position: 'relative', overflow: 'hidden',
  },
  resultsCardTablet: {
    maxWidth: 560,
    padding: '42px 34px',
  },
  resultsTitle: {
    fontSize: '1.4rem', fontWeight: 900, marginBottom: 20,
  },
  resultsStats: {
    display: 'flex', justifyContent: 'center', gap: 0,
    flexWrap: 'wrap', marginBottom: 16,
  },
  resultsStat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '0 16px',
  },
  resultsStatNum: { fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' },
  resultsStatLabel: {
    fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'lowercase',
  },
  effBar: {
    height: 8, borderRadius: 50, background: 'var(--tint-strong)',
    overflow: 'hidden', marginBottom: 6,
  },
  effBarFill: {
    height: '100%', borderRadius: 50,
    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
  },
  xpBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 18px', borderRadius: 50,
    background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.08))',
    border: '1.5px solid rgba(251,191,36,0.35)',
    margin: '12px auto 0',
    fontSize: '0.9rem',
  },
  newBest: {
    fontSize: '0.88rem', fontWeight: 800, color: 'var(--gold-text)',
    textAlign: 'center', marginTop: 10,
  },
}
