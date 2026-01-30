import "./polyfills";

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThirdwebProvider } from "thirdweb/react";

createRoot(document.getElementById("root")!).render(
    <ThirdwebProvider>
        <App />
    </ThirdwebProvider>
);
