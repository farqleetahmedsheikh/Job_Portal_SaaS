/** @format */
"use client";

import { useState, useCallback, useMemo } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Edit2,
  Check,
  X,
  Camera,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Trash2,
  Github,
  Linkedin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "../../store/session.store";
import { useSessionStore } from "../../store/session.store";
import { api } from "../../lib";
import { API_BASE } from "../../constants";
import { initials } from "../../lib";
import type { SessionUser } from "../../store/session.store";
import styles from "../../styles/profile.module.css";

// ─── Types ────────────────────────────────────────────────
interface ProfileForm {
  // User fields
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  // Applicant profile fields
  jobTitle: string;
  location: string;
  experienceYears: string;
  skills: string; // comma-separated in input, sent as array
  linkedinUrl: string;
  githubUrl: string;
}

interface FieldConfig {
  name: keyof ProfileForm;
  label: string;
  type?: string;
  placeholder: string;
  span?: boolean;
  textarea?: boolean;
  icon: React.ReactNode;
  readOnly?: boolean;
  applicantOnly?: boolean;
}

// ─── Field config ─────────────────────────────────────────
const FIELDS: FieldConfig[] = [
  // ── Base user fields ──
  {
    name: "fullName",
    label: "Full Name",
    icon: <User size={11} />,
    placeholder: "Your full name",
  },
  {
    name: "email",
    label: "Email Address",
    icon: <Mail size={11} />,
    placeholder: "you@example.com",
    type: "email",
    readOnly: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    icon: <Phone size={11} />,
    placeholder: "+1 (555) 000-0000",
    type: "tel",
  },
  {
    name: "bio",
    label: "Bio",
    icon: null,
    placeholder: "A short bio about yourself...",
    span: true,
    textarea: true,
  },
  // ── Applicant-only fields ──
  {
    name: "jobTitle",
    label: "Job Title",
    icon: <Briefcase size={11} />,
    placeholder: "e.g. Frontend Developer",
    applicantOnly: true,
  },
  {
    name: "location",
    label: "Location",
    icon: <MapPin size={11} />,
    placeholder: "City, Country",
    applicantOnly: true,
  },
  {
    name: "experienceYears",
    label: "Years of Experience",
    icon: <User size={11} />,
    placeholder: "2",
    type: "number",
    applicantOnly: true,
  },
  {
    name: "linkedinUrl",
    label: "LinkedIn URL",
    icon: <Linkedin size={11} />,
    placeholder: "https://linkedin.com/in/username",
    applicantOnly: true,
  },
  {
    name: "githubUrl",
    label: "GitHub URL",
    icon: <Github size={11} />,
    placeholder: "https://github.com/username",
    applicantOnly: true,
  },
];

const DANGER_ACTIONS = [
  {
    label: "Change Password",
    desc: "Update your password to keep your account secure",
    icon: <Lock size={14} />,
    variant: "btn-ghost" as const,
    action: "change-password",
  },
  {
    label: "Delete Account",
    desc: "Permanently remove your account and all associated data",
    icon: <Trash2 size={14} />,
    variant: "btn-danger" as const,
    action: "delete-account",
  },
];

// ─── Component ────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const user = useUser();
  const { setUser } = useSessionStore();

  const initialForm = useMemo<ProfileForm>(
    () => ({
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      bio: user?.bio ?? "",
      jobTitle: user?.applicantProfile?.jobTitle ?? "",
      location: user?.applicantProfile?.location ?? "",
      experienceYears: String(user?.applicantProfile?.experienceYears ?? ""),
      skills: user?.applicantProfile?.skills?.join(", ") ?? "",
      linkedinUrl: user?.applicantProfile?.linkedinUrl ?? "",
      githubUrl: user?.applicantProfile?.githubUrl ?? "",
    }),
    [user],
  );

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [draft, setDraft] = useState<ProfileForm>(initialForm);

  if (!user) {
    router.replace("/login");
    return null;
  }

  const userInitials = initials(form.fullName || "U");
  const isApplicant = user.role === "applicant";
  const visibleFields = FIELDS.filter((f) => !f.applicantOnly || isApplicant);

  // ── Handlers ──────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    [],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setServerError(null);
    try {
      // Single API call — backend splits fields into correct tables
      const updatedUser = await api<SessionUser>(
        `${API_BASE}/users/me`,
        "PATCH",
        {
          // User table fields
          fullName: draft.fullName || undefined,
          phoneNumber: draft.phone || undefined,
          bio: draft.bio || undefined,
          // Applicant profile fields — backend ignores for employers
          jobTitle: draft.jobTitle || undefined,
          location: draft.location || undefined,
          linkedinUrl: draft.linkedinUrl || undefined,
          githubUrl: draft.githubUrl || undefined,
          experienceYears: draft.experienceYears
            ? Number(draft.experienceYears)
            : undefined,
          skills: draft.skills
            ? draft.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        },
      );

      // Update session store with fresh data from backend
      setUser(updatedUser);
      setForm(draft);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  }, [draft, user, setUser]);

  const handleCancel = useCallback(() => {
    setDraft(form);
    setEditing(false);
    setServerError(null);
  }, [form]);

  const handleDangerAction = useCallback(
    (action: string) => {
      if (action === "change-password") router.push("/change-password");
      if (action === "delete-account") router.push("/delete-account");
    },
    [router],
  );

  // ── Render ────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Header */}
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
              onClick={() => setEditing(true)}
            >
              <Edit2 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Banners */}
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
              <div
                className={styles["avatar-fallback"]}
                aria-label={userInitials}
              >
                {userInitials}
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
            <span className={styles["avatar-name"]}>
              {form.fullName || "Your Name"}
            </span>
            <span className={styles["avatar-role"]}>
              {isApplicant
                ? (user.applicantProfile?.jobTitle ?? "Applicant")
                : (user.company?.companyName ?? "Employer")}
            </span>
            {!user.isProfileComplete && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--status-warning)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
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

        {/* Fields */}
        <div className={styles["card-body"]}>
          <div className={styles["form-grid"]}>
            {visibleFields.map(
              ({
                name,
                label,
                type,
                placeholder,
                span,
                textarea,
                icon,
                readOnly,
              }) => (
                <div
                  key={name}
                  className={[styles.field, span ? styles["span-2"] : ""].join(
                    " ",
                  )}
                >
                  <label className={styles.label} htmlFor={name}>
                    {icon} {label}
                  </label>

                  {editing && !readOnly ? (
                    textarea ? (
                      <textarea
                        id={name}
                        name={name}
                        className={styles.textarea}
                        value={draft[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        rows={3}
                      />
                    ) : (
                      <input
                        id={name}
                        name={name}
                        type={type ?? "text"}
                        className={styles.input}
                        value={draft[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        min={type === "number" ? 0 : undefined}
                        max={type === "number" ? 50 : undefined}
                      />
                    )
                  ) : (
                    <div
                      className={[
                        styles.value,
                        !form[name] ? styles.empty : "",
                      ].join(" ")}
                    >
                      {name === "email" && form.email ? (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {form.email}
                          <span
                            className={`${styles.badge} ${styles["badge-verified"]}`}
                          >
                            <ShieldCheck size={11} aria-hidden /> Verified
                          </span>
                        </span>
                      ) : name === "experienceYears" && form.experienceYears ? (
                        `${form.experienceYears} years`
                      ) : (
                        form[name] || "Not set"
                      )}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {/* Skills — separate since it's an array */}
          {isApplicant && (
            <div className={styles.field} style={{ marginTop: 16 }}>
              <label className={styles.label} htmlFor="skills">
                Skills
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 400,
                    marginLeft: 4,
                  }}
                >
                  (comma separated)
                </span>
              </label>
              {editing ? (
                <input
                  id="skills"
                  name="skills"
                  className={styles.input}
                  value={draft.skills}
                  onChange={handleChange}
                  placeholder="React, TypeScript, Node.js"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  {user.applicantProfile?.skills?.length ? (
                    user.applicantProfile.skills.map((s) => (
                      <span key={s} className={styles.badge}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className={styles.empty}>Not set</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className={styles.card}>
        <div className={styles["card-header"]}>
          <h2 className={styles["card-title"]}>
            <AlertTriangle
              size={16}
              style={{ color: "var(--status-danger)" }}
              aria-hidden
            />
            Account
          </h2>
        </div>
        <div className={styles["card-body"]}>
          <div className={styles["danger-list"]}>
            {DANGER_ACTIONS.map((action) => (
              <div key={action.action} className={styles["danger-row"]}>
                <div className={styles["danger-info"]}>
                  <strong>{action.label}</strong>
                  <span>{action.desc}</span>
                </div>
                <button
                  className={`${styles.btn} ${styles[action.variant]}`}
                  onClick={() => handleDangerAction(action.action)}
                  aria-label={action.label}
                >
                  {action.icon} {action.label.split(" ")[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
