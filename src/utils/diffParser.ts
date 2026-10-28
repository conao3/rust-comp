/**
 * Client-side unified diff parser.
 * Used as a fallback when the Rust backend is unavailable (e.g., browser dev mode).
 * The primary parser runs in Rust via `cmd_parse_diff`.
 */

import type { DiffFile, DiffHunk, FileStatus } from "../types/diff";

function detectLanguage(path: string): string | undefined {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    rs: "rust",
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    go: "go",
    java: "java",
    c: "c",
    h: "c",
    cpp: "cpp",
    cc: "cpp",
    cs: "csharp",
    swift: "swift",
    kt: "kotlin",
    sh: "bash",
    bash: "bash",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    md: "markdown",
    html: "html",
    css: "css",
    scss: "scss",
    xml: "xml",
    sql: "sql",
    nix: "nix",
    vue: "vue",
    svelte: "svelte",
  };
  return ext ? map[ext] : undefined;
}

function parseHunkHeader(
  line: string,
): {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
} | null {
  const m = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
  if (!m) return null;
  return {
    oldStart: parseInt(m[1], 10),
    oldCount: m[2] !== undefined ? parseInt(m[2], 10) : 1,
    newStart: parseInt(m[3], 10),
    newCount: m[4] !== undefined ? parseInt(m[4], 10) : 1,
  };
}

export function parseDiffClient(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  let currentFile: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  const commitHunk = () => {
    if (currentHunk && currentFile) {
      const additions = currentHunk.lines.filter(
        (l) => l.type === "added",
      ).length;
      const deletions = currentHunk.lines.filter(
        (l) => l.type === "removed",
      ).length;
      currentFile.additions += additions;
      currentFile.deletions += deletions;
      currentFile.hunks.push(currentHunk);
      currentHunk = null;
    }
  };

  const commitFile = () => {
    commitHunk();
    if (currentFile) {
      files.push(currentFile);
      currentFile = null;
    }
  };

  for (const line of diffText.split("\n")) {
    if (line.startsWith("diff --git ")) {
      commitFile();
      const parts = line.split(" ");
      const oldPath = parts[2]?.replace(/^a\//, "") ?? "";
      const newPath = parts[3]?.replace(/^b\//, "") ?? oldPath;
      currentFile = {
        oldPath,
        newPath,
        status: "modified" as FileStatus,
        additions: 0,
        deletions: 0,
        hunks: [],
        language: detectLanguage(newPath) ?? detectLanguage(oldPath),
      };
      continue;
    }
    if (line.startsWith("new file mode")) {
      if (currentFile) currentFile.status = "added";
      continue;
    }
    if (line.startsWith("deleted file mode")) {
      if (currentFile) currentFile.status = "deleted";
      continue;
    }
    if (line.startsWith("rename from ")) {
      if (currentFile) {
        currentFile.status = "renamed";
        currentFile.oldPath = line.slice("rename from ".length);
      }
      continue;
    }
    if (line.startsWith("rename to ")) {
      if (currentFile) currentFile.newPath = line.slice("rename to ".length);
      continue;
    }
    if (line.startsWith("Binary files")) {
      if (currentFile) currentFile.status = "binary";
      continue;
    }
    if (line.startsWith("--- ")) {
      const path = line.slice(4).replace(/^a\//, "");
      if (path !== "/dev/null" && currentFile) currentFile.oldPath = path;
      continue;
    }
    if (line.startsWith("+++ ")) {
      const path = line.slice(4).replace(/^b\//, "");
      if (path !== "/dev/null" && currentFile) {
        currentFile.newPath = path;
        currentFile.language = detectLanguage(path) ?? currentFile.language;
      }
      continue;
    }
    if (line.startsWith("@@ ")) {
      commitHunk();
      const h = parseHunkHeader(line);
      if (h) {
        oldLine = h.oldStart;
        newLine = h.newStart;
        currentHunk = {
          header: line,
          oldStart: h.oldStart,
          oldCount: h.oldCount,
          newStart: h.newStart,
          newCount: h.newCount,
          lines: [],
        };
      }
      continue;
    }
    if (currentHunk) {
      if (line.startsWith("+")) {
        currentHunk.lines.push({
          type: "added",
          content: line.slice(1),
          newLineNumber: newLine++,
        });
      } else if (line.startsWith("-")) {
        currentHunk.lines.push({
          type: "removed",
          content: line.slice(1),
          oldLineNumber: oldLine++,
        });
      } else if (line === "\\ No newline at end of file") {
        currentHunk.lines.push({ type: "no_newline", content: line });
      } else {
        const content = line.startsWith(" ") ? line.slice(1) : line;
        currentHunk.lines.push({
          type: "context",
          content,
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
        });
      }
    }
  }
  commitFile();
  return files;
}
