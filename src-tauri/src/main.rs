// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{self, Read};

fn main() {
    let args: Vec<String> = std::env::args().collect();

    // Determine the diff text source:
    // 1. If stdin is not a TTY (piped), read from stdin
    // 2. If a file path is given as an argument, read from file
    // 3. Otherwise, default to `git diff` in current directory

    let diff_text = if is_stdin_piped() {
        // git diff | comp
        let mut buf = String::new();
        io::stdin()
            .read_to_string(&mut buf)
            .expect("Failed to read stdin");
        buf
    } else if args.len() >= 2 && std::path::Path::new(&args[1]).exists() {
        // comp path/to/file.diff
        std::fs::read_to_string(&args[1]).expect("Failed to read diff file")
    } else if args.len() >= 2 {
        // comp HEAD~1 -- src/  (forward args to git diff)
        let repo_path = std::env::current_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        rust_comp_lib::diff_util::run_git_diff(&repo_path, &args[1..]).unwrap_or_default()
    } else {
        // comp  (no args: git diff HEAD in current dir)
        let repo_path = std::env::current_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        rust_comp_lib::diff_util::run_git_diff(&repo_path, &[]).unwrap_or_default()
    };

    // Write diff text to a temp file and expose via environment variable.
    // The Tauri app reads it via the `cmd_get_initial_diff` command.
    if !diff_text.is_empty() {
        let tmp_path = std::env::temp_dir().join(format!("comp-diff-{}.patch", std::process::id()));
        if std::fs::write(&tmp_path, &diff_text).is_ok() {
            // Safety: setting env var before Tauri initializes is fine
            unsafe {
                std::env::set_var("COMP_DIFF_PATH", &tmp_path);
            }
        }
    }

    rust_comp_lib::run();
}

/// Returns true if stdin is piped (not a terminal).
fn is_stdin_piped() -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::io::AsRawFd;
        libc_isatty(io::stdin().as_raw_fd()) == 0
    }
    #[cfg(not(unix))]
    {
        false
    }
}

#[cfg(unix)]
extern "C" {
    fn isatty(fd: i32) -> i32;
}

#[cfg(unix)]
fn libc_isatty(fd: i32) -> i32 {
    unsafe { isatty(fd) }
}
