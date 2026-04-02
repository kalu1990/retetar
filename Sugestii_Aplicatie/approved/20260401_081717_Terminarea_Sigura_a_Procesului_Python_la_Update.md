# Terminarea Sigura a Procesului Python la Update

**Status:** Aprobat  
**Categorie:** bug_fix  
**Fi?ier ?inta:** electron/main.js  
**Confidence:** 0.85  
**Data:** 01.04.2026 08:17

## Descriere
Modifică funcția `killAndInstall` pentru a opri specific procesul backend Python, înlăturând comenzile generice `taskkill /IM python.exe` care pot afecta alte procese Python ale utilizatorului.

## Motiva?ie
Comenzile `taskkill /IM python.exe` sunt indiscriminatorii și pot închide forțat orice proces Python activ pe sistemul utilizatorului, chiar dacă acestea nu aparțin aplicației. Oprirea specifică a procesului `backendProc` prin PID-ul său previne întreruperi nedorite și îmbunătățește stabilitatea sistemului.

## Cod sugerat
```python
  // Opreste backend Python fortat
  if (backendProc) {
    try { backendProc.kill('SIGKILL') } catch (e) {
      console.error('[Update] Eroare la oprirea procesului backend:', e.message);
    }
    backendProc = null
  }
  // Comenzile generice taskkill pentru python.exe/python3.exe sunt eliminate
  // pentru a nu afecta alte procese Python. Procesul specific a fost deja oprit.
```
