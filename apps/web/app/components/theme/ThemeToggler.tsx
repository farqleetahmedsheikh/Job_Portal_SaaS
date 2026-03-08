/** @format */

"use client";

import styles from "../../styles/theme-toggle.module.css";
import { Moon, Sun } from "lucide-react";
import { useTheme }  from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark"
        ? <Sun  size={16} aria-hidden />
        : <Moon size={16} aria-hidden />
      }
    </button>
  );
}