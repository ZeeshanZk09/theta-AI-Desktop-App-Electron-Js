import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";
import { AppStateProvider } from "./contexts/AppStateContext";
import { DataProvider } from "./contexts/DataContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <AppStateProvider>
    <DataProvider>
      <App />
    </DataProvider>
  </AppStateProvider>
);
