import React, { useState, useEffect } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'

const API = 'http://localhost:8000'

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

function DeleteButton({ onDelete }) {
  const [confirm, setConfirm] = React.useState(false)
  const handleClick = () => {
    if (confirm) { onDelete() }
    else { setConfirm(true); setTimeout(() => setConfirm(false), 2500) }
  }
  return (
    <button data-cursor onClick={handleClick}
      title={confirm ? 'Click din nou pentru confirmare' : 'Șterge'}
      style={{
        height: 28, borderRadius: 14, cursor: 'none',
        padding: confirm ? '0 12px' : '0',
        width: confirm ? 'auto' : 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        background: confirm ? 'rgba(180,40,40,0.85)' : 'rgba(15,10,5,0.6)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${confirm ? 'rgba(220,80,80,0.6)' : 'rgba(180,60,60,0.4)'}`,
        color: confirm ? '#FFB3B3' : 'rgba(220,100,100,0.85)',
        transition: 'all 0.22s ease', whiteSpace: 'nowrap', overflow: 'hidden', flexShrink: 0,
      }}
      onMouseEnter={e => { if (!confirm) { e.currentTarget.style.background = 'rgba(180,40,40,0.5)'; e.currentTarget.style.borderColor = 'rgba(220,80,80,0.6)'; e.currentTarget.style.color = '#FF9090' }}}
      onMouseLeave={e => { if (!confirm) { e.currentTarget.style.background = 'rgba(15,10,5,0.6)'; e.currentTarget.style.borderColor = 'rgba(180,60,60,0.4)'; e.currentTarget.style.color = 'rgba(220,100,100,0.85)' }}}>
      <IconTrash />
      {confirm && <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.06em' }}>CONFIRMI?</span>}
    </button>
  )
}
const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
function getToken() { return localStorage.getItem('auth_token') || '' }

const STATUS_CONFIG = {
  ok:       { label: 'OK',       color: '#8FAF8A', bg: 'rgba(143,175,138,0.08)', border: 'rgba(143,175,138,0.2)' },
  low:      { label: 'Puțin',    color: '#C9A96E', bg: 'rgba(201,169,110,0.08)', border: 'rgba(201,169,110,0.25)' },
  critical: { label: 'Lipsește', color: '#C4788A', bg: 'rgba(196,120,138,0.08)', border: 'rgba(196,120,138,0.25)' },
}
const CATEGORIES = ['lactate','legume','fructe','carne','cereale','condimente','conserve','bauturi','general']
const CAT_ICONS  = { lactate:'🥛', legume:'🥦', fructe:'🍎', carne:'🥩', cereale:'🌾', condimente:'🧂', conserve:'🥫', bauturi:'🍷', general:'📦' }

const FILTERS = [
  ['all','Toate'],
  ['lactate','Lactate'], ['legume','Legume'], ['cereale','Cereale'], ['condimente','Condimente'],
]

function MiniSelect({ id, value, onChange, options, openId, setOpenId }) {
  const ref = React.useRef(null)
  const isOpen = openId === id
  const sel = options.find(([v]) => v === value)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button data-cursor onClick={() => setOpenId(isOpen ? null : id)} style={{
        padding: '5px 12px', borderRadius: 6, cursor: 'none',
        background: isOpen ? 'rgba(212,184,122,0.12)' : 'rgba(212,184,122,0.07)',
        border: `1px solid ${isOpen ? 'rgba(212,184,122,0.45)' : 'rgba(212,184,122,0.18)'}`,
        color: 'rgba(253,246,236,0.85)', fontFamily: 'Jost, sans-serif', fontSize: 11,
        display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
      }}>
        <span>{sel?.[1]}</span>
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.6)" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 400, minWidth: 140,
          background: 'rgba(8,4,2,0.99)', backdropFilter: 'blur(32px)',
          border: '1px solid rgba(212,184,122,0.22)', borderRadius: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.95)', overflow: 'hidden',
        }}>
          {options.map(([v, l]) => (
            <button key={v} data-cursor onClick={() => { onChange(v); setOpenId(null) }} style={{
              display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left',
              background: v === value ? 'rgba(212,184,122,0.1)' : 'transparent',
              color: v === value ? '#D4B87A' : 'rgba(253,246,236,0.55)',
              fontFamily: 'Jost, sans-serif', fontSize: 11, cursor: 'none',
              border: 'none', borderBottom: '1px solid rgba(212,184,122,0.05)',
              letterSpacing: '0.05em', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.08)'; e.currentTarget.style.color = '#D4B87A' }}
            onMouseLeave={e => { e.currentTarget.style.background = v === value ? 'rgba(212,184,122,0.1)' : 'transparent'; e.currentTarget.style.color = v === value ? '#D4B87A' : 'rgba(253,246,236,0.55)' }}>
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Stepper({ value, onChange, step = 1, min = 0 }) {
  const adj = (delta) => onChange(Math.max(min, parseFloat(((value || 0) + delta).toFixed(3))))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button data-cursor onClick={() => adj(-step)} style={{
        width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'none',
        background: 'rgba(253,246,236,0.06)',
        color: 'rgba(253,246,236,0.45)', fontSize: 14, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', flexShrink: 0, fontFamily: 'Jost, sans-serif',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.15)'; e.currentTarget.style.color = '#D4B87A' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,246,236,0.06)'; e.currentTarget.style.color = 'rgba(253,246,236,0.45)' }}>−</button>

      <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{
          width: 48, background: 'transparent', border: 'none',
          borderBottom: '1px solid rgba(212,184,122,0.22)',
          color: 'rgba(253,246,236,0.9)', fontFamily: 'Jost, sans-serif',
          fontSize: 14, padding: '4px 0', outline: 'none',
          textAlign: 'center', caretColor: '#D4B87A',
        }}
        onFocus={e => e.target.style.borderBottomColor = '#D4B87A'}
        onBlur={e => e.target.style.borderBottomColor = 'rgba(212,184,122,0.22)'} />

      <button data-cursor onClick={() => adj(step)} style={{
        width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'none',
        background: 'rgba(253,246,236,0.06)',
        color: 'rgba(253,246,236,0.45)', fontSize: 14, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', flexShrink: 0, fontFamily: 'Jost, sans-serif',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.15)'; e.currentTarget.style.color = '#D4B87A' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,246,236,0.06)'; e.currentTarget.style.color = 'rgba(253,246,236,0.45)' }}>+</button>
    </div>
  )
}

export default function PantryPage({ auth, onNavigate }) {
  usePageTracking('camara')
  const [items, setItems]       = useState([])
  const [shopping, setShopping] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [filter, setFilter]     = useState('all')
  const [form, setForm]         = useState({ name:'', quantity:0, unit:'g', category:'general', min_quantity:0 })
  const [openId, setOpenId]     = useState(null)

  const load = async () => {
    try {
      const token = getToken()
      const [p, s] = await Promise.all([
        fetch(`${API}/api/pantry?token=${token}`).then(r => r.json()),
        fetch(`${API}/api/shopping?token=${token}`).then(r => r.json()).catch(() => []),
      ])
      setItems(Array.isArray(p) ? p : [])
      setShopping(Array.isArray(s) ? s : [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const addItem = async () => {
    if (!form.name.trim()) return
    await fetch(`${API}/api/pantry?token=${getToken()}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ name:'', quantity:0, unit:'g', category:'general', min_quantity:0 })
    setShowAdd(false)
    load()
  }

  const deleteItem = async (id) => {
    await fetch(`${API}/api/pantry/${id}?token=${getToken()}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const [editItem, setEditItem] = useState(null) // item being edited
  const [editForm, setEditForm] = useState({})

  const startEdit = (item) => {
    setEditItem(item.id)
    setEditForm({ name: item.name, quantity: item.quantity, unit: item.unit, category: item.category, min_quantity: item.min_quantity || 0 })
    setShowAdd(false)
  }

  const saveEdit = async () => {
    if (!editForm.name?.trim()) return
    await fetch(`${API}/api/pantry/${editItem}?token=${getToken()}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    })
    setEditItem(null)
    load()
  }

  const filtered = filter === 'all' ? items
    : filter === 'critical' ? items.filter(i => i.status === 'critical')
    : filter === 'low' ? items.filter(i => i.status === 'low' || i.status === 'critical')
    : items.filter(i => i.category === filter)

  const byCategory = filtered.reduce((acc, item) => {
    const cat = item.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const shopBadge = shopping.filter(i => !i.done).length

  return (
    <div style={{ position: 'fixed', inset: 0, fontFamily: 'Jost, sans-serif', zIndex: 10, display: 'flex' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .pantry-row:hover .pantry-name { color: #D4B87A !important; }
        .pantry-row:hover .pantry-qty  { color: rgba(253,246,236,0.5) !important; }
        .pantry-scroll::-webkit-scrollbar { width: 3px; }
        .pantry-scroll::-webkit-scrollbar-track { background: transparent; }
        .pantry-scroll::-webkit-scrollbar-thumb { background: rgba(212,184,122,0.12); border-radius: 99px; }
        .pantry-scroll::-webkit-scrollbar-thumb:hover { background: rgba(212,184,122,0.3); }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* ════════════════════════════════════
          STÂNGA — FOTO + TITLU VERTICAL
      ════════════════════════════════════ */}
      <div style={{
        width: '36%', flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        <img
          src="https://images.unsplash.com/photo-1640348784724-93f7b14d8047?q=90&w=1200&auto=format&fit=crop"
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 35%',
            filter: 'brightness(0.9) saturate(1.05)',
          }}
        />

        {/* Gradient spre dreapta — fade în negru */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 60%, #0d0d0d 100%)',
        }}/>
        {/* Vigneta sus/jos */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(3,1,0,0.5) 0%, transparent 15%, transparent 78%, rgba(3,1,0,0.25) 100%)',
        }}/>

        {/* TITLU VERTICAL */}
        <div style={{
          position: 'absolute', left: 32, top: 0, bottom: 0,
          display: 'flex', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: 'clamp(58px, 6.5vw, 90px)', fontWeight: 300,
            color: '#D4B87A', letterSpacing: '0.08em', lineHeight: 1,
            transform: 'rotate(-90deg)',
            transformOrigin: 'center center',
            whiteSpace: 'nowrap',
            textShadow: '0 0 60px rgba(212,184,122,0.3)',
            userSelect: 'none',
            animation: 'slideInLeft 1s ease-out both',
          }}>
            Cămara
          </h1>
        </div>

        {/* STATS — jos-dreapta */}
        <div style={{
          position: 'absolute', bottom: 48, right: 40,
          display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'flex-end',
          animation: 'fadeUp 1s ease-out 0.4s both',
        }}>
          {[
            { n: items.length, label: 'PRODUSE', color: '#D4B87A' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                fontSize: 56, lineHeight: 0.9, color: s.color,
                textShadow: `0 0 28px ${s.color}44`,
              }}>{s.n}</div>
              <div style={{
                fontFamily: 'Jost, sans-serif', fontSize: 7,
                letterSpacing: '0.3em', color: 'rgba(253,246,236,0.7)', marginTop: 4,
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Separator vertical — dreapta */}
        <div style={{
          position: 'absolute', top: '6%', bottom: '6%', right: 0, width: 1,
          background: 'linear-gradient(180deg, transparent, rgba(212,184,122,0.35) 25%, rgba(212,184,122,0.35) 75%, transparent)',
        }}/>
      </div>

      {/* ════════════════════════════════════
          DREAPTA — INVENTAR LEDGER
      ════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)',
        overflow: 'hidden',
      }}>

        {/* Bara filtre + acțiuni */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px',
          height: 64, flexShrink: 0,
          marginTop: 64, overflow: 'hidden',

        }}>
          <div style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
            {FILTERS.map(([f, l]) => (
              <button key={f} data-cursor onClick={() => setFilter(f)} style={{
                background: 'none', border: 'none', cursor: 'none',
                fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.16em',
                color: filter === f ? '#D4B87A' : 'rgba(253,246,236,0.38)',
                padding: '0 10px', height: '100%', flexShrink: 0,
                borderBottom: filter === f ? '1px solid #D4B87A' : '1px solid transparent',
                transition: 'all 0.2s', textTransform: 'uppercase',
              }}
              onMouseEnter={e => { if (filter !== f) e.currentTarget.style.color = 'rgba(253,246,236,0.5)' }}
              onMouseLeave={e => { if (filter !== f) e.currentTarget.style.color = 'rgba(253,246,236,0.38)' }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 10 }}>
            <button data-cursor onClick={() => onNavigate && onNavigate('magazin')} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', borderRadius: 6, cursor: 'none',
              background: 'transparent', border: '1px solid rgba(212,184,122,0.18)',
              color: 'rgba(212,184,122,0.6)', fontFamily: 'Jost, sans-serif',
              fontSize: 9, letterSpacing: '0.2em', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.08)'; e.currentTarget.style.color = '#D4B87A'; e.currentTarget.style.borderColor = 'rgba(212,184,122,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(212,184,122,0.6)'; e.currentTarget.style.borderColor = 'rgba(212,184,122,0.18)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              MAGAZIN
              {shopBadge > 0 && (
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#C4788A',
                  color: '#fff', fontSize: 8, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(196,120,138,0.45)',
                }}>{shopBadge}</span>
              )}
            </button>

            <button data-cursor onClick={() => setShowAdd(s => !s)} style={{
              padding: '7px 20px', borderRadius: 6, cursor: 'none',
              background: showAdd ? 'transparent' : 'linear-gradient(135deg, #D4B87A, #8B6914)',
              color: showAdd ? 'rgba(253,246,236,0.3)' : '#0C0806',
              border: showAdd ? '1px solid rgba(253,246,236,0.08)' : 'none',
              fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.22em', transition: 'all 0.22s',
              boxShadow: showAdd ? 'none' : '0 2px 18px rgba(212,184,122,0.28)',
            }}>
              {showAdd ? '✕ ANULARE' : '+ ADAUGĂ'}
            </button>
          </div>
        </div>

        {/* Formular */}
        {showAdd && (
          <div style={{
            flexShrink: 0, padding: '16px 44px 18px',
            background: 'rgba(212,184,122,0.06)',
            borderBottom: '1px solid rgba(212,184,122,0.08)',
            borderLeft: '2px solid rgba(212,184,122,0.35)',
            animation: 'fadeUp 0.2s ease-out both',
            position: 'relative', zIndex: 50,
          }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 180 }}>
                <div style={{ fontSize: 7, letterSpacing: '0.3em', color: 'rgba(212,184,122,0.35)', marginBottom: 8 }}>PRODUS</div>
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  placeholder="ex: Parmezan maturat..."
                  style={{
                    width: '100%', background: 'transparent', border: 'none',
                    borderBottom: '1px solid rgba(212,184,122,0.22)',
                    color: 'rgba(253,246,236,0.9)', fontFamily: 'Cormorant Garamond, serif',
                    fontStyle: 'italic', fontSize: 18, padding: '5px 0', outline: 'none',
                    boxSizing: 'border-box', caretColor: '#D4B87A',
                  }}
                  onFocus={e => e.target.style.borderBottomColor = '#D4B87A'}
                  onBlur={e => e.target.style.borderBottomColor = 'rgba(212,184,122,0.22)'}
                />
              </div>
              <div>
                <div style={{ fontSize: 7, letterSpacing: '0.3em', color: 'rgba(212,184,122,0.35)', marginBottom: 8 }}>CANT.</div>
                <Stepper value={form.quantity} onChange={v => setForm(p => ({...p, quantity: v}))} step={1} />
              </div>
              <div>
                <div style={{ fontSize: 7, letterSpacing: '0.3em', color: 'rgba(212,184,122,0.35)', marginBottom: 8 }}>UM</div>
                <MiniSelect id='unit' value={form.unit} onChange={v => setForm(p => ({...p, unit: v}))} options={[['g','g'],['kg','kg'],['ml','ml'],['l','l'],['buc','buc']]} openId={openId} setOpenId={setOpenId} />
              </div>
              <div>
                <div style={{ fontSize: 7, letterSpacing: '0.3em', color: 'rgba(212,184,122,0.35)', marginBottom: 8 }}>CATEGORIE</div>
                <MiniSelect id='category' value={form.category} onChange={v => setForm(p => ({...p, category: v}))} options={CATEGORIES.map(c => [c, `${CAT_ICONS[c]||''} ${c}`])} openId={openId} setOpenId={setOpenId} />
              </div>
              <div>
                <div style={{ fontSize: 7, letterSpacing: '0.3em', color: 'rgba(212,184,122,0.35)', marginBottom: 8 }}>MIN (prag)</div>
                <Stepper value={form.min_quantity} onChange={v => setForm(p => ({...p, min_quantity: v}))} step={1} />
              </div>
              <button data-cursor onClick={addItem} style={{
                padding: '8px 22px', borderRadius: 6, border: 'none', cursor: 'none',
                background: 'linear-gradient(135deg, #D4B87A, #8B6914)',
                color: '#0C0806', fontFamily: 'Jost, sans-serif',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', flexShrink: 0,
              }}>✓ ADAUGĂ</button>
            </div>
          </div>
        )}

        {/* ── CONȚINUT ── */}
        <div className="pantry-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A96E', boxShadow: '0 0 12px #C9A96E', animation: 'pulse 1s ease-in-out infinite' }} />
            </div>
          ) : Object.keys(byCategory).length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 16 }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 34, color: 'rgba(212,184,122,0.15)' }}>
                Cămara e goală
              </div>
              <div style={{ width: 32, height: 1, background: 'rgba(212,184,122,0.1)' }}/>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, color: 'rgba(253,246,236,0.12)', letterSpacing: '0.18em' }}>
                ADAUGĂ PRIMUL PRODUS
              </p>
            </div>
          ) : (
            <div style={{ padding: '0 44px 60px' }}>
              {Object.entries(byCategory).map(([cat, catItems], catIdx) => (
                <div key={cat} style={{
                  position: 'relative',
                  paddingTop: 44, paddingBottom: 8,
                  borderBottom: '1px solid rgba(253,246,236,0.12)',
                  animation: `fadeUp 0.5s ease-out ${catIdx * 0.08}s both`,
                }}>


                  {/* Label categorie */}
                  <div style={{
                    position: 'relative', zIndex: 1,
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                  }}>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>{CAT_ICONS[cat] || '✦'}</span>
                    <span style={{
                      fontFamily: 'Jost, sans-serif', fontSize: 8.5,
                      letterSpacing: '0.28em', color: 'rgba(212,184,122,0.9)',
                      textTransform: 'uppercase',
                    }}>{cat}</span>
                    <div style={{ width: 20, height: 1, background: 'rgba(212,184,122,0.3)' }}/>
                    <span style={{
                      fontFamily: 'Jost, sans-serif', fontSize: 8,
                      color: 'rgba(253,246,236,0.5)', letterSpacing: '0.08em',
                    }}>{catItems.length}</span>
                  </div>

                  {/* Produse */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {catItems.map((item, iIdx) => {
                      const isEditing = editItem === item.id
                      return (
                        <div key={item.id}>
                          {/* Rând normal */}
                          {!isEditing && (
                            <div className="pantry-row"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 60px auto',
                                alignItems: 'center', gap: 16,
                                padding: '10px 12px', borderRadius: 6,
                                transition: 'background 0.18s',
                                animation: `fadeUp 0.4s ease-out ${catIdx * 0.08 + iIdx * 0.04}s both`,
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,184,122,0.07)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                              <span className="pantry-name" style={{
                                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                                fontSize: 17, color: 'rgba(253,246,236,0.97)',
                                letterSpacing: '0.01em', transition: 'color 0.18s',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>{item.name}</span>

                              <span className="pantry-qty" style={{
                                fontFamily: 'Jost, sans-serif', fontSize: 10,
                                color: 'rgba(253,246,236,0.55)', fontWeight: 300,
                                letterSpacing: '0.04em', textAlign: 'right',
                                transition: 'color 0.18s',
                              }}>{item.quantity}{item.unit}</span>

                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  {/* Edit */}
                                  <button data-cursor onClick={() => startEdit(item)} style={{
                                    width: 26, height: 26, borderRadius: '50%', cursor: 'none',
                                    background: 'transparent',
                                    border: '1px solid rgba(212,184,122,0.3)',
                                    color: 'rgba(212,184,122,0.55)', fontSize: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s', flexShrink: 0,
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.1)'; e.currentTarget.style.color = '#D4B87A'; e.currentTarget.style.borderColor = 'rgba(212,184,122,0.4)' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(212,184,122,0.55)'; e.currentTarget.style.borderColor = 'rgba(212,184,122,0.3)' }}>
                                    <IconEdit />
                                  </button>
                                  {/* Delete */}
                                  <DeleteButton onDelete={() => deleteItem(item.id)} />
                              </div>
                            </div>
                          )}

                          {/* Rând editare inline */}
                          {isEditing && (
                            <div style={{
                              padding: '12px 12px', borderRadius: 8,
                              background: 'rgba(212,184,122,0.05)',
                              border: '1px solid rgba(212,184,122,0.18)',
                              borderLeft: '2px solid rgba(212,184,122,0.5)',
                              marginBottom: 2,
                              animation: 'fadeUp 0.18s ease-out both',
                              position: 'relative', zIndex: 10,
                            }}>
                              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                {/* Nume */}
                                <div style={{ flex: 2, minWidth: 140 }}>
                                  <div style={{ fontSize: 7, letterSpacing: '0.28em', color: 'rgba(212,184,122,0.35)', marginBottom: 6 }}>PRODUS</div>
                                  <input value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))}
                                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                    style={{
                                      width: '100%', background: 'transparent', border: 'none',
                                      borderBottom: '1px solid rgba(212,184,122,0.25)',
                                      color: 'rgba(253,246,236,0.9)', fontFamily: 'Cormorant Garamond, serif',
                                      fontStyle: 'italic', fontSize: 17, padding: '3px 0', outline: 'none',
                                      boxSizing: 'border-box', caretColor: '#D4B87A',
                                    }}
                                    onFocus={e => e.target.style.borderBottomColor = '#D4B87A'}
                                    onBlur={e => e.target.style.borderBottomColor = 'rgba(212,184,122,0.25)'}
                                  />
                                </div>
                                {/* Cantitate */}
                                <div>
                                  <div style={{ fontSize: 7, letterSpacing: '0.28em', color: 'rgba(212,184,122,0.35)', marginBottom: 6 }}>CANT.</div>
                                  <Stepper value={editForm.quantity} onChange={v => setEditForm(p => ({...p, quantity: v}))} />
                                </div>
                                {/* UM */}
                                <div>
                                  <div style={{ fontSize: 7, letterSpacing: '0.28em', color: 'rgba(212,184,122,0.35)', marginBottom: 6 }}>UM</div>
                                  <MiniSelect id={`edit-unit-${item.id}`} value={editForm.unit} onChange={v => setEditForm(p => ({...p, unit: v}))} options={[['g','g'],['kg','kg'],['ml','ml'],['l','l'],['buc','buc']]} openId={openId} setOpenId={setOpenId} />
                                </div>
                                {/* Min */}
                                <div>
                                  <div style={{ fontSize: 7, letterSpacing: '0.28em', color: 'rgba(212,184,122,0.35)', marginBottom: 6 }}>MIN</div>
                                  <Stepper value={editForm.min_quantity} onChange={v => setEditForm(p => ({...p, min_quantity: v}))} />
                                </div>
                                {/* Butoane */}
                                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                                  <button data-cursor onClick={() => setEditItem(null)} style={{
                                    padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(253,246,236,0.08)',
                                    background: 'transparent', color: 'rgba(253,246,236,0.3)',
                                    fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.16em', cursor: 'none',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(253,246,236,0.6)'; e.currentTarget.style.borderColor = 'rgba(253,246,236,0.2)' }}
                                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(253,246,236,0.3)'; e.currentTarget.style.borderColor = 'rgba(253,246,236,0.08)' }}>
                                    ANUL
                                  </button>
                                  <button data-cursor onClick={saveEdit} style={{
                                    padding: '6px 16px', borderRadius: 6, border: 'none',
                                    background: 'linear-gradient(135deg, #D4B87A, #8B6914)',
                                    color: '#0C0806', fontFamily: 'Jost, sans-serif',
                                    fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', cursor: 'none',
                                    boxShadow: '0 2px 12px rgba(212,184,122,0.25)',
                                  }}>
                                    ✓ SALVEAZĂ
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}