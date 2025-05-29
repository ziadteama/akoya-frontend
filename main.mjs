import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
console.log("Preload path:", path.join(__dirname, "preload.cjs"));

// Configuration file path
const configPath = path.join(app.getPath('userData'), 'config.json');

// Load or create config file
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {}; // Return empty config if no file exists or error
}

// Save config to file
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Create the window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  
  mainWindow.setMenuBarVisibility(false);
  
  // In production, load the bundled React app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "frontend", "dist", "index.html"));
  } else {
    // In development, load from the React dev server
    mainWindow.loadURL("http://localhost:5173");
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }
  
  // Handle window closing
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC Handlers for printer functionality
// Get all available printers
ipcMain.handle('get-printers', async (event) => {
  try {
    const printerList = event.sender.getPrinters();
    console.log('Available printers:', printerList.map(p => p.name));
    return printerList;
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
});

// Print HTML content with options
ipcMain.handle('print-html', async (event, { html, options }) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Print requested with options:', options);
      
      // Create a hidden window for printing
      const printWindow = new BrowserWindow({
        width: 300,
        height: 300,
        show: false, // Change to true for debugging
      });
      
      // Create temp file for the print content
      const tempPath = path.join(os.tmpdir(), `receipt-${Date.now()}.html`);
      
      // Create HTML content with appropriate styling
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Akoya Receipt</title>
          <style>
            @page {
              margin: 0;
              size: ${options.pageSize?.width ? (options.pageSize.width / 1000) + 'mm' : '80mm'} auto;
            }
            body {
              margin: 0;
              padding: 5mm;
              font-family: 'Courier New', monospace;
              font-size: 10pt;
              width: ${options.pageSize?.width ? (options.pageSize.width / 1000) + 'mm' : '80mm'};
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;
      
      // Log for debugging
      console.log('Writing to temp file:', tempPath);
      console.log('HTML content length:', fullHtml.length);
      
      // Write content to temp file
      fs.writeFileSync(tempPath, fullHtml);
      
      // Load the file in the window
      printWindow.loadFile(tempPath);
      
      printWindow.webContents.on('did-finish-load', () => {
        console.log('Content loaded, preparing to print');
        
        // Print with provided options
        printWindow.webContents.print(options, (success, errorType) => {
          // Clean up
          printWindow.close();
          try {
            fs.unlinkSync(tempPath);
            console.log('Temp file deleted');
          } catch (err) {
            console.error('Error deleting temp file:', err);
          }
          
          if (success) {
            console.log('Print job successful');
            resolve({ success: true });
          } else {
            console.error('Print failed:', errorType);
            reject(new Error(`Print failed: ${errorType}`));
          }
        });
      });
      
      // Handle errors
      printWindow.webContents.on('did-fail-load', (e, code, desc) => {
        console.error('Failed to load content:', code, desc);
        printWindow.close();
        try {
          fs.unlinkSync(tempPath);
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
        reject(new Error(`Failed to load content: ${desc}`));
      });
    } catch (error) {
      console.error('Error in print-html handler:', error);
      reject(error);
    }
  });
});

// Config handlers
ipcMain.handle('save-config', async (event, { key, value }) => {
  try {
    const config = loadConfig();
    config[key] = value;
    saveConfig(config);
    return { success: true };
  } catch (error) {
    console.error('Error saving config:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-config', async (event, key) => {
  try {
    const config = loadConfig();
    return config[key];
  } catch (error) {
    console.error('Error getting config:', error);
    return null;
  }
});

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Basic message handler for testing
ipcMain.on("message-from-react", (event, message) => {
  console.log("Message from React:", message);
  event.sender.send("message-to-react", "Message received in main process");
});
