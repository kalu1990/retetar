import React, { useState, useEffect, useRef } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'
import { publicaRetetaFirebase } from '../firebase'

const API = 'http://localhost:8000'
const CATEGORIES = [['mic_dejun','Mic dejun'],['pranz','Prânz'],['cina','Cină'],['toata_ziua','Toată ziua']]
const DIFFICULTIES = [['usor','Ușor'],['mediu','Mediu'],['greu','Greu']]


function formatTime(min) {
  if (!min || min <= 0) return null
  if (min < 60) return { value: `${min}`, unit: 'min' }
  const h = Math.floor(min / 60)
  const m = min % 60
  return { value: m > 0 ? `${h}h ${m}'` : `${h}h`, unit: '' }
}

function getToken() { return localStorage.getItem('auth_token') || '' }

/* ── LUPA SVG ── */
function SearchIcon({ size = 18, color = 'rgba(201,169,110,0.6)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  )
}

/* ── ICON SVG EDIT ── */
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

/* ── ICON SVG TRASH ── */
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

/* ── CARD REȚETĂ ── */
function RecipeCard({ r, onClick, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const totalTime = (r.prep_time || 0) + (r.cook_time || 0)

  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(r.id, r.is_saved)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 2500)
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit(r)
  }

  return (
    <div
      onClick={() => onClick(r)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirmDelete(false) }}
      data-cursor
      className="relative overflow-hidden rounded-[20px] cursor-none"
      style={{
        background: hov ? '#1C1108' : '#131008',
        border: `1px solid ${hov ? 'rgba(212,184,122,0.42)' : 'rgba(180,140,70,0.16)'}`,
        boxShadow: hov
          ? '0 24px 60px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,184,122,0.12)'
          : '0 8px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(212,184,122,0.05)',
        transform: hov ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      {/* ── BUTOANE ACȚIUNE (apar la hover) ── */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        display: 'flex', gap: 8,
        opacity: hov ? 1 : 0,
        transform: hov ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        pointerEvents: hov ? 'all' : 'none',
      }}>
        {/* Editează */}
        <button onClick={handleEdit} data-cursor title="Editează"
          className="cursor-none"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(15,10,5,0.75)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(201,169,110,0.35)',
            color: '#D4B87A', transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.22)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.7)'; e.currentTarget.style.color = '#F0D898' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,10,5,0.75)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)'; e.currentTarget.style.color = '#D4B87A' }}
        ><EditIcon /></button>

        {/* Șterge */}
        <button onClick={handleDelete} data-cursor title={confirmDelete ? 'Click din nou pentru confirmare' : 'Șterge'}
          className="cursor-none"
          style={{
            height: 34, borderRadius: 17,
            padding: confirmDelete ? '0 14px' : '0',
            width: confirmDelete ? 'auto' : 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: confirmDelete ? 'rgba(180,40,40,0.85)' : 'rgba(15,10,5,0.75)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${confirmDelete ? 'rgba(220,80,80,0.6)' : 'rgba(180,60,60,0.4)'}`,
            color: confirmDelete ? '#FFB3B3' : 'rgba(220,100,100,0.85)',
            transition: 'all 0.22s ease',
            whiteSpace: 'nowrap', overflow: 'hidden',
          }}
          onMouseEnter={e => { if (!confirmDelete) { e.currentTarget.style.background = 'rgba(180,40,40,0.5)'; e.currentTarget.style.borderColor = 'rgba(220,80,80,0.6)'; e.currentTarget.style.color = '#FF9090' }}}
          onMouseLeave={e => { if (!confirmDelete) { e.currentTarget.style.background = 'rgba(15,10,5,0.75)'; e.currentTarget.style.borderColor = 'rgba(180,60,60,0.4)'; e.currentTarget.style.color = 'rgba(220,100,100,0.85)' }}}
        >
          <TrashIcon />
          {confirmDelete && <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.06em' }}>CONFIRMI?</span>}
        </button>
      </div>

      {r.image_url ? (
        <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
          <img src={r.image_url} alt={r.name} className="w-full h-full object-cover"
            style={{ transform: hov ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)', filter: hov ? 'brightness(0.9) saturate(1.15)' : 'brightness(0.8) saturate(1.0)' }} />
          {/* Gradient pe imagine — titlul poate fi pus deasupra dacă vrem */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(10,6,2,0.72) 0%, rgba(10,6,2,0.1) 55%, transparent 100%)' }}/>
        </div>
      ) : (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, background: 'rgba(201,169,110,0.04)' }}>🍽️</div>
      )}

      <div className="p-[20px]">
        {r.is_saved && !r.is_inspired ? (
          <span className="inline-block mb-[8px] px-[10px] py-[3px] rounded-full text-[10px] tracking-[0.12em]"
            style={{ background: 'rgba(180,140,255,0.12)', color: 'rgba(200,170,255,0.85)', fontFamily: 'Jost, sans-serif', border: '1px solid rgba(180,140,255,0.2)' }}>
            ✦ INSPIRAȚIE
          </span>
        ) : r.is_public && !r.is_inspired ? (
          <span className="inline-block mb-[8px] px-[10px] py-[3px] rounded-full text-[10px] tracking-[0.12em]"
            style={{ background: 'rgba(201,169,110,0.15)', color: '#D4B87A', fontFamily: 'Jost, sans-serif', border: '1px solid rgba(201,169,110,0.2)' }}>
            ✓ PUBLICĂ
          </span>
        ) : (
          <span className="inline-block mb-[8px] px-[10px] py-[3px] rounded-full text-[10px] tracking-[0.12em]"
            style={{ background: 'rgba(253,246,236,0.06)', color: 'rgba(253,246,236,0.35)', fontFamily: 'Jost, sans-serif', border: '1px solid rgba(253,246,236,0.1)' }}>
            ⬤ PRIVATĂ
          </span>
        )}

        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, fontWeight: 400, color: '#FDF6EC', marginBottom: 6, lineHeight: 1.25 }}>{r.name}</h3>

        {r.description ? (
          <p className="text-[12px] mb-[12px] line-clamp-2"
            style={{ color: 'rgba(253,246,236,0.45)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>
            {r.description}
          </p>
        ) : null}

        <div className="flex gap-[12px]" style={{ color: 'rgba(201,169,110,0.55)', fontFamily: 'Jost, sans-serif', fontSize: 11 }}>
          {totalTime > 0 && (() => { const t = formatTime(totalTime); return <span>⏱ {t.value}{t.unit ? ' ' + t.unit : ''}</span> })()}
          {r.servings > 0 && <span>👤 {r.servings} porții</span>}
          {r.difficulty && <span>{r.difficulty === 'usor' ? '● Ușor' : r.difficulty === 'mediu' ? '●● Mediu' : '●●● Greu'}</span>}
        </div>
      </div>
    </div>
  )
}

/* ── DROPDOWN CUSTOM ── */
function CustomSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(([v]) => v === value)

  useEffect(() => {
    const onClickOut = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,169,110,0.6)', fontFamily: 'Jost, sans-serif' }}>{label}</label>
      <button data-cursor onClick={() => setOpen(o => !o)}
        className="w-full cursor-none"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 16px', borderRadius: 12, textAlign: 'left',
          background: open ? 'rgba(253,246,236,0.07)' : 'rgba(253,246,236,0.04)',
          border: `1px solid ${open ? 'rgba(201,169,110,0.45)' : 'rgba(201,169,110,0.2)'}`,
          color: '#FDF6EC', fontFamily: 'Jost, sans-serif', fontSize: 13,
          transition: 'all 0.2s ease',
          boxShadow: open ? '0 0 0 3px rgba(201,169,110,0.06)' : 'none',
        }}>
        <span>{selected?.[1] || '—'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.6)" strokeWidth="2" strokeLinecap="round"
          style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
          background: 'rgba(18,11,6,0.98)', backdropFilter: 'blur(32px)',
          border: '1px solid rgba(201,169,110,0.2)', borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.06)',
          animation: 'dropIn 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {options.map(([v, l], i) => {
            const isSelected = v === value
            return (
              <button key={v} data-cursor onClick={() => { onChange(v); setOpen(false) }}
                className="w-full cursor-none"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 18px', textAlign: 'left',
                  background: isSelected ? 'rgba(201,169,110,0.1)' : 'transparent',
                  borderBottom: i < options.length - 1 ? '1px solid rgba(201,169,110,0.06)' : 'none',
                  color: isSelected ? '#D4B87A' : 'rgba(253,246,236,0.7)',
                  fontFamily: 'Jost, sans-serif', fontSize: 13,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(201,169,110,0.06)'; e.currentTarget.style.color = '#FDF6EC' }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(201,169,110,0.1)' : 'transparent'; e.currentTarget.style.color = isSelected ? '#D4B87A' : 'rgba(253,246,236,0.7)' }}
              >
                <span>{l}</span>
                {isSelected && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4B87A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── STEPPER NUMERIC CUSTOM ── */
function NumericStepper({ label, value, onChange, min = 0, max = 9999, step = 1, unit = '' }) {
  const [focused, setFocused] = useState(false)
  const intervalRef = useRef(null)
  const timeoutRef  = useRef(null)

  const clamp = v => Math.max(min, Math.min(max, v))

  const change = delta => {
    onChange(clamp((Number(value) || 0) + delta))
  }

  const startHold = delta => {
    change(delta)
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => change(delta), 80)
    }, 350)
  }
  const stopHold = () => {
    clearTimeout(timeoutRef.current)
    clearInterval(intervalRef.current)
  }

  const btnBase = {
    width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
    background: 'rgba(201,169,110,0.07)', color: '#D4B87A',
    fontSize: 20, fontWeight: 300, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'none', transition: 'all 0.2s ease', userSelect: 'none',
  }

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,169,110,0.6)', fontFamily: 'Jost, sans-serif' }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: focused ? 'rgba(253,246,236,0.07)' : 'rgba(253,246,236,0.04)',
        border: `1px solid ${focused ? 'rgba(201,169,110,0.45)' : 'rgba(201,169,110,0.2)'}`,
        borderRadius: 14, padding: '6px 10px',
        transition: 'all 0.25s ease',
      }}>
        <button data-cursor style={btnBase}
          onMouseDown={() => startHold(-step)}
          onMouseUp={stopHold} onMouseLeave={stopHold}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.25)'; e.currentTarget.style.color = '#F0D898' }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.07)'; e.currentTarget.style.color = '#D4B87A' }}
        >−</button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <input
            type="text"
            inputMode="numeric"
            value={value || 0}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={e => {
              const v = e.target.value.replace(/[^0-9]/g, '')
              onChange(clamp(v === '' ? 0 : Number(v)))
            }}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: '#FDF6EC', fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic', fontSize: 22, fontWeight: 600,
              width: 52, textAlign: 'center', cursor: 'text',
              caretColor: '#D4B87A',
            }}
          />
          {unit && (
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: 'rgba(201,169,110,0.4)', letterSpacing: '0.08em', paddingBottom: 2 }}>
              {unit}
            </span>
          )}
        </div>

        <button data-cursor style={btnBase}
          onMouseDown={() => startHold(step)}
          onMouseUp={stopHold} onMouseLeave={stopHold}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.25)'; e.currentTarget.style.color = '#F0D898' }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.07)'; e.currentTarget.style.color = '#D4B87A' }}
        >+</button>
      </div>
    </div>
  )
}

/* ── MODAL ADĂUGARE / EDITARE ── */
function RecipeModal({ r, auth, onClose, onDelete }) {
  const [form, setForm]         = useState({ ...r })
  const [saving, setSaving]     = useState(false)
  const [imagePreview, setImagePreview] = useState(r.image_url || null)
  const [isDirty, setIsDirty]   = useState(false)  // detectează modificări

  function upd(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    // Marchează ca modificat dacă valoarea s-a schimbat față de original
    if (r[k] !== v) setIsDirty(true)
  }

  async function save() {
    setSaving(true)
    try {
      let url, method, payload

      if (form.is_saved || form.is_inspired) {
        if (form.is_inspired) {
          // Rețetă deja copiată anterior — update pe loc
          payload = { ...form, is_public: 0, is_inspired: 1, token: getToken() }
          url = `${API}/api/recipes/${form.id}?token=${getToken()}`
          method = 'PUT'
        } else {
          // Rețetă din favorite (a altcuiva) — creează copie proprie cu is_inspired=1
          payload = { ...form, id: undefined, is_public: 0, is_inspired: 1, token: getToken() }
          url = `${API}/api/recipes`
          method = 'POST'
          // Scoate din favorite după salvare
          const res2 = await fetch(`${API}/api/favorites/${form.id}?token=${getToken()}`, { method: 'DELETE' })
        }
      } else if (form.id) {
        // Rețetă proprie → actualizează normal
        payload = { ...form, token: getToken() }
        url = `${API}/api/recipes/${form.id}?token=${getToken()}`
        method = 'PUT'
      } else {
        // Rețetă nouă
        payload = { ...form, token: getToken() }
        url = `${API}/api/recipes`
        method = 'POST'
      }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        // Daca e publica, o publicam si in Firebase Inspiratie
        if (payload.is_public === 1 || payload.is_public === true) {
          const resData = await res.clone().json().catch(() => ({}))
          const finalId = form.id || resData?.id || ''
          // Trimite poza (base64 sau URL) catre Firebase Storage
          const imageToUpload = imagePreview && imagePreview.startsWith('data:') ? imagePreview : null
          await publicaRetetaFirebase(
            { ...payload, id: finalId, image_url: imagePreview || payload.image_url || '' },
            imageToUpload
          ).catch(() => {})
        }
        onClose(true)
      }
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setImagePreview(ev.target.result)
      upd('image_url', ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const inp = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,169,110,0.6)', fontFamily: 'Jost, sans-serif' }}>{label}</label>
      <input
        type={type}
        value={form[key] || ''}
        onChange={e => upd(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[12px] px-[16px] py-[10px] text-[13px] outline-none cursor-none"
        style={{ background: 'rgba(253,246,236,0.05)', border: '1px solid rgba(201,169,110,0.2)', color: '#FDF6EC', fontFamily: 'Jost, sans-serif' }}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center" style={{ background: 'rgba(8,5,3,0.85)', backdropFilter: 'blur(12px)', overflowY: 'auto', padding: '32px', paddingTop: '96px' }}>


      <div className="relative w-full max-w-[600px] rounded-[28px] p-[32px]" style={{ margin: 'auto', background: 'rgba(18,12,8,0.95)', border: '1px solid rgba(201,169,110,0.2)', backdropFilter: 'blur(40px)' }}>

        <button onClick={e => { e.stopPropagation(); onClose(false) }} data-cursor
          className="absolute top-[20px] right-[20px] w-[32px] h-[32px] flex items-center justify-center rounded-full cursor-none"
          style={{ background: 'rgba(253,246,236,0.06)', color: 'rgba(253,246,236,0.4)', fontSize: 16 }}>✕</button>

        <h2 className="text-[22px] mb-[24px]"
          style={{ color: '#D4B87A', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
          {form.id ? 'Editează rețeta' : 'Rețetă nouă'}
        </h2>

        <div className="flex flex-col gap-[16px]">
          {inp('Nume rețetă', 'name', 'text', 'ex: Ciorbă de perișoare')}

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,169,110,0.6)', fontFamily: 'Jost, sans-serif' }}>DESCRIERE</label>
            <textarea value={form.description || ''} onChange={e => upd('description', e.target.value)}
              rows={2} placeholder="O scurtă descriere..."
              className="w-full rounded-[12px] px-[16px] py-[10px] text-[13px] outline-none resize-none cursor-none"
              style={{ background: 'rgba(253,246,236,0.05)', border: '1px solid rgba(201,169,110,0.2)', color: '#FDF6EC', fontFamily: 'Jost, sans-serif' }} />
          </div>

          {/* Imagine */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,169,110,0.6)', fontFamily: 'Jost, sans-serif' }}>FOTOGRAFIE</label>
            {imagePreview && (
              <div className="mb-[10px] h-[140px] rounded-[12px] overflow-hidden">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" style={{ filter: 'brightness(0.85)' }} />
              </div>
            )}
            <label data-cursor className="flex items-center gap-[10px] rounded-[12px] px-[16px] py-[10px] cursor-none"
              style={{ background: 'rgba(201,169,110,0.08)', border: '1px dashed rgba(201,169,110,0.3)', color: 'rgba(201,169,110,0.7)', fontFamily: 'Jost, sans-serif', fontSize: 13 }}>
              <span>📷</span>
              <span>{imagePreview ? 'Schimbă fotografia' : 'Încarcă o fotografie'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-[12px]">
            <NumericStepper label="PREGĂTIRE" unit="min" value={form.prep_time} onChange={v => upd('prep_time', v)} min={0} max={600} step={1} />
            <NumericStepper label="GĂTIRE" unit="min" value={form.cook_time} onChange={v => upd('cook_time', v)} min={0} max={600} step={1} />
            <NumericStepper label="PORȚII" unit="pers" value={form.servings} onChange={v => upd('servings', v)} min={1} max={50} step={1} />
          </div>

          <CustomSelect label="CATEGORIE" value={form.category || 'toata_ziua'} onChange={v => upd('category', v)} options={CATEGORIES} />

          <CustomSelect label="DIFICULTATE" value={form.difficulty || 'mediu'} onChange={v => upd('difficulty', v)} options={DIFFICULTIES} />

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,169,110,0.6)', fontFamily: 'Jost, sans-serif' }}>INGREDIENTE</label>
            <textarea value={form.ingredients || ''} onChange={e => upd('ingredients', e.target.value)}
              rows={4} placeholder="Un ingredient pe linie..."
              className="w-full rounded-[12px] px-[16px] py-[10px] text-[13px] outline-none resize-none cursor-none"
              style={{ background: 'rgba(253,246,236,0.05)', border: '1px solid rgba(201,169,110,0.2)', color: '#FDF6EC', fontFamily: 'Jost, sans-serif' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,169,110,0.6)', fontFamily: 'Jost, sans-serif' }}>MOD DE PREPARARE</label>
            <textarea value={form.instructions || ''} onChange={e => upd('instructions', e.target.value)}
              rows={5} placeholder="Descrie pașii de preparare..."
              className="w-full rounded-[12px] px-[16px] py-[10px] text-[13px] outline-none resize-none cursor-none"
              style={{ background: 'rgba(253,246,236,0.05)', border: '1px solid rgba(201,169,110,0.2)', color: '#FDF6EC', fontFamily: 'Jost, sans-serif' }} />
          </div>

          {/* Toggle Public — ascuns pentru rețete salvate din Inspirație */}
          {(!form.is_saved && !form.is_inspired) ? (
            <div className="flex items-center justify-between rounded-[16px] px-[20px] py-[14px]"
              style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.15)' }}>
              <div>
                <div style={{ color: '#FDF6EC', fontFamily: 'Jost, sans-serif', fontSize: 13 }}>Publică în Inspirație</div>
                <div style={{ color: 'rgba(253,246,236,0.35)', fontFamily: 'Jost, sans-serif', fontSize: 11, marginTop: 2 }}>
                  Vizibilă pentru toți utilizatorii
                </div>
              </div>
              <div onClick={() => upd('is_public', form.is_public ? 0 : 1)} data-cursor
                className="relative w-[48px] h-[26px] rounded-full cursor-none transition-all duration-300"
                style={{ background: form.is_public ? 'linear-gradient(135deg, #D4B87A, #8B6914)' : 'rgba(253,246,236,0.1)' }}>
                <div className="absolute top-[3px] w-[20px] h-[20px] rounded-full transition-all duration-300"
                  style={{ left: form.is_public ? 25 : 3, background: form.is_public ? '#0C0806' : 'rgba(253,246,236,0.3)' }} />
              </div>
            </div>
          ) : (form.is_saved || form.is_inspired) ? (
            <div className="flex items-center gap-[10px] rounded-[16px] px-[20px] py-[14px]"
              style={{ background: 'rgba(180,140,255,0.06)', border: '1px solid rgba(180,140,255,0.15)' }}>
              <span style={{ fontSize: 14 }}>✦</span>
              <div>
                <div style={{ color: 'rgba(200,170,255,0.8)', fontFamily: 'Jost, sans-serif', fontSize: 12, letterSpacing: '0.06em' }}>
                  Salvată din Inspirație
                </div>
                <div style={{ color: 'rgba(253,246,236,0.25)', fontFamily: 'Jost, sans-serif', fontSize: 10, marginTop: 2 }}>
                  {isDirty ? 'Va fi salvată ca versiunea ta personală' : 'Modificările o transformă în versiunea ta personală'}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-[12px] mt-[24px]">
          {/* Buton ȘTERGE */}
          {form.id && (
            <button onClick={() => onDelete(form.id, form.is_saved)} data-cursor
              className="px-[20px] py-[12px] rounded-[14px] text-[12px] tracking-[0.1em] cursor-none transition-all duration-200"
              style={{ background: 'rgba(180,60,60,0.12)', border: '1px solid rgba(180,60,60,0.3)', color: 'rgba(220,100,100,0.8)', fontFamily: 'Jost, sans-serif' }}>
              ȘTERGE
            </button>
          )}

          {/* Buton SALVEAZĂ — ascuns pentru rețete din Inspirație nemodificate */}
          {(!form.is_saved && !form.is_inspired || isDirty) && (
            <button onClick={save} disabled={saving || !form.name?.trim()} data-cursor
              className="flex-1 py-[14px] rounded-[14px] text-[12px] tracking-[0.12em] font-medium cursor-none transition-all duration-200"
              style={{
                background: form.name?.trim() ? 'linear-gradient(135deg, #D4B87A, #8B6914)' : 'rgba(201,169,110,0.15)',
                color: form.name?.trim() ? '#0C0806' : 'rgba(201,169,110,0.3)',
                fontFamily: 'Jost, sans-serif',
              }}>
              {saving ? 'SE SALVEAZĂ...' : (form.is_saved || form.is_inspired) && isDirty ? 'SALVEAZĂ MODIFICĂRILE' : form.id ? 'SALVEAZĂ MODIFICĂRILE' : 'ADAUGĂ REȚETA'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


const DIFFICULTY_LABEL = { usor: 'Ușor', mediu: 'Mediu', greu: 'Greu', easy: 'Ușor' }
const CATEGORY_LABEL   = { mic_dejun: 'Mic dejun', pranz: 'Prânz', cina: 'Cină', toata_ziua: 'Toată ziua' }

/* ── MODAL PREZENTARE LUXOASĂ ── */
function RecipeViewModal({ r, auth, onClose, onEdit }) {
  const imgUrl = r?.image_url ? (r.image_url.startsWith('/') ? `${API}${r.image_url}` : r.image_url) : null
  const totalTime = (r.prep_time || 0) + (r.cook_time || 0)
  const catLabel = (CATEGORY_LABEL[r.category] || 'Rețetă').toUpperCase()
  const [showShop, setShowShop]     = useState(false)
  const [showCook, setShowCook]     = useState(false)
  const [shopItems, setShopItems]   = useState([])
  const [shopSaved, setShopSaved]   = useState(false)
  const [newShopItem, setNewShopItem] = useState('')

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Populează lista cu ingredientele rețetei
  useEffect(() => {
    if (showShop && r.ingredients) {
      const parsed = r.ingredients.split('\n').filter(Boolean).map((ing, i) => ({
        id: i, name: ing.trim(), checked: false
      }))
      setShopItems(parsed)
      setShopSaved(false)
    }
  }, [showShop])

  const saveToShoppingList = async () => {
    if (shopSaved) return
    const token = localStorage.getItem('auth_token') || ''
    const toSave = shopItems.filter(item => item.checked)
    for (const item of toSave) {
      await fetch(`${API}/api/shopping?token=${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, quantity: 1, unit: '', category: '', urgent: false })
      })
    }
    setShopSaved(true)
    setTimeout(() => setShowShop(false), 1200)
  }

  const cookSteps = r.instructions ? r.instructions.split('\n').filter(Boolean) : []
  const [cookStep, setCookStep] = useState(0)

  return (
    <>
    {/* ── MODAL PRINCIPAL ── */}
    <div className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ background: 'rgba(3,1,0,0.94)', backdropFilter: 'blur(28px)', overflowY: 'auto', padding: '32px', paddingTop: '96px' }}
      onClick={() => onClose()}>
      <div onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: '100%', maxWidth: 1000, margin: 'auto', borderRadius: 32, background: 'linear-gradient(160deg, rgba(24,15,6,0.99) 0%, rgba(10,6,3,0.99) 100%)', border: '1px solid rgba(201,169,110,0.15)', boxShadow: '0 48px 140px rgba(0,0,0,0.85)' }}>

        {/* HERO */}
        <div className="relative overflow-hidden" style={{ height: 320, borderRadius: '32px 32px 0 0' }}>
          {imgUrl ? (
            <img src={imgUrl} alt={r.name} className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.55) saturate(0.85)' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[80px]"
              style={{ background: 'rgba(201,169,110,0.05)' }}>🍽️</div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(10,6,3,1) 0%, rgba(10,6,3,0.5) 40%, transparent 75%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(10,6,3,0.6) 0%, transparent 60%)' }} />

          <div className="absolute bottom-0 left-0 p-[40px]">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 28, height: 1, background: 'rgba(201,169,110,0.7)' }} />
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.4em', color: 'rgba(201,169,110,0.7)' }}>{catLabel}</span>
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 'clamp(30px, 4vw, 52px)', fontWeight: 700, color: '#D4B87A', lineHeight: 1.05, textShadow: '0 4px 32px rgba(0,0,0,0.6)' }}>{r.name}</h1>
          </div>

          {/* Butoane top-right — în afara oricărui stopPropagation */}
          <div className="absolute top-[20px] right-[20px] flex gap-[10px]" style={{ zIndex: 10 }}>
            <button onClick={e => { e.stopPropagation(); onEdit() }} data-cursor
              className="flex items-center gap-[8px] px-[16px] h-[36px] rounded-full cursor-none transition-all duration-200"
              style={{ background: 'rgba(201,169,110,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(201,169,110,0.35)', color: '#D4B87A', fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.18em' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,0.32)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,169,110,0.18)'}>
              <span style={{ fontSize: 12 }}>✎</span> EDITEAZĂ
            </button>
            <button onClick={e => { e.stopPropagation(); onClose() }} data-cursor
              className="w-[36px] h-[36px] flex items-center justify-center rounded-full cursor-none transition-all duration-200"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, lineHeight: 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,50,50,0.75)'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}>
              ✕
            </button>
          </div>
        </div>

        {/* CORP */}
        <div style={{ padding: '36px 44px 44px' }}>
          {r.description && (
            <p style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 14.5, lineHeight: 1.85, color: 'rgba(253,246,236,0.5)', marginBottom: 32 }}>{r.description}</p>
          )}

          {/* Meta */}
          {[totalTime, r.servings, r.calories, r.difficulty].some(Boolean) && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[totalTime>0, r.servings>0, r.calories>0, !!r.difficulty].filter(Boolean).length}, 1fr)`, border: '1px solid rgba(201,169,110,0.1)', borderRadius: 16, overflow: 'hidden', marginBottom: 36 }}>
              {[
                { label: 'TIMP',    value: totalTime > 0 ? formatTime(totalTime).value : 0, unit: totalTime > 0 ? formatTime(totalTime).unit : 'min', show: totalTime > 0 },
                { label: 'PORȚII',  value: r.servings,   unit: 'pers', show: r.servings > 0 },
                { label: 'CALORII', value: r.calories,   unit: 'kcal', show: r.calories > 0 },
                { label: 'NIVEL',   value: DIFFICULTY_LABEL[r.difficulty] || r.difficulty, unit: '', show: !!r.difficulty },
              ].filter(s => s.show).map((s, i, arr) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', background: 'rgba(201,169,110,0.04)', borderRight: i < arr.length - 1 ? '1px solid rgba(201,169,110,0.08)' : 'none' }}>
                  <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, letterSpacing: '0.3em', color: 'rgba(201,169,110,0.4)', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 28, color: '#FDF6EC', lineHeight: 1 }}>{s.value}</div>
                  {s.unit && <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, color: 'rgba(201,169,110,0.32)', marginTop: 4 }}>{s.unit}</div>}
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.18), transparent)', marginBottom: 36 }} />

          {/* Ingrediente + Preparare */}
          <div style={{ display: 'grid', gridTemplateColumns: r.ingredients && r.instructions ? '1fr 1fr' : '1fr', gap: 44 }}>
            {r.ingredients && (
              <div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 24, color: '#D4B87A', fontWeight: 400, marginBottom: 20 }}>Ingrediente</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {r.ingredients.split('\n').filter(Boolean).map((ing, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(201,169,110,0.5)', flexShrink: 0, marginTop: 9 }} />
                      <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 14, color: 'rgba(253,246,236,0.72)', lineHeight: 1.65 }}>{ing}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {r.instructions && (
              <div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 24, color: '#D4B87A', fontWeight: 400, marginBottom: 20 }}>Mod de preparare</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {r.instructions.split('\n').filter(Boolean).map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}>
                        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 14, color: '#D4B87A' }}>{i + 1}</span>
                      </div>
                      <p style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 14, color: 'rgba(253,246,236,0.65)', lineHeight: 1.8, paddingTop: 4 }}>{step.replace(/^\d+\.\s*/, '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── BUTOANE ACȚIUNI ── */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.18), transparent)', margin: '40px 0 32px' }} />
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            {/* Cumpărături */}
            <button data-cursor onClick={() => setShowShop(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 99, cursor: 'none', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.28)', color: '#D4B87A', fontFamily: 'Jost, sans-serif', fontSize: 11, letterSpacing: '0.18em', transition: 'all 0.22s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.18)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.08)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.28)' }}>
              🛒 ADAUGĂ LA CUMPĂRĂTURI
            </button>
            {/* Gătește Acum */}
            {r.instructions && (
              <button data-cursor onClick={() => { setCookStep(0); setShowCook(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 99, cursor: 'none', background: 'linear-gradient(135deg, #D4B87A, #8B6914)', color: '#0C0806', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', border: 'none', transition: 'all 0.22s', boxShadow: '0 4px 24px rgba(212,184,122,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 32px rgba(212,184,122,0.4)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,184,122,0.25)'}>
                🔥 GĂTEȘTE ACUM
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ── MODAL CUMPĂRĂTURI ── */}
    {showShop && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ background: 'rgba(2,1,0,0.88)', backdropFilter: 'blur(24px)', padding: 32 }}
        onClick={() => setShowShop(false)}>
        <div onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 520, borderRadius: 28, background: 'linear-gradient(160deg, rgba(20,12,4,0.99), rgba(8,5,2,0.99))', border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', padding: '36px 40px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, letterSpacing: '0.32em', color: 'rgba(212,184,122,0.5)', marginBottom: 8 }}>LISTĂ DE CUMPĂRĂTURI</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 28, color: '#D4B87A', fontWeight: 300 }}>{r.name}</h3>
            </div>
            <button data-cursor onClick={() => setShowShop(false)} style={{ background: 'none', border: 'none', color: 'rgba(253,246,236,0.35)', fontSize: 20, cursor: 'none', padding: 4 }}>✕</button>
          </div>

          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(201,169,110,0.25), transparent)', marginBottom: 24 }} />

          {/* Lista ingrediente cu bifare */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24, maxHeight: 320, overflowY: 'auto' }}>
            {shopItems.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px', borderRadius: 12, background: item.checked ? 'rgba(143,175,138,0.06)' : 'rgba(253,246,236,0.03)', border: `1px solid ${item.checked ? 'rgba(143,175,138,0.2)' : 'rgba(253,246,236,0.07)'}`, transition: 'all 0.2s', cursor: 'none' }}
                data-cursor onClick={() => setShopItems(prev => prev.map((it, j) => j === i ? { ...it, checked: !it.checked } : it))}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${item.checked ? 'rgba(143,175,138,0.7)' : 'rgba(201,169,110,0.3)'}`, background: item.checked ? 'rgba(143,175,138,0.2)' : 'transparent', transition: 'all 0.2s' }}>
                  {item.checked && <span style={{ color: '#8FAF8A', fontSize: 10 }}>✓</span>}
                </div>
                <span style={{ flex: 1, fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 13, color: item.checked ? 'rgba(253,246,236,0.3)' : 'rgba(253,246,236,0.78)', transition: 'all 0.2s' }}>{item.name}</span>
                <button data-cursor onClick={e => { e.stopPropagation(); setShopItems(prev => prev.filter((_, j) => j !== i)) }}
                  style={{ background: 'none', border: 'none', color: 'rgba(220,100,100,0.3)', fontSize: 12, cursor: 'none', padding: '0 4px', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(220,100,100,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(220,100,100,0.3)'}>✕</button>
              </div>
            ))}
          </div>

          {/* Adaugă produs nou */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <input value={newShopItem} onChange={e => setNewShopItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newShopItem.trim()) { setShopItems(prev => [...prev, { id: Date.now(), name: newShopItem.trim(), checked: false }]); setNewShopItem('') }}}
              placeholder="Adaugă un produs..."
              style={{ flex: 1, background: 'rgba(253,246,236,0.04)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 10, padding: '10px 14px', color: '#FDF6EC', fontFamily: 'Jost, sans-serif', fontSize: 13, outline: 'none' }} />
            <button data-cursor onClick={() => { if (newShopItem.trim()) { setShopItems(prev => [...prev, { id: Date.now(), name: newShopItem.trim(), checked: false }]); setNewShopItem('') }}}
              style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)', color: '#D4B87A', fontFamily: 'Jost, sans-serif', fontSize: 11, cursor: 'none', letterSpacing: '0.1em' }}>
              + ADD
            </button>
          </div>

          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(201,169,110,0.15), transparent)', marginBottom: 20 }} />

          <button data-cursor onClick={saveToShoppingList}
            style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', cursor: 'none', background: shopSaved ? 'rgba(143,175,138,0.2)' : 'linear-gradient(135deg, #D4B87A, #8B6914)', color: shopSaved ? '#8FAF8A' : '#0C0806', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', transition: 'all 0.3s' }}>
            {shopSaved ? '✓ SALVAT ÎN MAGAZIN!' : '✓ SALVEAZĂ LISTA DE CUMPĂRĂTURI'}
          </button>
        </div>
      </div>
    )}

    {/* ── MODAL GĂTEȘTE ACUM ── */}
    {showCook && (
      <div className="fixed inset-0 z-[60]" style={{ fontFamily: 'Jost, sans-serif' }}>
        {/* Fundal bucătărie */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=90&auto=format&fit=crop"
            alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65) saturate(0.9)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,1,0,0.45) 0%, rgba(3,1,0,0.1) 40%, rgba(3,1,0,0.5) 100%)' }} />
        </div>

        {/* Conținut */}
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 60px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.4em', color: 'rgba(212,184,122,0.55)', marginBottom: 12 }}>MOD GĂTIT</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 42, color: '#D4B87A', fontWeight: 300, lineHeight: 1 }}>{r.name}</h2>
          </div>

          {/* Card pas curent */}
          <div style={{ width: '100%', maxWidth: 720, background: 'rgba(10,6,2,0.82)', backdropFilter: 'blur(32px)', border: '1px solid rgba(212,184,122,0.2)', borderRadius: 28, padding: '48px 56px', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', marginBottom: 36 }}>
            {/* Număr pas */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, #D4B87A)', boxShadow: '0 0 6px rgba(212,184,122,0.4)' }} />
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 56, color: '#D4B87A', lineHeight: 1, textShadow: '0 0 24px rgba(212,184,122,0.7), 0 0 48px rgba(212,184,122,0.3)' }}>{cookStep + 1}</span>
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: 'rgba(212,184,122,0.7)', letterSpacing: '0.2em' }}>/ {cookSteps.length}</span>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, #D4B87A, transparent)', boxShadow: '0 0 6px rgba(212,184,122,0.4)' }} />
            </div>

            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 34, color: 'rgba(253,246,236,0.95)', lineHeight: 1.65, fontWeight: 400, letterSpacing: '0.01em' }}>
              {cookSteps[cookStep]?.replace(/^\d+\.\s*/, '')}
            </p>
          </div>

          {/* Bara progres */}
          <div style={{ width: '100%', maxWidth: 720, height: 2, background: 'rgba(253,246,236,0.08)', borderRadius: 2, marginBottom: 36, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((cookStep + 1) / cookSteps.length) * 100}%`, background: 'linear-gradient(90deg, #C4788A, #C9A96E, #D4B87A)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>

          {/* Navigare */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button data-cursor onClick={() => setCookStep(s => Math.max(0, s - 1))}
              style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(212,184,122,0.3)', background: 'rgba(212,184,122,0.08)', color: '#D4B87A', fontSize: 20, cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', opacity: cookStep === 0 ? 0.3 : 1 }}
              onMouseEnter={e => { if (cookStep > 0) e.currentTarget.style.background = 'rgba(212,184,122,0.2)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,184,122,0.08)'}>
              ←
            </button>

            {cookStep < cookSteps.length - 1 ? (
              <button data-cursor onClick={() => setCookStep(s => s + 1)}
                style={{ padding: '14px 48px', borderRadius: 99, border: 'none', cursor: 'none', background: 'linear-gradient(135deg, #D4B87A, #8B6914)', color: '#0C0806', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(212,184,122,0.3)' }}>
                PASUL URMĂTOR →
              </button>
            ) : (
              <button data-cursor onClick={() => setShowCook(false)}
                style={{ padding: '14px 48px', borderRadius: 99, border: 'none', cursor: 'none', background: 'linear-gradient(135deg, #8FAF8A, #4A7A4A)', color: '#0C0806', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(143,175,138,0.3)' }}>
                ✓ REȚETĂ FINALIZATĂ!
              </button>
            )}

            <button data-cursor onClick={() => setCookStep(s => Math.min(cookSteps.length - 1, s + 1))}
              style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(212,184,122,0.3)', background: 'rgba(212,184,122,0.08)', color: '#D4B87A', fontSize: 20, cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', opacity: cookStep === cookSteps.length - 1 ? 0.3 : 1 }}
              onMouseEnter={e => { if (cookStep < cookSteps.length - 1) e.currentTarget.style.background = 'rgba(212,184,122,0.2)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,184,122,0.08)'}>
              →
            </button>
          </div>

          {/* Ingrediente în lateral */}
          {r.ingredients && (
            <div style={{ position: 'fixed', left: 40, top: '50%', transform: 'translateY(-50%)', width: 260, background: 'rgba(4,2,0,0.55)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: '24px 28px', border: '1px solid rgba(212,184,122,0.12)' }}>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, letterSpacing: '0.35em', color: 'rgba(212,184,122,0.7)', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid rgba(212,184,122,0.18)' }}>INGREDIENTE</div>
              {r.ingredients.split('\n').filter(Boolean).map((ing, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(212,184,122,0.6)', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, fontWeight: 400, color: 'rgba(253,246,236,0.92)', lineHeight: 1.45, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{ing}</span>
                </div>
              ))}
            </div>
          )}

          {/* Buton ieșire */}
          <button data-cursor onClick={() => setShowCook(false)}
            style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', padding: '10px 28px', borderRadius: 99, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)', fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.2em', cursor: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}>
            IEȘI
          </button>
        </div>
      </div>
    )}
    </>
  )
}
/* ══════════════════════════════════════════
   PAGINA PRINCIPALĂ
══════════════════════════════════════════ */
export default function RecipesPage({ auth }) {
  usePageTracking('retete')

  const [recipes, setRecipes]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [viewing, setViewing]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const searchRef               = useRef(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const token = getToken()
      // Rețetele proprii
      const res = await fetch(`${API}/api/recipes?token=${token}`)
      let own = []
      if (res.ok) {
        const data = await res.json()
        own = Array.isArray(data) ? data : (data.recipes || [])
      }
      // Rețetele salvate din Inspirație
      let saved = []
      try {
        const resSaved = await fetch(`${API}/api/saved_recipes?token=${token}`)
        if (resSaved.ok) {
          const dataSaved = await resSaved.json()
          saved = (Array.isArray(dataSaved) ? dataSaved : (dataSaved.recipes || []))
            .map(r => ({ ...r, is_saved: true }))
        }
      } catch(_) {}
      // Combinate — evită duplicate (dacă o rețetă proprie e și salvată)
      const ownIds = new Set(own.map(r => r.id))
      const unique = [...own, ...saved.filter(r => !ownIds.has(r.id))]
      setRecipes(unique)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  async function handleDelete(id, isSaved) {
    try {
      if (isSaved) {
        // Rețetă din Inspirație — scoate din favorite
        await fetch(`${API}/api/favorites/${id}?token=${getToken()}`, { method: 'DELETE' })
      } else {
        // Rețetă proprie — șterge complet
        await fetch(`${API}/api/recipes/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: getToken() }) })
      }
      setSelected(null)
      load()
    } catch(e) { console.error(e) }
  }

  function handleSearch() {
    searchRef.current?.focus()
  }

  const filtered = recipes.filter(r => {
    const matchSearch = !search.trim() ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.ingredients?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true : filter === 'saved' ? r.is_saved : !r.is_saved
    return matchSearch && matchFilter
  })

  const isEmpty = !loading && filtered.length === 0

  return (
    <div className="relative z-[2] w-full h-full flex flex-col pt-[88px] pb-[120px] px-[40px] overflow-y-auto"
      style={{ fontFamily: 'Jost, sans-serif' }}>

      {/* ── PAGE BACKGROUND ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <div style={{ position: 'absolute', inset: 0, background: '#080401' }}/>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=1920&q=90)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          opacity: 0.55,
        }}/>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(6,3,1,0.92) 0%, rgba(6,3,1,0.55) 18%, rgba(4,2,0,0.12) 50%, rgba(3,1,0,0.3) 100%)',
        }}/>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 90% 100% at 50% 50%, transparent 40%, rgba(2,1,0,0.7) 100%)',
        }}/>
      </div>



      {/* ── HEADER: TITLU STÂNGA + CĂUTARE DREAPTA ── */}
      <div className="w-full mb-[36px] flex items-center justify-between gap-[40px]">

        {/* Titlu stânga */}
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontStyle: 'italic',
          fontSize: 34,
          color: '#D4B87A',
          fontWeight: 400,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          Rețetele mele
        </h1>

        {/* Bara de căutare dreapta — lățime fixă */}
        <div className="relative w-[420px]">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchRef.current?.blur()}
            placeholder="Caută după ingredient, timp, ocazie..."
            className="w-full rounded-[14px] px-[20px] py-[14px] pr-[54px] text-[13px] outline-none cursor-none transition-all duration-300"
            style={{
              background: 'rgba(253,246,236,0.04)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(201,169,110,0.18)',
              color: '#FDF6EC',
              fontFamily: 'Jost, sans-serif',
              fontWeight: 300,
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(201,169,110,0.45)'; e.target.style.background = 'rgba(253,246,236,0.06)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(201,169,110,0.18)'; e.target.style.background = 'rgba(253,246,236,0.04)' }}
          />
          {/* Lupa clicabilă */}
          <button
            onClick={handleSearch}
            data-cursor
            className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] flex items-center justify-center rounded-[10px] cursor-none transition-all duration-200"
            style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.22)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.1)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)' }}
          >
            <SearchIcon size={15} color='rgba(201,169,110,0.85)' />
          </button>
        </div>
      </div>

      {/* ── BUTON FLOATING JOS CENTRAT ── */}
      <button
        onClick={() => setShowAdd(true)}
        data-cursor
        className="fixed bottom-[36px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-[10px] rounded-full px-[32px] py-[15px] text-[12px] tracking-[0.14em] font-medium cursor-none transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #D4B87A, #8B6914)',
          color: '#0C0806',
          fontFamily: 'Jost, sans-serif',
          boxShadow: '0 8px 32px rgba(139,105,20,0.45), 0 0 0 1px rgba(212,184,122,0.2)',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 48px rgba(139,105,20,0.65), 0 0 0 1px rgba(212,184,122,0.35)'; e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,105,20,0.45), 0 0 0 1px rgba(212,184,122,0.2)'; e.currentTarget.style.transform = 'translateX(-50%) translateY(0)' }}
      >
        <span style={{ fontSize: 18, fontWeight: 300, lineHeight: 1 }}>+</span>
        REȚETĂ NOUĂ
      </button>

      {/* ── CONȚINUT ── */}
      <div className="w-full flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-[80px]">
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#C9A96E', boxShadow: '0 0 10px #C9A96E',
              animation: 'pulse 1s ease-in-out infinite'
            }} />
          </div>
        ) : isEmpty ? (
          /* ── STARE GOALĂ — DOAR TEXT, FĂRĂ BUTON ── */
          <div className="flex flex-col items-center justify-center py-[80px] gap-[16px]">
            <div style={{ fontSize: 52, opacity: 0.4 }}>🍽️</div>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: 20,
              color: 'rgba(253,246,236,0.25)',
              textAlign: 'center',
            }}>
              {search.trim()
                ? `Nicio rețetă găsită pentru „${search}"`
                : filter === 'saved'
                  ? 'Nu ai rețete salvate din Inspirație'
                  : 'Nu ai rețete create încă'}
            </p>
            {!search.trim() && (
              <p style={{
                fontFamily: 'Jost, sans-serif',
                fontWeight: 300,
                fontSize: 13,
                color: 'rgba(253,246,236,0.18)',
                textAlign: 'center',
              }}>
                Folosește butonul de mai sus pentru a adăuga prima ta rețetă
              </p>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {filtered.map(r => <RecipeCard key={r.id} r={r} onClick={setViewing} onEdit={r => { setSelected(r) }} onDelete={handleDelete} />)}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {viewing && !selected && (
        <RecipeViewModal
          r={viewing}
          auth={auth}
          onClose={() => setViewing(null)}
          onEdit={() => { setSelected(viewing); setViewing(null) }}
        />
      )}

      {selected && (
        <RecipeModal
          r={selected}
          auth={auth}
          onClose={(refresh) => { setSelected(null); if (refresh) load() }}
          onDelete={(id, isSaved) => { handleDelete(id, isSaved); setViewing(null) }}
        />
      )}

      {showAdd && (
        <RecipeModal
          r={{
            id: null, name: '', description: '', ingredients: '', instructions: '',
            prep_time: 0, cook_time: 0, servings: 2, calories: 0, tags: '',
            image_url: '', category: 'toata_ziua', difficulty: 'mediu', is_public: 0
          }}
          auth={auth}
          onClose={(refresh) => { setShowAdd(false); if (refresh) load() }}
          onDelete={() => {}}
        />
      )}
    </div>
  )
}