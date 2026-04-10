/** @format */
"use client";

import { useRef } from "react";
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
} from "lucide-react";
import { useCompany } from "../../hooks/useCompany";
import { StatusBanners } from "../../components/ui/StatusBanners";
import { ProfileHeader } from "../../components/ui/ProfileHeader";
import { COMPANY_SIZES, INDUSTRIES } from "../../types/company.types";
import styles from "../styles/company.module.css";
import Image from "next/image";

// ── Inline field — company page uses company.module.css, not profile ──────────
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
}) {
  return (
    <div
      className={[styles.field, span ? styles["span-2"] : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <label className={styles.label} htmlFor={name}>
        {icon} {label}
      </label>
      {hint && <p className={styles.hint}>{hint}</p>}
      {editing ? (
        textarea ? (
          <textarea
            id={name}
            name={name}
            className={styles.textarea}
            rows={4}
            value={draftValue}
            onChange={onChange}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            className={styles.input}
            value={draftValue}
            onChange={onChange}
          />
        )
      ) : (
        <div className={`${styles.value} ${!value ? styles.empty : ""}`}>
          {value || "Not set"}
        </div>
      )}
    </div>
  );
}

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
  console.log("PERKS---------->", perks);
  console.log("COMPANY---------->", company);
  // ── Loading / error / empty states ───────────────────────────────────────
  if (loading)
    return (
      <div className={styles.page}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={styles.skeleton}
            style={{ height: 140, marginBottom: 16 }}
          />
        ))}
      </div>
    );

  if (error)
    return (
      <div className={styles.page}>
        <p className={styles.errorMsg}>{error}</p>
      </div>
    );

  if (!company || !form || !draft)
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <Building2 size={40} />
          <p>No company profile yet</p>
          <span>Complete your registration to set up your company</span>
        </div>
      </div>
    );

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <ProfileHeader
        editing={editing}
        saving={saving}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        // title="Company Profile"
        // subtitle="Manage your company information visible to candidates"
      />

      <StatusBanners saved={saved} serverError={serverError} />

      {/* Upload errors */}
      {logoError && <div className={styles["banner-error"]}>⚠ {logoError}</div>}
      {coverError && (
        <div className={styles["banner-error"]}>⚠ {coverError}</div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLogoUpload(file);
          e.target.value = "";
        }}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCoverUpload(file);
          e.target.value = "";
        }}
      />

      {/* ── Cover + Logo ────────────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.coverWrap}>
          {company.coverUrl ? (
            <Image
              src={company.coverUrl}
              alt="Cover"
              className={`${styles.cover} ${coverUploading ? styles["uploading"] : ""}`}
            />
          ) : (
            <div className={styles.coverPlaceholder} />
          )}
          {editing && (
            <button
              className={styles.coverEditBtn}
              aria-label="Change cover"
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

        <div className={styles.logoRow}>
          <div className={styles.logoWrap}>
            {company.logoUrl ? (
              <Image
                src={company.logoUrl}
                alt={form.companyName}
                className={`${styles.logo} ${logoUploading ? styles["uploading"] : ""}`}
                width={100}
                height={100}
              />
            ) : (
              <div className={styles.logoFallback}>
                {form.companyName?.[0]?.toUpperCase() ?? "C"}
              </div>
            )}
            {editing && (
              <button
                className={styles.logoEditBtn}
                aria-label="Change logo"
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

          <div className={styles.logoMeta}>
            <h2 className={styles.companyName}>
              {form.companyName}
              {company.isVerified && (
                <span className={styles.verifiedBadge}>
                  <ShieldCheck size={13} /> Verified
                </span>
              )}
            </h2>
            <p className={styles.companySubtitle}>
              {[form.industry, form.location].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Basic Info ──────────────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles["card-header"]}>
          <h2 className={styles["card-title"]}>Basic Information</h2>
        </div>
        <div className={styles["card-body"]}>
          <div className={styles["form-grid"]}>
            <Field
              label="Company Name"
              icon={<Building2 size={11} />}
              name="companyName"
              value={form.companyName}
              draftValue={draft.companyName}
              editing={editing}
              onChange={handleChange}
            />

            {/* Industry — select when editing */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="industry">
                <Briefcase size={11} /> Industry
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
                  className={`${styles.value} ${!form.industry ? styles.empty : ""}`}
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

            {/* Company size — select when editing */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="size">
                <Users size={11} /> Company Size
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
                  className={`${styles.value} ${!form.size ? styles.empty : ""}`}
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
            />
          </div>
        </div>
      </div>

      {/* ── Social Links ────────────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles["card-header"]}>
          <h2 className={styles["card-title"]}>Social Links</h2>
        </div>
        <div className={styles["card-body"]}>
          <div className={styles["form-grid"]}>
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

      {/* ── Perks & Benefits ────────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles["card-header"]}>
          <h2 className={styles["card-title"]}>Perks &amp; Benefits</h2>
          <p className={styles["card-subtitle"]}>
            Shown on your job listings to attract candidates
          </p>
        </div>
        <div className={styles["card-body"]}>
          <div className={styles.perkTags}>
            {perks.map((p) => (
              <span key={p.id} className={styles.perkTag}>
                {p.perk}
                <button
                  className={styles.perkRemove}
                  onClick={() => removePerk(p)}
                  aria-label={`Remove ${p}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {perks.length === 0 && (
              <span className={styles.empty}>No perks added yet</span>
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
            />
            <button
              className={`${styles.btn} ${styles["btn-ghost"]}`}
              onClick={addPerk}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <button
            className={`${styles.btn} ${styles["btn-primary"]}`}
            style={{ marginTop: 12 }}
            onClick={savePerks}
            disabled={perkSaving}
            aria-busy={perkSaving}
          >
            {perkSaving ? (
              <>
                <span className={styles.spinner} /> Saving...
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
