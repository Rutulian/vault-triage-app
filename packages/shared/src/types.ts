/** Request body for POST /api/vault/connect */
export interface VaultConnectRequest {
  path: string;
}

/** Response from POST /api/vault/connect and GET /api/vault/status */
export interface VaultConnectionInfo {
  path: string;
  hasObsidianDir: boolean;
  markdownFileCount: number;
  connectedAt: string;
}

/** Status of the connected vault (after scanning) */
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
