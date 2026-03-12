/** @format */
// app/applicant/profile/components/PrivacySettings.tsx
"use client";

import { Eye } from "lucide-react";
import { PRIVACY_TOGGLES } from "../../config/profile.config";
import { ToggleRow } from "./ToggleRow";
import type { PrivacyForm } from "../../types/profile.types";
import styles from "../../applicant/styles/profile.module.css";

interface Props {
  privacy: PrivacyForm;
  onToggle: (name: keyof PrivacyForm) => void;
}

export function PrivacySettings({ privacy, onToggle }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles["card-header"]}>
        <h2 className={styles["card-title"]}>
          <Eye size={16} aria-hidden /> Privacy &amp; Visibility
        </h2>
        <p className={styles["card-subtitle"]}>
          Control who can see your profile and contact information
        </p>
      </div>

      <div className={styles["card-body"]}>
        <div className={styles["toggle-list"]}>
          {PRIVACY_TOGGLES.map(({ name, label, desc }) => (
            <ToggleRow
              key={name as string}
              label={label}
              desc={desc}
              checked={privacy[name]}
              onChange={() => onToggle(name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
