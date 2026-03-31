import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

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

export default firebaseApp
