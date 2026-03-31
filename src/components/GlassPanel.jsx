export default function GlassPanel({ children, className = '', accent = '#C9A96E', glow = false, style = {} }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] ${className}`}
      style={{
        background: 'linear-gradient(160deg, rgba(253,246,236,0.065) 0%, rgba(253,246,236,0.025) 100%)',
        backdropFilter: 'blur(32px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
        border: `1px solid ${accent}28`,
        boxShadow: glow
          ? `0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 ${accent}20, 0 0 80px ${accent}12`
          : `0 8px 48px rgba(0,0,0,0.35), inset 0 1px 0 ${accent}18`,
        ...style,
      }}
    >
      {/* Top shimmer */}
      <div
        className="absolute top-0 left-[5%] right-[5%] h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}70, ${accent}90, ${accent}70, transparent)` }}
      />
      {/* Corner glows */}
      <div className="absolute pointer-events-none" style={{ top:-30, right:-30, width:100, height:100,
        background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)` }} />
      <div className="absolute pointer-events-none" style={{ bottom:-30, left:-30, width:80, height:80,
        background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)` }} />

      {children}
    </div>
  )
}
