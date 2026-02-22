//! Unified diff parser for rust-comp.
//!
//! Parses standard unified diff format (as produced by `git diff`) into
//! a structured representation that can be serialized and sent to the
//! React frontend via Tauri commands.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DiffLineType {
    Context,
    Added,
    Removed,
    NoNewline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffLine {
    #[serde(rename = "type")]
    pub line_type: DiffLineType,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub old_line_number: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub new_line_number: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffHunk {
    pub header: String,
    pub old_start: u32,
    pub old_count: u32,
    pub new_start: u32,
    pub new_count: u32,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FileStatus {
    Added,
    Deleted,
    Modified,
    Renamed,
    Copied,
    Binary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiffFile {
    pub old_path: String,
    pub new_path: String,
    pub status: FileStatus,
    pub additions: u32,
    pub deletions: u32,
    pub hunks: Vec<DiffHunk>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
}

/// Detect programming language from file extension.
pub fn detect_language(path: &str) -> Option<String> {
    let ext = std::path::Path::new(path)
        .extension()
        .and_then(|e| e.to_str())?;
    let lang = match ext.to_lowercase().as_str() {
        "rs" => "rust",
        "ts" | "tsx" => "typescript",
        "js" | "jsx" => "javascript",
        "py" => "python",
        "rb" => "ruby",
        "go" => "go",
        "java" => "java",
        "c" | "h" => "c",
        "cpp" | "cc" | "cxx" | "hpp" => "cpp",
        "cs" => "csharp",
        "swift" => "swift",
        "kt" => "kotlin",
        "sh" | "bash" | "zsh" => "bash",
        "json" => "json",
        "yaml" | "yml" => "yaml",
        "toml" => "toml",
        "md" => "markdown",
        "html" | "htm" => "html",
        "css" => "css",
        "scss" | "sass" => "scss",
        "xml" => "xml",
        "sql" => "sql",
        "dockerfile" => "dockerfile",
        "nix" => "nix",
        "ex" | "exs" => "elixir",
        "erl" => "erlang",
        "hs" => "haskell",
        "ml" | "mli" => "ocaml",
        "lua" => "lua",
        "php" => "php",
        "r" => "r",
        "dart" => "dart",
        "vue" => "vue",
        "svelte" => "svelte",
        _ => return None,
    };
    Some(lang.to_string())
}

/// Parse a unified diff hunk header like `@@ -1,5 +1,7 @@ context`.
fn parse_hunk_header(header: &str) -> Option<(u32, u32, u32, u32)> {
    // Format: @@ -old_start[,old_count] +new_start[,new_count] @@
    let inner = header.trim_start_matches('@').trim_end_matches('@').trim();
    let parts: Vec<&str> = inner.split_whitespace().collect();
    if parts.len() < 2 {
        return None;
    }
    let parse_range = |s: &str| -> Option<(u32, u32)> {
        let s = s.trim_start_matches(['-', '+']);
        if let Some((start, count)) = s.split_once(',') {
            Some((start.parse().ok()?, count.parse().ok()?))
        } else {
            Some((s.parse().ok()?, 1))
        }
    };
    let (old_start, old_count) = parse_range(parts[0])?;
    let (new_start, new_count) = parse_range(parts[1])?;
    Some((old_start, old_count, new_start, new_count))
}

/// Parse unified diff text into structured `DiffFile` objects.
pub fn parse_diff(diff_text: &str) -> Vec<DiffFile> {
    let mut files: Vec<DiffFile> = Vec::new();
    let mut current_file: Option<DiffFile> = None;
    let mut current_hunk: Option<DiffHunk> = None;
    let mut old_line = 0u32;
    let mut new_line = 0u32;

    let commit_current_hunk = |file: &mut DiffFile, hunk: DiffHunk| {
        file.additions += hunk.lines.iter().filter(|l| l.line_type == DiffLineType::Added).count() as u32;
        file.deletions += hunk.lines.iter().filter(|l| l.line_type == DiffLineType::Removed).count() as u32;
        file.hunks.push(hunk);
    };

    for line in diff_text.lines() {
        // --- diff --git a/path b/path
        if line.starts_with("diff --git ") {
            // Commit previous hunk + file
            if let Some(hunk) = current_hunk.take() {
                if let Some(file) = current_file.as_mut() {
                    commit_current_hunk(file, hunk);
                }
            }
            if let Some(file) = current_file.take() {
                files.push(file);
            }
            // Extract paths from "diff --git a/foo b/foo"
            let parts: Vec<&str> = line.splitn(4, ' ').collect();
            let old_path = if parts.len() >= 3 {
                parts[2].trim_start_matches("a/").to_string()
            } else {
                String::new()
            };
            let new_path = if parts.len() >= 4 {
                parts[3].trim_start_matches("b/").to_string()
            } else {
                old_path.clone()
            };
            let language = detect_language(&new_path).or_else(|| detect_language(&old_path));
            current_file = Some(DiffFile {
                old_path,
                new_path,
                status: FileStatus::Modified,
                additions: 0,
                deletions: 0,
                hunks: Vec::new(),
                language,
            });
            continue;
        }

        // --- new file mode / deleted file mode / rename
        if line.starts_with("new file mode") {
            if let Some(f) = current_file.as_mut() {
                f.status = FileStatus::Added;
            }
            continue;
        }
        if line.starts_with("deleted file mode") {
            if let Some(f) = current_file.as_mut() {
                f.status = FileStatus::Deleted;
            }
            continue;
        }
        if line.starts_with("rename from ") {
            if let Some(f) = current_file.as_mut() {
                f.status = FileStatus::Renamed;
                f.old_path = line["rename from ".len()..].to_string();
            }
            continue;
        }
        if line.starts_with("rename to ") {
            if let Some(f) = current_file.as_mut() {
                f.new_path = line["rename to ".len()..].to_string();
            }
            continue;
        }
        if line.starts_with("copy from ") {
            if let Some(f) = current_file.as_mut() {
                f.status = FileStatus::Copied;
            }
            continue;
        }
        if line.starts_with("Binary files") {
            if let Some(f) = current_file.as_mut() {
                f.status = FileStatus::Binary;
            }
            continue;
        }

        // --- file header lines (--- a/path, +++ b/path)
        if line.starts_with("--- ") || line.starts_with("+++ ") {
            // Update paths from these lines (more accurate than diff --git line)
            if line.starts_with("--- ") {
                let path = line[4..].trim_start_matches("a/");
                if path != "/dev/null" {
                    if let Some(f) = current_file.as_mut() {
                        f.old_path = path.to_string();
                    }
                }
            } else {
                let path = line[4..].trim_start_matches("b/");
                if path != "/dev/null" {
                    // Capture existing language before mutable borrow
                    let existing_lang = current_file.as_ref().and_then(|f| f.language.clone());
                    if let Some(f) = current_file.as_mut() {
                        f.new_path = path.to_string();
                        f.language = detect_language(path).or(existing_lang);
                    }
                }
            }
            continue;
        }

        // --- index / similarity / mode lines (skip)
        if line.starts_with("index ")
            || line.starts_with("similarity index")
            || line.starts_with("old mode")
            || line.starts_with("new mode")
        {
            continue;
        }

        // --- Hunk header: @@ -old +new @@ context
        if line.starts_with("@@ ") {
            if let Some(hunk) = current_hunk.take() {
                if let Some(file) = current_file.as_mut() {
                    commit_current_hunk(file, hunk);
                }
            }
            if let Some((os, oc, ns, nc)) = parse_hunk_header(line) {
                old_line = os;
                new_line = ns;
                current_hunk = Some(DiffHunk {
                    header: line.to_string(),
                    old_start: os,
                    old_count: oc,
                    new_start: ns,
                    new_count: nc,
                    lines: Vec::new(),
                });
            }
            continue;
        }

        // --- Diff lines
        if let Some(hunk) = current_hunk.as_mut() {
            if line.starts_with('+') {
                hunk.lines.push(DiffLine {
                    line_type: DiffLineType::Added,
                    content: line[1..].to_string(),
                    old_line_number: None,
                    new_line_number: Some(new_line),
                });
                new_line += 1;
            } else if line.starts_with('-') {
                hunk.lines.push(DiffLine {
                    line_type: DiffLineType::Removed,
                    content: line[1..].to_string(),
                    old_line_number: Some(old_line),
                    new_line_number: None,
                });
                old_line += 1;
            } else if line == r"\ No newline at end of file" {
                hunk.lines.push(DiffLine {
                    line_type: DiffLineType::NoNewline,
                    content: line.to_string(),
                    old_line_number: None,
                    new_line_number: None,
                });
            } else {
                // Context line (starts with space, or empty)
                let content = if line.starts_with(' ') {
                    line[1..].to_string()
                } else {
                    line.to_string()
                };
                hunk.lines.push(DiffLine {
                    line_type: DiffLineType::Context,
                    content,
                    old_line_number: Some(old_line),
                    new_line_number: Some(new_line),
                });
                old_line += 1;
                new_line += 1;
            }
        }
    }

    // Finalize last hunk + file
    if let Some(hunk) = current_hunk.take() {
        if let Some(file) = current_file.as_mut() {
            commit_current_hunk(file, hunk);
        }
    }
    if let Some(file) = current_file.take() {
        files.push(file);
    }

    files
}

/// Run `git diff` in the given repo directory with additional arguments.
pub fn run_git_diff(repo_path: &str, args: &[String]) -> Result<String, String> {
    let output = std::process::Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .arg("diff")
        .args(args)
        .output()
        .map_err(|e| format!("Failed to run git: {}", e))?;
    if output.status.success() || !output.stdout.is_empty() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_diff() {
        let diff = r#"diff --git a/src/main.rs b/src/main.rs
index abc1234..def5678 100644
--- a/src/main.rs
+++ b/src/main.rs
@@ -1,5 +1,6 @@
 fn main() {
-    println!("hello");
+    println!("hello, world!");
+    println!("from rust");
 }
"#;
        let files = parse_diff(diff);
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].new_path, "src/main.rs");
        assert_eq!(files[0].additions, 2);
        assert_eq!(files[0].deletions, 1);
    }

    #[test]
    fn test_new_file() {
        let diff = r#"diff --git a/new_file.txt b/new_file.txt
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/new_file.txt
@@ -0,0 +1,2 @@
+Hello
+World
"#;
        let files = parse_diff(diff);
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].status, FileStatus::Added);
        assert_eq!(files[0].additions, 2);
    }
}
