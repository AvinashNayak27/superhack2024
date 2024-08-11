import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Onboard from "./components/Onboard.jsx";
import { AuthProvider } from "./hooks/authContext.jsx";
import Elections from "./components/Elections.jsx";
import Election from "./components/Election.jsx";

export const client = createThirdwebClient({
  clientId: "3226bc8b6144820daf85cd6b049941cd",
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThirdwebProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/onboard" element={<Onboard />} />
            <Route path="/elections" element={<Elections />} />
            <Route path="/election/:key" element={<Election />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThirdwebProvider>
  </StrictMode>
);
