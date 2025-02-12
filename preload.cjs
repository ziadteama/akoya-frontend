const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  sendMessage: (message) => ipcRenderer.send("message-from-react", message),
  onMessage: (callback) => ipcRenderer.on("message-to-react", (_, data) => callback(data)),
});

// Debugging: Confirm preload is loaded
console.log("✅ Preload script is running!");
