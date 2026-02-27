/** Status of the connected vault */
export interface VaultStatus {
  path: string;
  noteCount: number;
  inboxCount: number;
  orphanCount: number;
  brokenLinkCount: number;
  healthScore: number;
}

/** Metadata for a single note */
export interface NoteMetadata {
  path: string;
  title: string;
  size: number;
  modifiedAt: string;
  tags: string[];
  issues: NoteIssue[];
}

export type NoteIssue = "orphan" | "broken_links" | "empty" | "inbox" | "no_tags";

/** Result of a vault scan */
export interface ScanResult {
  vaultPath: string;
  scannedAt: string;
  notes: NoteMetadata[];
  healthScore: number;
}

/** An action applied during triage */
export interface TriageAction {
  id: string;
  noteId: string;
  type: "move" | "rename" | "tag" | "delete" | "archive";
  params: Record<string, unknown>;
  timestamp: string;
  undone: boolean;
}
