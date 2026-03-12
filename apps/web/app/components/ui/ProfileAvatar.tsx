/** @format */
"use client";

import { Camera, AlertTriangle } from "lucide-react";
import { initials } from "../../lib";
import type { SessionUser } from "../../store/session.store";
import styles from "../../applicant/styles/profile.module.css";

interface Props {
  user: SessionUser;
  fullName: string;
  editing: boolean;
}

export function ProfileAvatar({ user, fullName, editing }: Props) {
  const isApplicant = user.role === "applicant";
  const subtitle = isApplicant
    ? (user.applicantProfile?.jobTitle ?? "Applicant")
    : (user.company?.companyName ?? "Employer");

  return (
    <div className={styles["avatar-section"]}>
      <div className={styles["avatar-wrap"]}>
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={fullName}
            className={styles["avatar-img"]}
          />
        ) : (
          <div
            className={styles["avatar-fallback"]}
            aria-label={initials(fullName || "U")}
          >
            {initials(fullName || "U")}
          </div>
        )}
        {editing && (
          <button
            className={styles["avatar-upload-btn"]}
            aria-label="Change profile photo"
          >
            <Camera size={12} aria-hidden />
          </button>
        )}
      </div>

      <div className={styles["avatar-info"]}>
        <span className={styles["avatar-name"]}>{fullName || "Your Name"}</span>
        <span className={styles["avatar-role"]}>{subtitle}</span>
        {!user.isProfileComplete && (
          <span className={styles["incomplete-badge"]}>
            <AlertTriangle size={11} /> Profile incomplete
          </span>
        )}
        {editing && (
          <span className={styles["avatar-hint"]}>
            Click the camera icon to upload a new photo
          </span>
        )}
      </div>
    </div>
  );
}
