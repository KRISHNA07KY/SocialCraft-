"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "sunrise" | "sunset" | "midnight";

const STORAGE_KEY = "socialcraft-theme";
const LEGACY_STORAGE_KEY = "socialforge-theme";
const themes: ThemeName[] = ["sunrise", "sunset", "midnight"];

function normalizeTheme(value: string | null): ThemeName | null {
  if (value === "moon") return "midnight";
  return value !== null && themes.includes(value as ThemeName) ? (value as ThemeName) : null;
}

const ThemeContext = createContext<{ theme: ThemeName; setTheme: (theme: ThemeName) => void }>({
  theme: "sunrise",
  setTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("sunrise");

  useEffect(() => {
    const stored = normalizeTheme(window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY));
    if (stored && stored !== "sunrise") {
      document.documentElement.dataset.theme = stored;
      queueMicrotask(() => {
        setThemeState(stored);
      });
    }
  }, []);

  const setTheme = (nextTheme: ThemeName) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      document.documentElement.dataset.theme = nextTheme;
    }
    setThemeState(nextTheme);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
