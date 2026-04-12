/** @format */
"use client";

import { useRef } from "react";
import { Camera, AlertTriangle, Loader } from "lucide-react";
import { initials } from "../../lib";
import type { SessionUser } from "../../store/session.store";
import styles from "../../applicant/styles/profile.module.css";
import Image from "next/image";

interface Props {
  user: SessionUser;
  fullName: string;
  editing: boolean;
  uploading?: boolean;
  onAvatarChange?: (file: File) => void;
}

export function ProfileAvatar({
  user,
  fullName,
  editing,
  uploading = false,
  onAvatarChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const isApplicant = user.role === "applicant";
  const subtitle = isApplicant
    ? (user.applicantProfile?.jobTitle ?? "Applicant")
    : (user.companies?.companyName ?? "Employer");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onAvatarChange?.(file);
    e.target.value = "";
  }

  return (
    <div className={styles["avatar-section"]}>
      <div className={styles["avatar-wrap"]}>
        {/* Avatar image or initials fallback */}
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={fullName}
            className={`${styles["avatar-img"]} ${uploading ? styles["avatar-uploading"] : ""}`}
          />
        ) : (
          <div
            className={`${styles["avatar-fallback"]} ${uploading ? styles["avatar-uploading"] : ""}`}
            aria-label={initials(fullName || "U")}
          >
            {initials(fullName || "U")}
          </div>
        )}

        {/* Upload spinner overlay while uploading */}
        {uploading && (
          <div className={styles["avatar-spinner"]}>
            <Loader size={16} className={styles["spin"]} />
          </div>
        )}

        {/* Camera button — only when editing and not currently uploading */}
        {editing && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className={styles["avatar-upload-btn"]}
              aria-label="Change profile photo"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader size={12} className={styles["spin"]} />
              ) : (
                <Camera size={12} aria-hidden />
              )}
            </button>
          </>
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
        {editing && !uploading && (
          <span className={styles["avatar-hint"]}>
            Click the camera icon to upload a new photo
          </span>
        )}
        {uploading && (
          <span className={styles["avatar-hint"]}>Uploading photo…</span>
        )}
      </div>
    </div>
  );
}
