/** @format */
import React from "react";
import styles from "../../styles/auth.module.css";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  submitLabel?: string;
}

export const AuthForm: React.FC<Props> = ({
  title,
  subtitle,
  children,
  onSubmit,
  loading,
  submitLabel,
}) => (
  <div className={styles.wrapper}>
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles["logo-mark"]}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {/* Fields */}
      <form onSubmit={onSubmit}>
        <div className={styles.body}>
          {children}

          <button
            type="submit"
            className={styles["submit-btn"]}
            disabled={loading}
          >
            {loading && <span className={styles.spinner} />}
            {loading ? "Processing..." : (submitLabel ?? title)}
          </button>
        </div>
      </form>
    </div>
  </div>
);
