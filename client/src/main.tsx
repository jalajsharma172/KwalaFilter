import "./polyfills";

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import SolanaProvider from "./components/SolanaProvider";

createRoot(document.getElementById("root")!).render(
    <SolanaProvider>
        <App />
    </SolanaProvider>
);
