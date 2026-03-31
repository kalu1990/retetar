const { contextBridge, ipcRenderer, shell } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  appVersion:    () => ipcRenderer.invoke('app-version'),
  getVersion:    () => ipcRenderer.invoke('app-version'),
  quitApp:       () => ipcRenderer.invoke('quit-app'),
  minimizeApp:   () => ipcRenderer.invoke('minimize-app'),
  maximizeApp:   () => ipcRenderer.invoke('maximize-app'),
  checkUpdate:   () => ipcRenderer.invoke('check-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  openExternal:  (url) => ipcRenderer.invoke('open-external', url),
  isElectron:    true,
})
