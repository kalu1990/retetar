import { MONTHLY_STATS, TOP_INGREDIENTS, AI_STATS } from '../data/mock'
import GlassPanel from '../components/GlassPanel'
import { usePageTracking } from '../hooks/useTelemetry'

export default function AnalyticsPage() {
  usePageTracking('analytics')
  const months = 'IFMAMIIASOND'.split('')

  return (
    <div className="relative z-10 h-full overflow-auto px-[52px] pt-[100px] pb-[80px]">
      <div className="grid grid-cols-2 gap-[16px]">

        {/* Bar chart */}
        <GlassPanel style={{ padding: '28px' }}>
          <div className="text-[9px] tracking-[0.22em] mb-[24px]"
            style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
            REȚETE GĂTITE / LUNĂ
          </div>
          <div className="flex items-end gap-[5px]" style={{ height: 130 }}>
            {MONTHLY_STATS.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-[5px] h-full">
                <div
                  className="w-full rounded-[3px_3px_0_0] transition-all duration-1000"
                  style={{
                    height: `${h}%`,
                    background: i === 11
                      ? 'linear-gradient(180deg, #D4B87A, #C9A96E)'
                      : `rgba(201,169,110,${0.1 + h / 400})`,
                    boxShadow: i === 11 ? '0 0 16px rgba(201,169,110,0.5)' : 'none',
                    transitionDelay: `${i * 0.04}s`,
                  }}
                />
                <span className="text-[8px]" style={{ color: 'rgba(253,246,236,0.15)' }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Top ingredients */}
        <GlassPanel style={{ padding: '28px' }}>
          <div className="text-[9px] tracking-[0.22em] mb-[24px]"
            style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
            TOP INGREDIENTE
          </div>
          {TOP_INGREDIENTS.map((x, i) => (
            <div key={i} className="mb-[16px]">
              <div className="flex justify-between mb-[6px]">
                <span className="text-[12px]"
                  style={{ color: 'rgba(253,246,236,0.6)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>
                  {x.name}
                </span>
                <span className="font-cormorant italic font-bold text-[13px]" style={{ color: x.color }}>
                  {x.pct}%
                </span>
              </div>
              <div className="h-[2px] rounded-[1px]" style={{ background: 'rgba(253,246,236,0.05)' }}>
                <div className="h-full rounded-[1px]"
                  style={{
                    width: `${x.pct}%`,
                    background: `linear-gradient(90deg, ${x.color}, ${x.color}60)`,
                    boxShadow: `0 0 8px ${x.color}70`,
                    transition: `width 1.2s cubic-bezier(.16,1,.3,1) ${i * 0.1}s`,
                  }} />
              </div>
            </div>
          ))}
        </GlassPanel>

        {/* AI Pipeline — full width */}
        <GlassPanel style={{ gridColumn: '1 / -1', padding: '24px 32px' }} glow>
          <div className="text-[9px] tracking-[0.22em] mb-[20px]"
            style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
            AI PIPELINE — STATISTICI
          </div>
          <div className="flex">
            {AI_STATS.map((s, i) => (
              <div key={i} className="flex-1 px-[28px] text-center"
                style={{ borderRight: i < AI_STATS.length - 1 ? '1px solid rgba(253,246,236,0.06)' : 'none' }}>
                <div className="text-[8px] tracking-[0.18em] mb-[10px]"
                  style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
                  {s.label}
                </div>
                <div className="font-cormorant italic font-bold text-[30px]"
                  style={{ color: s.color, textShadow: `0 0 20px ${s.color}40` }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
