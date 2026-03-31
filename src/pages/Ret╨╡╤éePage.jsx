import { useState } from 'react'
import { RECIPES } from '../data/mock'
import GlassPanel from '../components/GlassPanel'
import GoldButton from '../components/GoldButton'

function RecipeCard({ r, onClick }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onClick={() => onClick(r)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      data-cursor
      className="relative overflow-hidden rounded-[24px] cursor-none transition-all duration-300"
      style={{
        background: hov
          ? `linear-gradient(160deg, ${r.color}18 0%, rgba(253,246,236,0.04) 100%)`
          : 'rgba(253,246,236,0.04)',
        backdropFilter: 'blur(28px)',
        border: `1px solid ${hov ? r.color + '55' : r.color + '20'}`,
        transform: hov ? 'translateY(-5px) scale(1.01)' : 'none',
        boxShadow: hov
          ? `0 24px 60px rgba(0,0,0,0.5), 0 0 60px ${r.color}20`
          : '0 6px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${r.color}${hov ? 'CC' : '40'}, transparent)` }} />

      {/* Image */}
      <div className="h-[180px] overflow-hidden">
        <img
          src={r.image}
          alt={r.name}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: hov ? 'scale(1.06)' : 'scale(1)', filter: 'brightness(0.75) saturate(0.9)' }}
        />
        {/* Tag */}
        <div className="absolute top-[14px] right-[14px] text-[8px] tracking-[0.25em] px-[12px] py-[3px] rounded-full"
          style={{
            color: r.color,
            background: `${r.color}18`,
            border: `1px solid ${r.color}35`,
            fontFamily: 'Jost, sans-serif',
          }}>
          {r.tag}
        </div>
      </div>

      <div className="p-[22px] pt-[18px]">
        <h3 className="font-cormorant italic font-bold text-[19px] text-cream leading-[1.2] mb-[6px]"
          style={{ letterSpacing: '-0.01em', color: hov ? r.color : '#FDF6EC', transition: 'color 0.2s' }}>
          {r.name}
        </h3>
        <p className="text-[10px] leading-[1.6] mb-[16px]"
          style={{ color: 'rgba(253,246,236,0.35)', fontFamily: 'Jost, sans-serif' }}>
          {r.desc}
        </p>

        {/* Stats */}
        <div className="flex justify-between items-center">
          <div className="flex gap-[14px]">
            {[[r.time, 'min'], [r.cal, 'kcal']].map(([v, u], i) => (
              <div key={i}>
                <span className="font-cormorant italic font-bold text-[15px] text-cream">{v}</span>
                <span className="text-[9px] ml-[3px]"
                  style={{ color: 'rgba(253,246,236,0.25)', fontFamily: 'Jost, sans-serif' }}>{u}</span>
              </div>
            ))}
          </div>
          <div className="font-cormorant italic font-bold text-[22px] transition-all duration-200"
            style={{
              color: r.color,
              textShadow: hov ? `0 0 24px ${r.color}` : 'none',
            }}>
            {r.match}%
          </div>
        </div>
      </div>
    </div>
  )
}

function RecipeModal({ r, onClose }) {
  const [step, setStep] = useState(-1)
  const steps = [
    'Prepară mise en place — tot ingredientul la îndemână, cântărit.',
    'Urmărește temperatura cu atenție. Totul se schimbă la 2 grade.',
    'Asezonează în straturi — la început, la mijloc, la final.',
    'Lasă să se odihnească. Răbdarea este ingredientul secret.',
  ]

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      style={{ background: 'rgba(12,9,4,0.9)', backdropFilter: 'blur(40px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative overflow-hidden rounded-[32px] w-[min(660px,92vw)]"
        style={{
          background: 'linear-gradient(160deg, #16110A 0%, #0C0904 100%)',
          border: `1px solid ${r.color}35`,
          boxShadow: `0 0 0 1px rgba(253,246,236,0.04), 0 60px 120px rgba(0,0,0,0.9), 0 0 120px ${r.color}18`,
        }}
      >
        {/* Gradient wash */}
        <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
          style={{ background: `linear-gradient(180deg, ${r.color}12 0%, transparent 100%)` }} />
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${r.color}, transparent)` }} />

        <div className="relative z-10 p-[44px]">
          <div className="flex justify-between items-start mb-[28px]">
            <div className="flex-1">
              <div className="text-[9px] tracking-[0.3em] mb-[12px]"
                style={{ color: r.color, fontFamily: 'Jost, sans-serif' }}>{r.tag}</div>
              <h1 className="font-cormorant italic font-bold text-cream leading-[1.05] mb-[10px]"
                style={{ fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.02em' }}>{r.name}</h1>
              <p className="text-[12px] leading-[1.7]"
                style={{ color: 'rgba(253,246,236,0.4)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>{r.desc}</p>
            </div>
            <div className="text-center ml-[24px] flex-shrink-0">
              <div className="text-[56px]" style={{ filter: `drop-shadow(0 0 24px ${r.color})` }}>{r.emoji}</div>
              <div className="font-cormorant italic font-bold text-[34px]"
                style={{ color: r.color, textShadow: `0 0 30px ${r.color}` }}>{r.match}%</div>
              <div className="text-[8px] tracking-[0.2em]"
                style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>AI MATCH</div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 rounded-[16px] overflow-hidden mb-[28px]"
            style={{ background: 'rgba(253,246,236,0.04)', border: `1px solid ${r.color}18` }}>
            {[['TIMP', `${r.time} min`], ['CALORII', `${r.cal} kcal`], ['PORȚII', '2–4']].map(([l, v], i) => (
              <div key={i} className="py-[18px] text-center"
                style={{ borderRight: i < 2 ? `1px solid ${r.color}12` : 'none' }}>
                <div className="text-[8px] tracking-[0.22em] mb-[8px]"
                  style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>{l}</div>
                <div className="font-cormorant italic font-bold text-[20px]" style={{ color: r.color }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="text-[9px] tracking-[0.28em] mb-[14px]"
            style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>TEHNICA DE PREPARARE</div>
          <div className="flex flex-col gap-[8px]">
            {steps.map((s, i) => (
              <div key={i} onClick={() => setStep(step === i ? -1 : i)}
                data-cursor
                className="flex gap-[14px] items-center px-[18px] py-[14px] rounded-[14px] cursor-none transition-all duration-200"
                style={{
                  background: step === i ? `${r.color}14` : 'rgba(253,246,236,0.03)',
                  border: `1px solid ${step === i ? r.color + '40' : 'rgba(253,246,236,0.06)'}`,
                  boxShadow: step === i ? `0 0 20px ${r.color}15` : 'none',
                }}>
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold transition-all duration-200"
                  style={{
                    background: step === i ? `linear-gradient(135deg, ${r.color}, #E8D5A3)` : 'rgba(253,246,236,0.06)',
                    border: `1px solid ${step === i ? r.color : 'rgba(253,246,236,0.1)'}`,
                    color: step === i ? '#1A1208' : 'rgba(253,246,236,0.25)',
                    boxShadow: step === i ? `0 0 16px ${r.color}60` : 'none',
                    fontFamily: 'Jost, sans-serif',
                  }}>{i + 1}</div>
                <span className="text-[13px] leading-[1.55] transition-colors duration-200"
                  style={{
                    color: step === i ? '#FDF6EC' : 'rgba(253,246,236,0.4)',
                    fontFamily: 'Jost, sans-serif', fontWeight: 300,
                  }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onClose} data-cursor
          className="absolute top-[20px] right-[20px] w-8 h-8 rounded-full flex items-center justify-center cursor-none transition-all duration-200"
          style={{ background: 'rgba(253,246,236,0.06)', border: '1px solid rgba(253,246,236,0.1)', color: 'rgba(253,246,236,0.4)', fontSize: 14 }}>
          ✕
        </button>
      </div>
    </div>
  )
}

export default function RetетePage() {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const filtered = RECIPES.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    r.desc.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="relative z-10 h-full overflow-auto px-[52px] pt-[100px] pb-[80px]">
      {/* Search + Add */}
      <div className="flex gap-[14px] mb-[28px]">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Caută după ingredient, timp, ocazie..."
            className="w-full rounded-full px-[24px] py-[14px] text-[13px] text-cream outline-none transition-all duration-200 cursor-none"
            style={{
              background: 'rgba(253,246,236,0.04)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(201,169,110,0.2)',
              fontFamily: 'Jost, sans-serif', fontWeight: 300,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(201,169,110,0.2)'}
          />
          <span className="absolute right-[20px] top-1/2 -translate-y-1/2 text-[14px]"
            style={{ color: 'rgba(253,246,236,0.2)' }}>✦</span>
        </div>
        <GoldButton>+ Rețetă nouă</GoldButton>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-[16px]">
        {filtered.map(r => <RecipeCard key={r.id} r={r} onClick={setSelected} />)}
      </div>

      {selected && <RecipeModal r={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
