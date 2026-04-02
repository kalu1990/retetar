import React, { useState, useEffect, useRef, useCallback } from 'react'
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
            style={{ transform: hov ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)', filter: (r.image_filter || '') + (hov ? ' brightness(0.9) saturate(1.15)' : ' brightness(0.8) saturate(1.0)') }} />
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

/* ── UNITS ── */
const UNITS = ['g','kg','ml','l','linguriță','lingură','cană','bucăți','pumn','legătură','felie','după gust','']

/* ── TRASH ICON MIC ── */
function TrashIconSm() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

/* ── TOOLTIP BUTTON ── */
function TipBtn({ onClick, tooltip, children, style, hoverStyle }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button data-cursor onClick={onClick}
        style={{ ...style, cursor: 'none' }}
        onMouseEnter={e => { setShow(true); Object.assign(e.currentTarget.style, hoverStyle) }}
        onMouseLeave={e => { setShow(false); Object.assign(e.currentTarget.style, style) }}>
        {children}
      </button>
      {show && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: 'rgba(12,8,4,0.95)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 8, padding: '4px 10px', whiteSpace: 'nowrap', fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(253,246,236,0.8)', pointerEvents: 'none', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}

/* ── INGREDIENT BUILDER ── */
function IngredientBuilder({ value, onChange }) {
  const parseRows = (text) => {
    if (!text) return [{ id: Date.now(), qty: 0.1, unit: 'g', name: '' }]
    return text.split('\n').filter(Boolean).map((line, i) => {
      const m = line.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZăîâșțĂÎÂȘȚ]+)?\s+(.+)$/)
      if (m) return { id: i + 1, qty: parseFloat(m[1].replace(',', '.')), unit: UNITS.includes(m[2]) ? m[2] : 'g', name: m[3] || '' }
      return { id: i + 1, qty: 0.1, unit: 'g', name: line }
    })
  }

  const [rows, setRows] = useState(() => parseRows(value))
  const [openUnit, setOpenUnit] = useState(null)

  const round1 = (v) => Math.round(v * 10) / 10

  const sync = (newRows) => {
    setRows(newRows)
    onChange(newRows.filter(r => r.name.trim()).map(r =>
      r.unit === 'după gust' ? `${r.name}` : `${r.qty} ${r.unit} ${r.name}`
    ).join('\n'))
  }

  const upd = (id, key, val) => sync(rows.map(r => r.id === id ? { ...r, [key]: val } : r))
  const addAfter = (id) => {
    const idx = rows.findIndex(r => r.id === id)
    const newRows = [...rows]
    newRows.splice(idx + 1, 0, { id: Date.now(), qty: 0.1, unit: 'g', name: '' })
    sync(newRows)
  }
  const del = (id) => { if (rows.length > 1) sync(rows.filter(r => r.id !== id)) }

  const btnBase = { width: 30, height: 30, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 10, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,169,110,0.6)', fontFamily: 'Jost, sans-serif' }}>INGREDIENTE</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row, idx) => (
          <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeUp 0.2s ease-out both' }}>

            {/* Index */}
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: 'rgba(201,169,110,0.35)', width: 14, flexShrink: 0, textAlign: 'right' }}>{idx + 1}</span>

            {/* Cantitate stepper */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(253,246,236,0.05)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
              <button data-cursor onClick={() => upd(row.id, 'qty', round1(Math.max(0.1, row.qty - 0.1)))}
                style={{ width: 26, height: 34, background: 'none', border: 'none', color: 'rgba(201,169,110,0.6)', fontSize: 14, cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = '#D4B87A'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,169,110,0.6)'}>−</button>
              <span style={{ minWidth: 36, textAlign: 'center', fontFamily: 'Jost, sans-serif', fontSize: 12, color: '#FDF6EC' }}>
                {row.qty % 1 === 0 ? row.qty : row.qty.toFixed(1)}
              </span>
              <button data-cursor onClick={() => upd(row.id, 'qty', round1(row.qty + 0.1))}
                style={{ width: 26, height: 34, background: 'none', border: 'none', color: 'rgba(201,169,110,0.6)', fontSize: 14, cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = '#D4B87A'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,169,110,0.6)'}>+</button>
            </div>

            {/* Unitate */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button data-cursor onClick={() => setOpenUnit(openUnit === row.id ? null : row.id)}
                style={{ height: 34, padding: '0 10px', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)', borderRadius: 10, color: '#D4B87A', fontFamily: 'Jost, sans-serif', fontSize: 11, cursor: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,169,110,0.1)'}>
                {row.unit || '—'} <span style={{ fontSize: 7, opacity: 0.5 }}>▾</span>
              </button>
              {openUnit === row.id && (
                <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 999, background: 'rgba(14,9,4,0.98)', border: '1px solid rgba(201,169,110,0.22)', borderRadius: 12, padding: '6px 0', minWidth: 120, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                  {UNITS.map(u => (
                    <div key={u} data-cursor onClick={() => { upd(row.id, 'unit', u); setOpenUnit(null) }}
                      style={{ padding: '8px 14px', fontFamily: 'Jost, sans-serif', fontSize: 12, color: row.unit === u ? '#D4B87A' : 'rgba(253,246,236,0.75)', cursor: 'none', background: row.unit === u ? 'rgba(201,169,110,0.1)' : 'transparent', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,0.15)'} onMouseLeave={e => e.currentTarget.style.background = row.unit === u ? 'rgba(201,169,110,0.1)' : 'transparent'}>
                      {u || '—'}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nume */}
            <input value={row.name} onChange={e => upd(row.id, 'name', e.target.value)} placeholder="ingredient..."
              style={{ flex: 1, height: 34, background: 'rgba(253,246,236,0.05)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 10, padding: '0 12px', color: '#FDF6EC', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, outline: 'none', cursor: 'text', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.55)'} onBlur={e => e.target.style.borderColor = 'rgba(201,169,110,0.2)'} />

            {/* + ingredient nou după această linie */}
            <TipBtn onClick={() => addAfter(row.id)} tooltip="Adaugă ingredient"
              style={{ ...btnBase, background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)', color: 'rgba(201,169,110,0.7)', fontSize: 18 }}
              hoverStyle={{ background: 'rgba(201,169,110,0.22)', color: '#D4B87A', border: '1px solid rgba(201,169,110,0.5)' }}>
              +
            </TipBtn>

            {/* Șterge */}
            <TipBtn onClick={() => del(row.id)} tooltip="Șterge ingredient"
              style={{ ...btnBase, background: 'rgba(180,30,30,0.18)', border: '1px solid rgba(200,60,60,0.3)', color: 'rgba(255,100,100,0.6)' }}
              hoverStyle={{ background: 'rgba(180,30,30,0.5)', color: '#FF7070', border: '1px solid rgba(220,80,80,0.6)' }}>
              <TrashIconSm />
            </TipBtn>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── STEP BUILDER ── */
function StepBuilder({ value, onChange }) {
  const parseSteps = (text) => {
    if (!text) return [{ id: Date.now(), text: '' }]
    return text.split('\n').filter(Boolean).map((line, i) => ({
      id: i + 1,
      text: line.replace(/^\d+\.\s*/, '')
    }))
  }

  const [steps, setSteps] = useState(() => parseSteps(value))

  const sync = (newSteps) => {
    setSteps(newSteps)
    onChange(newSteps.filter(s => s.text.trim()).map((s, i) => `${i + 1}. ${s.text}`).join('\n'))
  }

  const upd = (id, val) => sync(steps.map(s => s.id === id ? { ...s, text: val } : s))
  const addAfter = (id) => {
    const idx = steps.findIndex(s => s.id === id)
    const newSteps = [...steps]
    newSteps.splice(idx + 1, 0, { id: Date.now(), text: '' })
    sync(newSteps)
  }
  const del = (id) => { if (steps.length > 1) sync(steps.filter(s => s.id !== id)) }

  const btnBase = { width: 30, height: 30, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 10, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(201,169,110,0.6)', fontFamily: 'Jost, sans-serif' }}>MOD DE PREPARARE</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((step, idx) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, animation: 'fadeUp 0.2s ease-out both' }}>

            {/* Număr */}
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 7 }}>
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: '#D4B87A', fontWeight: 600 }}>{idx + 1}</span>
            </div>

            {/* Text */}
            <textarea value={step.text} onChange={e => upd(step.id, e.target.value)} placeholder="Descrie acest pas..."
              rows={2}
              style={{ flex: 1, background: 'rgba(253,246,236,0.05)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 10, padding: '8px 12px', color: '#FDF6EC', fontFamily: 'Jost, sans-serif', fontSize: 13, outline: 'none', resize: 'vertical', cursor: 'text', transition: 'border-color 0.2s', minHeight: 40, lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.55)'} onBlur={e => e.target.style.borderColor = 'rgba(201,169,110,0.2)'} />

            {/* + pas nou după */}
            <TipBtn onClick={() => addAfter(step.id)} tooltip="Adaugă pas"
              style={{ ...btnBase, background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)', color: 'rgba(201,169,110,0.7)', fontSize: 18, marginTop: 4 }}
              hoverStyle={{ background: 'rgba(201,169,110,0.22)', color: '#D4B87A', border: '1px solid rgba(201,169,110,0.5)', marginTop: 4 }}>
              +
            </TipBtn>

            {/* Șterge */}
            <TipBtn onClick={() => del(step.id)} tooltip="Șterge pas"
              style={{ ...btnBase, background: 'rgba(180,30,30,0.18)', border: '1px solid rgba(200,60,60,0.3)', color: 'rgba(255,100,100,0.6)', marginTop: 4 }}
              hoverStyle={{ background: 'rgba(180,30,30,0.5)', color: '#FF7070', border: '1px solid rgba(220,80,80,0.6)', marginTop: 4 }}>
              <TrashIconSm />
            </TipBtn>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── IMAGE EDITOR ── */

/* ── WEBGL SHADERS ── */
const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main(){v_uv=a_pos*.5+.5;gl_Position=vec4(a_pos,0.,1.);}
`

const FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_imgSz;
uniform vec2 u_cvSz;
uniform float u_zoom;
uniform vec2 u_off;
uniform float u_br,u_co,u_sa,u_hu,u_te,u_ti,u_cl,u_vi,u_shW,u_hiW;
varying vec2 v_uv;

float h2r(float p,float q,float t){
  if(t<0.)t+=1.;if(t>1.)t-=1.;
  if(t<1./6.)return p+(q-p)*6.*t;
  if(t<.5)return q;
  if(t<2./3.)return p+(q-p)*(2./3.-t)*6.;
  return p;
}
vec3 rgb2hsl(vec3 c){
  float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b));
  float l=(mx+mn)/2.;
  if(mx==mn)return vec3(0.,0.,l);
  float d=mx-mn,s=l>.5?d/(2.-mx-mn):d/(mx+mn),h;
  if(mx==c.r)h=(c.g-c.b)/d+(c.g<c.b?6.:0.);
  else if(mx==c.g)h=(c.b-c.r)/d+2.;
  else h=(c.r-c.g)/d+4.;
  return vec3(h/6.,s,l);
}
vec3 hsl2rgb(vec3 h){
  if(h.y==0.)return vec3(h.z);
  float q=h.z<.5?h.z*(1.+h.y):h.z+h.y-h.z*h.y,p=2.*h.z-q;
  return vec3(h2r(p,q,h.x+1./3.),h2r(p,q,h.x),h2r(p,q,h.x-1./3.));
}

void main(){
  /* Pan/Zoom UV */
  float sc=max(u_cvSz.x/u_imgSz.x,u_cvSz.y/u_imgSz.y)*u_zoom;
  vec2 ic=u_imgSz*sc;
  vec2 iPos=v_uv*u_cvSz-(u_cvSz-ic)*.5-u_off;
  vec2 uv=iPos/ic;
  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){
    gl_FragColor=vec4(.012,.008,.004,1.);return;
  }
  uv.y=1.-uv.y;
  vec3 c=texture2D(u_tex,uv).rgb;

  /* Clarity — weighted unsharp mask on midtones */
  vec2 px=1./u_imgSz;
  vec3 bl=vec3(0.);float tw=0.;
  for(int i=-2;i<=2;i++)for(int j=-2;j<=2;j++){
    float w=1./(1.+float(i*i+j*j));
    bl+=texture2D(u_tex,clamp(uv+vec2(float(i),float(j))*px*5.,0.,1.)).rgb*w;
    tw+=w;
  }
  bl/=tw;
  float lm=dot(c,vec3(.299,.587,.114));
  float mm=4.*lm*(1.-lm);
  c=clamp(c+(c-bl)*u_cl*mm*2.5,0.,1.);

  /* Temperature (blue-amber) */
  c.r+=u_te*.14;c.g+=u_te*.03;c.b-=u_te*.14;
  /* Tint (green-magenta) */
  c.g+=u_ti*.09;c.r-=u_ti*.025;c.b-=u_ti*.025;
  c=clamp(c,0.,1.);

  /* Saturation + Hue via HSL */
  vec3 hsl=rgb2hsl(c);
  hsl.y=clamp(hsl.y*(1.+u_sa),0.,1.);
  hsl.x=fract(hsl.x+u_hu/360.);
  c=clamp(hsl2rgb(hsl),0.,1.);

  /* Brightness (exposure-style, multiplicative feels more natural) */
  c=clamp(c*(1.+u_br)+u_br*.1,0.,1.);

  /* Contrast (S-curve) */
  if(abs(u_co)>.001){
    float k=1.+u_co*1.8;
    c=clamp((c-.5)*k+.5,0.,1.);
  }

  /* Split Toning — warm/cool in shadows vs highlights */
  float lum=dot(c,vec3(.2126,.7152,.0722));
  float shMask=clamp(1.-lum*2.2,0.,1.);
  float hiMask=clamp(lum*2.2-1.,0.,1.);
  /* Shadow warmth: positive=warm(amber), negative=cool(blue) */
  vec3 shColor=u_shW>0.?vec3(u_shW*.06,u_shW*.02,0.):vec3(0.,0.,-u_shW*.06);
  /* Highlight warmth: positive=warm, negative=cool */
  vec3 hiColor=u_hiW>0.?vec3(u_hiW*.05,u_hiW*.025,0.):vec3(0.,0.,-u_hiW*.05);
  c=clamp(c+shColor*shMask+hiColor*hiMask,0.,1.);

  /* Vignette */
  vec2 vp=v_uv-.5;
  c*=1.-u_vi*smoothstep(.28,.95,length(vp)*1.55);

  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}
`

/* ── FILTRE WebGL — tuned pentru fotografia de mâncare ── */
const FILTERS = [
  { name:'Original',     br:0,     co:0,    sa:0,    hu:0,   te:0,    ti:0,   cl:0,   vi:0,   shW:0,   hiW:0   },
  { name:'Apetisant',    br:0.06,  co:0.18, sa:0.42, hu:0,   te:0.35, ti:0,   cl:0.28, vi:0.12, shW:0.3, hiW:0.2 },
  { name:'Auriu',        br:0.09,  co:0.14, sa:0.28, hu:-5,  te:0.55, ti:0.1, cl:0.18, vi:0.22, shW:0.5, hiW:0.4 },
  { name:'Crocant',      br:0.04,  co:0.42, sa:0.25, hu:0,   te:0.18, ti:0,   cl:0.5,  vi:0.16, shW:0.2, hiW:0.1 },
  { name:'Proaspăt',     br:0.12,  co:0.08, sa:0.52, hu:9,   te:-0.1, ti:0,   cl:0.22, vi:0.06, shW:-0.1,hiW:0   },
  { name:'Restaurant',   br:-0.08, co:0.48, sa:0.12, hu:0,   te:0.08, ti:0,   cl:0.32, vi:0.38, shW:0,   hiW:0.1 },
  { name:'Rustic',       br:0.02,  co:0.18, sa:-0.1, hu:-5,  te:0.48, ti:0,   cl:0.22, vi:0.32, shW:0.6, hiW:0.4 },
  { name:'Mediteranean', br:0.07,  co:0.12, sa:0.2,  hu:6,   te:0.28, ti:0.05,cl:0.16, vi:0.16, shW:0.2, hiW:0.15},
  { name:'Brutărie',     br:0.1,   co:0.06, sa:0.1,  hu:-4,  te:0.42, ti:0,   cl:0.12, vi:0.12, shW:0.55,hiW:0.3 },
  { name:'Stradal',      br:0.05,  co:0.24, sa:0.72, hu:0,   te:0.15, ti:0,   cl:0.32, vi:0.05, shW:0.1, hiW:0.1 },
  { name:'Fine Dining',  br:-0.07, co:0.52, sa:-0.08,hu:0,   te:-0.12,ti:0,   cl:0.38, vi:0.42, shW:-0.2,hiW:0.1 },
  { name:'Vară',         br:0.13,  co:0.1,  sa:0.62, hu:7,   te:0.18, ti:0,   cl:0.16, vi:0.05, shW:0,   hiW:0.2 },
  { name:'Toamnă',       br:0.03,  co:0.16, sa:0.18, hu:-9,  te:0.52, ti:0,   cl:0.22, vi:0.26, shW:0.6, hiW:0.35},
  { name:'Bistro',       br:0.07,  co:0.13, sa:0.05, hu:-2,  te:0.32, ti:0,   cl:0.12, vi:0.2,  shW:0.35,hiW:0.2 },
  { name:'Natural',      br:0.08,  co:-0.04,sa:0.1,  hu:0,   te:0.05, ti:0,   cl:0.06, vi:0,    shW:0,   hiW:0   },
  { name:'Grătar',       br:-0.02, co:0.32, sa:0.28, hu:-7,  te:0.42, ti:0,   cl:0.38, vi:0.28, shW:0.5, hiW:0.2 },
  { name:'Patiserie',    br:0.12,  co:0.08, sa:0.18, hu:-14, te:0.38, ti:0.12,cl:0.1,  vi:0.1,  shW:0.4, hiW:0.3 },
  { name:'Picant',       br:0.03,  co:0.3,  sa:0.58, hu:-13, te:0.48, ti:0,   cl:0.32, vi:0.22, shW:0.6, hiW:0.1 },
  { name:'Organic',      br:0.07,  co:-0.02,sa:-0.04,hu:10,  te:-0.05,ti:0,   cl:0.08, vi:0,    shW:-0.1,hiW:0   },
  { name:'Luxos',        br:-0.05, co:0.32, sa:-0.1, hu:178, te:-0.18,ti:0,   cl:0.28, vi:0.48, shW:-0.3,hiW:-0.1},
]

/* thumbnail approximation CSS pentru preview miniatural */
function filterThumbCSS(f) {
  return [
    `brightness(${(1+f.br*1.5).toFixed(2)})`,
    `contrast(${(1+f.co).toFixed(2)})`,
    `saturate(${Math.max(0,1+f.sa).toFixed(2)})`,
    f.hu!==0?`hue-rotate(${f.hu}deg)`:'',
    f.te>0?`sepia(${(f.te*.28).toFixed(2)})`:'',
  ].filter(Boolean).join(' ')
}

/* ── IMAGE EDITOR WebGL ── */
function ImageEditor({ src, form, onApply, onClose }) {
  const canvasRef = useRef(null)
  const glRef     = useRef(null)
  const progRef   = useRef(null)
  const texRef    = useRef(null)
  const uRef      = useRef({})
  const imgSzRef  = useRef([1,1])
  const dragRef   = useRef({ active:false, startX:0, startY:0, ox:0, oy:0 })
  const adjRef    = useRef(null)
  const zoomRef   = useRef(1)
  const offRef    = useRef({x:0,y:0})

  const [filter,      setFilter]      = useState(FILTERS[0])
  const [adj,         setAdj]         = useState({ br:0, co:0, sa:0, hu:0, te:0, ti:0, cl:0, vi:0, shW:0, hiW:0 })
  const [zoom,        setZoom]        = useState(1)
  const [offset,      setOffset]      = useState({ x:0, y:0 })
  const [previewMode, setPreviewMode] = useState(true)
  const [showLeft,    setShowLeft]    = useState(false)
  const [showRight,   setShowRight]   = useState(false)
  const [ready,       setReady]       = useState(false)
  const [editedThumb, setEditedThumb] = useState(null)

  /* sync refs */
  useEffect(()=>{ adjRef.current=adj },[adj])
  useEffect(()=>{ zoomRef.current=zoom },[zoom])
  useEffect(()=>{ offRef.current=offset },[offset])

  /* Init WebGL */
  useEffect(()=>{
    const canvas = canvasRef.current
    if(!canvas) return
    canvas.width  = canvas.offsetWidth  || window.innerWidth
    canvas.height = canvas.offsetHeight || window.innerHeight

    const gl = canvas.getContext('webgl',{ preserveDrawingBuffer:true, antialias:true, alpha:false })
    if(!gl){ console.error('WebGL indisponibil'); return }
    glRef.current = gl

    const compile = (type, src) => {
      const sh = gl.createShader(type)
      gl.shaderSource(sh, src); gl.compileShader(sh)
      if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh))
      return sh
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    gl.attachShader(prog,vs); gl.attachShader(prog,fs); gl.linkProgram(prog)
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return }
    progRef.current = prog
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog,'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0)

    const u = uRef.current
    ;['tex','imgSz','cvSz','zoom','off','br','co','sa','hu','te','ti','cl','vi','shW','hiW'].forEach(n=>{
      u[n] = gl.getUniformLocation(prog,'u_'+n)
    })

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    texRef.current = tex

    const img = new window.Image()
    img.onload = ()=>{
      imgSzRef.current = [img.naturalWidth, img.naturalHeight]
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img)
      setReady(true)
    }
    img.src = src
    return ()=>{ gl.deleteProgram(prog); gl.deleteTexture(tex); gl.deleteBuffer(buf) }
  },[src])

  const renderGL = useCallback(()=>{
    const gl = glRef.current
    const canvas = canvasRef.current
    if(!gl||!canvas||!ready) return
    const u = uRef.current
    const a = adjRef.current || adj
    const z = zoomRef.current
    const o = offRef.current
    const [iw,ih] = imgSzRef.current
    gl.viewport(0,0,canvas.width,canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1i(u.tex,0)
    gl.uniform2f(u.imgSz,iw,ih)
    gl.uniform2f(u.cvSz,canvas.width,canvas.height)
    gl.uniform1f(u.zoom,z)
    gl.uniform2f(u.off,o.x,o.y)
    gl.uniform1f(u.br,a.br); gl.uniform1f(u.co,a.co); gl.uniform1f(u.sa,a.sa)
    gl.uniform1f(u.hu,a.hu); gl.uniform1f(u.te,a.te); gl.uniform1f(u.ti,a.ti)
    gl.uniform1f(u.cl,a.cl); gl.uniform1f(u.vi,a.vi)
    gl.uniform1f(u.shW,a.shW); gl.uniform1f(u.hiW,a.hiW)
    gl.drawArrays(gl.TRIANGLES,0,6)
  },[ready])

  useEffect(()=>{ renderGL() },[adj,zoom,offset,ready,renderGL])

  // Captură thumbnail "Editat" după render
  useEffect(()=>{
    if(!ready) return
    const t = setTimeout(()=>{
      const canvas = canvasRef.current
      if(canvas) setEditedThumb(canvas.toDataURL('image/jpeg', 0.6))
    }, 120)
    return ()=>clearTimeout(t)
  },[adj,zoom,offset,ready])

  useEffect(()=>{
    const canvas = canvasRef.current
    if(!canvas) return
    const resize = ()=>{ canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; renderGL() }
    resize()
    window.addEventListener('resize',resize)
    return ()=>window.removeEventListener('resize',resize)
  },[renderGL])

  const selectFilter = (f) => {
    setFilter(f)
    setAdj({ br:f.br, co:f.co, sa:f.sa, hu:f.hu, te:f.te, ti:f.ti, cl:f.cl, vi:f.vi, shW:f.shW, hiW:f.hiW })
  }

  const exportEdited = () => {
    const a = adjRef.current || adj
    const f = filter
    const parts = []
    if (f.css) parts.push(f.css)
    parts.push(`brightness(${(1 + a.br * 1.5).toFixed(2)})`)
    parts.push(`contrast(${(1 + a.co).toFixed(2)})`)
    parts.push(`saturate(${Math.max(0, 1 + a.sa).toFixed(2)})`)
    if (a.hu !== 0) parts.push(`hue-rotate(${a.hu}deg)`)
    if (a.te > 0) parts.push(`sepia(${(a.te * 0.28).toFixed(2)})`)
    if (a.bl > 0) parts.push(`blur(${a.bl}px)`)
    const filterStr = parts.filter(Boolean).join(' ')

    const img = new window.Image()
    img.onload = () => {
      const maxDim = 1200
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1)
      const w = Math.round(img.naturalWidth * scale) || 800
      const h = Math.round(img.naturalHeight * scale) || 600
      const cv = document.createElement('canvas')
      cv.width = w; cv.height = h
      const ctx = cv.getContext('2d')
      if (filterStr) ctx.filter = filterStr
      ctx.drawImage(img, 0, 0, w, h)
      try {
        const dataUrl = cv.toDataURL('image/jpeg', 0.9)
        window.dispatchEvent(new CustomEvent('imgEditorApply', { detail: dataUrl && dataUrl.length > 100 ? dataUrl : src }))
      } catch(err) {
        window.dispatchEvent(new CustomEvent('imgEditorApply', { detail: src }))
      }
      onClose()
    }
    img.onerror = () => { window.dispatchEvent(new CustomEvent('imgEditorApply', { detail: src })); onClose() }
    img.src = src
  }

  const reset = () => { setZoom(1); setOffset({x:0,y:0}); selectFilter(FILTERS[0]) }

  const onMouseDown=(e)=>{ if(e.target.closest('[data-nopan]')||e.target.closest('button')||e.target.closest('input')||e.target.tagName==='BUTTON'||e.target.tagName==='INPUT') return; dragRef.current={active:true,startX:e.clientX,startY:e.clientY,ox:offset.x,oy:offset.y} }
  const onMouseMove=(e)=>{ if(!dragRef.current.active)return; setOffset({x:dragRef.current.ox+e.clientX-dragRef.current.startX,y:dragRef.current.oy-(e.clientY-dragRef.current.startY)}) }
  const onMouseUp=()=>{ dragRef.current.active=false }
  const onWheel=(e)=>{ if(e.target.closest('[data-nopan]')||e.target.closest('button')||e.target.closest('input')) return; e.preventDefault(); setZoom(z=>Math.min(5,Math.max(0.2,z-e.deltaY*.001))) }

  const totalTime = (form?.prep_time||0)+(form?.cook_time||0)
  const catLabel  = {mic_dejun:'MIC DEJUN',pranz:'PRÂNZ',cina:'CINĂ',toata_ziua:'TOATĂ ZIUA'}[form?.category]||'REȚETĂ'
  const DIFF_LBL  = {usor:'Ușor',mediu:'Mediu',greu:'Greu'}
  const heroStats = [totalTime>0&&{label:'TIMP',value:`${totalTime}`,unit:'min'},form?.servings&&{label:'PORȚII',value:`${form.servings}`,unit:'pers'},form?.difficulty&&{label:'NIVEL',value:DIFF_LBL[form.difficulty]||'',unit:''}].filter(Boolean)

  const sliders = [
    {key:'br',  label:'Luminozitate',  min:-0.5,  max:0.5,  step:0.01, def:0, group:'De bază'},
    {key:'co',  label:'Contrast',      min:-0.8,  max:0.8,  step:0.01, def:0, group:'De bază'},
    {key:'sa',  label:'Saturație',     min:-1,    max:1,    step:0.01, def:0, group:'De bază'},
    {key:'te',  label:'Temperatură',   min:-1,    max:1,    step:0.01, def:0, group:'Culoare'},
    {key:'ti',  label:'Tint',          min:-0.5,  max:0.5,  step:0.01, def:0, group:'Culoare'},
    {key:'hu',  label:'Nuanță',        min:-180,  max:180,  step:1,    def:0, group:'Culoare'},
    {key:'cl',  label:'Clarity',       min:-0.5,  max:1,    step:0.01, def:0, group:'Detalii'},
    {key:'vi',  label:'Vignetă',       min:0,     max:1,    step:0.01, def:0, group:'Detalii'},
    {key:'shW', label:'Umbre calde',   min:-1,    max:1,    step:0.01, def:0, group:'Split Tone'},
    {key:'hiW', label:'Lumini calde',  min:-1,    max:1,    step:0.01, def:0, group:'Split Tone'},
  ]

  const groups = [...new Set(sliders.map(s=>s.group))]

  const fmtVal = (s) => {
    const v = adj[s.key]
    if(s.key==='hu') return `${v>0?'+':''}${v}°`
    if(s.key==='vi'||s.key==='cl') return `${Math.round(v*100)}%`
    return `${v>0?'+':''}${v.toFixed(2)}`
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,overflow:'hidden',cursor:previewMode?'default':'grab'}}
      onMouseDown={previewMode?undefined:onMouseDown}
      onMouseMove={previewMode?undefined:onMouseMove}
      onMouseUp={previewMode?undefined:onMouseUp}
      onMouseLeave={previewMode?undefined:onMouseUp}
      onWheel={previewMode?undefined:onWheel}>
      <style>{`
        .ie-sl{-webkit-appearance:none;appearance:none;height:3px;border-radius:99px;outline:none;cursor:pointer;width:100%}
        .ie-sl::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:#D4B87A;box-shadow:0 0 8px rgba(212,184,122,0.65);cursor:pointer}
        .ie-ft{transition:all .18s;border:1.5px solid rgba(201,169,110,.12);cursor:pointer;border-radius:8px;overflow:hidden;position:relative}
        .ie-ft:hover{border-color:rgba(212,184,122,.55)!important;transform:scale(1.04)}
        .ie-ft.sel{border-color:#D4B87A!important;box-shadow:0 0 12px rgba(212,184,122,.45)}
        .ie-wrap .ie-btns{opacity:0;transition:opacity .35s}
        .ie-wrap:hover .ie-btns{opacity:1}
        .ie-btn{cursor:none!important;transition:all .15s ease;user-select:none;outline:none;position:relative;z-index:30}
        .ie-btn:hover{transform:translateY(-2px);box-shadow:0 4px 20px rgba(0,0,0,0.4)}
        .ie-btn:active{transform:translateY(0px);filter:brightness(0.9)}
        .ie-btn-gold:hover{box-shadow:0 6px 28px rgba(212,184,122,0.65)!important;filter:brightness(1.1)}
      `}</style>

      {/* WebGL CANVAS */}
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',display:'block'}} />

      {/* GRADIENTE HEROPAGE */}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(105deg,rgba(3,1,0,.92) 0%,rgba(3,1,0,.76) 20%,rgba(3,1,0,.35) 42%,rgba(3,1,0,.05) 62%,transparent 78%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(3,1,0,1) 0%,rgba(3,1,0,.82) 10%,rgba(3,1,0,.3) 25%,transparent 46%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(3,1,0,.5) 0%,transparent 16%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 72% 50%,transparent 30%,rgba(1,0,0,.42) 100%)',pointerEvents:'none'}}/>

      {/* HERO CONTENT */}
      <div style={{position:'absolute',left:(!previewMode&&showLeft)?216:64,top:0,bottom:0,display:'flex',flexDirection:'column',justifyContent:'center',maxWidth:440,zIndex:10,pointerEvents:'none',transition:'left .3s ease'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <div style={{width:32,height:1,background:'linear-gradient(90deg,transparent,#C9A96E)'}}/>
          <span style={{fontFamily:'Jost,sans-serif',fontSize:8,letterSpacing:'.44em',color:'rgba(201,169,110,.7)'}}>{catLabel}</span>
        </div>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontStyle:'italic',fontWeight:700,fontSize:'clamp(44px,5vw,72px)',lineHeight:1.02,letterSpacing:'-.028em',color:'#D4B87A',textShadow:'0 0 60px rgba(201,169,110,.35),0 2px 4px rgba(0,0,0,.3)',marginBottom:14}}>
          {form?.name||'Numele rețetei'}
        </h1>
        <div style={{width:48,height:1.5,borderRadius:2,marginBottom:18,background:'linear-gradient(90deg,#C9A96E,rgba(201,169,110,0))',boxShadow:'0 0 14px rgba(201,169,110,.55)'}}/>
        {form?.description&&<p style={{fontFamily:'Jost,sans-serif',fontWeight:300,fontSize:13,lineHeight:1.8,color:'rgba(253,246,236,.42)',maxWidth:320,marginBottom:26}}>{form.description}</p>}
        <div style={{display:'inline-flex',marginBottom:26}}>
          <div style={{padding:'13px 40px',background:'linear-gradient(135deg,#E8C87E,#D4B87A,#C9A96E,#B8925A)',borderRadius:3,color:'#0A0600',fontFamily:'Jost,sans-serif',fontSize:9,fontWeight:700,letterSpacing:'.3em',opacity:.9}}>SPRE REȚETĂ →</div>
        </div>
        {heroStats.length>0&&(
          <div style={{display:'flex',paddingTop:18,borderTop:'1px solid rgba(201,169,110,.12)'}}>
            {heroStats.map((s,i,arr)=>(
              <div key={i} style={{flex:1,paddingRight:i<arr.length-1?16:0,marginRight:i<arr.length-1?16:0,borderRight:i<arr.length-1?'1px solid rgba(201,169,110,.1)':'none'}}>
                <div style={{fontFamily:'Jost,sans-serif',fontSize:7,letterSpacing:'.32em',color:'rgba(201,169,110,.42)',marginBottom:5}}>{s.label}</div>
                <div style={{display:'flex',alignItems:'baseline',gap:3}}>
                  <span style={{fontFamily:'Cormorant Garamond,serif',fontStyle:'italic',fontWeight:700,fontSize:20,color:'rgba(253,246,236,.88)',lineHeight:1}}>{s.value}</span>
                  {s.unit&&<span style={{fontFamily:'Jost,sans-serif',fontSize:8,color:'rgba(201,169,110,.38)'}}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PREVIEW MODE */}
      {previewMode&&(
        <div className="ie-wrap" style={{position:'absolute',inset:0,zIndex:20}}>
          <div className="ie-btns" style={{position:'absolute',bottom:32,right:32,display:'flex',gap:10}}>
            <button data-cursor className="ie-btn" onClick={(e)=>{e.stopPropagation();onClose()}}
              style={{padding:'13px 28px',borderRadius:99,background:'rgba(0,0,0,.55)',border:'1px solid rgba(255,255,255,.18)',color:'rgba(255,255,255,.7)',fontFamily:'Jost,sans-serif',fontSize:10,letterSpacing:'.15em'}}>
              ANULEAZĂ
            </button>
            <button data-cursor className="ie-btn" onClick={(e)=>{e.stopPropagation();setPreviewMode(false)}}
              style={{padding:'13px 28px',borderRadius:99,background:'rgba(0,0,0,.55)',border:'1px solid rgba(212,184,122,.4)',color:'rgba(212,184,122,.9)',fontFamily:'Jost,sans-serif',fontSize:10,letterSpacing:'.15em'}}>
              ✦ EDITEAZĂ FOTO
            </button>
            <button data-cursor className="ie-btn ie-btn-gold" onClick={(e)=>{e.stopPropagation();exportEdited()}}
              style={{padding:'13px 36px',borderRadius:99,background:'linear-gradient(135deg,#D4B87A,#8B6914)',color:'#0C0806',fontFamily:'Jost,sans-serif',fontSize:10,fontWeight:700,letterSpacing:'.18em',border:'none',boxShadow:'0 2px 22px rgba(212,184,122,.5)'}}>
              ✓ SALVEAZĂ
            </button>
          </div>
        </div>
      )}

      {/* EDITOR MODE */}
      {!previewMode&&(<>
        {/* TOPBAR */}
        <div data-nopan style={{position:'absolute',top:56,left:0,right:0,height:48,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',zIndex:50,background:'linear-gradient(180deg,rgba(3,1,0,.78) 0%,transparent 100%)',backdropFilter:'blur(4px)',pointerEvents:'all'}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <span style={{fontFamily:'Cormorant Garamond,serif',fontStyle:'italic',fontSize:18,color:'#D4B87A'}}>Editor fotografie</span>
            <span style={{fontFamily:'Jost,sans-serif',fontSize:7,letterSpacing:'.18em',color:'rgba(201,169,110,.35)'}}>WebGL · GPU</span>
            <div style={{display:'flex',gap:6}}>
              {[['FILTRE',showLeft,setShowLeft],['AJUSTĂRI',showRight,setShowRight]].map(([lbl,on,set])=>(
                <button key={lbl} data-cursor className="ie-btn" onClick={()=>set(v=>!v)} style={{padding:'7px 18px',borderRadius:99,background:on?'rgba(212,184,122,.22)':'rgba(0,0,0,.45)',border:`1px solid ${on?'rgba(212,184,122,.55)':'rgba(255,255,255,.14)'}`,color:on?'#D4B87A':'rgba(255,255,255,.55)',fontFamily:'Jost,sans-serif',fontSize:9,letterSpacing:'.1em',backdropFilter:'blur(8px)'}}>{lbl}</button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button data-cursor className="ie-btn" onMouseDown={(e)=>{e.stopPropagation();e.preventDefault();reset()}} style={{padding:'8px 20px',borderRadius:99,background:'rgba(0,0,0,.5)',border:'1px solid rgba(255,255,255,.16)',color:'rgba(255,255,255,.68)',fontFamily:'Jost,sans-serif',fontSize:9,letterSpacing:'.1em',backdropFilter:'blur(8px)'}}>RESETEAZĂ</button>
            <button data-cursor className="ie-btn" onMouseDown={(e)=>{e.stopPropagation();e.preventDefault();setPreviewMode(true)}} style={{padding:'8px 20px',borderRadius:99,background:'rgba(0,0,0,.5)',border:'1px solid rgba(212,184,122,.4)',color:'rgba(212,184,122,.88)',fontFamily:'Jost,sans-serif',fontSize:9,letterSpacing:'.1em',backdropFilter:'blur(8px)'}}>PREVIZUALIZARE</button>
          </div>
        </div>

        {/* FILTRE */}
        {showLeft&&(
          <div data-nopan style={{position:'absolute',left:0,top:104,bottom:0,width:148,overflowY:'auto',padding:'12px 7px 16px',zIndex:15,background:'linear-gradient(to right,rgba(3,1,0,.9) 0%,rgba(3,1,0,.72) 82%,transparent 100%)'}}>
            <div style={{fontFamily:'Jost,sans-serif',fontSize:7,letterSpacing:'.22em',color:'rgba(201,169,110,.38)',marginBottom:10,paddingLeft:4}}>REFERINȚĂ</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {/* Original */}
              <div onClick={()=>selectFilter(FILTERS[0])} className={`ie-ft ${filter.name==='Original'?'sel':''}`}>
                <img src={src} alt="Original" style={{width:'100%',height:62,objectFit:'cover',display:'block'}}/>
                <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'3px 6px',background:'linear-gradient(transparent,rgba(0,0,0,.78))',fontFamily:'Jost,sans-serif',fontSize:8,color:filter.name==='Original'?'#D4B87A':'rgba(255,255,255,.78)'}}>Original</div>
              </div>
              {/* Editat — thumbnail live din WebGL */}
              {editedThumb && filter.name!=='Original' && (
                <div className="ie-ft" style={{border:'1.5px solid rgba(201,169,110,.35)',cursor:'default'}}>
                  <img src={editedThumb} alt="Editat" style={{width:'100%',height:62,objectFit:'cover',display:'block'}}/>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'3px 6px',background:'linear-gradient(transparent,rgba(0,0,0,.78))',fontFamily:'Jost,sans-serif',fontSize:8,color:'#D4B87A'}}>✦ Editat</div>
                </div>
              )}
            </div>

            <div style={{fontFamily:'Jost,sans-serif',fontSize:7,letterSpacing:'.22em',color:'rgba(201,169,110,.38)',margin:'14px 0 10px',paddingLeft:4}}>FILTRE STIL</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {FILTERS.slice(1).map(f=>(
                <div key={f.name} onClick={()=>selectFilter(f)} className={`ie-ft ${filter.name===f.name?'sel':''}`}>
                  <img src={src} alt={f.name} style={{width:'100%',height:62,objectFit:'cover',display:'block',filter:filterThumbCSS(f)}}/>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'3px 6px',background:'linear-gradient(transparent,rgba(0,0,0,.78))',fontFamily:'Jost,sans-serif',fontSize:8,color:filter.name===f.name?'#D4B87A':'rgba(255,255,255,.78)'}}>{f.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AJUSTĂRI */}
        {showRight&&(
          <div data-nopan style={{position:'absolute',right:0,top:104,bottom:0,width:218,overflowY:'auto',padding:'16px 16px 24px',zIndex:15,background:'linear-gradient(to left,rgba(3,1,0,.94) 0%,rgba(3,1,0,.78) 82%,transparent 100%)'}}>
            {groups.map(grp=>(
              <div key={grp} style={{marginBottom:18}}>
                <div style={{fontFamily:'Jost,sans-serif',fontSize:7,letterSpacing:'.22em',color:'rgba(201,169,110,.38)',marginBottom:12,paddingBottom:6,borderBottom:'1px solid rgba(201,169,110,.08)'}}>{grp.toUpperCase()}</div>
                {sliders.filter(s=>s.group===grp).map(s=>(
                  <div key={s.key} style={{marginBottom:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <span style={{fontFamily:'Jost,sans-serif',fontSize:10,color:'rgba(253,246,236,.65)'}}>{s.label}</span>
                      <span style={{fontFamily:'Jost,sans-serif',fontSize:10,color:adj[s.key]!==s.def?'#D4B87A':'rgba(201,169,110,.45)',fontWeight:adj[s.key]!==s.def?600:400}}>{fmtVal(s)}</span>
                    </div>
                    <input type="range" className="ie-sl" min={s.min} max={s.max} step={s.step} value={adj[s.key]}
                      onChange={e=>setAdj(a=>({...a,[s.key]:parseFloat(e.target.value)}))}
                      style={{background:`linear-gradient(to right,#D4B87A ${((adj[s.key]-s.min)/(s.max-s.min))*100}%,rgba(255,255,255,.08) ${((adj[s.key]-s.min)/(s.max-s.min))*100}%)`}}/>
                    {adj[s.key]!==s.def&&(
                      <button onClick={()=>setAdj(a=>({...a,[s.key]:s.def}))}
                        style={{marginTop:3,fontSize:8,color:'rgba(201,169,110,.3)',background:'none',border:'none',cursor:'pointer',fontFamily:'Jost,sans-serif',padding:0}}
                        onMouseEnter={e=>e.currentTarget.style.color='rgba(201,169,110,.7)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(201,169,110,.3)'}>resetează</button>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div style={{paddingTop:12,borderTop:'1px solid rgba(201,169,110,.08)'}}>
              <div style={{fontFamily:'Jost,sans-serif',fontSize:7,letterSpacing:'.2em',color:'rgba(201,169,110,.3)',marginBottom:6}}>FILTRU ACTIV</div>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontStyle:'italic',fontSize:18,color:'#D4B87A'}}>{filter.name}</div>
            </div>
          </div>
        )}

        {/* ZOOM */}
        <div data-nopan style={{position:'absolute',bottom:24,right:showRight?234:24,display:'flex',flexDirection:'column',gap:5,zIndex:20,transition:'right .3s ease'}}>
          {[['＋',()=>setZoom(z=>Math.min(5,z+.15))],['－',()=>setZoom(z=>Math.max(.2,z-.15))]].map(([l,f])=>(
            <button key={l} onClick={f} style={{width:34,height:34,borderRadius:'50%',background:'rgba(6,3,1,.72)',border:'1px solid rgba(201,169,110,.28)',color:'#D4B87A',fontSize:17,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(12px)'}}>{l}</button>
          ))}
          <div style={{textAlign:'center',fontFamily:'Jost,sans-serif',fontSize:8,color:'rgba(201,169,110,.38)',marginTop:1}}>{Math.round(zoom*100)}%</div>
        </div>
        <div style={{position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',fontFamily:'Jost,sans-serif',fontSize:8.5,letterSpacing:'.15em',color:'rgba(255,255,255,.18)',pointerEvents:'none',whiteSpace:'nowrap',zIndex:10}}>↕ TRAGE SAU SCROLL PENTRU POTRIVIRE</div>
      </>)}
    </div>
  )
}

function RecipeModal({ r, auth, onClose, onDelete }) {
  const [form, setForm]         = useState({ ...r })
  const [saving, setSaving]     = useState(false)
  const [imagePreview, setImagePreview] = useState(r.image_url || null)
  const [imageFilter,  setImageFilter]  = useState(r.image_filter || '')
  const [showImageEditor, setShowImageEditor] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      setImagePreview(e.detail)
      upd('image_url', e.detail)
      setShowImageEditor(false)
    }
    window.addEventListener('imgEditorApply', handler)
    return () => window.removeEventListener('imgEditorApply', handler)
  }, [])

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
    <>
      {showImageEditor && imagePreview && (
        <ImageEditor
          src={imagePreview}
          form={form}
          onApply={(dataUrl) => { setImagePreview(dataUrl); upd('image_url', dataUrl); setShowImageEditor(false) }}
          onClose={() => setShowImageEditor(false)}
        />
      )}

    <div className="fixed inset-0 z-50 flex items-start justify-center" style={{ background: 'rgba(8,5,3,0.85)', backdropFilter: 'blur(12px)', overflowY: 'auto', padding: '32px', paddingTop: '96px' }}>


      <div className="relative w-full max-w-[780px] rounded-[28px] p-[32px]" style={{ margin: 'auto', background: 'rgba(18,12,8,0.95)', border: '1px solid rgba(201,169,110,0.2)', backdropFilter: 'blur(40px)' }}>

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
              <div className="mb-[10px] h-[160px] rounded-[12px] overflow-hidden relative group" style={{ cursor: 'pointer' }}
                onDoubleClick={() => setShowImageEditor(true)}>
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" style={{ filter: imageFilter || 'brightness(0.85)', transition: 'filter 0.3s' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; e.currentTarget.querySelector('span').style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.querySelector('span').style.opacity = '0' }}>
                  <span style={{ opacity: 0, transition: 'opacity 0.3s', fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.2em', color: '#D4B87A', textAlign: 'center', lineHeight: 2 }}>
                    ✦<br/>DUBLU CLICK PENTRU EDITARE
                  </span>
                </div>
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

          <IngredientBuilder value={form.ingredients || ''} onChange={v => upd('ingredients', v)} />

          <StepBuilder value={form.instructions || ''} onChange={v => upd('instructions', v)} />

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
    </>
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
            image_url: '', image_filter: '', category: 'toata_ziua', difficulty: 'mediu', is_public: 0
          }}
          auth={auth}
          onClose={(refresh) => { setShowAdd(false); if (refresh) load() }}
          onDelete={() => {}}
        />
      )}
    </div>
  )
}