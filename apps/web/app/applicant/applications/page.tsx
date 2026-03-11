/** @format */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Clock,
  Search,
  ChevronDown,
  ExternalLink,
  Trash2,
  BookmarkCheck,
  Send,
  Eye,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Filter,
  Building2,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import styles from "../styles/applications.module.css";

// ─── Types ────────────────────────────────────────────────
type AppStatus =
  | "applied"
  | "reviewing"
  | "interview"
  | "offered"
  | "rejected"
  | "withdrawn";

type JobType = "full-time" | "part-time" | "contract" | "remote";

interface Application {
  id: string;
  role: string;
  company: string;
  logo: string;
  location: string;
  type: JobType;
  salary: string;
  appliedDate: string;
  lastUpdate: string;
  status: AppStatus;
  source: string;
  notes?: string;
  jobUrl?: string;
}

// ─── Mock data — replace with API ─────────────────────────
const APPLICATIONS: Application[] = [
  {
    id: "1",
    role: "Senior Frontend Engineer",
    company: "Stripe",
    logo: "ST",
    location: "Remote",
    type: "remote",
    salary: "$160k–$200k",
    appliedDate: "Mar 6, 2026",
    lastUpdate: "2 days ago",
    status: "interview",
    source: "LinkedIn",
    jobUrl: "#",
    notes: "Technical round scheduled for Mar 10",
  },
  {
    id: "2",
    role: "React Developer",
    company: "Vercel",
    logo: "VC",
    location: "San Francisco, CA",
    type: "full-time",
    salary: "$140k–$170k",
    appliedDate: "Mar 4, 2026",
    lastUpdate: "4 days ago",
    status: "reviewing",
    source: "Company Site",
  },
  {
    id: "3",
    role: "UI Engineer",
    company: "Linear",
    logo: "LN",
    location: "Remote",
    type: "remote",
    salary: "$130k–$160k",
    appliedDate: "Mar 1, 2026",
    lastUpdate: "1 week ago",
    status: "applied",
    source: "Referral",
  },
  {
    id: "4",
    role: "Frontend Lead",
    company: "Figma",
    logo: "FG",
    location: "New York, NY",
    type: "full-time",
    salary: "$170k–$210k",
    appliedDate: "Feb 24, 2026",
    lastUpdate: "2 weeks ago",
    status: "offered",
    source: "LinkedIn",
    notes: "Offer received — deadline Mar 15",
  },
  {
    id: "5",
    role: "Full Stack Engineer",
    company: "Notion",
    logo: "NT",
    location: "Remote",
    type: "remote",
    salary: "$120k–$150k",
    appliedDate: "Feb 20, 2026",
    lastUpdate: "2 weeks ago",
    status: "rejected",
    source: "AngelList",
    notes: "Position filled internally",
  },
  {
    id: "6",
    role: "Software Engineer II",
    company: "Loom",
    logo: "LM",
    location: "San Francisco, CA",
    type: "full-time",
    salary: "$135k–$165k",
    appliedDate: "Feb 15, 2026",
    lastUpdate: "3 weeks ago",
    status: "withdrawn",
    source: "Company Site",
    notes: "Withdrew — accepted another offer",
  },
  {
    id: "7",
    role: "React Native Developer",
    company: "Shopify",
    logo: "SH",
    location: "Remote",
    type: "remote",
    salary: "$140k–$175k",
    appliedDate: "Mar 7, 2026",
    lastUpdate: "1 day ago",
    status: "applied",
    source: "LinkedIn",
  },
  {
    id: "8",
    role: "Frontend Architect",
    company: "Airbnb",
    logo: "AB",
    location: "San Francisco, CA",
    type: "full-time",
    salary: "$180k–$220k",
    appliedDate: "Feb 28, 2026",
    lastUpdate: "1 week ago",
    status: "reviewing",
    source: "Referral",
    notes: "Referred by John Smith (Senior Eng)",
  },
];

// ─── Config ───────────────────────────────────────────────
const STATUS_CONFIG: Record<
  AppStatus,
  {
    label: string;
    icon: React.ReactNode;
    cls: string;
    step: number;
  }
> = {
  applied: {
    label: "Applied",
    icon: <Send size={11} />,
    cls: "s-applied",
    step: 1,
  },
  reviewing: {
    label: "Reviewing",
    icon: <Eye size={11} />,
    cls: "s-reviewing",
    step: 2,
  },
  interview: {
    label: "Interview",
    icon: <Calendar size={11} />,
    cls: "s-interview",
    step: 3,
  },
  offered: {
    label: "Offered",
    icon: <CheckCircle2 size={11} />,
    cls: "s-offered",
    step: 4,
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle size={11} />,
    cls: "s-rejected",
    step: 0,
  },
  withdrawn: {
    label: "Withdrawn",
    icon: <AlertCircle size={11} />,
    cls: "s-withdrawn",
    step: 0,
  },
};

const PIPELINE_STEPS = ["Applied", "Reviewing", "Interview", "Offered"];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "applied", label: "Applied" },
  { key: "reviewing", label: "Reviewing" },
  { key: "interview", label: "Interview" },
  { key: "offered", label: "Offered" },
  { key: "rejected", label: "Rejected" },
  { key: "withdrawn", label: "Withdrawn" },
] as const;

type FilterKey = (typeof STATUS_FILTERS)[number]["key"];

// ─── Application Row ──────────────────────────────────────
function ApplicationRow({ app }: { app: Application }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[app.status];
  const inPipeline = app.status !== "rejected" && app.status !== "withdrawn";

  return (
    <div className={`${styles.row} ${expanded ? styles["row-open"] : ""}`}>
      {/* Main row */}
      <div
        className={styles["row-main"]}
        onClick={() => setExpanded((p) => !p)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((p) => !p)}
      >
        {/* Logo */}
        <div className={styles["row-logo"]}>{app.logo}</div>

        {/* Info */}
        <div className={styles["row-info"]}>
          <div className={styles["row-role"]}>{app.role}</div>
          <div className={styles["row-meta"]}>
            <span>
              <Building2 size={10} /> {app.company}
            </span>
            <span>
              <MapPin size={10} /> {app.location}
            </span>
            <span>
              <Briefcase size={10} /> {app.type}
            </span>
          </div>
        </div>

        {/* Salary */}
        <div className={styles["row-salary"]}>{app.salary}</div>

        {/* Date */}
        <div className={styles["row-date"]}>
          <span>{app.appliedDate}</span>
          <span className={styles["row-update"]}>
            <Clock size={10} /> {app.lastUpdate}
          </span>
        </div>

        {/* Status */}
        <div className={styles["row-status"]}>
          <span className={`${styles["status-chip"]} ${styles[cfg.cls]}`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${expanded ? styles["chevron-up"] : ""}`}
        />
      </div>

      {/* Expanded */}
      {expanded && (
        <div className={styles["row-expanded"]}>
          {/* Pipeline tracker — only for active apps */}
          {inPipeline && (
            <div className={styles.pipeline}>
              {PIPELINE_STEPS.map((step, i) => {
                const stepNum = i + 1;
                const current = STATUS_CONFIG[app.status].step;
                const isDone = stepNum < current;
                const isActive = stepNum === current;
                return (
                  <div key={step} className={styles["pipeline-step"]}>
                    <div
                      className={`${styles["step-dot"]}
                      ${isDone ? styles["dot-done"] : ""}
                      ${isActive ? styles["dot-active"] : ""}
                    `}
                    >
                      {isDone ? <CheckCircle2 size={12} /> : stepNum}
                    </div>
                    <span
                      className={`${styles["step-label"]}
                      ${isActive ? styles["step-active"] : ""}
                      ${isDone ? styles["step-done"] : ""}
                    `}
                    >
                      {step}
                    </span>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div
                        className={`${styles["step-line"]} ${isDone ? styles["line-done"] : ""}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles["expanded-body"]}>
            {/* Details grid */}
            <div className={styles["detail-grid"]}>
              <div className={styles["detail-item"]}>
                <span className={styles["detail-label"]}>Source</span>
                <span className={styles["detail-val"]}>{app.source}</span>
              </div>
              <div className={styles["detail-item"]}>
                <span className={styles["detail-label"]}>Applied</span>
                <span className={styles["detail-val"]}>{app.appliedDate}</span>
              </div>
              <div className={styles["detail-item"]}>
                <span className={styles["detail-label"]}>Last Update</span>
                <span className={styles["detail-val"]}>{app.lastUpdate}</span>
              </div>
              {app.notes && (
                <div
                  className={`${styles["detail-item"]} ${styles["detail-wide"]}`}
                >
                  <span className={styles["detail-label"]}>Notes</span>
                  <span className={styles["detail-val"]}>{app.notes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles["row-actions"]}>
              {app.jobUrl && (
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.btn} ${styles["btn-ghost"]}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={12} /> View Job
                </a>
              )}
              {app.status === "interview" && (
                <Link
                  href="/applicant/interviews"
                  className={`${styles.btn} ${styles["btn-primary"]}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Calendar size={12} /> View Interview
                </Link>
              )}
              {app.status === "offered" && (
                <button className={`${styles.btn} ${styles["btn-success"]}`}>
                  <CheckCircle2 size={12} /> Respond to Offer
                </button>
              )}
              <button className={`${styles.btn} ${styles["btn-danger-ghost"]}`}>
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function ApplicationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "status" | "company">("date");
  const [showSort, setShowSort] = useState(false);

  // Stats
  const stats = useMemo(
    () => ({
      total: APPLICATIONS.length,
      active: APPLICATIONS.filter(
        (a) => !["rejected", "withdrawn"].includes(a.status),
      ).length,
      interview: APPLICATIONS.filter((a) => a.status === "interview").length,
      offered: APPLICATIONS.filter((a) => a.status === "offered").length,
      rejected: APPLICATIONS.filter((a) => a.status === "rejected").length,
    }),
    [],
  );

  // Filter + search + sort
  const filtered = useMemo(() => {
    let list = APPLICATIONS;

    if (activeFilter !== "all") {
      list = list.filter((a) => a.status === activeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.role.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "company") return a.company.localeCompare(b.company);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0; // date — keep original order (newest first from API)
    });
  }, [activeFilter, search, sortBy]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Applications</h1>
          <p className={styles.subtitle}>
            {stats.active} active · {stats.total} total
          </p>
        </div>
        <Link
          href="/applicant/browse-jobs"
          className={`${styles.btn} ${styles["btn-primary"]}`}
        >
          <BookmarkCheck size={14} /> Browse Jobs
        </Link>
      </div>

      {/* Stat cards */}
      <div className={styles["stat-row"]}>
        {[
          {
            label: "Total Applied",
            value: stats.total,
            color: "var(--text-primary)",
            bg: "var(--surface)",
          },
          {
            label: "In Progress",
            value: stats.active,
            color: "var(--color-secondary)",
            bg: "rgba(var(--glow-rgb),0.06)",
          },
          {
            label: "Interviews",
            value: stats.interview,
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.07)",
          },
          {
            label: "Offers",
            value: stats.offered,
            color: "var(--status-success)",
            bg: "rgba(34,197,94,0.07)",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            color: "var(--status-danger)",
            bg: "rgba(239,68,68,0.06)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={styles["stat-card"]}
            style={{ background: s.bg }}
          >
            <span className={styles["stat-val"]} style={{ color: s.color }}>
              {s.value}
            </span>
            <span className={styles["stat-label"]}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Search */}
        <div className={styles["search-wrap"]}>
          <Search size={13} className={styles["search-icon"]} />
          <input
            className={styles["search-input"]}
            placeholder="Search role, company, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sort */}
        <div className={styles["sort-wrap"]}>
          <button
            className={`${styles.btn} ${styles["btn-ghost"]}`}
            onClick={() => setShowSort((p) => !p)}
          >
            <SlidersHorizontal size={13} />
            Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            <ChevronDown size={12} />
          </button>
          {showSort && (
            <div className={styles["sort-dropdown"]}>
              {(["date", "status", "company"] as const).map((opt) => (
                <button
                  key={opt}
                  className={`${styles["sort-option"]} ${sortBy === opt ? styles["sort-active"] : ""}`}
                  onClick={() => {
                    setSortBy(opt);
                    setShowSort(false);
                  }}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter icon (mobile) */}
        <button
          className={`${styles.btn} ${styles["btn-ghost"]} ${styles["filter-btn"]}`}
        >
          <Filter size={13} />
        </button>
      </div>

      {/* Status filter tabs */}
      <div className={styles["filter-tabs"]}>
        {STATUS_FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? APPLICATIONS.length
              : APPLICATIONS.filter((a) => a.status === f.key).length;
          return (
            <button
              key={f.key}
              className={`${styles["filter-tab"]} ${activeFilter === f.key ? styles["filter-tab-active"] : ""}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
              {count > 0 && (
                <span className={styles["filter-count"]}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table header */}
      {filtered.length > 0 && (
        <div className={styles["table-head"]}>
          <div className={styles["th-role"]}>Role / Company</div>
          <div className={styles["th-salary"]}>Salary</div>
          <div className={styles["th-date"]}>Applied</div>
          <div className={styles["th-status"]}>Status</div>
          <div style={{ width: 24 }} />
        </div>
      )}

      {/* Rows */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Briefcase
              size={32}
              style={{ color: "var(--text-muted)", marginBottom: 12 }}
            />
            <p>No applications found</p>
            <span>
              {search
                ? `No results for "${search}"`
                : "Start applying to jobs to track them here"}
            </span>
            {!search && (
              <Link
                href="/applicant/browse-jobs"
                className={`${styles.btn} ${styles["btn-primary"]}`}
                style={{ marginTop: 16 }}
              >
                Browse Jobs
              </Link>
            )}
          </div>
        ) : (
          filtered.map((app) => <ApplicationRow key={app.id} app={app} />)
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className={styles["list-footer"]}>
          Showing {filtered.length} of {APPLICATIONS.length} applications
        </p>
      )}
    </div>
  );
}
