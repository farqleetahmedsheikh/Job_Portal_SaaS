/** @format */
// app/applicant/profile/page.tsx
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
    router.replace("/login");
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

      {/* ── Personal info ────────────────────────────────────────────────── */}
      <div className={styles.card}>
        <ProfileAvatar user={user} fullName={form.fullName} editing={editing} />

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

          {isApplicant && (
            <SkillsField
              editing={editing}
              draftValue={draft.skills}
              skills={user.applicantProfile?.skills}
              onChange={handleChange}
            />
          )}
        </div>
      </div>

      <DangerZone />
    </div>
  );
}
