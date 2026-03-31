import { useState, useRef, useEffect } from 'react'
import { usePageTracking } from '../hooks/useTelemetry'

const API = 'http://localhost:8000'
const SESSION_ID = 'user-alexa-main'
function getToken() { return localStorage.getItem('auth_token') || '' }

export default function AIPage({ auth }) {
  usePageTracking('ai')

  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'Bună dragă ✨ Sunt Chef AI-ul tău personal. Știu ce ai în frigider și îmi amintesc preferințele tale. Cu ce te pot ajuta azi?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [orbPulse, setOrbPulse] = useState(false)
  const endRef = useRef(null)
  const abortRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    setOrbPulse(loading)
  }, [loading])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)
    setMsgs(prev => [...prev, { role: 'user', text: userMsg }])
    setMsgs(prev => [...prev, { role: 'ai', text: '', streaming: true }])
    setStreaming(true)

    try {
      const history = msgs.filter(m => m.text).slice(-10).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      }))
      history.push({ role: 'user', content: userMsg })

      const controller = new AbortController()
      abortRef.current = controller

      // Trimite ultimul mesaj al userului (API asteapta 'message': string)
      const lastUserMsg = history[history.length - 1]?.content || userMsg
      const response = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMsg,
          session_id: auth?.username || SESSION_ID,
          token: getToken(),
          role: auth?.role || 'user',
          username: auth?.username || 'utilizator'
        }),
        signal: controller.signal
      })

      if (!response.ok) throw new Error('Stream failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.token) {
                fullText += data.token
                setMsgs(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'ai', text: fullText, streaming: true }
                  return updated
                })
              }
              if (data.done) {
                setMsgs(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'ai', text: fullText, streaming: false }
                  return updated
                })
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      try {
        const history = msgs.filter(m => m.text).slice(-10).map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user', content: m.text
        }))
        history.push({ role: 'user', content: userMsg })
        const res = await fetch(`${API}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, session_id: auth?.username || SESSION_ID, token: getToken(), role: auth?.role || 'user', username: auth?.username || 'utilizator' })
        })
        const data = await res.json()
        setMsgs(prev => { const u = [...prev]; u[u.length-1] = { role: 'ai', text: data.response || 'Eroare.', streaming: false }; return u })
      } catch {
        setMsgs(prev => { const u = [...prev]; u[u.length-1] = { role: 'ai', text: '⚠️ Nu mă pot conecta la AI. Verifică că retetar_api.py rulează.', streaming: false }; return u })
      }
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  const stopStreaming = () => {
    abortRef.current?.abort()
    setLoading(false); setStreaming(false)
    setMsgs(prev => { const u = [...prev]; if (u[u.length-1]?.streaming) u[u.length-1] = { ...u[u.length-1], streaming: false }; return u })
  }

  const isCreator = auth?.role === 'creator'
  const hasConversation = msgs.length > 1

  return (
    <div className="relative z-10 h-full flex flex-col overflow-hidden" style={{ fontFamily: 'Jost, sans-serif' }}>

      {/* ── FUNDAL CINEMATIC ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(35,20,5,1) 0%, rgba(8,4,1,1) 60%, rgba(3,1,0,1) 100%)' }} />
        {/* Particule decorative */}
        {[...Array(28)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? 2 : 1,
            height: i % 3 === 0 ? 2 : 1,
            borderRadius: '50%',
            background: i % 4 === 0 ? 'rgba(212,184,122,0.6)' : 'rgba(253,246,236,0.25)',
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 23 + 7) % 100}%`,
            animation: `star-twinkle ${2 + (i % 4) * 0.8}s ease-in-out ${i * 0.3}s infinite`,
          }} />
        ))}
        {/* Glow ambiant sub orb */}
        <div style={{
          position: 'absolute', left: '50%', top: '28%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: loading
            ? 'radial-gradient(circle, rgba(212,184,122,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(212,184,122,0.06) 0%, transparent 70%)',
          transition: 'all 1.5s ease',
          animation: loading ? 'glow-breathe 2s ease-in-out infinite' : 'none',
        }} />
      </div>

      {/* ── ORB AI ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: hasConversation ? 80 : '15vh',
        paddingBottom: hasConversation ? 0 : 0,
        transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        flexShrink: 0,
      }}>
        {/* Orb principal */}
        <div style={{ position: 'relative', marginBottom: hasConversation ? 20 : 32 }}>
          {/* Inele orbitale */}
          {[1,2,3].map(ring => (
            <div key={ring} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: (hasConversation ? 56 : 80) + ring * (hasConversation ? 18 : 28),
              height: (hasConversation ? 56 : 80) + ring * (hasConversation ? 18 : 28),
              borderRadius: '50%',
              border: `1px solid rgba(212,184,122,${loading ? 0.5 - ring * 0.1 : 0.18 - ring * 0.04})`,
              boxShadow: loading ? `0 0 ${8 + ring*4}px rgba(212,184,122,0.1)` : 'none',
              animation: `ring-expand ${2.5 + ring * 0.7}s ease-out ${ring * 0.4}s infinite`,
              transition: 'all 0.8s ease',
            }} />
          ))}
          {/* Orb central */}
          <div style={{
            position: 'relative',
            width: hasConversation ? 64 : 96,
            height: hasConversation ? 64 : 96,
            borderRadius: '50%',
            background: loading
              ? 'radial-gradient(circle at 35% 35%, #F0D898, #D4B87A 40%, #8B6914 80%)'
              : 'radial-gradient(circle at 35% 35%, #E8C87A, #C9A96E 40%, #7A5C10 80%)',
            boxShadow: loading
              ? '0 0 40px rgba(212,184,122,0.8), 0 0 80px rgba(212,184,122,0.4), 0 0 120px rgba(212,184,122,0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
              : '0 0 24px rgba(212,184,122,0.5), 0 0 48px rgba(212,184,122,0.2), inset 0 1px 0 rgba(255,255,255,0.25)',
            animation: loading ? 'orb-pulse 1.8s ease-in-out infinite' : 'orb-idle 4s ease-in-out infinite',
            transition: 'all 0.6s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'default',
          }}>
            <span style={{
              fontSize: hasConversation ? 22 : 32,
              filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))',
              transition: 'all 0.6s ease',
            }}>✦</span>
          </div>
        </div>

        {/* Titlu / status */}
        {!hasConversation && (
          <div style={{ textAlign: 'center', marginBottom: 12, animation: 'fadeUp 0.8s ease-out both' }}>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 64, fontWeight: 300, color: '#D4B87A', lineHeight: 1,
              textShadow: '0 0 60px rgba(212,184,122,0.3)',
              marginBottom: 10,
            }}>Chef AI Personal</h1>
            <p style={{ fontSize: 11, letterSpacing: '0.3em', color: 'rgba(253,246,236,0.3)', textTransform: 'uppercase' }}>
              {isCreator ? '👑 Mod Creator · Comenzi admin active' : 'Memorie activă · llama3.1:8b'}
            </p>
          </div>
        )}

        {hasConversation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: loading ? '#D4B87A' : '#8FAF8A',
              boxShadow: `0 0 10px ${loading ? '#D4B87A' : '#8FAF8A'}`,
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 9, letterSpacing: '0.25em', color: loading ? '#D4B87A' : 'rgba(143,175,138,0.8)', textTransform: 'uppercase' }}>
              {loading ? 'Gândește...' : 'Chef AI Personal'}
            </span>
          </div>
        )}
      </div>

      {/* ── MESAJE ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: hasConversation ? '8px 40px 16px' : '24px 40px 16px',
        display: 'flex', flexDirection: 'column', gap: 20,
        maxWidth: 780, width: '100%', margin: '0 auto', boxSizing: 'border-box',
      }}>
        {!hasConversation && (
          /* Sugestii de start */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8, animation: 'fadeUp 1s ease-out 0.3s both', opacity: 0 }}>
            {['Ce pot găti azi?', 'Sugerează o rețetă rapidă', 'Ce mai am în cămară?', 'Planifică-mi săptămâna'].map(s => (
              <button key={s} data-cursor onClick={() => { setInput(s); inputRef.current?.focus() }}
                style={{
                  padding: '9px 20px', borderRadius: 99, cursor: 'none',
                  background: 'rgba(212,184,122,0.06)', border: '1px solid rgba(212,184,122,0.2)',
                  color: 'rgba(212,184,122,0.7)', fontFamily: 'Jost, sans-serif', fontSize: 12,
                  letterSpacing: '0.06em', transition: 'all 0.22s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.14)'; e.currentTarget.style.color = '#D4B87A'; e.currentTarget.style.borderColor = 'rgba(212,184,122,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.06)'; e.currentTarget.style.color = 'rgba(212,184,122,0.7)'; e.currentTarget.style.borderColor = 'rgba(212,184,122,0.2)' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12,
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            animation: 'fadeUp 0.4s ease-out both',
          }}>
            {m.role === 'ai' && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'radial-gradient(circle at 35% 35%, #D4B87A, #8B6914)',
                boxShadow: '0 0 14px rgba(212,184,122,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, marginTop: 2,
              }}>✦</div>
            )}
            <div style={{
              maxWidth: '78%',
              padding: m.role === 'user' ? '14px 22px' : '18px 26px',
              borderRadius: m.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
              background: m.role === 'user'
                ? 'linear-gradient(135deg, rgba(212,184,122,0.2), rgba(212,184,122,0.09))'
                : 'rgba(253,246,236,0.07)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${m.role === 'user' ? 'rgba(212,184,122,0.3)' : 'rgba(253,246,236,0.08)'}`,
              color: m.role === 'user' ? 'rgba(253,232,180,0.95)' : 'rgba(253,246,236,0.82)',
              fontFamily: m.role === 'ai' ? 'Cormorant Garamond, serif' : 'Jost, sans-serif',
              fontWeight: m.role === 'ai' ? 400 : 300,
              fontStyle: m.role === 'ai' ? 'normal' : 'normal',
              fontSize: m.role === 'ai' ? 18 : 15, lineHeight: 1.85,
              whiteSpace: 'pre-wrap',
              boxShadow: m.role === 'user' ? '0 4px 24px rgba(212,184,122,0.1)' : '0 4px 24px rgba(0,0,0,0.2)',
            }}>
              {m.text || (m.streaming && (
                <span style={{ display: 'flex', gap: 5, alignItems: 'center', paddingTop: 2 }}>
                  {[0,1,2].map(j => <span key={j} style={{
                    width: 5, height: 5, borderRadius: '50%', display: 'inline-block',
                    background: '#C9A96E', animation: `bounce-dot 0.9s ease ${j*0.2}s infinite`
                  }}/>)}
                </span>
              ))}
              {m.streaming && m.text && (
                <span style={{ display:'inline-block', width: 2, height:'1em', background:'#C9A96E', marginLeft: 2, verticalAlign:'text-bottom', animation:'blink-cursor 0.7s ease-in-out infinite' }}/>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* ── COMENZI CREATOR ── */}
      {isCreator && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 40px 10px', maxWidth: 780, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {['ce stii', 'statistici', 'arata userii', 'conversatii recente', 'ce am facut'].map(cmd => (
            <button key={cmd} onClick={() => setInput(cmd)} data-cursor
              style={{
                padding: '5px 12px', borderRadius: 99, cursor: 'none',
                background: 'rgba(212,184,122,0.07)', border: '1px solid rgba(212,184,122,0.18)',
                color: 'rgba(212,184,122,0.55)', fontFamily: 'Jost, sans-serif',
                fontSize: 9, letterSpacing: '0.12em', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.15)'; e.currentTarget.style.color = '#D4B87A' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,184,122,0.07)'; e.currentTarget.style.color = 'rgba(212,184,122,0.55)' }}>
              {cmd}
            </button>
          ))}
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <div style={{
        padding: '12px 48px 32px', maxWidth: 820, width: '100%',
        margin: '0 auto', boxSizing: 'border-box', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(253,246,236,0.04)', backdropFilter: 'blur(32px)',
          border: '1px solid rgba(212,184,122,0.2)', borderRadius: 99,
          padding: '8px 8px 8px 28px',
          boxShadow: '0 8px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={() => {}}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={loading ? 'Chef AI gândește...' : isCreator ? 'Comandă sau întrebare...' : 'Scrie-i Chef-ului AI...'}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'rgba(253,246,236,0.88)', fontFamily: 'Jost, sans-serif',
              fontWeight: 300, fontSize: 16, caretColor: '#D4B87A',
              cursor: 'none',
            }}
          />
          {streaming ? (
            <button onClick={stopStreaming} data-cursor style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #C4788A, #8B4455)',
              border: 'none', cursor: 'none', color: '#FDF6EC', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(196,120,138,0.5)',
            }}>■</button>
          ) : (
            <button onClick={send} disabled={loading || !input.trim()} data-cursor style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: input.trim() ? 'linear-gradient(135deg, #D4B87A, #8B6914)' : 'rgba(212,184,122,0.15)',
              border: 'none', cursor: 'none',
              color: input.trim() ? '#0C0904' : 'rgba(212,184,122,0.35)',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: input.trim() ? '0 0 28px rgba(212,184,122,0.5)' : 'none',
              transition: 'all 0.25s ease',
            }}>→</button>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 9, letterSpacing: '0.18em', color: 'rgba(253,246,236,0.15)', textTransform: 'uppercase' }}>
          {isCreator ? '👑 Mod Creator activ' : 'Enter pentru a trimite · Chef AI cunoaște cămara ta'}
        </div>
      </div>

      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes orb-idle {
          0%, 100% { transform: scale(1); box-shadow: 0 0 24px rgba(212,184,122,0.5), 0 0 48px rgba(212,184,122,0.2), inset 0 1px 0 rgba(255,255,255,0.25); }
          50% { transform: scale(1.04); box-shadow: 0 0 32px rgba(212,184,122,0.65), 0 0 64px rgba(212,184,122,0.28), inset 0 1px 0 rgba(255,255,255,0.3); }
        }
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes ring-expand {
          0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.85); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.35); }
        }
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scaleY(0.4); }
          40% { transform: scaleY(1.2); }
        }
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}