// Default fallback config
let config = {
  apiBaseUrl: 'http://localhost:5773',
  defaultDateFormat: 'YYYY-MM-DD',
  appName: 'Akoya Water Park',
  features: {
    enablePrinting: true,
    enableExports: true
  }
};

// Function to load config from external file
export async function loadConfig() {
  try {
    const response = await fetch('./config.json');
    if (!response.ok) throw new Error('Config not found');
    const loadedConfig = await response.json();
    
    // Update the config object with loaded values
    config = { ...config, ...loadedConfig };
    console.log('External config loaded successfully:', config);
  } catch (error) {
    console.warn('Could not load external config, using defaults:', error);
  }
}

// Initial load attempt
loadConfig();

// Export the config object that will be updated when loaded
export default config;