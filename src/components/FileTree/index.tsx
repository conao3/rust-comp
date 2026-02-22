import type { DiffFile } from "../../types/diff";

interface Props {
  files: DiffFile[];
  onFileClick?: (file: DiffFile, index: number) => void;
}

function FileIcon({ status }: { status: DiffFile["status"] }) {
  const colors: Record<DiffFile["status"], string> = {
    added: "var(--color-diff-addition-fg)",
    deleted: "var(--color-diff-deletion-fg)",
    modified: "var(--color-fg-muted)",
    renamed: "var(--color-accent-fg)",
    copied: "var(--color-accent-fg)",
    binary: "var(--color-fg-muted)",
  };
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill={colors[status]}
      className="filetree-icon"
    >
      <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
    </svg>
  );
}

function StatusMarker({ status }: { status: DiffFile["status"] }) {
  const markers: Record<DiffFile["status"], { char: string; cls: string }> = {
    added: { char: "A", cls: "filetree-status-added" },
    deleted: { char: "D", cls: "filetree-status-deleted" },
    modified: { char: "M", cls: "filetree-status-modified" },
    renamed: { char: "R", cls: "filetree-status-renamed" },
    copied: { char: "C", cls: "filetree-status-renamed" },
    binary: { char: "B", cls: "filetree-status-modified" },
  };
  const { char, cls } = markers[status];
  return <span className={`filetree-status ${cls}`}>{char}</span>;
}

/**
 * Get display name: show filename only with directory as tooltip
 */
function getDisplayName(path: string): { name: string; dir: string } {
  const parts = path.split("/");
  const name = parts[parts.length - 1] ?? path;
  const dir = parts.slice(0, -1).join("/");
  return { name, dir };
}

export default function FileTree({ files, onFileClick }: Props) {
  if (files.length === 0) return null;

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  const scrollToFile = (index: number) => {
    const el = document.querySelectorAll(".diff-file")[index];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="filetree">
      <div className="filetree-header">
        <span className="filetree-title">Changed files</span>
        <span className="filetree-count">{files.length}</span>
      </div>
      <div className="filetree-summary">
        <span className="filetree-additions">+{totalAdditions}</span>
        <span className="filetree-deletions">-{totalDeletions}</span>
      </div>
      <ul className="filetree-list">
        {files.map((file, i) => {
          const { name, dir } = getDisplayName(file.newPath || file.oldPath);
          return (
            <li key={i} className="filetree-item">
              <button
                className="filetree-item-btn"
                onClick={() => {
                  scrollToFile(i);
                  onFileClick?.(file, i);
                }}
                title={file.newPath || file.oldPath}
              >
                <FileIcon status={file.status} />
                <span className="filetree-filename">{name}</span>
                {dir && <span className="filetree-dir">{dir}</span>}
                <StatusMarker status={file.status} />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
