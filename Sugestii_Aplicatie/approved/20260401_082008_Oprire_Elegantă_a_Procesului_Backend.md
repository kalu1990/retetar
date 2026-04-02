# Oprire Elegantă a Procesului Backend

**Status:** Aprobat  
**Categorie:** stability  
**Fi?ier ?inta:** electron/main.js  
**Confidence:** 0.85  
**Data:** 01.04.2026 08:20

## Descriere
Modifică gestionarea evenimentului `app.on('before-quit')` pentru a trimite un semnal `SIGTERM` procesului backend Python, așteptând un interval scurt înainte de a recurge la o terminare forțată (`SIGKILL`).

## Motiva?ie
Terminarea bruscă a procesului backend poate duce la pierderi de date sau la stări inconsistente ale bazei de date/fișierelor. Permițând backend-ului să primească un semnal de terminare elegantă (`SIGTERM`) și să aibă timp să-și închidă resursele, se îmbunătățește integritatea datelor și fiabilitatea aplicației la închidere.

## Cod sugerat
```python
app.on('before-quit', async function (event) {
  if (backendProc) {
    event.preventDefault();
    backendProc.kill('SIGTERM');
    await new Promise(resolve => {
      const timeout = setTimeout(() => {
        if (backendProc) backendProc.kill('SIGKILL');
        resolve();
      }, 5000);
      backendProc.once('close', () => { clearTimeout(timeout); resolve(); });
    });
    app.quit();
  }
});
```
