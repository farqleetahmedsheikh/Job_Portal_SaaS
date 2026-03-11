/** @format */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  X,
  Briefcase,
  MapPin,
  DollarSign,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import styles from "../../styles/post-job.module.css";

// ─── Types ────────────────────────────────────────────────
interface JobForm {
  title: string;
  department: string;
  type: string;
  location: string;
  locationType: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  experience: string;
  deadline: string;
  openings: string;
  description: string;
  responsibilities: string;
  requirements: string;
  niceToHave: string;
  benefits: string;
  skills: string[];
  status: "draft" | "active";
}

const INIT: JobForm = {
  title: "",
  department: "",
  type: "full-time",
  location: "",
  locationType: "remote",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "USD",
  experience: "3-5",
  deadline: "",
  openings: "1",
  description: "",
  responsibilities: "",
  requirements: "",
  niceToHave: "",
  benefits: "",
  skills: [],
  status: "active",
};

const FIELD_GROUPS = [
  {
    id: "basic",
    title: "Job Basics",
    icon: <Briefcase size={15} />,
    desc: "Core information about the role",
  },
  {
    id: "location",
    title: "Location & Type",
    icon: <MapPin size={15} />,
    desc: "Where and how the role is performed",
  },
  {
    id: "compensation",
    title: "Compensation",
    icon: <DollarSign size={15} />,
    desc: "Salary range and benefits",
  },
  {
    id: "description",
    title: "Job Description",
    icon: <Users size={15} />,
    desc: "Detailed role description and requirements",
  },
];

export default function PostJobPage() {
  const router = useRouter();
  const [form, setForm] = useState<JobForm>(INIT);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof JobForm, string>>>(
    {},
  );
  const [saved, setSaved] = useState(false);
  const [activeSection, setActive] = useState("basic");

  const set =
    (key: keyof JobForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setErrors((p) => ({ ...p, [key]: undefined }));
    };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 12) {
      setForm((p) => ({ ...p, skills: [...p.skills, s] }));
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) =>
    setForm((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = "Job title is required";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.description.trim()) e.description = "Job description is required";
    if (!form.requirements.trim()) e.requirements = "Requirements are required";
    if (!form.deadline) e.deadline = "Application deadline is required";
    if (form.salaryMin && form.salaryMax && +form.salaryMin > +form.salaryMax)
      e.salaryMax = "Max salary must be greater than min";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (status: "draft" | "active") => {
    if (status === "active" && !validate()) return;
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/employer/jobs");
    }, 1500);
  };

  const progress = [
    !!form.title,
    !!form.location,
    !!form.salaryMin,
    !!form.description,
    !!form.requirements,
    form.skills.length > 0,
  ].filter(Boolean).length;

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
          >
            <Save size={14} /> Save draft
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => handleSubmit("active")}
          >
            <Eye size={14} /> Publish job
          </button>
        </div>
      </div>

      {saved && (
        <div className={styles.toast}>
          <CheckCircle2 size={13} /> Job published successfully!
        </div>
      )}

      {/* Progress */}
      <div className={styles.progressCard}>
        <div className={styles.progressInfo}>
          <span className={styles.progressLabel}>Completion</span>
          <span className={styles.progressVal}>
            {Math.round((progress / 6) * 100)}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(progress / 6) * 100}%` }}
          />
        </div>
        <p className={styles.progressHint}>
          {progress < 6
            ? `${6 - progress} more field${6 - progress !== 1 ? "s" : ""} to complete`
            : "🎉 All key fields filled!"}
        </p>
      </div>

      <div className={styles.layout}>
        {/* Sidebar nav */}
        <nav className={styles.nav}>
          {FIELD_GROUPS.map((g) => (
            <button
              key={g.id}
              className={`${styles.navItem} ${activeSection === g.id ? styles.navActive : ""}`}
              onClick={() => setActive(g.id)}
            >
              <span className={styles.navIcon}>{g.icon}</span>
              <div className={styles.navText}>
                <span className={styles.navLabel}>{g.title}</span>
                <span className={styles.navDesc}>{g.desc}</span>
              </div>
              {activeSection === g.id && (
                <div className={styles.navIndicator} />
              )}
            </button>
          ))}
        </nav>

        {/* Form */}
        <div className={styles.form}>
          {/* Basic */}
          <Section id="basic" active={activeSection} title="Job Basics">
            <div className={styles.fieldRow}>
              <Field label="Job Title" required error={errors.title}>
                <input
                  className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
                  placeholder="e.g. Senior Frontend Engineer"
                  value={form.title}
                  onChange={set("title")}
                />
              </Field>
              <Field label="Department">
                <input
                  className={styles.input}
                  placeholder="e.g. Engineering"
                  value={form.department}
                  onChange={set("department")}
                />
              </Field>
            </div>
            <div className={styles.fieldRow}>
              <Field label="Employment Type" required>
                <select
                  className={styles.select}
                  value={form.type}
                  onChange={set("type")}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </Field>
              <Field label="Experience Required">
                <select
                  className={styles.select}
                  value={form.experience}
                  onChange={set("experience")}
                >
                  <option value="0-1">0–1 years (Entry level)</option>
                  <option value="1-3">1–3 years (Junior)</option>
                  <option value="3-5">3–5 years (Mid-level)</option>
                  <option value="5+">5+ years (Senior)</option>
                  <option value="10+">10+ years (Staff/Principal)</option>
                </select>
              </Field>
            </div>
            <div className={styles.fieldRow}>
              <Field label="Number of Openings">
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  max="100"
                  value={form.openings}
                  onChange={set("openings")}
                />
              </Field>
              <Field
                label="Application Deadline"
                required
                error={errors.deadline}
              >
                <input
                  className={`${styles.input} ${errors.deadline ? styles.inputError : ""}`}
                  type="date"
                  value={form.deadline}
                  onChange={set("deadline")}
                />
              </Field>
            </div>
          </Section>

          {/* Location */}
          <Section id="location" active={activeSection} title="Location & Type">
            <Field label="Work Location" required error={errors.location}>
              <input
                className={`${styles.input} ${errors.location ? styles.inputError : ""}`}
                placeholder="e.g. San Francisco, CA or Remote"
                value={form.location}
                onChange={set("location")}
              />
            </Field>
            <div className={styles.radioGroup}>
              {[
                { val: "remote", label: "Remote", desc: "Work from anywhere" },
                {
                  val: "hybrid",
                  label: "Hybrid",
                  desc: "Mix of office & remote",
                },
                { val: "on-site", label: "On-site", desc: "Office only" },
              ].map((o) => (
                <label
                  key={o.val}
                  className={`${styles.radioCard} ${form.locationType === o.val ? styles.radioCardActive : ""}`}
                >
                  <input
                    type="radio"
                    name="locationType"
                    value={o.val}
                    checked={form.locationType === o.val}
                    onChange={set("locationType")}
                    style={{ display: "none" }}
                  />
                  <span className={styles.radioLabel}>{o.label}</span>
                  <span className={styles.radioDesc}>{o.desc}</span>
                  {form.locationType === o.val && (
                    <CheckCircle2 size={14} className={styles.radioCheck} />
                  )}
                </label>
              ))}
            </div>
          </Section>

          {/* Compensation */}
          <Section
            id="compensation"
            active={activeSection}
            title="Compensation"
          >
            <div className={styles.salaryRow}>
              <Field label="Currency">
                <select
                  className={styles.select}
                  style={{ minWidth: 90 }}
                  value={form.salaryCurrency}
                  onChange={set("salaryCurrency")}
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>CAD</option>
                  <option>AUD</option>
                </select>
              </Field>
              <Field label="Min Salary (annual)">
                <input
                  className={styles.input}
                  type="number"
                  placeholder="80000"
                  value={form.salaryMin}
                  onChange={set("salaryMin")}
                />
              </Field>
              <span className={styles.salarySep}>–</span>
              <Field label="Max Salary (annual)" error={errors.salaryMax}>
                <input
                  className={`${styles.input} ${errors.salaryMax ? styles.inputError : ""}`}
                  type="number"
                  placeholder="120000"
                  value={form.salaryMax}
                  onChange={set("salaryMax")}
                />
              </Field>
            </div>
            <Field label="Benefits (one per line)">
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder={
                  "Health insurance\nEquity package\nFlexible hours\nHome office stipend"
                }
                value={form.benefits}
                onChange={set("benefits")}
              />
            </Field>
          </Section>

          {/* Description */}
          <Section
            id="description"
            active={activeSection}
            title="Job Description"
          >
            <Field
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
                onChange={set("description")}
              />
            </Field>
            <Field
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
                onChange={set("responsibilities")}
              />
            </Field>
            <Field
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
                onChange={set("requirements")}
              />
            </Field>
            <Field
              label="Nice to Have"
              hint="Bonus qualifications (one per line)"
            >
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder={"GraphQL experience\nDesign systems knowledge"}
                value={form.niceToHave}
                onChange={set("niceToHave")}
              />
            </Field>

            {/* Skills tags */}
            <Field
              label="Required Skills"
              hint="Press Enter or comma to add a skill tag"
            >
              <div className={styles.skillBox}>
                {form.skills.map((s) => (
                  <span key={s} className={styles.skillTag}>
                    {s}
                    <button
                      className={styles.skillRemove}
                      onClick={() => removeSkill(s)}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {form.skills.length < 12 && (
                  <input
                    className={styles.skillInput}
                    placeholder={
                      form.skills.length === 0
                        ? "React, TypeScript, CSS..."
                        : "Add skill..."
                    }
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                )}
              </div>
            </Field>
          </Section>

          {/* Submit */}
          <div className={styles.submitRow}>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => handleSubmit("draft")}
            >
              <Save size={14} /> Save as draft
            </button>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => handleSubmit("active")}
            >
              <Eye size={14} /> Publish job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      className={`${styles.section} ${active !== id ? styles.sectionHidden : ""}`}
      id={id}
    >
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
      {error && (
        <p className={styles.error}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}
