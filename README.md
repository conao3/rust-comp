# comp — Local Diff Viewer

A fast, local diff viewer with **GitHub-identical UI** and GitLab theme support.
Built with [Tauri v2](https://tauri.app/) (Rust backend) and React + TypeScript frontend.

```
git diff | comp
```

## Features

- 🎨 **GitHub-identical diff display** — exact colors, line numbers, hunk headers
- 🦊 **GitLab UI theme** — switch to GitLab Pajamas design with one click
- 🌗 **Dark mode** — GitHub Dark and GitLab Dark themes
- 📐 **Unified & Split view** — toggle between unified and side-by-side diff
- 📁 **File tree sidebar** — quick navigation across changed files
- ⚡ **Fast** — diff parsed in Rust, rendered in React

## Usage

```bash
# Pipe git diff output
git diff | comp
git diff HEAD~1 | comp
git diff main...feature | comp

# Pass a patch file
comp path/to/changes.patch

# Forward args to git diff (runs in current directory)
comp HEAD~1
comp HEAD~1 -- src/
comp HEAD~3 HEAD~1

# Show current working tree diff
comp
```

## Theme Switching

Use the theme selector in the toolbar (top right) to switch between:

| Theme        | Style                     |
| ------------ | ------------------------- |
| GitHub Light | GitHub default light mode |
| GitHub Dark  | GitHub dark mode          |
| GitLab Light | GitLab Pajamas light      |
| GitLab Dark  | GitLab Pajamas dark       |

Theme preference is saved in `localStorage` and restored on next launch.

## Installation

### Prerequisites

- [Rust](https://rustup.rs/) (1.70+)
- [Node.js](https://nodejs.org/) (18+) with pnpm
- Linux: `webkit2gtk`, `gtk3`, `libsoup` (see [Tauri prerequisites](https://tauri.app/start/prerequisites/))

### Build from Source

```bash
git clone https://github.com/conao3/rust-comp
cd rust-comp

# Install frontend dependencies
pnpm install

# Build (release)
pnpm tauri build

# The binary is at: src-tauri/target/release/comp
```

### Quick Install

```bash
# After building, install to ~/.local/bin
make install

# Or manually
cp src-tauri/target/release/comp ~/.local/bin/comp
```

### NixOS / Nix

```nix
# In your nix shell / configuration:
# (package derivation coming soon)
nix-shell -p webkitgtk_4_1 pkg-config
pnpm tauri build
```

## Development

```bash
# Start dev server (hot reload)
pnpm tauri dev

# TypeScript type check
pnpm tsc --noEmit

# Rust tests
cd src-tauri && cargo test
```

## Architecture

```
rust-comp/
├── src/                      # React + TypeScript frontend
│   ├── components/
│   │   ├── DiffViewer/       # Main diff rendering
│   │   ├── FileTree/         # Left sidebar file list
│   │   └── Toolbar/          # Top bar: theme selector, view toggle
│   ├── context/
│   │   └── ThemeContext.tsx  # Theme + view mode React context
│   ├── hooks/
│   │   └── useDiff.ts        # Diff loading hook (Tauri IPC)
│   ├── themes/               # CSS custom property themes
│   │   ├── github-light.css
│   │   ├── github-dark.css
│   │   ├── gitlab-light.css
│   │   └── gitlab-dark.css
│   ├── types/diff.ts         # TypeScript types (mirrors Rust structs)
│   └── utils/diffParser.ts   # Client-side diff parser (fallback)
└── src-tauri/                # Rust backend
    └── src/
        ├── main.rs           # CLI entry: stdin/file/git diff → Tauri window
        ├── lib.rs            # Tauri commands registration
        └── diff.rs           # Unified diff parser + git diff runner
```

### How It Works

1. `comp` binary reads diff from stdin, file arg, or runs `git diff`
2. Diff text is written to a temp file (`$COMP_DIFF_PATH`)
3. Tauri window opens; React calls `cmd_get_initial_diff` via Tauri IPC
4. Rust parses the diff into `Vec<DiffFile>` (structured JSON)
5. React renders the structured data with GitHub-identical CSS

## License

MIT
