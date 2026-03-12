/** @format */
// app/applicant/profile/components/ToggleRow.tsx
"use client";

import styles from "../../applicant/styles/profile.module.css";

interface Props {
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}

export function ToggleRow({ label, desc, checked, onChange }: Props) {
  return (
    <div className={styles["toggle-row"]}>
      <div className={styles["toggle-info"]}>
        <span className={styles["toggle-label"]}>{label}</span>
        <span className={styles["toggle-desc"]}>{desc}</span>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        className={`${styles.toggle} ${checked ? styles["toggle-on"] : ""}`}
        onClick={onChange}
        type="button"
      >
        <span className={styles["toggle-thumb"]} />
      </button>
    </div>
  );
}
