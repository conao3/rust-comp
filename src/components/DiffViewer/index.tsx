import type { DiffFile } from "../../types/diff";
import { useTheme } from "../../context/ThemeContext";
import DiffFileView from "./DiffFileView";

interface Props {
  files: DiffFile[];
  loading: boolean;
  error: string | null;
}

export default function DiffViewer({ files, loading, error }: Props) {
  const { viewMode } = useTheme();

  if (loading) {
    return (
      <div className="diff-loading">
        <div className="diff-loading-spinner" />
        <span>Loading diff…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diff-error">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="diff-empty">
        <div className="diff-empty-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75M12 6.75v.008"
            />
          </svg>
        </div>
        <p className="diff-empty-title">No changes to display</p>
        <p className="diff-empty-subtitle">
          Pipe a diff into comp or run it in a git repository directory.
        </p>
        <code className="diff-empty-example">git diff | comp</code>
      </div>
    );
  }

  return (
    <div className="diff-viewer">
      {files.map((file, i) => (
        <DiffFileView
          key={`${file.newPath}-${i}`}
          file={file}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
