//! rust-comp: Local diff viewer powered by Tauri v2 + React.
//!
//! Tauri commands exposed to the React frontend.

mod diff;

/// Public re-export of diff utilities for use by the CLI binary (main.rs).
pub mod diff_util {
    pub use crate::diff::run_git_diff;
}

use diff::{parse_diff, run_git_diff, DiffFile};

/// Parse a unified diff string and return structured diff data.
#[tauri::command]
fn cmd_parse_diff(diff_text: String) -> Vec<DiffFile> {
    parse_diff(&diff_text)
}

/// Run `git diff` in a repository directory and return structured diff data.
/// `args` are forwarded directly to `git diff` (e.g., ["HEAD~1", "--", "src/"]).
#[tauri::command]
fn cmd_git_diff(repo_path: String, args: Vec<String>) -> Result<Vec<DiffFile>, String> {
    let text = run_git_diff(&repo_path, &args)?;
    Ok(parse_diff(&text))
}

/// Read the initial diff text stored by the CLI launcher.
/// On startup the binary writes the diff to a temp file and passes the path
/// via the `COMP_DIFF_PATH` environment variable.
#[tauri::command]
fn cmd_get_initial_diff() -> Result<String, String> {
    if let Ok(path) = std::env::var("COMP_DIFF_PATH") {
        std::fs::read_to_string(&path).map_err(|e| e.to_string())
    } else if let Ok(text) = std::env::var("COMP_DIFF_TEXT") {
        Ok(text)
    } else {
        Ok(String::new())
    }
}

/// Return the current working directory (for git diff default).
#[tauri::command]
fn cmd_get_cwd() -> String {
    std::env::current_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            cmd_parse_diff,
            cmd_git_diff,
            cmd_get_initial_diff,
            cmd_get_cwd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
