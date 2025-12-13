import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BlockyProvider } from "./context/BlockyContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BlockyProvider>
      <App />
    </BlockyProvider>
  </React.StrictMode>,
);
