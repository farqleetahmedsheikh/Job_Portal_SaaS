/* eslint-disable @typescript-eslint/no-explicit-any */
/** @format */

"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Video,
  Phone,
  Building2,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Users,
  Link as LinkIcon,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { api } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "../styles/schedule-modal.module.css";
import { INTERVIEW_TYPE_META } from "../../types/interviews.types";
import Image from "next/image";

type InterviewType = "video" | "phone" | "onsite";
interface Job {
  id: string;
  title: string;
  location: string;
  companyId: string;
}
interface Applicant {
  id: string;
  name: string;
  avatarUrl?: string;
  title: string;
}
interface Panelist {
  name: string;
}

interface Props {
  prefillApplicationId?: string;
  prefillApplicantName?: string;
  prefillJobTitle?: string;
  prefillCandidateId?: string; // ← new: applicant's userId (not applicationId)
  prefillCompanyId?: string;
  prefillScheduledById?: string;
  onClose: () => void;
  onScheduled: () => void;
}

const TYPE_OPTIONS = [
  {
    value: "video" as const,
    label: "Video call",
    icon: <Video size={15} />,
    desc: "In-app video room",
  },
  {
    value: "phone" as const,
    label: "Phone call",
    icon: <Phone size={15} />,
    desc: "Audio only",
  },
  {
    value: "onsite" as const,
    label: "On-site",
    icon: <Building2 size={15} />,
    desc: "In-person",
  },
];

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hr" },
  { value: 90, label: "1.5 hr" },
  { value: 120, label: "2 hr" },
];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function initials(name: string) {
  return (
    name
      ?.split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function ScheduleInterviewModal({
  prefillApplicationId,
  prefillApplicantName,
  prefillJobTitle,
  prefillCandidateId, // ← new
  prefillCompanyId,
  prefillScheduledById,
  onClose,
  onScheduled,
}: Props) {
  const isPrefilled = !!prefillApplicationId;
  const [step, setStep] = useState<"select" | "details">(
    isPrefilled ? "details" : "select",
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApps] = useState<Applicant[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Applicant | null>(null);
  const [type, setType] = useState<InterviewType>("video");
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(45);
  const [meetLink, setMeetLink] = useState("");
  const [notes, setNotes] = useState("");
  const [panelists, setPanelists] = useState<Panelist[]>([]);
  const [pInput, setPInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundType, setRoundType] =
    useState<keyof typeof INTERVIEW_TYPE_META>("technical");

  useEffect(() => {
    if (isPrefilled) return;
    setLoadingJobs(true);
    api<any[]>(`${API_BASE}/jobs?scope=mine&status=active&limit=50`, "GET")
      .then((d) =>
        setJobs(
          d.map((j) => ({
            id: j.id,
            title: j.title,
            location: j.location,
            companyId: j.companyId,
          })),
        ),
      )
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, [isPrefilled]);

  useEffect(() => {
    if (!selectedJob) return;
    setApps([]);
    setSelectedApp(null);
    setLoadingApps(true);
    api<any[]>(`${API_BASE}/applications?jobId=${selectedJob.id}`, "GET")
      .then((d) => {
        console.log("Apps for job", selectedJob.id, d);
        setApps(
          d
            .filter((a) => a.status === "shortlisted")
            .map((a) => ({
              id: a.id,
              name: a.applicant?.fullName ?? "Unknown",
              avatarUrl: a.applicant?.avatarUrl,
              title: a.applicant?.applicantProfile?.jobTitle ?? "—",
            })),
        );
      })
      .catch(() => {})
      .finally(() => setLoadingApps(false));
  }, [selectedJob]);

  const addPanelist = () => {
    const n = pInput.trim();
    if (!n) return;
    setPanelists((p) => [...p, { name: n }]);
    setPInput("");
  };

  // handleSubmit — send candidateId and companyId
  const handleSubmit = async () => {
    const appId = isPrefilled ? prefillApplicationId : selectedApp?.id;
    const candidateId = isPrefilled ? prefillCandidateId : selectedApp?.id; // ← applicant userId
    const companyId = isPrefilled ? prefillCompanyId : selectedJob?.companyId;
    const scheduledById = prefillScheduledById; // ← from props (current user)

    if (!appId) {
      setError("Please select an applicant.");
      return;
    }
    if (!date || !time) {
      setError("Date and time are required.");
      return;
    }
    const scheduledAt = new Date(`${date}T${time}:00`);
    if (scheduledAt <= new Date()) {
      setError("Please pick a future date and time.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      console.log("Scheduling interview with data:", {
        applicationId: appId,
        candidateId,
        companyId,
        scheduledById,
        type,
        roundType,
        scheduledAt: scheduledAt.toISOString(),
        duration,
        meetLink,
        notes,
        panelists,
      });
      await api(`${API_BASE}/interviews`, "POST", {
        applicationId: appId,
        candidateId, // ← was missing
        companyId, // ← was missing
        scheduledById,
        type,
        roundType,
        scheduledAt: scheduledAt.toISOString(),
        durationMins: duration,
        meetLink: meetLink || undefined,
        notes: notes || undefined,
        panelists: panelists.length ? panelists : undefined,
      });
      onScheduled();
    } catch (e: any) {
      setError(e.message ?? "Failed to schedule.");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Schedule interview</h2>
            {!isPrefilled && (
              <div className={styles.breadcrumb}>
                <span
                  className={`${styles.crumb} ${step === "select" ? styles.crumbActive : styles.crumbDone}`}
                >
                  1 · Select applicant
                </span>
                <span className={styles.crumbSep}>›</span>
                <span
                  className={`${styles.crumb} ${step === "details" ? styles.crumbActive : ""}`}
                >
                  2 · Details
                </span>
              </div>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ── Step 1: Select ── */}
        {step === "select" && (
          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Job posting</label>
              {loadingJobs ? (
                <div className={styles.skeletonList}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.skeletonRow} />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <p className={styles.emptyNote}>No active jobs found.</p>
              ) : (
                <div className={styles.pickList}>
                  {jobs.map((j) => (
                    <button
                      key={j.id}
                      className={`${styles.pickItem} ${selectedJob?.id === j.id ? styles.pickItemActive : ""}`}
                      onClick={() => setSelectedJob(j)}
                    >
                      <div className={styles.pickIcon}>
                        <FileText size={13} />
                      </div>
                      <div className={styles.pickInfo}>
                        <span className={styles.pickTitle}>{j.title}</span>
                        <span className={styles.pickSub}>{j.location}</span>
                      </div>
                      {selectedJob?.id === j.id && (
                        <CheckCircle2 size={14} className={styles.pickCheck} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedJob && (
              <div className={styles.field}>
                <label className={styles.label}>
                  Shortlisted applicant
                  {applicants.length > 0 && (
                    <span className={styles.labelBadge}>
                      {applicants.length}
                    </span>
                  )}
                </label>
                {loadingApps ? (
                  <div className={styles.skeletonList}>
                    {[1, 2].map((i) => (
                      <div key={i} className={styles.skeletonRow} />
                    ))}
                  </div>
                ) : applicants.length === 0 ? (
                  <div className={styles.emptyNote}>
                    No shortlisted applicants for this job. Move an applicant to
                    &quot;Shortlisted&quot; status first.
                  </div>
                ) : (
                  <div className={styles.pickList}>
                    {applicants.map((a) => (
                      <button
                        key={a.id}
                        className={`${styles.pickItem} ${selectedApp?.id === a.id ? styles.pickItemActive : ""}`}
                        onClick={() => setSelectedApp(a)}
                      >
                        <div className={styles.appAvatar}>
                          {a.avatarUrl ? (
                            <Image
                              src={a.avatarUrl}
                              alt={a.name}
                              width={40}
                              height={40}
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            initials(a.name)
                          )}
                        </div>
                        <div className={styles.pickInfo}>
                          <span className={styles.pickTitle}>{a.name}</span>
                          <span className={styles.pickSub}>{a.title}</span>
                        </div>
                        {selectedApp?.id === a.id && (
                          <CheckCircle2
                            size={14}
                            className={styles.pickCheck}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {step === "details" && (
          <div className={styles.body}>
            {isPrefilled && (
              <div className={styles.prefillBanner}>
                <Users size={13} />
                Scheduling for <strong>{prefillApplicantName}</strong>
                {prefillJobTitle && <> · {prefillJobTitle}</>}
              </div>
            )}

            {/* Type */}
            <div className={styles.field}>
              <label className={styles.label}>Interview type</label>
              <div className={styles.typeGrid}>
                {TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`${styles.typeCard} ${type === o.value ? styles.typeCardActive : ""}`}
                    onClick={() => setType(o.value)}
                  >
                    <span className={styles.typeIcon}>{o.icon}</span>
                    <span className={styles.typeLabel}>{o.label}</span>
                    <span className={styles.typeDesc}>{o.desc}</span>
                    {type === o.value && (
                      <CheckCircle2 size={11} className={styles.typeCheck} />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Interview Round type */}
            <div className={styles.field}>
              <label className={styles.label}>Round type</label>
              <div className={styles.pillRow}>
                {(
                  Object.entries(INTERVIEW_TYPE_META) as [
                    string,
                    { label: string },
                  ][]
                ).map(([val, { label }]) => (
                  <button
                    key={val}
                    type="button"
                    className={`${styles.pill} ${roundType === val ? styles.pillActive : ""}`}
                    onClick={() => setRoundType(val as any)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Calendar size={11} /> Date
                </label>
                <input
                  className={styles.input}
                  type="date"
                  value={date}
                  min={tomorrow()}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Clock size={11} /> Time
                </label>
                <input
                  className={styles.input}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Duration */}
            <div className={styles.field}>
              <label className={styles.label}>Duration</label>
              <div className={styles.pillRow}>
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`${styles.pill} ${duration === d.value ? styles.pillActive : ""}`}
                    onClick={() => setDuration(d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meet link */}
            {type !== "onsite" && (
              <div className={styles.field}>
                <label className={styles.label}>
                  <LinkIcon size={11} /> Meet link{" "}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  className={styles.input}
                  placeholder="https://meet.google.com/… or Zoom link"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                />
                <p className={styles.hint}>
                  Leave blank to use HiringFly&apos;s built-in video room
                </p>
              </div>
            )}

            {/* Panelists */}
            <div className={styles.field}>
              <label className={styles.label}>
                <Users size={11} /> Panelists{" "}
                <span className={styles.optional}>(optional)</span>
              </label>
              <div className={styles.panelistRow}>
                <input
                  className={styles.input}
                  placeholder="Interviewer name — press Enter to add"
                  value={pInput}
                  onChange={(e) => setPInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPanelist();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={addPanelist}
                >
                  <Plus size={14} />
                </button>
              </div>
              {panelists.length > 0 && (
                <div className={styles.tags}>
                  {panelists.map((p, i) => (
                    <span key={i} className={styles.tag}>
                      {p.name}
                      <button
                        onClick={() =>
                          setPanelists((l) => l.filter((_, x) => x !== i))
                        }
                      >
                        <Trash2 size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className={styles.field}>
              <label className={styles.label}>
                Notes for candidate{" "}
                <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Topics to cover, what to prepare, dress code…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={12} /> {error}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className={styles.footer}>
          {step === "details" && !isPrefilled ? (
            <button
              className={styles.backBtn}
              onClick={() => setStep("select")}
            >
              ← Back
            </button>
          ) : (
            <button
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          {step === "select" ? (
            <button
              className={styles.nextBtn}
              onClick={() => setStep("details")}
              disabled={!selectedApp}
            >
              Continue{" "}
              <ChevronDown size={13} style={{ transform: "rotate(-90deg)" }} />
            </button>
          ) : (
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className={styles.spinner} /> Scheduling…
                </>
              ) : (
                <>
                  <Calendar size={13} /> Schedule &amp; notify
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
