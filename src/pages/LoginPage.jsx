import { useState } from 'react'
const API = 'http://localhost:8000'

export default function LoginPage({ onLogin }) {
  const [mode, setMode]             = useState('login') // 'login' | 'register'
  const [username, setUsername]     = useState('')
  const [pin, setPin]               = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // ── Login cu Google ──────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      // Cere backend-ului un URL de autentificare Google
      const res = await fetch(`${API}/api/auth/google/url`)
      const data = await res.json()

      if (!res.ok) {
        setError('Nu pot genera URL de autentificare')
        setGoogleLoading(false)
        return
      }

      // Deschide browser-ul extern pentru Google login
      if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(data.url)
      } else {
        window.open(data.url, '_blank')
      }

      // Ascultă callback-ul de la backend (polling)
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API}/api/auth/google/callback/poll?state=${data.state}`)
          if (pollRes.ok) {
            const authData = await pollRes.json()
            clearInterval(pollInterval)
            localStorage.setItem('auth_token', authData.token)
            localStorage.setItem('auth_user', JSON.stringify({ username: authData.username, role: authData.role }))
            onLogin(authData)
          }
        } catch {}
      }, 1000)

      // Stop polling după 5 minute
      setTimeout(() => {
        clearInterval(pollInterval)
        setGoogleLoading(false)
        setError('Timp expirat. Încearcă din nou.')
      }, 300000)

    } catch (err) {
      console.error('Google auth error:', err)
      setError('Nu mă pot conecta la server')
      setGoogleLoading(false)
    }
  }

  // ── Login cu PIN ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!username.trim() || pin.length < 4) return
    if (mode === 'register' && pin !== pinConfirm) {
      setError('PIN-urile nu coincid')
      return
    }
    setLoading(true)
    setError('')

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), pin })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_user', JSON.stringify({ username: data.username, role: data.role }))
        onLogin(data)
      } else {
        setError(data.detail || 'Eroare la autentificare')
      }
    } catch {
      setError('Nu mă pot conecta la server')
    }
    setLoading(false)
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
    setPin('')
    setPinConfirm('')
  }

  const inputStyle = {
    width: '100%', padding: '12px 18px',
    background: 'rgba(253,246,236,0.04)',
    border: '1px solid rgba(201,169,110,0.2)',
    borderRadius: 50, color: '#FDF6EC', fontSize: 14,
    outline: 'none', fontFamily: "'Jost', sans-serif", fontWeight: 300,
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at 30% 40%, #1A1008 0%, #0B0806 55%, #060402 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Jost', sans-serif",
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,600;1,700&family=Jost:wght@300;400;500&display=swap"/>

      {/* Orbs decorative */}
      <div style={{ position:'fixed', width:500, height:500, top:'-10%', right:'-5%',
        background:'radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 65%)',
        borderRadius:'50%', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', width:400, height:400, bottom:'-8%', left:'-5%',
        background:'radial-gradient(circle, rgba(196,120,138,0.06) 0%, transparent 65%)',
        borderRadius:'50%', pointerEvents:'none' }}/>

      <div style={{
        width: 'min(420px, 90vw)',
        background: 'linear-gradient(160deg, rgba(253,246,236,0.06) 0%, rgba(253,246,236,0.02) 100%)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(201,169,110,0.2)',
        borderRadius: 28,
        padding: '48px 44px',
        boxShadow: '0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,169,110,0.15)',
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}>
        {/* Linie aurie sus */}
        <div style={{ position:'absolute', top:0, left:'5%', right:'5%', height:1,
          background:'linear-gradient(90deg, transparent, rgba(201,169,110,0.7), transparent)' }}/>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:56, height:56, borderRadius:16, margin:'0 auto 16px',
            background:'linear-gradient(135deg, #D4B87A, #C9A96E, #A8855A)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:26, boxShadow:'0 0 30px rgba(201,169,110,0.5)',
          }}>🍳</div>
          <div style={{
            fontFamily:"'Cormorant Garamond', serif",
            fontStyle:'italic', fontWeight:700,
            fontSize:28, color:'#FDF6EC', letterSpacing:'-0.01em',
          }}>Bucătăria Mea</div>
          <div style={{ fontSize:11, color:'rgba(201,169,110,0.5)', letterSpacing:'0.2em', marginTop:4 }}>
            {mode === 'login' ? 'AI COOKING PLATFORM' : 'CONT NOU'}
          </div>
        </div>

        {/* ── Buton Google ─────────────────────────────────────────── */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          style={{
            width: '100%', padding: '13px 18px',
            background: googleLoading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 50, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            transition: 'all 0.2s', marginBottom: 20,
            opacity: googleLoading ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.background = googleLoading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)' }}
        >
          {/* Google Icon SVG */}
          {googleLoading ? (
            <div style={{
              width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)',
              borderTopColor: '#fff', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}/>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
          )}
          <span style={{ color: 'rgba(253,246,236,0.8)', fontSize: 13, fontFamily: "'Jost', sans-serif", letterSpacing: '0.06em' }}>
            {googleLoading ? 'SE CONECTEAZĂ...' : 'CONTINUĂ CU GOOGLE'}
          </span>
        </button>

        {/* ── Separator ────────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:'rgba(253,246,236,0.08)' }}/>
          <span style={{ fontSize:10, color:'rgba(253,246,236,0.2)', letterSpacing:'0.2em' }}>SAU</span>
          <div style={{ flex:1, height:1, background:'rgba(253,246,236,0.08)' }}/>
        </div>

        {/* ── Form PIN ─────────────────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.22em', color:'rgba(253,246,236,0.3)', marginBottom:8 }}>USERNAME</div>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Numele tău"
              autoFocus
              style={inputStyle}
              onFocus={e => e.target.style.borderColor='rgba(201,169,110,0.5)'}
              onBlur={e => e.target.style.borderColor='rgba(201,169,110,0.2)'}
            />
          </div>

          <div>
            <div style={{ fontSize:9, letterSpacing:'0.22em', color:'rgba(253,246,236,0.3)', marginBottom:8 }}>PIN</div>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="····"
              maxLength={8}
              style={{ ...inputStyle, fontSize:20, letterSpacing:'0.3em' }}
              onFocus={e => e.target.style.borderColor='rgba(201,169,110,0.5)'}
              onBlur={e => e.target.style.borderColor='rgba(201,169,110,0.2)'}
            />
          </div>

          {mode === 'register' && (
            <div>
              <div style={{ fontSize:9, letterSpacing:'0.22em', color:'rgba(253,246,236,0.3)', marginBottom:8 }}>CONFIRMĂ PIN</div>
              <input
                type="password"
                value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="····"
                maxLength={8}
                style={{ ...inputStyle, fontSize:20, letterSpacing:'0.3em' }}
                onFocus={e => e.target.style.borderColor='rgba(201,169,110,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(201,169,110,0.2)'}
              />
            </div>
          )}

          {error && (
            <div style={{
              padding:'10px 16px', borderRadius:10,
              background:'rgba(196,120,138,0.1)',
              border:'1px solid rgba(196,120,138,0.25)',
              color:'#C4788A', fontSize:12, textAlign:'center',
            }}>{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || googleLoading || !username.trim() || pin.length < 4 || (mode === 'register' && pinConfirm.length < 4)}
            style={{
              marginTop:8, padding:'14px',
              background: loading ? 'rgba(201,169,110,0.3)' : 'linear-gradient(135deg, #D4B87A, #C9A96E, #A8855A)',
              border:'none', borderRadius:50,
              color: loading ? 'rgba(201,169,110,0.5)' : '#0C0904',
              fontSize:12, fontWeight:600, fontFamily:"'Jost', sans-serif",
              letterSpacing:'0.18em',
              boxShadow: loading ? 'none' : '0 0 30px rgba(201,169,110,0.4)',
              transition:'all 0.2s', cursor:'pointer',
            }}>
            {loading ? 'SE PROCESEAZĂ...' : mode === 'login' ? 'INTRĂ ÎN ATELIER' : 'CREEAZĂ CONTUL'}
          </button>

          <div style={{ textAlign:'center', marginTop:4 }}>
            <span style={{ fontSize:11, color:'rgba(253,246,236,0.25)' }}>
              {mode === 'login' ? 'Nu ai cont? ' : 'Ai deja cont? '}
            </span>
            <button
              onClick={switchMode}
              style={{
                background:'none', border:'none', padding:0,
                fontSize:11, color:'rgba(201,169,110,0.6)',
                letterSpacing:'0.08em', cursor:'pointer',
                textDecoration:'underline', textUnderlineOffset:3,
              }}>
              {mode === 'login' ? 'Creează cont' : 'Loghează-te'}
            </button>
          </div>
        </div>

        {/* Spinner keyframes */}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        <div style={{ textAlign:'center', marginTop:20, fontSize:10,
          color:'rgba(253,246,236,0.15)', letterSpacing:'0.15em' }}>
          Aplicație privată · Acces restricționat
        </div>
      </div>
    </div>
  )
}
