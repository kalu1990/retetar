import { useState, useEffect, useRef } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
const API = 'http://localhost:8000'

function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80'

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      speedY: -Math.random() * 0.3 - 0.05,
      opacity: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }))

    let t = 0

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Fotografie fundal
      if (img.complete && img.naturalWidth > 0) {
        const imgRatio = img.naturalWidth / img.naturalHeight
        const canvasRatio = W / H
        let drawW, drawH, drawX, drawY
        if (canvasRatio > imgRatio) {
          drawW = W; drawH = W / imgRatio
          drawX = 0; drawY = (H - drawH) / 2
        } else {
          drawH = H; drawW = H * imgRatio
          drawX = (W - drawW) / 2; drawY = 0
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH)
      } else {
        ctx.fillStyle = '#1a0f06'; ctx.fillRect(0, 0, W, H)
      }

      // Overlay dark cinematic — dă impresia de noapte/intimitate
      ctx.fillStyle = 'rgba(4,2,1,0.72)'
      ctx.fillRect(0, 0, W, H)

      // Lumină caldă din stânga — ca o lampă de bucătărie
      const warmLight = ctx.createRadialGradient(W * 0.12, H * 0.3, 0, W * 0.12, H * 0.3, W * 0.5)
      warmLight.addColorStop(0, `rgba(255,180,80,${0.12 + Math.sin(t * 0.4) * 0.02})`)
      warmLight.addColorStop(0.5, 'rgba(200,120,40,0.05)')
      warmLight.addColorStop(1, 'transparent')
      ctx.fillStyle = warmLight; ctx.fillRect(0, 0, W, H)

      // Lumină secundară dreapta jos — reflexie
      const warmLight2 = ctx.createRadialGradient(W * 0.88, H * 0.8, 0, W * 0.88, H * 0.8, W * 0.35)
      warmLight2.addColorStop(0, `rgba(212,150,60,${0.07 + Math.sin(t * 0.3 + 1) * 0.015})`)
      warmLight2.addColorStop(1, 'transparent')
      ctx.fillStyle = warmLight2; ctx.fillRect(0, 0, W, H)

      // Vignette perimetral puternic
      const vig = ctx.createRadialGradient(W/2, H/2, H*0.15, W/2, H/2, H*0.8)
      vig.addColorStop(0, 'transparent')
      vig.addColorStop(1, 'rgba(2,1,0,0.85)')
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)

      // Particule — aburi/praf de lumină
      t += 0.008
      particles.forEach(p => {
        p.y += p.speedY
        p.pulse += 0.015
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W }
        const op = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,200,120,${op})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    img.onload = draw
    img.onerror = draw
    draw()

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
}
export default function LoginPage({ onLogin, forcePinSetup = false, pendingAuth = null }) {
  const [mode, setMode]             = useState('login')
  const [username, setUsername]     = useState('')
  const [pin, setPin]               = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [showPinSetup, setShowPinSetup]       = useState(forcePinSetup)
  const [pendingAuthData, setPendingAuthData] = useState(pendingAuth)
  const [setupPin, setSetupPin]               = useState('')
  const [setupPinConfirm, setSetupPinConfirm] = useState('')
  const [setupError, setSetupError]           = useState('')
  const [setupLoading, setSetupLoading]       = useState(false)

  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (forcePinSetup && pendingAuth) {
      setPendingAuthData(pendingAuth)
      setShowPinSetup(true)
    }
  }, [forcePinSetup, pendingAuth])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/auth/google/url`)
      const data = await res.json()
      if (!res.ok) { setError('Nu pot genera URL de autentificare'); setGoogleLoading(false); return }

      if (window.electronAPI?.openExternal) window.electronAPI.openExternal(data.url)
      else window.open(data.url, '_blank')

      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API}/api/auth/google/callback/poll?state=${data.state}`)
          if (pollRes.ok) {
            const authData = await pollRes.json()
            clearInterval(pollInterval)
            setGoogleLoading(false)
            if (authData.has_pin === false) {
              setPendingAuthData(authData)
              setShowPinSetup(true)
            } else {
              localStorage.setItem('auth_token', authData.token)
              localStorage.setItem('auth_user', JSON.stringify({ username: authData.username, role: authData.role }))
              onLogin(authData)
            }
          }
        } catch {}
      }, 1000)

      setTimeout(() => {
        clearInterval(pollInterval)
        setGoogleLoading(false)
        setError('Timp expirat. Încearcă din nou.')
      }, 300000)

    } catch {
      setError('Nu mă pot conecta la server')
      setGoogleLoading(false)
    }
  }

  const handleSetupPin = async () => {
    if (setupPin.length < 4) { setSetupError('Minim 4 cifre'); return }
    if (setupPin !== setupPinConfirm) { setSetupError('PIN-urile nu coincid'); return }
    setSetupLoading(true); setSetupError('')
    try {
      const res = await fetch(`${API}/api/auth/set-pin?token=${pendingAuthData.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: setupPin })
      })
      if (res.ok) {
        localStorage.setItem('auth_token', pendingAuthData.token)
        localStorage.setItem('auth_user', JSON.stringify({ username: pendingAuthData.username, role: pendingAuthData.role }))
        onLogin(pendingAuthData)
      } else { setSetupError('Eroare la salvare. Încearcă din nou.') }
    } catch { setSetupError('Nu mă pot conecta la server') }
    setSetupLoading(false)
  }

  const handleSkipPin = () => {
    localStorage.setItem('auth_token', pendingAuthData.token)
    localStorage.setItem('auth_user', JSON.stringify({ username: pendingAuthData.username, role: pendingAuthData.role }))
    onLogin(pendingAuthData)
  }

  const handleSubmit = async () => {
    if (!username.trim() || pin.length < 4) return
    if (mode === 'register' && pin !== pinConfirm) { setError('PIN-urile nu coincid'); return }
    setLoading(true); setError('')
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
      } else { setError(data.detail || 'Eroare la autentificare') }
    } catch { setError('Nu mă pot conecta la server') }
    setLoading(false)
  }

  const switchMode = () => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setPin(''); setPinConfirm('') }

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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Jost', sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,600;1,700&family=Jost:wght@300;400;500&display=swap"/>

      <AnimatedBackground />

      {/* Titlu applicatie sus stanga */}
      <div style={{
        position: 'fixed', top: 32, left: 40, zIndex: 2,
        fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
        fontSize: 18, color: 'rgba(212,184,122,0.4)', letterSpacing: '0.05em',
      }}>
        Bucătăria Mea
      </div>

      {/* Versiune jos stanga */}
      <div style={{
        position: 'fixed', bottom: 24, left: 40, zIndex: 2,
        fontSize: 10, color: 'rgba(253,246,236,0.1)', letterSpacing: '0.15em',
      }}>
        v1.0.0 · Aplicație privată
      </div>

      {/* Modal PIN backup */}
      {showPinSetup && pendingAuthData && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 'min(400px, 90vw)',
            background: 'linear-gradient(160deg, rgba(253,246,236,0.08) 0%, rgba(253,246,236,0.03) 100%)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(201,169,110,0.25)',
            borderRadius: 24, padding: '40px 36px',
            boxShadow: '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,169,110,0.15)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.7), transparent)' }}/>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                fontWeight: 700, fontSize: 22, color: '#FDF6EC', marginBottom: 8 }}>
                PIN de backup
              </div>
              <div style={{ fontSize: 12, color: 'rgba(253,246,236,0.4)', lineHeight: 1.7 }}>
                Setează un PIN pentru acces offline.<br/>
                Îl vei folosi când nu ai conexiune la internet.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(253,246,236,0.3)', marginBottom: 8 }}>PIN NOU</div>
                <input type="password" value={setupPin}
                  onChange={e => setSetupPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={e => e.key === 'Enter' && handleSetupPin()}
                  placeholder="····" maxLength={8} autoFocus
                  style={{ ...inputStyle, fontSize: 20, letterSpacing: '0.3em' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(201,169,110,0.2)'} />
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(253,246,236,0.3)', marginBottom: 8 }}>CONFIRMĂ PIN</div>
                <input type="password" value={setupPinConfirm}
                  onChange={e => setSetupPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={e => e.key === 'Enter' && handleSetupPin()}
                  placeholder="····" maxLength={8}
                  style={{ ...inputStyle, fontSize: 20, letterSpacing: '0.3em' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(201,169,110,0.2)'} />
              </div>

              {setupError && (
                <div style={{ padding: '10px 16px', borderRadius: 10,
                  background: 'rgba(196,120,138,0.1)', border: '1px solid rgba(196,120,138,0.25)',
                  color: '#C4788A', fontSize: 12, textAlign: 'center' }}>{setupError}</div>
              )}

              <button onClick={handleSetupPin}
                disabled={setupLoading || setupPin.length < 4 || setupPinConfirm.length < 4}
                style={{
                  marginTop: 4, padding: '13px',
                  background: setupLoading ? 'rgba(201,169,110,0.3)' : 'linear-gradient(135deg, #D4B87A, #C9A96E, #A8855A)',
                  border: 'none', borderRadius: 50,
                  color: setupLoading ? 'rgba(201,169,110,0.5)' : '#0C0904',
                  fontSize: 11, fontWeight: 600, fontFamily: "'Jost', sans-serif",
                  letterSpacing: '0.18em', cursor: 'pointer',
                  boxShadow: setupLoading ? 'none' : '0 0 25px rgba(201,169,110,0.35)',
                  transition: 'all 0.2s',
                  opacity: setupLoading || setupPin.length < 4 || setupPinConfirm.length < 4 ? 0.5 : 1,
                }}>
                {setupLoading ? 'SE SALVEAZĂ...' : 'SALVEAZĂ PIN'}
              </button>

              <button onClick={handleSkipPin} style={{
                background: 'none', border: 'none', padding: '8px',
                fontSize: 11, color: 'rgba(253,246,236,0.25)',
                letterSpacing: '0.1em', cursor: 'pointer',
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                Sari peste — voi seta mai târziu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card principal */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 'min(420px, 90vw)',
        background: 'linear-gradient(160deg, rgba(253,246,236,0.07) 0%, rgba(253,246,236,0.02) 100%)',
        backdropFilter: 'blur(40px) saturate(1.2)',
        border: '1px solid rgba(201,169,110,0.18)',
        borderRadius: 28, padding: '48px 44px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(201,169,110,0.08), inset 0 1px 0 rgba(201,169,110,0.15)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.8), transparent)' }}/>
        <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.15), transparent)' }}/>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #D4B87A, #C9A96E, #A8855A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 0 40px rgba(201,169,110,0.4), 0 8px 24px rgba(0,0,0,0.3)',
          }}>🍳</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            fontWeight: 700, fontSize: 30, color: '#FDF6EC', letterSpacing: '-0.01em',
          }}>Bucătăria Mea</div>
          <div style={{
            fontSize: 10, color: 'rgba(201,169,110,0.45)', letterSpacing: '0.25em', marginTop: 6,
          }}>
            {mode === 'login' ? 'AI COOKING PLATFORM' : 'CONT NOU'}
          </div>
        </div>

        {isOnline && (
          <button onClick={handleGoogleLogin} disabled={googleLoading || loading}
            style={{
              width: '100%', padding: '13px 18px',
              background: googleLoading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 50, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              transition: 'all 0.2s', marginBottom: 22,
              opacity: googleLoading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = googleLoading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)' }}>
            {googleLoading ? (
              <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
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
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(253,246,236,0.06)' }}/>
          <span style={{ fontSize: 9, color: 'rgba(253,246,236,0.18)', letterSpacing: '0.25em' }}>SAU</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(253,246,236,0.06)' }}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(253,246,236,0.25)', marginBottom: 8 }}>USERNAME</div>
            <input value={username} onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Numele tău" autoFocus style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(201,169,110,0.2)'} />
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(253,246,236,0.25)', marginBottom: 8 }}>PIN</div>
            <input type="password" value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="····" maxLength={8}
              style={{ ...inputStyle, fontSize: 20, letterSpacing: '0.3em' }}
              onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(201,169,110,0.2)'} />
          </div>

          {mode === 'register' && (
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(253,246,236,0.25)', marginBottom: 8 }}>CONFIRMĂ PIN</div>
              <input type="password" value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="····" maxLength={8}
                style={{ ...inputStyle, fontSize: 20, letterSpacing: '0.3em' }}
                onFocus={e => e.target.style.borderColor = 'rgba(201,169,110,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(201,169,110,0.2)'} />
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 16px', borderRadius: 10,
              background: 'rgba(196,120,138,0.1)', border: '1px solid rgba(196,120,138,0.25)',
              color: '#C4788A', fontSize: 12, textAlign: 'center' }}>{error}</div>
          )}

          <button onClick={handleSubmit}
            disabled={loading || googleLoading || !username.trim() || pin.length < 4 || (mode === 'register' && pinConfirm.length < 4)}
            style={{
              marginTop: 8, padding: '14px',
              background: loading ? 'rgba(201,169,110,0.3)' : 'linear-gradient(135deg, #D4B87A, #C9A96E, #A8855A)',
              border: 'none', borderRadius: 50,
              color: loading ? 'rgba(201,169,110,0.5)' : '#0C0904',
              fontSize: 12, fontWeight: 600, fontFamily: "'Jost', sans-serif",
              letterSpacing: '0.18em',
              boxShadow: loading ? 'none' : '0 0 30px rgba(201,169,110,0.35), 0 4px 16px rgba(0,0,0,0.3)',
              transition: 'all 0.2s', cursor: 'pointer',
            }}>
            {loading ? 'SE PROCESEAZĂ...' : mode === 'login' ? 'INTRĂ ÎN ATELIER' : 'CREEAZĂ CONTUL'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'rgba(253,246,236,0.2)' }}>
              {mode === 'login' ? 'Nu ai cont? ' : 'Ai deja cont? '}
            </span>
            <button onClick={switchMode} style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: 11, color: 'rgba(201,169,110,0.5)',
              letterSpacing: '0.08em', cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              {mode === 'login' ? 'Creează cont' : 'Loghează-te'}
            </button>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}