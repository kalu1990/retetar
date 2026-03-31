import { useState, useEffect, useRef } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'

const API = 'http://localhost:8000'
const DAYS    = ['Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă','Duminică']
const DAYS_EN = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const MEALS   = ['mic_dejun','pranz','cina']
const MEAL_LABELS = { mic_dejun: 'Mic dejun', pranz: 'Prânz', cina: 'Cină' }
const MEAL_ICONS  = { mic_dejun: '☀️', pranz: '🌤️', cina: '🌙' }

const parseMealNames = str => (str ? str.split('|').filter(Boolean) : [])
const joinMealNames  = arr => arr.filter(Boolean).join('|')

function getWeekStart(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset * 7)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatWeekRange(weekStart) {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  return {
    startDay:   start.toLocaleDateString('ro-RO', { day: 'numeric' }),
    startMonth: start.toLocaleDateString('ro-RO', { month: 'long' }),
    endDay:     end.toLocaleDateString('ro-RO', { day: 'numeric' }),
    endMonth:   end.toLocaleDateString('ro-RO', { month: 'long' }),
    year:       end.getFullYear(),
  }
}

function getDayDate(weekStart, dayIndex) {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + dayIndex)
  return d
}

function isToday(date) {
  const t = new Date()
  return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear()
}

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const IconPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

function RecipeCard({ name, imgUrl, icon, label, onView, onDelete }) {
  const [hov, setHov] = useState(false)
  const [hovDel, setHovDel] = useState(false)

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 12, overflow: 'hidden', minHeight: 62,
        position: 'relative', transition: 'all 0.2s ease',
        border: `1px solid ${hov ? 'rgba(201,169,110,0.45)' : 'rgba(201,169,110,0.18)'}`,
        boxShadow: hov ? '0 4px 20px rgba(0,0,0,0.35)' : 'none',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}>
      {imgUrl ? (
        <img src={imgUrl} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', filter: 'brightness(0.82) saturate(1.1) contrast(1.05)',
        }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(201,169,110,0.07)' }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, rgba(3,1,0,0.3) 0%, rgba(3,1,0,0.05) 100%)',
      }} />

      <button data-cursor onClick={onDelete}
        onMouseEnter={() => setHovDel(true)} onMouseLeave={() => setHovDel(false)}
        style={{
          position: 'absolute', top: 6, left: 6, zIndex: 10,
          width: 22, height: 22, borderRadius: '50%', cursor: 'none',
          background: hovDel ? 'rgba(180,60,60,0.7)' : 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          border: `1px solid ${hovDel ? 'rgba(220,80,80,0.6)' : 'rgba(180,60,60,0.2)'}`,
          color: hovDel ? '#ffaaaa' : 'rgba(220,100,100,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s',
        }}>
        <IconTrash />
      </button>

      <div data-cursor onClick={onView} style={{
        position: 'relative', padding: '10px 12px 10px 34px',
        display: 'flex', flexDirection: 'column', gap: 4, minHeight: 62,
        cursor: 'none',
      }}>
        {label && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {icon && <span style={{ fontSize: 10 }}>{icon}</span>}
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 8, letterSpacing: '0.18em', color: 'rgba(253,246,236,0.45)' }}>
              {label.toUpperCase()}
            </span>
          </div>
        )}
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: 13, fontWeight: 500, color: 'rgba(253,246,236,0.92)',
          lineHeight: 1.2, textShadow: '0 1px 6px rgba(0,0,0,0.5)',
        }}>{name}</div>
      </div>
    </div>
  )
}

function MealSlot({ icon, label, mealNames, allRecipes, onAdd, onView, onDeleteRecipe }) {
  const [hovAdd, setHovAdd] = useState(false)

  if (!mealNames || mealNames.length === 0) {
    return (
      <div onClick={onAdd} data-cursor
        style={{
          borderRadius: 12, padding: '10px 13px', minHeight: 62,
          background: hovAdd
            ? 'rgba(212,184,122,0.1)'
            : 'rgba(15,9,2,0.45)',
          border: `1px solid ${hovAdd ? 'rgba(212,184,122,0.45)' : 'rgba(180,140,60,0.2)'}`,
          cursor: 'none', transition: 'all 0.2s ease',
          display: 'flex', flexDirection: 'column', gap: 6,
          boxShadow: 'inset 0 1px 0 rgba(212,184,122,0.08)',
        }}
        onMouseEnter={() => setHovAdd(true)} onMouseLeave={() => setHovAdd(false)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11 }}>{icon}</span>
          <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 8.5, letterSpacing: '0.2em', color: hovAdd ? 'rgba(212,184,122,0.9)' : 'rgba(212,184,122,0.5)', fontWeight: 500 }}>
            {label.toUpperCase()}
          </span>
        </div>
        <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 300, color: hovAdd ? 'rgba(212,184,122,0.7)' : 'rgba(212,184,122,0.3)', letterSpacing: '0.08em' }}>
          + adaugă
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {mealNames.map((name, idx) => {
        const recipe = allRecipes.find(r => r.name.toLowerCase() === name.toLowerCase()) || null
        const imgUrl = recipe?.image_url
          ? (recipe.image_url.startsWith('/') ? `http://localhost:8000${recipe.image_url}` : recipe.image_url)
          : null
        return (
          <RecipeCard
            key={idx}
            name={name}
            imgUrl={imgUrl}
            icon={idx === 0 ? icon : null}
            label={idx === 0 ? label : null}
            onView={() => onView(idx)}
            onDelete={e => { e.stopPropagation(); onDeleteRecipe(idx) }}
          />
        )
      })}
      <div onClick={onAdd} data-cursor
        onMouseEnter={() => setHovAdd(true)} onMouseLeave={() => setHovAdd(false)}
        style={{
          borderRadius: 10, padding: '7px 12px',
          background: hovAdd ? 'rgba(201,169,110,0.1)' : 'rgba(201,169,110,0.04)',
          border: `1px dashed ${hovAdd ? 'rgba(201,169,110,0.35)' : 'rgba(201,169,110,0.15)'}`,
          cursor: 'none', transition: 'all 0.2s ease',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
        <span style={{ color: hovAdd ? '#D4B87A' : 'rgba(201,169,110,0.45)', display: 'flex' }}>
          <IconPlus size={10} />
        </span>
        <span style={{
          fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 300,
          letterSpacing: '0.14em', color: hovAdd ? 'rgba(201,169,110,0.85)' : 'rgba(201,169,110,0.38)',
        }}>
          ADAUGĂ REȚETĂ
        </span>
      </div>
    </div>
  )
}

function MealViewModal({ day, mealType, recipe, mealName, onEdit, onDelete, onAdd, onClose, onViewFull }) {
  const [imgHov, setImgHov] = useState(false)
  const imgUrl = recipe?.image_url
    ? (recipe.image_url.startsWith('/') ? `http://localhost:8000${recipe.image_url}` : recipe.image_url)
    : null

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const DIFF = { usor: 'Ușor', mediu: 'Mediu', greu: 'Greu', easy: 'Ușor' }
  const totalTime = recipe ? (recipe.prep_time || 0) + (recipe.cook_time || 0) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(3,1,0,0.88)', backdropFilter: 'blur(24px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: 480, borderRadius: 24,
          background: 'linear-gradient(160deg, rgba(20,13,6,0.99) 0%, rgba(8,5,2,0.99) 100%)',
          border: '1px solid rgba(201,169,110,0.18)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.85)',
          overflow: 'hidden',
        }}>

        <div style={{ position: 'relative', height: imgUrl ? 200 : 56, overflow: 'hidden' }}>
          {imgUrl && (
            <>
              <img src={imgUrl} alt=""
                onClick={recipe ? (e => { e.stopPropagation(); onViewFull?.() }) : undefined}
                data-cursor
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: imgHov && recipe ? 'brightness(0.75) saturate(0.9)' : 'brightness(0.6) saturate(0.85)',
                  cursor: recipe ? 'none' : 'default', transition: 'filter 0.2s',
                }}
                onMouseEnter={() => setImgHov(true)} onMouseLeave={() => setImgHov(false)}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(8,5,2,1) 0%, rgba(8,5,2,0.3) 60%, transparent 100%)', pointerEvents: 'none' }} />
              {recipe && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(201,169,110,0.3)', borderRadius: 99, padding: '6px 16px',
                  fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: 'rgba(201,169,110,0.85)',
                  opacity: imgHov && recipe ? 1 : 0, transition: 'opacity 0.2s',
                }}>VEZ REȚETA</div>
              )}
            </>
          )}

          <button data-cursor onClick={e => { e.stopPropagation(); onDelete() }}
            title="Șterge din planificator"
            style={{
              position: 'absolute', top: 14, left: 14,
              width: 32, height: 32, borderRadius: '50%', cursor: 'none',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(180,60,60,0.25)', color: 'rgba(220,100,100,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,60,60,0.22)'; e.currentTarget.style.color = 'rgba(240,110,110,1)'; e.currentTarget.style.borderColor = 'rgba(200,60,60,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.color = 'rgba(220,100,100,0.55)'; e.currentTarget.style.borderColor = 'rgba(180,60,60,0.25)' }}>
            <IconTrash />
          </button>

          <button data-cursor onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 32, height: 32, borderRadius: '50%', cursor: 'none',
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.75)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(201,169,110,0.45)', marginBottom: 6 }}>
            {DAYS[DAYS_EN.indexOf(day)]?.toUpperCase()} · {MEAL_LABELS[mealType]?.toUpperCase()}
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: 28, fontWeight: 600, color: '#D4B87A', lineHeight: 1.1, marginBottom: 16,
          }}>{mealName}</h2>

          {recipe && (
            <>
              {recipe.description && (
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 300, color: 'rgba(253,246,236,0.4)', lineHeight: 1.7, marginBottom: 18 }}>
                  {recipe.description}
                </p>
              )}
              {(totalTime > 0 || recipe.servings > 0 || recipe.difficulty) && (
                <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 22 }}>
                  {[
                    { label: 'TIMP',   value: totalTime > 0 ? `${totalTime}` : null, unit: 'min' },
                    { label: 'PORȚII', value: recipe.servings > 0 ? `${recipe.servings}` : null, unit: 'pers' },
                    { label: 'NIVEL',  value: recipe.difficulty ? DIFF[recipe.difficulty] || recipe.difficulty : null, unit: '' },
                  ].filter(s => s.value).map((s, i, arr) => (
                    <div key={i} style={{
                      flex: 1, padding: '12px 10px', textAlign: 'center',
                      background: 'rgba(201,169,110,0.04)',
                      borderRight: i < arr.length - 1 ? '1px solid rgba(201,169,110,0.08)' : 'none',
                    }}>
                      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 7.5, letterSpacing: '0.25em', color: 'rgba(201,169,110,0.35)', marginBottom: 5 }}>{s.label}</div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 20, color: '#FDF6EC' }}>{s.value}</div>
                      {s.unit && <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 8.5, color: 'rgba(201,169,110,0.3)', marginTop: 2 }}>{s.unit}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button data-cursor onClick={onEdit}
              style={{
                flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'none',
                background: 'linear-gradient(135deg, #D4B87A, #8B6914)',
                color: '#0C0806', fontFamily: 'Jost, sans-serif', fontSize: 11,
                fontWeight: 700, letterSpacing: '0.18em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
              <IconEdit /> SCHIMBĂ REȚETA
            </button>
            <button data-cursor onClick={e => { e.stopPropagation(); onAdd() }}
              style={{
                padding: '13px 16px', borderRadius: 12, cursor: 'none',
                background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.22)',
                color: 'rgba(201,169,110,0.75)', fontFamily: 'Jost, sans-serif', fontSize: 11,
                letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.18s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.16)'; e.currentTarget.style.color = '#D4B87A'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.08)'; e.currentTarget.style.color = 'rgba(201,169,110,0.75)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.22)' }}>
              <IconPlus size={12} /> ADAUGĂ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditModal({ day, mealType, current, mode, onSave, onClose, recipes }) {
  const [val, setVal]         = useState(mode === 'replace' ? (current || '') : '')
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const suggestions = val.trim().length >= 1
    ? recipes.filter(r => r.name.toLowerCase().includes(val.toLowerCase())).slice(0, 6)
    : []

  const handleKey = (e) => {
    if (suggestions.length === 0) { if (e.key === 'Enter') onSave(val); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0) onSave(suggestions[activeIdx].name); else onSave(val) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(3,1,0,0.85)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: 440, borderRadius: 24, padding: 32,
          background: 'linear-gradient(160deg, rgba(22,14,6,0.99) 0%, rgba(10,6,3,0.99) 100%)',
          border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 22 }}>{MEAL_ICONS[mealType]}</span>
          <div>
            <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(201,169,110,0.5)', marginBottom: 4 }}>
              {DAYS[DAYS_EN.indexOf(day)]?.toUpperCase()} · {MEAL_LABELS[mealType]?.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 24, color: '#D4B87A' }}>
              {mode === 'add' ? 'Adaugă rețetă' : 'Schimbă rețeta'}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <input ref={inputRef} value={val}
            onChange={e => { setVal(e.target.value); setActiveIdx(-1) }}
            onKeyDown={handleKey}
            placeholder="ex: Ciorbă de perișoare..."
            style={{
              width: '100%', borderRadius: suggestions.length > 0 ? '12px 12px 0 0' : 12,
              padding: '13px 18px', boxSizing: 'border-box',
              background: 'rgba(253,246,236,0.05)', border: '1px solid rgba(201,169,110,0.35)',
              borderBottom: suggestions.length > 0 ? '1px solid rgba(201,169,110,0.1)' : undefined,
              color: '#FDF6EC', fontFamily: 'Jost, sans-serif', fontSize: 14, fontWeight: 300,
              outline: 'none', caretColor: '#D4B87A',
            }}
          />
          {suggestions.length > 0 && (
            <div style={{
              borderRadius: '0 0 12px 12px', border: '1px solid rgba(201,169,110,0.35)',
              borderTop: 'none', overflow: 'hidden', background: 'rgba(14,9,4,0.98)',
            }}>
              {suggestions.map((r, i) => {
                const isActive = i === activeIdx
                const q = val.toLowerCase(); const name = r.name; const idx = name.toLowerCase().indexOf(q)
                return (
                  <div key={r.id} data-cursor
                    onMouseEnter={() => setActiveIdx(i)} onMouseLeave={() => setActiveIdx(-1)}
                    onClick={() => onSave(r.name)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px',
                      background: isActive ? 'rgba(201,169,110,0.1)' : 'transparent',
                      borderBottom: i < suggestions.length - 1 ? '1px solid rgba(201,169,110,0.06)' : 'none',
                      cursor: 'none', transition: 'background 0.12s',
                    }}>
                    {r.image_url && (
                      <img src={r.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0, filter: 'brightness(0.8)' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 300, color: 'rgba(253,246,236,0.85)' }}>
                        {idx >= 0 ? (<>{name.slice(0, idx)}<span style={{ color: '#D4B87A', fontWeight: 500 }}>{name.slice(idx, idx + q.length)}</span>{name.slice(idx + q.length)}</>) : name}
                      </div>
                      {r.description && (
                        <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 300, color: 'rgba(253,246,236,0.25)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
                      )}
                    </div>
                    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, color: 'rgba(201,169,110,0.35)', flexShrink: 0 }}>{isActive ? '↵ alege' : ''}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button data-cursor onClick={() => onSave(val)} style={{
            flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'none',
            background: 'linear-gradient(135deg, #D4B87A, #8B6914)',
            color: '#0C0806', fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
          }}>SALVEAZĂ</button>
          <button data-cursor onClick={onClose} style={{
            padding: '13px 18px', borderRadius: 12, cursor: 'none',
            background: 'rgba(253,246,236,0.04)', border: '1px solid rgba(253,246,236,0.08)',
            color: 'rgba(253,246,236,0.3)', fontFamily: 'Jost, sans-serif', fontSize: 14,
          }}>✕</button>
        </div>
      </div>
    </div>
  )
}

export default function PlannerPage({ auth }) {
  usePageTracking('planner')
  const [meals, setMeals]       = useState({})
  const [recipes, setRecipes]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [editing, setEditing]   = useState(null) // { day, mealType, mode, recipeIndex? }
  const [viewing, setViewing]   = useState(null) // { day, mealType, recipeIndex }
  const [fullRecipe, setFullRecipe] = useState(null)
  const weekStart = getWeekStart(weekOffset)

  const load = async () => {
    setLoading(true)
    const token = localStorage.getItem('auth_token') || ''

    // Rețetele se încarcă INDEPENDENT — un 500 pe planner nu le afectează
    try {
      const [ownData, savedData] = await Promise.all([
        fetch(`${API}/api/recipes?token=${token}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/api/saved_recipes?token=${token}`).then(r => r.json()).catch(() => []),
      ])
      const own   = Array.isArray(ownData)   ? ownData   : (ownData.recipes   || [])
      const saved = Array.isArray(savedData) ? savedData : (savedData.recipes || [])
      const seen  = new Set(own.map(r => r.id))
      setRecipes([...own, ...saved.filter(r => !seen.has(r.id))])
    } catch (e) { console.error('[Planner] Recipes load error:', e) }

    // Planificatorul se încarcă separat
    try {
      const res = await fetch(`${API}/api/planner/week?week=${weekStart}&token=${token}`)
      if (res.ok) {
        const planData = await res.json()
        const map = {}
        ;(Array.isArray(planData) ? planData : []).forEach(m => {
          if (!map[m.day]) map[m.day] = {}
          map[m.day][m.meal_type] = m.meal_name
        })
        setMeals(map)
      } else {
        console.error('[Planner] Week load error:', res.status, await res.text())
      }
    } catch (e) { console.error('[Planner] Week fetch error:', e) }

    setLoading(false)
  }

  useEffect(() => { load() }, [weekStart])

  const saveMealNames = async (day, mealType, namesStr) => {
    const token = localStorage.getItem('auth_token') || ''
    // Optimistic update imediat in UI
    setMeals(prev => ({ ...prev, [day]: { ...(prev[day] || {}), [mealType]: namesStr } }))
    try {
      const res = await fetch(`${API}/api/planner/meal?token=${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart, day, meal_type: mealType, meal_name: namesStr })
      })
      if (!res.ok) {
        const err = await res.text()
        console.error('[Planner] Save failed:', res.status, err)
      } else {
        const json = await res.json()
        console.log('[Planner] Saved OK:', json)
      }
    } catch (e) {
      console.error('[Planner] Network error on save:', e)
    }
  }

  const addRecipe = async (day, mealType, newName) => {
    if (!newName?.trim()) { setEditing(null); return }
    const current = parseMealNames(meals[day]?.[mealType] || '')
    await saveMealNames(day, mealType, joinMealNames([...current, newName.trim()]))
    setEditing(null); setViewing(null)
  }

  const replaceRecipe = async (day, mealType, idx, newName) => {
    if (!newName?.trim()) { setEditing(null); return }
    const current = parseMealNames(meals[day]?.[mealType] || '')
    current[idx] = newName.trim()
    await saveMealNames(day, mealType, joinMealNames(current))
    setEditing(null); setViewing(null)
  }

  const deleteRecipe = async (day, mealType, idx) => {
    const current = parseMealNames(meals[day]?.[mealType] || '')
    await saveMealNames(day, mealType, joinMealNames(current.filter((_, i) => i !== idx)))
    setViewing(null)
  }

  const viewingMealNames = viewing ? parseMealNames(meals[viewing.day]?.[viewing.mealType] || '') : []
  const viewingMealName  = viewing ? (viewingMealNames[viewing.recipeIndex] || '') : ''
  const viewingRecipe    = viewing ? (recipes.find(r => r.name.toLowerCase() === viewingMealName.toLowerCase()) || null) : null

  return (
    <div className="relative z-[2] h-full overflow-auto px-[48px] pt-[100px] pb-[80px]"
      style={{ fontFamily: 'Jost, sans-serif' }}>

      {/* ── PAGE BACKGROUND ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <div style={{ position: 'absolute', inset: 0, background: '#080401' }}/>
        {/* Fotografia — mai luminoasă, mai vizibilă */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=90)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 60%',
          opacity: 0.85,
        }}/>
        {/* Overlay mult mai ușor — lăsăm foto să respire */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(5,2,1,0.88) 0%, rgba(5,2,1,0.45) 15%, rgba(3,1,0,0.08) 45%, rgba(3,1,0,0.22) 100%)',
        }}/>
        {/* Vigneta laterală subtilă */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 90% 100% at 50% 50%, transparent 50%, rgba(2,1,0,0.55) 100%)',
        }}/>
      </div>



      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 36, fontWeight: 400, color: '#D4B87A', lineHeight: 1 }}>Planificator</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button data-cursor onClick={() => setWeekOffset(w => w - 1)}
            style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.06)', color: '#D4B87A', fontSize: 16, cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.18)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.06)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)' }}>←</button>
          <div style={{ textAlign: 'center', minWidth: 220 }}>
            {(() => {
              const { startDay, startMonth, endDay, endMonth, year } = formatWeekRange(weekStart)
              return (
                <>
                  <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: 'rgba(212,184,122,0.65)', textTransform: 'uppercase', marginBottom: 4 }}>
                    {year}
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(212,184,122,0.82)', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                    {startDay} {startMonth}
                    <span style={{ margin: '0 8px', color: 'rgba(212,184,122,0.35)', fontStyle: 'normal', fontSize: 10 }}>✦</span>
                    {endDay} {endMonth}
                  </div>
                  {weekOffset !== 0 && (
                    <button data-cursor onClick={() => setWeekOffset(0)}
                      style={{ marginTop: 6, padding: '3px 12px', borderRadius: 99, border: '1px solid rgba(201,169,110,0.25)', background: 'rgba(201,169,110,0.1)', color: '#D4B87A', cursor: 'none', fontFamily: 'Jost, sans-serif', fontSize: 8, letterSpacing: '0.2em', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.2)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.1)' }}>AZI</button>
                  )}
                </>
              )
            })()}
          </div>
          <button data-cursor onClick={() => setWeekOffset(w => w + 1)}
            style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.06)', color: '#D4B87A', fontSize: 16, cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.18)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.06)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)' }}>→</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A96E', boxShadow: '0 0 10px #C9A96E', animation: 'pulse 1s ease-in-out infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          {DAYS_EN.map((dayEn, di) => {
            const dayDate = getDayDate(weekStart, di)
            const today   = weekOffset === 0 && isToday(dayDate)
            return (
              <div key={dayEn} style={{
                borderRadius: 20,
                background: today
                  ? 'linear-gradient(160deg, rgba(35,20,4,0.93) 0%, rgba(22,12,2,0.95) 100%)'
                  : 'linear-gradient(160deg, rgba(22,13,3,0.88) 0%, rgba(14,8,1,0.91) 100%)',
                border: today
                  ? '1px solid rgba(220,188,120,0.75)'
                  : '1px solid rgba(200,160,80,0.32)',
                boxShadow: today
                  ? '0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(180,120,30,0.2), inset 0 1px 0 rgba(230,195,120,0.35)'
                  : '0 4px 24px rgba(0,0,0,0.4), 0 0 30px rgba(140,90,20,0.1), inset 0 1px 0 rgba(210,170,90,0.15)',
                backdropFilter: 'blur(20px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{
                  paddingBottom: 9,
                  marginBottom: 2,
                  borderBottom: `1px solid ${today ? 'rgba(212,184,122,0.28)' : 'rgba(180,130,50,0.1)'}`,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                }}>
                  <div>
                    {/* Zi săptămânii — mic dar cu letter-spacing editorial */}
                    <div style={{
                      fontFamily: 'Jost, sans-serif', fontSize: 8, fontWeight: 600,
                      letterSpacing: '0.28em', textTransform: 'uppercase',
                      color: today ? 'rgba(212,184,122,0.9)' : 'rgba(200,165,95,0.5)',
                      marginBottom: 3,
                    }}>{DAYS[di]}</div>
                    {/* Numărul zilei — mare, serif, ca un calendar de lux */}
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: today ? 28 : 24,
                      fontWeight: today ? 600 : 300,
                      lineHeight: 1,
                      color: today ? '#D4B87A' : 'rgba(210,175,110,0.55)',
                      letterSpacing: '-0.01em',
                    }}>
                      {dayDate.toLocaleDateString('ro-RO', { day: 'numeric' })}
                    </div>
                    {/* Luna — sub număr, mic */}
                    <div style={{
                      fontFamily: 'Jost, sans-serif', fontSize: 8, fontWeight: 300,
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: today ? 'rgba(212,184,122,0.65)' : 'rgba(200,165,95,0.32)',
                      marginTop: 2,
                    }}>
                      {dayDate.toLocaleDateString('ro-RO', { month: 'short' })}
                    </div>
                  </div>
                  {today && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 99,
                      background: 'rgba(212,184,122,0.12)',
                      border: '1px solid rgba(212,184,122,0.3)',
                      marginBottom: 2,
                    }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4B87A', boxShadow: '0 0 6px rgba(212,184,122,1)' }} />
                      <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 7, letterSpacing: '0.28em', color: '#D4B87A', fontWeight: 500 }}>AZI</span>
                    </div>
                  )}
                </div>

                {MEALS.map(mealType => {
                  const mealNames = parseMealNames(meals[dayEn]?.[mealType] || '')
                  return (
                    <MealSlot
                      key={mealType}
                      icon={MEAL_ICONS[mealType]}
                      label={MEAL_LABELS[mealType]}
                      mealNames={mealNames}
                      allRecipes={recipes}
                      onAdd={() => setEditing({ day: dayEn, mealType, mode: 'add' })}
                      onView={recipeIdx => setViewing({ day: dayEn, mealType, recipeIndex: recipeIdx })}
                      onDeleteRecipe={recipeIdx => deleteRecipe(dayEn, mealType, recipeIdx)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {viewing && !editing && (
        <MealViewModal
          day={viewing.day}
          mealType={viewing.mealType}
          mealName={viewingMealName}
          recipe={viewingRecipe}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing({ day: viewing.day, mealType: viewing.mealType, mode: 'replace', recipeIndex: viewing.recipeIndex }); setViewing(null) }}
          onDelete={() => deleteRecipe(viewing.day, viewing.mealType, viewing.recipeIndex)}
          onAdd={() => { setEditing({ day: viewing.day, mealType: viewing.mealType, mode: 'add' }); setViewing(null) }}
          onViewFull={viewingRecipe ? () => setFullRecipe(viewingRecipe) : undefined}
        />
      )}

      {fullRecipe && (
        <div className="fixed inset-0 z-[60]"
          style={{ background: 'rgba(3,1,0,0.94)', backdropFilter: 'blur(28px)', overflowY: 'auto', padding: '88px 32px 32px' }}
          onClick={() => setFullRecipe(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ margin: 'auto', width: '100%', maxWidth: 960, borderRadius: 32, background: 'linear-gradient(160deg, rgba(24,15,6,0.99) 0%, rgba(10,6,3,0.99) 100%)', border: '1px solid rgba(201,169,110,0.15)', boxShadow: '0 48px 140px rgba(0,0,0,0.85)', overflow: 'hidden' }}>
            {fullRecipe.image_url && (
              <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
                <img src={fullRecipe.image_url.startsWith('/') ? `http://localhost:8000${fullRecipe.image_url}` : fullRecipe.image_url}
                  alt={fullRecipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55) saturate(0.85)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(10,6,3,1) 0%, rgba(10,6,3,0.3) 50%, transparent 80%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '36px 40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 24, height: 1, background: 'rgba(201,169,110,0.7)' }} />
                    <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.38em', color: 'rgba(201,169,110,0.7)' }}>{fullRecipe.category?.toUpperCase() || 'REȚETĂ'}</span>
                  </div>
                  <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, color: '#D4B87A', lineHeight: 1.05 }}>{fullRecipe.name}</h1>
                </div>
                <button data-cursor onClick={() => setFullRecipe(null)}
                  style={{ position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderRadius: '50%', cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>✕</button>
              </div>
            )}
            <div style={{ padding: '32px 40px 40px' }}>
              {fullRecipe.description && (
                <p style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 14, lineHeight: 1.85, color: 'rgba(253,246,236,0.5)', marginBottom: 28 }}>{fullRecipe.description}</p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: fullRecipe.ingredients && fullRecipe.instructions ? '1fr 1fr' : '1fr', gap: 40 }}>
                {fullRecipe.ingredients && (
                  <div>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 22, color: '#D4B87A', fontWeight: 400, marginBottom: 16 }}>Ingrediente</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {fullRecipe.ingredients.split('\n').filter(Boolean).map((ing, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(201,169,110,0.5)', flexShrink: 0, marginTop: 8 }} />
                          <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(253,246,236,0.72)', lineHeight: 1.6 }}>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fullRecipe.instructions && (
                  <div>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 22, color: '#D4B87A', fontWeight: 400, marginBottom: 16 }}>Mod de preparare</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {fullRecipe.instructions.split('\n').filter(Boolean).map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 14 }}>
                          <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}>
                            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: '#D4B87A' }}>{i + 1}</span>
                          </div>
                          <p style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300, fontSize: 13, color: 'rgba(253,246,236,0.65)', lineHeight: 1.8, paddingTop: 3 }}>{step.replace(/^\d+\.\s*/, '')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <EditModal
          day={editing.day}
          mealType={editing.mealType}
          mode={editing.mode}
          current={
            editing.mode === 'replace'
              ? parseMealNames(meals[editing.day]?.[editing.mealType] || '')[editing.recipeIndex] || ''
              : ''
          }
          onSave={val => {
            if (editing.mode === 'add') addRecipe(editing.day, editing.mealType, val)
            else replaceRecipe(editing.day, editing.mealType, editing.recipeIndex, val)
          }}
          onClose={() => setEditing(null)}
          recipes={recipes}
        />
      )}
    </div>
  )
}