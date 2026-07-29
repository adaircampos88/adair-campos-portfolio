import React from "react";
import { createRoot } from "react-dom/client";
import Home from "./page";
import "./prototype.css";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Home />
    </React.StrictMode>,
  );
}
