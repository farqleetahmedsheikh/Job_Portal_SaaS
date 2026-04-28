/** @format */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type SessionUser,
  useUser,
  useSessionStore,
} from "../../store/session.store";
import { FIELDS } from "../../config/profile.config";
import { useProfileForm } from "../../hooks/useProfileForm";
import { ProfileHeader } from "../../components/ui/ProfileHeader";
import { ProfileAvatar } from "../../components/ui/ProfileAvatar";
import { ProfileField } from "../../components/ui/ProfileField";
import { SkillsField } from "../../components/ui/SkillsField";
import { DangerZone } from "../../components/ui/DangerZone";
import { StatusBanners } from "../../components/ui/StatusBanners";
import styles from "../styles/profile.module.css";
import { EducationField } from "../../components/ui/EducationField";
import { ExperienceField } from "../../components/ui/ExperienceField";

export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const { setUser } = useSessionStore();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [router, user]);

  if (!user) return null;

  return <ProfileContent user={user} setUser={setUser} />;
}

function ProfileContent({
  user,
  setUser,
}: {
  user: SessionUser;
  setUser: (user: SessionUser) => void;
}) {
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
            {visibleFields
              .filter((field) => typeof form[field.name] === "string")
              .map((field) => (
                <ProfileField
                  key={field.name}
                  config={field}
                  value={form[field.name] as string}
                  draftValue={draft[field.name] as string}
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

      {isApplicant && (
        <div className={styles.card}>
          <div className={styles["card-header"]}>
            <h2 className={styles["card-title"]}>Experience</h2>
            {!editing && (
              <span className={styles["card-count"]}>
                {user.applicantProfile?.experiences?.length ?? 0} added
              </span>
            )}
          </div>
          <div className={styles["card-body"]}>
            <ExperienceField
              editing={editing}
              value={
                draft.experiences ?? user.applicantProfile?.experiences ?? []
              }
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {isApplicant && (
        <div className={styles.card}>
          <div className={styles["card-header"]}>
            <h2 className={styles["card-title"]}>Education</h2>
            {!editing && (
              <span className={styles["card-count"]}>
                {user.applicantProfile?.educations?.length ?? 0} added
              </span>
            )}
          </div>
          <div className={styles["card-body"]}>
            <EducationField
              editing={editing}
              value={
                draft.educations ?? user.applicantProfile?.educations ?? []
              }
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      <DangerZone />
    </div>
  );
}
