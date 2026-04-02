import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, setDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBIyPXyENV4Lsg-vhhEkumgoSy3dTiAX6E",
  authDomain: "bucataria-mea-edd3a.firebaseapp.com",
  projectId: "bucataria-mea-edd3a",
  storageBucket: "bucataria-mea-edd3a.firebasestorage.app",
  messagingSenderId: "935280617234",
  appId: "1:935280617234:web:7237879232354cd6f4b5cb",
  measurementId: "G-DSCDJQD48X"
}

const firebaseApp = initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const storage = getStorage(firebaseApp)

export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const signOutFirebase = () => signOut(auth)

// ─── INSPIRATIE FIRESTORE ────────────────────────────────────────────────────

export async function loadInspiratieFirestore() {
  try {
    const q = query(collection(db, 'inspiratie'), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('[Firebase] Eroare incarcare inspiratie:', e)
    return []
  }
}

export async function uploadPozaFirebase(file, recipeId) {
  try {
    let fileToUpload = file
    if (typeof file === 'string' && file.startsWith('data:')) {
      const res = await fetch(file)
      fileToUpload = await res.blob()
    }
    const ext = fileToUpload.type?.split('/')[1] || 'jpg'
    const storageRef = ref(storage, `inspiratie/${recipeId}.${ext}`)
    await uploadBytes(storageRef, fileToUpload)
    const url = await getDownloadURL(storageRef)
    return url
  } catch (e) {
    console.error('[Firebase] Eroare upload poza:', e)
    return null
  }
}

export async function publicaRetetaFirebase(reteta, imageFile = null) {
  try {
    const docId = reteta.id || `r_${Date.now()}`

    let imageUrl = reteta.image_url || ''
    if (imageFile) {
      const uploaded = await uploadPozaFirebase(imageFile, docId)
      if (uploaded) imageUrl = uploaded
    }

    const data = {
      local_id: reteta.id || '',
      name: reteta.name || '',
      description: reteta.description || '',
      ingredients: reteta.ingredients || '',
      instructions: reteta.instructions || '',
      prep_time: reteta.prep_time || 0,
      cook_time: reteta.cook_time || 0,
      servings: reteta.servings || 2,
      calories: reteta.calories || 0,
      category: reteta.category || 'toata_ziua',
      difficulty: reteta.difficulty || 'mediu',
      image_url: imageUrl,
      created_by: reteta.created_by || '',
      created_at: serverTimestamp(),
    }

    // Caută dacă există deja un document cu local_id-ul acesta
    const { where } = await import('firebase/firestore')
    const existing = await getDocs(query(
      collection(db, 'inspiratie'),
      where('local_id', '==', reteta.id || '')
    ))

    if (!existing.empty) {
      // Actualizează documentul existent
      const existingDoc = existing.docs[0]
      await updateDoc(doc(db, 'inspiratie', existingDoc.id), {
        ...data,
        created_at: existingDoc.data().created_at, // păstrează data originală
      })
      return { success: true, firebase_id: existingDoc.id }
    } else {
      // Creează document nou
      const docRef = await addDoc(collection(db, 'inspiratie'), data)
      return { success: true, firebase_id: docRef.id }
    }
  } catch (e) {
    console.error('[Firebase] Eroare publicare reteta:', e)
    return { success: false, error: e.message }
  }
}

export async function stergeRetetaFirebase(firebaseId) {
  try {
    await deleteDoc(doc(db, 'inspiratie', firebaseId))
    return { success: true }
  } catch (e) {
    console.error('[Firebase] Eroare stergere reteta:', e)
    return { success: false }
  }
}

// ─── TELEMETRIE TEHNICĂ ──────────────────────────────────────────────────────

export async function sendTelemetryEvent(eventType, action, target = '', metadata = {}) {
  try {
    await addDoc(collection(db, 'telemetrie'), {
      event_type: eventType,
      action,
      target,
      metadata,
      app_version: window.electronAPI?.getVersion?.() || 'web',
      timestamp: serverTimestamp(),
      user_agent: navigator.userAgent,
    })
  } catch (e) {
    // silentios - telemetria nu blocheaza UI
  }
}

export async function sendErrorToFirebase(message, source = 'frontend', extra = {}) {
  try {
    await addDoc(collection(db, 'erori'), {
      message,
      source,
      extra,
      app_version: window.electronAPI?.getVersion?.() || 'web',
      timestamp: serverTimestamp(),
      user_agent: navigator.userAgent,
    })
  } catch (e) {
    // silentios
  }
}

export async function loadTelemetrieFirestore(limitCount = 100) {
  try {
    const { limit } = await import('firebase/firestore')
    const q = query(collection(db, 'telemetrie'), orderBy('timestamp', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('[Firebase] Eroare incarcare telemetrie:', e)
    return []
  }
}

export async function loadEroriFirestore(limitCount = 50) {
  try {
    const { limit } = await import('firebase/firestore')
    const q = query(collection(db, 'erori'), orderBy('timestamp', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('[Firebase] Eroare incarcare erori:', e)
    return []
  }
}

// ─── PREZENTA UTILIZATORI ────────────────────────────────────────────────────
export async function updatePrezentaFirebase(username, page) {
  try {
    await setDoc(doc(db, 'prezenta', username), {
      username,
      page,
      last_seen: serverTimestamp(),
    })
  } catch (e) {}
}

export async function loadPrezentaFirebase() {
  try {
    const snap = await getDocs(collection(db, 'prezenta'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    return []
  }
}

export default firebaseApp
