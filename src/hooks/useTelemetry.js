import { useEffect, useRef, useCallback } from 'react'
import { sendTelemetryEvent, sendErrorToFirebase } from '../firebase'

const API = 'http://localhost:8000'
const SESSION_ID = 'user-alexa-main'
const FLUSH_INTERVAL = 15000
const FLUSH_BATCH_SIZE = 20

let globalBuffer = []
let flushTimer = null

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
    console.debug('Telemetry flush failed (backend offline?):', e.message)
  }
}

function ensureFlushTimer() {
  if (!flushTimer) {
    flushTimer = setInterval(flushEvents, FLUSH_INTERVAL)
  }
}

function bufferEvent(event) {
  globalBuffer.push({ ...event, timestamp: Date.now(), session_id: SESSION_ID })
  if (globalBuffer.length >= FLUSH_BATCH_SIZE) flushEvents()
}

// ─── HOOK PRINCIPAL ───────────────────────────────────────────────────────────
export function useTelemetry() {
  useEffect(() => {
    ensureFlushTimer()
    const handleUnload = () => flushEvents()
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  const track = useCallback((eventType, action, target = '', metadata = {}) => {
    // trimite local
    bufferEvent({ event_type: eventType, action, target, metadata })
    // trimite si in Firebase (doar navigare si actiuni importante, nu fiecare click)
    if (eventType === 'navigation' || eventType === 'error') {
      sendTelemetryEvent(eventType, action, target, metadata).catch(() => {})
    }
  }, [])

  return { track }
}

// ─── HOOK PENTRU PAGINI ───────────────────────────────────────────────────────
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
export function useButtonTrack() {
  const { track } = useTelemetry()
  const trackClick = useCallback((buttonName, metadata = {}) => {
    track('interaction', 'button_click', buttonName, metadata)
  }, [track])
  return { trackClick }
}

// ─── ERORI GLOBALE ────────────────────────────────────────────────────────────
export function initGlobalErrorTracking() {
  window.addEventListener('error', (e) => {
    sendErrorToFirebase(e.message, 'js_error', {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    }).catch(() => {})
  })

  window.addEventListener('unhandledrejection', (e) => {
    sendErrorToFirebase(
      e.reason?.message || String(e.reason),
      'promise_rejection',
      {}
    ).catch(() => {})
  })
}