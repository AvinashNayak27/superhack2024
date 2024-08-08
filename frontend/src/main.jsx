import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

export const client = createThirdwebClient({
  clientId: '30e1868c749fa9f54a9cf2414b536416',
});


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThirdwebProvider>
      <App />
    </ThirdwebProvider>
  </StrictMode>
);
