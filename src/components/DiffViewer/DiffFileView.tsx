import { useState } from "react";
import type { DiffFile } from "../../types/diff";
import DiffHunkView from "./DiffHunkView";

interface Props {
  file: DiffFile;
  viewMode: "unified" | "split";
}

/**
 * Format the file path display for the header.
 * For renames: "old/path → new/path"
 * Otherwise: "new/path"
 */
function formatFilePath(file: DiffFile): string {
  if (file.status === "renamed" && file.oldPath !== file.newPath) {
    return `${file.oldPath} → ${file.newPath}`;
  }
  return file.newPath || file.oldPath;
}

/**
 * Render the GitHub-style additions/deletions stats bar.
 * e.g. "+3 -1" with a 5-segment colored bar.
 */
function StatsBar({ additions, deletions }: { additions: number; deletions: number }) {
  const total = additions + deletions;
  if (total === 0) return null;

  const addedBlocks = Math.round((additions / total) * 5);
  const removedBlocks = 5 - addedBlocks;

  return (
    <div className="diff-file-stats">
      <span className="diff-stats-additions">+{additions}</span>
      <span className="diff-stats-deletions">-{deletions}</span>
      <div className="diff-stats-bar">
        {Array.from({ length: addedBlocks }).map((_, i) => (
          <span key={`a${i}`} className="diff-stats-block diff-stats-block-added" />
        ))}
        {Array.from({ length: removedBlocks }).map((_, i) => (
          <span key={`r${i}`} className="diff-stats-block diff-stats-block-removed" />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DiffFile["status"] }) {
  const labels: Record<DiffFile["status"], { text: string; cls: string }> = {
    added: { text: "ADDED", cls: "badge-added" },
    deleted: { text: "DELETED", cls: "badge-deleted" },
    modified: { text: "", cls: "" },
    renamed: { text: "RENAMED", cls: "badge-renamed" },
    copied: { text: "COPIED", cls: "badge-renamed" },
    binary: { text: "BINARY", cls: "badge-binary" },
  };
  const { text, cls } = labels[status];
  if (!text) return null;
  return <span className={`diff-file-badge ${cls}`}>{text}</span>;
}

export default function DiffFileView({ file, viewMode }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const isBinary = file.status === "binary";
  const isEmpty = !isBinary && file.hunks.length === 0;

  return (
    <div className="diff-file" data-status={file.status}>
      {/* File header */}
      <div className="diff-file-header">
        <button
          className="diff-file-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`diff-collapse-icon ${collapsed ? "collapsed" : ""}`}
          >
            <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
          </svg>
        </button>
        <span className="diff-file-path">{formatFilePath(file)}</span>
        <StatusBadge status={file.status} />
        <div className="diff-file-header-spacer" />
        <StatsBar additions={file.additions} deletions={file.deletions} />
      </div>

      {/* Diff table */}
      {!collapsed && (
        <div className="diff-file-body">
          {isBinary ? (
            <div className="diff-binary-notice">Binary file changed</div>
          ) : isEmpty ? (
            <div className="diff-empty-notice">No visible changes</div>
          ) : viewMode === "unified" ? (
            <table className="diff-table diff-unified">
              <colgroup>
                <col className="diff-col-line-num" />
                <col className="diff-col-line-num" />
                <col className="diff-col-marker" />
                <col className="diff-col-content" />
              </colgroup>
              <tbody>
                {file.hunks.map((hunk, i) => (
                  <DiffHunkView
                    key={i}
                    hunk={hunk}
                    language={file.language}
                    viewMode="unified"
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <table className="diff-table diff-split">
              <tbody>
                {file.hunks.map((hunk, i) => (
                  <DiffHunkView
                    key={i}
                    hunk={hunk}
                    language={file.language}
                    viewMode="split"
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
