/** @format */
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
  XCircle,
  ExternalLink,
  FileText,
  Award,
  Building2,
} from "lucide-react";
import styles from "../../styles/applicant-profile.module.css";
import { useApplicantProfile } from "../../../hooks/useApplicantProfile";
import { AppStatus, STATUS_META } from "../../../types/applicants.types";
import { ScheduleInterviewModal } from "../../../components/ui/ScheduleInterviewModal";
import { useUser } from "../../../store/session.store";
import { useCompany } from "../../../hooks/useCompany";
import Image from "next/image";

export default function ApplicantProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { profile, loading, error, changeStatus, toggleStar, saveNotes } =
    useApplicantProfile(id);

  const [notes, setNotes] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"overview" | "resume" | "cover">("overview");
  const [scheduling, setScheduling] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const user = useUser();
  const { company } = useCompany();
  console.log("User---->", user);

  if (loading) {
    return (
      <div className={styles.page}>
        <div
          className={styles.skeleton}
          style={{ height: 300, borderRadius: 12 }}
        />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.page}>
        <p style={{ color: "var(--status-error)" }}>
          {error ?? "Applicant not found."}
        </p>
      </div>
    );
  }

  const currentNotes = notes ?? profile.notes;
  const match = profile.match;
  const matchColor =
    match >= 90
      ? "var(--status-success)"
      : match >= 75
        ? "var(--color-secondary)"
        : "#f59e0b";

  const handleSaveNotes = async () => {
    await saveNotes(currentNotes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.page}>
      <Link
        href={
          profile.jobId
            ? `/employer/jobs/${profile.jobId}/applicants`
            : "/employer/applicants"
        }
        className={styles.back}
      >
        <ArrowLeft size={14} /> Back to applicants
      </Link>

      <div className={styles.layout}>
        {/* ── Main ── */}
        <div className={styles.main}>
          <div className={styles.profileCard}>
            <div className={styles.profileTop}>
              {/* Avatar */}
              <div className={styles.profileAvatar}>
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.name}
                    width={80}
                    height={80}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  profile.avatar
                )}
              </div>

              <div className={styles.profileInfo}>
                <div className={styles.profileName}>
                  <h1>{profile.name}</h1>
                  <button
                    className={`${styles.starBtn} ${profile.starred ? styles.starActive : ""}`}
                    onClick={toggleStar}
                  >
                    <Star
                      size={16}
                      style={{ fill: profile.starred ? "#f59e0b" : "none" }}
                    />
                  </button>
                </div>
                <p className={styles.profileTitle}>{profile.title}</p>
                <div className={styles.profileMeta}>
                  {profile.location !== "—" && (
                    <span>
                      <MapPin size={11} /> {profile.location}
                    </span>
                  )}
                  {profile.experienceYears !== undefined && (
                    <span>
                      <Briefcase size={11} /> {profile.experienceYears} yrs exp
                    </span>
                  )}
                  <span>
                    <Clock size={11} /> Applied{" "}
                    {new Date(profile.appliedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.profileLinks}>
                  {profile.showEmail && (
                    <Link
                      href={`mailto:${profile.email}`}
                      className={styles.profileLink}
                    >
                      <Mail size={12} /> {profile.email}
                    </Link>
                  )}
                  {profile.showPhone && (
                    <Link
                      href={`tel:${profile.phone}`}
                      className={styles.profileLink}
                    >
                      <Phone size={12} /> {profile.phone}
                    </Link>
                  )}
                  {profile.linkedin && (
                    <Link
                      href={`https://${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.profileLink}
                    >
                      <Linkedin size={12} /> LinkedIn
                    </Link>
                  )}
                  {profile.github && (
                    <Link
                      href={`https://${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.profileLink}
                    >
                      <Github size={12} /> GitHub
                    </Link>
                  )}
                  {profile.portfolio && (
                    <Link
                      href={`https://${profile.portfolio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.profileLink}
                    >
                      <Globe size={12} /> Portfolio
                    </Link>
                  )}
                </div>
              </div>

              {match > 0 && (
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
              )}
            </div>

            {profile.skills.length > 0 && (
              <div className={styles.skillsRow}>
                {profile.skills.map((s) => (
                  <span key={s} className={styles.skill}>
                    {s}
                  </span>
                ))}
              </div>
            )}
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

          {/* Overview */}
          {tab === "overview" && (
            <div className={styles.tabContent}>
              {profile.summary && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Summary</h2>
                  <p className={styles.prose}>{profile.summary}</p>
                </div>
              )}
              {profile.experiences.length > 0 && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Work Experience</h2>
                  <div className={styles.expList}>
                    {profile.experiences.map((e, i) => (
                      <div key={i} className={styles.expItem}>
                        <div className={styles.expDot} />
                        <div className={styles.expContent}>
                          <div className={styles.expHeader}>
                            <p className={styles.expRole}>{e.role}</p>
                            {e.duration && (
                              <span className={styles.expDuration}>
                                {e.duration}
                              </span>
                            )}
                          </div>
                          <p className={styles.expCompany}>
                            <Building2 size={10} /> {e.company}
                            {e.period ? ` · ${e.period}` : ""}
                          </p>
                          {e.desc && <p className={styles.expDesc}>{e.desc}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {profile.educations.length > 0 && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Education</h2>
                  {profile.educations.map((e, i) => (
                    <div key={i} className={styles.eduItem}>
                      <Award
                        size={14}
                        style={{
                          color: "var(--color-secondary)",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <p className={styles.eduDegree}>{e.degree}</p>
                        <p className={styles.eduSchool}>
                          {e.school}
                          {e.year ? ` · ${e.year}` : ""}
                          {e.gpa ? ` · GPA ${e.gpa}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Resume */}
          {tab === "resume" && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                {profile.resumeUrl ? (
                  <>
                    <div className={styles.resumeActions}>
                      <div className={styles.resumeFile}>
                        <FileText
                          size={18}
                          style={{ color: "var(--color-secondary)" }}
                        />
                        <span>Resume_{profile.name.replace(" ", "_")}.pdf</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link
                          href={profile.resumeUrl}
                          download
                          className={`${styles.btn} ${styles.btnGhost}`}
                        >
                          <Download size={13} /> Download
                        </Link>
                        <Link
                          href={profile.resumeUrl.replace(
                            "/upload/",
                            "/upload/fl_attachment/",
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.btn} ${styles.btnGhost}`}
                        >
                          <ExternalLink size={13} /> Open
                        </Link>
                      </div>
                    </div>
                    <div className={styles.resumePreview} />
                  </>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    No resume uploaded.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {tab === "cover" && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Cover Letter</h2>
                {profile.coverLetter ? (
                  <p className={styles.prose}>{profile.coverLetter}</p>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    No cover letter submitted.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          {/* Status */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Application Status</h3>
            <div className={styles.statusOptions}>
              {(
                Object.entries(STATUS_META) as [
                  AppStatus,
                  { label: string; cls: string },
                ][]
              )
                .filter(([val]) => val !== "withdrawn")
                .map(([val, { label, cls }]) => (
                  <button
                    key={val}
                    className={`${styles.statusOption} ${profile.status === val ? styles.statusActive : ""} ${styles[cls]}`}
                    onClick={() => changeStatus(val)}
                  >
                    {profile.status === val && <CheckCircle2 size={12} />}{" "}
                    {label}
                  </button>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Actions</h3>
            <div className={styles.actionList}>
              <Link
                href={`/employer/messages?to=${profile.userId ?? ""}`}
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`}
              >
                <MessageSquare size={14} /> Send message
              </Link>

              {scheduledSuccess ? (
                <div
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
                  style={{
                    color: "var(--status-success)",
                    borderColor: "var(--status-success)",
                    pointerEvents: "none",
                  }}
                >
                  <CheckCircle2 size={14} /> Interview scheduled!
                </div>
              ) : (
                <button
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
                  onClick={() => setScheduling(true)}
                >
                  <Calendar size={14} /> Schedule interview
                </button>
              )}

              {profile.resumeUrl && (
                <Link
                  href={profile.resumeUrl}
                  download
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
                >
                  <Download size={14} /> Download resume
                </Link>
              )}
              <button
                className={`${styles.btn} ${styles.btnDangerGhost} ${styles.btnFull}`}
                onClick={() => changeStatus("rejected")}
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
              value={currentNotes}
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

          {/* Quick info */}
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Quick Info</h3>
            <div className={styles.quickFacts}>
              {[
                {
                  label: "Applied",
                  val: new Date(profile.appliedAt).toLocaleDateString(),
                },
                {
                  label: "Experience",
                  val: profile.experienceYears
                    ? `${profile.experienceYears} years`
                    : "—",
                },
                { label: "Job", val: profile.jobTitle ?? "—" },
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

      {/* ── Schedule interview modal ── */}
      {scheduling && (
        <ScheduleInterviewModal
          prefillApplicationId={profile.id}
          prefillApplicantName={profile.name}
          prefillCandidateId={profile.userId}
          prefillCompanyId={company?.id}
          prefillScheduledById={user?.id}
          prefillJobTitle={profile.jobTitle}
          onClose={() => setScheduling(false)}
          onScheduled={() => {
            setScheduling(false);
            setScheduledSuccess(true);
            changeStatus("interview");
          }}
        />
      )}
    </div>
  );
}
