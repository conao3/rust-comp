/**
 * Inline (word-level) diff utilities.
 * For pairs of removed/added lines, computes which tokens changed
 * and marks them with highlight spans — similar to GitHub's inline diff.
 */

export interface InlineSegment {
  text: string;
  /** true if this segment was changed (highlighted) */
  changed: boolean;
}

/**
 * Tokenize a line into words and symbols for word-level diffing.
 */
function tokenize(line: string): string[] {
  // Split on word boundaries while keeping delimiters
  return line.split(/(\s+|[^a-zA-Z0-9_])/g).filter((t) => t.length > 0);
}

/**
 * Compute the edit distance table (Myers-like LCS approach).
 * Returns an array of edit operations: 'eq' | 'del' | 'ins'.
 */
function lcs(a: string[], b: string[]): ("eq" | "del" | "ins")[] {
  const m = a.length;
  const n = b.length;

  // Build DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to build edit ops
  const ops: ("eq" | "del" | "ins")[] = [];
  let i = 0;
  let j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && a[i] === b[j]) {
      ops.push("eq");
      i++;
      j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      ops.push("ins");
      j++;
    } else {
      ops.push("del");
      i++;
    }
  }
  return ops;
}

/**
 * Compute inline diff segments for a removed line.
 * Returns segments where `changed=true` marks tokens that were deleted.
 */
export function inlineDiffRemoved(
  removedLine: string,
  addedLine: string
): InlineSegment[] {
  const tokA = tokenize(removedLine);
  const tokB = tokenize(addedLine);

  // Skip expensive diff for very long lines (performance guard)
  if (tokA.length + tokB.length > 500) {
    return [{ text: removedLine, changed: false }];
  }

  const ops = lcs(tokA, tokB);
  const segments: InlineSegment[] = [];
  let iA = 0;
  let iB = 0;

  for (const op of ops) {
    if (op === "eq") {
      segments.push({ text: tokA[iA], changed: false });
      iA++;
      iB++;
    } else if (op === "del") {
      segments.push({ text: tokA[iA], changed: true });
      iA++;
    } else {
      // ins: skip (we're on the removed side)
      iB++;
    }
  }

  return mergeSegments(segments);
}

/**
 * Compute inline diff segments for an added line.
 * Returns segments where `changed=true` marks tokens that were inserted.
 */
export function inlineDiffAdded(
  removedLine: string,
  addedLine: string
): InlineSegment[] {
  const tokA = tokenize(removedLine);
  const tokB = tokenize(addedLine);

  if (tokA.length + tokB.length > 500) {
    return [{ text: addedLine, changed: false }];
  }

  const ops = lcs(tokA, tokB);
  const segments: InlineSegment[] = [];
  let iA = 0;
  let iB = 0;

  for (const op of ops) {
    if (op === "eq") {
      segments.push({ text: tokB[iB], changed: false });
      iA++;
      iB++;
    } else if (op === "del") {
      // del: skip (we're on the added side)
      iA++;
    } else {
      segments.push({ text: tokB[iB], changed: true });
      iB++;
    }
  }

  return mergeSegments(segments);
}

/**
 * Merge consecutive segments with the same `changed` value.
 */
function mergeSegments(segs: InlineSegment[]): InlineSegment[] {
  if (segs.length === 0) return segs;
  const result: InlineSegment[] = [segs[0]];
  for (let i = 1; i < segs.length; i++) {
    const last = result[result.length - 1];
    if (last.changed === segs[i].changed) {
      last.text += segs[i].text;
    } else {
      result.push({ ...segs[i] });
    }
  }
  return result;
}

/**
 * Escape HTML special characters in plain text.
 */
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Render inline diff segments as HTML string.
 * Changed segments are wrapped in <span class="inline-diff-word">
 */
export function renderInlineDiffHtml(
  segments: InlineSegment[],
  changedClass: string
): string {
  return segments
    .map((seg) =>
      seg.changed
        ? `<span class="${changedClass}">${escHtml(seg.text)}</span>`
        : escHtml(seg.text)
    )
    .join("");
}
