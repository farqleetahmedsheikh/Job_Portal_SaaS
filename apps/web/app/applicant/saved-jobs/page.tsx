/** @format */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkX,
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Send,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Trash2,
  ExternalLink,
  BriefcaseIcon,
  Filter,
} from "lucide-react";
import styles from "../../styles/saved-jobs.module.css";

// ─── Types ────────────────────────────────────────────────
type JobType = "full-time" | "part-time" | "contract" | "remote";

interface SavedJob {
  id: string;
  role: string;
  company: string;
  logo: string;
  location: string;
  type: JobType;
  salary: string;
  savedAt: string;
  deadline: string;
  expired: boolean;
  applied: boolean;
  tags: string[];
  match: number; // % match to profile
}

// ─── Mock ─────────────────────────────────────────────────
const SAVED: SavedJob[] = [
  {
    id: "1",
    role: "Senior Frontend Engineer",
    company: "Stripe",
    logo: "ST",
    location: "Remote · US",
    type: "remote",
    salary: "$160k–$200k",
    savedAt: "2 days ago",
    deadline: "Mar 30, 2026",
    expired: false,
    applied: false,
    tags: ["React", "TypeScript", "CSS"],
    match: 94,
  },
  {
    id: "2",
    role: "React Developer",
    company: "Vercel",
    logo: "VC",
    location: "San Francisco, CA",
    type: "full-time",
    salary: "$140k–$170k",
    savedAt: "3 days ago",
    deadline: "Apr 5, 2026",
    expired: false,
    applied: true,
    tags: ["React", "Next.js", "GraphQL"],
    match: 88,
  },
  {
    id: "3",
    role: "UI Engineer",
    company: "Linear",
    logo: "LN",
    location: "Remote",
    type: "remote",
    salary: "$130k–$160k",
    savedAt: "5 days ago",
    deadline: "Mar 20, 2026",
    expired: false,
    applied: false,
    tags: ["React", "Design Systems", "CSS"],
    match: 91,
  },
  {
    id: "4",
    role: "Frontend Lead",
    company: "Figma",
    logo: "FG",
    location: "New York, NY",
    type: "full-time",
    salary: "$170k–$210k",
    savedAt: "1 week ago",
    deadline: "Mar 15, 2026",
    expired: true,
    applied: false,
    tags: ["React", "TypeScript", "Leadership"],
    match: 79,
  },
  {
    id: "5",
    role: "Full Stack Engineer",
    company: "Notion",
    logo: "NT",
    location: "Remote",
    type: "remote",
    salary: "$120k–$150k",
    savedAt: "1 week ago",
    deadline: "Apr 10, 2026",
    expired: false,
    applied: false,
    tags: ["React", "Node.js", "PostgreSQL"],
    match: 83,
  },
  {
    id: "6",
    role: "Staff Engineer",
    company: "Shopify",
    logo: "SH",
    location: "Remote · Canada",
    type: "remote",
    salary: "$180k–$220k",
    savedAt: "2 weeks ago",
    deadline: "Apr 20, 2026",
    expired: false,
    applied: false,
    tags: ["React", "Architecture", "Scale"],
    match: 72,
  },
];

const TYPE_LABELS: Record<JobType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  remote: "Remote",
};

function MatchRing({ pct }: { pct: number }) {
  const color =
    pct >= 90
      ? "var(--status-success)"
      : pct >= 75
        ? "var(--color-secondary)"
        : "#f59e0b";
  return (
    <div
      className={styles.matchWrap}
      style={{ "--match-color": color } as React.CSSProperties}
    >
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${pct * 0.879} 100`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{ transition: "stroke-dasharray .5s ease" }}
        />
      </svg>
      <span className={styles.matchPct} style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function JobCard({
  job,
  onUnsave,
}: {
  job: SavedJob;
  onUnsave: (id: string) => void;
}) {
  const [confirmUnsave, setConfirmUnsave] = useState(false);

  return (
    <div className={`${styles.card} ${job.expired ? styles.cardExpired : ""}`}>
      {job.expired && (
        <div className={styles.expiredBanner}>
          <Clock size={11} /> Deadline passed
        </div>
      )}

      <div className={styles.cardTop}>
        <div className={styles.logoWrap}>
          <div className={styles.logo}>{job.logo}</div>
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.cardTitleRow}>
            <Link
              href={`/applicant/jobs/${job.id}`}
              className={styles.cardRole}
            >
              {job.role}
            </Link>
            {job.applied && (
              <span className={styles.appliedChip}>
                <Send size={9} /> Applied
              </span>
            )}
          </div>
          <div className={styles.cardMeta}>
            <span>
              <Building2 size={10} /> {job.company}
            </span>
            <span>
              <MapPin size={10} /> {job.location}
            </span>
            <span>
              <Briefcase size={10} /> {TYPE_LABELS[job.type]}
            </span>
            <span>
              <DollarSign size={10} /> {job.salary}
            </span>
          </div>
          <div className={styles.tagRow}>
            {job.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.cardRight}>
          <MatchRing pct={job.match} />
          <span className={styles.matchLabel}>match</span>
        </div>
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.cardDates}>
          <span>
            <Bookmark size={10} /> Saved {job.savedAt}
          </span>
          <span>
            <Clock size={10} /> Deadline: {job.deadline}
          </span>
        </div>

        <div className={styles.cardActions}>
          <Link
            href={`/applicant/jobs/${job.id}`}
            className={`${styles.btn} ${styles.btnGhost}`}
          >
            <ExternalLink size={12} /> View job
          </Link>
          {!job.applied && !job.expired && (
            <Link
              href={`/applicant/jobs/${job.id}`}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              <Send size={12} /> Apply
            </Link>
          )}
          {confirmUnsave ? (
            <div className={styles.unsaveConfirm}>
              <span>Remove?</span>
              <button
                className={styles.confirmYes}
                onClick={() => onUnsave(job.id)}
              >
                Yes
              </button>
              <button
                className={styles.confirmNo}
                onClick={() => setConfirmUnsave(false)}
              >
                No
              </button>
            </div>
          ) : (
            <button
              className={`${styles.btn} ${styles.btnDangerGhost}`}
              onClick={() => setConfirmUnsave(true)}
            >
              <BookmarkX size={12} /> Unsave
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function SavedJobsPage() {
  const [jobs, setJobs] = useState(SAVED);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "not-applied" | "applied" | "expiring"
  >("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<"saved" | "match" | "deadline">("saved");

  const handleUnsave = (id: string) =>
    setJobs((p) => p.filter((j) => j.id !== id));

  const filtered = useMemo(() => {
    let list = jobs;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.role.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q),
      );
    }
    if (filter === "not-applied") list = list.filter((j) => !j.applied);
    if (filter === "applied") list = list.filter((j) => j.applied);
    if (filter === "expiring")
      list = list.filter(
        (j) =>
          !j.expired &&
          new Date(j.deadline) < new Date(Date.now() + 7 * 86400000),
      );
    return [...list].sort((a, b) => {
      if (sort === "match") return b.match - a.match;
      if (sort === "deadline")
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return 0;
    });
  }, [jobs, search, filter, sort]);

  const stats = useMemo(
    () => ({
      total: jobs.length,
      notApplied: jobs.filter((j) => !j.applied && !j.expired).length,
      applied: jobs.filter((j) => j.applied).length,
      expired: jobs.filter((j) => j.expired).length,
    }),
    [jobs],
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Saved Jobs</h1>
          <p className={styles.subtitle}>
            {jobs.length} saved · {stats.notApplied} not yet applied
          </p>
        </div>
        <Link
          href="/applicant/browse-jobs"
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          <BriefcaseIcon size={14} /> Browse more
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.statRow}>
        {[
          {
            label: "Total saved",
            val: stats.total,
            color: "var(--text-primary)",
          },
          {
            label: "To apply",
            val: stats.notApplied,
            color: "var(--color-secondary)",
          },
          {
            label: "Applied",
            val: stats.applied,
            color: "var(--status-success)",
          },
          {
            label: "Expired",
            val: stats.expired,
            color: "var(--status-danger)",
          },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statVal} style={{ color: s.color }}>
              {s.val}
            </span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search saved jobs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.sortWrap}>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => setSortOpen((p) => !p)}
          >
            <SlidersHorizontal size={13} />
            Sort: {sort.charAt(0).toUpperCase() + sort.slice(1)}
            <ChevronDown size={12} />
          </button>
          {sortOpen && (
            <div className={styles.dropdown}>
              {(["saved", "match", "deadline"] as const).map((o) => (
                <button
                  key={o}
                  className={`${styles.dropItem} ${sort === o ? styles.dropItemActive : ""}`}
                  onClick={() => {
                    setSort(o);
                    setSortOpen(false);
                  }}
                >
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.tabs}>
        {(
          [
            { key: "all", label: "All", count: jobs.length },
            { key: "not-applied", label: "To apply", count: stats.notApplied },
            { key: "applied", label: "Applied", count: stats.applied },
            {
              key: "expiring",
              label: "Expiring soon",
              count: jobs.filter(
                (j) =>
                  !j.expired &&
                  new Date(j.deadline) < new Date(Date.now() + 7 * 86400000),
              ).length,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${filter === t.key ? styles.tabActive : ""}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            {t.count > 0 && <span className={styles.tabCount}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Bookmark
              size={32}
              style={{ color: "var(--text-muted)", marginBottom: 12 }}
            />
            <p>
              {search ? `No results for "${search}"` : "No saved jobs here"}
            </p>
            <span>
              {search
                ? "Try a different search"
                : "Browse jobs and save ones you're interested in"}
            </span>
            {!search && (
              <Link
                href="/applicant/browse-jobs"
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ marginTop: 16 }}
              >
                Browse Jobs
              </Link>
            )}
          </div>
        ) : (
          filtered.map((j) => (
            <JobCard key={j.id} job={j} onUnsave={handleUnsave} />
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p className={styles.footer}>
          Showing {filtered.length} of {jobs.length} saved jobs
        </p>
      )}
    </div>
  );
}
