/** @format */
"use client";

import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Edit2,
  Check,
  X,
  Camera,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Trash2,
} from "lucide-react";
import { useUser, useSessionStore } from "../../store/session.store";
import { useEmployerProfile } from "../../hooks/useEmployerProfile";
import { StatusBanners } from "../../components/ui/StatusBanners";
import { initials } from "../../lib";
import styles from "../styles/profile.module.css";
import { EmailVerifiedBadge } from "../../components/ui/EmailVerifyBadge";

export default function EmployerProfilePage() {
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
  } = useEmployerProfile({ user, setUser });

  const userInitials = initials(form.fullName || "U");
  const companyName = user.company?.companyName ?? "Employer";

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles["page-header"]}>
        <div>
          <h1 className={styles["page-title"]}>My Profile</h1>
          <p className={styles["page-subtitle"]}>
            Manage your personal account information
          </p>
        </div>
        <div className={styles["form-actions"]}>
          {editing ? (
            <>
              <button
                className={`${styles.btn} ${styles["btn-ghost"]}`}
                onClick={handleCancel}
                disabled={saving}
              >
                <X size={14} /> Cancel
              </button>
              <button
                className={`${styles.btn} ${styles["btn-primary"]}`}
                onClick={handleSave}
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
              onClick={handleEdit}
            >
              <Edit2 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <StatusBanners saved={saved} serverError={serverError} />

      {/* Personal info */}
      <div className={styles.card}>
        {/* Avatar */}
        <div className={styles["avatar-section"]}>
          <div className={styles["avatar-wrap"]}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={form.fullName}
                className={styles["avatar-img"]}
              />
            ) : (
              <div className={styles["avatar-fallback"]}>{userInitials}</div>
            )}
            {editing && (
              <button
                className={styles["avatar-upload-btn"]}
                aria-label="Change photo"
              >
                <Camera size={12} />
              </button>
            )}
          </div>
          <div className={styles["avatar-info"]}>
            <span className={styles["avatar-name"]}>
              {form.fullName || "Your Name"}
            </span>
            <span className={styles["avatar-role"]}>{companyName}</span>
            {!user.isProfileComplete && (
              <span className={styles["incomplete-badge"]}>
                <AlertTriangle size={11} /> Profile incomplete
              </span>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className={styles["card-body"]}>
          <div className={styles["form-grid"]}>
            {/* Full Name */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="fullName">
                <User size={11} /> Full Name
              </label>
              {editing ? (
                <input
                  id="fullName"
                  name="fullName"
                  className={styles.input}
                  value={draft.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              ) : (
                <div
                  className={`${styles.value} ${!form.fullName ? styles.empty : ""}`}
                >
                  {form.fullName || "Not set"}
                </div>
              )}
            </div>

            {/* Email — read only */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                <Mail size={11} /> Email Address
              </label>
              <div
                className={styles.value}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                {form.email}
                <EmailVerifiedBadge isVerified={user.isEmailVerified} />
              </div>
            </div>

            {/* Phone */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="phone">
                <Phone size={11} /> Phone Number
              </label>
              {editing ? (
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className={styles.input}
                  value={draft.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              ) : (
                <div
                  className={`${styles.value} ${!form.phone ? styles.empty : ""}`}
                >
                  {form.phone || "Not set"}
                </div>
              )}
            </div>

            {/* Bio */}
            <div className={`${styles.field} ${styles["span-2"]}`}>
              <label className={styles.label} htmlFor="bio">
                Bio
              </label>
              {editing ? (
                <textarea
                  id="bio"
                  name="bio"
                  className={styles.textarea}
                  rows={3}
                  value={draft.bio}
                  onChange={handleChange}
                  placeholder="A short bio about yourself..."
                />
              ) : (
                <div
                  className={`${styles.value} ${!form.bio ? styles.empty : ""}`}
                >
                  {form.bio || "Not set"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className={styles.card}>
        <div className={styles["card-header"]}>
          <h2 className={styles["card-title"]}>
            <AlertTriangle
              size={16}
              style={{ color: "var(--status-danger)" }}
            />{" "}
            Account
          </h2>
        </div>
        <div className={styles["card-body"]}>
          <div className={styles["danger-list"]}>
            {[
              {
                label: "Change Password",
                desc: "Update your password",
                icon: <Lock size={14} />,
                variant: "btn-ghost",
                route: "/change-password",
              },
              {
                label: "Delete Account",
                desc: "Permanently remove your account",
                icon: <Trash2 size={14} />,
                variant: "btn-danger",
                route: "/delete-account",
              },
            ].map(({ label, desc, icon, variant, route }) => (
              <div key={route} className={styles["danger-row"]}>
                <div className={styles["danger-info"]}>
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </div>
                <button
                  className={`${styles.btn} ${styles[variant]}`}
                  onClick={() => router.push(route)}
                >
                  {icon} {label.split(" ")[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
