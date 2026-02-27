import fs from "node:fs";
import path from "node:path";
import type { NoteMetadata, ScanResult } from "@vault-triage/shared";

/** Parse YAML frontmatter from markdown content. Returns parsed key-value pairs. */
function parseFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) return {};

  const yaml = match[1];
  const result: Record<string, unknown> = {};

  for (const line of yaml.split("\n")) {
    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.+)$/);
    if (kvMatch?.[1] && kvMatch[2]) {
      const key = kvMatch[1];
      const rawValue = kvMatch[2].trim();

      // Inline array: [item1, item2]
      const arrayMatch = rawValue.match(/^\[(.*)\]$/);
      if (arrayMatch) {
        result[key] = arrayMatch[1]
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean) ?? [];
        continue;
      }

      result[key] = rawValue;
    }
  }

  // Handle YAML list syntax (indented with "  - value")
  const listPattern = /^(\w[\w-]*)\s*:\s*\n((?:\s+-\s+.+\n?)+)/gm;
  let listMatch: RegExpExecArray | null;
  while ((listMatch = listPattern.exec(yaml + "\n")) !== null) {
    const key = listMatch[1] ?? "";
    const items = (listMatch[2] ?? "")
      .split("\n")
      .map((line) => line.match(/^\s+-\s+(.+)/)?.[1]?.trim())
      .filter((v): v is string => v != null);
    result[key] = items;
  }

  return result;
}

/** Extract tags from parsed frontmatter. */
function extractTags(frontmatter: Record<string, unknown>): string[] {
  const tags = frontmatter["tags"];
  if (Array.isArray(tags)) {
    return tags.map(String);
  }
  return [];
}

/** Extract the title from markdown content and frontmatter. */
function extractTitle(
  content: string,
  frontmatter: Record<string, unknown>,
  filePath: string,
): string {
  // Try first # heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }

  // Fall back to frontmatter title
  if (typeof frontmatter["title"] === "string") {
    return frontmatter["title"];
  }

  // Fall back to filename without extension
  return path.basename(filePath, ".md");
}

/** Recursively walk a directory and collect .md file paths (relative to root). */
function walkMarkdownFiles(dirPath: string, rootPath: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.relative(rootPath, fullPath));
    } else if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath, rootPath));
    }
  }

  return files;
}

/** Index a single markdown file and return its metadata. */
function indexFile(relativePath: string, vaultPath: string): NoteMetadata {
  const fullPath = path.join(vaultPath, relativePath);
  const stat = fs.statSync(fullPath);
  const content = fs.readFileSync(fullPath, "utf-8");
  const frontmatter = parseFrontmatter(content);

  return {
    path: relativePath,
    title: extractTitle(content, frontmatter, relativePath),
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    tags: extractTags(frontmatter),
    issues: [],
  };
}

/** Scan a vault directory, index all .md files, and write the cache. */
export async function scanVault(vaultPath: string): Promise<ScanResult> {
  const resolved = path.resolve(vaultPath);
  const mdFiles = walkMarkdownFiles(resolved, resolved);
  const notes = mdFiles.map((relativePath) => indexFile(relativePath, resolved));

  const result: ScanResult = {
    vaultPath: resolved,
    scannedAt: new Date().toISOString(),
    notes,
    healthScore: 100,
  };

  // Ensure .vault-triage directory exists and write cache
  const triageDir = path.join(resolved, ".vault-triage");
  fs.mkdirSync(triageDir, { recursive: true });
  fs.writeFileSync(path.join(triageDir, "scan-cache.json"), JSON.stringify(result, null, 2));

  return result;
}
