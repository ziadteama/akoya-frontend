import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

fetch('/config.json')
  .then((res) => res.json())
  .then((config) => {
    window.runtimeConfig = config;
    startApp();
  })
  .catch((err) => {
    console.error("❌ Failed to load config.json", err);
    alert("Unable to start app: missing config.json");
  });

function startApp() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
