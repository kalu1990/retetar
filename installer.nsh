; installer.nsh - Dezinstalare aplicatie (Ollama si modelul raman intacte)

!macro customUnInstall
  ; ── PASUL 1: Opreste procesele aplicatiei ─────────────────────────
  DetailPrint "Se opresc procesele aplicatiei..."
  nsExec::ExecToLog 'wmic process where "ExecutablePath like ''%bucataria-mea%''" delete'
  nsExec::ExecToLog 'wmic process where "name=''backend.exe''" delete'
  nsExec::ExecToLog 'taskkill /F /IM "backend.exe" /T'
  Sleep 3000

  ; ── PASUL 2: Sterge datele aplicatiei ─────────────────────────────
  DetailPrint "Se sterg datele aplicatiei..."
  RMDir /r "$APPDATA\bucataria-mea"
  RMDir /r "$LOCALAPPDATA\bucataria-mea"
  RMDir /r "$LOCALAPPDATA\bucataria-mea-updater"

  ; ── PASUL 3: Sterge folderul de instalare ─────────────────────────
  DetailPrint "Se sterge folderul de instalare..."
  Sleep 1000
  RMDir /r "$INSTDIR"
  RMDir /r "$PROGRAMFILES\bucataria-mea"
  RMDir /r "$PROGRAMFILES64\bucataria-mea"

  DetailPrint "Dezinstalare completa! (Ollama si modelul AI au fost pastrate)"
!macroend

!macro customInstall
  ; ── Opreste aplicatia inainte de instalare ────────────────────────
  DetailPrint "Se opresc procesele existente..."
  nsExec::ExecToLog 'taskkill /F /IM "Bucataria Mea.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "python.exe" /T'
  nsExec::ExecToLog 'wmic process where "ExecutablePath like ''%bucataria-mea%''" delete'
  Sleep 2000
!macroend
