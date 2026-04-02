import { useState, useRef, useEffect, useCallback } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

/* ── CONTRAST PANEL ── */
function ContrastPanel({ onClose }) {
  const [contrast, setContrast] = useState(() => {
    return parseFloat(localStorage.getItem('app_contrast') || '1')
  })
  const [brightness, setBrightness] = useState(() => {
    return parseFloat(localStorage.getItem('app_brightness') || '1')
  })
  const [saturation, setSaturation] = useState(() => {
    return parseFloat(localStorage.getItem('app_saturation') || '1')
  })

  const apply = useCallback((c, b, s) => {
    document.documentElement.style.filter = `contrast(${c}) brightness(${b}) saturate(${s})`
    localStorage.setItem('app_contrast',   c)
    localStorage.setItem('app_brightness', b)
    localStorage.setItem('app_saturation', s)
  }, [])

  // Apply instantly on every change
  const updateContrast   = v => { setContrast(v);   apply(v, brightness, saturation) }
  const updateBrightness = v => { setBrightness(v); apply(contrast, v, saturation) }
  const updateSaturation = v => { setSaturation(v); apply(contrast, brightness, v) }

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const reset = () => {
    setContrast(1); setBrightness(1); setSaturation(1)
    apply(1, 1, 1)
    localStorage.setItem('app_contrast', '1')
    localStorage.setItem('app_brightness', '1')
    localStorage.setItem('app_saturation', '1')
  }

  const sliders = [
    { label: 'Contrast',    value: contrast,    set: updateContrast,   min: 0.5, max: 2,   step: 0.01, format: v => `${Math.round(v * 100)}%` },
    { label: 'Luminozitate',value: brightness,  set: updateBrightness, min: 0.4, max: 1.8, step: 0.01, format: v => `${Math.round(v * 100)}%` },
    { label: 'Saturație',   value: saturation,  set: updateSaturation, min: 0,   max: 2,   step: 0.01, format: v => `${Math.round(v * 100)}%` },
  ]

  const isDefault = contrast === 1 && brightness === 1 && saturation === 1

  return (
    <div className="fixed z-[200]"
      style={{ top: 80, right: 32 }}>
      <div
        style={{
          width: 360, borderRadius: 24, padding: '28px 32px',
          background: 'linear-gradient(160deg, rgba(14,9,4,0.97) 0%, rgba(6,3,1,0.98) 100%)',
          border: '1px solid rgba(201,169,110,0.22)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,169,110,0.06)',
          backdropFilter: 'blur(40px)',
        }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.32em', color: 'rgba(201,169,110,0.45)', marginBottom: 6 }}>
              VIZUALIZARE
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 26, color: '#D4B87A', fontWeight: 400 }}>
              Ajustare afișaj
            </h2>
          </div>
          <button data-cursor onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', cursor: 'none',
              background: 'rgba(253,246,236,0.05)', border: '1px solid rgba(253,246,236,0.1)',
              color: 'rgba(253,246,236,0.35)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(253,246,236,0.12)'; e.currentTarget.style.color = 'rgba(253,246,236,0.8)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,246,236,0.05)'; e.currentTarget.style.color = 'rgba(253,246,236,0.35)' }}>
            ✕
          </button>
        </div>

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {sliders.map(({ label, value, set, min, max, step, format }) => {
            const pct = ((value - min) / (max - min)) * 100
            return (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.16em', color: 'rgba(253,246,236,0.4)' }}>
                    {label.toUpperCase()}
                  </span>
                  <span style={{
                    fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20,
                    color: value === 1 ? 'rgba(253,246,236,0.3)' : '#D4B87A',
                    transition: 'color 0.2s',
                  }}>
                    {format(value)}
                  </span>
                </div>

                {/* Track custom */}
                <div style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
                  {/* Track bg */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 99,
                    background: 'rgba(253,246,236,0.07)',
                  }} />
                  {/* Track fill */}
                  <div style={{
                    position: 'absolute', left: 0, height: 3, borderRadius: 99,
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, rgba(201,169,110,0.4), #D4B87A)',
                    transition: 'width 0s',
                  }} />
                  {/* Marker default (100%) */}
                  <div style={{
                    position: 'absolute',
                    left: `${((1 - min) / (max - min)) * 100}%`,
                    transform: 'translateX(-50%)',
                    width: 1, height: 10, background: 'rgba(253,246,236,0.15)',
                    borderRadius: 1,
                  }} />
                  {/* Input range */}
                  <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => set(parseFloat(e.target.value))}
                    style={{
                      position: 'absolute', left: 0, right: 0, width: '100%',
                      appearance: 'none', WebkitAppearance: 'none',
                      background: 'transparent', cursor: 'none', outline: 'none',
                      height: 36, margin: 0, padding: 0,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Reset */}
        <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
          <button data-cursor onClick={reset} disabled={isDefault}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'none',
              background: isDefault ? 'rgba(253,246,236,0.03)' : 'rgba(201,169,110,0.1)',
              border: `1px solid ${isDefault ? 'rgba(253,246,236,0.06)' : 'rgba(201,169,110,0.28)'}`,
              color: isDefault ? 'rgba(253,246,236,0.15)' : '#D4B87A',
              fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.2em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!isDefault) e.currentTarget.style.background = 'rgba(201,169,110,0.2)' }}
            onMouseLeave={e => { if (!isDefault) e.currentTarget.style.background = 'rgba(201,169,110,0.1)' }}>
            RESETEAZĂ
          </button>
          <button data-cursor onClick={onClose}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'none',
              background: 'linear-gradient(135deg, #D4B87A, #8B6914)',
              color: '#0C0806', fontFamily: 'Jost, sans-serif', fontSize: 10,
              fontWeight: 700, letterSpacing: '0.2em',
            }}>
            APLICĂ
          </button>
        </div>
      </div>

      {/* Slider thumb style */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: linear-gradient(135deg, #E8C87E, #C9A96E);
          border: 2px solid rgba(255,240,180,0.3);
          box-shadow: 0 0 12px rgba(201,169,110,0.6), 0 2px 8px rgba(0,0,0,0.4);
          cursor: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px rgba(201,169,110,0.85), 0 2px 10px rgba(0,0,0,0.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          background: linear-gradient(135deg, #E8C87E, #C9A96E);
          border: 2px solid rgba(255,240,180,0.3);
          box-shadow: 0 0 12px rgba(201,169,110,0.6);
          cursor: none;
        }
      `}</style>
    </div>
  )
}

/* ══════════════════════════════════════════ */

export default function Navbar({ activePage, onNavigate, auth, onLogout }) {
  const [dropOpen, setDropOpen]         = useState(false)
  const [showContrast, setShowContrast] = useState(false)
  const [appVersion, setAppVersion]     = useState('')
  const dropRef = useRef(null)
  const notifRef = useRef(null)
  const isCreator = auth?.role === 'creator'
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (window.electronAPI?.appVersion) {
      window.electronAPI.appVersion().then(v => setAppVersion(v)).catch(() => {})
    }
  }, [])

  // Restore saved filter on mount
  useEffect(() => {
    const c = parseFloat(localStorage.getItem('app_contrast')   || '1')
    const b = parseFloat(localStorage.getItem('app_brightness') || '1')
    const s = parseFloat(localStorage.getItem('app_saturation') || '1')
    if (c !== 1 || b !== 1 || s !== 1) {
      document.documentElement.style.filter = `contrast(${c}) brightness(${b}) saturate(${s})`
    }
  }, [])

  const links = [
    { id: 'hero',             label: 'Inspirație',        always: true },
    { id: 'retete',           label: 'Rețete',            always: true },
    { id: 'planner',          label: 'Planificator',      always: true },
    { id: 'pantry',           label: 'Cămară',            always: true },
    { id: 'magazin',          label: 'Magazin',           always: true },
    { id: 'ai',               label: 'AI ✦',              always: true },
    { id: 'analytics',        label: 'Rapoarte',          creatorOnly: true },
    { id: 'suggestii',        label: '⬡ Sugestii cod',    creatorOnly: true },
    { id: 'suggestii_retete', label: '✦ Sugestii rețete', creatorOnly: true },
  ].filter(l => l.always || (l.creatorOnly && isCreator))

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = auth?.username ? auth.username[0].toUpperCase() : '?'
  const username = auth?.username || ''

  // Auto-scan notifications
  const [notifications, setNotifications] = useState([])
  const [notifSince, setNotifSince] = useState(0)
  const [showNotif, setShowNotif] = useState(false)
  const [autoScanRunning, setAutoScanRunning] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const token = localStorage.getItem('auth_token') || ''
  const isCreatorUser = auth?.role === 'creator'
  const API = 'http://localhost:8000'

  useEffect(() => {
    if (!isCreatorUser) return
    // Poll status + notificari la 15 secunde
    const poll = async () => {
      try {
        const [statusRes, notifRes] = await Promise.all([
          fetch(`${API}/api/suggestions/autoscan/status?token=${token}`).then(r => r.json()).catch(() => ({})),
          fetch(`${API}/api/suggestions/notifications?token=${token}&since=${notifSince}`).then(r => r.json()).catch(() => ({ notifications: [], total: 0 })),
        ])
        setAutoScanRunning(statusRes.running || false)
        if (notifRes.notifications?.length > 0) {
          setNotifications(prev => [...prev, ...notifRes.notifications].slice(-50))
          setNotifSince(notifRes.total)
          setUnreadCount(c => c + notifRes.notifications.length)
        }
      } catch {}
    }
    if (!autoScanRunning) return
    poll()
    const interval = setInterval(poll, 15000)
    return () => clearInterval(interval)
  }, [isCreatorUser, token, notifSince, autoScanRunning])

  const toggleAutoScan = async () => {
    const endpoint = autoScanRunning ? 'stop' : 'start'
    try {
      await fetch(`${API}/api/suggestions/autoscan/${endpoint}?token=${token}`, { method: 'POST' })
      setAutoScanRunning(!autoScanRunning)
    } catch {}
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[52px] py-[22px]"
        style={{ background: 'linear-gradient(180deg, rgba(4,2,1,0.85) 0%, transparent 100%)' }}>

        {/* Logo */}
        <div className="flex items-baseline gap-[8px] cursor-none flex-shrink-0"
          onClick={() => onNavigate('hero')} data-cursor>
          <div className="font-cormorant text-[21px] text-cream tracking-[0.04em]"
            style={{ textShadow: '0 0 30px rgba(201,169,110,0.25)' }}>
            <em className="italic text-gold">Bucătăria</em> Mea
          </div>
          {appVersion && (
            <span style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: 9,
              letterSpacing: '0.22em',
              color: 'rgba(201,169,110,0.35)',
            }}>
              v{appVersion}
            </span>
          )}
        </div>

        {/* Indicator offline */}
        {!isOnline && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 99,
            background: 'rgba(196,120,138,0.12)',
            border: '1px solid rgba(196,120,138,0.25)',
            color: '#C4788A',
            fontFamily: 'Jost, sans-serif',
            fontSize: 9, letterSpacing: '0.18em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C4788A', display: 'inline-block' }}/>
            OFFLINE
          </div>
        )}

        {/* Links */}
        <div className="flex gap-[24px] items-center">
          {links.map(l => (
            <button key={l.id} onClick={() => onNavigate(l.id)} data-cursor
              className={[
                'text-[11px] tracking-[0.16em] transition-all duration-200 cursor-none border-0 bg-transparent whitespace-nowrap',
                activePage === l.id
                  ? 'text-gold px-[16px] py-[6px] border border-gold/30 rounded-full bg-gold/[0.07]'
                  : 'text-cream/40 hover:text-gold hover:drop-shadow-[0_0_18px_rgba(201,169,110,0.45)]',
              ].join(' ')}
              style={{ fontFamily: 'Jost, sans-serif' }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Clopotel notificari - doar creator */}
        {isCreatorUser && (
          <div ref={notifRef} className="relative flex-shrink-0" onMouseLeave={() => setShowNotif(false)}>
            <button data-cursor onClick={() => { setShowNotif(v => !v); setUnreadCount(0) }}
              style={{
                background: 'none', border: 'none', cursor: 'none',
                position: 'relative', padding: '6px',
              }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              {autoScanRunning && unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  background: '#D4B87A', color: '#0C0904',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 9, fontFamily: 'Jost, sans-serif', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div style={{
                position: 'absolute', top: '100%', right: 0,
                paddingTop: 12,
                width: 320, maxHeight: 412, overflowY: 'auto',
                background: 'linear-gradient(160deg, rgba(28,20,10,0.97) 0%, rgba(12,9,4,0.98) 100%)',
                border: '1px solid rgba(201,169,110,0.15)',
                borderRadius: 16,
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(32px)',
                zIndex: 200,
              }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(253,246,236,0.05)' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: '#D4B87A' }}>
                    Notificări
                  </span>
                </div>
                {!autoScanRunning ? (
                  <div style={{ padding: '28px 18px', color: 'rgba(253,246,236,0.18)', fontFamily: 'Jost, sans-serif', fontSize: 11, textAlign: 'center' }} />
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '20px 18px', color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif', fontSize: 11, textAlign: 'center' }}>
                    Se scanează... sugestiile apar aici
                  </div>
                ) : (
                  <div>
                    {[...notifications].reverse().map((n, i) => (
                      <div key={i} style={{ padding: '10px 18px', borderBottom: '1px solid rgba(253,246,236,0.04)' }}>
                        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(253,246,236,0.8)', marginBottom: 3 }}>
                          {n.title}
                        </div>
                        <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, color: 'rgba(253,246,236,0.3)', letterSpacing: '0.1em' }}>
                          {n.file} · {n.time}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User dropdown */}
        <div ref={dropRef} className="relative flex-shrink-0">
          <button data-cursor onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-[10px] cursor-none transition-all duration-200"
            style={{ background: 'none', border: 'none' }}>
            <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-200"
              style={{
                background: isCreator ? 'linear-gradient(135deg, #D4B87A, #8B6914)' : 'linear-gradient(135deg, #8FAF8A, #5A7A5A)',
                boxShadow: dropOpen
                  ? `0 0 20px ${isCreator ? 'rgba(201,169,110,0.6)' : 'rgba(143,175,138,0.5)'}`
                  : `0 0 12px ${isCreator ? 'rgba(201,169,110,0.3)' : 'rgba(143,175,138,0.2)'}`,
                color: '#0C0904',
              }}>{initials}</div>

            <div className="text-left">
              <div className="text-[11px] leading-none mb-[2px]"
                style={{ color: 'rgba(253,246,236,0.7)', fontFamily: 'Jost, sans-serif', letterSpacing: '0.08em' }}>
                {username}
              </div>
              {isCreator && (
                <div className="text-[8px] leading-none tracking-[0.2em]"
                  style={{ color: 'rgba(201,169,110,0.5)', fontFamily: 'Jost, sans-serif' }}>
                  CREATOR
                </div>
              )}
            </div>

            <div className="text-[10px] transition-transform duration-200"
              style={{ color: 'rgba(253,246,236,0.2)', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▾
            </div>
          </button>

          {/* Dropdown */}
          {dropOpen && (
            <div className="absolute top-[calc(100%+12px)] right-0 rounded-[16px] overflow-hidden"
              style={{
                width: 210,
                background: 'linear-gradient(160deg, rgba(28,20,10,0.97) 0%, rgba(12,9,4,0.98) 100%)',
                border: '1px solid rgba(201,169,110,0.15)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(253,246,236,0.03)',
                backdropFilter: 'blur(32px)',
              }}>

              {/* Header */}
              <div className="px-[18px] py-[14px]"
                style={{ borderBottom: '1px solid rgba(253,246,236,0.05)' }}>
                <div className="text-[13px] text-cream font-cormorant italic font-bold">{username}</div>
                <div className="text-[9px] tracking-[0.18em] mt-[2px]"
                  style={{ color: 'rgba(201,169,110,0.45)', fontFamily: 'Jost, sans-serif' }}>
                  {isCreator ? 'ADMINISTRATOR' : 'UTILIZATOR'}
                </div>
              </div>

              <div className="py-[6px]">
                <DropItem icon="◎" label="Profilul meu" onClick={() => { onNavigate('profil'); setDropOpen(false) }} />
                {isCreator && (
                  <>
                    <DropItem icon="✦" label="Rețetele mele"     onClick={() => { onNavigate('retete'); setDropOpen(false) }} />
                    <DropItem icon="◈" label="Planificator"       onClick={() => { onNavigate('planner'); setDropOpen(false) }} />
                    <div style={{ height: 1, background: 'rgba(253,246,236,0.05)', margin: '6px 0' }} />
                    <DropItem icon="⬡" label="Sugestii cod AI"    onClick={() => { onNavigate('suggestii'); setDropOpen(false) }} />
                    <DropItem icon="✦" label="Sugestii rețete AI" onClick={() => { onNavigate('suggestii_retete'); setDropOpen(false) }} />
                  </>
                )}

                {/* Separator */}
                <div style={{ height: 1, background: 'rgba(253,246,236,0.05)', margin: '6px 0' }} />

                {/* Contrast */}
                <DropItem icon="◑" label="Ajustare afișaj" onClick={() => { setShowContrast(true); setDropOpen(false) }} />

                <div style={{ height: 1, background: 'rgba(253,246,236,0.05)', margin: '6px 0' }} />
                <DropItem icon="→" label="Ieși din cont" onClick={onLogout} danger />
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Contrast Panel */}
      {showContrast && <ContrastPanel onClose={() => setShowContrast(false)} />}
    </>
  )
}

function DropItem({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <button data-cursor onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="w-full flex items-center gap-[10px] px-[18px] py-[10px] cursor-none transition-all duration-150"
      style={{
        background: hov ? (danger ? 'rgba(196,120,138,0.08)' : 'rgba(201,169,110,0.06)') : 'transparent',
        border: 'none',
      }}>
      <span style={{ fontSize: 11, color: danger ? '#C4788A' : 'rgba(201,169,110,0.5)', width: 14 }}>{icon}</span>
      <span className="text-[11px] tracking-[0.1em]"
        style={{ color: danger ? '#C4788A' : (hov ? 'rgba(253,246,236,0.85)' : 'rgba(253,246,236,0.5)'), fontFamily: 'Jost, sans-serif' }}>
        {label}
      </span>
    </button>
  )
}