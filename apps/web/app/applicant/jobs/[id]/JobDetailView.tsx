/** @format */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Eye,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Sparkles,
  X,
  Building2,
  Star,
} from "lucide-react";
import { useJobDetail } from "../../../hooks/useJobDetail";
import { useUser } from "../../../store/session.store";
import { formatDate } from "../../../lib";
import styles from "../../styles/job-detail.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toInitials(name: string) {
  return name[0]?.toUpperCase() ?? "C";
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000),
  );
}

// Split text into bullet lines
function textToList(text: string | null): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

const EXP_LABELS: Record<string, string> = {
  "0-1": "Entry level (0–1 yrs)",
  "1-3": "Junior (1–3 yrs)",
  "3-5": "Mid-level (3–5 yrs)",
  "5+": "Senior (5+ yrs)",
  "10+": "Staff / Principal (10+ yrs)",
};

const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

const MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  "on-site": "On-site",
  onsite: "On-site",
};

// ── Apply Modal ───────────────────────────────────────────────────────────────
function ApplyModal({
  jobTitle,
  company,
  applying,
  applyError,
  onApply,
  onClose,
}: {
  jobTitle: string;
  company: string;
  applying: boolean;
  applyError: string | null;
  onApply: (coverLetter?: string) => void;
  onClose: () => void;
}) {
  const [coverLetter, setCoverLetter] = useState("");

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Apply for this job</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Job preview */}
          <div className={styles.modalJobRow}>
            <Briefcase
              size={18}
              style={{ color: "var(--color-secondary)", flexShrink: 0 }}
            />
            <div>
              <p className={styles.modalJobTitle}>{jobTitle}</p>
              <p className={styles.modalJobCompany}>{company}</p>
            </div>
          </div>

          {/* Cover letter */}
          <label className={styles.formLabel}>
            Cover Letter{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              (optional)
            </span>
          </label>
          <p className={styles.formHint}>
            Tell the employer why you&apos;re a great fit. Keep it short and
            specific.
          </p>
          <textarea
            className={styles.textarea}
            rows={6}
            placeholder={`Hi, I'm interested in the ${jobTitle} position...\n\nI have experience with...\n\nI'd love to discuss how I can contribute to your team.`}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />

          {applyError && <p className={styles.modalError}>{applyError}</p>}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.btnGhost}
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.btnPrimary}
            style={{ flex: 2 }}
            onClick={() => onApply(coverLetter)}
            disabled={applying}
            aria-busy={applying}
          >
            {applying ? (
              <>
                <span className={styles.spinner} /> Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 size={15} /> Submit Application
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className={styles.page}>
      <div
        className={styles.skeleton}
        style={{ width: 120, height: 14, marginBottom: 20 }}
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={`${styles.card} ${styles.cardBody}`}>
            <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
              <div
                className={styles.skeleton}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  className={styles.skeleton}
                  style={{ height: 24, width: "70%" }}
                />
                <div
                  className={styles.skeleton}
                  style={{ height: 14, width: "45%" }}
                />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={styles.skeleton}
                style={{ height: 14, width: `${60 + i * 8}%`, marginBottom: 8 }}
              />
            ))}
          </div>
          <div className={`${styles.card} ${styles.cardBody}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={styles.skeleton}
                style={{
                  height: 13,
                  width: `${70 + (i % 3) * 10}%`,
                  marginBottom: 10,
                }}
              />
            ))}
          </div>
        </div>
        <div className={styles.sidebar}>
          <div
            className={styles.skeleton}
            style={{ height: 280, borderRadius: 12 }}
          />
          <div
            className={styles.skeleton}
            style={{ height: 160, borderRadius: 12 }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────
export function JobDetailView({ id }: { id: string }) {
  const user = useUser();
  const {
    job,
    loading,
    error,
    isSaved,
    toggleSave,
    hasApplied,
    applying,
    applyError,
    showModal,
    setShowModal,
    handleApply,
  } = useJobDetail(id);

  if (loading) return <Skeleton />;
  if (error || !job)
    return (
      <div className={styles.page}>
        <p style={{ color: "var(--status-danger)", padding: 40 }}>
          {error ?? "Job not found"}
        </p>
      </div>
    );

  const profileSkills = user?.applicantProfile?.skills ?? [];
  const matchedSkills = job.skills.filter((s) =>
    profileSkills.some((p) => p.toLowerCase() === s.toLowerCase()),
  );
  const matchScore = job.skills.length
    ? Math.round((matchedSkills.length / job.skills.length) * 100)
    : 0;

  const dl = daysLeft(job.expiresAt);
  const salary =
    job.salaryIsPublic && (job.salaryMin || job.salaryMax)
      ? job.salaryMin && job.salaryMax
        ? `${job.salaryCurrency} ${(job.salaryMin)} – ${(job.salaryMax)}`
        : job.salaryMin
          ? `From ${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k`
          : `Up to ${job.salaryCurrency} ${(job.salaryMax! / 1000).toFixed(0)}k`
      : null;

  const responsibilities = textToList(job.responsibilities);
  const requirements = textToList(job.requirements);
  const niceToHave = textToList(job.niceToHave);
  const benefits = textToList(job.benefits);
  const perks = job.company.perks?.map((p) => p.perk) ?? [];

  return (
    <div className={styles.page}>
      <Link href="/applicant/browse-jobs" className={styles.back}>
        <ArrowLeft size={14} /> Back to jobs
      </Link>

      <div className={styles.layout}>
        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className={styles.main}>
          {/* Job header */}
          <div className={`${styles.card}`}>
            <div className={styles.jobHeader}>
              {/* Company row */}
              <div className={styles.companyRow}>
                <div className={styles.companyLogo}>
                  {job.company.logoUrl ? (
                    <img
                      src={job.company.logoUrl}
                      alt={job.company.companyName}
                    />
                  ) : (
                    toInitials(job.company.companyName)
                  )}
                </div>
                <div className={styles.companyInfo}>
                  <p className={styles.companyName}>
                    {job.company.companyName}
                    {job.company.isVerified && (
                      <ShieldCheck size={13} className={styles.verifiedIcon} />
                    )}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    {job.company.industry} · {job.company.location}
                  </p>
                </div>

                {/* Match score — top right */}
                {matchScore > 0 && (
                  <div style={{ marginLeft: "auto", textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color:
                          matchScore >= 70
                            ? "var(--status-success)"
                            : matchScore >= 40
                              ? "var(--status-warning)"
                              : "var(--text-muted)",
                      }}
                    >
                      {matchScore}%
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      MATCH
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className={styles.jobTitle}>{job.title}</h1>

              {/* Badges */}
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${styles.badgePurple}`}>
                  <Briefcase size={11} /> {TYPE_LABELS[job.type] ?? job.type}
                </span>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>
                  <MapPin size={11} />{" "}
                  {MODE_LABELS[job.locationType] ?? job.locationType}
                </span>
                {job.experienceLevel && (
                  <span className={`${styles.badge} ${styles.badgeOrange}`}>
                    <Clock size={11} />{" "}
                    {EXP_LABELS[job.experienceLevel] ?? job.experienceLevel}
                  </span>
                )}
                {job.openings > 1 && (
                  <span className={`${styles.badge} ${styles.badgeGreen}`}>
                    <Users size={11} /> {job.openings} openings
                  </span>
                )}
              </div>

              {/* Meta grid */}
              <div className={styles.metaGrid}>
                <div>
                  <p className={styles.metaLabel}>Location</p>
                  <p className={styles.metaValue}>{job.location}</p>
                </div>
                <div>
                  <p className={styles.metaLabel}>Posted</p>
                  <p className={styles.metaValue}>
                    {job.publishedAt ? formatDate(job.publishedAt) : "—"}
                  </p>
                </div>
                <div>
                  <p className={styles.metaLabel}>Applicants</p>
                  <p className={styles.metaValue}>
                    {job.applicantsCount} applied
                  </p>
                </div>
                <div>
                  <p className={styles.metaLabel}>Deadline</p>
                  <p
                    className={`${styles.metaValue} ${dl !== null && dl <= 7 ? styles.deadlineSoon : ""}`}
                  >
                    {job.deadline ? formatDate(job.deadline) : "—"}
                    {dl !== null && dl <= 7 && ` (${dl}d left)`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>About the Role</h2>
                <p className={styles.prose}>{job.description}</p>
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          {responsibilities.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Responsibilities</h2>
                  <ul className={styles.list}>
                    {responsibilities.map((item, i) => (
                      <li key={i} className={styles.listItem}>
                        <span className={styles.listDot} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Requirements</h2>
                  <ul className={styles.list}>
                    {requirements.map((item, i) => (
                      <li key={i} className={styles.listItem}>
                        <span className={styles.listDot} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {niceToHave.length > 0 && (
                  <>
                    <div
                      className={styles.divider}
                      style={{ margin: "16px 0" }}
                    />
                    <div className={styles.section}>
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                          margin: "0 0 10px",
                        }}
                      >
                        Nice to Have
                      </h3>
                      <ul className={styles.list}>
                        {niceToHave.map((item, i) => (
                          <li key={i} className={styles.listItem}>
                            <Star
                              size={10}
                              style={{
                                color: "var(--text-muted)",
                                flexShrink: 0,
                                marginTop: 6,
                              }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Required Skills</h2>
                  {matchScore > 0 && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--status-success)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        margin: "0 0 10px",
                      }}
                    >
                      <Sparkles size={13} /> You match {matchedSkills.length} of{" "}
                      {job.skills.length} skills
                    </p>
                  )}
                  <div className={styles.skillGrid}>
                    {job.skills.map((s) => {
                      const isMatch = matchedSkills.some(
                        (m) => m.toLowerCase() === s.toLowerCase(),
                      );
                      return (
                        <span
                          key={s}
                          className={styles.skill}
                          style={
                            isMatch
                              ? {
                                  background: "rgba(52,217,179,.1)",
                                  color: "var(--status-success)",
                                  borderColor: "rgba(52,217,179,.25)",
                                }
                              : {}
                          }
                        >
                          {isMatch && <Sparkles size={9} />}
                          {s}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          {benefits.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Benefits</h2>
                  <div className={styles.benefitGrid}>
                    {benefits.map((b, i) => (
                      <div key={i} className={styles.benefitItem}>
                        <CheckCircle2
                          size={14}
                          style={{
                            color: "var(--status-success)",
                            flexShrink: 0,
                          }}
                        />
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div className={styles.sidebar}>
          {/* Apply card */}
          <div className={styles.card}>
            <div className={styles.applyCard}>
              {/* Salary */}
              {salary && (
                <div className={styles.salaryBlock}>
                  <div className={styles.salaryAmt}>{salary}</div>
                  <div className={styles.salaryPer}>per year</div>
                </div>
              )}

              {/* Meta */}
              <div className={styles.sidebarMeta}>
                <div className={styles.sidebarMetaRow}>
                  <span className={styles.sidebarMetaLabel}>Job type</span>
                  <span className={styles.sidebarMetaVal}>
                    {TYPE_LABELS[job.type] ?? job.type}
                  </span>
                </div>
                <div className={styles.sidebarMetaRow}>
                  <span className={styles.sidebarMetaLabel}>Work mode</span>
                  <span className={styles.sidebarMetaVal}>
                    {MODE_LABELS[job.locationType] ?? job.locationType}
                  </span>
                </div>
                <div className={styles.sidebarMetaRow}>
                  <span className={styles.sidebarMetaLabel}>Openings</span>
                  <span className={styles.sidebarMetaVal}>{job.openings}</span>
                </div>
                {dl !== null && (
                  <div className={styles.sidebarMetaRow}>
                    <span className={styles.sidebarMetaLabel}>Deadline</span>
                    <span
                      className={`${styles.sidebarMetaVal} ${dl <= 7 ? styles.deadlineSoon : ""}`}
                    >
                      {dl === 0 ? "Today!" : `${dl} days left`}
                    </span>
                  </div>
                )}
                <div className={styles.sidebarMetaRow}>
                  <span className={styles.sidebarMetaLabel}>Views</span>
                  <span className={styles.sidebarMetaVal}>
                    {job.viewsCount}
                  </span>
                </div>
              </div>

              {/* Apply / Applied button */}
              {hasApplied ? (
                <div className={styles.btnApplied}>
                  <CheckCircle2 size={16} /> Applied Successfully
                </div>
              ) : (
                <button
                  className={styles.btnPrimary}
                  onClick={() => setShowModal(true)}
                >
                  Apply Now
                </button>
              )}

              {/* Save button */}
              <button
                className={`${styles.btnGhost} ${isSaved ? styles.btnGhostSaved : ""}`}
                onClick={toggleSave}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck size={15} /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark size={15} /> Save Job
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Company card */}
          <div className={styles.card}>
            <div className={styles.companyCard}>
              <div className={styles.companyCardLogo}>
                {job.company.logoUrl ? (
                  <img
                    src={job.company.logoUrl}
                    alt={job.company.companyName}
                  />
                ) : (
                  toInitials(job.company.companyName)
                )}
              </div>
              <div>
                <p className={styles.companyCardName}>
                  {job.company.companyName}
                  {job.company.isVerified && (
                    <ShieldCheck
                      size={12}
                      style={{
                        color: "var(--status-success)",
                        marginLeft: 5,
                        display: "inline",
                      }}
                    />
                  )}
                </p>
                <p className={styles.companyCardIndustry}>
                  {job.company.industry}
                </p>
              </div>
              {job.company.description && (
                <p className={styles.companyDesc}>{job.company.description}</p>
              )}
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.companyLink}
                >
                  <Globe size={13} /> Visit website
                </a>
              )}

              {/* Perks */}
              {perks.length > 0 && (
                <>
                  <div className={styles.divider} />
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".4px",
                      margin: 0,
                    }}
                  >
                    Perks
                  </p>
                  <div className={styles.perkGrid}>
                    {perks.slice(0, 6).map((p) => (
                      <div key={p} className={styles.perkItem}>
                        <CheckCircle2
                          size={13}
                          style={{
                            color: "var(--status-success)",
                            flexShrink: 0,
                          }}
                        />
                        {p}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {showModal && (
        <ApplyModal
          jobTitle={job.title}
          company={job.company.companyName}
          applying={applying}
          applyError={applyError}
          onApply={handleApply}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
