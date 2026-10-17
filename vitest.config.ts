import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dir = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@/app": dir("./src/app"),
      "@/features": dir("./src/features"),
      "@/shared": dir("./src/shared"),
      "@/server": dir("./src/server"),
      "server-only": dir("./test/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
  },
});
