const ORB_CONFIGS = [
  { id: 'orb1', animationClass: 'animate-orb1', size: 560, position: { top: '-14%', right: '-9%' }, gradientColor: 'rgba(201,169,110,0.09)' },
  { id: 'orb2', animationClass: 'animate-orb2', size: 380, position: { bottom: '-9%', left: '-6%' }, gradientColor: 'rgba(196,120,138,0.065)' },
]

function Orb({ animationClass, size, position, gradientColor }) {
  return (
    <div
      className={`fixed rounded-full pointer-events-none z-[2] ${animationClass}`}
      style={{
        width: size, height: size,
        ...position,
        background: `radial-gradient(circle, ${gradientColor} 0%, transparent 65%)`,
      }}
    />
  )
}

export default function Ambient() {
  return (
    <>
      <div id="grain" />
      <div id="scan" />
      {ORB_CONFIGS.map(orb => <Orb key={orb.id} {...orb} />)}
    </>
  )
}