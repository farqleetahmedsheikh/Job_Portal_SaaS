/** @format */
"use client";

import { useState, useCallback } from "react";
import { api }              from "../lib";
import { API_BASE }         from "../constants";
import type { SessionUser } from "../store/session.store";

export interface EmployerProfileForm {
  fullName: string;
  email:    string;
  phone:    string;
  bio:      string;
}

function buildForm(user: SessionUser): EmployerProfileForm {
  return {
    fullName: user.fullName ?? "",
    email:    user.email    ?? "",
    phone:    user.phone    ?? "",
    bio:      user.bio      ?? "",
  };
}

interface Options {
  user:    SessionUser;
  setUser: (u: SessionUser) => void;
}

export function useEmployerProfile({ user, setUser }: Options) {
  const initial = buildForm(user);

  const [form,        setForm]        = useState<EmployerProfileForm>(initial);
  const [draft,       setDraft]       = useState<EmployerProfileForm>(initial);
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    [],
  );

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
        fullName: draft.fullName || undefined,
        phone:    draft.phone    || undefined,
        bio:      draft.bio      || undefined,
      });
      setUser(updated);
      setForm(draft);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [draft, setUser]);

  return {
    form, draft,
    editing, saving, saved, serverError,
    handleChange, handleEdit, handleCancel, handleSave,
  };
}