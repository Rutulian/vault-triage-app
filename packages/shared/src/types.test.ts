import { describe, it, expect } from "vitest";
import type { VaultStatus, NoteMetadata, TriageAction, ScanResult, NoteIssue } from "./index.js";

describe("shared types", () => {
  it("VaultStatus has required fields", () => {
    const status: VaultStatus = {
      path: "/test/vault",
      noteCount: 100,
      inboxCount: 10,
      orphanCount: 5,
      brokenLinkCount: 3,
      healthScore: 82,
    };
    expect(status.path).toBe("/test/vault");
    expect(status.noteCount).toBe(100);
    expect(status.healthScore).toBe(82);
  });

  it("NoteMetadata has required fields", () => {
    const note: NoteMetadata = {
      path: "inbox/test-note.md",
      title: "Test Note",
      size: 1024,
      modifiedAt: "2024-01-01T00:00:00Z",
      tags: ["test", "inbox"],
      issues: ["orphan", "no_tags"],
    };
    expect(note.path).toBe("inbox/test-note.md");
    expect(note.tags).toContain("test");
    expect(note.issues).toContain("orphan");
  });

  it("NoteIssue only allows valid issue types", () => {
    const issues: NoteIssue[] = ["orphan", "broken_links", "empty", "inbox", "no_tags"];
    expect(issues).toHaveLength(5);
  });

  it("TriageAction has required fields", () => {
    const action: TriageAction = {
      id: "action-1",
      noteId: "inbox/test-note.md",
      type: "move",
      params: { destination: "projects/" },
      timestamp: "2024-01-01T00:00:00Z",
      undone: false,
    };
    expect(action.type).toBe("move");
    expect(action.undone).toBe(false);
  });

  it("ScanResult has required fields", () => {
    const result: ScanResult = {
      vaultPath: "/test/vault",
      scannedAt: "2024-01-01T00:00:00Z",
      notes: [],
      healthScore: 100,
    };
    expect(result.notes).toHaveLength(0);
    expect(result.healthScore).toBe(100);
  });
});
