#!/usr/bin/env bash
# Run comp with the sample patch to verify the UI.
# Usage:
#   ./test/run-sample.sh              # dev server (hot reload)
#   ./test/run-sample.sh --release    # built binary

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
PATCH="$SCRIPT_DIR/sample.patch"

if [[ "${1:-}" == "--release" ]]; then
  BIN="$REPO_DIR/src-tauri/target/release/comp"
  if [[ ! -x "$BIN" ]]; then
    echo "Binary not found. Run 'make build' first." >&2
    exit 1
  fi
  cat "$PATCH" | "$BIN"
else
  # Pipe through COMP_DIFF_PATH so tauri dev picks it up.
  # The dev server must be running separately: pnpm tauri dev
  export COMP_DIFF_PATH
  COMP_DIFF_PATH="$(mktemp /tmp/comp-sample.XXXXXX.patch)"
  cp "$PATCH" "$COMP_DIFF_PATH"
  echo "Sample diff written to: $COMP_DIFF_PATH"
  echo "Open the dev server window and it will load this diff."
fi
