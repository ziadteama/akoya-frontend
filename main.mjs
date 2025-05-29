import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

const preloadPath = path.join(__dirname, "preload.cjs");
console.log("Preload path:", preloadPath);

// === CONFIGURATION ===
const configPath = path.join(app.getPath("userData"), "config.json");
const configTemplatePath = path.join(__dirname, "config.template.json");

// Ensure config exists (copy from template on first run)
function ensureDefaultConfig() {
  try {
    if (!fs.existsSync(configPath) && fs.existsSync(configTemplatePath)) {
      fs.copyFileSync(configTemplatePath, configPath);
      console.log("Default config copied to:", configPath);
    }
  } catch (err) {
    console.error("Error initializing config:", err);
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (err) {
    console.error("Error loading config:", err);
  }
  return {};
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving config:", err);
  }
}

// === CREATE WINDOW ===
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "frontend", "dist", "index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// === APP INIT ===
app.whenReady().then(() => {
  ensureDefaultConfig();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// === IPC HANDLERS ===

// PRINTER
ipcMain.handle("get-printers", async (event) => {
  try {
    const printerList = event.sender.getPrinters();
    console.log("Available printers:", printerList.map((p) => p.name));
    return printerList;
  } catch (err) {
    console.error("Error getting printers:", err);
    return [];
  }
});

ipcMain.handle("print-html", async (event, { html, options = {} }) => {
  try {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
    await new Promise((res) => setTimeout(res, 200));

    const printOptions = {
      printBackground: true,
      silent: true,
      landscape: false,
      margins: {
        marginType: "none",
        ...options.margins,
      },
      pageSize: {
        width: 58000,
        height: 400000,
      },
      ...options,
    };

    await win.webContents.print(printOptions, (success, failureReason) => {
      if (!success) console.error("Print failed:", failureReason);
      win.close();
    });

    return { success: true };
  } catch (err) {
    console.error("Print error:", err);
    return { success: false, error: err.message };
  }
});

// CONFIG
ipcMain.handle("save-config", async (event, { key, value }) => {
  try {
    const config = loadConfig();
    config[key] = value;
    saveConfig(config);
    return { success: true };
  } catch (err) {
    console.error("Error saving config:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("get-config", async (event, key) => {
  try {
    const config = loadConfig();
    return key ? config[key] : config;
  } catch (err) {
    console.error("Error getting config:", err);
    return null;
  }
});

// APP VERSION
ipcMain.handle("get-app-version", () => app.getVersion());

// DEBUG MESSAGE HANDLER
ipcMain.on("message-from-react", (event, message) => {
  console.log("Message from React:", message);
  event.sender.send("message-to-react", "Message received in main process");
});
