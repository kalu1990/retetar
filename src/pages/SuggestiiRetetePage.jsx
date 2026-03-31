import { useState, useEffect } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'
import GoldButton from '../components/GoldButton'

const API = 'http://localhost:8000'

const pickColor = (name = '') => {
  const COLORS = ['#C9A96E', '#E8D5A3', '#C4788A', '#8FAF8A', '#A3B8C9']
  return COLORS[(name.charCodeAt(0) || 0) % COLORS.length]
}

// ─── PREVIEW MODAL ────────────────────────────────────────────────────────────
function PreviewModal({ r, onApprove, onReject, onClose, loading }) {
  const color = pickColor(r.name)
  const [step, setStep] = useState(-1)
  const steps = r.instructions ? r.instructions.split(/\.\s+|\n/).filter(s => s.trim().length > 5) : []
  const ingredients = r.ingredients ? r.ingredients.split(/[,\n]/).filter(Boolean) : []

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center"
      style={{ background: 'rgba(6,4,2,0.93)', backdropFilter: 'blur(40px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="relative rounded-[32px] w-[min(700px,95vw)] max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(160deg,#16110A 0%,#0C0904 100%)',
          border: `1px solid ${color}40`,
          boxShadow: `0 0 0 1px rgba(253,246,236,0.03), 0 60px 120px rgba(0,0,0,0.95), 0 0 100px ${color}15`,
        }}>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg,transparent,${color},transparent)` }} />

        {/* Header cu imagine sau gradient */}
        <div className="relative h-[220px] overflow-hidden rounded-t-[32px]">
          {r.image_url ? (
            <img src={r.image_url} alt={r.name}
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.6) saturate(0.85)' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[80px]"
              style={{ background: `linear-gradient(160deg,${color}20,rgba(12,9,4,0.8))` }}>
              🍽️
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(0deg,#0C0904 0%,transparent 60%)' }} />

          {/* Badge categorie */}
          <div className="absolute top-[16px] left-[20px] text-[8px] tracking-[0.25em] px-[12px] py-[4px] rounded-full"
            style={{ color, background: `${color}20`, border: `1px solid ${color}35`, fontFamily: 'Jost, sans-serif' }}>
            {(r.category || r.tags?.split(',')[0] || 'AI SUGESTIE').toUpperCase().replace('_', ' ')}
          </div>

          {/* Badge dificultate */}
          {r.difficulty && (
            <div className="absolute top-[16px] right-[20px] text-[8px] tracking-[0.2em] px-[12px] py-[4px] rounded-full"
              style={{ color: 'rgba(253,246,236,0.6)', background: 'rgba(253,246,236,0.08)', border: '1px solid rgba(253,246,236,0.12)', fontFamily: 'Jost, sans-serif' }}>
              {r.difficulty.toUpperCase()}
            </div>
          )}
        </div>

        <div className="p-[36px] pt-[24px]">
          {/* Titlu + stats */}
          <h1 className="font-cormorant italic font-bold text-cream leading-[1.05] mb-[10px]"
            style={{ fontSize: 'clamp(28px,4vw,42px)', letterSpacing: '-0.02em' }}>
            {r.name}
          </h1>
          {r.description && (
            <p className="text-[13px] leading-[1.7] mb-[24px]"
              style={{ color: 'rgba(253,246,236,0.45)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>
              {r.description}
            </p>
          )}

          {/* Stats bar */}
          <div className="grid grid-cols-4 rounded-[14px] overflow-hidden mb-[28px]"
            style={{ background: 'rgba(253,246,236,0.03)', border: `1px solid ${color}15` }}>
            {[
              ['PREP', `${r.prep_time || 0} min`],
              ['GĂTIT', `${r.cook_time || 0} min`],
              ['PORȚII', r.servings || '—'],
              ['CALORII', r.calories ? `${r.calories} kcal` : '—'],
            ].map(([l, v], i) => (
              <div key={i} className="py-[14px] text-center"
                style={{ borderRight: i < 3 ? `1px solid ${color}10` : 'none' }}>
                <div className="text-[8px] tracking-[0.22em] mb-[6px]"
                  style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>{l}</div>
                <div className="font-cormorant italic font-bold text-[18px]" style={{ color }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Ingrediente */}
          {ingredients.length > 0 && (
            <div className="mb-[24px]">
              <div className="text-[9px] tracking-[0.28em] mb-[12px]"
                style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>INGREDIENTE</div>
              <div className="grid grid-cols-2 gap-[6px]">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-[8px] px-[12px] py-[8px] rounded-[10px]"
                    style={{ background: 'rgba(253,246,236,0.03)', border: `1px solid ${color}12` }}>
                    <span style={{ color, fontSize: 7 }}>✦</span>
                    <span className="text-[11px] leading-[1.4]"
                      style={{ color: 'rgba(253,246,236,0.55)', fontFamily: 'Jost, sans-serif' }}>
                      {ing.trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pași preparare */}
          {steps.length > 0 && (
            <div className="mb-[28px]">
              <div className="text-[9px] tracking-[0.28em] mb-[12px]"
                style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>PREPARARE</div>
              <div className="flex flex-col gap-[8px]">
                {steps.map((s, i) => (
                  <div key={i} onClick={() => setStep(step === i ? -1 : i)} data-cursor
                    className="flex gap-[12px] items-start px-[16px] py-[12px] rounded-[12px] cursor-none transition-all duration-200"
                    style={{
                      background: step === i ? `${color}12` : 'rgba(253,246,236,0.025)',
                      border: `1px solid ${step === i ? color + '35' : 'rgba(253,246,236,0.05)'}`,
                    }}>
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-[1px]"
                      style={{
                        background: step === i ? `linear-gradient(135deg,${color},#E8D5A3)` : 'rgba(253,246,236,0.06)',
                        color: step === i ? '#1A1208' : 'rgba(253,246,236,0.25)',
                        fontFamily: 'Jost, sans-serif',
                      }}>{i + 1}</div>
                    <span className="text-[12px] leading-[1.6]"
                      style={{ color: step === i ? 'rgba(253,246,236,0.85)' : 'rgba(253,246,236,0.4)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>
                      {s.trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── BUTOANE DECIZIE ─────────────────────────────────────────── */}
          <div className="flex gap-[12px] pt-[4px]">
            {/* NU — respinge */}
            <button onClick={() => onReject(r.id)} disabled={loading} data-cursor
              className="flex-1 py-[14px] rounded-full cursor-none text-[11px] tracking-[0.22em] font-medium transition-all duration-300"
              style={{
                background: 'rgba(196,120,138,0.1)',
                border: '1px solid rgba(196,120,138,0.3)',
                color: loading ? 'rgba(196,120,138,0.3)' : '#C4788A',
                fontFamily: 'Jost, sans-serif',
              }}>
              ✕ &nbsp; NU, ȘTERGE
            </button>

            {/* DA — aprobă */}
            <button onClick={() => onApprove(r.id)} disabled={loading} data-cursor
              className="flex-1 py-[14px] rounded-full cursor-none text-[11px] tracking-[0.22em] font-medium transition-all duration-300"
              style={{
                background: loading ? 'rgba(143,175,138,0.15)' : 'linear-gradient(135deg,#8FAF8A,#6A9066)',
                border: '1px solid rgba(143,175,138,0.4)',
                color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
                fontFamily: 'Jost, sans-serif',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(106,144,102,0.3)',
              }}>
              {loading ? 'SE PROCESEAZĂ...' : '✓  DA, PUBLICĂ ÎN INSPIRAȚIE'}
            </button>
          </div>
        </div>

        {/* Buton închide */}
        <button onClick={onClose} data-cursor
          className="absolute top-[18px] right-[18px] w-8 h-8 rounded-full flex items-center justify-center cursor-none transition-all"
          style={{ background: 'rgba(253,246,236,0.06)', border: '1px solid rgba(253,246,236,0.1)', color: 'rgba(253,246,236,0.35)', fontSize: 13 }}>✕</button>
      </div>
    </div>
  )
}

// ─── SUGGESTION CARD (în listă) ───────────────────────────────────────────────
function SuggestionCard({ r, onPreview }) {
  const [hov, setHov] = useState(false)
  const color = pickColor(r.name)
  const ingredients = r.ingredients ? r.ingredients.split(/[,\n]/).filter(Boolean).slice(0, 3) : []

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden rounded-[20px] transition-all duration-300"
      style={{
        background: hov ? `linear-gradient(160deg,${color}15,rgba(253,246,236,0.03))` : 'rgba(253,246,236,0.04)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${hov ? color + '45' : 'rgba(253,246,236,0.07)'}`,
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? `0 16px 40px rgba(0,0,0,0.4),0 0 40px ${color}15` : '0 4px 16px rgba(0,0,0,0.25)',
      }}>
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg,transparent,${color}${hov ? 'AA' : '30'},transparent)` }} />

      <div className="flex gap-[0px]">
        {/* Imagine / emoji */}
        <div className="w-[120px] flex-shrink-0 overflow-hidden rounded-l-[20px]">
          {r.image_url ? (
            <img src={r.image_url} alt={r.name}
              className="w-full h-full object-cover transition-transform duration-500"
              style={{ transform: hov ? 'scale(1.06)' : 'scale(1)', filter: 'brightness(0.7)', minHeight: 110 }} />
          ) : (
            <div className="w-full h-full min-h-[110px] flex items-center justify-center text-[36px]"
              style={{ background: `linear-gradient(160deg,${color}20,transparent)` }}>🍽️</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-[18px] flex flex-col justify-between min-w-0">
          <div>
            {/* Categorie badge */}
            <div className="text-[8px] tracking-[0.22em] mb-[6px]"
              style={{ color, fontFamily: 'Jost, sans-serif' }}>
              {(r.category || 'REȚETĂ').toUpperCase().replace('_', ' ')}
              {r.difficulty && <span style={{ color: 'rgba(253,246,236,0.2)' }}> · {r.difficulty}</span>}
            </div>
            <h3 className="font-cormorant italic font-bold text-[17px] text-cream leading-[1.2] mb-[5px] transition-colors duration-200"
              style={{ color: hov ? color : '#FDF6EC' }}>
              {r.name}
            </h3>
            {r.description && (
              <p className="text-[10px] leading-[1.5] mb-[8px]"
                style={{ color: 'rgba(253,246,236,0.3)', fontFamily: 'Jost, sans-serif' }}>
                {r.description.length > 80 ? r.description.slice(0, 80) + '...' : r.description}
              </p>
            )}
            {/* Primele 3 ingrediente */}
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-[4px]">
                {ingredients.map((ing, i) => (
                  <span key={i} className="text-[9px] px-[7px] py-[2px] rounded-full"
                    style={{ background: `${color}12`, border: `1px solid ${color}20`, color: 'rgba(253,246,236,0.4)', fontFamily: 'Jost, sans-serif' }}>
                    {ing.trim().split(' ').slice(-1)[0]}
                  </span>
                ))}
                {r.ingredients.split(/[,\n]/).filter(Boolean).length > 3 && (
                  <span className="text-[9px] px-[7px] py-[2px] rounded-full"
                    style={{ background: 'rgba(253,246,236,0.04)', border: '1px solid rgba(253,246,236,0.08)', color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
                    +{r.ingredients.split(/[,\n]/).filter(Boolean).length - 3} mai mult
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats + buton */}
          <div className="flex items-center justify-between mt-[12px]">
            <div className="flex gap-[12px]">
              {[[(r.prep_time || 0) + (r.cook_time || 0), 'min'], [r.calories, 'kcal']].map(([v, u], i) => (
                <div key={i} className="flex items-baseline gap-[3px]">
                  <span className="font-cormorant italic font-bold text-[14px] text-cream">{v || '—'}</span>
                  <span className="text-[9px]" style={{ color: 'rgba(253,246,236,0.22)', fontFamily: 'Jost, sans-serif' }}>{u}</span>
                </div>
              ))}
            </div>
            <button onClick={() => onPreview(r)} data-cursor
              className="px-[18px] py-[7px] rounded-full cursor-none text-[10px] tracking-[0.18em] transition-all duration-200"
              style={{
                background: hov ? `linear-gradient(135deg,${color}25,${color}10)` : 'rgba(253,246,236,0.05)',
                border: `1px solid ${hov ? color + '45' : 'rgba(253,246,236,0.1)'}`,
                color: hov ? color : 'rgba(253,246,236,0.4)',
                fontFamily: 'Jost, sans-serif',
              }}>
              PREVIZUALIZARE →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
function SearchBar({ onSearch, searching }) {
  const [q, setQ] = useState('')

  const submit = () => { if (q.trim()) onSearch(q.trim()) }

  return (
    <div className="flex gap-[12px] mb-[28px]">
      <div className="relative flex-1">
        <input
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="ex. rețete tradiționale românești, deserturi rapide..."
          className="w-full rounded-full px-[24px] py-[14px] text-[13px] text-cream outline-none transition-all duration-200 cursor-none"
          style={{
            background: 'rgba(253,246,236,0.04)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(201,169,110,0.2)',
            fontFamily: 'Jost, sans-serif', fontWeight: 300,
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(201,169,110,0.2)'} />
        <span className="absolute right-[20px] top-1/2 -translate-y-1/2 text-[13px]"
          style={{ color: 'rgba(253,246,236,0.15)' }}>✦</span>
      </div>
      <button
        onClick={submit}
        disabled={searching || !q.trim()}
        data-cursor
        className="cursor-none font-cormorant italic transition-all duration-300 flex-shrink-0"
        style={{
          padding: '15px 34px',
          fontSize: 16,
          borderRadius: 99,
          border: 'none',
          background: searching || !q.trim()
            ? 'rgba(201,169,110,0.2)'
            : 'linear-gradient(135deg, #D4B87A, #C9A96E, #A8855A)',
          color: searching || !q.trim() ? 'rgba(12,9,4,0.4)' : '#0C0904',
          boxShadow: searching || !q.trim() ? 'none' : '0 0 30px rgba(201,169,110,0.42), 0 8px 28px rgba(0,0,0,0.5)',
          letterSpacing: '0.04em',
          cursor: searching || !q.trim() ? 'not-allowed' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {searching ? 'SE GENEREAZĂ...' : '✦ Generează rețete'}
      </button>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function SuggestiiRetetePage() {
  usePageTracking('suggestii-retete')

  const token = localStorage.getItem('auth_token') || ''

  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [preview, setPreview] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/recipe-suggestions?token=${token}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
      }
    } catch {
      showToast('Nu pot conecta la server.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSuggestions() }, [])

  const handleSearch = async (q) => {
    setSearching(true)
    try {
      const res = await fetch(`${API}/api/recipe-suggestions/search?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      showToast(`${data.count} rețete noi generate ✦`)
      fetchSuggestions()
    } catch {
      showToast('Eroare la generare. Verifică conexiunea la AI.', 'error')
    } finally {
      setSearching(false)
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API}/api/recipe-suggestions/${id}/approve?token=${token}`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Eroare')
      }
      showToast('Rețetă publicată în Inspirație ✦')
      setPreview(null)
      fetchSuggestions()
    } catch (e) {
      showToast(e.message || 'Eroare la aprobare', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(true)
    try {
      await fetch(`${API}/api/recipe-suggestions/${id}/reject?token=${token}`, { method: 'DELETE' })
      showToast('Rețetă ștearsă', 'info')
      setPreview(null)
      fetchSuggestions()
    } catch {
      showToast('Eroare la ștergere', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="relative z-10 h-full overflow-auto px-[52px] pt-[100px] pb-[80px]">

      {/* Toast */}
      {toast && (
        <div className="fixed top-[80px] right-[52px] z-[700] px-[20px] py-[12px] rounded-[12px] text-[12px] transition-all"
          style={{
            background: toast.type === 'success' ? 'rgba(143,175,138,0.2)' : toast.type === 'error' ? 'rgba(196,120,138,0.2)' : 'rgba(201,169,110,0.15)',
            border: `1px solid ${toast.type === 'success' ? '#8FAF8A40' : toast.type === 'error' ? '#C4788A40' : '#C9A96E40'}`,
            color: toast.type === 'success' ? '#8FAF8A' : toast.type === 'error' ? '#C4788A' : '#C9A96E',
            fontFamily: 'Jost, sans-serif', backdropFilter: 'blur(20px)',
          }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-[28px]">
        <div className="text-[9px] tracking-[0.35em] mb-[8px]"
          style={{ color: 'rgba(201,169,110,0.5)', fontFamily: 'Jost, sans-serif' }}>
          SUGESTII · REȚETE AI
        </div>
        <h1 className="font-cormorant italic font-bold text-cream"
          style={{ fontSize: 'clamp(28px,3vw,38px)', letterSpacing: '-0.02em' }}>
          Rețete generate de AI
        </h1>
        <p className="text-[12px] mt-[6px]"
          style={{ color: 'rgba(253,246,236,0.3)', fontFamily: 'Jost, sans-serif' }}>
          Previzualizează fiecare rețetă înainte să o publici în Inspirație
        </p>
      </div>

      {/* Search */}
      <SearchBar onSearch={handleSearch} searching={searching} />

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <div className="font-cormorant italic text-[18px] text-cream/25 animate-pulse">Se încarcă sugestiile...</div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[280px] gap-[16px]">
          <div className="text-[52px] opacity-20">🤖</div>
          <div className="font-cormorant italic text-[22px]" style={{ color: 'rgba(253,246,236,0.25)' }}>
            Nicio sugestie în așteptare
          </div>
          <p className="text-[12px] text-center max-w-[320px]"
            style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif', lineHeight: 1.7 }}>
            Caută un tip de rețetă mai sus și AI-ul va genera variante pe care le poți previzualiza și accepta
          </p>
        </div>
      ) : (
        <>
          <div className="text-[10px] tracking-[0.2em] mb-[16px]"
            style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
            {suggestions.length} REȚETE ÎN AȘTEPTARE
          </div>
          <div className="flex flex-col gap-[12px]">
            {suggestions.map(r => (
              <SuggestionCard key={r.id} r={r} onPreview={setPreview} />
            ))}
          </div>
        </>
      )}

      {/* Preview modal */}
      {preview && (
        <PreviewModal
          r={preview}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setPreview(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
