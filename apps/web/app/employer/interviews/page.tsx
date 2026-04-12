/** @format */
"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Building2,
  Plus,
  XCircle,
  MessageSquare,
  Edit2,
  Copy,
  MoreVertical,
} from "lucide-react";
import { useInterviews } from "../../hooks/useInterviews";
import { CandidateAvatar } from "../../components/ui/CandidateAvatar";
import { formatDateTime } from "../../lib";
import {
  TYPE_META,
  STATUS_META,
  type Interview,
  type InterviewFormat,
} from "../../types/interviews.types";
import { ScheduleInterviewModal } from "../../components/ui/ScheduleInterviewModal";
import { RescheduleModal } from "../../components/ui/RescheduleModal";
import styles from "../styles/emp-interviews.module.css";
import Link from "next/link";

const TYPE_ICON: Record<InterviewFormat, React.ReactNode> = {
  video: <Video size={13} />,
  phone: <Phone size={13} />,
  onsite: <Building2 size={13} />,
  async: <Clock size={13} />,
};

function isToday(iso: string) {
  const d = new Date(iso),
    t = new Date();
  return d.toDateString() === t.toDateString();
}

// ── InterviewCard ─────────────────────────────────────────────────────────────
function InterviewCard({
  iv,
  onCancel,
  onRescheduleSuccess,
}: {
  iv: Interview;
  onCancel: (id: string) => void;
  onRescheduleSuccess: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [copied, setCopied] = useState(false);
  const typeMeta = TYPE_META[iv.format];
  const statusMeta = STATUS_META[iv.status];
  const today = isToday(iv.scheduledAt);

  const handleCopy = () => {
    if (iv.meetLink) {
      navigator.clipboard.writeText(iv.meetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  return (
    <>
      <div
        className={`${styles.card} ${today ? styles.cardToday : ""} ${iv.status === "cancelled" ? styles.cardCancelled : ""}`}
      >
        {today && iv.status === "upcoming" && (
          <div className={styles.todayBanner}>
            <span className={styles.pulse} /> Today
          </div>
        )}
        <div className={styles.cardMain}>
          {/* Candidate */}
          <div className={styles.candidate}>
            <CandidateAvatar name={iv.candidate} avatarUrl={iv.avatarUrl} />
            <div className={styles.candidateInfo}>
              <p className={styles.candidateName}>{iv.candidate}</p>
              <p className={styles.candidateRole}>{iv.role}</p>
            </div>
          </div>

          {/* Time */}
          <div className={styles.timeBlock}>
            <div className={styles.timeMain}>
              <Calendar size={12} /> {formatDateTime(iv.scheduledAt)}
            </div>
            <div className={styles.timeSub}>
              <Clock size={11} /> {iv.duration} min
            </div>
          </div>

          {/* Type */}
          <span className={`${styles.typeChip} ${styles[typeMeta.cls]}`}>
            {TYPE_ICON[iv.format]} {typeMeta.label}
          </span>

          {/* Panelists */}
          {iv.interviewers.length > 0 && (
            <div className={styles.interviewers}>
              {iv.interviewers.slice(0, 3).map((name) => (
                <span key={name} className={styles.interviewer}>
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              ))}
              <span className={styles.interviewerNames}>
                {iv.interviewers.join(", ")}
              </span>
            </div>
          )}

          {/* Status */}
          <span className={`${styles.statusChip} ${styles[statusMeta.cls]}`}>
            {statusMeta.label}
          </span>

          {/* Actions */}
          <div className={styles.cardActions}>
            {iv.meetLink && iv.status === "upcoming" && (
              <Link
                href={iv.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
              >
                <Video size={12} /> Join
              </Link>
            )}
            {!iv.meetLink && iv.status === "upcoming" && (
              <Link
                href={`/employer/interviews/${iv.id}/room`}
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
              >
                <Video size={12} /> Join room
              </Link>
            )}
            <button
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            >
              <MessageSquare size={12} /> Message
            </button>
            <div className={styles.moreWrap}>
              <button
                className={styles.moreBtn}
                onClick={() => setShowMenu((p) => !p)}
              >
                <MoreVertical size={15} />
              </button>
              {showMenu && (
                <div className={styles.moreMenu}>
                  {iv.status === "upcoming" && (
                    <button
                      className={styles.moreItem}
                      onClick={() => {
                        setShowReschedule(true);
                        setShowMenu(false);
                      }}
                    >
                      <Edit2 size={12} /> Reschedule
                    </button>
                  )}
                  {iv.meetLink && (
                    <button className={styles.moreItem} onClick={handleCopy}>
                      <Copy size={12} /> {copied ? "Copied!" : "Copy link"}
                    </button>
                  )}
                  {iv.status === "upcoming" && (
                    <button
                      className={`${styles.moreItem} ${styles.moreItemDanger}`}
                      onClick={() => {
                        onCancel(iv.id);
                        setShowMenu(false);
                      }}
                    >
                      <XCircle size={12} /> Cancel interview
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {iv.notes && iv.status !== "cancelled" && (
          <div className={styles.cardNote}>{iv.notes}</div>
        )}
      </div>

      {showReschedule && (
        <RescheduleModal
          interviewId={iv.id}
          candidateName={iv.candidate}
          currentScheduledAt={iv.scheduledAt}
          currentDuration={iv.duration}
          onClose={() => setShowReschedule(false)}
          onRescheduled={() => {
            setShowReschedule(false);
            onRescheduleSuccess();
          }}
        />
      )}
    </>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className={styles.card} style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div className={styles.skeletonCircle} />
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div className={styles.skeletonLine} style={{ width: "40%" }} />
          <div className={styles.skeletonLine} style={{ width: "25%" }} />
        </div>
        <div className={styles.skeletonLine} style={{ width: 100 }} />
        <div className={styles.skeletonLine} style={{ width: 70 }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EmployerInterviewsPage() {
  const {
    loading,
    error,
    filter,
    setFilter,
    showModal,
    setShowModal,
    todayList,
    upcomingList,
    pastList,
    filtered,
    counts,
    handleCancel,
    onScheduled,
    refetch,
  } = useInterviews({ mode: "employer" });

  if (error)
    return (
      <div className={styles.page}>
        <p className={styles.errorMsg}>{error}</p>
      </div>
    );

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Interviews</h1>
          <p className={styles.subtitle}>
            {counts.upcoming} upcoming · {counts.today} today
          </p>
        </div>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} /> Schedule interview
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statRow}>
        {[
          { label: "Total", val: counts.all, color: "var(--text-primary)" },
          {
            label: "Upcoming",
            val: counts.upcoming,
            color: "var(--color-secondary)",
          },
          { label: "Today", val: counts.today, color: "#f59e0b" },
          {
            label: "Completed",
            val: counts.completed,
            color: "var(--status-success)",
          },
        ].map((s) => (
          <div key={s.label} className={styles.statPill}>
            <span className={styles.statVal} style={{ color: s.color }}>
              {s.val}
            </span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(["all", "upcoming", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            className={`${styles.tab} ${filter === f ? styles.tabActive : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={styles.tabCount}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {todayList.length > 0 && (
            <div className={styles.group}>
              <h2 className={styles.groupTitle}>
                <span className={styles.groupPulse} />
                Today · {todayList.length} interview
                {todayList.length > 1 ? "s" : ""}
              </h2>
              {todayList.map((iv) => (
                <InterviewCard
                  key={iv.id}
                  iv={iv}
                  onCancel={handleCancel}
                  onRescheduleSuccess={refetch}
                />
              ))}
            </div>
          )}

          {upcomingList.length > 0 &&
            (filter === "all" || filter === "upcoming") && (
              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Upcoming</h2>
                {upcomingList.map((iv) => (
                  <InterviewCard
                    key={iv.id}
                    iv={iv}
                    onCancel={handleCancel}
                    onRescheduleSuccess={refetch}
                  />
                ))}
              </div>
            )}

          {pastList.length > 0 &&
            (filter === "all" ||
              filter === "completed" ||
              filter === "cancelled") && (
              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Past</h2>
                {pastList.map((iv) => (
                  <InterviewCard
                    key={iv.id}
                    iv={iv}
                    onCancel={handleCancel}
                    onRescheduleSuccess={refetch}
                  />
                ))}
              </div>
            )}

          {filtered.length === 0 && (
            <div className={styles.empty}>
              <Calendar
                size={32}
                style={{ color: "var(--text-muted)", marginBottom: 12 }}
              />
              <p>No interviews found</p>
              <span>
                {filter === "all"
                  ? "Click 'Schedule interview' to get started"
                  : `No ${filter} interviews`}
              </span>
            </div>
          )}
        </>
      )}

      {/* Schedule modal */}
      {showModal && (
        <ScheduleInterviewModal
          onClose={() => setShowModal(false)}
          onScheduled={onScheduled}
        />
      )}
    </div>
  );
}
