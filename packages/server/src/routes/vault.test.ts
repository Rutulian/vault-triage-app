import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createApp } from "../app.js";
import * as vaultService from "../services/vault.js";

let testDir: string;
let vaultWithObsidian: string;
let vaultWithMd: string;
let emptyDir: string;

beforeAll(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "vault-test-"));

  // Vault with .obsidian directory and .md files
  vaultWithObsidian = path.join(testDir, "with-obsidian");
  fs.mkdirSync(path.join(vaultWithObsidian, ".obsidian"), { recursive: true });
  fs.writeFileSync(path.join(vaultWithObsidian, "note.md"), "# Hello");

  // Vault with .md files but no .obsidian
  vaultWithMd = path.join(testDir, "with-md");
  fs.mkdirSync(vaultWithMd, { recursive: true });
  fs.writeFileSync(path.join(vaultWithMd, "note1.md"), "# Note 1");
  fs.writeFileSync(path.join(vaultWithMd, "note2.md"), "# Note 2");

  // Empty directory (not a vault)
  emptyDir = path.join(testDir, "empty");
  fs.mkdirSync(emptyDir, { recursive: true });
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

function freshApp() {
  vaultService.disconnectVault();
  return createApp();
}

describe("Vault Routes", () => {
  beforeEach(() => {
    vaultService.disconnectVault();
  });

  describe("POST /api/vault/connect", () => {
    it("accepts a valid vault path with .obsidian directory", async () => {
      const app = freshApp();

      const res = await request(app)
        .post("/api/vault/connect")
        .send({ path: vaultWithObsidian });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        path: vaultWithObsidian,
        hasObsidianDir: true,
        markdownFileCount: expect.any(Number),
        connectedAt: expect.any(String),
      });
    });

    it("accepts a valid vault path with .md files but no .obsidian", async () => {
      const app = freshApp();

      const res = await request(app)
        .post("/api/vault/connect")
        .send({ path: vaultWithMd });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        path: vaultWithMd,
        hasObsidianDir: false,
        markdownFileCount: expect.any(Number),
        connectedAt: expect.any(String),
      });
      expect(res.body.markdownFileCount).toBeGreaterThan(0);
    });

    it("rejects when path is missing from body", async () => {
      const app = freshApp();

      const res = await request(app)
        .post("/api/vault/connect")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "path is required" });
    });

    it("rejects when path is not a string", async () => {
      const app = freshApp();

      const res = await request(app)
        .post("/api/vault/connect")
        .send({ path: 123 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "path is required" });
    });

    it("rejects when directory does not exist", async () => {
      const app = freshApp();
      const fakePath = "/tmp/nonexistent-vault-dir-xyz-999";

      const res = await request(app)
        .post("/api/vault/connect")
        .send({ path: fakePath });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: `Directory does not exist: ${fakePath}`,
      });
    });

    it("rejects a directory with no .obsidian and no .md files", async () => {
      const app = freshApp();

      const res = await request(app)
        .post("/api/vault/connect")
        .send({ path: emptyDir });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error:
          "Directory does not appear to be a vault: no .obsidian directory and no .md files found",
      });
    });
  });

  describe("GET /api/vault/status", () => {
    it("returns null when no vault is connected", async () => {
      const app = freshApp();

      const res = await request(app).get("/api/vault/status");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ vault: null });
    });

    it("returns vault info after connecting", async () => {
      const app = freshApp();

      // Connect first
      await request(app)
        .post("/api/vault/connect")
        .send({ path: vaultWithObsidian });

      const res = await request(app).get("/api/vault/status");

      expect(res.status).toBe(200);
      expect(res.body.vault).toMatchObject({
        path: vaultWithObsidian,
        hasObsidianDir: true,
        markdownFileCount: expect.any(Number),
        connectedAt: expect.any(String),
      });
    });
  });
});
