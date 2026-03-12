/** @format */
"use client";

import { Check } from "lucide-react";
import styles from "../../applicant/styles/profile.module.css";

interface Props {
  saved: boolean;
  serverError: string | null;
}

export function StatusBanners({ saved, serverError }: Props) {
  if (!saved && !serverError) return null;
  return (
    <>
      {saved && (
        <div className={styles["save-banner"]} role="status">
          <Check size={16} /> Profile updated successfully
        </div>
      )}
      {serverError && (
        <div className={styles["error-banner"]} role="alert">
          {serverError}
        </div>
      )}
    </>
  );
}
