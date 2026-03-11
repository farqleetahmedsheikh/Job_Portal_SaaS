/** @format */
"use client";

import { useState } from "react";
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Edit2,
  Save,
  Camera,
  Plus,
  X,
  CheckCircle2,
  Link2,
  Twitter,
  Linkedin,
  Instagram,
  Upload,
  Star,
} from "lucide-react";
import styles from "../styles/company-profile.module.css";

interface CompanyForm {
  name: string;
  tagline: string;
  about: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  founded: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  perks: string[];
  culture: string;
}

const INIT: CompanyForm = {
  name: "Acme Corporation",
  tagline: "Building the future of payments infrastructure",
  about:
    "Acme Corporation is a technology company that builds economic infrastructure for the internet. Businesses of every size use our software to accept payments and manage their businesses online.",
  website: "https://acmecorp.com",
  industry: "Fintech",
  size: "201-500",
  location: "San Francisco, CA",
  founded: "2015",
  linkedin: "linkedin.com/company/acmecorp",
  twitter: "@acmecorp",
  instagram: "@acmecorp",
  perks: [
    "Remote-first culture",
    "Unlimited PTO",
    "Annual team offsite",
    "Home office stipend",
    "$3,000 learning budget",
    "Top-tier health insurance",
  ],
  culture:
    "We believe in moving fast with quality, shipping iteratively, and giving engineers significant ownership over their work. Our team is collaborative, direct, and deeply curious.",
};

export default function CompanyProfilePage() {
  const [form, setForm] = useState<CompanyForm>(INIT);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [perkInput, setPerkInput] = useState("");
  const [tab, setTab] = useState<"profile" | "perks" | "branding">("profile");

  const set =
    (key: keyof CompanyForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const addPerk = () => {
    const p = perkInput.trim();
    if (p && form.perks.length < 12) {
      setForm((prev) => ({ ...prev, perks: [...prev.perks, p] }));
      setPerkInput("");
    }
  };

  const removePerk = (perk: string) =>
    setForm((prev) => ({
      ...prev,
      perks: prev.perks.filter((p) => p !== perk),
    }));

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Company Profile</h1>
          <p className={styles.subtitle}>
            Manage how your company appears to candidates
          </p>
        </div>
        <div className={styles.headerActions}>
          <a
            href={`https://${form.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.btn} ${styles.btnGhost}`}
          >
            <Globe size={14} /> View public page
          </a>
          {editing ? (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSave}
            >
              <Save size={14} /> Save changes
            </button>
          ) : (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => setEditing(true)}
            >
              <Edit2 size={14} /> Edit profile
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div className={styles.toast}>
          <CheckCircle2 size={13} /> Company profile saved successfully
        </div>
      )}

      {/* Cover + logo */}
      <div className={styles.coverSection}>
        <div className={styles.coverImage}>
          <div className={styles.coverGradient} />
          {editing && (
            <button className={styles.coverEdit}>
              <Camera size={14} /> Change cover
            </button>
          )}
        </div>
        <div className={styles.logoSection}>
          <div className={styles.companyLogo}>
            <span className={styles.logoText}>AC</span>
            {editing && (
              <button className={styles.logoEdit}>
                <Upload size={12} />
              </button>
            )}
          </div>
          <div className={styles.logoInfo}>
            <h2 className={styles.companyName}>{form.name}</h2>
            <p className={styles.companyTagline}>{form.tagline}</p>
            <div className={styles.companyMeta}>
              <span>
                <MapPin size={11} /> {form.location}
              </span>
              <span>
                <Briefcase size={11} /> {form.industry}
              </span>
              <span>
                <Users size={11} /> {form.size} employees
              </span>
              <span>
                <Building2 size={11} /> Founded {form.founded}
              </span>
            </div>
          </div>
          <div className={styles.verifiedBadge}>
            <CheckCircle2 size={14} /> Verified employer
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(
          [
            ["profile", "Profile"],
            ["perks", "Perks & Culture"],
            ["branding", "Branding"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className={styles.content}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>About</h3>
            {editing ? (
              <textarea
                className={styles.textarea}
                rows={5}
                value={form.about}
                onChange={set("about")}
              />
            ) : (
              <p className={styles.prose}>{form.about}</p>
            )}
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Company Details</h3>
            <div className={styles.detailGrid}>
              {editing ? (
                <>
                  <FormRow label="Company name">
                    <input
                      className={styles.input}
                      value={form.name}
                      onChange={set("name")}
                    />
                  </FormRow>
                  <FormRow label="Tagline">
                    <input
                      className={styles.input}
                      value={form.tagline}
                      onChange={set("tagline")}
                    />
                  </FormRow>
                  <FormRow label="Website">
                    <input
                      className={styles.input}
                      value={form.website}
                      onChange={set("website")}
                    />
                  </FormRow>
                  <FormRow label="Industry">
                    <select
                      className={styles.select}
                      value={form.industry}
                      onChange={set("industry")}
                    >
                      {[
                        "Fintech",
                        "SaaS",
                        "E-commerce",
                        "Healthcare",
                        "Education",
                        "AI/ML",
                        "Cybersecurity",
                        "Other",
                      ].map((i) => (
                        <option key={i}>{i}</option>
                      ))}
                    </select>
                  </FormRow>
                  <FormRow label="Company size">
                    <select
                      className={styles.select}
                      value={form.size}
                      onChange={set("size")}
                    >
                      {[
                        "1-10",
                        "11-50",
                        "51-200",
                        "201-500",
                        "501-1000",
                        "1001-5000",
                        "5000+",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </FormRow>
                  <FormRow label="Headquarters">
                    <input
                      className={styles.input}
                      value={form.location}
                      onChange={set("location")}
                    />
                  </FormRow>
                  <FormRow label="Founded">
                    <input
                      className={styles.input}
                      type="number"
                      value={form.founded}
                      onChange={set("founded")}
                    />
                  </FormRow>
                </>
              ) : (
                [
                  {
                    label: "Website",
                    val: (
                      <a
                        href={form.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        {form.website}
                      </a>
                    ),
                  },
                  { label: "Industry", val: form.industry },
                  { label: "Company size", val: `${form.size} employees` },
                  { label: "Location", val: form.location },
                  { label: "Founded", val: form.founded },
                ].map((d) => (
                  <div key={d.label} className={styles.detailRow}>
                    <span className={styles.detailLabel}>{d.label}</span>
                    <span className={styles.detailVal}>{d.val}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Social Links</h3>
            <div className={styles.socialGrid}>
              {editing ? (
                <>
                  <FormRow label="LinkedIn">
                    <input
                      className={styles.input}
                      value={form.linkedin}
                      onChange={set("linkedin")}
                    />
                  </FormRow>
                  <FormRow label="Twitter">
                    {" "}
                    <input
                      className={styles.input}
                      value={form.twitter}
                      onChange={set("twitter")}
                    />
                  </FormRow>
                  <FormRow label="Instagram">
                    <input
                      className={styles.input}
                      value={form.instagram}
                      onChange={set("instagram")}
                    />
                  </FormRow>
                </>
              ) : (
                <>
                  {form.linkedin && (
                    <a
                      href={`https://${form.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                    >
                      <Linkedin size={15} /> {form.linkedin}
                    </a>
                  )}
                  {form.twitter && (
                    <a href="#" className={styles.socialLink}>
                      <Twitter size={15} /> {form.twitter}
                    </a>
                  )}
                  {form.instagram && (
                    <a href="#" className={styles.socialLink}>
                      <Instagram size={15} /> {form.instagram}
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Perks & Culture tab */}
      {tab === "perks" && (
        <div className={styles.content}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Culture</h3>
            {editing ? (
              <textarea
                className={styles.textarea}
                rows={5}
                value={form.culture}
                onChange={set("culture")}
              />
            ) : (
              <p className={styles.prose}>{form.culture}</p>
            )}
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Perks & Benefits</h3>
            <div className={styles.perksGrid}>
              {form.perks.map((perk) => (
                <div key={perk} className={styles.perkItem}>
                  <CheckCircle2
                    size={13}
                    style={{ color: "var(--status-success)", flexShrink: 0 }}
                  />
                  <span>{perk}</span>
                  {editing && (
                    <button
                      className={styles.perkRemove}
                      onClick={() => removePerk(perk)}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editing && (
              <div className={styles.perkAdd}>
                <input
                  className={styles.input}
                  placeholder="Add a perk or benefit…"
                  value={perkInput}
                  onChange={(e) => setPerkInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPerk()}
                />
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={addPerk}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branding tab */}
      {tab === "branding" && (
        <div className={styles.content}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Logo & Cover Image</h3>
            <div className={styles.brandingRow}>
              <div className={styles.brandingItem}>
                <p className={styles.brandingLabel}>Company Logo</p>
                <div className={styles.brandingLogo}>
                  <span>AC</span>
                </div>
                <button
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                >
                  <Upload size={12} /> Upload logo
                </button>
                <p className={styles.brandingHint}>
                  Recommended: 200×200 PNG or SVG
                </p>
              </div>
              <div className={styles.brandingItem}>
                <p className={styles.brandingLabel}>Cover Image</p>
                <div className={styles.brandingCover} />
                <button
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                >
                  <Upload size={12} /> Upload cover
                </button>
                <p className={styles.brandingHint}>
                  Recommended: 1200×400 JPG or PNG
                </p>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Profile Completeness</h3>
            <div className={styles.completenessGrid}>
              {[
                { label: "Company name", done: !!form.name },
                { label: "Description", done: !!form.about },
                { label: "Website", done: !!form.website },
                { label: "Logo uploaded", done: true },
                { label: "Social links", done: !!form.linkedin },
                { label: "Perks & benefits", done: form.perks.length > 0 },
              ].map((item) => (
                <div key={item.label} className={styles.completenessItem}>
                  {item.done ? (
                    <CheckCircle2
                      size={14}
                      style={{ color: "var(--status-success)" }}
                    />
                  ) : (
                    <div className={styles.incompleteDot} />
                  )}
                  <span
                    style={{
                      color: item.done
                        ? "var(--text-secondary)"
                        : "var(--text-muted)",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
