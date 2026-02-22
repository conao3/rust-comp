/**
 * Syntax highlighting utilities using highlight.js.
 * Applied to diff content lines for language-aware coloring.
 */

import hljs from "highlight.js/lib/core";

// Register only the languages we support to keep bundle size small
import rust from "highlight.js/lib/languages/rust";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import toml from "highlight.js/lib/languages/ini"; // TOML is close to INI
import markdown from "highlight.js/lib/languages/markdown";
import html from "highlight.js/lib/languages/xml"; // HTML uses xml parser
import css from "highlight.js/lib/languages/css";
import scss from "highlight.js/lib/languages/scss";
import xml from "highlight.js/lib/languages/xml";
import sql from "highlight.js/lib/languages/sql";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import lua from "highlight.js/lib/languages/lua";
import php from "highlight.js/lib/languages/php";
import r from "highlight.js/lib/languages/r";
import elixir from "highlight.js/lib/languages/elixir";
import erlang from "highlight.js/lib/languages/erlang";
import haskell from "highlight.js/lib/languages/haskell";
import ocaml from "highlight.js/lib/languages/ocaml";

hljs.registerLanguage("rust", rust);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("toml", toml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("html", html);
hljs.registerLanguage("css", css);
hljs.registerLanguage("scss", scss);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("php", php);
hljs.registerLanguage("r", r);
hljs.registerLanguage("elixir", elixir);
hljs.registerLanguage("erlang", erlang);
hljs.registerLanguage("haskell", haskell);
hljs.registerLanguage("ocaml", ocaml);

/**
 * Highlight a code block using highlight.js.
 * Returns HTML string with hljs span tags applied.
 * Returns plain text if language is not supported or highlighting fails.
 */
export function highlightCode(code: string, language: string): string {
  try {
    if (hljs.getLanguage(language)) {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    }
  } catch {
    // Ignore highlighting errors
  }
  // Escape HTML entities for plain text
  return escapeHtml(code);
}

/**
 * Escape HTML special characters.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Highlight a single diff line by continuing the highlight state across lines
 * (for accurate multi-line token handling).
 *
 * For simplicity, we highlight each line independently. This is a limitation
 * but acceptable for most practical diffs.
 */
export function highlightLine(line: string, language?: string): string {
  if (!language) return escapeHtml(line);
  return highlightCode(line, language);
}
