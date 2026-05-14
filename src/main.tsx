import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Mark native (Capacitor) app so CSS can hide PWA-only UI
const w = window as any;
const isNative =
  !!w.Capacitor &&
  (typeof w.Capacitor.isNativePlatform === "function"
    ? w.Capacitor.isNativePlatform()
    : w.Capacitor.getPlatform && w.Capacitor.getPlatform() !== "web");
if (isNative) document.body.classList.add("is-native-app");

createRoot(document.getElementById("root")!).render(<App />);
