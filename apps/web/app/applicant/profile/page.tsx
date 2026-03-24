/** @format */
"use client";

import { useRouter } from "next/navigation";
import { useUser, useSessionStore } from "../../store/session.store";
import { FIELDS } from "../../config/profile.config";
import { useProfileForm } from "../../hooks/useProfileForm";
import { ProfileHeader } from "../../components/ui/ProfileHeader";
import { ProfileAvatar } from "../../components/ui/ProfileAvatar";
import { ProfileField } from "../../components/ui/ProfileField";
import { SkillsField } from "../../components/ui/SkillsField";
import { DangerZone } from "../../components/ui/DangerZone";
import { StatusBanners } from "../../components/ui/StatusBanners";
import styles from "../styles/profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const { setUser } = useSessionStore();

  if (!user) {
    console.log("User-------> ", user);
    router.push("/login");
    return null;
  }

  const {
    form,
    draft,
    editing,
    saving,
    saved,
    serverError,
    handleChange,
    handleEdit,
    handleCancel,
    handleSave,
    avatarUploading,
    avatarError,
    handleAvatarUpload,
  } = useProfileForm({ user, setUser });

  const isApplicant = user.role === "applicant";
  const visibleFields = FIELDS.filter((f) => !f.applicantOnly || isApplicant);

  return (
    <div className={styles.page}>
      <ProfileHeader
        editing={editing}
        saving={saving}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <StatusBanners saved={saved} serverError={serverError} />

      {avatarError && (
        <div className={styles["banner-error"]}>⚠ {avatarError}</div>
      )}

      {/* ── Personal info ────────────────────────────────────────────────── */}
      <div className={styles.card}>
        <ProfileAvatar
          user={user}
          fullName={form.fullName}
          editing={editing}
          uploading={avatarUploading}
          onAvatarChange={handleAvatarUpload}
        />

        <div className={styles["card-body"]}>
          <div className={styles["form-grid"]}>
            {visibleFields.map((field) => (
              <ProfileField
                key={field.name}
                config={field}
                value={form[field.name]}
                draftValue={draft[field.name]}
                editing={editing}
                onChange={handleChange}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Skills ───────────────────────────────────────────────────────── */}
      {isApplicant && (
        <div className={styles.card}>
          <div className={styles["card-header"]}>
            <h2 className={styles["card-title"]}>Skills</h2>
            {!editing && (
              <span className={styles["card-count"]}>
                {user.applicantProfile?.skills?.length ?? 0} added
              </span>
            )}
          </div>
          <div className={styles["card-body"]}>
            <SkillsField
              editing={editing}
              draftValue={draft.skills}
              skills={user.applicantProfile?.skills}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      <DangerZone />
    </div>
  );
}
