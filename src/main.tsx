import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// PWA registration (optional, only if plugin is configured)
try {
  // @ts-ignore
  const { registerSW } = await import('virtual:pwa-register');
  registerSW({ 
    immediate: true,
    onOfflineReady() {
      console.log('App pronto para uso offline');
    }
  });
} catch {
  // PWA plugin not available
}

createRoot(document.getElementById("root")!).render(<App />);
