/** @format */

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Video,
  Phone,
  MapPin,
  Clock,
  Calendar,
  ChevronRight,
  Bell,
  CheckCircle2,
  XCircle,
  Building2,
  ExternalLink,
} from "lucide-react";
import { useInterviews } from "../../hooks/useInterviews";
import type { Interview, FilterTab } from "../../types/interviews.types";
import { TYPE_META, STATUS_META } from "../../types/interviews.types";
import styles from "../styles/interview.module.css";
import Image from "next/image";

// ─── Date / time helpers ──────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

// ─── Format icon map ──────────────────────────────────────────────────────────

const FORMAT_ICON: Record<string, React.ReactNode> = {
  video: <Video size={13} />,
  phone: <Phone size={13} />,
  onsite: <MapPin size={13} />,
  async: <Clock size={13} />,
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  upcoming: <Clock size={11} />,
  completed: <CheckCircle2 size={11} />,
  cancelled: <XCircle size={11} />,
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

// ─── Interview card ───────────────────────────────────────────────────────────

function InterviewCard({ interview }: { interview: Interview }) {
  const [expanded, setExpanded] = useState(false);

  const typeMeta = TYPE_META[interview.format];
  const statusMeta = STATUS_META[interview.status];
  const isUpcoming = interview.status === "upcoming";

  // All panelists come from panelists[] — no separate interviewers[]
  const primaryInterviewer = interview.panelists[0]?.name ?? "—";
  const extraInterviewers = interview.panelists.slice(1).map((p) => p.name);

  // Fallback initials when no logo URL
  const logoFallback =
    interview.company
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div
      className={`${styles["interview-card"]} ${styles[`card-${interview.status}`]}`}
      onClick={() => setExpanded((p) => !p)}
    >
      <div
        className={`${styles["card-accent"]} ${styles[`accent-${interview.status}`]}`}
      />

      <div className={styles["card-inner"]}>
        {/* Row 1 — logo + info + status */}
        <div className={styles["card-top"]}>
          <div className={styles["card-logo"]}>
            {interview.companyLogoUrl ? (
              <Image
                src={interview.companyLogoUrl}
                alt={interview.company}
                width={40}
                height={40}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 6,
                }}
              />
            ) : (
              logoFallback // ← was interview.companyLogo (doesn't exist)
            )}
          </div>

          <div className={styles["card-info"]}>
            <div className={styles["card-role"]}>{interview.jobTitle}</div>
            <div className={styles["card-company"]}>
              <Building2 size={11} /> {interview.company}
            </div>
          </div>

          <div className={styles["card-right"]}>
            <span
              className={`${styles["status-badge"]} ${styles[statusMeta.cls]}`}
            >
              {STATUS_ICON[interview.status]} {statusMeta.label}
            </span>
            <ChevronRight
              size={15}
              className={`${styles.chevron} ${expanded ? styles["chevron-open"] : ""}`}
            />
          </div>
        </div>

        {/* Row 2 — meta */}
        <div className={styles["card-meta"]}>
          <span className={styles["meta-item"]}>
            <Calendar size={11} /> {formatDate(interview.scheduledAt)}
          </span>
          <span className={styles["meta-item"]}>
            <Clock size={11} /> {formatTime(interview.scheduledAt)} ·{" "}
            {formatDuration(interview.duration)}
          </span>
          <span className={styles["meta-item"]}>
            {FORMAT_ICON[interview.format]} {typeMeta.label}
          </span>
          <span className={styles["meta-round"]}>
            {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}{" "}
            Round
          </span>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className={styles["card-details"]}>
            <div className={styles["details-grid"]}>
              <div className={styles["detail-item"]}>
                <span className={styles["detail-label"]}>Interviewer</span>
                <span className={styles["detail-value"]}>
                  {primaryInterviewer}
                </span>
              </div>

              {extraInterviewers.length > 0 && (
                <div className={styles["detail-item"]}>
                  <span className={styles["detail-label"]}>Also joining</span>
                  <span className={styles["detail-value"]}>
                    {extraInterviewers.join(", ")}
                  </span>
                </div>
              )}

              {interview.location && (
                <div className={styles["detail-item"]}>
                  <span className={styles["detail-label"]}>Location</span>
                  <span className={styles["detail-value"]}>
                    {interview.location}
                  </span>
                </div>
              )}

              {interview.notes && (
                <div
                  className={`${styles["detail-item"]} ${styles["detail-full"]}`}
                >
                  <span className={styles["detail-label"]}>Notes</span>
                  <span className={styles["detail-value"]}>
                    {interview.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles["card-actions"]}>
              {isUpcoming && interview.meetLink && (
                <Link
                  href={interview.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.btn} ${styles["btn-primary"]}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Video size={13} /> Join Meeting <ExternalLink size={11} />
                </Link>
              )}
              {isUpcoming && !interview.meetLink && (
                <Link
                  href={`/applicant/interviews/${interview.id}/room`}
                  className={`${styles.btn} ${styles["btn-primary"]}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Video size={13} /> Join Room
                </Link>
              )}
              {isUpcoming && (
                <button
                  className={`${styles.btn} ${styles["btn-ghost"]}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Bell size={13} /> Set Reminder
                </button>
              )}
              <Link
                href={`/applicant/interviews/${interview.id}`}
                className={`${styles.btn} ${styles["btn-outline"]}`}
                onClick={(e) => e.stopPropagation()}
              >
                View Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div
            style={{
              height: 24,
              width: 140,
              background: "var(--surface)",
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              height: 14,
              width: 180,
              background: "var(--surface)",
              borderRadius: 4,
            }}
          />
        </div>
      </div>
      <div className={styles.list}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              height: 88,
              borderRadius: 12,
              marginBottom: 10,
              background: "var(--surface)",
              backgroundImage:
                "linear-gradient(90deg,var(--surface) 25%,var(--surface-hover,rgba(0,0,0,.03)) 50%,var(--surface) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InterviewsPage() {
  const { filtered, counts, loading, error, filter, setFilter } = useInterviews(
    { mode: "applicant" },
  );

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className={styles.page}>
        <p style={{ color: "var(--status-danger)", fontSize: 13 }}>⚠ {error}</p>
      </div>
    );
  }

  const todayList = filtered.filter(
    (i) => i.status === "upcoming" && isToday(i.scheduledAt),
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Interviews</h1>
          <p className={styles.subtitle}>
            {counts.upcoming > 0
              ? `${counts.upcoming} upcoming · ${todayList.length} today`
              : "No upcoming interviews"}
          </p>
        </div>
      </div>

      {/* Today banner */}
      {todayList[0] && (
        <div className={styles["today-banner"]}>
          <div className={styles["today-pulse"]} />
          <div>
            <p className={styles["today-label"]}>Today</p>
            <p className={styles["today-text"]}>
              {formatTime(todayList[0].scheduledAt)} · {todayList[0].jobTitle}{" "}
              at {todayList[0].company}
            </p>
          </div>
          {todayList[0].meetLink && (
            <Link
              href={todayList[0].meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btn} ${styles["btn-primary"]} ${styles["btn-sm"]}`}
            >
              <Video size={12} /> Join Now
            </Link>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className={styles["stats-row"]}>
        {[
          { label: "Total", value: counts.all, color: "var(--text-primary)" },
          {
            label: "Upcoming",
            value: counts.upcoming,
            color: "var(--color-secondary)",
          },
          {
            label: "Completed",
            value: counts.completed,
            color: "var(--status-success)",
          },
          {
            label: "Cancelled",
            value: counts.cancelled,
            color: "var(--status-danger)",
          },
        ].map((s) => (
          <div key={s.label} className={styles["stat-pill"]}>
            <span className={styles["stat-value"]} style={{ color: s.color }}>
              {s.value}
            </span>
            <span className={styles["stat-label"]}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${filter === tab.key ? styles["tab-active"] : ""}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className={styles["tab-count"]}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Calendar
              size={32}
              style={{ color: "var(--text-muted)", marginBottom: 12 }}
            />
            <p>No {filter === "all" ? "" : filter} interviews</p>
            <span>Your scheduled interviews will appear here</span>
          </div>
        ) : (
          filtered.map((iv) => <InterviewCard key={iv.id} interview={iv} />)
        )}
      </div>
    </div>
  );
}
