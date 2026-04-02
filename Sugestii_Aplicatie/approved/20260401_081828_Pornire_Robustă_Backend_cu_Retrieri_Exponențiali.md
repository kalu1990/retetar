# Pornire Robustă Backend cu Retrieri Exponențiali

**Status:** Aprobat  
**Categorie:** stability  
**Fi?ier ?inta:** electron/main.js  
**Confidence:** 0.85  
**Data:** 01.04.2026 08:18

## Descriere
Refactorizează funcția `startBackend` pentru a verifica asincron disponibilitatea portului API și pentru a implementa o strategie de retrieri cu backoff exponențial și un număr maxim de încercări în cazul în care procesul backend se oprește neașteptat.

## Motiva?ie
Implementarea curentă are o condiție de cursă la verificarea portului API și un ciclu infinit de repornire în cazul unei opriri neașteptate a backend-ului. Această îmbunătățire asigură o pornire corectă, previne epuizarea resurselor și oferă un comportament mai stabil și predictibil la erori de pornire sau de funcționare a serviciului backend.

## Cod sugerat
```python
let backendRestartAttempts = 0; const MAX_BACKEND_RESTARTS = 5; // Global
async function startBackend() { // Make startBackend async
  const isPortFree = await new Promise(resolve => { /* net.createServer check */ });
  if (!isPortFree && backendRestartAttempts < MAX_BACKEND_RESTARTS) {
    backendRestartAttempts++; setTimeout(startBackend, 2000 * Math.pow(2, backendRestartAttempts - 1)); return;
  } else if (!isPortFree) { dialog.showErrorBox('Eroare', 'Portul API ocupat.'); app.quit(); return; }
  // ... spawn backendProc ...
  backendProc.on('close', function (code) {
    backendProc = null; if (!isQuitting && backendRestartAttempts < MAX_BACKEND_RESTARTS) {
      backendRestartAttempts++; setTimeout(startBackend, 2000 * Math.pow(2, backendRestartAttempts - 1));
    } else if (!isQuitting) { dialog.showErrorBox('Eroare', 'Backend nu a putut fi repornit.'); app.quit(); }
  });
}
```
