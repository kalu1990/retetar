import { useState, useEffect } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'
import GlassPanel from '../components/GlassPanel'
import GoldButton from '../components/GoldButton'

const API = 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('auth_token') || ''
}

export default function ProfilePage({ auth, onLogout }) {
  usePageTracking('profil')
  const [tab, setTab] = useState('profil')
  const [prefs, setPrefs] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // PIN change
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPin2, setNewPin2] = useState('')
  const [pinLoading, setPinLoading] = useState(false)

  // New user
  const [newUser, setNewUser] = useState({ username: '', pin: '', role: 'user' })
  const [userLoading, setUserLoading] = useState(false)

  const isCreator = auth?.role === 'creator'
  const token = getToken()

  useEffect(() => {
    loadPrefs()
    loadStats()
    if (isCreator) loadUsers()
  }, [])

  const loadPrefs = async () => {
    try {
      const data = await fetch(`${API}/api/preferences?token=${token}`).then(r => r.json())
      setPrefs(data)
    } catch {}
  }

  const loadUsers = async () => {
    try {
      const data = await fetch(`${API}/api/auth/users?token=${token}`).then(r => r.json())
      setUsers(data)
    } catch {}
  }

  const loadStats = async () => {
    try {
      const [sug, events] = await Promise.all([
        fetch(`${API}/api/suggestions/stats?token=${token}`).then(r => r.json()),
        fetch(`${API}/api/preferences?token=${token}`).then(r => r.json()),
      ])
      setStats({ suggestions: sug, prefsCount: events.length })
    } catch {}
  }

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  const changePin = async () => {
    if (newPin !== newPin2) return showFeedback('error', 'PIN-urile noi nu coincid')
    if (newPin.length < 4) return showFeedback('error', 'PIN-ul trebuie să aibă minim 4 cifre')
    setPinLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/change-pin?token=${token}&old_pin=${oldPin}&new_pin=${newPin}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      showFeedback('success', '✅ PIN schimbat cu succes!')
      setOldPin(''); setNewPin(''); setNewPin2('')
    } catch (e) {
      showFeedback('error', e.message || 'Eroare la schimbarea PIN-ului')
    } finally { setPinLoading(false) }
  }

  const createUser = async () => {
    if (!newUser.username.trim() || newUser.pin.length < 4) return
    setUserLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/users?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      showFeedback('success', `✅ User "${newUser.username}" creat!`)
      setNewUser({ username: '', pin: '', role: 'user' })
      loadUsers()
    } catch (e) {
      showFeedback('error', e.message || 'Eroare la creare user')
    } finally { setUserLoading(false) }
  }

  const deleteUser = async (username) => {
    if (!confirm(`Ștergi userul "${username}"?`)) return
    try {
      await fetch(`${API}/api/auth/users?token=${token}&username=${username}`, { method: 'DELETE' })
      showFeedback('success', `✅ User "${username}" șters`)
      loadUsers()
    } catch {}
  }

  const TABS = [
    { id: 'profil', label: 'Profil' },
    { id: 'preferinte', label: 'Preferințe' },
    ...(isCreator ? [
      { id: 'utilizatori', label: 'Utilizatori' },
      { id: 'securitate', label: 'Securitate' },
    ] : [{ id: 'securitate', label: 'Securitate' }])
  ]

  return (
    <div className="relative z-10 h-full overflow-auto px-[52px] pt-[100px] pb-[80px]">

      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-[80px] right-[52px] z-50 px-[20px] py-[12px] rounded-[12px] text-[12px]"
          style={{
            background: feedback.type === 'success' ? 'rgba(143,175,138,0.15)' : 'rgba(196,120,138,0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#8FAF8A40' : '#C4788A40'}`,
            color: feedback.type === 'success' ? '#8FAF8A' : '#C4788A',
            fontFamily: 'Jost, sans-serif', backdropFilter: 'blur(20px)',
          }}>{feedback.msg}</div>
      )}

      <div className="max-w-[720px] mx-auto">

        {/* Header */}
        <div className="flex items-center gap-[20px] mb-[32px]">
          <div className="w-[64px] h-[64px] rounded-[18px] flex items-center justify-center text-[24px] font-bold"
            style={{
              background: isCreator ? 'linear-gradient(135deg, #D4B87A, #8B6914)' : 'linear-gradient(135deg, #8FAF8A, #5A7A5A)',
              boxShadow: `0 0 30px ${isCreator ? 'rgba(201,169,110,0.4)' : 'rgba(143,175,138,0.3)'}`,
              color: '#0C0904',
            }}>
            {(auth?.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-cormorant italic font-bold text-[28px] text-cream">{auth?.username}</h1>
            <div className="flex items-center gap-[8px] mt-[2px]">
              {isCreator && (
                <span className="text-[8px] tracking-[0.2em] px-[8px] py-[2px] rounded-full"
                  style={{ color: '#C9A96E', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)', fontFamily: 'Jost, sans-serif' }}>
                  CREATOR
                </span>
              )}
              <span className="text-[11px]" style={{ color: 'rgba(253,246,236,0.3)', fontFamily: 'Jost, sans-serif' }}>
                {auth?.role === 'creator' ? 'Administrator aplicație' : 'Utilizator'}
              </span>
            </div>
          </div>
          <div className="ml-auto">
            <button onClick={onLogout} data-cursor className="px-[18px] py-[9px] rounded-full text-[10px] tracking-[0.15em] cursor-none transition-all"
              style={{ background: 'rgba(196,120,138,0.08)', border: '1px solid rgba(196,120,138,0.2)', color: '#C4788A', fontFamily: 'Jost, sans-serif' }}>
              IEȘI DIN CONT
            </button>
          </div>
        </div>

        {/* Stats dacă e creator */}
        {isCreator && stats && (
          <div className="grid grid-cols-4 gap-[10px] mb-[24px]">
            {[
              { label: 'Sugestii total', value: stats.suggestions?.total || 0, color: '#C9A96E' },
              { label: 'Aprobate', value: stats.suggestions?.approved || 0, color: '#8FAF8A' },
              { label: 'Respinse', value: stats.suggestions?.rejected || 0, color: '#C4788A' },
              { label: 'Preferințe', value: stats.prefsCount || 0, color: '#C9A96E' },
            ].map((s, i) => (
              <GlassPanel key={i} style={{ padding: '14px 18px' }}>
                <div className="text-[8px] tracking-[0.18em] mb-[4px]" style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>{s.label.toUpperCase()}</div>
                <div className="font-cormorant italic font-bold text-[24px]" style={{ color: s.color }}>{s.value}</div>
              </GlassPanel>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-[6px] mb-[20px]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} data-cursor
              className="px-[18px] py-[8px] rounded-full text-[10px] tracking-[0.15em] cursor-none transition-all duration-200"
              style={{
                background: tab === t.id ? 'rgba(201,169,110,0.15)' : 'rgba(253,246,236,0.03)',
                border: `1px solid ${tab === t.id ? 'rgba(201,169,110,0.4)' : 'rgba(253,246,236,0.07)'}`,
                color: tab === t.id ? '#C9A96E' : 'rgba(253,246,236,0.35)',
                fontFamily: 'Jost, sans-serif',
              }}>{t.label}</button>
          ))}
        </div>

        {/* Tab: Profil */}
        {tab === 'profil' && (
          <GlassPanel style={{ padding: '24px 28px' }}>
            <div className="text-[9px] tracking-[0.22em] mb-[16px]" style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>INFORMAȚII CONT</div>
            <div className="flex flex-col gap-[12px]">
              {[
                { label: 'Username', value: auth?.username },
                { label: 'Rol', value: auth?.role === 'creator' ? 'Creator / Administrator' : 'Utilizator' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-[10px]"
                  style={{ borderBottom: '1px solid rgba(253,246,236,0.04)' }}>
                  <span className="text-[10px] tracking-[0.15em]" style={{ color: 'rgba(253,246,236,0.25)', fontFamily: 'Jost, sans-serif' }}>{row.label.toUpperCase()}</span>
                  <span className="text-[13px]" style={{ color: 'rgba(253,246,236,0.7)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        )}

        {/* Tab: Preferințe */}
        {tab === 'preferinte' && (
          <div className="flex flex-col gap-[8px]">
            <div className="text-[9px] tracking-[0.22em] mb-[8px]" style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
              CE ȘTIE AI-UL DESPRE TINE ({prefs.length})
            </div>
            {prefs.length === 0 ? (
              <div className="text-center py-[40px]" style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif', fontSize: 13 }}>
                Nicio preferință salvată încă. Spune-i AI-ului ceva despre tine!
              </div>
            ) : (
              prefs.map(p => (
                <div key={p.id} className="flex items-center gap-[14px] px-[18px] py-[12px] rounded-[12px]"
                  style={{ background: 'rgba(253,246,236,0.03)', border: '1px solid rgba(253,246,236,0.05)' }}>
                  <div className="flex-1">
                    <span className="text-[10px] tracking-[0.12em]" style={{ color: 'rgba(201,169,110,0.5)', fontFamily: 'Jost, sans-serif' }}>
                      {p.category}/{p.key}
                    </span>
                    <div className="text-[13px] mt-[2px]" style={{ color: 'rgba(253,246,236,0.7)', fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>{p.value}</div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <span className="text-[8px] px-[8px] py-[2px] rounded-full tracking-[0.12em]"
                      style={{ color: p.source === 'explicit' ? '#8FAF8A' : '#C9A96E', background: p.source === 'explicit' ? 'rgba(143,175,138,0.1)' : 'rgba(201,169,110,0.08)', fontFamily: 'Jost, sans-serif' }}>
                      {p.source}
                    </span>
                    <span className="text-[9px]" style={{ color: 'rgba(253,246,236,0.15)', fontFamily: 'Jost, sans-serif' }}>
                      {p.created_at?.slice(0,10)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Utilizatori (creator only) */}
        {tab === 'utilizatori' && isCreator && (
          <div className="flex flex-col gap-[16px]">
            {/* Add user */}
            <GlassPanel style={{ padding: '20px 24px' }} accent="#C9A96E">
              <div className="text-[9px] tracking-[0.22em] mb-[14px]" style={{ color: 'rgba(201,169,110,0.5)', fontFamily: 'Jost, sans-serif' }}>ADAUGĂ UTILIZATOR NOU</div>
              <div className="grid grid-cols-3 gap-[10px] mb-[12px]">
                <div>
                  <div className="text-[8px] tracking-[0.15em] mb-[5px]" style={{ color: 'rgba(253,246,236,0.25)', fontFamily: 'Jost, sans-serif' }}>USERNAME</div>
                  <input value={newUser.username} onChange={e => setNewUser(p => ({...p, username: e.target.value}))}
                    placeholder="ex: maria"
                    className="w-full rounded-full px-[14px] py-[9px] text-[12px] text-cream outline-none"
                    style={{ background: 'rgba(253,246,236,0.04)', border: '1px solid rgba(201,169,110,0.2)', fontFamily: 'Jost, sans-serif' }} />
                </div>
                <div>
                  <div className="text-[8px] tracking-[0.15em] mb-[5px]" style={{ color: 'rgba(253,246,236,0.25)', fontFamily: 'Jost, sans-serif' }}>PIN (min 4 cifre)</div>
                  <input type="password" value={newUser.pin} onChange={e => setNewUser(p => ({...p, pin: e.target.value.replace(/\D/g,'').slice(0,8)}))}
                    placeholder="····"
                    className="w-full rounded-full px-[14px] py-[9px] text-[14px] text-cream outline-none tracking-[0.3em]"
                    style={{ background: 'rgba(253,246,236,0.04)', border: '1px solid rgba(201,169,110,0.2)', fontFamily: 'Jost, sans-serif' }} />
                </div>
                <div>
                  <div className="text-[8px] tracking-[0.15em] mb-[5px]" style={{ color: 'rgba(253,246,236,0.25)', fontFamily: 'Jost, sans-serif' }}>ROL</div>
                  <select value={newUser.role} onChange={e => setNewUser(p => ({...p, role: e.target.value}))}
                    className="w-full rounded-full px-[14px] py-[9px] text-[12px] text-cream outline-none"
                    style={{ background: 'rgba(253,246,236,0.04)', border: '1px solid rgba(201,169,110,0.2)', fontFamily: 'Jost, sans-serif' }}>
                    <option value="user" style={{background:'#0C0904'}}>Utilizator</option>
                    <option value="creator" style={{background:'#0C0904'}}>Creator</option>
                  </select>
                </div>
              </div>
              <GoldButton small onClick={createUser} style={{ opacity: userLoading ? 0.6 : 1 }}>
                {userLoading ? 'Se creează...' : '+ Creează cont'}
              </GoldButton>
            </GlassPanel>

            {/* Users list */}
            <div className="flex flex-col gap-[6px]">
              <div className="text-[9px] tracking-[0.22em] mb-[8px]" style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>
                CONTURI ACTIVE ({users.length})
              </div>
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-[14px] px-[18px] py-[13px] rounded-[14px]"
                  style={{ background: 'rgba(253,246,236,0.03)', border: '1px solid rgba(253,246,236,0.05)' }}>
                  <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[12px] font-bold"
                    style={{ background: u.role === 'creator' ? 'linear-gradient(135deg, #D4B87A, #8B6914)' : 'rgba(143,175,138,0.2)', color: u.role === 'creator' ? '#0C0904' : '#8FAF8A' }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] text-cream" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 300 }}>{u.username}</div>
                    <div className="text-[10px] mt-[1px]" style={{ color: 'rgba(253,246,236,0.25)', fontFamily: 'Jost, sans-serif' }}>
                      Ultimul login: {u.last_login ? u.last_login.slice(0,16) : 'niciodată'}
                    </div>
                  </div>
                  <span className="text-[8px] tracking-[0.15em] px-[8px] py-[2px] rounded-full"
                    style={{ color: u.role === 'creator' ? '#C9A96E' : '#8FAF8A', background: u.role === 'creator' ? 'rgba(201,169,110,0.1)' : 'rgba(143,175,138,0.1)', fontFamily: 'Jost, sans-serif' }}>
                    {u.role.toUpperCase()}
                  </span>
                  {u.role !== 'creator' && (
                    <button onClick={() => deleteUser(u.username)} data-cursor className="text-[11px] cursor-none transition-all"
                      style={{ color: 'rgba(253,246,236,0.15)', background: 'none', border: 'none' }}
                      onMouseEnter={e => e.target.style.color='rgba(196,120,138,0.7)'}
                      onMouseLeave={e => e.target.style.color='rgba(253,246,236,0.15)'}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Securitate */}
        {tab === 'securitate' && (
          <GlassPanel style={{ padding: '24px 28px' }}>
            <div className="text-[9px] tracking-[0.22em] mb-[20px]" style={{ color: 'rgba(253,246,236,0.2)', fontFamily: 'Jost, sans-serif' }}>SCHIMBĂ PIN-UL</div>
            <div className="flex flex-col gap-[14px] max-w-[320px]">
              {[
                { label: 'PIN actual', val: oldPin, set: setOldPin },
                { label: 'PIN nou', val: newPin, set: setNewPin },
                { label: 'Confirmă PIN nou', val: newPin2, set: setNewPin2 },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <div className="text-[8px] tracking-[0.18em] mb-[6px]" style={{ color: 'rgba(253,246,236,0.25)', fontFamily: 'Jost, sans-serif' }}>{label.toUpperCase()}</div>
                  <input type="password" value={val} onChange={e => set(e.target.value.replace(/\D/g,'').slice(0,8))}
                    placeholder="····" maxLength={8}
                    className="w-full rounded-full px-[18px] py-[12px] text-[18px] text-cream outline-none tracking-[0.3em]"
                    style={{ background: 'rgba(253,246,236,0.04)', border: '1px solid rgba(201,169,110,0.2)', fontFamily: 'Jost, sans-serif' }}
                    onFocus={e => e.target.style.borderColor='rgba(201,169,110,0.5)'}
                    onBlur={e => e.target.style.borderColor='rgba(201,169,110,0.2)'} />
                </div>
              ))}
              <GoldButton onClick={changePin} style={{ marginTop: 8, opacity: pinLoading ? 0.6 : 1 }}>
                {pinLoading ? 'Se schimbă...' : 'Schimbă PIN-ul'}
              </GoldButton>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  )
}
