import { useState, useEffect, useRef } from 'react'
import Cursor from './components/Cursor'
import Ambient from './components/Ambient'
import Navbar from './components/Navbar'
import { useCursor, useCursorExpand } from './hooks/useCursor'
import LoginPage          from './pages/LoginPage'
import HeroPage           from './pages/HeroPage'
import RecipesPage        from './pages/RecipesPage'
import PlannerPage        from './pages/PlannerPage'
import AIPage             from './pages/AIPage'
import AnalyticsPage      from './pages/AnalyticsPage'
import PantryPage         from './pages/PantryPage'
import SuggestiiPage      from './pages/SuggestiiPage'
import SuggestiiRetetePage from './pages/SuggestiiRetetePage'
import ProfilePage        from './pages/ProfilePage'

import MagazinPage         from './pages/MagazinPage'

const PAGES = { hero: HeroPage, retete: RecipesPage, planner: PlannerPage, ai: AIPage, analytics: AnalyticsPage, pantry: PantryPage, magazin: MagazinPage, suggestii: SuggestiiPage, suggestii_retete: SuggestiiRetetePage, profil: ProfilePage }
const API = 'http://localhost:8000'

export default function App() {
  const [page, setPage] = useState('hero')
  const [auth, setAuth] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState(new Set(['mic_dejun','pranz','cina','toata_ziua']))
  const appRef = useRef(null)
  useCursor(); useCursorExpand(appRef)
  const lastClickRef = useRef(0)

  const toggleFullscreen = () => {
    const el = document.documentElement
    if (!document.fullscreenElement) { el.requestFullscreen?.() || el.webkitRequestFullscreen?.() }
    else { document.exitFullscreen?.() || document.webkitExitFullscreen?.() }
  }
  const handleBgClick = (e) => {
    const tag = e.target.tagName.toLowerCase()
    const ignored = ['button','input','textarea','select','a','img','label','svg','path','span','h1','h2','h3','p','video']
    if (ignored.includes(tag)) return
    if (e.target !== e.currentTarget && e.target.closest('button, input, textarea, select, a, [data-cursor], [role="button"]')) return
    const now = Date.now()
    if (now - lastClickRef.current < 450 && now - lastClickRef.current > 80) toggleFullscreen()
    lastClickRef.current = now
  }

  useEffect(() => {
    const zoomRef = { level: 1 }
    const onKey = (e) => {
      if (!e.ctrlKey) return
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const step = 0.1
        const min = 0.5, max = 2.5
        zoomRef.level = Math.min(max, Math.max(min,
          parseFloat((zoomRef.level + (e.key === 'ArrowUp' ? step : -step)).toFixed(2))
        ))
        document.body.style.zoom = zoomRef.level
      }
      if (e.key === '0') {
        e.preventDefault()
        zoomRef.level = 1
        document.body.style.zoom = 1
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser)
        fetch(`${API}/api/auth/me?token=${token}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) setAuth({ token, ...data }); else handleLogout() })
          .catch(() => setAuth({ token, ...user }))
          .finally(() => setAuthLoading(false))
      } catch { setAuthLoading(false) }
    } else { setAuthLoading(false) }
  }, [])

  const handleLogin = (data) => { setAuth(data); setPage('hero') }
  const handleLogout = () => {
    const token = localStorage.getItem('auth_token')
    if (token) fetch(`${API}/api/auth/logout?token=${token}`, { method: 'POST' }).catch(() => {})
    localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user')
    setAuth(null); setPage('hero')
  }
  const toggleFilter = (id) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(id)) { if (next.size === 1) return prev; next.delete(id) } else next.add(id)
      return next
    })
    if (page !== 'hero') setPage('hero')
  }

  if (authLoading) return (
    <div style={{width:'100vw',height:'100vh',background:'#060402',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#D4B87A,#C9A96E)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🍳</div>
    </div>
  )
  if (!auth) return <LoginPage onLogin={handleLogin} />

  // Pagini accesibile doar creator-ului
  const CREATOR_ONLY_PAGES = ['analytics', 'suggestii', 'suggestii_retete']
  const safePage = CREATOR_ONLY_PAGES.includes(page) && auth?.role !== 'creator' ? 'hero' : page
  const PageComponent = PAGES[safePage] || HeroPage

  return (
    <div ref={appRef} className="relative w-full h-full overflow-auto" style={{background:'#080503'}} onClick={handleBgClick}>
      <Cursor /><Ambient />
      {page !== 'hero' && <div className="fixed inset-0 z-0" style={{background:'radial-gradient(ellipse at 30% 40%,#1A1008 0%,#0B0806 55%,#060402 100%)'}}/>}
      <Navbar activePage={safePage} onNavigate={setPage} auth={auth} onLogout={handleLogout}/>
      <div className="relative w-full h-full">
        <PageComponent
          onNavigate={setPage}
          auth={auth}
          onLogout={handleLogout}
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
        />
      </div>
    </div>
  )
}