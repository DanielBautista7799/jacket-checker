import { Capacitor } from "@capacitor/core";
import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";

import App from "./App";
import { initializeTheme } from "./utils/theme";
import "./index.css";

initializeTheme();

const nativePlatform = Capacitor.isNativePlatform();

document.documentElement.classList.toggle(
  "capacitor-native",
  nativePlatform,
);

document.documentElement.dataset.platform = nativePlatform
  ? Capacitor.getPlatform()
  : "web";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);