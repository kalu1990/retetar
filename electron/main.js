const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const http = require('http')
const { autoUpdater } = require('electron-updater')

const APP_NAME = 'Bucataria Mea'
const API_PORT = 8000
const FRONTEND_PORT = 5173
const isDev = !app.isPackaged

const ROOT = isDev
  ? path.join(__dirname, '..')
  : path.join(process.resourcesPath, 'app')

const PYTHON_DEV = path.join(ROOT, '.venv', 'Scripts', 'python.exe')
const PYTHON_EMBED = isDev
  ? null
  : path.join(process.resourcesPath, 'python-embed', 'python.exe')
const API_SCRIPT = path.join(ROOT, 'retetar_api.py')
const ICON_PATH = path.join(__dirname, '..', 'assets', 'icon.ico')

let mainWindow = null
let splashWindow = null
let tray = null
let backendProc = null
let isQuitting = false

// ─── AUTO-UPDATE ──────────────────────────────────────────────────────────────
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on('checking-for-update', function () {
  console.log('[Update] Caut versiune noua...')
})

autoUpdater.on('update-available', function (info) {
  console.log('[Update] Versiune noua gasita:', info.version)
  dialog.showMessageBox({
    type: 'info',
    title: 'Update disponibil',
    message: 'Este disponibila versiunea ' + info.version + '.\nVrei sa descarci update-ul?',
    buttons: ['Descarca', 'Nu acum'],
    defaultId: 0,
    icon: ICON_PATH,
  }).then(function (result) {
    if (result.response === 0) {
      autoUpdater.downloadUpdate()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-downloading')
      }
    }
  })
})

autoUpdater.on('update-not-available', function () {
  console.log('[Update] Esti pe cea mai noua versiune.')
})

autoUpdater.on('download-progress', function (progress) {
  var pct = Math.round(progress.percent)
  console.log('[Update] Descarcare:', pct + '%')
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-progress', pct)
  }
})

autoUpdater.on('update-downloaded', function (info) {
  console.log('[Update] Descarcat! Versiunea', info.version, 'e gata.')
  var win = (mainWindow && !mainWindow.isDestroyed()) ? mainWindow : null
  if (win) {
    win.show()
    win.focus()
    win.webContents.send('update-downloaded', info.version)
  }
  var opts = {
    type: 'info',
    title: 'Update gata',
    message: 'Versiunea ' + info.version + ' a fost descarcata.\nRepornesti aplicatia acum pentru a folosi noua versiune?',
    buttons: ['Reporneste acum', 'Mai tarziu'],
    defaultId: 0,
    icon: ICON_PATH,
  }
  var dlg = win ? dialog.showMessageBox(win, opts) : dialog.showMessageBox(opts)
  dlg.then(function (result) {
    if (result.response === 0) {
      killAndInstall()
    }
    // Daca alege 'Mai tarziu' -> autoInstallOnAppQuit se ocupa la inchidere
  })
})

autoUpdater.on('error', function (err) {
  console.error('[Update] Eroare:', err.message)
})

function checkForUpdates() {
  if (isDev) {
    console.log('[Update] Dev mode - sar peste verificare update.')
    return
  }
  try {
    autoUpdater.checkForUpdates()
  } catch (e) {
    console.error('[Update] Nu pot verifica update:', e.message)
  }
}

function killAndInstall() {
  isQuitting = true
  var execCmd = require('child_process').exec
  var spawnCmd = require('child_process').spawn

  // Inchide toate ferestrele
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy()
    mainWindow = null
  }
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.destroy()
    splashWindow = null
  }
  if (tray) {
    tray.destroy()
    tray = null
  }

  // Opreste backend Python fortat
  if (backendProc) {
    try { backendProc.kill('SIGKILL') } catch (e) {}
    backendProc = null
  }

  // Ucide fortat orice proces Python ramas
  execCmd('taskkill /F /IM python.exe /T 2>nul', function () {})
  execCmd('taskkill /F /IM python3.exe /T 2>nul', function () {})

  // Gaseste installer-ul descarcat in cache si ruleaza-l cu /S (silent)
  setTimeout(function () {
    try {
      var updaterCacheDir = path.join(
        app.getPath('appData'),
        app.name + '-updater',
        'pending'
      )
      var files = fs.readdirSync(updaterCacheDir)
      var installer = files.find(function (f) { return f.endsWith('.exe') })
      if (installer) {
        var installerPath = path.join(updaterCacheDir, installer)
        console.log('[Update] Rulez installer silentios:', installerPath)
        var child = spawnCmd(installerPath, ['/S'], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        })
        child.unref()
        setTimeout(function () { app.exit(0) }, 300)
      } else {
        console.log('[Update] Fallback la quitAndInstall')
        autoUpdater.quitAndInstall(true, true)
      }
    } catch (e) {
      console.error('[Update] Eroare install:', e.message)
      autoUpdater.quitAndInstall(true, true)
    }
  }, 2000)
}
// ─────────────────────────────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', function () {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480, height: 300,
    frame: false, transparent: true,
    resizable: false, alwaysOnTop: true, skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    icon: ICON_PATH,
  })
  splashWindow.loadFile(path.join(__dirname, 'splash.html'))
  splashWindow.center()
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.destroy()
    splashWindow = null
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 1024, minHeight: 700,
    show: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0C0806', symbolColor: '#D4B87A', height: 40 },
    backgroundColor: '#0C0806',
    icon: ICON_PATH,
    title: APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:' + FRONTEND_PORT)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // Permite Firebase Google Auth popup
  mainWindow.webContents.setWindowOpenHandler(function (details) {
    var url = details.url
    if (
      url.includes('accounts.google.com') ||
      url.includes('firebaseapp.com/__/auth') ||
      url.includes('googleapis.com') ||
      url.includes('firebase.google.com')
    ) {
      return { action: 'allow' }
    }
    return { action: 'deny' }
  })

  mainWindow.once('ready-to-show', function () {
    closeSplash()
    mainWindow.show()
    mainWindow.focus()
    setTimeout(checkForUpdates, 5000)
  })

  // X inchide complet aplicatia
  mainWindow.on('close', function () {
    isQuitting = true
    if (backendProc) {
      try { backendProc.kill() } catch (e) {}
    }
    app.quit()
  })

  mainWindow.on('closed', function () { mainWindow = null })
}

function createTray() {
  var icon = fs.existsSync(ICON_PATH)
    ? nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty()

  tray = new Tray(icon)
  tray.setToolTip(APP_NAME)

  var menu = Menu.buildFromTemplate([
    {
      label: 'Deschide Bucataria Mea',
      click: function () {
        if (mainWindow) { mainWindow.show(); mainWindow.focus() }
        else createMainWindow()
      }
    },
    { type: 'separator' },
    { label: 'Versiunea ' + app.getVersion(), enabled: false },
    { type: 'separator' },
    {
      label: 'Verifica update-uri',
      click: function () { checkForUpdates() }
    },
    { type: 'separator' },
    {
      label: 'Iesi complet',
      click: function () { isQuitting = true; app.quit() }
    },
  ])

  tray.setContextMenu(menu)
  tray.on('double-click', function () {
    if (mainWindow) { mainWindow.show(); mainWindow.focus() }
  })
}

function getPythonExe() {
  // 1. Python embedded din pachet (productie) — are toate pachetele instalate
  if (!isDev && PYTHON_EMBED && fs.existsSync(PYTHON_EMBED)) {
    console.log('[Backend] Folosesc python-embed:', PYTHON_EMBED)
    return PYTHON_EMBED
  }
  // 2. .venv local (dev)
  if (fs.existsSync(PYTHON_DEV)) {
    return PYTHON_DEV
  }
  // 3. Fallback - Python de sistem
  var localApp = process.env.LOCALAPPDATA || ''
  var candidates = []
  if (localApp) {
    candidates.push(localApp + '\\Programs\\Python\\Python313\\python.exe')
    candidates.push(localApp + '\\Programs\\Python\\Python312\\python.exe')
    candidates.push(localApp + '\\Programs\\Python\\Python311\\python.exe')
    candidates.push(localApp + '\\Programs\\Python\\Python310\\python.exe')
  }
  candidates.push('C:\\Python313\\python.exe')
  candidates.push('C:\\Python312\\python.exe')
  for (var i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) {
      console.log('[Backend] Python sistem gasit la:', candidates[i])
      return candidates[i]
    }
  }
  console.log('[Backend] Fallback python din PATH')
  return 'python'
}

function startBackend() {
  return new Promise(function (resolve, reject) {
    var exePath = getPythonExe()
    var scriptPath = API_SCRIPT

    console.log('[Backend] Python:', exePath)
    console.log('[Backend] Script:', scriptPath)
    console.log('[Backend] Script exists:', fs.existsSync(scriptPath))
    console.log('[Backend] ROOT:', ROOT)

    if (!fs.existsSync(scriptPath)) {
      var altScript = path.join(path.dirname(process.execPath), 'resources', 'app', 'retetar_api.py')
      console.log('[Backend] Incerc alternativa:', altScript)
      if (fs.existsSync(altScript)) {
        scriptPath = altScript
      }
    }

    var useShell = (exePath === 'python')

    backendProc = spawn(exePath, [scriptPath], {
      cwd: path.dirname(scriptPath),
      env: Object.assign({}, process.env, {
        PYTHONUNBUFFERED: '1',
        CREATOR_PIN: process.env.CREATOR_PIN || 'admin123',
        CREATOR_USER: process.env.CREATOR_USER || 'madalin',
      }),
      windowsHide: true,
      shell: useShell,
    })

    backendProc.stdout.on('data', function (data) {
      var text = data.toString()
      console.log('[Backend stdout]', text.trim())
      if (text.includes('Application startup complete') || text.includes('Uvicorn running')) {
        resolve()
      }
    })

    backendProc.stderr.on('data', function (data) {
      var text = data.toString()
      console.log('[Backend stderr]', text.trim())
      if (text.includes('Application startup complete') || text.includes('Uvicorn running')) {
        resolve()
      }
    })

    backendProc.on('error', function (err) {
      console.error('[Backend] Eroare spawn:', err)
      reject(err)
    })

    backendProc.on('exit', function (code) {
      console.log('[Backend] Proces iesit cu codul:', code)
    })

    setTimeout(resolve, 10000)
  })
}

function waitForApi() {
  return new Promise(function (resolve) {
    var tries = 0
    function tryIt() {
      http.get('http://localhost:' + API_PORT + '/api/auth/me?token=', function () {
        resolve()
      }).on('error', function () {
        tries++
        if (tries < 30) setTimeout(tryIt, 500)
        else resolve()
      })
    }
    tryIt()
  })
}

app.whenReady().then(function () {
  createSplash()
  createTray()

  startBackend()
    .then(function () { return waitForApi() })
    .then(function () { createMainWindow() })
    .catch(function (err) {
      console.error('Startup error:', err)
      createMainWindow()
    })
})

app.on('window-all-closed', function (e) { e.preventDefault() })

app.on('activate', function () {
  if (mainWindow) mainWindow.show()
  else createMainWindow()
})

app.on('before-quit', function () {
  isQuitting = true
  if (backendProc) {
    try { backendProc.kill() } catch (e) {}
  }
})

ipcMain.handle('app-version', function () { return app.getVersion() })
ipcMain.handle('open-external', function (event, url) {
  var { shell } = require('electron')
  shell.openExternal(url)
})
ipcMain.handle('quit-app', function () { isQuitting = true; app.quit() })
ipcMain.handle('minimize-app', function () { if (mainWindow) mainWindow.minimize() })
ipcMain.handle('maximize-app', function () {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.handle('check-update', function () { checkForUpdates() })
ipcMain.handle('install-update', function () { killAndInstall() })
