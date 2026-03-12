/** @format */
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  MapPin,
  DollarSign,
  Users,
} from "lucide-react";
import { usePostJob } from "../../../hooks/usePostJob";
import { FormField } from "../../../components/ui/FormField"; // shared
import { SkillsInput } from "../../../components/ui/SkillsInput"; // shared
import {
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  CURRENCIES,
  LOCATION_TYPES,
  NAV_SECTIONS,
  type SectionId,
} from "../../../types/post-job.types";
import styles from "../../styles/post-job.module.css";

// ── Local-only helper — too small to be its own file ────────────────────────
function Section({
  id,
  active,
  title,
  children,
}: {
  id: string;
  active: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={`${styles.section} ${active !== id ? styles.sectionHidden : ""}`}
    >
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

const NAV_ICONS: Record<SectionId, React.ReactNode> = {
  basic: <Briefcase size={15} />,
  location: <MapPin size={15} />,
  compensation: <DollarSign size={15} />,
  description: <Users size={15} />,
};

// ── Page ────────────────────────────────────────────────────────────────────
export default function PostJobPage() {
  const {
    form,
    setField,
    skillInput,
    setSkillInput,
    addSkill,
    removeSkill,
    handleSkillKeyDown,
    errors,
    serverError,
    activeSection,
    setActiveSection,
    submitting,
    progress,
    handleSubmit,
  } = usePostJob();

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/employer/jobs" className={styles.back}>
          <ArrowLeft size={14} /> Back to jobs
        </Link>
        <div>
          <h1 className={styles.title}>Post a New Job</h1>
          <p className={styles.subtitle}>
            Fill in the details to attract the right candidates
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => handleSubmit("draft")}
            disabled={submitting}
          >
            <Save size={14} /> Save draft
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => handleSubmit("active")}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} /> Publishing...
              </>
            ) : (
              <>
                <Eye size={14} /> Publish job
              </>
            )}
          </button>
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className={styles["error-banner"]} role="alert">
          <AlertCircle size={14} /> {serverError}
        </div>
      )}

      {/* Progress */}
      <div className={styles.progressCard}>
        <div className={styles.progressInfo}>
          <span className={styles.progressLabel}>Completion</span>
          <span className={styles.progressVal}>{progress.pct}%</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <p className={styles.progressHint}>
          {progress.filled < progress.total
            ? `${progress.total - progress.filled} more field${progress.total - progress.filled !== 1 ? "s" : ""} to complete`
            : "🎉 All key fields filled!"}
        </p>
      </div>

      <div className={styles.layout}>
        {/* Sidebar nav */}
        <nav className={styles.nav}>
          {NAV_SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`${styles.navItem} ${activeSection === s.id ? styles.navActive : ""}`}
              onClick={() => setActiveSection(s.id as SectionId)}
            >
              <span className={styles.navIcon}>
                {NAV_ICONS[s.id as SectionId]}
              </span>
              <div className={styles.navText}>
                <span className={styles.navLabel}>{s.title}</span>
                <span className={styles.navDesc}>{s.desc}</span>
              </div>
              {activeSection === s.id && (
                <div className={styles.navIndicator} />
              )}
            </button>
          ))}
        </nav>

        {/* Sections */}
        <div className={styles.form}>
          {/* ── Job Basics ─────────────────────────────────────────────────── */}
          <Section id="basic" active={activeSection} title="Job Basics">
            <div className={styles.fieldRow}>
              <FormField label="Job Title" required error={errors.title}>
                <input
                  className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
                  placeholder="e.g. Senior Frontend Engineer"
                  value={form.title}
                  onChange={setField("title")}
                />
              </FormField>
              <FormField label="Department">
                <input
                  className={styles.input}
                  placeholder="e.g. Engineering"
                  value={form.department}
                  onChange={setField("department")}
                />
              </FormField>
            </div>
            <div className={styles.fieldRow}>
              <FormField label="Employment Type" required>
                <select
                  className={styles.select}
                  value={form.type}
                  onChange={setField("type")}
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Experience Required">
                <select
                  className={styles.select}
                  value={form.experienceLevel}
                  onChange={setField("experienceLevel")}
                >
                  {EXPERIENCE_LEVELS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className={styles.fieldRow}>
              <FormField label="Number of Openings">
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  max={100}
                  value={form.openings}
                  onChange={setField("openings")}
                />
              </FormField>
              <FormField
                label="Application Deadline"
                required
                error={errors.deadline}
              >
                <input
                  className={`${styles.input} ${errors.deadline ? styles.inputError : ""}`}
                  type="date"
                  value={form.deadline}
                  onChange={setField("deadline")}
                />
              </FormField>
            </div>
          </Section>

          {/* ── Location & Type ────────────────────────────────────────────── */}
          <Section id="location" active={activeSection} title="Location & Type">
            <FormField label="Work Location" required error={errors.location}>
              <input
                className={`${styles.input} ${errors.location ? styles.inputError : ""}`}
                placeholder="e.g. San Francisco, CA or Remote"
                value={form.location}
                onChange={setField("location")}
              />
            </FormField>
            <div className={styles.radioGroup}>
              {LOCATION_TYPES.map((o) => (
                <label
                  key={o.value}
                  className={`${styles.radioCard} ${form.locationType === o.value ? styles.radioCardActive : ""}`}
                >
                  <input
                    type="radio"
                    name="locationType"
                    value={o.value}
                    checked={form.locationType === o.value}
                    onChange={setField("locationType")}
                    style={{ display: "none" }}
                  />
                  <span className={styles.radioLabel}>{o.label}</span>
                  <span className={styles.radioDesc}>{o.desc}</span>
                  {form.locationType === o.value && (
                    <CheckCircle2 size={14} className={styles.radioCheck} />
                  )}
                </label>
              ))}
            </div>
          </Section>

          {/* ── Compensation ───────────────────────────────────────────────── */}
          <Section
            id="compensation"
            active={activeSection}
            title="Compensation"
          >
            <div className={styles.salaryRow}>
              <FormField label="Currency">
                <select
                  className={styles.select}
                  style={{ minWidth: 90 }}
                  value={form.salaryCurrency}
                  onChange={setField("salaryCurrency")}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Min Salary (annual)">
                <input
                  className={styles.input}
                  type="number"
                  placeholder="80000"
                  value={form.salaryMin}
                  onChange={setField("salaryMin")}
                />
              </FormField>
              <span className={styles.salarySep}>–</span>
              <FormField label="Max Salary (annual)" error={errors.salaryMax}>
                <input
                  className={`${styles.input} ${errors.salaryMax ? styles.inputError : ""}`}
                  type="number"
                  placeholder="120000"
                  value={form.salaryMax}
                  onChange={setField("salaryMax")}
                />
              </FormField>
            </div>
            <FormField label="Benefits" hint="One benefit per line">
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder={
                  "Health insurance\nEquity package\nFlexible hours\nHome office stipend"
                }
                value={form.benefits}
                onChange={setField("benefits")}
              />
            </FormField>
          </Section>

          {/* ── Job Description ────────────────────────────────────────────── */}
          <Section
            id="description"
            active={activeSection}
            title="Job Description"
          >
            <FormField
              label="Job Description"
              required
              error={errors.description}
              hint="Describe the role, team, and what success looks like"
            >
              <textarea
                className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
                rows={6}
                placeholder="We're looking for a passionate engineer to join our team..."
                value={form.description}
                onChange={setField("description")}
              />
            </FormField>
            <FormField
              label="Responsibilities"
              hint="Key day-to-day tasks (one per line)"
            >
              <textarea
                className={styles.textarea}
                rows={5}
                placeholder={
                  "Design and implement new features\nReview pull requests\nMentor junior engineers"
                }
                value={form.responsibilities}
                onChange={setField("responsibilities")}
              />
            </FormField>
            <FormField
              label="Requirements"
              required
              error={errors.requirements}
              hint="Must-have skills and experience (one per line)"
            >
              <textarea
                className={`${styles.textarea} ${errors.requirements ? styles.inputError : ""}`}
                rows={5}
                placeholder={
                  "5+ years of React experience\nTypeScript proficiency\nExperience with REST APIs"
                }
                value={form.requirements}
                onChange={setField("requirements")}
              />
            </FormField>
            <FormField
              label="Nice to Have"
              hint="Bonus qualifications (one per line)"
            >
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder={"GraphQL experience\nDesign systems knowledge"}
                value={form.niceToHave}
                onChange={setField("niceToHave")}
              />
            </FormField>
            <FormField
              label="Required Skills"
              hint="Press Enter or comma to add (max 12)"
            >
              <SkillsInput
                skills={form.skills}
                inputValue={skillInput}
                onInputChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onAdd={addSkill}
                onRemove={removeSkill}
              />
            </FormField>
          </Section>

          {/* Submit row */}
          <div className={styles.submitRow}>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => handleSubmit("draft")}
              disabled={submitting}
            >
              <Save size={14} /> Save as draft
            </button>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => handleSubmit("active")}
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <span className={styles.spinner} /> Publishing...
                </>
              ) : (
                <>
                  <Eye size={14} /> Publish job
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
