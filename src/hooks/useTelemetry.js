/**
 * useTelemetry.js
 * Urmărește comportamentul utilizatorului și trimite la backend.
 * AI-ul învață din aceste evenimente ce îți place, ce faci des, ce eviți.
 */

import { useEffect, useRef, useCallback } from 'react'

const API = 'http://localhost:8000'
const SESSION_ID = 'user-alexa-main'
const FLUSH_INTERVAL = 15000  // trimite la fiecare 15 secunde
const FLUSH_BATCH_SIZE = 20   // sau când se adună 20 evenimente

let globalBuffer = []
let flushTimer = null

// Trimite evenimentele la backend
async function flushEvents() {
  if (globalBuffer.length === 0) return

  const batch = [...globalBuffer]
  globalBuffer = []

  try {
    await fetch(`${API}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch, session_id: SESSION_ID }),
    })
  } catch (e) {
    // Dacă backend-ul nu e disponibil, nu bloca UI-ul
    console.debug('Telemetry flush failed (backend offline?):', e.message)
  }
}

// Pornește timer-ul de flush dacă nu e pornit
function ensureFlushTimer() {
  if (!flushTimer) {
    flushTimer = setInterval(flushEvents, FLUSH_INTERVAL)
  }
}

// Adaugă un eveniment în buffer
function bufferEvent(event) {
  globalBuffer.push({
    ...event,
    timestamp: Date.now(),
    session_id: SESSION_ID,
  })

  if (globalBuffer.length >= FLUSH_BATCH_SIZE) {
    flushEvents()
  }
}

// ─── HOOK PRINCIPAL ───────────────────────────────────────────────────────────
export function useTelemetry() {
  useEffect(() => {
    ensureFlushTimer()

    // Flush la închiderea paginii
    const handleUnload = () => flushEvents()
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [])

  // Funcție de tracking pe care o poți chema din orice componentă
  const track = useCallback((eventType, action, target = '', metadata = {}) => {
    bufferEvent({ event_type: eventType, action, target, metadata })
  }, [])

  return { track }
}

// ─── HOOK PENTRU PAGINI ───────────────────────────────────────────────────────
// Folosește-l în fiecare pagină pentru a urmări timpul petrecut
export function usePageTracking(pageName) {
  const { track } = useTelemetry()
  const startTime = useRef(Date.now())

  useEffect(() => {
    startTime.current = Date.now()
    track('navigation', 'page_enter', pageName)

    return () => {
      const duration = Date.now() - startTime.current
      track('navigation', 'page_exit', pageName, { duration_ms: duration })
    }
  }, [pageName])

  return { track }
}

// ─── HOOK PENTRU BUTOANE ──────────────────────────────────────────────────────
// Simplu — apelează când apeși un buton important
export function useButtonTrack() {
  const { track } = useTelemetry()

  const trackClick = useCallback((buttonName, metadata = {}) => {
    track('interaction', 'button_click', buttonName, metadata)
  }, [track])

  return { trackClick }
}
