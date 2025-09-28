import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { makeServer } from "./lib/mirage";

// Start MirageJS server in development and preview
if (import.meta.env.DEV || import.meta.env.PROD) {
  try {
    makeServer({ environment: import.meta.env.DEV ? 'development' : 'production' });
    console.log('MirageJS server started');
  } catch (error) {
    console.error('Failed to start MirageJS server:', error);
  }
}

createRoot(document.getElementById("root")!).render(<App />);