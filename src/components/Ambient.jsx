export default function Ambient() {
  return (
    <>
      {/* Film grain */}
      <div id="grain" />

      {/* Scan line */}
      <div id="scan" />

      {/* Ambient orbs */}
      <div
        className="fixed rounded-full pointer-events-none z-[2] animate-orb1"
        style={{
          width: 560, height: 560,
          top: '-14%', right: '-9%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.09) 0%, transparent 65%)',
        }}
      />
      <div
        className="fixed rounded-full pointer-events-none z-[2] animate-orb2"
        style={{
          width: 380, height: 380,
          bottom: '-9%', left: '-6%',
          background: 'radial-gradient(circle, rgba(196,120,138,0.065) 0%, transparent 65%)',
        }}
      />
    </>
  )
}
