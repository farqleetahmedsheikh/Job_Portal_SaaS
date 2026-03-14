/** @format */
"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type { Company, CompanyForm } from "../types/company.types";

function buildForm(c: Company): CompanyForm {
  return {
    companyName: c.companyName ?? "",
    industry: c.industry ?? "",
    location: c.location ?? "",
    website: c.website ?? "",
    description: c.description ?? "",
    tagline: c.tagline ?? "",
    culture: c.culture ?? "",
    size: c.size ?? "",
    foundedYear: c.foundedYear ? String(c.foundedYear) : "",
    linkedinUrl: c.linkedinUrl ?? "",
    twitterUrl: c.twitterUrl ?? "",
    instagramUrl: c.instagramUrl ?? "",
  };
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [form, setForm] = useState<CompanyForm | null>(null);
  const [draft, setDraft] = useState<CompanyForm | null>(null);

  // Perks — managed separately (full replace on save)
  const [perks, setPerks] = useState<string[]>([]);
  const [perkInput, setPerkInput] = useState("");
  const [perkSaving, setPerkSaving] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api<Company[]>(`${API_BASE}/companies/me`, "GET")
      .then((data) => {
        if (cancelled) return;
        const c = data[0] ?? null;
        setCompany(c);
        if (c) {
          setForm(buildForm(c));
          setDraft(buildForm(c));
          setPerks(c.perks ?? []);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Field change ──────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setDraft((prev) =>
        prev ? { ...prev, [e.target.name]: e.target.value } : prev,
      ),
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

  // ── Save company fields ───────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!company || !draft) return;
    setSaving(true);
    setServerError(null);
    try {
      const updated = await api<Company>(
        `${API_BASE}/companies/${company.id}`,
        "PATCH",
        {
          companyName: draft.companyName || undefined,
          industry: draft.industry || undefined,
          location: draft.location || undefined,
          website: draft.website || undefined,
          description: draft.description || undefined,
          tagline: draft.tagline || undefined,
          culture: draft.culture || undefined,
          size: draft.size || undefined,
          foundedYear: draft.foundedYear
            ? Number(draft.foundedYear)
            : undefined,
          linkedinUrl: draft.linkedinUrl || undefined,
          twitterUrl: draft.twitterUrl || undefined,
          instagramUrl: draft.instagramUrl || undefined,
        },
      );
      setCompany(updated);
      const f = buildForm(updated);
      setForm(f);
      setDraft(f);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [company, draft]);

  // ── Perks ─────────────────────────────────────────────────────────────────
  const addPerk = useCallback(() => {
    const p = perkInput.trim();
    if (!p || perks.includes(p) || perks.length >= 20) return;
    setPerks((prev) => [...prev, p]);
    setPerkInput("");
  }, [perkInput, perks]);

  const removePerk = useCallback((p: string) => {
    setPerks((prev) => prev.filter((x) => x !== p));
  }, []);

  const savePerks = useCallback(async () => {
    if (!company) return;
    setPerkSaving(true);
    try {
      await api(`${API_BASE}/companies/${company.id}/perks`, "PATCH", {
        perks,
      });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to save perks",
      );
    } finally {
      setPerkSaving(false);
    }
  }, [company, perks]);

  return {
    company,
    form,
    draft,
    loading,
    error,
    editing,
    saving,
    saved,
    serverError,
    handleChange,
    handleEdit,
    handleCancel,
    handleSave,
    // perks
    perks,
    perkInput,
    setPerkInput,
    perkSaving,
    addPerk,
    removePerk,
    savePerks,
  };
}
