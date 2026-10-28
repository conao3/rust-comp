import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { DiffFile } from "../types/diff";
import { parseDiffClient } from "../utils/diffParser";

interface UseDiffResult {
  files: DiffFile[];
  rawDiff: string;
  loading: boolean;
  error: string | null;
  reload: () => void;
  loadText: (text: string) => void;
}

export function useDiff(): UseDiffResult {
  const [files, setFiles] = useState<DiffFile[]>([]);
  const [rawDiff, setRawDiff] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseAndSet = useCallback((text: string) => {
    setRawDiff(text);
    if (!text.trim()) {
      setFiles([]);
      return;
    }
    try {
      // Try Rust backend first, fall back to client-side parser
      invoke<DiffFile[]>("cmd_parse_diff", { diffText: text })
        .then((result) => setFiles(result))
        .catch(() => {
          // Fallback to client-side parser (useful in browser dev mode)
          setFiles(parseDiffClient(text));
        });
    } catch {
      setFiles(parseDiffClient(text));
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await invoke<string>("cmd_get_initial_diff");
      if (text && text.trim()) {
        parseAndSet(text);
      } else {
        // Try git diff in current directory
        const cwd = await invoke<string>("cmd_get_cwd");
        const diffFiles = await invoke<DiffFile[]>("cmd_git_diff", {
          repoPath: cwd,
          args: [],
        });
        setFiles(diffFiles);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [parseAndSet]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadText = useCallback(
    (text: string) => {
      setLoading(false);
      setError(null);
      parseAndSet(text);
    },
    [parseAndSet],
  );

  return {
    files,
    rawDiff,
    loading,
    error,
    reload: loadInitial,
    loadText,
  };
}
