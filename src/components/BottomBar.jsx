const MEALS = [
  { id: 'mic_dejun', label: 'Mic dejun', icon: '🥐' },
  { id: 'pranz',     label: 'Prânz',     icon: '🥗' },
  { id: 'cina',      label: 'Cină',      icon: '🍝' },
  { id: 'toata_ziua',label: 'Toată ziua',icon: '✦'  },
]

export default function BottomBar({ activeFilters, onToggleFilter, activePage }) {
  // Pe pagina Hero, bara de filtre este integrată direct în HeroPage
  if (activePage === 'hero') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center h-[60px]"
      style={{ background:'linear-gradient(0deg,rgba(3,1,0,0.98) 0%,rgba(3,1,0,0.82) 100%)', borderTop:'1px solid rgba(201,169,110,0.08)', backdropFilter:'blur(32px)', paddingLeft:52, paddingRight:52, gap:6 }}>
      {MEALS.map(m => {
        const active = activeFilters ? activeFilters.has(m.id) : false
        return (
          <button key={m.id} onClick={() => onToggleFilter && onToggleFilter(m.id)} data-cursor
            className="cursor-none flex items-center gap-[9px] transition-all duration-300"
            style={{ padding:'7px 18px', borderRadius:99, background:active?'linear-gradient(135deg,rgba(201,169,110,0.16),rgba(201,169,110,0.06))':'rgba(253,246,236,0.02)', border:`1px solid ${active?'rgba(201,169,110,0.42)':'rgba(253,246,236,0.07)'}`, color:active?'#D4B87A':'rgba(253,246,236,0.22)', fontFamily:'Jost,sans-serif', fontSize:10, letterSpacing:'0.18em', transform:active?'translateY(-1px)':'none', boxShadow:active?'0 0 20px rgba(201,169,110,0.14),inset 0 1px 0 rgba(201,169,110,0.12)':'none' }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background:active?'rgba(201,169,110,0.18)':'rgba(253,246,236,0.04)', border:`1px solid ${active?'rgba(201,169,110,0.45)':'rgba(253,246,236,0.07)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0, boxShadow:active?'0 0 10px rgba(201,169,110,0.25)':'none', transition:'all 0.3s ease' }}>
              {m.icon}
            </div>
            <span>{m.label}</span>
            {active && <span style={{ width:3, height:3, borderRadius:'50%', background:'#C9A96E', boxShadow:'0 0 7px rgba(201,169,110,0.95)', flexShrink:0 }}/>}
          </button>
        )
      })}
      <div style={{ flex:1 }}/>
      <div style={{ fontFamily:'Jost,sans-serif', fontSize:8, letterSpacing:'0.35em', color:'rgba(201,169,110,0.25)' }}>
        {activeFilters && activeFilters.size < 4 ? `${activeFilters.size} FILTRU` : 'TOATE'}
      </div>
    </div>
  )
}