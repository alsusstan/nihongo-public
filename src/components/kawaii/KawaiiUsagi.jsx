// My Melody-inspired bunny
export default function KawaiiUsagi({ size = 80, color = '#f9a8d4' }) {
  const s = size / 80
  return (
    <svg width={80 * s} height={90 * s} viewBox="0 0 80 90" fill="none" aria-hidden="true">
      {/* left ear */}
      <ellipse cx="28" cy="18" rx="8" ry="20" fill={color} />
      <ellipse cx="28" cy="18" rx="5" ry="16" fill="#fff5f7" />
      {/* right ear */}
      <ellipse cx="52" cy="18" rx="8" ry="20" fill={color} />
      <ellipse cx="52" cy="18" rx="5" ry="16" fill="#fff5f7" />
      {/* hood / head */}
      <circle cx="40" cy="50" r="24" fill={color} />
      {/* face */}
      <circle cx="40" cy="53" r="18" fill="white" />
      {/* eyes */}
      <ellipse cx="34" cy="50" rx="2.5" ry="3" fill="#4a1942" />
      <ellipse cx="46" cy="50" rx="2.5" ry="3" fill="#4a1942" />
      {/* eye shine */}
      <circle cx="35" cy="49" r="1" fill="white" />
      <circle cx="47" cy="49" r="1" fill="white" />
      {/* nose */}
      <ellipse cx="40" cy="55" rx="1.8" ry="1.3" fill="#f472b6" />
      {/* mouth */}
      <path d="M37 57 Q38 59 40 58" stroke="#4a1942" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M40 58 Q42 59 43 57" stroke="#4a1942" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* blush */}
      <ellipse cx="28" cy="55" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="52" cy="55" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.5" />
      {/* flower on hood */}
      <circle cx="26" cy="38" r="4" fill="#ec4899" />
      <circle cx="26" cy="38" r="2" fill="#fce7f3" />
    </svg>
  )
}
