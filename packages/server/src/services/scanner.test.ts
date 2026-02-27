import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { scanVault } from "./scanner.js";
import type { ScanResult } from "@vault-triage/shared";

let testDir: string;

beforeAll(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "scanner-test-"));

  // Create .obsidian directory (should be skipped)
  fs.mkdirSync(path.join(testDir, ".obsidian"), { recursive: true });
  fs.writeFileSync(path.join(testDir, ".obsidian", "app.json"), "{}");

  // Create .vault-triage directory (should be skipped)
  fs.mkdirSync(path.join(testDir, ".vault-triage"), { recursive: true });

  // Root-level markdown files
  fs.writeFileSync(
    path.join(testDir, "note1.md"),
    "---\ntags:\n  - journal\n  - daily\n---\n# Note One\n\nSome content here.",
  );
  fs.writeFileSync(path.join(testDir, "note2.md"), "# Note Two\n\nNo frontmatter.");
  fs.writeFileSync(path.join(testDir, "readme.txt"), "Not a markdown file");

  // Nested directory with files
  fs.mkdirSync(path.join(testDir, "subfolder"), { recursive: true });
  fs.writeFileSync(
    path.join(testDir, "subfolder", "deep-note.md"),
    "---\ntags: [project, active]\n---\n# Deep Note",
  );

  // Deeply nested
  fs.mkdirSync(path.join(testDir, "subfolder", "deeper"), { recursive: true });
  fs.writeFileSync(
    path.join(testDir, "subfolder", "deeper", "leaf.md"),
    "# Leaf\n\nDeep leaf note.",
  );

  // Another dot-directory (should be skipped)
  fs.mkdirSync(path.join(testDir, ".hidden"), { recursive: true });
  fs.writeFileSync(path.join(testDir, ".hidden", "secret.md"), "# Secret");

  // File with only frontmatter, no title heading
  fs.writeFileSync(
    path.join(testDir, "frontmatter-only.md"),
    "---\ntags:\n  - meta\ntitle: Custom Title\n---\nBody text without heading.",
  );

  // Empty markdown file
  fs.writeFileSync(path.join(testDir, "empty.md"), "");
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe("scanVault", () => {
  it("finds all .md files and skips non-markdown files", async () => {
    const result = await scanVault(testDir);

    const paths = result.notes.map((n) => n.path).sort();
    expect(paths).toEqual(
      [
        "empty.md",
        "frontmatter-only.md",
        "note1.md",
        "note2.md",
        "subfolder/deep-note.md",
        "subfolder/deeper/leaf.md",
      ].sort(),
    );
  });

  it("skips dot-directories (.obsidian, .vault-triage, .hidden)", async () => {
    const result = await scanVault(testDir);

    const paths = result.notes.map((n) => n.path);
    expect(paths).not.toContainEqual(expect.stringContaining(".obsidian"));
    expect(paths).not.toContainEqual(expect.stringContaining(".vault-triage"));
    expect(paths).not.toContainEqual(expect.stringContaining(".hidden"));
  });

  it("extracts title from first heading", async () => {
    const result = await scanVault(testDir);

    const note1 = result.notes.find((n) => n.path === "note1.md");
    expect(note1?.title).toBe("Note One");

    const note2 = result.notes.find((n) => n.path === "note2.md");
    expect(note2?.title).toBe("Note Two");
  });

  it("falls back to frontmatter title when no heading exists", async () => {
    const result = await scanVault(testDir);

    const fmOnly = result.notes.find((n) => n.path === "frontmatter-only.md");
    expect(fmOnly?.title).toBe("Custom Title");
  });

  it("falls back to filename when no heading or frontmatter title", async () => {
    const result = await scanVault(testDir);

    const empty = result.notes.find((n) => n.path === "empty.md");
    expect(empty?.title).toBe("empty");
  });

  it("extracts YAML frontmatter tags (list syntax)", async () => {
    const result = await scanVault(testDir);

    const note1 = result.notes.find((n) => n.path === "note1.md");
    expect(note1?.tags).toEqual(["journal", "daily"]);
  });

  it("extracts YAML frontmatter tags (inline array syntax)", async () => {
    const result = await scanVault(testDir);

    const deepNote = result.notes.find((n) => n.path === "subfolder/deep-note.md");
    expect(deepNote?.tags).toEqual(["project", "active"]);
  });

  it("returns empty tags array when no frontmatter", async () => {
    const result = await scanVault(testDir);

    const note2 = result.notes.find((n) => n.path === "note2.md");
    expect(note2?.tags).toEqual([]);
  });

  it("extracts file size and modified date", async () => {
    const result = await scanVault(testDir);

    const note1 = result.notes.find((n) => n.path === "note1.md");
    expect(note1?.size).toBeGreaterThan(0);
    expect(note1?.modifiedAt).toBeTruthy();
    // Verify ISO date format
    const modifiedAt = note1?.modifiedAt ?? "";
    expect(new Date(modifiedAt).toISOString()).toBe(modifiedAt);
  });

  it("returns correct ScanResult shape", async () => {
    const result = await scanVault(testDir);

    expect(result).toMatchObject({
      vaultPath: testDir,
      scannedAt: expect.any(String),
      notes: expect.any(Array),
      healthScore: expect.any(Number),
    } satisfies Record<keyof ScanResult, unknown>);

    // Verify scannedAt is valid ISO
    expect(new Date(result.scannedAt).toISOString()).toBe(result.scannedAt);
  });

  it("stores relative paths, not absolute", async () => {
    const result = await scanVault(testDir);

    for (const note of result.notes) {
      expect(path.isAbsolute(note.path)).toBe(false);
    }
  });

  it("writes scan-cache.json to .vault-triage directory", async () => {
    const result = await scanVault(testDir);

    const cachePath = path.join(testDir, ".vault-triage", "scan-cache.json");
    expect(fs.existsSync(cachePath)).toBe(true);

    const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8")) as ScanResult;
    expect(cached.vaultPath).toBe(result.vaultPath);
    expect(cached.notes.length).toBe(result.notes.length);
  });

  it("creates .vault-triage directory if it does not exist", async () => {
    const freshDir = fs.mkdtempSync(path.join(os.tmpdir(), "scanner-fresh-"));
    fs.writeFileSync(path.join(freshDir, "test.md"), "# Test");

    try {
      await scanVault(freshDir);

      const cacheDir = path.join(freshDir, ".vault-triage");
      expect(fs.existsSync(cacheDir)).toBe(true);
      expect(fs.existsSync(path.join(cacheDir, "scan-cache.json"))).toBe(true);
    } finally {
      fs.rmSync(freshDir, { recursive: true, force: true });
    }
  });

  it("initializes issues as empty array (issue detection is separate)", async () => {
    const result = await scanVault(testDir);

    for (const note of result.notes) {
      expect(note.issues).toEqual([]);
    }
  });
});

describe("scanVault performance", () => {
  let largeVaultDir: string;

  beforeAll(() => {
    largeVaultDir = fs.mkdtempSync(path.join(os.tmpdir(), "scanner-perf-"));
    // Create 100 markdown files across nested directories
    for (let i = 0; i < 100; i++) {
      const subdir = path.join(largeVaultDir, `folder-${Math.floor(i / 10)}`);
      fs.mkdirSync(subdir, { recursive: true });
      fs.writeFileSync(
        path.join(subdir, `note-${i}.md`),
        `---\ntags:\n  - tag${i % 5}\n---\n# Note ${i}\n\nContent for note ${i}.`,
      );
    }
  });

  afterAll(() => {
    fs.rmSync(largeVaultDir, { recursive: true, force: true });
  });

  it("scans 100-file vault in under 5 seconds", async () => {
    const start = performance.now();
    const result = await scanVault(largeVaultDir);
    const elapsed = performance.now() - start;

    expect(result.notes).toHaveLength(100);
    expect(elapsed).toBeLessThan(5000);
  });
});
