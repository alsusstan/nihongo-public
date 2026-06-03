import { useState, useCallback, useEffect, useRef } from 'react'
import { copyTextToClipboard } from '../utils/clipboard'

/**
 * Shareable quiz result card.
 * Copies a nicely formatted text summary to clipboard.
 */
export default function ShareResult({ quizName, score, total, percentage, bestStreak, xpEarned }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleShare = useCallback(() => {
    const stars = percentage >= 90 ? '⭐⭐⭐' : percentage >= 70 ? '⭐⭐' : percentage >= 50 ? '⭐' : ''
    const bar = Array.from({ length: 10 }, (_, i) => i < Math.round(percentage / 10) ? '█' : '░').join('')

    let text = `🌸 nihongo app — ${quizName}\n`
    text += `${bar} ${percentage}% (${score}/${total})\n`
    if (stars) text += `${stars}\n`
    if (bestStreak >= 3) text += `🔥 best streak: ${bestStreak}x\n`
    if (xpEarned > 0) text += `⚡ +${xpEarned} XP\n`
    text += `\n日本語の勉強、がんばってます!`

    copyTextToClipboard(text).then((success) => {
      if (!success) return
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }, [quizName, score, total, percentage, bestStreak, xpEarned])

  return (
    <button onClick={handleShare} style={s.btn} className="glass-sm btn-hover" aria-label={copied ? 'result copied to clipboard' : 'copy result to clipboard'}>
      {copied ? 'copied!' : 'share'} {copied ? '✅' : '📋'}
    </button>
  )
}

const s = {
  btn: {
    padding: '8px 18px',
    borderRadius: 50,
    border: '1.5px solid rgba(192,132,252,0.5)',
    background: 'var(--tint)',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    minHeight: 44,
  },
}
