import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./theme.css";

// TEMP-QA-MOCK (revert after QA): expose the demo seeder.
import { __seedDemo } from "./shot-seed";
(window as any).__seedDemo = __seedDemo;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
