import fs from "node:fs";
import path from "node:path";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

function loadEnvLocal() {
  const file = path.resolve(".env.local");
  if (!fs.existsSync(file)) {
    return;
  }
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    if (!process.env[key]) {
      process.env[key] = trimmed.slice(index + 1);
    }
  }
}

loadEnvLocal();

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "src/test/empty.ts"),
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
  },
});
