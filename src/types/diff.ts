/**
 * Diff data types shared between Rust backend and React frontend.
 * These types mirror the Rust structs in src-tauri/src/diff.rs.
 */

export type DiffLineType = "context" | "added" | "removed" | "no_newline";

export interface DiffLine {
  type: DiffLineType;
  /** Raw content of the line (without the leading +/-/space) */
  content: string;
  /** Line number in the old file (undefined for added lines) */
  oldLineNumber?: number;
  /** Line number in the new file (undefined for removed lines) */
  newLineNumber?: number;
}

export interface DiffHunk {
  /** Full hunk header e.g. "@@ -1,5 +1,7 @@ function foo()" */
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export type FileStatus =
  | "added"
  | "deleted"
  | "modified"
  | "renamed"
  | "copied"
  | "binary";

export interface DiffFile {
  /** Original file path (before the change) */
  oldPath: string;
  /** New file path (after the change) */
  newPath: string;
  status: FileStatus;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  /** Programming language detected from file extension */
  language?: string;
  /** Whether the diff is collapsed in the UI */
  collapsed?: boolean;
}

export type ThemeName = "github-light" | "github-dark" | "gitlab-light" | "gitlab-dark";

export type ViewMode = "unified" | "split";

export interface AppState {
  files: DiffFile[];
  theme: ThemeName;
  viewMode: ViewMode;
  diffText: string;
}
