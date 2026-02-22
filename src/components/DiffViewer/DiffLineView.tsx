import type { DiffLine } from "../../types/diff";
import { highlightLine } from "../../utils/highlight";

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

interface LineContentProps {
  content: string;
  language?: string;
  /** Pre-computed HTML for inline word-diff (overrides syntax highlight) */
  inlineDiffHtml?: string;
}

function LineContent({ content, language, inlineDiffHtml }: LineContentProps) {
  const html = inlineDiffHtml ?? highlightLine(content, language);
  return (
    <td
      className="diff-line-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Render a single diff line in unified view.
 */
export function DiffLineUnified({
  line,
  language,
  inlineDiffHtml,
}: {
  line: DiffLine;
  language?: string;
  inlineDiffHtml?: string;
}) {
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
      <LineContent
        content={line.content}
        language={line.type !== "no_newline" ? language : undefined}
        inlineDiffHtml={inlineDiffHtml}
      />
    </tr>
  );
}

/**
 * Render a single diff line for the left side of split view.
 */
export function DiffLineSplitLeft({
  line,
  language,
}: {
  line: DiffLine;
  language?: string;
}) {
  if (line.type === "added") {
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
      <LineContent
        content={line.content}
        language={line.type !== "no_newline" ? language : undefined}
      />
    </tr>
  );
}

/**
 * Render a single diff line for the right side of split view.
 */
export function DiffLineSplitRight({
  line,
  language,
}: {
  line: DiffLine;
  language?: string;
}) {
  if (line.type === "removed") {
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
      <LineContent
        content={line.content}
        language={line.type !== "no_newline" ? language : undefined}
      />
    </tr>
  );
}

export default function DiffLineView({ line, language, viewMode, side }: Props) {
  if (viewMode === "split") {
    return side === "left" ? (
      <DiffLineSplitLeft line={line} language={language} />
    ) : (
      <DiffLineSplitRight line={line} language={language} />
    );
  }
  return <DiffLineUnified line={line} language={language} />;
}
