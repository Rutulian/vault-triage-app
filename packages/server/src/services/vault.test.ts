import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  connectVault,
  getVaultStatus,
  disconnectVault,
} from "./vault.js";

let testDir: string;
let vaultWithObsidian: string;
let vaultWithMd: string;
let emptyDir: string;

beforeAll(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "vault-svc-test-"));

  vaultWithObsidian = path.join(testDir, "with-obsidian");
  fs.mkdirSync(path.join(vaultWithObsidian, ".obsidian"), { recursive: true });
  fs.writeFileSync(path.join(vaultWithObsidian, "note.md"), "# Hello");
  fs.mkdirSync(path.join(vaultWithObsidian, "sub"), { recursive: true });
  fs.writeFileSync(path.join(vaultWithObsidian, "sub", "deep.md"), "# Deep");

  vaultWithMd = path.join(testDir, "with-md");
  fs.mkdirSync(vaultWithMd, { recursive: true });
  fs.writeFileSync(path.join(vaultWithMd, "note1.md"), "# Note 1");
  fs.writeFileSync(path.join(vaultWithMd, "note2.md"), "# Note 2");

  emptyDir = path.join(testDir, "empty");
  fs.mkdirSync(emptyDir, { recursive: true });
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe("Vault Service", () => {
  beforeEach(() => {
    disconnectVault();
  });

  describe("connectVault", () => {
    it("connects to a vault with .obsidian directory", () => {
      const result = connectVault(vaultWithObsidian);

      expect(result).toMatchObject({
        path: vaultWithObsidian,
        hasObsidianDir: true,
        markdownFileCount: 2,
        connectedAt: expect.any(String),
      });
    });

    it("connects to a directory with .md files only", () => {
      const result = connectVault(vaultWithMd);

      expect(result).toMatchObject({
        path: vaultWithMd,
        hasObsidianDir: false,
        markdownFileCount: 2,
        connectedAt: expect.any(String),
      });
    });

    it("throws for nonexistent directory", () => {
      expect(() => connectVault("/tmp/does-not-exist-xyz-999")).toThrow(
        "Directory does not exist",
      );
    });

    it("throws for empty directory with no vault indicators", () => {
      expect(() => connectVault(emptyDir)).toThrow(
        "Directory does not appear to be a vault",
      );
    });

    it("returns a valid ISO timestamp in connectedAt", () => {
      const result = connectVault(vaultWithObsidian);
      const parsed = new Date(result.connectedAt);
      expect(parsed.toISOString()).toBe(result.connectedAt);
    });
  });

  describe("getVaultStatus", () => {
    it("returns null when no vault is connected", () => {
      expect(getVaultStatus()).toBeNull();
    });

    it("returns connection info after connecting", () => {
      connectVault(vaultWithObsidian);
      const status = getVaultStatus();

      expect(status).toMatchObject({
        path: vaultWithObsidian,
        hasObsidianDir: true,
        markdownFileCount: 2,
      });
    });
  });

  describe("disconnectVault", () => {
    it("clears the connected vault", () => {
      connectVault(vaultWithObsidian);
      expect(getVaultStatus()).not.toBeNull();

      disconnectVault();
      expect(getVaultStatus()).toBeNull();
    });
  });
});
