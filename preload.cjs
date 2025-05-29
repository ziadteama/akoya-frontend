const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // Existing functions
  sendMessage: (message) => ipcRenderer.send("message-from-react", message),
  onMessage: (callback) => ipcRenderer.on("message-to-react", (_, data) => callback(data)),
  
  // New printer-related functions
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  print: (html, options) => ipcRenderer.invoke('print-html', { html, options }),
  
  // File system access for config
  saveConfig: (key, value) => ipcRenderer.invoke('save-config', { key, value }),
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  
  // Environment info
  isElectron: true,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});

// Debugging: Confirm preload is loaded with printer support
console.log("✅ Preload script is running with printer support!");
