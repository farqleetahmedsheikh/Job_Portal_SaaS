/** @format */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  Share2,
  ArrowLeft,
  Building2,
  Users,
  Globe,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Send,
  Star,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import styles from "../../styles/job-details.module.css";

// ─── Replace with real API fetch using useParams().id ─────
const JOB = {
  id: "1",
  role: "Senior Frontend Engineer",
  company: "Stripe",
  logo: "ST",
  location: "Remote · US",
  type: "Full-time",
  salary: "$160,000 – $200,000",
  experience: "5+ years",
  posted: "2 days ago",
  deadline: "Mar 30, 2026",
  applicants: 142,
  companySize: "1,000–5,000",
  industry: "Fintech · Payments",
  website: "https://stripe.com",
  rating: 4.7,
  reviews: 3200,
  urgent: false,
  about:
    "Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size—from new startups to public companies—use our software to accept payments and manage their businesses online.",
  description: `We're looking for a Senior Frontend Engineer to join our Dashboard team. You'll work closely with product and design to build the tools that hundreds of thousands of businesses use every day to run their operations.\n\nYou'll be responsible for building highly interactive, performant, and accessible user interfaces that scale to millions of users.`,
  responsibilities: [
    "Design, build, and maintain high-quality frontend components and features",
    "Collaborate with product managers and designers to define user experiences",
    "Drive architectural decisions and technical roadmap for the frontend",
    "Mentor junior engineers and contribute to engineering culture",
    "Champion performance, accessibility, and code quality across the team",
  ],
  requirements: [
    "5+ years of experience in frontend development",
    "Deep expertise in React, TypeScript, and modern CSS",
    "Strong understanding of web performance and Core Web Vitals",
    "Experience with large-scale production applications",
    "Excellent communication and collaboration skills",
  ],
  niceToHave: [
    "Experience with GraphQL or REST API design",
    "Familiarity with design systems at scale",
    "Previous fintech or payments experience",
  ],
  benefits: [
    "Competitive equity package",
    "Comprehensive health, dental & vision",
    "Remote-first with flexible hours",
    "$5,000 annual learning budget",
    "Home office stipend",
    "Generous parental leave",
  ],
  skills: [
    "React",
    "TypeScript",
    "CSS",
    "GraphQL",
    "Performance",
    "Accessibility",
  ],
  similarJobs: [
    {
      id: "2",
      role: "Frontend Engineer",
      company: "Linear",
      logo: "LN",
      salary: "$140k–$170k",
      type: "Remote",
    },
    {
      id: "3",
      role: "UI Engineer",
      company: "Vercel",
      logo: "VC",
      salary: "$130k–$160k",
      type: "Remote",
    },
    {
      id: "4",
      role: "React Developer",
      company: "Figma",
      logo: "FG",
      salary: "$140k–$175k",
      type: "Hybrid",
    },
  ],
};

type ApplyStep = "idle" | "confirm" | "resume" | "done";

export default function JobDetailPage() {
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState<ApplyStep>("idle");

  return (
    <div className={styles.page}>
      <Link href="/applicant/browse-jobs" className={styles.back}>
        <ArrowLeft size={14} /> Back to jobs
      </Link>

      <div className={styles.layout}>
        {/* ── Main ── */}
        <div className={styles.main}>
          {/* Header card */}
          <div className={styles.headerCard}>
            <div className={styles.headerTop}>
              <div className={styles.logo}>{JOB.logo}</div>
              <div className={styles.headerInfo}>
                <div className={styles.headerBadges}>
                  {JOB.urgent && (
                    <span className={styles.urgentBadge}>
                      <AlertCircle size={10} /> Urgent hire
                    </span>
                  )}
                </div>
                <h1 className={styles.role}>{JOB.role}</h1>
                <div className={styles.headerMeta}>
                  <span>
                    <Building2 size={11} /> {JOB.company}
                  </span>
                  <span>
                    <MapPin size={11} /> {JOB.location}
                  </span>
                  <span>
                    <Briefcase size={11} /> {JOB.type}
                  </span>
                  <span>
                    <Clock size={11} /> {JOB.posted}
                  </span>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setSaved((p) => !p)}
                  aria-label="Save"
                >
                  {saved ? (
                    <BookmarkCheck
                      size={16}
                      style={{ color: "var(--color-secondary)" }}
                    />
                  ) : (
                    <Bookmark size={16} />
                  )}
                </button>
                <button className={styles.iconBtn}>
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className={styles.factRow}>
              {[
                {
                  icon: <DollarSign size={13} />,
                  label: "Salary",
                  val: JOB.salary,
                },
                {
                  icon: <Briefcase size={13} />,
                  label: "Experience",
                  val: JOB.experience,
                },
                {
                  icon: <Calendar size={13} />,
                  label: "Apply by",
                  val: JOB.deadline,
                },
                {
                  icon: <Users size={13} />,
                  label: "Applicants",
                  val: `${JOB.applicants} applied`,
                },
              ].map((f) => (
                <div key={f.label} className={styles.fact}>
                  <div className={styles.factIcon}>{f.icon}</div>
                  <div>
                    <p className={styles.factLabel}>{f.label}</p>
                    <p className={styles.factVal}>{f.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.skillRow}>
              {JOB.skills.map((s) => (
                <span key={s} className={styles.skillTag}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* About role */}
          <Section title="About the role">
            <p className={styles.prose}>{JOB.description}</p>
          </Section>

          {/* Responsibilities */}
          <Section title="Responsibilities">
            <BulletList items={JOB.responsibilities} variant="check" />
          </Section>

          {/* Requirements */}
          <Section title="Requirements">
            <BulletList items={JOB.requirements} variant="check" />
            <p className={styles.subsectionLabel}>Nice to have</p>
            <BulletList items={JOB.niceToHave} variant="chevron" />
          </Section>

          {/* Benefits */}
          <Section title="Benefits & perks">
            <div className={styles.benefitGrid}>
              {JOB.benefits.map((b) => (
                <div key={b} className={styles.benefitItem}>
                  <CheckCircle2
                    size={13}
                    style={{ color: "var(--status-success)", flexShrink: 0 }}
                  />
                  {b}
                </div>
              ))}
            </div>
          </Section>

          {/* Similar jobs */}
          <Section title="Similar jobs">
            <div className={styles.similarList}>
              {JOB.similarJobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/applicant/jobs/${j.id}`}
                  className={styles.similarRow}
                >
                  <div className={styles.similarLogo}>{j.logo}</div>
                  <div className={styles.similarInfo}>
                    <p className={styles.similarRole}>{j.role}</p>
                    <p className={styles.similarMeta}>
                      {j.company} · {j.type}
                    </p>
                  </div>
                  <span className={styles.similarSalary}>{j.salary}</span>
                  <ChevronRight
                    size={14}
                    style={{ color: "var(--text-muted)" }}
                  />
                </Link>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          {/* Apply card */}
          <div className={styles.applyCard}>
            {step === "done" ? (
              <div className={styles.appliedState}>
                <div className={styles.appliedIcon}>
                  <CheckCircle2 size={28} />
                </div>
                <h3>Application sent!</h3>
                <p>We'll notify you when {JOB.company} responds.</p>
                <Link
                  href="/applicant/applications"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnFull}`}
                >
                  Track application
                </Link>
              </div>
            ) : step === "resume" ? (
              <ApplyResumeStep
                onSelect={() => setStep("done")}
                onBack={() => setStep("confirm")}
              />
            ) : step === "confirm" ? (
              <ApplyConfirmStep
                job={JOB}
                onContinue={() => setStep("resume")}
                onBack={() => setStep("idle")}
              />
            ) : (
              <ApplyIdleStep
                job={JOB}
                saved={saved}
                onSave={() => setSaved((p) => !p)}
                onApply={() => setStep("confirm")}
              />
            )}
          </div>

          {/* Company card */}
          <div className={styles.companyCard}>
            <div className={styles.companyTop}>
              <div className={styles.companyLogo}>{JOB.logo}</div>
              <div>
                <p className={styles.companyName}>{JOB.company}</p>
                <p className={styles.companyIndustry}>{JOB.industry}</p>
              </div>
            </div>
            <div className={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={12}
                  style={{
                    color:
                      i <= Math.round(JOB.rating) ? "#f59e0b" : "var(--border)",
                    fill: i <= Math.round(JOB.rating) ? "#f59e0b" : "none",
                  }}
                />
              ))}
              <span className={styles.ratingVal}>{JOB.rating}</span>
              <span className={styles.ratingCount}>
                ({JOB.reviews.toLocaleString()} reviews)
              </span>
            </div>
            <p className={styles.companyAbout}>{JOB.about.slice(0, 140)}…</p>
            <div className={styles.companyMeta}>
              <span>
                <Users size={11} /> {JOB.companySize} employees
              </span>
              <span>
                <Globe size={11} />
                <a href={JOB.website} target="_blank" rel="noopener noreferrer">
                  Visit website <ExternalLink size={10} />
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

function BulletList({
  items,
  variant,
}: {
  items: string[];
  variant: "check" | "chevron";
}) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li
          key={item}
          className={`${styles.listItem} ${variant === "chevron" ? styles.listItemMuted : ""}`}
        >
          {variant === "check" ? (
            <CheckCircle2 size={13} className={styles.listIconCheck} />
          ) : (
            <ChevronRight size={13} className={styles.listIconChevron} />
          )}
          {item}
        </li>
      ))}
    </ul>
  );
}

function ApplyIdleStep({
  job,
  saved,
  onSave,
  onApply,
}: {
  job: typeof JOB;
  saved: boolean;
  onSave: () => void;
  onApply: () => void;
}) {
  return (
    <>
      <div className={styles.applyHeader}>
        <p className={styles.applyRole}>{job.role}</p>
        <p className={styles.applyCompany}>{job.company}</p>
      </div>
      <button
        className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`}
        onClick={onApply}
      >
        <Send size={13} /> Apply now
      </button>
      <button
        className={`${styles.btn} ${styles.btnOutline} ${styles.btnFull}`}
        onClick={onSave}
      >
        {saved ? (
          <>
            <BookmarkCheck size={13} /> Saved
          </>
        ) : (
          <>
            <Bookmark size={13} /> Save job
          </>
        )}
      </button>
      <div className={styles.applyDivider} />
      <div className={styles.applyMeta}>
        <span>
          <Clock size={11} /> Posted {job.posted}
        </span>
        <span>
          <Users size={11} /> {job.applicants} applicants
        </span>
        <span>
          <Calendar size={11} /> Apply by {job.deadline}
        </span>
      </div>
    </>
  );
}

function ApplyConfirmStep({
  job,
  onContinue,
  onBack,
}: {
  job: typeof JOB;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <p className={styles.applyStepTitle}>Confirm application</p>
      <p className={styles.applyStepSub}>
        Applying to <strong>{job.role}</strong> at{" "}
        <strong>{job.company}</strong>
      </p>
      <div className={styles.confirmBox}>
        <span>
          <MapPin size={11} /> {job.location}
        </span>
        <span>
          <DollarSign size={11} /> {job.salary}
        </span>
        <span>
          <Briefcase size={11} /> {job.type}
        </span>
      </div>
      <button
        className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`}
        onClick={onContinue}
      >
        <ChevronRight size={13} /> Select resume
      </button>
      <button
        className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
        onClick={onBack}
      >
        Back
      </button>
    </>
  );
}

function ApplyResumeStep({
  onSelect,
  onBack,
}: {
  onSelect: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <p className={styles.applyStepTitle}>Choose resume</p>
      <p className={styles.applyStepSub}>
        Select the resume to send with this application
      </p>
      <div className={styles.resumeOptions}>
        {["Resume_2026.pdf", "Resume_Stripe_Custom.pdf"].map((r) => (
          <button key={r} className={styles.resumeOption} onClick={onSelect}>
            <span className={styles.resumeFileIcon}>📄</span>
            <span>{r}</span>
            <ChevronRight
              size={12}
              style={{ marginLeft: "auto", color: "var(--text-muted)" }}
            />
          </button>
        ))}
        <Link href="/applicant/resumes" className={styles.uploadLink}>
          + Upload new resume
        </Link>
      </div>
      <button
        className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
        onClick={onBack}
      >
        Back
      </button>
    </>
  );
}
