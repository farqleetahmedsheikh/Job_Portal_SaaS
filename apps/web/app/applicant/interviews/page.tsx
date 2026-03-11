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
  Plus,
  Bell,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  ExternalLink,
} from "lucide-react";
import styles from "../styles/interview.module.css";

// ─── Types ────────────────────────────────────────────────
type InterviewType = "video" | "phone" | "onsite";
type InterviewStatus = "upcoming" | "completed" | "cancelled" | "pending";

interface Interview {
  id: string;
  role: string;
  company: string;
  logo: string;
  date: string;
  time: string;
  duration: string;
  type: InterviewType;
  status: InterviewStatus;
  round: string;
  interviewer: string;
  link?: string;
  notes?: string;
  location?: string;
}

// ─── Mock data — replace with API ─────────────────────────
const INTERVIEWS: Interview[] = [
  {
    id: "1",
    role: "Senior Frontend Engineer",
    company: "Stripe",
    logo: "ST",
    date: "Today",
    time: "10:00 AM",
    duration: "45 min",
    type: "video",
    status: "upcoming",
    round: "Technical Round",
    interviewer: "Sarah Chen",
    link: "https://meet.google.com/abc-defg-hij",
    notes: "Focus on system design and React performance",
  },
  {
    id: "2",
    role: "Full Stack Developer",
    company: "Vercel",
    logo: "VC",
    date: "Tomorrow",
    time: "2:30 PM",
    duration: "60 min",
    type: "video",
    status: "upcoming",
    round: "HR Screening",
    interviewer: "James Park",
    link: "https://zoom.us/j/123456789",
  },
  {
    id: "3",
    role: "React Developer",
    company: "Linear",
    logo: "LN",
    date: "Mar 12",
    time: "11:00 AM",
    duration: "30 min",
    type: "phone",
    status: "upcoming",
    round: "Initial Screening",
    interviewer: "Maya Johnson",
  },
  {
    id: "4",
    role: "UI Engineer",
    company: "Figma",
    logo: "FG",
    date: "Mar 8",
    time: "3:00 PM",
    duration: "90 min",
    type: "onsite",
    status: "completed",
    round: "Final Round",
    interviewer: "Alex Torres",
    location: "San Francisco, CA",
    notes: "Great interview — awaiting feedback",
  },
  {
    id: "5",
    role: "Frontend Lead",
    company: "Notion",
    logo: "NT",
    date: "Mar 5",
    time: "10:00 AM",
    duration: "45 min",
    type: "video",
    status: "cancelled",
    round: "Technical Round",
    interviewer: "Priya Nair",
    notes: "Rescheduled — waiting for new slot",
  },
];

// ─── Config maps ──────────────────────────────────────────
const TYPE_CONFIG: Record<
  InterviewType,
  { icon: React.ReactNode; label: string }
> = {
  video: { icon: <Video size={13} />, label: "Video Call" },
  phone: { icon: <Phone size={13} />, label: "Phone Call" },
  onsite: { icon: <MapPin size={13} />, label: "On-site" },
};

const STATUS_CONFIG: Record<
  InterviewStatus,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  upcoming: {
    label: "Upcoming",
    icon: <Clock size={11} />,
    cls: "status-upcoming",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 size={11} />,
    cls: "status-completed",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle size={11} />,
    cls: "status-cancelled",
  },
  pending: {
    label: "Pending",
    icon: <AlertCircle size={11} />,
    cls: "status-pending",
  },
};

type FilterTab = "all" | InterviewStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

// ─── Interview Card ───────────────────────────────────────
function InterviewCard({ interview }: { interview: Interview }) {
  const [expanded, setExpanded] = useState(false);
  const type = TYPE_CONFIG[interview.type];
  const status = STATUS_CONFIG[interview.status];
  const isUpcoming = interview.status === "upcoming";

  return (
    <div
      className={`${styles["interview-card"]} ${styles[`card-${interview.status}`]}`}
      onClick={() => setExpanded((p) => !p)}
    >
      {/* Left accent bar */}
      <div
        className={`${styles["card-accent"]} ${styles[`accent-${interview.status}`]}`}
      />

      <div className={styles["card-inner"]}>
        {/* Row 1 — logo + info + status */}
        <div className={styles["card-top"]}>
          <div className={styles["card-logo"]}>{interview.logo}</div>

          <div className={styles["card-info"]}>
            <div className={styles["card-role"]}>{interview.role}</div>
            <div className={styles["card-company"]}>
              <Building2 size={11} />
              {interview.company}
            </div>
          </div>

          <div className={styles["card-right"]}>
            <span className={`${styles["status-badge"]} ${styles[status.cls]}`}>
              {status.icon} {status.label}
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
            <Calendar size={11} /> {interview.date}
          </span>
          <span className={styles["meta-item"]}>
            <Clock size={11} /> {interview.time} · {interview.duration}
          </span>
          <span className={styles["meta-item"]}>
            {type.icon} {type.label}
          </span>
          <span className={styles["meta-round"]}>{interview.round}</span>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className={styles["card-details"]}>
            <div className={styles["details-grid"]}>
              <div className={styles["detail-item"]}>
                <span className={styles["detail-label"]}>Interviewer</span>
                <span className={styles["detail-value"]}>
                  {interview.interviewer}
                </span>
              </div>
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
              {isUpcoming && interview.link && (
                <a
                  href={interview.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.btn} ${styles["btn-primary"]}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Video size={13} /> Join Meeting
                  <ExternalLink size={11} />
                </a>
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

// ─── Page ─────────────────────────────────────────────────
export default function InterviewsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered = INTERVIEWS.filter(
    (i) => activeTab === "all" || i.status === activeTab,
  );

  const upcoming = INTERVIEWS.filter((i) => i.status === "upcoming");
  const todayList = upcoming.filter((i) => i.date === "Today");

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Interviews</h1>
          <p className={styles.subtitle}>
            {upcoming.length > 0
              ? `${upcoming.length} upcoming · ${todayList.length} today`
              : "No upcoming interviews"}
          </p>
        </div>
        <button className={`${styles.btn} ${styles["btn-primary"]}`}>
          <Plus size={14} /> Schedule Interview
        </button>
      </div>

      {/* Today banner */}
      {todayList.length > 0 && (
        <div className={styles["today-banner"]}>
          <div className={styles["today-pulse"]} />
          <div>
            <p className={styles["today-label"]}>Today</p>
            <p className={styles["today-text"]}>
              {todayList[0]?.time} · {todayList[0]?.role} at{" "}
              {todayList[0]?.company}
            </p>
          </div>
          {todayList[0]?.link && (
            <a
              href={todayList[0]?.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btn} ${styles["btn-primary"]} ${styles["btn-sm"]}`}
            >
              <Video size={12} /> Join Now
            </a>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className={styles["stats-row"]}>
        {[
          {
            label: "Total",
            value: INTERVIEWS.length,
            color: "var(--text-primary)",
          },
          {
            label: "Upcoming",
            value: INTERVIEWS.filter((i) => i.status === "upcoming").length,
            color: "var(--color-secondary)",
          },
          {
            label: "Completed",
            value: INTERVIEWS.filter((i) => i.status === "completed").length,
            color: "var(--status-success)",
          },
          {
            label: "Cancelled",
            value: INTERVIEWS.filter((i) => i.status === "cancelled").length,
            color: "var(--status-danger)",
          },
        ].map((stat) => (
          <div key={stat.label} className={styles["stat-pill"]}>
            <span
              className={styles["stat-value"]}
              style={{ color: stat.color }}
            >
              {stat.value}
            </span>
            <span className={styles["stat-label"]}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles["tab-active"] : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className={styles["tab-count"]}>
              {tab.key === "all"
                ? INTERVIEWS.length
                : INTERVIEWS.filter((i) => i.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Interview list */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Calendar
              size={32}
              style={{ color: "var(--text-muted)", marginBottom: 12 }}
            />
            <p>No {activeTab === "all" ? "" : activeTab} interviews</p>
            <span>Schedule an interview to see it here</span>
          </div>
        ) : (
          filtered.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))
        )}
      </div>
    </div>
  );
}
