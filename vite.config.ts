import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  // Pin the dev server to 5174 so it matches the backend's Microsoft SSO
  // redirect target (FRONTEND_URL) and CORS_ALLOWED_ORIGINS. Without this,
  // Vite defaults to 5173, the SSO round-trip lands on a dead port, and API
  // calls from the running origin are blocked by CORS.
  server: {
    port: 5174,
    strictPort: true,
  },
});
