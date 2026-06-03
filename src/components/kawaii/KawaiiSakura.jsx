export default function KawaiiSakura({ size = 80, color = '#f9a8d4' }) {
  const s = size / 80
  return (
    <svg width={80 * s} height={80 * s} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* 5 petals */}
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="40"
          cy="24"
          rx="10"
          ry="16"
          fill={color}
          opacity="0.85"
          transform={`rotate(${angle} 40 40)`}
        />
      ))}
      {/* center */}
      <circle cx="40" cy="40" r="8" fill="#fff5f7" />
      {/* eyes */}
      <circle cx="37" cy="39" r="1.5" fill="#4a1942" />
      <circle cx="43" cy="39" r="1.5" fill="#4a1942" />
      {/* mouth */}
      <path d="M38 42 Q40 44 42 42" stroke="#4a1942" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* blush */}
      <ellipse cx="34" cy="42" rx="2.5" ry="1.5" fill="#ec4899" opacity="0.4" />
      <ellipse cx="46" cy="42" rx="2.5" ry="1.5" fill="#ec4899" opacity="0.4" />
    </svg>
  )
}
