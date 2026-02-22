import type { DiffLine } from "../../types/diff";

interface Props {
  line: DiffLine;
  /** Highlight.js language string */
  language?: string;
  viewMode: "unified" | "split";
  side?: "left" | "right"; // for split view
}

function LineNumber({ num }: { num?: number }) {
  return (
    <td className="diff-line-number" data-line-number={num ?? ""}>
      {num ?? ""}
    </td>
  );
}

/**
 * Render a single diff line in unified view.
 */
export function DiffLineUnified({ line }: { line: DiffLine }) {
  const typeClass = {
    added: "diff-line-added",
    removed: "diff-line-removed",
    context: "diff-line-context",
    no_newline: "diff-line-nonewline",
  }[line.type];

  const marker = {
    added: "+",
    removed: "-",
    context: " ",
    no_newline: "\\",
  }[line.type];

  return (
    <tr className={`diff-line ${typeClass}`}>
      <LineNumber num={line.oldLineNumber} />
      <LineNumber num={line.newLineNumber} />
      <td className="diff-line-marker">{marker}</td>
      <td className="diff-line-content">
        <span>{line.content}</span>
      </td>
    </tr>
  );
}

/**
 * Render a single diff line for the left side of split view.
 */
export function DiffLineSplitLeft({ line }: { line: DiffLine }) {
  if (line.type === "added") {
    // Empty cell on left side for added lines
    return (
      <tr className="diff-line diff-line-empty">
        <td className="diff-line-number"></td>
        <td className="diff-line-marker"></td>
        <td className="diff-line-content"></td>
      </tr>
    );
  }
  const typeClass =
    line.type === "removed"
      ? "diff-line-removed"
      : line.type === "no_newline"
        ? "diff-line-nonewline"
        : "diff-line-context";
  const marker = line.type === "removed" ? "-" : line.type === "no_newline" ? "\\" : " ";
  return (
    <tr className={`diff-line ${typeClass}`}>
      <LineNumber num={line.oldLineNumber} />
      <td className="diff-line-marker">{marker}</td>
      <td className="diff-line-content">
        <span>{line.content}</span>
      </td>
    </tr>
  );
}

/**
 * Render a single diff line for the right side of split view.
 */
export function DiffLineSplitRight({ line }: { line: DiffLine }) {
  if (line.type === "removed") {
    // Empty cell on right side for removed lines
    return (
      <tr className="diff-line diff-line-empty">
        <td className="diff-line-number"></td>
        <td className="diff-line-marker"></td>
        <td className="diff-line-content"></td>
      </tr>
    );
  }
  const typeClass =
    line.type === "added"
      ? "diff-line-added"
      : line.type === "no_newline"
        ? "diff-line-nonewline"
        : "diff-line-context";
  const marker = line.type === "added" ? "+" : line.type === "no_newline" ? "\\" : " ";
  return (
    <tr className={`diff-line ${typeClass}`}>
      <LineNumber num={line.newLineNumber} />
      <td className="diff-line-marker">{marker}</td>
      <td className="diff-line-content">
        <span>{line.content}</span>
      </td>
    </tr>
  );
}

export default function DiffLineView({ line, viewMode, side }: Props) {
  if (viewMode === "split") {
    return side === "left" ? (
      <DiffLineSplitLeft line={line} />
    ) : (
      <DiffLineSplitRight line={line} />
    );
  }
  return <DiffLineUnified line={line} />;
}
