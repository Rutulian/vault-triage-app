// @vitest-environment node
import { describe, it, expect } from "vitest";
import config from "../vite.config";

describe("Vite config", () => {
  it("configures API proxy to Express server", () => {
    const serverConfig = config as { server?: { proxy?: Record<string, unknown> } };
    expect(serverConfig.server?.proxy).toBeDefined();
    expect(serverConfig.server?.proxy?.["/api"]).toEqual({
      target: "http://localhost:3001",
      changeOrigin: true,
    });
  });

  it("uses port 5173", () => {
    const serverConfig = config as { server?: { port?: number } };
    expect(serverConfig.server?.port).toBe(5173);
  });

  it("includes react and tailwindcss plugins", () => {
    const pluginConfig = config as { plugins?: Array<{ name: string } | Array<{ name: string }>> };
    const plugins = pluginConfig.plugins ?? [];
    const pluginNames = plugins.flat().map((p) => p.name);
    expect(pluginNames).toContain("vite:react-babel");
    expect(pluginNames.some((n) => n.includes("tailwindcss"))).toBe(true);
  });
});
