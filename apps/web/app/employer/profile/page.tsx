/** @format */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type SessionUser,
  useUser,
  useSessionStore,
} from "../../store/session.store";
import { useEmployerProfile } from "../../hooks/useEmployerProfile";
import { FIELDS } from "../../config/profile.config";
import { ProfileHeader } from "../../components/ui/ProfileHeader";
import { ProfileAvatar } from "../../components/ui/ProfileAvatar";
import { ProfileField } from "../../components/ui/ProfileField";
import { DangerZone } from "../../components/ui/DangerZone";
import { StatusBanners } from "../../components/ui/StatusBanners";
import { AccountPrivacyControls } from "../../components/account/AccountPrivacyControls";
import styles from "../styles/profile.module.css";

// Employer personal fields = shared fields only (no applicantOnly, no employerOnly company fields)
const EMPLOYER_FIELDS = FIELDS.filter((f) => !f.applicantOnly);

export default function EmployerProfilePage() {
  const router = useRouter();
  const user = useUser();
  const { setUser } = useSessionStore();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [router, user]);

  if (!user) return null;

  return <EmployerProfileContent user={user} setUser={setUser} />;
}

function EmployerProfileContent({
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
  } = useEmployerProfile({ user, setUser });

  return (
    <div className={styles.page}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
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
            {EMPLOYER_FIELDS.map((field) => (
              <ProfileField
                key={field.name}
                config={{
                  ...field,
                  // Inject live email-verified state into the email field config
                  isEmailVerified:
                    field.name === "email" ? user.isEmailVerified : undefined,
                }}
                value={form[field.name as keyof typeof form] ?? ""}
                draftValue={draft[field.name as keyof typeof draft] ?? ""}
                editing={editing}
                onChange={handleChange}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Account / danger zone ─────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles["card-body"]}>
          <AccountPrivacyControls />
        </div>
      </div>
      <DangerZone />
    </div>
  );
}
