import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["packages/*/src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    environmentMatchGlobs: [["packages/client/src/**/*.test.tsx", "jsdom"]],
  },
});
