import { useEffect } from 'react'

function getOrCreateSpoon() {
  let el = document.getElementById('cursor-spoon')
  if (el) return el

  el = document.createElement('div')
  el.id = 'cursor-spoon'
  el.dataset.scale = '1'
  el.innerHTML = `
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="17" y1="32" x2="17" y2="17" stroke="#D4B87A" stroke-width="2.8" stroke-linecap="round"/>
      <ellipse cx="17" cy="10" rx="6.5" ry="8.5" fill="#C9A96E"/>
      <ellipse cx="15" cy="7.5" rx="2.3" ry="3.3" fill="rgba(255,245,210,0.45)"/>
    </svg>
  `
  Object.assign(el.style, {
    position:      'fixed',
    top:           '0',
    left:          '0',
    width:         '34px',
    height:        '34px',
    pointerEvents: 'none',
    zIndex:        '2147483647',
    transform:     'translate(-100px, -100px)',
    willChange:    'transform',
    filter:        'drop-shadow(0 0 7px rgba(201,169,110,0.9)) drop-shadow(0 0 18px rgba(201,169,110,0.45))',
    transition:    'filter 0.2s ease',
  })
  document.body.appendChild(el)
  return el
}

// Rotație bază fixă: -20 grade (linguriță ținută natural, înclinată spre stânga)
// Vârful (ellipse top) este hotspot-ul — calculat matematic:
// tip SVG = (17, 1.5), centru rotație = (17, 17), după -20deg → (11.7, 2.4)
const BASE_TILT = -20
const TIP_OFFSET_X = 12   // Math.round(11.7)
const TIP_OFFSET_Y = 2    // Math.round(2.4)

export function useCursor() {
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'spoon-cursor-style'
    style.textContent = '*, *::before, *::after { cursor: none !important; }'
    document.head.appendChild(style)

    const spoon = getOrCreateSpoon()
    let x = -100, y = -100
    let prevX = -100, prevY = -100
    let dynamicTilt = 0   // ±12 grade extra stânga/dreapta în funcție de direcție
    let raf

    const onMove = (e) => {
      prevX = x; prevY = y
      x = e.clientX; y = e.clientY

      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const dx = x - prevX
        // Mișcare orizontală adaugă max ±12 grade pe deasupra celor -20 bază
        const targetTilt = Math.max(-12, Math.min(12, dx * 2.0))
        dynamicTilt = dynamicTilt + (targetTilt - dynamicTilt) * 0.16

        const totalRotation = BASE_TILT + dynamicTilt
        const sc = parseFloat(spoon.dataset.scale || '1')
        // Vârful linguriței (hotspot) aliniat exact pe cursorul mouse-ului
        spoon.style.transform = `translate(${x - TIP_OFFSET_X}px, ${y - TIP_OFFSET_Y}px) rotate(${totalRotation}deg) scale(${sc})`
      })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
      document.getElementById('spoon-cursor-style')?.remove()
    }
  }, [])
}

export function useCursorExpand(ref) {
  useEffect(() => {
    const spoon = document.getElementById('cursor-spoon')
    if (!spoon) return

    const expand = () => {
      spoon.dataset.scale = '1.4'
      spoon.style.filter = 'drop-shadow(0 0 12px rgba(201,169,110,1)) drop-shadow(0 0 28px rgba(201,169,110,0.6))'
      const current = spoon.style.transform.replace(/\s*scale\([^)]+\)/, '')
      spoon.style.transform = current + ' scale(1.4)'
    }
    const restore = () => {
      spoon.dataset.scale = '1'
      spoon.style.filter = 'drop-shadow(0 0 7px rgba(201,169,110,0.9)) drop-shadow(0 0 18px rgba(201,169,110,0.45))'
      spoon.style.transform = spoon.style.transform.replace(/\s*scale\([^)]+\)/, '')
    }

    const attach = () => {
      document.querySelectorAll('button, a, [data-cursor]').forEach(el => {
        el.removeEventListener('mouseenter', expand)
        el.removeEventListener('mouseleave', restore)
        el.addEventListener('mouseenter', expand)
        el.addEventListener('mouseleave', restore)
      })
    }

    attach()
    const obs = new MutationObserver(attach)
    obs.observe(document.body, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [ref])
}
