import type { ThemeName } from "../../types/diff";
import { useTheme } from "../../context/ThemeContext";

function ThemeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 1.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    </svg>
  );
}

function UnifiedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5Zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 6.5Zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5Z" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5Zm8 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Zm-8 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4A.5.5 0 0 1 2 6.5Zm8 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Zm-8 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5Zm8 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM7.5 1v14h1V1h-1Z" />
    </svg>
  );
}

interface Props {
  fileCount: number;
}

export default function Toolbar({ fileCount }: Props) {
  const { theme, setTheme, viewMode, setViewMode } = useTheme();

  const isGitHub = theme.startsWith("github");

  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
          </svg>
        </span>
        <span className="toolbar-title">comp</span>
        {fileCount > 0 && (
          <span className="toolbar-file-count">
            {fileCount} file{fileCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="toolbar-center">
        {/* UI Brand indicator */}
        <span
          className={`toolbar-brand ${isGitHub ? "brand-github" : "brand-gitlab"}`}
        >
          {isGitHub ? "GitHub UI" : "GitLab UI"}
        </span>
      </div>

      <div className="toolbar-right">
        {/* View mode toggle */}
        <div
          className="toolbar-view-toggle"
          role="group"
          aria-label="View mode"
        >
          <button
            className={`toolbar-btn ${viewMode === "unified" ? "active" : ""}`}
            onClick={() => setViewMode("unified")}
            title="Unified diff view"
            aria-pressed={viewMode === "unified"}
          >
            <UnifiedIcon />
            <span>Unified</span>
          </button>
          <button
            className={`toolbar-btn ${viewMode === "split" ? "active" : ""}`}
            onClick={() => setViewMode("split")}
            title="Split diff view"
            aria-pressed={viewMode === "split"}
          >
            <SplitIcon />
            <span>Split</span>
          </button>
        </div>

        {/* Theme selector */}
        <div className="toolbar-theme-selector">
          <ThemeIcon />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeName)}
            className="toolbar-theme-select"
            aria-label="Select theme"
          >
            <optgroup label="GitHub">
              <option value="github-light">GitHub Light</option>
              <option value="github-dark">GitHub Dark</option>
            </optgroup>
            <optgroup label="GitLab">
              <option value="gitlab-light">GitLab Light</option>
              <option value="gitlab-dark">GitLab Dark</option>
            </optgroup>
          </select>
        </div>
      </div>
    </header>
  );
}
