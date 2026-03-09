/** @format */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Download,
  MessageSquare,
  Calendar,
  MapPin,
  Briefcase,
  Globe,
  Github,
  Linkedin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ChevronRight,
  XCircle,
  ExternalLink,
  FileText,
  Award,
  Building2,
  BarChart2,
} from "lucide-react";
import styles from "../../styles/applicant-profile.module.css";

// ─── Mock — replace with API fetch ────────────────────────
const APPLICANT = {
  id: "1",
  name: "Alex Rivera",
  avatar: "AR",
  title: "Senior React Engineer",
  location: "San Francisco, CA",
  email: "alex.rivera@email.com",
  phone: "+1 (415) 555-0192",
  linkedin: "linkedin.com/in/alexrivera",
  github: "github.com/alexrivera",
  portfolio: "alexrivera.dev",
  experience: "6 years",
  appliedAt: "2 hours ago",
  status: "reviewing" as const,
  match: 94,
  starred: true,
  summary:
    "Passionate frontend engineer with 6 years building high-performance React applications at scale. I specialize in TypeScript, design systems, and web performance. Currently at Acme Corp, leading a team of 4 engineers.",
  skills: [
    "React",
    "TypeScript",
    "CSS Modules",
    "GraphQL",
    "Next.js",
    "Testing Library",
    "Performance",
    "Figma",
  ],
  experience_items: [
    {
      role: "Senior Frontend Engineer",
      company: "Acme Corp",
      period: "2022–Present",
      duration: "2 yrs",
      desc: "Led migration from legacy codebase to React + TypeScript. Built design system used by 12 product teams. Improved Lighthouse score from 64 to 96.",
    },
    {
      role: "Frontend Developer",
      company: "Tech Startup",
      period: "2020–2022",
      duration: "2 yrs",
      desc: "Architected React frontend from scratch. Implemented CI/CD pipeline, reduced deploy time by 60%.",
    },
    {
      role: "Junior Developer",
      company: "Agency",
      period: "2018–2020",
      duration: "2 yrs",
      desc: "Built client websites using React and Vue. Maintained design system and component library.",
    },
  ],
  education: [
    {
      degree: "B.Sc. Computer Science",
      school: "UC Berkeley",
      year: "2018",
      gpa: "3.8",
    },
  ],
  certifications: [
    "AWS Certified Developer",
    "Google Professional Cloud Architect",
  ],
  resumeUrl: "#",
  coverLetter:
    "I am very excited about the opportunity to join your team. With 6 years of React experience and a passion for building products that millions use, I believe I am a strong fit for this role...",
  previousApplications: 0,
  notes: "",
};

type Status =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected";

const STATUS_OPTIONS: { val: Status; label: string }[] = [
  { val: "new", label: "New" },
  { val: "reviewing", label: "Reviewing" },
  { val: "shortlisted", label: "Shortlisted" },
  { val: "interview", label: "Interview" },
  { val: "offered", label: "Offered" },
  { val: "rejected", label: "Rejected" },
];

const STATUS_CLS: Record<Status, string> = {
  new: "sNew",
  reviewing: "sReviewing",
  shortlisted: "sShortlisted",
  interview: "sInterview",
  offered: "sOffered",
  rejected: "sRejected",
};

export default function ApplicantProfilePage() {
  const [status, setStatus] = useState<Status>(APPLICANT.status);
  const [starred, setStarred] = useState(APPLICANT.starred);
  const [notes, setNotes] = useState(APPLICANT.notes);
  const [tab, setTab] = useState<"overview" | "resume" | "cover">("overview");
  const [saved, setSaved] = useState(false);

  const match = APPLICANT.match;
  const matchColor =
    match >= 90
      ? "var(--status-success)"
      : match >= 75
        ? "var(--color-secondary)"
        : "#f59e0b";

  const handleSaveNotes = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.page}>
      <Link href="/employer/jobs/1/applicants" className={styles.back}>
        <ArrowLeft size={14} /> Back to applicants
      </Link>

      <div className={styles.layout}>
        {/* ── Main ── */}
        <div className={styles.main}>
          {/* Profile header */}
          <div className={styles.profileCard}>
            <div className={styles.profileTop}>
              <div className={styles.profileAvatar}>{APPLICANT.avatar}</div>
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>
                  <h1>{APPLICANT.name}</h1>
                  <button
                    className={`${styles.starBtn} ${starred ? styles.starActive : ""}`}
                    onClick={() => setStarred((p) => !p)}
                  >
                    <Star
                      size={16}
                      style={{ fill: starred ? "#f59e0b" : "none" }}
                    />
                  </button>
                </div>
                <p className={styles.profileTitle}>{APPLICANT.title}</p>
                <div className={styles.profileMeta}>
                  <span>
                    <MapPin size={11} /> {APPLICANT.location}
                  </span>
                  <span>
                    <Briefcase size={11} /> {APPLICANT.experience} experience
                  </span>
                  <span>
                    <Clock size={11} /> Applied {APPLICANT.appliedAt}
                  </span>
                </div>
                <div className={styles.profileLinks}>
                  <a
                    href={`mailto:${APPLICANT.email}`}
                    className={styles.profileLink}
                  >
                    <Mail size={12} /> {APPLICANT.email}
                  </a>
                  <a
                    href={`tel:${APPLICANT.phone}`}
                    className={styles.profileLink}
                  >
                    <Phone size={12} /> {APPLICANT.phone}
                  </a>
                  <a
                    href={`https://${APPLICANT.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.profileLink}
                  >
                    <Linkedin size={12} /> LinkedIn
                  </a>
                  <a
                    href={`https://${APPLICANT.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.profileLink}
                  >
                    <Github size={12} /> GitHub
                  </a>
                  {APPLICANT.portfolio && (
                    <a
                      href={`https://${APPLICANT.portfolio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.profileLink}
                    >
                      <Globe size={12} /> Portfolio
                    </a>
                  )}
                </div>
              </div>
              {/* Match score */}
              <div className={styles.matchCard}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke={matchColor}
                    strokeWidth="5"
                    strokeDasharray={`${match * 1.759} 175.9`}
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                    style={{ transition: "stroke-dasharray .6s ease" }}
                  />
                </svg>
                <div className={styles.matchInner}>
                  <span
                    className={styles.matchPct}
                    style={{ color: matchColor }}
                  >
                    {match}%
                  </span>
                  <span className={styles.matchLabel}>match</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className={styles.skillsRow}>
              {APPLICANT.skills.map((s) => (
                <span key={s} className={styles.skill}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {(
              [
                ["overview", "Overview"],
                ["resume", "Resume"],
                ["cover", "Cover Letter"],
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

          {/* Tab content */}
          {tab === "overview" && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Summary</h2>
                <p className={styles.prose}>{APPLICANT.summary}</p>
              </div>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Work Experience</h2>
                <div className={styles.expList}>
                  {APPLICANT.experience_items.map((e, i) => (
                    <div key={i} className={styles.expItem}>
                      <div className={styles.expDot} />
                      <div className={styles.expContent}>
                        <div className={styles.expHeader}>
                          <p className={styles.expRole}>{e.role}</p>
                          <span className={styles.expDuration}>
                            {e.duration}
                          </span>
                        </div>
                        <p className={styles.expCompany}>
                          <Building2 size={10} /> {e.company} · {e.period}
                        </p>
                        <p className={styles.expDesc}>{e.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Education</h2>
                {APPLICANT.education.map((e, i) => (
                  <div key={i} className={styles.eduItem}>
                    <Award
                      size={14}
                      style={{ color: "var(--color-secondary)", flexShrink: 0 }}
                    />
                    <div>
                      <p className={styles.eduDegree}>{e.degree}</p>
                      <p className={styles.eduSchool}>
                        {e.school} · {e.year} · GPA {e.gpa}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {APPLICANT.certifications.length > 0 && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Certifications</h2>
                  {APPLICANT.certifications.map((c) => (
                    <div key={c} className={styles.certItem}>
                      <CheckCircle2
                        size={13}
                        style={{
                          color: "var(--status-success)",
                          flexShrink: 0,
                        }}
                      />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "resume" && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <div className={styles.resumeActions}>
                  <div className={styles.resumeFile}>
                    <FileText
                      size={18}
                      style={{ color: "var(--color-secondary)" }}
                    />
                    <span>Resume_{APPLICANT.name.replace(" ", "_")}.pdf</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a
                      href={APPLICANT.resumeUrl}
                      download
                      className={`${styles.btn} ${styles.btnGhost}`}
                    >
                      <Download size={13} /> Download
                    </a>
                    <a
                      href={APPLICANT.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.btn} ${styles.btnGhost}`}
                    >
                      <ExternalLink size={13} /> Open
                    </a>
                  </div>
                </div>
                <div className={styles.resumePreview}>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Resume preview would render here via PDF viewer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === "cover" && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Cover Letter</h2>
                <p className={styles.prose}>{APPLICANT.coverLetter}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          {/* Status card */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Application Status</h3>
            <div className={styles.statusOptions}>
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.val}
                  className={`${styles.statusOption} ${status === o.val ? styles.statusActive : ""} ${styles[STATUS_CLS[o.val]]}`}
                  onClick={() => setStatus(o.val)}
                >
                  {status === o.val && <CheckCircle2 size={12} />} {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Actions</h3>
            <div className={styles.actionList}>
              <Link
                href={`/employer/messages?to=${APPLICANT.id}`}
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`}
              >
                <MessageSquare size={14} /> Send message
              </Link>
              <button
                className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
              >
                <Calendar size={14} /> Schedule interview
              </button>
              <a
                href={APPLICANT.resumeUrl}
                download
                className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
              >
                <Download size={14} /> Download resume
              </a>
              <button
                className={`${styles.btn} ${styles.btnDangerGhost} ${styles.btnFull}`}
              >
                <XCircle size={14} /> Reject applicant
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Internal Notes</h3>
            <textarea
              className={styles.notesArea}
              placeholder="Add private notes about this candidate…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <button
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
              onClick={handleSaveNotes}
              style={{ marginTop: 8 }}
            >
              {saved ? (
                <>
                  <CheckCircle2 size={13} /> Saved
                </>
              ) : (
                "Save notes"
              )}
            </button>
          </div>

          {/* Quick facts */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Quick Info</h3>
            <div className={styles.quickFacts}>
              {[
                { label: "Applied", val: APPLICANT.appliedAt },
                { label: "Experience", val: APPLICANT.experience },
                {
                  label: "Previous apps",
                  val: `${APPLICANT.previousApplications} at your company`,
                },
              ].map((f) => (
                <div key={f.label} className={styles.factRow}>
                  <span className={styles.factLabel}>{f.label}</span>
                  <span className={styles.factVal}>{f.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
