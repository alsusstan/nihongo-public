export default function KawaiiNeko({ size = 80, color = '#f9a8d4' }) {
  const s = size / 80
  return (
    <svg width={80 * s} height={80 * s} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* left ear */}
      <path d="M18 30 L24 10 L34 26Z" fill={color} />
      <path d="M21 28 L25 14 L31 25Z" fill="#fff5f7" />
      {/* right ear */}
      <path d="M62 30 L56 10 L46 26Z" fill={color} />
      <path d="M59 28 L55 14 L49 25Z" fill="#fff5f7" />
      {/* head */}
      <circle cx="40" cy="42" r="22" fill={color} />
      {/* face area */}
      <ellipse cx="40" cy="46" rx="16" ry="13" fill="white" />
      {/* eyes */}
      <ellipse cx="33" cy="40" rx="3" ry="3.5" fill="#4a1942" />
      <ellipse cx="47" cy="40" rx="3" ry="3.5" fill="#4a1942" />
      {/* eye shine */}
      <circle cx="34" cy="39" r="1.2" fill="white" />
      <circle cx="48" cy="39" r="1.2" fill="white" />
      {/* nose */}
      <ellipse cx="40" cy="45" rx="2" ry="1.5" fill="#f472b6" />
      {/* mouth */}
      <path d="M36 47 Q38 50 40 48" stroke="#4a1942" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M40 48 Q42 50 44 47" stroke="#4a1942" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* whiskers */}
      <line x1="12" y1="42" x2="28" y2="44" stroke="#d8b4fe" strokeWidth="1" opacity="0.6" />
      <line x1="12" y1="48" x2="28" y2="47" stroke="#d8b4fe" strokeWidth="1" opacity="0.6" />
      <line x1="68" y1="42" x2="52" y2="44" stroke="#d8b4fe" strokeWidth="1" opacity="0.6" />
      <line x1="68" y1="48" x2="52" y2="47" stroke="#d8b4fe" strokeWidth="1" opacity="0.6" />
      {/* blush */}
      <ellipse cx="27" cy="46" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="53" cy="46" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.5" />
    </svg>
  )
}
