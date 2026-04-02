import { useState, useEffect, useRef } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'
import { loadInspiratieFirestore, stergeRetetaFirebase } from '../firebase'

const API = 'http://localhost:8000'
function formatTime(min) {
  if (!min || min <= 0) return { value: '', unit: '' }
  if (min < 60) return { value: `${min}`, unit: 'min' }
  const h = Math.floor(min / 60)
  const m = min % 60
  return { value: m > 0 ? `${h}h ${m}'` : `${h}h`, unit: '' }
}
const FILTERS = [
  { id: 'mic_dejun', label: 'Mic dejun', icon: '☀️' },
  { id: 'pranz',     label: 'Prânz',     icon: '🌤️' },
  { id: 'cina',      label: 'Cină',      icon: '🌙' },
  { id: 'toata_ziua',label: 'Toată ziua',icon: '✦'  },
]
const DIFFICULTY = { usor: 'Ușor', mediu: 'Mediu', greu: 'Greu', easy: 'Ușor' }
const getToken = () => localStorage.getItem('auth_token') || ''

export default function HeroPage({ auth, onNavigate, activeFilters, onToggleFilter }) {
  usePageTracking('hero')
  const [recipes, setRecipes]         = useState([])
  const [idx, setIdx]                 = useState(0)
  const [favorites, setFavorites]     = useState(new Set())
  const [favAnim, setFavAnim]         = useState(false)
  const [visible, setVisible]         = useState(true)
  const [phase, setPhase]             = useState('idle')
  const [dir, setDir]                 = useState('next')
  const [transType, setTransType]     = useState('cortina')
  const [showRecipe, setShowRecipe]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const stergeRetetaCurenta = async () => {
    if (!r?.id) return
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return }
    await stergeRetetaFirebase(r.id)
    setConfirmDelete(false)
    const fresh = await loadInspiratieFirestore()
    setRecipes(fresh)
  }

  const lastTransRef                  = useRef('')
  const filteredRef                   = useRef([])
  const idxRef                        = useRef(0)
  const phaseRef                      = useRef('idle')

  useEffect(() => { load(); loadFav() }, [])

  const load = async () => {
    try {
      // Incarca din Firebase (vizibil pentru toti utilizatorii)
      const fbRecipes = await loadInspiratieFirestore()
      if (fbRecipes && fbRecipes.length > 0) {
        setRecipes(fbRecipes)
        return
      }
    } catch {}
    // Fallback la API local daca Firebase nu e disponibil
    try {
      const d = await fetch(`${API}/api/recipes?public_only=1&token=${getToken()}`).then(r => r.json())
      setRecipes(Array.isArray(d) ? d : [])
    } catch {}
  }
  const loadFav = async () => {
    try {
      const d = await fetch(`${API}/api/favorites/ids?token=${getToken()}`).then(r => r.json())
      setFavorites(new Set(Array.isArray(d) ? d : []))
    } catch {}
  }

  const TRANS_TYPES = ['cortina','iris','flash_blanc','velvet','gold_veil',
    'shutter','zoom_vortex','burn','split','breath','noir']

  const goDir = (n, direction = 'next') => {
    if (phaseRef.current !== 'idle') return
    const pool = TRANS_TYPES.filter(t => t !== lastTransRef.current)
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    lastTransRef.current = chosen
    const OUT_DUR = { cortina:420, iris:480, flash_blanc:160, velvet:580, gold_veil:400,
                      shutter:360, zoom_vortex:420, burn:460, split:380, breath:540, noir:500 }
    const IN_WAIT = OUT_DUR[chosen] || 420
    const IN_DUR = { cortina:1100, iris:1200, flash_blanc:800, velvet:1500, gold_veil:1100,
                     shutter:1000, zoom_vortex:1250, burn:1100, split:1050, breath:1400, noir:1150 }
    const totalLock = IN_WAIT + (IN_DUR[chosen] || 1100)
    phaseRef.current = 'out'
    setPhase('out'); setDir(direction); setTransType(chosen); setVisible(false)
    setTimeout(() => { setIdx(n); idxRef.current = n; setPhase('in'); setVisible(true) }, IN_WAIT)
    setTimeout(() => { phaseRef.current = 'idle'; setPhase('idle') }, totalLock)
  }
  const go = n => goDir(n, 'next')

  const toggleFilter = id => { onToggleFilter && onToggleFilter(id); go(0) }

  const filtered = recipes.filter(r => (activeFilters || new Set()).has(r.category || 'toata_ziua'))
  useEffect(() => { filteredRef.current = filtered }, [filtered])
  useEffect(() => { idxRef.current = idx }, [idx])
  useEffect(() => { if (filtered.length > 0 && idx >= filtered.length) setIdx(0) }, [filtered.length])
  useEffect(() => {
    if (filtered.length <= 1 || showRecipe) return
    const t = setInterval(() => go((idxRef.current + 1) % filteredRef.current.length), 9000)
    return () => clearInterval(t)
  }, [filtered.length, showRecipe])

  // Scroll
  useEffect(() => {
    let cooldown = false
    const onWheel = (e) => {
      if (showRecipe) return
      const len = filteredRef.current.length
      if (len <= 1) return
      if (cooldown || phaseRef.current !== 'idle') return
      const direction = e.deltaY > 0 ? 'next' : 'prev'
      const next = direction === 'next'
        ? (idxRef.current + 1) % len
        : (idxRef.current - 1 + len) % len
      cooldown = true
      goDir(next, direction)
      const waitIdle = setInterval(() => {
        if (phaseRef.current === 'idle') { cooldown = false; clearInterval(waitIdle) }
      }, 80)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [showRecipe])

  // Taste
  useEffect(() => {
    const onKey = (e) => {
      if (showRecipe) { if (e.key === 'Escape') setShowRecipe(false); return }
      const len = filteredRef.current.length
      if (len <= 1) return
      if (e.key === 'ArrowDown') { e.preventDefault(); goDir((idxRef.current + 1) % len, 'next') }
      else if (e.key === 'ArrowUp') { e.preventDefault(); goDir((idxRef.current - 1 + len) % len, 'prev') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showRecipe])

  const toggleFav = async id => {
    const isFav = favorites.has(id)
    setFavAnim(true); setTimeout(() => setFavAnim(false), 600)
    if (isFav) {
      setFavorites(p => { const s = new Set(p); s.delete(id); return s })
      await fetch(`${API}/api/favorites/${id}?token=${getToken()}`, { method: 'DELETE' })
    } else {
      setFavorites(p => new Set([...p, id]))
      await fetch(`${API}/api/favorites/${id}?token=${getToken()}`, { method: 'POST' })
    }
  }

  const r        = filtered[idx]
  const isFav    = r && favorites.has(r.id)
  const isOwn    = r && auth && r.created_by === auth.username
  const time     = (r?.prep_time || 0) + (r?.cook_time || 0)
  const imgUrl   = r?.image_url ? (r.image_url.startsWith('/') ? `${API}${r.image_url}` : r.image_url) : null
  const catLabel = FILTERS.find(f => f.id === (r?.category || 'toata_ziua'))?.label?.toUpperCase() || 'REȚETA SERII'

  const FilterBar = () => (
    <div className="absolute bottom-0 left-0 right-0 z-30" style={{
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6,
      paddingLeft: 52, paddingRight: 52,
      background: 'linear-gradient(0deg, rgba(3,1,0,0.99) 0%, rgba(3,1,0,0.88) 100%)',
      backdropFilter: 'blur(40px)', borderTop: '1px solid rgba(201,169,110,0.09)',
    }}>
      {FILTERS.map(f => {
        const active = (activeFilters || new Set()).has(f.id)
        return (
          <button key={f.id} onClick={() => toggleFilter(f.id)} data-cursor style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 22px', borderRadius: 99,
            background: active ? 'rgba(201,169,110,0.1)' : 'rgba(253,246,236,0.02)',
            border: `1px solid ${active ? 'rgba(201,169,110,0.38)' : 'rgba(253,246,236,0.07)'}`,
            color: active ? '#D4B87A' : 'rgba(253,246,236,0.22)',
            fontFamily: 'Jost', fontSize: 10, letterSpacing: '0.2em',
            transform: active ? 'translateY(-1px)' : 'none',
            boxShadow: active ? '0 0 18px rgba(201,169,110,0.12), inset 0 1px 0 rgba(201,169,110,0.1)' : 'none',
            transition: 'all 0.28s ease', cursor: 'none',
          }}>
            <span style={{ fontSize: 14 }}>{f.icon}</span>
            <span>{f.label}</span>
            {active && <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#C9A96E', boxShadow: '0 0 7px rgba(201,169,110,0.9)', flexShrink: 0 }} />}
          </button>
        )
      })}
    </div>
  )

  if (!r) return (
    <div className="relative w-full h-full">
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div style={{ fontSize: 52 }}>🌸</div>
        <p style={{ fontFamily: 'Jost', color: 'rgba(253,246,236,0.2)', letterSpacing: '0.28em', fontSize: 10 }}>
          NICIO REȚETĂ ÎN FILTRUL SELECTAT
        </p>
      </div>
      <FilterBar />
    </div>
  )

  return (
    <div className="relative w-full h-full overflow-hidden">

      {imgUrl && (
        <img key={imgUrl} src={imgUrl} alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{
            ...(() => {
              const isOut = phase === 'out'; const d = dir
              const T = {
                cortina:     { fOut:'brightness(0.04) saturate(0) blur(5px)', tOut: d==='next'?'scale(1.1) translateX(-2%)':'scale(1.1) translateX(2%)', tOut_tr:'opacity .38s ease,transform .38s ease,filter .32s ease', tIn_tr:'opacity .7s ease .05s,transform 1.1s cubic-bezier(.16,1,.3,1) .05s,filter .7s ease .05s' },
                iris:        { fOut:'brightness(0.2) saturate(0.3) blur(2px)', tOut:'scale(1.12)', tOut_tr:'opacity .45s ease,transform .45s ease,filter .4s ease', tIn_tr:'opacity .65s ease .08s,transform 1s cubic-bezier(.16,1,.3,1) .08s,filter .6s ease .08s' },
                flash_blanc: { fOut:'brightness(3) saturate(0)', tOut:'scale(1.04)', tOut_tr:'opacity .12s ease,filter .12s ease', tIn_tr:'opacity .55s ease .05s,transform .9s cubic-bezier(.16,1,.3,1) .05s,filter .5s ease .05s' },
                velvet:      { fOut:'brightness(0.06) saturate(0.1) blur(1px)', tOut:'scale(1.05)', tOut_tr:'opacity .55s ease,transform .55s ease,filter .5s ease', tIn_tr:'opacity .9s ease .1s,transform 1.3s cubic-bezier(.16,1,.3,1) .1s,filter .9s ease .1s' },
                gold_veil:   { fOut:'brightness(0.3) saturate(1.4) sepia(0.8)', tOut: d==='next'?'scale(1.06) translateX(-1.5%)':'scale(1.06) translateX(1.5%)', tOut_tr:'opacity .36s ease,transform .36s ease,filter .3s ease', tIn_tr:'opacity .7s ease .08s,transform 1.1s cubic-bezier(.16,1,.3,1) .08s,filter .65s ease .08s' },
                shutter:     { fOut:'brightness(0.05) saturate(0)', tOut: d==='next'?'translateX(-4%)':'translateX(4%)', tOut_tr:'opacity .32s ease,transform .32s ease,filter .28s ease', tIn_tr:'opacity .65s ease,transform 1s cubic-bezier(.16,1,.3,1),filter .6s ease' },
                zoom_vortex: { fOut:'brightness(0.08) saturate(0) blur(8px)', tOut:'scale(1.25) rotate(2deg)', tOut_tr:'opacity .38s ease,transform .38s ease,filter .34s ease', tIn_tr:'opacity .7s ease .05s,transform 1.2s cubic-bezier(.16,1,.3,1) .05s,filter .65s ease .05s' },
                burn:        { fOut:'brightness(0.02) saturate(0) contrast(2)', tOut:'scale(1.08)', tOut_tr:'opacity .42s ease,transform .42s ease,filter .36s ease', tIn_tr:'opacity .75s ease,transform 1.1s cubic-bezier(.16,1,.3,1),filter .7s ease' },
                split:       { fOut:'brightness(0.07) saturate(0)', tOut: d==='next'?'scale(1.1) translateY(-1.5%)':'scale(1.1) translateY(1.5%)', tOut_tr:'opacity .34s ease,transform .34s ease,filter .3s ease', tIn_tr:'opacity .65s ease .05s,transform 1s cubic-bezier(.16,1,.3,1) .05s,filter .6s ease .05s' },
                breath:      { fOut:'brightness(0.1) saturate(0.2) blur(3px)', tOut:'scale(0.92)', tOut_tr:'opacity .5s ease,transform .5s ease,filter .45s ease', tIn_tr:'opacity .8s ease .1s,transform 1.2s cubic-bezier(.16,1,.3,1) .1s,filter .75s ease .1s' },
                noir:        { fOut:'brightness(0.0) saturate(0) contrast(1.8)', tOut:'scale(1.15) rotate(-1deg)', tOut_tr:'opacity .46s ease,transform .46s ease,filter .4s ease', tIn_tr:'opacity .75s ease .05s,transform 1.15s cubic-bezier(.16,1,.3,1) .05s,filter .7s ease .05s' },
              }[transType] || {}
              return {
                filter: isOut ? T.fOut : 'brightness(0.62) saturate(0.82) contrast(1.06)',
                opacity: isOut ? 0 : 1,
                transform: isOut ? T.tOut : 'scale(1) translateX(0) translateY(0) rotate(0)',
                transition: isOut ? T.tOut_tr : T.tIn_tr,
              }
            })(),
          }}
        />
      )}

      {/* Gradiente */}
      <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(105deg, rgba(3,1,0,0.95) 0%, rgba(3,1,0,0.8) 22%, rgba(3,1,0,0.4) 45%, rgba(3,1,0,0.08) 65%, transparent 80%)' }} />
      <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(0deg, rgba(3,1,0,1) 0%, rgba(3,1,0,0.85) 11%, rgba(3,1,0,0.35) 26%, transparent 48%)' }} />
      <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(180deg, rgba(3,1,0,0.72) 0%, transparent 22%)' }} />
      <div className="absolute inset-0 z-[1]" style={{ background: 'radial-gradient(ellipse at 72% 50%, transparent 30%, rgba(1,0,0,0.55) 100%)' }} />
      <div className="absolute z-[1] pointer-events-none" style={{ bottom: '-15%', left: '-10%', width: '52%', height: '58%', background: 'radial-gradient(ellipse, rgba(201,169,110,0.11) 0%, transparent 65%)' }} />
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{ opacity: 0.028, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Overlay tranziție */}
      {(() => {
        const isOut = phase === 'out'
        const overlays = {
          cortina:     { bg:'linear-gradient(160deg,rgba(4,2,1,.97),rgba(8,5,2,.99))', trOut:'.35s ease', trIn:'.65s ease .05s' },
          iris:        { bg:'radial-gradient(circle at 50% 50%,rgba(4,2,1,.0) 0%,rgba(4,2,1,.98) 70%)', trOut:'.45s ease', trIn:'.7s ease .05s' },
          flash_blanc: { bg:'rgba(253,248,235,1)', trOut:'.1s ease', trIn:'.45s ease' },
          velvet:      { bg:'linear-gradient(180deg,rgba(6,3,1,.96),rgba(2,1,0,.99))', trOut:'.55s ease', trIn:'.9s ease .08s' },
          gold_veil:   { bg:'linear-gradient(160deg,rgba(28,18,4,.94),rgba(45,28,6,.97))', trOut:'.36s ease', trIn:'.7s ease .06s' },
          shutter:     { bg:`linear-gradient(${dir==='next'?'105deg':'255deg'},rgba(4,2,1,.98),rgba(8,5,2,.98))`, trOut:'.32s ease', trIn:'.6s ease' },
          zoom_vortex: { bg:'radial-gradient(ellipse at 50% 50%,rgba(2,1,0,.4) 0%,rgba(2,1,0,.99) 100%)', trOut:'.38s ease', trIn:'.7s ease .05s' },
          burn:        { bg:'radial-gradient(ellipse at 50% 50%,rgba(40,18,2,.5) 0%,rgba(2,1,0,.99) 80%)', trOut:'.42s ease', trIn:'.75s ease' },
          split:       { bg:'linear-gradient(180deg,rgba(4,2,1,.97),rgba(4,2,1,.97))', trOut:'.34s ease', trIn:'.65s ease .05s' },
          breath:      { bg:'radial-gradient(ellipse at 40% 50%,rgba(18,10,2,.6) 0%,rgba(2,1,0,.98) 100%)', trOut:'.5s ease', trIn:'.8s ease .1s' },
          noir:        { bg:'rgba(0,0,0,1)', trOut:'.46s ease', trIn:'.75s ease .05s' },
        }[transType] || { bg:'rgba(2,1,0,.98)', trOut:'.4s ease', trIn:'.7s ease' }
        return (
          <div className="absolute inset-0 z-[5] pointer-events-none" style={{
            background: overlays.bg, opacity: isOut ? 1 : 0,
            transition: `opacity ${isOut ? overlays.trOut : overlays.trIn}`,
          }} />
        )
      })()}

      {/* Panel stânga */}
      <div className="absolute z-10" style={{
        left: 64, top: 120, bottom: 76,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 440,
        ...(() => {
          const isOut = phase === 'out'; const d = dir
          const P = {
            cortina:     { tOut: d==='next'?'translateY(28px) scale(.98)':'translateY(-28px) scale(.98)', blur:'3px', trOut:'.28s ease', del:'.22s', trInT:'.75s cubic-bezier(.16,1,.3,1)', trInO:'.6s ease' },
            iris:        { tOut:'scale(.9)', blur:'4px', trOut:'.4s ease', del:'.25s', trInT:'.9s cubic-bezier(.16,1,.3,1)', trInO:'.7s ease' },
            flash_blanc: { tOut: d==='next'?'translateY(18px)':'translateY(-18px)', blur:'0px', trOut:'.12s ease', del:'.15s', trInT:'.7s cubic-bezier(.16,1,.3,1)', trInO:'.55s ease' },
            velvet:      { tOut: d==='next'?'translateY(36px) scale(.96)':'translateY(-36px) scale(.96)', blur:'2px', trOut:'.5s ease', del:'.3s', trInT:'1s cubic-bezier(.16,1,.3,1)', trInO:'.85s ease' },
            gold_veil:   { tOut: d==='next'?'translateX(-18px) scale(.98)':'translateX(18px) scale(.98)', blur:'2px', trOut:'.32s ease', del:'.2s', trInT:'.8s cubic-bezier(.16,1,.3,1)', trInO:'.65s ease' },
            shutter:     { tOut: d==='next'?'translateX(-24px)':'translateX(24px)', blur:'1px', trOut:'.28s ease', del:'.18s', trInT:'.75s cubic-bezier(.16,1,.3,1)', trInO:'.6s ease' },
            zoom_vortex: { tOut:'scale(1.06) rotate(1.5deg)', blur:'4px', trOut:'.36s ease', del:'.22s', trInT:'1s cubic-bezier(.16,1,.3,1)', trInO:'.7s ease' },
            burn:        { tOut: d==='next'?'translateY(24px) scale(.97)':'translateY(-24px) scale(.97)', blur:'5px', trOut:'.4s ease', del:'.26s', trInT:'.85s cubic-bezier(.16,1,.3,1)', trInO:'.7s ease' },
            split:       { tOut: d==='next'?'translateY(32px)':'translateY(-32px)', blur:'2px', trOut:'.3s ease', del:'.2s', trInT:'.8s cubic-bezier(.16,1,.3,1)', trInO:'.65s ease' },
            breath:      { tOut:'scale(.88)', blur:'3px', trOut:'.48s ease', del:'.28s', trInT:'1.1s cubic-bezier(.16,1,.3,1)', trInO:'.8s ease' },
            noir:        { tOut: d==='next'?'translateX(-30px)':'translateX(30px)', blur:'6px', trOut:'.42s ease', del:'.24s', trInT:'.9s cubic-bezier(.16,1,.3,1)', trInO:'.72s ease' },
          }[transType] || { tOut:'translateY(24px)', blur:'2px', trOut:'.3s ease', del:'.2s', trInT:'.75s cubic-bezier(.16,1,.3,1)', trInO:'.6s ease' }
          return {
            opacity: isOut ? 0 : 1,
            filter: isOut ? `blur(${P.blur})` : 'blur(0px)',
            transform: isOut ? P.tOut : 'translateY(0) translateX(0) scale(1) rotate(0)',
            transition: isOut
              ? `opacity ${P.trOut}, transform ${P.trOut}, filter ${P.trOut}`
              : `opacity ${P.trInO} ${P.del}, transform ${P.trInT} ${P.del}, filter .5s ease ${P.del}`,
          }
        })(),
      }}>
        {/* Categorie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ width: 32, height: 1, background: 'linear-gradient(90deg, transparent, #C9A96E)' }} />
          <span style={{ fontFamily: 'Jost', fontSize: 8, letterSpacing: '0.44em', color: 'rgba(201,169,110,0.7)' }}>{catLabel}</span>
        </div>

        {/* Titlu */}
        <h1 className="font-cormorant italic font-bold" style={{
          fontSize: 'clamp(50px, 6vw, 80px)', lineHeight: 1.02, letterSpacing: '-0.028em',
          color: '#D4B87A', textShadow: '0 0 60px rgba(201,169,110,0.35), 0 2px 4px rgba(0,0,0,0.3)', marginBottom: 14,
        }}>{r.name}</h1>

        {/* Linie */}
        <div style={{ width: 48, height: 1.5, borderRadius: 2, marginBottom: 20, background: 'linear-gradient(90deg, #C9A96E, rgba(201,169,110,0))', boxShadow: '0 0 14px rgba(201,169,110,0.55)' }} />

        {/* Descriere */}
        {r.description && (
          <p style={{ fontFamily: 'Jost', fontWeight: 300, fontSize: 13, lineHeight: 1.8, color: 'rgba(253,246,236,0.42)', maxWidth: 340, marginBottom: 32 }}>
            {r.description}
          </p>
        )}

        {/* BUTOANE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>

          {/* ── SALVEAZĂ: ascuns dacă rețeta îți aparține ── */}
          {!isOwn && (
            <button onClick={() => toggleFav(r.id)} data-cursor
              style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 9, cursor: 'none' }}>
              <span style={{
                fontSize: 21, display: 'inline-block',
                color: isFav ? '#C4788A' : 'rgba(253,246,236,0.3)',
                transform: favAnim ? 'scale(1.85)' : 'scale(1)',
                transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), color 0.25s, filter 0.25s',
                filter: isFav ? 'drop-shadow(0 0 10px rgba(196,120,138,0.85))' : 'none',
              }}>{isFav ? '♥' : '♡'}</span>
              <span style={{ fontFamily: 'Jost', fontSize: 9.5, letterSpacing: '0.24em', color: isFav ? '#C4788A' : 'rgba(253,246,236,0.25)', transition: 'color 0.25s' }}>
                {isFav ? 'SALVAT' : 'SALVEAZĂ'}
              </span>
            </button>
          )}

          <button onClick={() => setShowRecipe(true)} data-cursor style={{
            padding: '15px 44px',
            background: 'linear-gradient(135deg, #E8C87E 0%, #D4B87A 35%, #C9A96E 70%, #B8925A 100%)',
            border: 'none', borderRadius: 3, color: '#0A0600',
            fontFamily: 'Jost', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em',
            boxShadow: '0 0 60px rgba(201,169,110,0.42), 0 10px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,248,210,0.4)',
            transition: 'all 0.3s ease', cursor: 'none',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 90px rgba(201,169,110,0.7), 0 16px 44px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,248,210,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 60px rgba(201,169,110,0.42), 0 10px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,248,210,0.4)' }}
          >
            SPRE REȚETĂ →
          </button>

          {/* Buton ștergere — doar creator */}
          {auth?.role === 'creator' && (
            <button onClick={stergeRetetaCurenta} data-cursor style={{
              padding: '10px 18px', borderRadius: 3, cursor: 'none',
              background: confirmDelete ? 'rgba(180,40,40,0.65)' : 'rgba(180,40,40,0.18)',
              border: `1px solid ${confirmDelete ? 'rgba(220,80,80,0.8)' : 'rgba(220,80,80,0.35)'}`,
              color: confirmDelete ? '#FF9090' : 'rgba(220,100,100,0.6)',
              fontFamily: 'Jost', fontSize: 9, fontWeight: 600, letterSpacing: '0.18em',
              transition: 'all 0.2s', backdropFilter: 'blur(8px)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,40,40,0.45)'; e.currentTarget.style.color = '#FF7070' }}
              onMouseLeave={e => { e.currentTarget.style.background = confirmDelete ? 'rgba(180,40,40,0.65)' : 'rgba(180,40,40,0.18)'; e.currentTarget.style.color = confirmDelete ? '#FF9090' : 'rgba(220,100,100,0.6)' }}
            >
              {confirmDelete ? '✕ CONFIRMĂ ȘTERGEREA' : '✕ ȘTERGE'}
            </button>
          )}
        </div>

        {/* Detalii */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, paddingTop: 22, borderTop: '1px solid rgba(201,169,110,0.12)' }}>
          {[
            time > 0     && { label: 'TIMP',    value: formatTime(time).value, unit: formatTime(time).unit },
            r.servings   && { label: 'PORȚII',  value: `${r.servings}`, unit: 'pers' },
            r.calories   && { label: 'CALORII', value: `${r.calories}`, unit: 'kcal' },
            r.difficulty && { label: 'NIVEL',   value: DIFFICULTY[r.difficulty] || r.difficulty, unit: '' },
          ].filter(Boolean).map((s, i, arr) => (
            <div key={i} style={{ flex: 1, paddingRight: i < arr.length-1 ? 20 : 0, marginRight: i < arr.length-1 ? 20 : 0, borderRight: i < arr.length-1 ? '1px solid rgba(201,169,110,0.1)' : 'none' }}>
              <div style={{ fontFamily: 'Jost', fontSize: 7, letterSpacing: '0.32em', color: 'rgba(201,169,110,0.42)', marginBottom: 7 }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span className="font-cormorant italic font-bold" style={{ fontSize: 21, color: 'rgba(253,246,236,0.88)', lineHeight: 1 }}>{s.value}</span>
                {s.unit && <span style={{ fontFamily: 'Jost', fontSize: 8.5, color: 'rgba(201,169,110,0.38)', letterSpacing: '0.1em' }}>{s.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Săgeți dreapta */}
      <div className="absolute z-20" style={{ right: 48, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { fn: () => filtered.length > 1 && goDir((idx - 1 + filtered.length) % filtered.length, 'prev'), label: '↑', title: 'Rețeta anterioară' },
          { fn: () => filtered.length > 1 && goDir((idx + 1) % filtered.length, 'next'),                   label: '↓', title: 'Rețeta următoare' },
        ].map(({ fn, label, title }) => {
          const canNav = filtered.length > 1
          return (
            <button key={label} onClick={fn} data-cursor title={title} style={{
              width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
              background: canNav ? 'linear-gradient(135deg, rgba(201,169,110,0.18) 0%, rgba(201,169,110,0.06) 100%)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${canNav ? 'rgba(201,169,110,0.45)' : 'rgba(255,255,255,0.05)'}`,
              color: canNav ? '#D4B87A' : 'rgba(201,169,110,0.18)', fontSize: 18, fontWeight: 400,
              boxShadow: canNav ? '0 0 18px rgba(201,169,110,0.22), inset 0 1px 0 rgba(255,240,180,0.12)' : 'none',
              transition: 'all 0.25s ease', cursor: canNav ? 'none' : 'default', lineHeight: 1, opacity: canNav ? 1 : 0.35,
            }}
              onMouseEnter={e => { if (!canNav) return; e.currentTarget.style.background='linear-gradient(135deg, rgba(201,169,110,0.32) 0%, rgba(201,169,110,0.14) 100%)'; e.currentTarget.style.color='#F0D898'; e.currentTarget.style.boxShadow='0 0 32px rgba(201,169,110,0.55), inset 0 1px 0 rgba(255,240,180,0.2)'; e.currentTarget.style.transform='scale(1.12)'; e.currentTarget.style.borderColor='rgba(201,169,110,0.75)' }}
              onMouseLeave={e => { if (!canNav) return; e.currentTarget.style.background='linear-gradient(135deg, rgba(201,169,110,0.18) 0%, rgba(201,169,110,0.06) 100%)'; e.currentTarget.style.color='#D4B87A'; e.currentTarget.style.boxShadow='0 0 18px rgba(201,169,110,0.22), inset 0 1px 0 rgba(255,240,180,0.12)'; e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.borderColor='rgba(201,169,110,0.45)' }}
            >{label}</button>
          )
        })}
      </div>

      {/* Dots */}
      {filtered.length > 1 && (
        <div className="absolute z-20" style={{ bottom: 82, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7 }}>
          {filtered.map((_, i) => (
            <button key={i} onClick={() => goDir(i, i > idx ? 'next' : 'prev')} data-cursor style={{
              width: i === idx ? 28 : 6, height: 6, padding: 0, border: 'none', borderRadius: 99,
              background: i === idx ? '#C9A96E' : 'rgba(253,246,236,0.14)',
              boxShadow: i === idx ? '0 0 14px rgba(201,169,110,0.7)' : 'none',
              transition: 'all 0.5s ease', cursor: 'none',
            }} />
          ))}
        </div>
      )}

      {/* ── MODAL REȚETĂ LUXOS ── */}
      {showRecipe && r && (
        <div className="fixed inset-0 z-50 flex items-start justify-center"
          style={{ background: 'rgba(3,1,0,0.92)', backdropFilter: 'blur(24px)', overflowY: 'auto', padding: '32px' }}
          onClick={() => setShowRecipe(false)}
          onWheel={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}>
          <div onClick={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
            className="relative w-full max-w-[980px] rounded-[32px]"
            style={{
              margin: 'auto',
              background: 'linear-gradient(160deg, rgba(28,18,8,0.98) 0%, rgba(12,8,4,0.99) 100%)',
              border: '1px solid rgba(201,169,110,0.18)',
              boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
            }}>

            {/* Imagine hero */}
            {r.image_url && (
              <div className="relative h-[300px] overflow-hidden rounded-t-[32px]">
                <img src={r.image_url} alt={r.name} className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.65) saturate(0.85)' }} />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(0deg, rgba(12,8,4,1) 0%, rgba(12,8,4,0.3) 50%, transparent 80%)' }} />
                <div className="absolute bottom-0 left-0 p-[36px]">
                  <div className="flex items-center gap-[12px] mb-[12px]">
                    <div style={{ width: 28, height: 1, background: 'rgba(201,169,110,0.7)' }} />
                    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.38em', color: 'rgba(201,169,110,0.7)' }}>
                      {FILTERS.find(f => f.id === r.category)?.label?.toUpperCase() || 'REȚETĂ'}
                    </span>
                  </div>
                  <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, color: '#D4B87A', lineHeight: 1.05, textShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
                    {r.name}
                  </h1>
                </div>
                <button onClick={() => setShowRecipe(false)} data-cursor
                  className="absolute top-[20px] right-[20px] w-[36px] h-[36px] flex items-center justify-center rounded-full cursor-none transition-all duration-200"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: 16, backdropFilter: 'blur(8px)' }}>
                  ✕
                </button>
              </div>
            )}

            <div className="p-[40px]">
              {/* Descriere */}
              {r.description && (
                <p style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 15, lineHeight: 1.8, color: 'rgba(253,246,236,0.55)', marginBottom: 32 }}>
                  {r.description}
                </p>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-4 gap-[1px] rounded-[16px] overflow-hidden mb-[36px]"
                style={{ border: '1px solid rgba(201,169,110,0.12)' }}>
                {[
                  { label: 'TIMP', value: formatTime((r.prep_time||0)+(r.cook_time||0)).value, unit: formatTime((r.prep_time||0)+(r.cook_time||0)).unit, show: (r.prep_time||0)+(r.cook_time||0) > 0 },
                  { label: 'PORȚII', value: `${r.servings}`, unit: 'pers', show: r.servings > 0 },
                  { label: 'CALORII', value: `${r.calories}`, unit: 'kcal', show: r.calories > 0 },
                  { label: 'NIVEL', value: DIFFICULTY[r.difficulty] || r.difficulty, unit: '', show: !!r.difficulty },
                ].filter(s => s.show).map((s, i) => (
                  <div key={i} className="flex flex-col items-center py-[20px] px-[16px]"
                    style={{ background: 'rgba(201,169,110,0.04)' }}>
                    <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, letterSpacing: '0.3em', color: 'rgba(201,169,110,0.45)', marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 26, color: '#FDF6EC', lineHeight: 1 }}>{s.value}</div>
                    {s.unit && <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, color: 'rgba(201,169,110,0.35)', marginTop: 4 }}>{s.unit}</div>}
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)', marginBottom: 32 }} />

              {/* Ingrediente + Mod de preparare — paralele */}
              <div className="grid grid-cols-2 gap-[40px] mb-[36px]">

                {/* Ingrediente */}
                {r.ingredients && (
                  <div>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 22, color: '#D4B87A', fontWeight: 400, marginBottom: 16 }}>Ingrediente</h3>
                    <div className="flex flex-col gap-[10px]">
                      {r.ingredients.split('\n').filter(Boolean).map((ing, i) => (
                        <div key={i} className="flex items-start gap-[14px]">
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(201,169,110,0.5)', flexShrink: 0, marginTop: 8 }} />
                          <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 14, color: 'rgba(253,246,236,0.7)', lineHeight: 1.6 }}>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mod de preparare */}
                {r.instructions && (
                  <div>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 22, color: '#D4B87A', fontWeight: 400, marginBottom: 16 }}>Mod de preparare</h3>
                    <div className="flex flex-col gap-[18px]">
                      {r.instructions.split('\n').filter(Boolean).map((step, i) => (
                        <div key={i} className="flex gap-[16px]">
                          <div className="flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}>
                            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 14, color: '#D4B87A' }}>{i + 1}</span>
                          </div>
                          <p style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 14, color: 'rgba(253,246,236,0.65)', lineHeight: 1.75, paddingTop: 5 }}>
                            {step.replace(/^\d+\.\s*/, '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Buton Salvează jos */}
              {!isOwn && (
                <div className="flex justify-center">
                  <button onClick={() => toggleFav(r.id)} data-cursor
                    className="flex items-center gap-[10px] rounded-full px-[36px] py-[14px] cursor-none transition-all duration-300"
                    style={{
                      background: isFav ? 'rgba(196,120,138,0.15)' : 'rgba(201,169,110,0.08)',
                      border: `1px solid ${isFav ? 'rgba(196,120,138,0.4)' : 'rgba(201,169,110,0.25)'}`,
                      color: isFav ? '#C4788A' : 'rgba(253,246,236,0.5)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isFav ? 'rgba(196,120,138,0.22)' : 'rgba(201,169,110,0.14)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isFav ? 'rgba(196,120,138,0.15)' : 'rgba(201,169,110,0.08)' }}>
                    <span style={{ fontSize: 18 }}>{isFav ? '♥' : '♡'}</span>
                    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, letterSpacing: '0.2em' }}>
                      {isFav ? 'SALVATĂ ÎN COLECȚIA MEA' : 'SALVEAZĂ ÎN COLECȚIA MEA'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <FilterBar />
    </div>
  )
}