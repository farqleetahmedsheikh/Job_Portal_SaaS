/** @format */

"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import styles from "../../styles/theme-toggle.module.css";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={styles["theme-toggle"]}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
