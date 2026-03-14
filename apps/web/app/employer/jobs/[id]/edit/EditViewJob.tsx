/** @format */
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  RotateCcw,
  Briefcase,
  MapPin,
  DollarSign,
  Users,
} from "lucide-react";
import { useEditJob } from "../../../../hooks/useEditJob";
import { FormField } from "../../../../components/ui/FormField";
import { SkillsInput } from "../../../../components/ui/SkillsInput";
import {
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  CURRENCIES,
  LOCATION_TYPES,
  NAV_SECTIONS,
  type SectionId,
} from "../../../../types/post-job.types";
import styles from "../../../styles/post-job.module.css";

// ── Local helpers ─────────────────────────────────────────────────────────────
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function EditSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div
          className={`${styles.skeleton}`}
          style={{ width: 160, height: 14, borderRadius: 6 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            className={styles.skeleton}
            style={{ width: 200, height: 26, borderRadius: 6 }}
          />
          <div
            className={styles.skeleton}
            style={{ width: 280, height: 14, borderRadius: 6 }}
          />
        </div>
      </div>
      <div
        className={styles.skeleton}
        style={{ height: 72, borderRadius: 10 }}
      />
      <div
        style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}
      >
        <div
          className={styles.skeleton}
          style={{ height: 320, borderRadius: 10 }}
        />
        <div
          className={styles.skeleton}
          style={{ height: 320, borderRadius: 10 }}
        />
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function EditJobView({ id }: { id: string }) {
  const {
    job,
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
    loading,
    submitting,
    saved,
    progress,
    handleSave,
    handleStatusChange,
  } = useEditJob(id);

  if (loading) return <EditSkeleton />;
  if (!form)
    return (
      <div className={styles.page}>
        <p style={{ color: "var(--status-danger)", padding: 40 }}>
          {serverError ?? "Job not found"}
        </p>
      </div>
    );

  const isPaused = job?.status === "paused";
  const isClosed = job?.status === "closed";

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <Link href="/employer/jobs" className={styles.back}>
          <ArrowLeft size={14} /> Back to jobs
        </Link>
        <div>
          <h1 className={styles.title}>Edit Job</h1>
          <p className={styles.subtitle}>
            {job?.title} · Last updated{" "}
            {job
              ? new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </p>
        </div>
        <div className={styles.headerActions}>
          {/* Status actions */}
          {job?.status === "active" && (
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => handleStatusChange("paused")}
              disabled={submitting}
              title="Pause this job — stop receiving new applications"
            >
              <PauseCircle size={14} /> Pause
            </button>
          )}
          {isPaused && (
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => handleStatusChange("active")}
              disabled={submitting}
            >
              <RotateCcw size={14} /> Reopen
            </button>
          )}
          {!isClosed && (
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              style={{
                color: "var(--status-danger)",
                borderColor: "rgba(244,63,94,.3)",
              }}
              onClick={() => handleStatusChange("closed")}
              disabled={submitting}
            >
              <XCircle size={14} /> Close
            </button>
          )}

          {/* Save actions */}
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => handleSave("draft")}
            disabled={submitting}
          >
            <Save size={14} /> Save draft
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => handleSave("active")}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} /> Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={14} /> Saved!
              </>
            ) : (
              <>
                <Eye size={14} /> Publish changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {serverError && (
        <div className={styles["error-banner"]} role="alert">
          <AlertCircle size={14} /> {serverError}
        </div>
      )}

      {/* Closed / paused notice */}
      {(isPaused || isClosed) && (
        <div
          className={styles["save-banner"]}
          style={{
            background: isPaused
              ? "rgba(249,115,22,.08)"
              : "rgba(244,63,94,.08)",
            borderColor: isPaused
              ? "rgba(249,115,22,.25)"
              : "rgba(244,63,94,.25)",
            color: isPaused ? "var(--status-warning)" : "var(--status-danger)",
          }}
        >
          {isPaused ? <PauseCircle size={14} /> : <XCircle size={14} />}
          This job is {isPaused ? "paused" : "closed"} — changes will be saved
          but not published until reopened.
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
          {/* ── Job Basics ───────────────────────────────────────────────── */}
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
              <FormField label="Application Deadline" error={errors.deadline}>
                <input
                  className={`${styles.input} ${errors.deadline ? styles.inputError : ""}`}
                  type="date"
                  value={form.deadline}
                  onChange={setField("deadline")}
                />
              </FormField>
            </div>
          </Section>

          {/* ── Location ─────────────────────────────────────────────────── */}
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

          {/* ── Compensation ─────────────────────────────────────────────── */}
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
                placeholder={"Health insurance\nEquity package\nFlexible hours"}
                value={form.benefits}
                onChange={setField("benefits")}
              />
            </FormField>
          </Section>

          {/* ── Description ──────────────────────────────────────────────── */}
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
                placeholder="We're looking for a passionate engineer..."
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
                  "Design and implement new features\nReview pull requests"
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
                  "5+ years of React experience\nTypeScript proficiency"
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

          {/* Bottom submit */}
          <div className={styles.submitRow}>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => handleSave("draft")}
              disabled={submitting}
            >
              <Save size={14} /> Save as draft
            </button>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => handleSave("active")}
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <span className={styles.spinner} /> Saving...
                </>
              ) : (
                <>
                  <Eye size={14} /> Publish changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
