/** @format */
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  toggle: () => {},
});

const KEY = "hiringFly-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // On mount — read what the inline script already stamped on <html>
  // (avoids a second flash from useEffect firing after paint)
  useEffect(() => {
    const attr = document.documentElement.getAttribute(
      "data-theme",
    ) as Theme | null;
    const stored = localStorage.getItem(KEY) as Theme | null;
    const resolved = attr ?? stored ?? "dark";

    setTheme(resolved);
    // Ensure both are in sync
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(KEY, resolved);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next); // ← changes CSS vars
      localStorage.setItem(KEY, next); // ← persists
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Single export — every component uses this, not a separate hook file
export const useTheme = () => useContext(ThemeContext);
