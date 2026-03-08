/** @format */
"use client";

import { useState } from "react";
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
} from "lucide-react";
import styles from "../../styles/profile.module.css";
import { User as UserType } from "../../types/user";

interface Props {
  user: UserType;
}

interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  jobTitle: string;
}

export default function ProfilePage () {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const userData = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : {};

  const [form, setForm] = useState<ProfileForm>({
    fullName: userData.fullName ?? "",
    email: userData.email ?? "",
    phone: "",
    location: "",
    bio: "",
    jobTitle: "",
  });

  const [draft, setDraft] = useState<ProfileForm>(form);

  const initials = form.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => setDraft((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = () => {
    setForm(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setDraft(form);
    setEditing(false);
  };

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles["page-header"]}>
        <div>
          <h1 className={styles["page-title"]}>My Profile</h1>
          <p className={styles["page-subtitle"]}>
            Manage your personal information and account settings
          </p>
        </div>
        {!editing ? (
          <button
            className={`${styles.btn} ${styles["btn-primary"]}`}
            onClick={() => setEditing(true)}
          >
            <Edit2 size={14} /> Edit Profile
          </button>
        ) : (
          <div className={styles["form-actions"]}>
            <button
              className={`${styles.btn} ${styles["btn-ghost"]}`}
              onClick={handleCancel}
            >
              <X size={14} /> Cancel
            </button>
            <button
              className={`${styles.btn} ${styles["btn-primary"]}`}
              onClick={handleSave}
            >
              <Check size={14} /> Save Changes
            </button>
          </div>
        )}
      </div>

      {/* ── Save banner ── */}
      {saved && (
        <div className={styles["save-banner"]}>
          <Check size={16} /> Profile updated successfully
        </div>
      )}

      {/* ── Personal info card ── */}
      <div className={styles.card}>
        {/* Avatar row */}
        <div className={styles["avatar-section"]}>
          <div className={styles["avatar-wrap"]}>
            {userData?.avatar ? (
              <img
                src={userData?.avatar}
                alt={form.fullName}
                className={styles["avatar-img"]}
              />
            ) : (
              <div className={styles["avatar-fallback"]}>{initials}</div>
            )}
            {editing && (
              <button
                className={styles["avatar-upload-btn"]}
                title="Change photo"
              >
                <Camera size={12} />
              </button>
            )}
          </div>
          <div className={styles["avatar-info"]}>
            <span className={styles["avatar-name"]}>
              {form.fullName || "Your Name"}
            </span>
            <span className={styles["avatar-role"]}>
              {userData?.role.charAt(0) + userData?.role.slice(1).toLowerCase()}
            </span>
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
            {/* Full name */}
            <div className={styles.field}>
              <label className={styles.label}>
                <User size={11} style={{ display: "inline", marginRight: 4 }} />
                Full Name
              </label>
              {editing ? (
                <input
                  className={styles.input}
                  name="fullName"
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

            {/* Job title */}
            <div className={styles.field}>
              <label className={styles.label}>
                <Briefcase
                  size={11}
                  style={{ display: "inline", marginRight: 4 }}
                />
                Job Title
              </label>
              {editing ? (
                <input
                  className={styles.input}
                  name="jobTitle"
                  value={draft.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g. Frontend Developer"
                />
              ) : (
                <div
                  className={`${styles.value} ${!form.jobTitle ? styles.empty : ""}`}
                >
                  {form.jobTitle || "Not set"}
                </div>
              )}
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label}>
                <Mail size={11} style={{ display: "inline", marginRight: 4 }} />
                Email Address
              </label>
              {editing ? (
                <input
                  className={styles.input}
                  name="email"
                  type="email"
                  value={draft.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
              ) : (
                <div
                  className={styles.value}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {form.email || <span className={styles.empty}>Not set</span>}
                  {form.email && (
                    <span
                      className={`${styles.badge} ${styles["badge-verified"]}`}
                    >
                      <ShieldCheck size={11} /> Verified
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Phone */}
            <div className={styles.field}>
              <label className={styles.label}>
                <Phone
                  size={11}
                  style={{ display: "inline", marginRight: 4 }}
                />
                Phone Number
              </label>
              {editing ? (
                <input
                  className={styles.input}
                  name="phone"
                  type="tel"
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

            {/* Location */}
            <div className={`${styles.field} ${styles["span-2"]}`}>
              <label className={styles.label}>
                <MapPin
                  size={11}
                  style={{ display: "inline", marginRight: 4 }}
                />
                Location
              </label>
              {editing ? (
                <input
                  className={styles.input}
                  name="location"
                  value={draft.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              ) : (
                <div
                  className={`${styles.value} ${!form.location ? styles.empty : ""}`}
                >
                  {form.location || "Not set"}
                </div>
              )}
            </div>

            {/* Bio */}
            <div className={`${styles.field} ${styles["span-2"]}`}>
              <label className={styles.label}>Bio</label>
              {editing ? (
                <textarea
                  className={styles.textarea}
                  name="bio"
                  value={draft.bio}
                  onChange={handleChange}
                  placeholder="A short bio about yourself..."
                />
              ) : (
                <div
                  className={`${styles.value} ${!form.bio ? styles.empty : ""}`}
                >
                  {form.bio || "No bio added yet"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className={styles.card}>
        <div className={styles["card-header"]}>
          <h2 className={styles["card-title"]}>
            <AlertTriangle size={16} style={{ color: "#f43f5e" }} />
            Account
          </h2>
        </div>
        <div className={styles["card-body"]}>
          <div className={styles["danger-list"]}>
            <div className={styles["danger-row"]}>
              <div className={styles["danger-info"]}>
                <strong>Change Password</strong>
                <span>Update your password to keep your account secure</span>
              </div>
              <button className={`${styles.btn} ${styles["btn-ghost"]}`}>
                <Lock size={14} /> Change
              </button>
            </div>

            <div className={styles["danger-row"]}>
              <div className={styles["danger-info"]}>
                <strong>Delete Account</strong>
                <span>
                  Permanently remove your account and all associated data
                </span>
              </div>
              <button className={`${styles.btn} ${styles["btn-danger"]}`}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
