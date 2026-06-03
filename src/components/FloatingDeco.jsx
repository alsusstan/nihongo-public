import KawaiiNeko from './kawaii/KawaiiNeko'
import KawaiiSakura from './kawaii/KawaiiSakura'
import KawaiiOnigiri from './kawaii/KawaiiOnigiri'
import KawaiiStar from './kawaii/KawaiiStar'
import KawaiiUsagi from './kawaii/KawaiiUsagi'
import myMelody1 from '../assets/sanrio/my-melody-1.png'
import myMelody2 from '../assets/sanrio/my-melody-2.png'
import myMelody3 from '../assets/sanrio/my-melody-3.png'
import kuromi1 from '../assets/sanrio/kuromi-1.png'
import kuromi2 from '../assets/sanrio/kuromi-2.png'
import kuromi3 from '../assets/sanrio/kuromi-3.png'
import { prefersReducedMotion as getPrefersReducedMotion } from '../utils/motion'
import { useIsMobile } from '../hooks/useIsMobile'

// Home page: mix of kawaii SVGs + sanrio images
const homeSvgDecos = [
  { Component: KawaiiSakura, props: { size: 40, color: '#f9a8d4' }, top: '8%', left: '5%', delay: 0, duration: 6 },
  { Component: KawaiiStar, props: { size: 28, color: '#d8b4fe' }, top: '15%', right: '8%', delay: 1, duration: 5 },
  { Component: KawaiiUsagi, props: { size: 36, color: '#f9a8d4' }, top: '38%', left: '3%', delay: 2, duration: 7 },
  { Component: KawaiiNeko, props: { size: 38, color: '#c084fc' }, top: '52%', right: '4%', delay: 0.5, duration: 6.5 },
  { Component: KawaiiOnigiri, props: { size: 32 }, top: '68%', left: '6%', delay: 1.5, duration: 5.5 },
  { Component: KawaiiStar, props: { size: 24, color: '#fbbf24' }, top: '82%', right: '7%', delay: 3, duration: 8 },
]

const homeImgDecos = [
  { src: myMelody1, size: 55, top: '22%', left: '2%', delay: 0.5, duration: 7 },
  { src: kuromi2, size: 50, top: '42%', right: '2%', delay: 1.5, duration: 6 },
  { src: myMelody3, size: 45, top: '72%', right: '3%', delay: 2, duration: 8 },
  { src: kuromi3, size: 48, top: '88%', left: '3%', delay: 0, duration: 6.5 },
]

// Check once at module load — avoids hook-order issues
const prefersReducedMotion = getPrefersReducedMotion()

// Other pages: only My Melody & Kuromi
const melodyDecos = [
  { src: myMelody1, size: 48, top: '6%', left: '2%', delay: 0, duration: 7 },
  { src: myMelody2, size: 42, top: '18%', right: '3%', delay: 1.2, duration: 6.5 },
  { src: kuromi1, size: 44, top: '32%', left: '3%', delay: 0.5, duration: 8 },
  { src: myMelody3, size: 40, top: '45%', right: '2%', delay: 2, duration: 6 },
  { src: kuromi2, size: 46, top: '58%', left: '2%', delay: 1, duration: 7.5 },
  { src: myMelody1, size: 38, top: '70%', right: '3%', delay: 1.8, duration: 5.5 },
  { src: kuromi3, size: 42, top: '82%', left: '3%', delay: 0.3, duration: 7 },
  { src: myMelody2, size: 36, top: '92%', right: '4%', delay: 2.5, duration: 6.5 },
]

export default function FloatingDeco({ isHome = false }) {
  const isMobile = useIsMobile(480)
  if (prefersReducedMotion) return null
  const svgList = isMobile ? homeSvgDecos.slice(0, 3) : homeSvgDecos
  const imgList = isMobile
    ? (isHome ? homeImgDecos.slice(0, 2) : melodyDecos.slice(0, 3))
    : (isHome ? homeImgDecos : melodyDecos)
  const sizeScale = isMobile ? 0.72 : 1
  const opacityScale = isMobile ? 0.65 : 1

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {isHome && svgList.map((d, i) => (
        <div
          key={`svg-${i}`}
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            right: d.right,
            opacity: 0.15 * opacityScale,
            animation: `float ${d.duration}s ease-in-out ${d.delay}s infinite`,
            userSelect: 'none',
          }}
        >
          <d.Component {...d.props} size={Math.round((d.props.size || 32) * sizeScale)} />
        </div>
      ))}
      {imgList.map((d, i) => (
        <div
          key={`img-${i}`}
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            right: d.right,
            opacity: (isHome ? 0.12 : 0.1) * opacityScale,
            animation: `float ${d.duration}s ease-in-out ${d.delay}s infinite`,
            userSelect: 'none',
          }}
        >
          <img
            src={d.src}
            alt=""
            style={{
              width: `${Math.round(d.size * sizeScale)}px`,
              height: 'auto',
              filter: 'drop-shadow(0 2px 6px rgba(236,72,153,0.12))',
            }}
          />
        </div>
      ))}
    </div>
  )
}
