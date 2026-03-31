; installer.nsh

!macro customUnInstall
  DetailPrint "Se opresc procesele aplicatiei..."
  nsExec::ExecToLog 'wmic process where "ExecutablePath like ''%bucataria-mea%''" delete'
  nsExec::ExecToLog 'wmic process where "name=''backend.exe''" delete'
  nsExec::ExecToLog 'taskkill /F /IM "backend.exe" /T'
  Sleep 3000

  DetailPrint "Se sterg datele aplicatiei..."
  RMDir /r "$APPDATA\bucataria-mea"
  RMDir /r "$LOCALAPPDATA\bucataria-mea"
  RMDir /r "$LOCALAPPDATA\bucataria-mea-updater"

  DetailPrint "Se sterge folderul de instalare..."
  Sleep 1000
  RMDir /r "$INSTDIR"
  RMDir /r "$PROGRAMFILES\bucataria-mea"
  RMDir /r "$PROGRAMFILES64\bucataria-mea"

  DetailPrint "Dezinstalare completa!"
!macroend

!macro customInstall
  DetailPrint "Se opresc procesele existente..."
  nsExec::ExecToLog 'taskkill /F /IM "Bucataria Mea.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "python.exe" /T'
  nsExec::ExecToLog 'wmic process where "ExecutablePath like ''%bucataria-mea%''" delete'
  Sleep 2000

  ; ── Visual C++ Redistributable ───────────────────────────────────
  DetailPrint "Se verifica Visual C++ Redistributable..."
  nsExec::ExecToStack 'powershell -Command "if (Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"'
  Pop $0
  ${If} $0 != 0
    DetailPrint "Se descarca si instaleaza Visual C++ Redistributable..."
    nsExec::ExecToLog 'powershell -Command "Invoke-WebRequest -Uri ''https://aka.ms/vs/17/release/vc_redist.x64.exe'' -OutFile ''$TEMP\vc_redist.x64.exe'' -UseBasicParsing; Start-Process ''$TEMP\vc_redist.x64.exe'' -ArgumentList ''/install /quiet /norestart'' -Wait; Remove-Item ''$TEMP\vc_redist.x64.exe'' -Force"'
    DetailPrint "Visual C++ Redistributable instalat."
  ${Else}
    DetailPrint "Visual C++ Redistributable deja instalat."
  ${EndIf}

  ; ── WebView2 Runtime ─────────────────────────────────────────────
  DetailPrint "Se verifica WebView2..."
  nsExec::ExecToStack 'powershell -Command "if (Get-ItemProperty ''HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}'' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"'
  Pop $1
  ${If} $1 != 0
    DetailPrint "Se descarca si instaleaza WebView2..."
    nsExec::ExecToLog 'powershell -Command "Invoke-WebRequest -Uri ''https://go.microsoft.com/fwlink/p/?LinkId=2124703'' -OutFile ''$TEMP\WebView2Setup.exe'' -UseBasicParsing; Start-Process ''$TEMP\WebView2Setup.exe'' -ArgumentList ''/silent /install'' -Wait; Remove-Item ''$TEMP\WebView2Setup.exe'' -Force"'
    DetailPrint "WebView2 instalat."
  ${Else}
    DetailPrint "WebView2 deja instalat."
  ${EndIf}
!macroend