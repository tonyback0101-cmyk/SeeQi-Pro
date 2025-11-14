import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: resolve(__dirname, "vitest.setup.ts"),
    globals: true,
    coverage: {
      provider: "v8",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "next/link": resolve(__dirname, "test/__mocks__/nextLink.tsx"),
      "next/navigation": resolve(__dirname, "test/__mocks__/nextNavigation.ts"),
      "next-auth/react": resolve(__dirname, "test/__mocks__/nextAuthReact.tsx"),
    },
  },
});







