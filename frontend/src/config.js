/**
 * Global configuration settings for the Akoya application
 */

const config = {
  // API base URL - change this when deploying to different environments
  apiBaseUrl: 'http://localhost:3000',
  
  // Other global configuration options
  defaultDateFormat: 'YYYY-MM-DD',
  appName: 'Akoya Water Park',
  
  // Feature flags
  features: {
    enablePrinting: true,
    enableExports: true
  }
};

export default config;