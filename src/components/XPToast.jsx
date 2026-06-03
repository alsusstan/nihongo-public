import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Global XP toast notification.
 * Listens for 'nihongo-xp-earned' custom events dispatched by useXP hook.
 */
export default function XPToast() {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef([])

  const addToast = useCallback((data) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, ...data }])
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
    timersRef.current.push(timer)
  }, [])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {}
      if (Number.isFinite(detail.amount) && detail.amount > 0) addToast(detail)
    }
    window.addEventListener('nihongo-xp-earned', handler)
    return () => window.removeEventListener('nihongo-xp-earned', handler)
  }, [addToast])

  // Also listen for achievement unlocks
  useEffect(() => {
    const handler = (e) => {
      const { badge } = e.detail || {}
      if (badge) {
        addToast({ achievement: true, icon: badge.icon, title: badge.title })
      }
    }
    window.addEventListener('nihongo-achievement', handler)
    return () => window.removeEventListener('nihongo-achievement', handler)
  }, [addToast])

  // Coin earned toasts
  useEffect(() => {
    const handler = (e) => {
      const { amount, source } = e.detail || {}
      if (Number.isFinite(amount) && amount > 0) addToast({ coins: true, amount, source })
    }
    window.addEventListener('nihongo-coins-earned', handler)
    return () => window.removeEventListener('nihongo-coins-earned', handler)
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div style={s.container} role="status" aria-live="polite" aria-atomic="false">
      {toasts.map(toast => (
        <div key={toast.id} style={toast.achievement ? s.achieveToast : toast.coins ? s.coinToast : s.toast} className="animate-bounceIn">
          {toast.achievement ? (
            <>
              <span style={{ fontSize: '1.1rem' }}>{toast.icon}</span>
              <span style={s.achieveText}>{toast.title}</span>
              <span style={s.achieveLabel}>unlocked!</span>
            </>
          ) : toast.coins ? (
            <>
              <span style={s.coinAmount}>🌸+{toast.amount}</span>
            </>
          ) : (
            <>
              <span style={s.xpAmount}>+{toast.amount} XP</span>
              {toast.combo >= 3 && (
                <span style={s.comboBadge}>{toast.comboMultiplier}x combo</span>
              )}
              {toast.comeback && (
                <span style={s.comebackBadge}>welcome back 2x!</span>
              )}
              {toast.leveledUp && (
                <span style={s.levelUp}>level {toast.newLevel}!</span>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

const s = {
  container: {
    position: 'fixed',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 2000,
    pointerEvents: 'none',
  },
  toast: {
    padding: '8px 20px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, #f472b6, #c084fc)',
    boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
  },
  xpAmount: {
    fontSize: '0.9rem',
    fontWeight: 900,
    color: 'white',
  },
  levelUp: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#fbbf24',
    textTransform: 'uppercase',
  },
  achieveToast: {
    padding: '8px 20px',
    borderRadius: 50,
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
  },
  achieveText: {
    fontSize: '0.85rem',
    fontWeight: 900,
    color: 'white',
  },
  achieveLabel: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.8)',
  },
  comboBadge: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#fbbf24',
    background: 'rgba(0,0,0,0.15)',
    padding: '2px 8px',
    borderRadius: 50,
  },
  comebackBadge: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#34d399',
    background: 'rgba(0,0,0,0.15)',
    padding: '2px 8px',
    borderRadius: 50,
  },
  coinToast: {
    padding: '6px 16px',
    borderRadius: 50,
    background: 'rgba(244,114,182,0.15)',
    border: '1.5px solid rgba(244,114,182,0.4)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  },
  coinAmount: {
    fontSize: '0.85rem',
    fontWeight: 900,
    color: '#f472b6',
  },
}
