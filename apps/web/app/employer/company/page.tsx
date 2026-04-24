/** @format */
"use client";

import { useRef, useMemo } from "react";
import {
  Building2,
  MapPin,
  Globe,
  Briefcase,
  Users,
  Calendar,
  Linkedin,
  Twitter,
  Instagram,
  Check,
  X,
  Camera,
  ShieldCheck,
  Plus,
  Loader,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useCompany } from "../../hooks/useCompany";
import { StatusBanners } from "../../components/ui/StatusBanners";
import { ProfileHeader } from "../../components/ui/ProfileHeader";
import { COMPANY_SIZES, INDUSTRIES } from "../../types/company.types";
import styles from "../styles/company.module.css";
import Image from "next/image";

// ── Profile completeness ──────────────────────────────────────────────────────
// const COMPLETENESS_FIELDS: {
//   key: keyof ReturnType<
//     (typeof import("../../types/company.types"))["buildForm"] extends infer F
//       ? F
//       : never
//   >;
//   label: string;
// }[] = [];

// Defined as a pure function so it can be called with the form object
function calcCompleteness(
  form: Record<string, string>,
  perksLen: number,
): number {
  const fields = [
    form.companyName,
    form.industry,
    form.location,
    form.websiteUrl,
    form.description,
    form.tagline,
    form.size,
    form.foundedYear,
  ];
  const filled = fields.filter(Boolean).length;
  const perkBonus = perksLen > 0 ? 1 : 0;
  return Math.round(((filled + perkBonus) / (fields.length + 1)) * 100);
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({
  label,
  icon,
  name,
  value,
  draftValue,
  editing,
  onChange,
  type = "text",
  textarea,
  hint,
  span,
  maxLength,
}: {
  label: string;
  icon?: React.ReactNode;
  name: string;
  value: string;
  draftValue: string;
  editing: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  type?: string;
  textarea?: boolean;
  hint?: string;
  span?: boolean;
  maxLength?: number;
}) {
  return (
    <div
      className={[styles.field, span ? styles.spanTwo : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <label className={styles.label} htmlFor={name}>
        {icon && <span className={styles.labelIcon}>{icon}</span>}
        {label}
      </label>
      {hint && <p className={styles.hint}>{hint}</p>}
      {editing ? (
        <div className={styles.inputWrap}>
          {textarea ? (
            <textarea
              id={name}
              name={name}
              className={styles.textarea}
              rows={4}
              value={draftValue}
              onChange={onChange}
              maxLength={maxLength}
            />
          ) : (
            <input
              id={name}
              name={name}
              type={type}
              className={styles.input}
              value={draftValue}
              onChange={onChange}
              maxLength={maxLength}
            />
          )}
          {maxLength && (
            <span className={styles.charCount}>
              {draftValue.length}/{maxLength}
            </span>
          )}
        </div>
      ) : (
        <div className={`${styles.value} ${!value ? styles.valueEmpty : ""}`}>
          {value || "Not set"}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CompanyPage() {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useCompany();

  console.log("CompanyPage render", { company, form, draft, perks });

  // ── Profile completeness ──────────────────────────────────────────────────
  const completeness = useMemo(
    () =>
      form
        ? calcCompleteness(
            form as unknown as Record<string, string>,
            perks.length,
          )
        : 0,
    [form, perks.length],
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.page}>
        {[200, 360, 180].map((h, i) => (
          <div key={i} className={styles.skeleton} style={{ height: h }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <AlertCircle size={32} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!company || !form || !draft) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <Building2 size={40} />
          <p>No company profile yet</p>
          <span>Complete your registration to set up your company</span>
        </div>
      </div>
    );
  }

  const isVerified = company.verificationStatus === "verified";

  return (
    <div className={styles.page}>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <ProfileHeader
        editing={editing}
        saving={saving}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <StatusBanners saved={saved} serverError={serverError} />

      {/* FIX: was styles["banner-error"] — class didn't exist in CSS */}
      {logoError && (
        <div className={styles.bannerError}>
          <AlertCircle size={14} /> {logoError}
        </div>
      )}
      {coverError && (
        <div className={styles.bannerError}>
          <AlertCircle size={14} /> {coverError}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleLogoUpload(f);
          e.target.value = "";
        }}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleCoverUpload(f);
          e.target.value = "";
        }}
      />

      {/* ── Hero card: Cover + Logo + Meta ──────────────────────────────── */}
      <div
        className={`${styles.card} ${isVerified ? styles.cardVerified : ""}`}
      >
        {/* Verified shimmer strip at top of card */}
        {isVerified && <div className={styles.verifiedStrip} />}

        {/* Cover */}
        <div className={styles.coverWrap}>
          {company.coverUrl ? (
            <img
              src={company.coverUrl}
              alt="Company cover"
              className={`${styles.cover} ${coverUploading ? styles.uploading : ""}`}
            />
          ) : (
            <div className={styles.coverPlaceholder}>
              {isVerified && <div className={styles.coverVerifiedOverlay} />}
            </div>
          )}

          {/* Verified badge on cover */}
          {isVerified && (
            <div className={styles.coverVerifiedBadge}>
              <ShieldCheck size={12} />
              <span>Verified Business</span>
            </div>
          )}

          {editing && (
            <button
              className={styles.coverEditBtn}
              aria-label="Change cover photo"
              disabled={coverUploading}
              onClick={() => coverInputRef.current?.click()}
            >
              {coverUploading ? (
                <>
                  <Loader size={13} className={styles.spin} /> Uploading…
                </>
              ) : (
                <>
                  <Camera size={13} /> Change cover
                </>
              )}
            </button>
          )}
        </div>

        {/* Logo row */}
        <div className={styles.logoRow}>
          {/* Logo with verified ring */}
          <div
            className={`${styles.logoWrap} ${isVerified ? styles.logoVerified : ""}`}
          >
            {company.logoUrl ? (
              <Image
                src={company.logoUrl}
                alt={form.companyName}
                className={`${styles.logo} ${logoUploading ? styles.uploading : ""}`}
                width={80}
                height={80}
              />
            ) : (
              <div className={styles.logoFallback}>
                {form.companyName?.[0]?.toUpperCase() ?? "C"}
              </div>
            )}
            {isVerified && (
              <div className={styles.verifiedRing} aria-hidden="true" />
            )}
            {editing && (
              <button
                className={styles.logoEditBtn}
                aria-label="Change company logo"
                disabled={logoUploading}
                onClick={() => logoInputRef.current?.click()}
              >
                {logoUploading ? (
                  <Loader size={11} className={styles.spin} />
                ) : (
                  <Camera size={11} />
                )}
              </button>
            )}
          </div>

          {/* Company meta */}
          <div className={styles.logoMeta}>
            <h2 className={styles.companyName}>
              {form.companyName}
              {isVerified && (
                <span className={styles.verifiedBadge}>
                  <ShieldCheck size={12} />
                  Verified
                </span>
              )}
            </h2>
            <p className={styles.companySubtitle}>
              {[form.industry, form.location].filter(Boolean).join(" · ") ||
                "Add your industry and location"}
            </p>
          </div>

          {/* Profile completeness */}
          <div className={styles.completenessWrap}>
            <div className={styles.completenessLabel}>
              <Sparkles size={11} />
              Profile strength
              <strong>{completeness}%</strong>
            </div>
            <div className={styles.completenessTrack}>
              <div
                className={styles.completenessFill}
                style={{ width: `${completeness}%` }}
                data-level={
                  completeness >= 80
                    ? "high"
                    : completeness >= 50
                      ? "mid"
                      : "low"
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Basic Information ────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Basic Information</h2>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.formGrid}>
            <Field
              label="Company Name"
              icon={<Building2 size={11} />}
              name="companyName"
              value={form.companyName}
              draftValue={draft.companyName}
              editing={editing}
              onChange={handleChange}
            />

            <div className={styles.field}>
              <label className={styles.label} htmlFor="industry">
                <span className={styles.labelIcon}>
                  <Briefcase size={11} />
                </span>
                Industry
              </label>
              {editing ? (
                <select
                  id="industry"
                  name="industry"
                  className={styles.select}
                  value={draft.industry}
                  onChange={handleChange}
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className={`${styles.value} ${!form.industry ? styles.valueEmpty : ""}`}
                >
                  {form.industry || "Not set"}
                </div>
              )}
            </div>

            <Field
              label="Location"
              icon={<MapPin size={11} />}
              name="location"
              value={form.location}
              draftValue={draft.location}
              editing={editing}
              onChange={handleChange}
            />

            <Field
              label="Website"
              icon={<Globe size={11} />}
              name="websiteUrl"
              value={form.websiteUrl}
              draftValue={draft.websiteUrl}
              editing={editing}
              onChange={handleChange}
              type="url"
            />

            <div className={styles.field}>
              <label className={styles.label} htmlFor="size">
                <span className={styles.labelIcon}>
                  <Users size={11} />
                </span>
                Company Size
              </label>
              {editing ? (
                <select
                  id="size"
                  name="size"
                  className={styles.select}
                  value={draft.size}
                  onChange={handleChange}
                >
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className={`${styles.value} ${!form.size ? styles.valueEmpty : ""}`}
                >
                  {COMPANY_SIZES.find((s) => s.value === form.size)?.label ||
                    "Not set"}
                </div>
              )}
            </div>

            <Field
              label="Founded Year"
              icon={<Calendar size={11} />}
              name="foundedYear"
              value={form.foundedYear}
              draftValue={draft.foundedYear}
              editing={editing}
              onChange={handleChange}
              type="number"
            />

            <Field
              label="Tagline"
              name="tagline"
              value={form.tagline}
              draftValue={draft.tagline}
              editing={editing}
              onChange={handleChange}
              span
              hint="A short catchy line shown on your public profile"
              maxLength={120}
            />

            <Field
              label="About"
              name="description"
              value={form.description}
              draftValue={draft.description}
              editing={editing}
              onChange={handleChange}
              textarea
              span
              hint="Describe your company mission and what you do"
              maxLength={1000}
            />

            <Field
              label="Culture & Values"
              name="culture"
              value={form.culture}
              draftValue={draft.culture}
              editing={editing}
              onChange={handleChange}
              textarea
              span
              hint="What makes your company a great place to work"
              maxLength={800}
            />
          </div>
        </div>
      </div>

      {/* ── Social Links ─────────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Social Links</h2>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.formGrid}>
            <Field
              label="LinkedIn"
              icon={<Linkedin size={11} />}
              name="linkedinUrl"
              value={form.linkedinUrl}
              draftValue={draft.linkedinUrl}
              editing={editing}
              onChange={handleChange}
              type="url"
            />
            <Field
              label="Twitter / X"
              icon={<Twitter size={11} />}
              name="twitterUrl"
              value={form.twitterUrl}
              draftValue={draft.twitterUrl}
              editing={editing}
              onChange={handleChange}
              type="url"
            />
            <Field
              label="Instagram"
              icon={<Instagram size={11} />}
              name="instagramUrl"
              value={form.instagramUrl}
              draftValue={draft.instagramUrl}
              editing={editing}
              onChange={handleChange}
              type="url"
            />
          </div>
        </div>
      </div>

      {/* ── Perks & Benefits ─────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Perks &amp; Benefits</h2>
            <p className={styles.cardSubtitle}>
              Shown on your job listings to attract candidates
            </p>
          </div>
          <span className={styles.perkCount}>{perks.length}/20</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.perkTags}>
            {perks.map((p) => (
              <span key={p.id} className={styles.perkTag}>
                {p.perk}
                {/* FIX: was passing object p to removePerk — now correctly passed */}
                {/* FIX: aria-label was `Remove ${p}` → "[object Object]" */}
                <button
                  className={styles.perkRemove}
                  onClick={() => removePerk(p)}
                  aria-label={`Remove ${p.perk}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {perks.length === 0 && (
              <span className={styles.perkEmpty}>
                No perks added yet — add some to stand out to candidates
              </span>
            )}
          </div>

          <div className={styles.perkInputRow}>
            <input
              className={styles.input}
              placeholder="e.g. Health insurance, Remote work, Stock options"
              value={perkInput}
              onChange={(e) => setPerkInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPerk();
                }
              }}
              disabled={perks.length >= 20}
            />
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={addPerk}
              disabled={!perkInput.trim() || perks.length >= 20}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <button
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSavePerks}`}
            onClick={savePerks}
            disabled={perkSaving}
            aria-busy={perkSaving}
          >
            {perkSaving ? (
              <>
                <span className={styles.spinner} /> Saving…
              </>
            ) : (
              <>
                <Check size={14} /> Save Perks
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
