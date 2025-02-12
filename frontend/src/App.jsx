import { useEffect } from "react";

function App() {
  useEffect(() => {
    if (window.electron) {
      console.log("✅ Electron API detected in React");

      // Send message to Electron
      window.electron.sendMessage("Hello from React");

      // Listen for response from Electron
      window.electron.onMessage((data) => {
        console.log("📩 Message received in React:", data);
      });
    } else {
      console.error("❌ Electron API not found in React");
    }
  }, []);

  return <h1>Hello Electron + React!</h1>;
}

export default App;
