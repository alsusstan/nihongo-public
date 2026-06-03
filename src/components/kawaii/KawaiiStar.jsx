export default function KawaiiStar({ size = 80, color = '#d8b4fe' }) {
  const s = size / 80
  return (
    <svg width={80 * s} height={80 * s} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* star body */}
      <path
        d="M40 6 L47 28 L70 28 L52 42 L58 64 L40 52 L22 64 L28 42 L10 28 L33 28Z"
        fill={color}
      />
      {/* eyes */}
      <circle cx="34" cy="36" r="2.5" fill="#4a1942" />
      <circle cx="46" cy="36" r="2.5" fill="#4a1942" />
      {/* eye shine */}
      <circle cx="35" cy="35" r="1" fill="white" />
      <circle cx="47" cy="35" r="1" fill="white" />
      {/* blush */}
      <ellipse cx="29" cy="40" rx="3.5" ry="2" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="51" cy="40" rx="3.5" ry="2" fill="#f9a8d4" opacity="0.5" />
      {/* mouth */}
      <path d="M37 41 Q40 44 43 41" stroke="#4a1942" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}
