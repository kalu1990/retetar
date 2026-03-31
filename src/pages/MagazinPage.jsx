import { useState, useEffect, useRef } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'

const API = 'http://localhost:8000'
function getToken() { return localStorage.getItem('auth_token') || '' }

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

export default function MagazinPage({ auth, onNavigate }) {
  usePageTracking('magazin')
  const [shopping, setShopping] = useState([])
  const [newItem, setNewItem]   = useState('')
  const [loading, setLoading]   = useState(true)
  const inputRef = useRef(null)

  const load = async () => {
    try {
      const s = await fetch(`${API}/api/shopping?token=${getToken()}`).then(r => r.json()).catch(() => [])
      setShopping(Array.isArray(s) ? s : [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const total  = shopping.length
  const done   = shopping.filter(i => i.done).length
  const pct    = total === 0 ? 0 : Math.round((done / total) * 100)
  const pending = shopping.filter(i => !i.done)

  const toggleShop = async (id) => {
    await fetch(`${API}/api/shopping/${id}/toggle?token=${getToken()}`, { method: 'POST' })
    setShopping(prev => prev.map(i => i.id === id ? { ...i, done: i.done ? 0 : 1 } : i))
  }

  const deleteItem = async (id) => {
    await fetch(`${API}/api/shopping/${id}?token=${getToken()}`, { method: 'DELETE' })
    setShopping(prev => prev.filter(i => i.id !== id))
  }

  const clearDone = async () => {
    await fetch(`${API}/api/shopping/done?token=${getToken()}`, { method: 'DELETE' })
    load()
  }

  const addShop = async () => {
    if (!newItem.trim()) return
    await fetch(`${API}/api/shopping?token=${getToken()}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItem.trim(), quantity: 1, unit: '', category: '', urgent: false })
    })
    setNewItem('')
    load()
  }

  return (
    <div className="relative z-10 h-full overflow-auto" style={{ fontFamily: 'Jost, sans-serif' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .shop-item:hover .shop-name { color: #D4B87A !important; }
        .shop-scroll::-webkit-scrollbar { width: 3px; }
        .shop-scroll::-webkit-scrollbar-track { background: transparent; }
        .shop-scroll::-webkit-scrollbar-thumb { background: rgba(212,184,122,0.15); border-radius: 99px; }
      `}</style>

      {/* FUNDAL */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=90&auto=format&fit=crop"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.72) saturate(0.85)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,1,0,0.45) 0%, rgba(2,1,0,0.1) 18%, rgba(2,1,0,0.05) 50%, rgba(2,1,0,0.15) 100%)' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(1,0,0,0.25) 100%)' }}/>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '72px 80px 100px', animation: 'fadeUp 0.5s ease-out both' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 96, fontWeight: 300, color: '#D4B87A', lineHeight: 0.88, marginBottom: 22,
              textShadow: '0 2px 30px rgba(0,0,0,0.9), 0 4px 40px rgba(212,184,122,0.3)',
            }}>
              Magazin
            </h1>

            {total > 0 ? (
              <div>
                <div style={{ fontSize: 11, color: 'rgba(253,246,236,0.7)', letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                  {done} din {total} produse cumpărate
                </div>
                <div style={{ width: 420, height: 2, background: 'rgba(253,246,236,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #C9A96E, #D4B87A)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 11, color: 'rgba(253,246,236,0.22)', letterSpacing: '0.1em', fontWeight: 300 }}>
                Lista e goală ✦
              </p>
            )}
          </div>

          {/* Scurtătură Cămară */}
          <button data-cursor onClick={() => onNavigate && onNavigate('pantry')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 8, cursor: 'none',
            background: 'transparent', border: '1px solid rgba(212,184,122,0.18)',
            color: 'rgba(212,184,122,0.55)', fontFamily: 'Jost, sans-serif',
            fontSize: 9, letterSpacing: '0.2em', transition: 'all 0.2s',
            marginBottom: 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.08)'; e.currentTarget.style.color = '#D4B87A'; e.currentTarget.style.borderColor = 'rgba(212,184,122,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(212,184,122,0.55)'; e.currentTarget.style.borderColor = 'rgba(212,184,122,0.18)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            CĂMARĂ
          </button>
        </div>

        {/* PANEL GLASSMORPHISM */}
        <div style={{
          background: 'rgba(253,246,236,0.08)', backdropFilter: 'blur(20px)',
          borderRadius: 28, padding: '36px 48px 40px',
          border: '1px solid rgba(253,246,236,0.18)',
          boxShadow: '0 8px 48px rgba(253,246,236,0.06), inset 0 1px 0 rgba(253,246,236,0.15)',
        }}>

        {/* ADAUGĂ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{ width: 2, height: 38, borderRadius: 2, background: 'rgba(212,184,122,0.35)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addShop()}
            placeholder="Adaugă un produs la listă..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              borderBottom: '1px solid rgba(212,184,122,0.22)',
              color: 'rgba(253,246,236,0.9)', fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic', fontSize: 26, padding: '10px 0', outline: 'none',
              caretColor: '#D4B87A',
            }}
            onFocus={e => e.target.style.borderBottomColor = '#D4B87A'}
            onBlur={e => e.target.style.borderBottomColor = 'rgba(212,184,122,0.22)'}
          />
          <button data-cursor onClick={addShop} style={{
            padding: '9px 22px', borderRadius: 99, cursor: 'none',
            background: 'linear-gradient(135deg, #D4B87A, #8B6914)',
            color: '#0C0806', fontFamily: 'Jost, sans-serif',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', border: 'none',
            boxShadow: '0 2px 16px rgba(212,184,122,0.25)', flexShrink: 0,
          }}>+ ADAUGĂ</button>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(212,184,122,0.35), rgba(212,184,122,0.06) 60%, transparent)', marginBottom: 8 }} />

        {/* Header listă */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, letterSpacing: '0.28em', color: 'rgba(212,184,122,0.5)', textTransform: 'uppercase' }}>
              Lista de cumpărături
            </span>
            {pending.length > 0 && (
              <span style={{
                padding: '2px 9px', borderRadius: 99, fontFamily: 'Jost, sans-serif',
                fontSize: 8, letterSpacing: '0.1em', color: '#C9A96E',
                background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.22)',
              }}>{pending.length}</span>
            )}
          </div>
          {done > 0 && (
            <button data-cursor onClick={clearDone} style={{
              background: 'none', border: 'none', cursor: 'none',
              color: 'rgba(220,100,100,0.35)', fontFamily: 'Jost, sans-serif',
              fontSize: 8, letterSpacing: '0.18em', transition: 'color 0.18s',
              textTransform: 'uppercase',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(220,100,100,0.75)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(220,100,100,0.35)'}>
              ✕ Șterge bifate
            </button>
          )}
        </div>

        {/* LISTA */}
        {loading ? (
          <div style={{ paddingTop: 60, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A96E', boxShadow: '0 0 12px #C9A96E', animation: 'pulse 1s ease-in-out infinite' }} />
          </div>
        ) : shopping.length === 0 ? (
          <div style={{ paddingTop: 60, textAlign: 'center' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 26, color: 'rgba(253,246,236,0.18)' }}>
              Niciun produs adăugat ✦
            </p>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, color: 'rgba(253,246,236,0.12)', marginTop: 12, letterSpacing: '0.12em' }}>
              FOLOSEȘTE CÂMPUL DE MAI SUS SAU SALVEAZĂ INGREDIENTE DINTR-O REȚETĂ
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '0 60px' }}>
            {shopping.map((item, idx) => (
              <div key={item.id} className="shop-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                  padding: '16px 10px', borderBottom: '1px solid rgba(253,246,236,0.08)',
                  opacity: item.done ? 0.35 : 1, transition: 'all 0.2s',
                  borderRadius: 6,
                  animation: `fadeUp 0.35s ease-out ${idx * 0.03}s both`,
                }}>

                {/* Checkbox */}
                <div data-cursor onClick={() => toggleShop(item.id)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0, cursor: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${item.done ? 'rgba(143,175,138,0.7)' : 'rgba(212,184,122,0.3)'}`,
                    background: item.done ? 'rgba(143,175,138,0.18)' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                  {item.done && <span style={{ color: '#8FAF8A', fontSize: 11, lineHeight: 1 }}>✓</span>}
                </div>

                {/* Nume */}
                <span data-cursor onClick={() => toggleShop(item.id)} className="shop-name"
                  style={{
                    flex: 1, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontSize: 24, cursor: 'none',
                    color: item.done ? 'rgba(253,246,236,0.2)' : '#FDF6EC',
                    textDecoration: item.done ? 'line-through' : 'none',
                    textShadow: item.done ? 'none' : '0 1px 16px rgba(0,0,0,0.95), 0 2px 32px rgba(0,0,0,0.8)',
                    transition: 'all 0.2s',
                  }}>
                  {item.name}
                </span>



                {/* Șterge */}
                <button data-cursor onClick={() => deleteItem(item.id)} style={{
                  width: 28, height: 28, borderRadius: '50%', cursor: 'none',
                  background: 'rgba(15,10,5,0.5)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(180,60,60,0.25)',
                  color: 'rgba(220,100,100,0.45)', fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,40,40,0.45)'; e.currentTarget.style.color = '#FF9090'; e.currentTarget.style.borderColor = 'rgba(220,80,80,0.55)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,10,5,0.5)'; e.currentTarget.style.color = 'rgba(220,100,100,0.45)'; e.currentTarget.style.borderColor = 'rgba(180,60,60,0.25)' }}>
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
        </div>{/* end panel glass */}
      </div>
    </div>
  )
}