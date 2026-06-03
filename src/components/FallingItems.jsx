import { useState } from 'react'
import myMelody1 from '../assets/sanrio/my-melody-1.png'
import myMelody2 from '../assets/sanrio/my-melody-2.png'
import myMelody3 from '../assets/sanrio/my-melody-3.png'
import kuromi1 from '../assets/sanrio/kuromi-1.png'
import kuromi2 from '../assets/sanrio/kuromi-2.png'
import kuromi3 from '../assets/sanrio/kuromi-3.png'
import cinnamoroll1 from '../assets/sanrio/cinnamoroll-1.png'
import cinnamoroll2 from '../assets/sanrio/cinnamoroll-2.png'
import cinnamoroll3 from '../assets/sanrio/cinnamoroll-3.png'
import helloKitty1 from '../assets/sanrio/hello-kitty-1.png'
import helloKitty2 from '../assets/sanrio/hello-kitty-2.png'
import helloKitty3 from '../assets/sanrio/hello-kitty-3.png'
import pompompurin1 from '../assets/sanrio/pompompurin-1.png'
import pompompurin2 from '../assets/sanrio/pompompurin-2.png'
import pompompurin3 from '../assets/sanrio/pompompurin-3.png'
import keroppi1 from '../assets/sanrio/keroppi-1.png'
import keroppi2 from '../assets/sanrio/keroppi-2.png'
import keroppi3 from '../assets/sanrio/keroppi-3.png'
import littleTwinStars1 from '../assets/sanrio/little-twin-stars-1.png'
import littleTwinStars2 from '../assets/sanrio/little-twin-stars-2.png'
import littleTwinStars3 from '../assets/sanrio/little-twin-stars-3.png'
import pochacco1 from '../assets/sanrio/pochacco-1.png'
import pochacco2 from '../assets/sanrio/pochacco-2.png'
import pochacco3 from '../assets/sanrio/pochacco-3.png'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'

const emojis = ['🌸', '⭐', '🩷', '✨', '🎀', '🍡', '💮', '🌙', '🍥', '💜']
const sanrioImages = [
  myMelody1, myMelody2, myMelody3,
  kuromi1, kuromi2, kuromi3,
  cinnamoroll1, cinnamoroll2, cinnamoroll3,
  helloKitty1, helloKitty2, helloKitty3,
  pompompurin1, pompompurin2, pompompurin3,
  keroppi1, keroppi2, keroppi3,
  littleTwinStars1, littleTwinStars2, littleTwinStars3,
  pochacco1, pochacco2, pochacco3,
]

// Check once at module load — avoids hook-order issues
const prefersReducedMotion = getPrefersReducedMotion()

export default function FallingItems() {
  const [particles] = useState(() => {
    if (prefersReducedMotion) return []
    const items = []

    // emoji particles
    for (let i = 0; i < 14; i++) {
      items.push({
        id: i,
        type: 'emoji',
        content: emojis[i % emojis.length],
        left: `${(i * 7) + Math.random() * 3}%`,
        delay: `${Math.random() * 14}s`,
        duration: `${10 + Math.random() * 10}s`,
        size: 14 + Math.random() * 12,
        opacity: 0.15 + Math.random() * 0.12,
        swayAmount: 30 + Math.random() * 40,
      })
    }

    // sanrio image particles (pick 6 random images so all characters get a chance)
    const shuffled = [...sanrioImages].sort(() => Math.random() - 0.5)
    for (let i = 0; i < 6; i++) {
      items.push({
        id: 100 + i,
        type: 'image',
        content: shuffled[i],
        left: `${10 + (i * 15) + Math.random() * 5}%`,
        delay: `${2 + Math.random() * 12}s`,
        duration: `${14 + Math.random() * 10}s`,
        size: 32 + Math.random() * 20,
        opacity: 0.12 + Math.random() * 0.08,
        swayAmount: 20 + Math.random() * 30,
      })
    }

    return items
  })

  if (prefersReducedMotion) return null

  return (
    <>
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-5vh) translateX(0px) rotate(0deg);
            opacity: var(--particle-opacity);
          }
          25% {
            transform: translateY(25vh) translateX(calc(var(--sway) * 1px)) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(calc(var(--sway) * -0.5px)) rotate(180deg);
          }
          75% {
            transform: translateY(75vh) translateX(calc(var(--sway) * 0.8px)) rotate(270deg);
          }
          100% {
            transform: translateY(105vh) translateX(0px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes fallSoft {
          0% {
            transform: translateY(-5vh) translateX(0px) rotate(-5deg);
            opacity: var(--particle-opacity);
          }
          25% {
            transform: translateY(25vh) translateX(calc(var(--sway) * 1px)) rotate(5deg);
          }
          50% {
            transform: translateY(50vh) translateX(calc(var(--sway) * -0.5px)) rotate(-3deg);
          }
          75% {
            transform: translateY(75vh) translateX(calc(var(--sway) * 0.8px)) rotate(4deg);
          }
          100% {
            transform: translateY(105vh) translateX(0px) rotate(-2deg);
            opacity: 0;
          }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}>
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.left,
              top: '-40px',
              fontSize: p.type === 'emoji' ? `${p.size}px` : undefined,
              opacity: p.opacity,
              '--particle-opacity': p.opacity,
              '--sway': p.swayAmount,
              animation: `${p.type === 'image' ? 'fallSoft' : 'fall'} ${p.duration} ${p.delay} linear infinite`,
              userSelect: 'none',
            }}
          >
            {p.type === 'emoji' ? (
              p.content
            ) : (
              <img
                src={p.content}
                alt=""
                style={{
                  width: `${p.size}px`,
                  height: 'auto',
                  filter: 'drop-shadow(0 2px 4px rgba(236,72,153,0.15))',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </>
  )
}
