/** @format */
"use client";

import { Edit2, Check, X } from "lucide-react";
import styles from "../../applicant/styles/profile.module.css";

interface Props {
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ProfileHeader({
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
}: Props) {
  return (
    <div className={styles["page-header"]}>
      <div>
        <h1 className={styles["page-title"]}>My Profile</h1>
        <p className={styles["page-subtitle"]}>
          Manage your personal information and account settings
        </p>
      </div>

      <div className={styles["form-actions"]}>
        {editing ? (
          <>
            <button
              className={`${styles.btn} ${styles["btn-ghost"]}`}
              onClick={onCancel}
              disabled={saving}
            >
              <X size={14} /> Cancel
            </button>
            <button
              className={`${styles.btn} ${styles["btn-primary"]}`}
              onClick={onSave}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? (
                <>
                  <span className={styles.spinner} /> Saving...
                </>
              ) : (
                <>
                  <Check size={14} /> Save Changes
                </>
              )}
            </button>
          </>
        ) : (
          <button
            className={`${styles.btn} ${styles["btn-primary"]}`}
            onClick={onEdit}
          >
            <Edit2 size={14} /> Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
