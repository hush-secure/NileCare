import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppDataProvider } from "./context/AppData";
import { THEME } from "./config";
import { AuthProvider } from "./context/Auth";


document.documentElement.setAttribute("data-theme", THEME);

const rootElement = document.getElementById("root") as HTMLElement;
createRoot(rootElement).render(
  <BrowserRouter>
    <AuthProvider>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </AuthProvider>
  </BrowserRouter>
);
