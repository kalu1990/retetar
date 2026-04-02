import { useState, useEffect } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'
import GlassPanel from '../components/GlassPanel'
import GoldButton from '../components/GoldButton'

const API = 'http://localhost:8000'

const STATUS_CONFIG = {
  pending:  { label: 'În așteptare', color: '#C9A96E', bg: 'rgba(201,169,110,0.1)' },
  approved: { label: 'Aprobat',      color: '#8FAF8A', bg: 'rgba(143,175,138,0.1)' },
  rejected: { label: 'Respins',      color: '#C4788A', bg: 'rgba(196,120,138,0.1)' },
  applied:  { label: 'Aplicat',      color: '#8FAF8A', bg: 'rgba(143,175,138,0.08)' },
}

const CATEGORY_ICONS = {
  bug_fix:     '🐛',
  performance: '⚡',
  refactor:    '🔧',
  feature:     '✨',
  security:    '🔒',
  meal:        '🍽️',
  preference:  '💡',
}

function SuggestionCard({ s, onApprove, onReject, onToggle, expanded }) {
  const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending
  const icon = CATEGORY_ICONS[s.category] || '💡'

  return (
    <div
      className="rounded-[20px] overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(253,246,236,0.04)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${expanded ? '#C9A96E40' : 'rgba(253,246,236,0.07)'}`,
        boxShadow: expanded ? '0 8px 40px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-[14px] px-[22px] py-[16px] cursor-none"
        data-cursor
        onClick={() => onToggle(s.id)}
      >
        <div className="text-[22px] flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[10px] mb-[2px]">
            <span className="font-cormorant italic text-[15px] text-cream truncate">{s.title}</span>
            <span className="text-[8px] tracking-[0.2em] px-[8px] py-[2px] rounded-full flex-shrink-0"
              style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
              {cfg.label}
            </span>
          </div>
          <div className="text-[11px] truncate"
            style={{ color: 'rgba(253,246,236,0.35)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>
            {s.description}
          </div>
        </div>
        <div className="flex items-center gap-[8px] flex-shrink-0">
          {s.confidence && (
            <div className="text-right">
              <div className="text-[9px] tracking-[0.15em]"
                style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>CONFIDENCE</div>
              <div className="font-cormorant italic font-bold text-[16px]"
                style={{ color: s.confidence > 0.7 ? '#8FAF8A' : '#C9A96E' }}>
                {Math.round(s.confidence * 100)}%
              </div>
            </div>
          )}
          <div className="text-[12px] transition-transform duration-200"
            style={{
              color: 'rgba(253,246,236,0.2)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>▼</div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-[22px] pb-[20px] border-t border-[rgba(253,246,236,0.05)]">
          <div className="pt-[16px] space-y-[12px]">

            {/* Rationale */}
            {s.rationale && (
              <div>
                <div className="text-[9px] tracking-[0.22em] mb-[6px]"
                  style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>MOTIVAȚIE</div>
                <p className="text-[12px] leading-[1.65]"
                  style={{ color: 'rgba(253,246,236,0.55)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>
                  {s.rationale}
                </p>
              </div>
            )}

            {/* Target file */}
            {s.target_file && (
              <div className="flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px]"
                style={{ background: 'rgba(253,246,236,0.03)', border: '1px solid rgba(253,246,236,0.06)' }}>
                <span style={{ color: 'rgba(253,246,236,0.25)', fontSize: 11 }}>📁</span>
                <span className="text-[11px]"
                  style={{ color: '#C9A96E', fontFamily: "'Courier New', monospace" }}>
                  {s.target_file}
                </span>
              </div>
            )}

            {/* Code diff */}
            {(s.old_code || s.suggested_code) && (
              <div className="flex flex-col gap-[10px]">
                {s.old_code && (
                  <div>
                    <div className="text-[9px] tracking-[0.22em] mb-[6px]"
                      style={{ color: 'rgba(196,120,138,0.6)', fontFamily: 'Jost, sans-serif' }}>
                      ✕ COD VECHI
                    </div>
                    <pre className="text-[11px] p-[14px] rounded-[10px] overflow-x-auto leading-[1.6]"
                      style={{
                        background: 'rgba(196,120,138,0.06)',
                        border: '1px solid rgba(196,120,138,0.2)',
                        color: 'rgba(196,120,138,0.7)',
                        fontFamily: "'Courier New', monospace",
                        maxHeight: 200,
                      }}>
                      {s.old_code}
                    </pre>
                  </div>
                )}
                {s.suggested_code && (
                  <div>
                    <div className="text-[9px] tracking-[0.22em] mb-[6px]"
                      style={{ color: 'rgba(143,175,138,0.6)', fontFamily: 'Jost, sans-serif' }}>
                      ✓ COD NOU
                    </div>
                    <pre className="text-[11px] p-[14px] rounded-[10px] overflow-x-auto leading-[1.6]"
                      style={{
                        background: 'rgba(143,175,138,0.06)',
                        border: '1px solid rgba(143,175,138,0.2)',
                        color: 'rgba(143,175,138,0.7)',
                        fontFamily: "'Courier New', monospace",
                        maxHeight: 200,
                      }}>
                      {s.suggested_code}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="text-[10px]"
              style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
              Generat: {new Date(s.created_at).toLocaleString('ro-RO')}
            </div>

            {/* Actions */}
            {s.status === 'pending' && (
              <div className="flex gap-[10px] pt-[4px]">
                <GoldButton small onClick={() => onApprove(s.id)}>
                  ✓ Aprobă
                </GoldButton>
                <button
                  onClick={() => onReject(s.id)}
                  data-cursor
                  className="px-[22px] py-[9px] rounded-full text-[10px] tracking-[0.18em] cursor-none transition-all duration-200"
                  style={{
                    background: 'rgba(196,120,138,0.1)',
                    border: '1px solid rgba(196,120,138,0.25)',
                    color: '#C4788A',
                    fontFamily: 'Jost, sans-serif',
                  }}
                >
                  ✕ Respinge
                </button>
              </div>
            )}
            {s.status === 'approved' && (
              <div className="text-[11px] flex items-center gap-[6px]"
                style={{ color: '#8FAF8A', fontFamily: 'Jost, sans-serif' }}>
                <span>✓</span> Aprobat — gata de aplicat
              </div>
            )}
            {s.status === 'rejected' && (
              <div className="text-[11px] flex items-center gap-[6px]"
                style={{ color: '#C4788A', fontFamily: 'Jost, sans-serif' }}>
                <span>✕</span> Respins
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-[60px] gap-[16px]">
      <div className="text-[48px] opacity-20">
        {filter === 'pending' ? '🔔' : filter === 'approved' ? '✅' : filter === 'rejected' ? '✕' : '💡'}
      </div>
      <div className="text-[13px]" style={{ color: 'rgba(253,246,236,0.25)', fontFamily: 'Jost, sans-serif' }}>
        {filter === 'pending' ? 'Nicio sugestie în așteptare' : `Nicio sugestie cu status "${filter}"`}
      </div>
      <div className="text-[11px]" style={{ color: 'rgba(253,246,236,0.15)', fontFamily: 'Jost, sans-serif' }}>
        Sugestiile apar automat pe măsură ce AI-ul analizează aplicația
      </div>
    </div>
  )
}

export default function SuggestiiPage() {

  const token = localStorage.getItem('auth_token') || ''
  usePageTracking('suggestii')

  const [suggestions, setSuggestions] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [stats, setStats] = useState(null)
  const [autoScanRunning, setAutoScanRunning] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/suggestions/autoscan/status?token=${token}`)
      .then(r => r.json())
      .then(d => setAutoScanRunning(d.running || false))
      .catch(() => {})
  }, [])

  const toggleAutoScan = async () => {
    const endpoint = autoScanRunning ? 'stop' : 'start'
    try {
      await fetch(`${API}/api/suggestions/autoscan/${endpoint}?token=${token}`, { method: 'POST' })
      setAutoScanRunning(v => !v)
      setFeedback({ type: 'info', msg: autoScanRunning ? '⏹ Auto-scan oprit' : '▶ Auto-scan pornit' })
      setTimeout(() => setFeedback(null), 3000)
    } catch {
      setFeedback({ type: 'error', msg: 'Eroare la comutare auto-scan' })
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const fetchSuggestions = async (status = filter) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/suggestions?status=${status}&token=${token}`)
      const data = await res.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/suggestions/stats?token=${token}`)
      if (res.ok) setStats(await res.json())
    } catch {}
  }

  const handleScan = async (fileName = 'retetar_api.py') => {
    setScanning(true)
    setFeedback({ type: 'info', msg: `⏳ AI analizează ${fileName}...` })
    try {
      const res = await fetch(`${API}/api/suggestions/scan?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: fileName, focus: 'general' })
      })
      if (!res.ok) {
        if (res.status === 429) {
          const body = await res.json().catch(() => ({}))
          const detail = body.detail || ''
          const seconds = detail.startsWith('RATE_LIMIT:') ? parseInt(detail.split(':')[1]) : 60
          let remaining = seconds
          setRateLimited(true)
          setFeedback({ type: 'error', msg: `⏳ Limită Gemini atinsă. Așteaptă ${remaining}s...` })
          const countdown = setInterval(() => {
            remaining -= 1
            if (remaining <= 0) {
              clearInterval(countdown)
              setFeedback({ type: 'info', msg: '✅ Poți scana din nou în 10s...' })
              setTimeout(() => {
                setRateLimited(false)
                setFeedback({ type: 'info', msg: '✅ Poți scana din nou!' })
                setTimeout(() => setFeedback(null), 3000)
              }, 10000)
            } else {
              setFeedback({ type: 'error', msg: `⏳ Limită Gemini atinsă. Așteaptă ${remaining}s...` })
            }
          }, 1000)
        } else {
          setFeedback({ type: 'error', msg: 'Eroare la scanare' })
          setTimeout(() => setFeedback(null), 5000)
        }
        setScanning(false)
        return
      }
      const data = await res.json()
      if (data.suggestion) {
        setFeedback({ type: 'success', msg: `💡 Sugestie nouă: ${data.suggestion.title}` })
        setFilter('pending')
        fetchSuggestions('pending')
        fetchStats()
        setTimeout(() => setFeedback(null), 5000)
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Eroare la scanare' })
      setTimeout(() => setFeedback(null), 5000)
    } finally {
      setScanning(false)
    }
  }

  useEffect(() => {
    fetchSuggestions(filter)
    fetchStats()
  }, [filter])

  const handleApprove = async (id) => {
    try {
      await fetch(`${API}/api/suggestions/${id}/approve?token=${token}`, { method: 'POST' })
      setFeedback({ type: 'success', msg: 'Sugestie aprobată ✓' })
      fetchSuggestions()
      fetchStats()
    } catch {
      setFeedback({ type: 'error', msg: 'Eroare la aprobare' })
    }
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleReject = async (id) => {
    try {
      await fetch(`${API}/api/suggestions/${id}/reject?token=${token}`, { method: 'POST' })
      setFeedback({ type: 'info', msg: 'Sugestie respinsă' })
      fetchSuggestions()
      fetchStats()
    } catch {
      setFeedback({ type: 'error', msg: 'Eroare la respingere' })
    }
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleToggle = (id) => setExpanded(expanded === id ? null : id)

  const FILTERS = [
    { id: 'pending',  label: 'În așteptare' },
    { id: 'approved', label: 'Aprobate' },
    { id: 'rejected', label: 'Respinse' },
    { id: 'applied',  label: 'Aplicate' },
  ]

  return (
    <div className="relative z-10 h-full overflow-auto px-[52px] pt-[100px] pb-[80px]">

      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-[80px] right-[52px] z-50 px-[20px] py-[12px] rounded-[12px] text-[12px]"
          style={{
            background: feedback.type === 'success' ? 'rgba(143,175,138,0.2)' : feedback.type === 'error' ? 'rgba(196,120,138,0.2)' : 'rgba(201,169,110,0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#8FAF8A40' : feedback.type === 'error' ? '#C4788A40' : '#C9A96E40'}`,
            color: feedback.type === 'success' ? '#8FAF8A' : feedback.type === 'error' ? '#C4788A' : '#C9A96E',
            fontFamily: 'Jost, sans-serif',
            backdropFilter: 'blur(20px)',
          }}>
          {feedback.msg}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-[12px] mb-[24px]">
          {[
            { label: 'Total', value: stats.total || 0, color: '#C9A96E' },
            { label: 'În așteptare', value: stats.pending || 0, color: '#C9A96E' },
            { label: 'Acceptate', value: stats.approved || 0, color: '#8FAF8A' },
            { label: 'Respinse', value: stats.rejected || 0, color: '#C4788A' },
          ].map((s, i) => (
            <GlassPanel key={i} style={{ padding: '16px 20px' }}>
              <div className="text-[9px] tracking-[0.2em] mb-[6px]"
                style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>{s.label.toUpperCase()}</div>
              <div className="font-cormorant italic font-bold text-[28px]"
                style={{ color: s.color }}>{s.value}</div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-[8px] mb-[20px]">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} data-cursor
            className="px-[18px] py-[8px] rounded-full text-[10px] tracking-[0.15em] cursor-none transition-all duration-200"
            style={{
              background: filter === f.id ? 'linear-gradient(135deg, rgba(201,169,110,0.2), rgba(201,169,110,0.08))' : 'rgba(253,246,236,0.03)',
              border: `1px solid ${filter === f.id ? 'rgba(201,169,110,0.4)' : 'rgba(253,246,236,0.07)'}`,
              color: filter === f.id ? '#C9A96E' : 'rgba(253,246,236,0.35)',
              fontFamily: 'Jost, sans-serif',
            }}>
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => fetchSuggestions()} data-cursor
          className="px-[18px] py-[8px] rounded-full text-[10px] tracking-[0.15em] cursor-none transition-all duration-200"
          style={{
            background: 'rgba(253,246,236,0.03)',
            border: '1px solid rgba(253,246,236,0.07)',
            color: 'rgba(253,246,236,0.35)',
            fontFamily: 'Jost, sans-serif',
          }}>
          ↻ Reîncarcă
        </button>
        <button onClick={toggleAutoScan} data-cursor
          className="px-[18px] py-[8px] rounded-full text-[10px] tracking-[0.15em] cursor-none transition-all duration-200"
          style={{
            background: autoScanRunning ? 'rgba(196,120,138,0.15)' : 'linear-gradient(135deg, rgba(143,175,138,0.2), rgba(143,175,138,0.08))',
            border: `1px solid ${autoScanRunning ? 'rgba(196,120,138,0.35)' : 'rgba(143,175,138,0.35)'}`,
            color: autoScanRunning ? '#C4788A' : '#8FAF8A',
            fontFamily: 'Jost, sans-serif',
          }}>
          {autoScanRunning ? '⏹ OPREȘTE' : '▶ PORNEȘTE'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-[60px]">
          <div className="w-[6px] h-[6px] rounded-full"
            style={{ background: '#C9A96E', boxShadow: '0 0 10px #C9A96E', animation: 'pulse-dot 1s ease-in-out infinite' }} />
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="flex flex-col gap-[10px]">
          {suggestions.map(s => (
            <SuggestionCard
              key={s.id}
              s={s}
              onApprove={handleApprove}
              onReject={handleReject}
              onToggle={handleToggle}
              expanded={expanded === s.id}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <GlassPanel style={{ marginTop: 24, padding: '18px 22px' }} accent="#C9A96E">
        <div className="flex gap-[14px] items-start">
          <div className="text-[20px] flex-shrink-0">💡</div>
          <div>
            <div className="font-cormorant italic text-[14px] text-cream mb-[4px]">Cum funcționează</div>
            <p className="text-[11px] leading-[1.7]"
              style={{ color: 'rgba(253,246,236,0.4)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>
              AI-ul analizează aplicația și propune îmbunătățiri. Tu alegi ce aplici.
              Sugestiile aprobate se salvează în <span style={{ color: '#C9A96E', fontFamily: 'monospace' }}>Sugestii_Aplicatie/approved/</span>.
              Cele respinse ajută AI-ul să înțeleagă preferințele tale.
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
