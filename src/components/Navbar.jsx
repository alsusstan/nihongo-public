import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'
import { getStoredJson } from '../utils/localSettings'

const prefersReducedMotion = getPrefersReducedMotion()

function getWeakCount() {
  const parsed = getStoredJson('nihongo-difficult-words', [])
  return Array.isArray(parsed) ? parsed.length : 0
}

const mainItems = [
  { path: '/', label: 'home', icon: '🏠' },
  { path: '/lessons', label: 'lessons', icon: '📚' },
  { path: '/quiz/vocab', label: 'vocab', icon: '✨' },
  { path: '/homework', label: 'homework', icon: '📝' },
  { path: '/quiz/kanji', label: 'kanji', icon: '漢' },
]

const moreCategories = [
  {
    label: 'Tools',
    items: [
      { path: '/settings', label: 'settings', icon: '⚙️' },
      { path: '/stats', label: 'stats', icon: '📈' },
      { path: '/mistakes', label: 'errors', icon: '📋' },
      { path: '/materials', label: 'учебники', icon: '📚' },
      { path: '/guide', label: 'guide', icon: '🌸' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { path: '/quiz-hub', label: 'quiz hub', icon: '🎯' },
      { path: '/daily', label: 'daily', icon: '🌅' },
      { path: '/quiz/grammar', label: 'grammar', icon: '文' },
      { path: '/quiz/te-form', label: 'te-form', icon: '🔄' },
      { path: '/quiz/particles', label: 'particles', icon: '助' },
      { path: '/quiz/fill-in', label: 'fill-in', icon: '✏️' },
      { path: '/quiz/adjectives', label: 'adj', icon: '形' },
      { path: '/quiz/numbers', label: 'numbers', icon: '🔢' },
      { path: '/quiz/counters', label: 'counters', icon: '数' },
      { path: '/quiz/n5', label: 'N5 quiz', icon: '🏅' },
      { path: '/quiz/conjugation', label: 'conj quiz', icon: '🔀' },
      { path: '/quiz/kana', label: 'kana quiz', icon: 'あ' },
      { path: '/quiz/sentences', label: 'build', icon: '🧩' },
      { path: '/quiz/weak', label: 'sprint', icon: '🎯' },
    ],
  },
  {
    label: 'Study',
    items: [
      { path: '/review', label: 'cards', icon: '🃏' },
      { path: '/kanji', label: 'kanji', icon: '📖' },
      { path: '/kanji/practice', label: 'write', icon: '✍️' },
      { path: '/kana', label: 'kana', icon: 'ア' },
      { path: '/reading', label: 'read', icon: '📰' },
      { path: '/kana-chart', label: 'chart', icon: '📊' },
      { path: '/conjugation', label: 'verbs', icon: '📐' },
      { path: '/grammar', label: 'explore', icon: '📜' },
      { path: '/search', label: 'search', icon: '🔍' },
    ],
  },
  {
    label: 'Play',
    items: [
      { path: '/game/matching', label: 'match', icon: '🎮' },
      { path: '/game/typing', label: 'typing', icon: '⌨️' },
    ],
  },
]

const moreItems = moreCategories.flatMap(c => c.items)

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)
  const moreRef = useRef(null)

  // close menu when clicking outside
  useEffect(() => {
    if (!showMore) return
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMore(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [showMore])

  // close menu on navigation
  useEffect(() => {
    setShowMore(false)
  }, [location.pathname])

  const [weakCount, setWeakCount] = useState(getWeakCount)
  useEffect(() => { setWeakCount(getWeakCount()) }, [location.pathname])

  const isMoreActive = moreItems.some(item => location.pathname.startsWith(item.path))
  const handleBack = () => {
    if ((window.history.state?.idx || 0) > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const renderLink = (item, compact = false) => {
    const isActive = item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path)
    const showBadge = item.path === '/mistakes' && weakCount > 0
    return (
      <Link
        key={item.path}
        to={item.path}
        className={isActive ? '' : 'nav-link'}
        style={{
          ...(compact ? styles.moreLink : styles.link),
          ...(isActive ? styles.active : {}),
          ...(isActive && !compact ? styles.activeScale : {}),
        }}
      >
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={compact ? styles.moreIcon : styles.icon}>{item.icon}</span>
          {showBadge && (
            <span style={styles.badge}>{weakCount > 99 ? '99+' : weakCount}</span>
          )}
        </span>
        <span style={{ ...styles.label, ...(isActive && !compact ? styles.activeLabel : {}) }}>{item.label}</span>
        {isActive && !compact && <span style={styles.activeDot} />}
      </Link>
    )
  }

  const isHome = location.pathname === '/'

  return (
    <div ref={moreRef}>
      {/* back button — shows on all non-home pages */}
      {!isHome && (
        <button
          onClick={handleBack}
          style={styles.backBtn}
          aria-label="go back"
        >
          ←
        </button>
      )}
      {/* expanded more menu */}
      {showMore && (
        <div style={styles.moreMenu} className="glass animate-pop stagger-children">
          {moreCategories.map(cat => (
            <div key={cat.label} style={styles.moreSection}>
              <div style={styles.moreCatLabel}>{cat.label}</div>
              <div style={styles.moreCatGrid}>
                {cat.items.map(item => renderLink(item, true))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* main nav bar */}
      <nav style={styles.nav} className="glass bottom-nav" aria-label="Main navigation">
        {mainItems.map(item => renderLink(item))}
        <button
          onClick={() => setShowMore(prev => !prev)}
          aria-label={showMore ? 'close menu' : 'more navigation'}
          aria-expanded={showMore}
          className={showMore || isMoreActive ? '' : 'nav-link'}
          style={{
            ...styles.link,
            ...styles.moreBtn,
            ...(showMore || isMoreActive ? styles.active : {}),
            ...(showMore || isMoreActive ? styles.activeScale : {}),
          }}
        >
          <span style={{
            ...styles.icon,
            transition: prefersReducedMotion ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: !prefersReducedMotion && showMore ? 'rotate(135deg) scale(0.85)' : 'rotate(0deg)',
            display: 'inline-block',
          }}>{showMore ? '✕' : '•••'}</span>
          <span style={{ ...styles.label, ...(showMore || isMoreActive ? styles.activeLabel : {}) }}>more</span>
          {(showMore || isMoreActive) && <span style={styles.activeDot} />}
        </button>
      </nav>
    </div>
  )
}

const styles = {
  backBtn: {
    position: 'fixed',
    top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
    left: 12,
    zIndex: 1001,
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: 'none',
    borderRadius: '50%',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.15rem',
    color: 'var(--text-main)',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(236,72,153,0.18), 0 0 0 1px rgba(192,132,252,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
    fontFamily: 'inherit',
  },
  nav: {
    position: 'fixed',
    bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 2,
    padding: '8px 10px',
    borderRadius: 50,
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(236, 72, 153, 0.18), 0 2px 8px rgba(0,0,0,0.06)',
  },
  moreMenu: {
    position: 'fixed',
    bottom: 'calc(94px + env(safe-area-inset-bottom, 0px))',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '14px 14px',
    borderRadius: 22,
    zIndex: 999,
    boxShadow: '0 12px 40px rgba(236, 72, 153, 0.22), 0 2px 8px rgba(0,0,0,0.08)',
    width: 'min(420px, 96vw)',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  moreSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  moreCatLabel: {
    fontSize: '0.72rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-light)',
    opacity: 0.65,
    paddingLeft: 4,
    paddingBottom: 2,
  },
  moreCatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
    gap: 4,
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '8px 10px',
    borderRadius: 18,
    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    minWidth: 62,
    minHeight: 52,
    justifyContent: 'center',
    position: 'relative',
  },
  moreLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '8px 6px',
    borderRadius: 12,
    transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    minWidth: 0,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 1.15,
  },
  moreBtn: {
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontFamily: 'inherit',
    position: 'relative',
  },
  active: {
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    color: 'white',
    boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  activeScale: {
    transform: 'scale(1.06)',
  },
  activeLabel: {
    fontWeight: 900,
    letterSpacing: '0.01em',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.75)',
    boxShadow: '0 0 4px rgba(255,255,255,0.5)',
  },
  icon: {
    fontSize: '1.45rem',
    lineHeight: 1,
  },
  moreIcon: {
    fontSize: '1.25rem',
    lineHeight: 1,
  },
  label: {
    lineHeight: 1,
    textTransform: 'lowercase',
    fontSize: '0.72rem',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 50,
    background: 'linear-gradient(135deg, #f43f5e, #f472b6)',
    color: 'white',
    fontSize: '0.58rem',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
    boxShadow: '0 2px 6px rgba(244,63,94,0.4)',
    lineHeight: 1,
    pointerEvents: 'none',
  },
}
