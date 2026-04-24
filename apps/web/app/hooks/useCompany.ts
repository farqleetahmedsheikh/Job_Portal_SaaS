/** @format */
"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../lib";
import { API_BASE } from "../constants";
import type { Company, CompanyForm } from "../types/company.types";

// ── Perk type — exported so page.tsx can import it ────────────────────────────
// FIX: was string[] — API returns {id, perk}[] objects
export interface Perk {
  id: string;
  perk: string;
}

function buildForm(c: Company): CompanyForm {
  return {
    companyName: c.companyName ?? "",
    industry: c.industry ?? "",
    location: c.location ?? "",
    websiteUrl: c.websiteUrl ?? "",
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

// ── Shared multipart uploader ─────────────────────────────────────────────────
async function uploadImage(url: string, file: File): Promise<Company> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string })?.message ?? "Upload failed");
  }

  return res.json() as Promise<Company>;
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

  // FIX: was string[] — API returns {id, perk}[] objects
  const [perks, setPerks] = useState<Perk[]>([]);
  const [perkInput, setPerkInput] = useState("");
  const [perkSaving, setPerkSaving] = useState(false);

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

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
          // FIX: c.perks from API is {id, perk}[] — cast correctly
          setPerks((c.perks as unknown as Perk[]) ?? []);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load company",
          );
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
          websiteUrl: draft.websiteUrl || undefined,
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

  // ── Logo upload ───────────────────────────────────────────────────────────
  const handleLogoUpload = useCallback(
    async (file: File) => {
      if (!company) return;
      setLogoUploading(true);
      setLogoError(null);
      try {
        const updated = await uploadImage(
          `${API_BASE}/companies/${company.id}/logo`,
          file,
        );
        setCompany(updated);
      } catch (err) {
        setLogoError(err instanceof Error ? err.message : "Logo upload failed");
      } finally {
        setLogoUploading(false);
      }
    },
    [company],
  );

  // ── Cover upload ──────────────────────────────────────────────────────────
  const handleCoverUpload = useCallback(
    async (file: File) => {
      if (!company) return;
      setCoverUploading(true);
      setCoverError(null);
      try {
        const updated = await uploadImage(
          `${API_BASE}/companies/${company.id}/cover`,
          file,
        );
        setCompany(updated);
      } catch (err) {
        setCoverError(
          err instanceof Error ? err.message : "Cover upload failed",
        );
      } finally {
        setCoverUploading(false);
      }
    },
    [company],
  );

  // ── Perks ─────────────────────────────────────────────────────────────────

  // FIX: was pushing raw string — now creates a proper Perk object
  const addPerk = useCallback(() => {
    const text = perkInput.trim();
    if (!text || perks.some((p) => p.perk === text) || perks.length >= 20)
      return;
    setPerks((prev) => [...prev, { id: `temp-${Date.now()}`, perk: text }]);
    setPerkInput("");
  }, [perkInput, perks]);

  // FIX: was (p: string) filtering by string equality — now takes Perk, filters by id
  const removePerk = useCallback((perk: Perk) => {
    setPerks((prev) => prev.filter((p) => p.id !== perk.id));
  }, []);

  // FIX: backend receives string[] — map Perk objects to their perk strings
  const savePerks = useCallback(async () => {
    if (!company) return;
    setPerkSaving(true);
    try {
      await api(`${API_BASE}/companies/${company.id}/perks`, "PATCH", {
        perks: perks.map((p) => p.perk),
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
    logoUploading,
    logoError,
    handleLogoUpload,
    coverUploading,
    coverError,
    handleCoverUpload,
    perks,
    perkInput,
    setPerkInput,
    perkSaving,
    addPerk,
    removePerk,
    savePerks,
  };
}
