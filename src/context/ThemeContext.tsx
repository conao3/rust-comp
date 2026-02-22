import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { ThemeName, ViewMode } from "../types/diff";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "github-light",
  setTheme: () => {},
  viewMode: "unified",
  setViewMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem("comp-theme") as ThemeName) || "github-light";
  });
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (localStorage.getItem("comp-view-mode") as ViewMode) || "unified";
  });

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem("comp-theme", t);
  };

  const setViewMode = (v: ViewMode) => {
    setViewModeState(v);
    localStorage.setItem("comp-view-mode", v);
  };

  // Apply theme class to document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, viewMode, setViewMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
