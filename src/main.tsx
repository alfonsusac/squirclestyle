import "./style.css";

import { App } from "./App";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root") as HTMLElement;

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

createRoot(rootElement).render(<App />);
