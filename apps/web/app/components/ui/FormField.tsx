/** @format */
"use client";

import { AlertCircle } from "lucide-react";
import styles from "../../employer/styles/post-job.module.css";

interface Props {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, error, hint, children }: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
      {error && (
        <p className={styles.error}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}
