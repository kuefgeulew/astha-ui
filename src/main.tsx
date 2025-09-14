import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import DevErrorBoundary from "./components/DevErrorBoundary";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error('Root element with id="root" not found in index.html');

createRoot(rootEl).render(
  <StrictMode>
    <DevErrorBoundary>
      <App />
    </DevErrorBoundary>
  </StrictMode>
);
