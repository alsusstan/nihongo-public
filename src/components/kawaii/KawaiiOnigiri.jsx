export default function KawaiiOnigiri({ size = 80 }) {
  const s = size / 80
  return (
    <svg width={80 * s} height={80 * s} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* rice body */}
      <path
        d="M40 8 C20 8, 8 35, 12 55 C14 65, 25 72, 40 72 C55 72, 66 65, 68 55 C72 35, 60 8, 40 8Z"
        fill="white"
        stroke="#e8e8e8"
        strokeWidth="1"
      />
      {/* nori (seaweed) */}
      <rect x="24" y="48" width="32" height="18" rx="3" fill="#2d2d2d" />
      {/* eyes */}
      <circle cx="32" cy="38" r="2.5" fill="#2d2d2d" />
      <circle cx="48" cy="38" r="2.5" fill="#2d2d2d" />
      {/* eye shine */}
      <circle cx="33" cy="37" r="1" fill="white" />
      <circle cx="49" cy="37" r="1" fill="white" />
      {/* blush */}
      <ellipse cx="26" cy="42" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.6" />
      <ellipse cx="54" cy="42" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.6" />
      {/* mouth */}
      <path d="M37 43 Q40 46 43 43" stroke="#2d2d2d" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}
