import { useState, useEffect, useCallback } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'
import { loadInspiratieFirestore } from '../firebase'

const API = 'http://localhost:8000'
const getToken = () => localStorage.getItem('auth_token') || ''

const CATEGORY_LABEL = {
  mic_dejun: 'Mic dejun', pranz: 'Prânz',
  cina: 'Cină', toata_ziua: 'Toată ziua'
}

function StatCard({ label, value, sub, color = '#D4B87A', icon }) {
  return (
    <div style={{
      background: 'rgba(253,246,236,0.03)',
      border: '1px solid rgba(201,169,110,0.12)',
      borderRadius: 20, padding: '22px 26px',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: 'rgba(253,246,236,0.2)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 36, fontWeight: 600, color, lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: 'rgba(253,246,236,0.25)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.28em', color: 'rgba(201,169,110,0.4)', marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function StatusDot({ online }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: online ? '#4CAF50' : '#C4788A',
      boxShadow: online ? '0 0 8px rgba(76,175,80,0.6)' : '0 0 8px rgba(196,120,138,0.6)',
      marginRight: 8,
    }} />
  )
}

export default function AnalyticsPage({ auth }) {
  usePageTracking('analytics')

  const [status, setStatus]     = useState(null)
  const [users, setUsers]       = useState(null)
  const [content, setContent]   = useState(null)
  const [activity, setActivity] = useState(null)
  const [errors, setErrors]     = useState(null)
  const [fbCount, setFbCount]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    const t = getToken()
    try {
      const [s, u, c, a, e] = await Promise.all([
        fetch(`${API}/api/dashboard/status?token=${t}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/dashboard/users?token=${t}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/dashboard/content?token=${t}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/dashboard/activity?token=${t}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/dashboard/errors?token=${t}`).then(r => r.json()).catch(() => null),
      ])
      setStatus(s); setUsers(u); setContent(c); setActivity(a); setErrors(e)
      const o = await fetch(`${API}/api/dashboard/online?token=${t}`).then(r => r.json()).catch(() => ({ online_users: [] }))
      setOnlineUsers(o.online_users || [])

      // Firebase count
      try {
        const fb = await loadInspiratieFirestore()
        setFbCount(fb.length)
      } catch { setFbCount(0) }

      setLastRefresh(new Date().toLocaleTimeString('ro-RO'))
    } catch (err) {
      console.error('Dashboard load error:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh la 30 secunde
  useEffect(() => {
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  return (
    <div className="relative z-10 h-full overflow-auto" style={{ fontFamily: 'Jost, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 52px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 42, color: '#D4B87A', marginBottom: 6 }}>
              Dashboard Tehnic
            </h1>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(253,246,236,0.2)' }}>
              {lastRefresh ? `Actualizat la ${lastRefresh} · Auto-refresh 30s` : 'Se încarcă...'}
            </div>
          </div>
          <button onClick={load} disabled={loading} data-cursor style={{
            padding: '10px 24px', borderRadius: 99, border: '1px solid rgba(201,169,110,0.25)',
            background: 'rgba(201,169,110,0.08)', color: '#D4B87A',
            fontFamily: 'Jost, sans-serif', fontSize: 10, letterSpacing: '0.15em',
            cursor: 'none', opacity: loading ? 0.5 : 1,
          }}>
            {loading ? 'SE ÎNCARCĂ...' : '↻ REÎNCARCĂ'}
          </button>
        </div>

        {/* SECȚIUNEA 1 — STARE SISTEM */}
        <Section title="STARE SISTEM">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <StatCard
              label="BACKEND"
              icon="⚡"
              value={<><StatusDot online={!!status} />{status ? 'Online' : 'Offline'}</>}
              color={status ? '#4CAF50' : '#C4788A'}
            />
            <StatCard label="UPTIME" icon="⏱" value={status?.uptime || '—'} sub="de la ultima pornire" />
            <StatCard label="BAZĂ DE DATE" icon="💾" value={status ? `${status.db_size_mb} MB` : '—'} sub="dimensiune SQLite" />
            <StatCard label="TIMP RĂSPUNS" icon="⚡" value={status?.avg_response_ms ? `${status.avg_response_ms}ms` : '—'} sub="medie cereri" color="rgba(201,169,110,0.9)" />
          </div>
        </Section>

        {/* SECȚIUNEA 2 — UTILIZATORI */}
        <Section title="UTILIZATORI">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <StatCard label="TOTAL UTILIZATORI" icon="👤" value={users?.total_users} />
            <StatCard label="SESIUNI ACTIVE" icon="🔑" value={users?.active_sessions} sub="token-uri valide" />
            <StatCard label="ÎNREGISTRAȚI" icon="📋" value={users?.total_users} sub="conturi create" />
          </div>

          {/* Lista utilizatori */}
          {users?.users?.length > 0 && (
            <div style={{ background: 'rgba(253,246,236,0.02)', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid rgba(201,169,110,0.08)' }}>
                {['UTILIZATOR', 'ROL', 'REȚETE', 'ULTIMA ACTIVITATE'].map(h => (
                  <span key={h} style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(253,246,236,0.2)' }}>{h}</span>
                ))}
              </div>
              {users.users.map((u, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: i < users.users.length - 1 ? '1px solid rgba(253,246,236,0.04)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'rgba(253,246,236,0.7)', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
  <StatusDot online={onlineUsers.includes(u.username)} />
  {u.username}
</span>
                  <span style={{ fontSize: 10, color: u.role === 'creator' ? '#D4B87A' : 'rgba(253,246,236,0.4)', letterSpacing: '0.1em' }}>{u.role?.toUpperCase()}</span>
                  <span style={{ fontSize: 13, color: '#D4B87A', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>{u.recipe_count}</span>
                  <span style={{ fontSize: 10, color: 'rgba(253,246,236,0.3)' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString('ro-RO') : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* SECȚIUNEA 3 — CONȚINUT */}
        <Section title="CONȚINUT">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <StatCard label="TOTAL REȚETE" icon="🍳" value={content?.total_recipes} />
            <StatCard label="PUBLICE" icon="🌍" value={content?.public_recipes} sub="vizibile în Inspirație" color="#4CAF50" />
            <StatCard label="PRIVATE" icon="🔒" value={content?.private_recipes} sub="personale" color="rgba(253,246,236,0.5)" />
            <StatCard label="FIREBASE INSPIRAȚIE" icon="✦" value={fbCount} sub="rețete în cloud" color="#FF9800" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard label="MESAJE AI" icon="🤖" value={content?.total_ai_messages} sub="conversații totale" />
            <StatCard label="CĂMARĂ" icon="🫙" value={content?.total_pantry_items} sub="produse înregistrate" />
            <StatCard label="PLANIFICATOR" icon="📅" value={content?.total_planner_items} sub="mese planificate" />
            <StatCard label="LISTĂ CUMPĂRĂTURI" icon="🛒" value={content?.total_shopping_items} sub="produse totale" />
          </div>
        </Section>

        {/* SECȚIUNEA 4 — ACTIVITATE */}
        <Section title="ACTIVITATE PAGINI">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Top pagini */}
            <div style={{ background: 'rgba(253,246,236,0.02)', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(253,246,236,0.2)', marginBottom: 16 }}>TOP PAGINI VIZITATE</div>
              {activity?.top_pages?.length > 0 ? activity.top_pages.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'rgba(253,246,236,0.6)' }}>{p.page || '—'}</span>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: '#D4B87A' }}>{p.visits}</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(253,246,236,0.05)', borderRadius: 1 }}>
                      <div style={{ height: '100%', borderRadius: 1, background: 'linear-gradient(90deg, #D4B87A, #C9A96E)', width: `${Math.min(100, (p.visits / (activity.top_pages[0]?.visits || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )) : <div style={{ color: 'rgba(253,246,236,0.2)', fontSize: 12 }}>Fără date încă</div>}
            </div>

            {/* Ultimele mesaje AI */}
            <div style={{ background: 'rgba(253,246,236,0.02)', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(253,246,236,0.2)', marginBottom: 16 }}>ULTIMELE MESAJE AI</div>
              {activity?.last_ai_messages?.length > 0 ? activity.last_ai_messages.map((m, i) => (
                <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < activity.last_ai_messages.length - 1 ? '1px solid rgba(253,246,236,0.04)' : 'none' }}>
                  <div style={{ fontSize: 11, color: 'rgba(253,246,236,0.5)', marginBottom: 3 }}>{m.session_id}</div>
                  <div style={{ fontSize: 12, color: 'rgba(253,246,236,0.35)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.content?.slice(0, 60)}{m.content?.length > 60 ? '...' : ''}
                  </div>
                </div>
              )) : <div style={{ color: 'rgba(253,246,236,0.2)', fontSize: 12 }}>Fără conversații încă</div>}
            </div>
          </div>
        </Section>

        {/* SECȚIUNEA 5 — ERORI */}
        <Section title="ERORI & SĂNĂTATE">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            <StatCard
              label="ERORI ÎNREGISTRATE"
              icon="⚠️"
              value={errors?.total_errors ?? 0}
              color={errors?.total_errors > 0 ? '#C4788A' : '#4CAF50'}
              sub={errors?.total_errors > 0 ? 'verifică lista de mai jos' : 'totul funcționează'}
            />
            <StatCard label="CERERI MONITORIZATE" icon="📊" value={errors?.total_requests_tracked ?? 0} sub="ultimele cereri urmărite" />
          </div>

          {/* Lista erori */}
          <div style={{ background: 'rgba(253,246,236,0.02)', border: `1px solid ${errors?.errors?.length > 0 ? 'rgba(196,120,138,0.2)' : 'rgba(201,169,110,0.1)'}`, borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(253,246,236,0.2)', marginBottom: 16 }}>ULTIMELE ERORI</div>
            {errors?.errors?.length > 0 ? errors.errors.slice(0, 10).map((e, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 120px 1fr', gap: 12, padding: '10px 0', borderBottom: i < Math.min(10, errors.errors.length) - 1 ? '1px solid rgba(253,246,236,0.04)' : 'none', alignItems: 'start' }}>
                <span style={{ fontSize: 10, color: 'rgba(253,246,236,0.3)', fontFamily: 'monospace' }}>{e.timestamp}</span>
                <span style={{ fontSize: 10, color: '#C4788A', letterSpacing: '0.1em' }}>{e.source}</span>
                <span style={{ fontSize: 11, color: 'rgba(253,246,236,0.5)' }}>{e.message}</span>
              </div>
            )) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4CAF50', fontSize: 12 }}>
                <StatusDot online={true} /> Nicio eroare înregistrată — aplicația funcționează corect
              </div>
            )}
          </div>
        </Section>

      </div>
    </div>
  )
}
