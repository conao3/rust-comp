import type { DiffHunk, DiffLine } from "../../types/diff";
import { DiffLineUnified, DiffLineSplitLeft, DiffLineSplitRight } from "./DiffLineView";

interface Props {
  hunk: DiffHunk;
  language?: string;
  viewMode: "unified" | "split";
}

/**
 * Parse the hunk header to extract the trailing function/context name.
 * e.g. "@@ -1,5 +1,7 @@ function foo()" → "function foo()"
 */
function parseHunkContext(header: string): string {
  const match = header.match(/@@ [^@]* @@\s*(.*)/);
  return match?.[1]?.trim() ?? "";
}

export default function DiffHunkView({ hunk, viewMode }: Props) {
  const context = parseHunkContext(hunk.header);

  if (viewMode === "unified") {
    return (
      <>
        {/* Hunk header row */}
        <tr className="diff-hunk-header">
          <td className="diff-line-number diff-hunk-expand" colSpan={2}></td>
          <td className="diff-line-marker diff-hunk-at">@@</td>
          <td className="diff-hunk-header-content">
            <span className="diff-hunk-ranges">
              {` -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} `}
            </span>
            {context && <span className="diff-hunk-context">{context}</span>}
          </td>
        </tr>
        {/* Diff lines */}
        {hunk.lines.map((line, i) => (
          <DiffLineUnified key={i} line={line} />
        ))}
      </>
    );
  }

  // Split view: pair up added/removed lines side-by-side
  const pairs = buildSplitPairs(hunk.lines);

  return (
    <>
      <tr className="diff-hunk-header">
        <td className="diff-line-number diff-hunk-at" colSpan={2}>@@</td>
        <td className="diff-hunk-header-content">
          <span className="diff-hunk-ranges">
            {` -${hunk.oldStart},${hunk.oldCount} `}
          </span>
          {context && <span className="diff-hunk-context">{context}</span>}
        </td>
        <td className="diff-hunk-divider"></td>
        <td className="diff-line-number diff-hunk-at" colSpan={2}>@@</td>
        <td className="diff-hunk-header-content">
          <span className="diff-hunk-ranges">
            {` +${hunk.newStart},${hunk.newCount} `}
          </span>
        </td>
      </tr>
      {pairs.map(([left, right], i) => (
        <tr key={i} className="diff-split-row">
          {/* Left side (old/removed) */}
          <td
            className={`diff-split-cell diff-split-left ${left ? (left.type === "removed" ? "diff-line-removed" : left.type === "context" ? "diff-line-context" : "diff-line-empty") : "diff-line-empty"}`}
          >
            <table className="diff-split-inner">
              <tbody>
                {left ? (
                  <DiffLineSplitLeft line={left} />
                ) : (
                  <tr className="diff-line diff-line-empty">
                    <td className="diff-line-number"></td>
                    <td className="diff-line-marker"></td>
                    <td className="diff-line-content"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
          {/* Right side (new/added) */}
          <td
            className={`diff-split-cell diff-split-right ${right ? (right.type === "added" ? "diff-line-added" : right.type === "context" ? "diff-line-context" : "diff-line-empty") : "diff-line-empty"}`}
          >
            <table className="diff-split-inner">
              <tbody>
                {right ? (
                  <DiffLineSplitRight line={right} />
                ) : (
                  <tr className="diff-line diff-line-empty">
                    <td className="diff-line-number"></td>
                    <td className="diff-line-marker"></td>
                    <td className="diff-line-content"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Build side-by-side pairs for split view.
 * Pairs removed lines with the following added lines.
 * Context lines appear on both sides.
 */
function buildSplitPairs(
  lines: DiffLine[]
): [DiffLine | null, DiffLine | null][] {
  const pairs: [DiffLine | null, DiffLine | null][] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.type === "context" || line.type === "no_newline") {
      pairs.push([line, line]);
      i++;
    } else if (line.type === "removed") {
      // Look ahead for paired added line
      const next = lines[i + 1];
      if (next?.type === "added") {
        pairs.push([line, next]);
        i += 2;
      } else {
        pairs.push([line, null]);
        i++;
      }
    } else if (line.type === "added") {
      pairs.push([null, line]);
      i++;
    } else {
      i++;
    }
  }
  return pairs;
}
