import { useState, useEffect } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'

const API = 'http://localhost:8000'

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function SuggestiiRetetePage() {
  usePageTracking('suggestii-retete')

  const token = localStorage.getItem('auth_token') || ''

  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [saved, setSaved] = useState([])
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSearch = async () => {
    if (!q.trim() || searching) return
    setSearching(true)
    try {
      const res = await fetch(`${API}/api/recipe-suggestions/search?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSaved(prev => [...(data.recipes || []), ...prev])
      showToast(`${data.count} rețete salvate automat în Rețetele tale ✦`)
      setQ('')
    } catch {
      showToast('Eroare la generare. Verifică conexiunea la AI.', 'error')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="relative z-10 h-full overflow-auto px-[52px] pt-[100px] pb-[80px]">

      {/* Toast */}
      {toast && (
        <div className="fixed top-[80px] right-[52px] z-[700] px-[20px] py-[12px] rounded-[12px] text-[12px] transition-all"
          style={{
            background: toast.type === 'success' ? 'rgba(143,175,138,0.2)' : 'rgba(196,120,138,0.2)',
            border: `1px solid ${toast.type === 'success' ? '#8FAF8A40' : '#C4788A40'}`,
            color: toast.type === 'success' ? '#8FAF8A' : '#C4788A',
            fontFamily: 'Jost, sans-serif', backdropFilter: 'blur(20px)',
          }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-[32px]">
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
          Scrie un tip de rețetă și AI-ul generează 5 rețete cu poze, salvate automat în Rețetele tale
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-[12px] mb-[48px]">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="ex: supe românești, deserturi cu ciocolată, paste italiene..."
          disabled={searching}
          className="flex-1 px-[20px] py-[16px] rounded-[14px] text-[13px] outline-none"
          style={{
            background: 'rgba(253,246,236,0.04)',
            border: '1px solid rgba(201,169,110,0.2)',
            color: 'rgba(253,246,236,0.85)',
            fontFamily: 'Jost, sans-serif',
          }}
        />
        <button
          onClick={handleSearch}
          disabled={searching || !q.trim()}
          style={{
            padding: '16px 32px',
            borderRadius: 14,
            border: 'none',
            background: searching || !q.trim()
              ? 'rgba(201,169,110,0.15)'
              : 'linear-gradient(135deg, #D4B87A, #C9A96E, #A8855A)',
            color: searching || !q.trim() ? 'rgba(12,9,4,0.35)' : '#0C0904',
            fontFamily: 'Jost, sans-serif',
            fontSize: 11,
            letterSpacing: '0.1em',
            fontWeight: 600,
            cursor: searching || !q.trim() ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: searching || !q.trim() ? 'none' : '0 0 30px rgba(201,169,110,0.3)',
            transition: 'all 0.3s',
            minWidth: 160,
          }}
        >
          {searching ? (
            <span className="flex items-center gap-[8px]">
              <span className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(12,9,4,0.3)', borderTopColor: 'rgba(12,9,4,0.7)' }} />
              SE GENEREAZĂ...
            </span>
          ) : '✦ GENEREAZĂ 5 REȚETE'}
        </button>
      </div>

      {/* Loading state */}
      {searching && (
        <div className="flex flex-col items-center justify-center py-[60px] gap-[20px]">
          <div className="relative w-[64px] h-[64px]">
            <div className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(201,169,110,0.1)', borderTopColor: '#D4B87A' }} />
            <div className="absolute inset-[8px] rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(201,169,110,0.05)', borderTopColor: 'rgba(201,169,110,0.4)', animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <div className="font-cormorant italic text-[20px]" style={{ color: 'rgba(253,246,236,0.4)' }}>
            AI-ul generează rețetele...
          </div>
          <p className="text-[11px]" style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
            Poți naviga în altă parte, rețetele se salvează automat
          </p>
        </div>
      )}

      {/* Rețete salvate recent */}
      {!searching && saved.length > 0 && (
        <div>
          <div className="text-[9px] tracking-[0.28em] mb-[16px]"
            style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
            SALVATE ÎN ACEASTĂ SESIUNE — {saved.length} REȚETE
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-[16px]">
            {saved.map(r => (
              <div key={r.id} className="rounded-[16px] overflow-hidden"
                style={{ border: '1px solid rgba(201,169,110,0.15)', background: 'rgba(253,246,236,0.02)' }}>
                <div className="h-[130px] overflow-hidden">
                  <img src={r.image_url} alt={r.name}
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.75) saturate(0.9)' }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                </div>
                <div className="p-[14px]">
                  <div className="font-cormorant italic font-bold text-[15px] text-cream leading-tight">{r.name}</div>
                  <div className="text-[10px] mt-[6px]" style={{ color: 'rgba(143,175,138,0.7)', fontFamily: 'Jost, sans-serif' }}>
                    ✓ Salvată în Rețetele tale
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searching && saved.length === 0 && (
        <div className="flex flex-col items-center justify-center py-[80px] gap-[16px]">
          <div className="text-[60px] opacity-15">✦</div>
          <div className="font-cormorant italic text-[22px]" style={{ color: 'rgba(253,246,236,0.2)' }}>
            Nicio rețetă generată încă
          </div>
          <p className="text-[12px] text-center max-w-[340px]"
            style={{ color: 'rgba(253,246,236,0.15)', fontFamily: 'Jost, sans-serif', lineHeight: 1.8 }}>
            Scrie un tip de mâncare mai sus și AI-ul va genera 5 rețete cu poze, salvate automat în Rețetele tale
          </p>
        </div>
      )}

    </div>
  )
}
