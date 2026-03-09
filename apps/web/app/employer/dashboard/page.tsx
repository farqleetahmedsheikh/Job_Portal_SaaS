/** @format */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  Eye,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart2,
  Star,
  Building2,
  Send,
  MessageSquare,
  Bell,
} from "lucide-react";
import styles from "../../styles/emp-dashboard.module.css";

// ─── Mock data ────────────────────────────────────────────
const STATS = [
  {
    label: "Active Jobs",
    value: 6,
    delta: "+2 this month",
    icon: <Briefcase size={18} />,
    color: "var(--color-secondary)",
  },
  {
    label: "Total Applicants",
    value: 142,
    delta: "+28 this week",
    icon: <Users size={18} />,
    color: "#f59e0b",
  },
  {
    label: "Interviews Today",
    value: 3,
    delta: "Next at 2:00 PM",
    icon: <Calendar size={18} />,
    color: "var(--status-success)",
  },
  {
    label: "Positions Filled",
    value: 4,
    delta: "This quarter",
    icon: <CheckCircle2 size={18} />,
    color: "#8b5cf6",
  },
];

const RECENT_APPLICATIONS = [
  {
    id: "1",
    name: "Alex Rivera",
    role: "Senior Frontend Eng.",
    company: "Stripe",
    avatar: "AR",
    status: "new",
    time: "10m ago",
    match: 94,
  },
  {
    id: "2",
    name: "Priya Patel",
    role: "React Developer",
    company: "Vercel",
    avatar: "PP",
    status: "reviewing",
    time: "2h ago",
    match: 88,
  },
  {
    id: "3",
    name: "Jordan Lee",
    role: "UI Engineer",
    company: "Linear",
    avatar: "JL",
    status: "interview",
    time: "Yesterday",
    match: 91,
  },
  {
    id: "4",
    name: "Sam Wilson",
    role: "Full Stack Engineer",
    company: "Notion",
    avatar: "SW",
    status: "offered",
    time: "2d ago",
    match: 79,
  },
  {
    id: "5",
    name: "Casey Morgan",
    role: "Frontend Lead",
    company: "Figma",
    avatar: "CM",
    status: "rejected",
    time: "3d ago",
    match: 62,
  },
];

const ACTIVE_JOBS = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    applicants: 48,
    views: 342,
    posted: "Mar 1",
    daysLeft: 20,
    status: "active",
  },
  {
    id: "2",
    title: "React Developer",
    applicants: 31,
    views: 218,
    posted: "Mar 4",
    daysLeft: 26,
    status: "active",
  },
  {
    id: "3",
    title: "UI/UX Designer",
    applicants: 19,
    views: 156,
    posted: "Feb 28",
    daysLeft: 18,
    status: "active",
  },
  {
    id: "4",
    title: "Backend Engineer",
    applicants: 27,
    views: 189,
    posted: "Feb 25",
    daysLeft: 15,
    status: "paused",
  },
];

const UPCOMING_INTERVIEWS = [
  {
    id: "1",
    candidate: "Alex Rivera",
    role: "Senior Frontend Eng.",
    time: "Today, 2:00 PM",
    type: "Video",
    avatar: "AR",
  },
  {
    id: "2",
    candidate: "Priya Patel",
    role: "React Developer",
    time: "Today, 4:30 PM",
    type: "Video",
    avatar: "PP",
  },
  {
    id: "3",
    candidate: "Jordan Lee",
    role: "UI Engineer",
    time: "Tomorrow, 10:00 AM",
    type: "Phone",
    avatar: "JL",
  },
];

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  new: { label: "New", cls: "sNew" },
  reviewing: { label: "Reviewing", cls: "sReviewing" },
  interview: { label: "Interview", cls: "sInterview" },
  offered: { label: "Offered", cls: "sOffered" },
  rejected: { label: "Rejected", cls: "sRejected" },
};

export default function EmployerDashboardPage() {
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{greeting}, Acme Corp 👋</h1>
          <p className={styles.subtitle}>
            Here&apos;s what&apos;s happening with your hiring today.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`}>
            <Bell size={15} /> Alerts <span className={styles.alertDot} />
          </button>
          <Link
            href="/employer/jobs/new"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus size={15} /> Post a job
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statTop}>
              <div
                className={styles.statIcon}
                style={{
                  background: `${s.color}18`,
                  color: s.color,
                  border: `1px solid ${s.color}28`,
                }}
              >
                {s.icon}
              </div>
              <TrendingUp
                size={14}
                style={{ color: "var(--status-success)" }}
              />
            </div>
            <p className={styles.statValue}>{s.value}</p>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statDelta}>{s.delta}</p>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* ── Recent Applications ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Applications</h2>
            <Link href="/employer/applicants" className={styles.cardLink}>
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className={styles.appList}>
            {RECENT_APPLICATIONS.map((a) => {
              const cfg = STATUS_CFG[a.status];
              return (
                <Link
                  key={a.id}
                  href={`/employer/applicants/${a.id}`}
                  className={styles.appRow}
                >
                  <div className={styles.appAvatar}>{a.avatar}</div>
                  <div className={styles.appInfo}>
                    <p className={styles.appName}>{a.name}</p>
                    <p className={styles.appRole}>{a.role}</p>
                  </div>
                  <div className={styles.appRight}>
                    <span className={`${styles.statusChip} ${styles[cfg.cls]}`}>
                      {cfg.label}
                    </span>
                    <span className={styles.appTime}>{a.time}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Upcoming Interviews ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Upcoming Interviews</h2>
            <Link href="/employer/interviews" className={styles.cardLink}>
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {UPCOMING_INTERVIEWS.map((iv) => (
            <div key={iv.id} className={styles.ivRow}>
              <div className={styles.ivAvatar}>{iv.avatar}</div>
              <div className={styles.ivInfo}>
                <p className={styles.ivName}>{iv.candidate}</p>
                <p className={styles.ivRole}>{iv.role}</p>
              </div>
              <div className={styles.ivRight}>
                <span className={styles.ivTime}>
                  <Clock size={10} /> {iv.time}
                </span>
                <span className={styles.ivType}>{iv.type}</span>
              </div>
            </div>
          ))}
          <Link
            href="/employer/interviews"
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}
            style={{ marginTop: 12 }}
          >
            <Calendar size={13} /> Manage schedule
          </Link>
        </div>

        {/* ── Active Jobs ── */}
        <div className={`${styles.card} ${styles.cardWide}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Active Job Postings</h2>
            <Link href="/employer/jobs" className={styles.cardLink}>
              Manage jobs <ChevronRight size={13} />
            </Link>
          </div>
          <div className={styles.jobTable}>
            <div className={styles.jobTableHead}>
              <span>Title</span>
              <span>Applicants</span>
              <span>Views</span>
              <span>Posted</span>
              <span>Expires</span>
              <span>Status</span>
              <span></span>
            </div>
            {ACTIVE_JOBS.map((j) => (
              <div key={j.id} className={styles.jobTableRow}>
                <span className={styles.jobTitle}>{j.title}</span>
                <span className={styles.jobStat}>
                  <Users size={11} /> {j.applicants}
                </span>
                <span className={styles.jobStat}>
                  <Eye size={11} /> {j.views}
                </span>
                <span className={styles.jobMeta}>{j.posted}</span>
                <span
                  className={styles.jobDays}
                  style={{
                    color:
                      j.daysLeft <= 7
                        ? "var(--status-danger)"
                        : "var(--text-muted)",
                  }}
                >
                  {j.daysLeft}d left
                </span>
                <span
                  className={`${styles.jobStatus} ${j.status === "active" ? styles.jobActive : styles.jobPaused}`}
                >
                  {j.status === "active" ? "Active" : "Paused"}
                </span>
                <Link
                  href={`/employer/jobs/${j.id}/applicants`}
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                >
                  <Eye size={11} /> View
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 14 }}>
            Quick Actions
          </h2>
          <div className={styles.quickActions}>
            {[
              {
                icon: <Plus size={16} />,
                label: "Post a new job",
                href: "/employer/jobs/new",
              },
              {
                icon: <Users size={16} />,
                label: "Review applications",
                href: "/employer/applicants",
              },
              {
                icon: <Calendar size={16} />,
                label: "Schedule interview",
                href: "/employer/interviews",
              },
              {
                icon: <Building2 size={16} />,
                label: "Edit company profile",
                href: "/employer/company",
              },
              {
                icon: <MessageSquare size={16} />,
                label: "View messages",
                href: "/employer/messages",
              },
              {
                icon: <BarChart2 size={16} />,
                label: "View analytics",
                href: "/employer/analytics",
              },
            ].map((a) => (
              <Link key={a.label} href={a.href} className={styles.quickAction}>
                <span className={styles.quickIcon}>{a.icon}</span>
                <span>{a.label}</span>
                <ChevronRight
                  size={13}
                  style={{ marginLeft: "auto", color: "var(--text-muted)" }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
