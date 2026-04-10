/** @format */
"use client";

import { useState, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type { SessionUser } from "../store/session.store";
import type {
  ProfileForm,
  PrivacyForm,
  NotificationsForm,
  Education,
  Experience,
} from "../types/profile.types";

// ── Builders ──────────────────────────────────────────────────────────────────
function buildProfileForm(user: SessionUser): ProfileForm {
  const ap = user.applicantProfile;
  return {
    fullName: user.fullName ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    jobTitle: ap?.jobTitle ?? "",
    location: ap?.location ?? "",
    experienceYears: String(ap?.experienceYears ?? ""),
    skills: ap?.skills?.join(", ") ?? "",
    summary: ap?.summary ?? "",
    linkedinUrl: ap?.linkedinUrl ?? "",
    githubUrl: ap?.githubUrl ?? "",
    portfolioUrl: ap?.portfolioUrl ?? "",
    // ── Arrays ──────────────────────────────────────────────────────────────
    educations: (ap?.educations as Education[]) ?? [],
    experiences: (ap?.experiences as Experience[]) ?? [],
  };
}

function buildPrivacyForm(user: SessionUser): PrivacyForm {
  const ap = user.applicantProfile;
  return {
    openToWork: ap?.openToWork ?? true,
    isOpenToWork: ap?.isOpenToWork ?? false,
    isPublic: ap?.isPublic ?? true,
    recruitersOnly: ap?.recruitersOnly ?? false,
    showEmail: ap?.showEmail ?? false,
    showPhone: ap?.showPhone ?? false,
    activityVisible: ap?.activityVisible ?? true,
  };
}

function buildNotificationsForm(user: SessionUser): NotificationsForm {
  const ap = user.applicantProfile;
  return {
    notifEmailApplications: ap?.notifEmailApplications ?? true,
    notifEmailMessages: ap?.notifEmailMessages ?? true,
    notifEmailDigest: ap?.notifEmailDigest ?? false,
    notifEmailMarketing: ap?.notifEmailMarketing ?? false,
    notifPushApplications: ap?.notifPushApplications ?? true,
    notifPushMessages: ap?.notifPushMessages ?? true,
    notifPushReminders: ap?.notifPushReminders ?? true,
    notifPushJobAlerts: ap?.notifPushJobAlerts ?? false,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
interface Options {
  user: SessionUser;
  setUser: (u: SessionUser) => void;
}

export function useProfileForm({ user, setUser }: Options) {
  const [form, setForm] = useState<ProfileForm>(buildProfileForm(user));
  const [draft, setDraft] = useState<ProfileForm>(buildProfileForm(user));
  const [privacy, setPrivacy] = useState<PrivacyForm>(buildPrivacyForm(user));
  const [notifications, setNotifications] = useState<NotificationsForm>(
    buildNotificationsForm(user),
  );

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // ── Field changes — accepts both native events AND direct (name, value) calls
  // EducationField / ExperienceField call: handleChange("educations", [...])
  // Regular inputs call:                  handleChange(event)
  const handleChange = useCallback(
    (
      nameOrEvent:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | string,
      value?: unknown,
    ) => {
      if (typeof nameOrEvent === "string") {
        // Direct call from array components: handleChange("educations", [...])
        setDraft((prev) => ({ ...prev, [nameOrEvent]: value }));
      } else {
        // Native event from text inputs
        const { name, value: val } = nameOrEvent.target;
        setDraft((prev) => ({ ...prev, [name]: val }));
      }
    },
    [],
  );

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarUpload = useCallback(
    async (file: File) => {
      setAvatarUploading(true);
      setAvatarError(null);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`${API_BASE}/users/me/avatar`, {
          method: "PATCH",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message ?? "Avatar upload failed");
        }
        const updated: SessionUser = await res.json();
        setUser(updated);
      } catch (err) {
        setAvatarError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setAvatarUploading(false);
      }
    },
    [setUser],
  );

  // ── Toggle changes — optimistic, saves immediately ────────────────────────
  const handlePrivacyToggle = useCallback(
    async (name: keyof PrivacyForm) => {
      const next = !privacy[name];
      setPrivacy((prev) => ({ ...prev, [name]: next }));
      try {
        const updated = await api<SessionUser>(
          `${API_BASE}/users/me`,
          "PATCH",
          { [name]: next },
        );
        setUser(updated);
      } catch {
        setPrivacy((prev) => ({ ...prev, [name]: !next }));
      }
    },
    [privacy, setUser],
  );

  const handleNotifToggle = useCallback(
    async (name: keyof NotificationsForm) => {
      const next = !notifications[name];
      setNotifications((prev) => ({ ...prev, [name]: next }));
      try {
        const updated = await api<SessionUser>(
          `${API_BASE}/users/me`,
          "PATCH",
          { [name]: next },
        );
        setUser(updated);
      } catch {
        setNotifications((prev) => ({ ...prev, [name]: !next }));
      }
    },
    [notifications, setUser],
  );

  // ── Edit / cancel / save ──────────────────────────────────────────────────
  const handleEdit = useCallback(() => {
    setDraft(form);
    setServerError(null);
    setEditing(true);
  }, [form]);

  const handleCancel = useCallback(() => {
    setDraft(form);
    setServerError(null);
    setEditing(false);
  }, [form]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setServerError(null);
    try {
      const updated = await api<SessionUser>(`${API_BASE}/users/me`, "PATCH", {
        // User table
        fullName: draft.fullName || undefined,
        phone: draft.phone || undefined,
        bio: draft.bio || undefined,
        // Applicant profile — backend ignores for employers
        jobTitle: draft.jobTitle || undefined,
        location: draft.location || undefined,
        summary: draft.summary || undefined,
        linkedinUrl: draft.linkedinUrl || undefined,
        githubUrl: draft.githubUrl || undefined,
        portfolioUrl: draft.portfolioUrl || undefined,
        experienceYears: draft.experienceYears
          ? Number(draft.experienceYears)
          : undefined,
        skills: draft.skills
          ? draft.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        // ── Arrays — send as-is, already structured ────────────────────────
        educations: draft.educations?.length ? draft.educations : undefined,
        experiences: draft.experiences?.length ? draft.experiences : undefined,
      });

      setUser(updated);
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
  }, [draft, setUser]);

  return {
    form,
    draft,
    handleChange,
    handleEdit,
    handleCancel,
    handleSave,
    avatarUploading,
    avatarError,
    handleAvatarUpload,
    privacy,
    handlePrivacyToggle,
    notifications,
    handleNotifToggle,
    editing,
    saving,
    saved,
    serverError,
  };
}
