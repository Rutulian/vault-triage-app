import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { createApp, errorHandler } from "./app.js";

describe("Express App", () => {
  const app = createApp();

  describe("GET /api/health", () => {
    it("returns 200 with status ok", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    });

    it("returns a valid ISO timestamp", async () => {
      const res = await request(app).get("/api/health");

      const timestamp = new Date(res.body.timestamp);
      expect(timestamp.toISOString()).toBe(res.body.timestamp);
    });
  });

  describe("Error handling middleware", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await request(app).get("/api/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: "Not Found",
      });
    });

    it("returns JSON error for unknown routes with correct content-type", async () => {
      const res = await request(app).get("/api/nonexistent");

      expect(res.headers["content-type"]).toMatch(/application\/json/);
    });

    it("returns 500 when a route throws an error", async () => {
      const testApp = express();
      testApp.get("/api/boom", () => {
        throw new Error("test explosion");
      });
      testApp.use(errorHandler);

      const res = await request(testApp).get("/api/boom");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal Server Error" });
    });
  });
});
