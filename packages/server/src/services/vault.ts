import fs from "node:fs";
import path from "node:path";
import type { VaultConnectionInfo } from "@vault-triage/shared";

let currentVault: VaultConnectionInfo | null = null;

/** Count .md files recursively (top-level only for performance) */
function countMarkdownFiles(dirPath: string): number {
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isFile() && entry.name.endsWith(".md")) {
      count++;
    } else if (entry.isDirectory()) {
      count += countMarkdownFiles(path.join(dirPath, entry.name));
    }
  }
  return count;
}

/** Connect to a vault directory. Throws on invalid path. */
export function connectVault(vaultPath: string): VaultConnectionInfo {
  const resolved = path.resolve(vaultPath);

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`Directory does not exist: ${resolved}`);
  }

  const hasObsidianDir = fs.existsSync(path.join(resolved, ".obsidian"));
  const markdownFileCount = countMarkdownFiles(resolved);

  if (!hasObsidianDir && markdownFileCount === 0) {
    throw new Error(
      "Directory does not appear to be a vault: no .obsidian directory and no .md files found",
    );
  }

  currentVault = {
    path: resolved,
    hasObsidianDir,
    markdownFileCount,
    connectedAt: new Date().toISOString(),
  };

  return currentVault;
}

/** Get the currently connected vault info, or null. */
export function getVaultStatus(): VaultConnectionInfo | null {
  return currentVault;
}

/** Disconnect the current vault. */
export function disconnectVault(): void {
  currentVault = null;
}
