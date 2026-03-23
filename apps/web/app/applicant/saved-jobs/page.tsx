/** @format */
"use client";

import { useState }      from "react";
import Link               from "next/link";
import {
  Bookmark, BookmarkX, Search, MapPin, Briefcase,
  DollarSign, Clock, Send, SlidersHorizontal,
  ChevronDown, Building2, ExternalLink, BriefcaseIcon,
} from "lucide-react";
import { useSavedJobs }  from "../../hooks/useSavedJobs";
import { timeAgo, formatDate } from "../../lib";
import type { SavedJobItem, SortKey, FilterKey } from "../../hooks/useSavedJobs";
import styles from "../styles/saved-jobs.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  "full-time":  "Full-time",
  "part-time":  "Part-time",
  "contract":   "Contract",
  "internship": "Internship",
  "freelance":  "Freelance",
};

function MatchRing({ pct }: { pct: number }) {
  if (pct === 0) return null;
  const color = pct >= 90 ? "var(--status-success)"
    : pct >= 75 ? "var(--color-secondary)"
    : "#f59e0b";
  return (
    <div className={styles.matchWrap} style={{ "--match-color": color } as React.CSSProperties}>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${pct * 0.879} 100`} strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{ transition: "stroke-dasharray .5s ease" }}
        />
      </svg>
      <span className={styles.matchPct} style={{ color }}>{pct}%</span>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ item, onUnsave }: { item: SavedJobItem; onUnsave: (jobId: string) => void }) {
  const [confirmUnsave, setConfirmUnsave] = useState(false);
  const { job } = item;

  const salary = job.salaryMin && job.salaryMax
    ? `${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax / 1000).toFixed(0)}k`
    : job.salaryMin
      ? `From ${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k`
      : null;

  return (
    <div className={`${styles.card} ${item.isExpired ? styles.cardExpired : ""}`}>
      {item.isExpired && (
        <div className={styles.expiredBanner}>
          <Clock size={11} /> Deadline passed
        </div>
      )}
      {!item.isExpired && item.daysLeft !== null && item.daysLeft <= 3 && (
        <div className={styles.expiredBanner} style={{ background: "rgba(249,115,22,.1)", color: "var(--status-warning)", borderColor: "rgba(249,115,22,.2)" }}>
          <Clock size={11} /> Only {item.daysLeft === 0 ? "today" : `${item.daysLeft}d`} left to apply!
        </div>
      )}

      <div className={styles.cardTop}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <div className={styles.logo}>
            {job.company.logoUrl
              ? <img src={job.company.logoUrl} alt={job.company.companyName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
              : job.company.companyName[0]}
          </div>
        </div>

        {/* Info */}
        <div className={styles.cardInfo}>
          <div className={styles.cardTitleRow}>
            <Link href={`/applicant/jobs/${job.id}`} className={styles.cardRole}>
              {job.title}
            </Link>
            {item.applied && (
              <span className={styles.appliedChip}>
                <Send size={9} /> Applied
              </span>
            )}
          </div>
          <div className={styles.cardMeta}>
            <span><Building2 size={10} /> {job.company.companyName}</span>
            <span><MapPin size={10} /> {job.location}</span>
            <span><Briefcase size={10} /> {TYPE_LABELS[job.type] ?? job.type}</span>
            {salary && <span><DollarSign size={10} /> {salary}</span>}
          </div>
          {/* Matched skills */}
          {item.matchedSkills.length > 0 && (
            <div className={styles.tagRow}>
              {item.matchedSkills.slice(0, 4).map((t) => (
                <span key={t} className={`${styles.tag} ${styles.tagMatch}`}>{t}</span>
              ))}
              {job.skills.filter((s) => !item.matchedSkills.includes(s)).slice(0, 2).map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
          )}
          {!item.matchedSkills.length && job.skills.length > 0 && (
            <div className={styles.tagRow}>
              {job.skills.slice(0, 4).map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Match ring */}
        <div className={styles.cardRight}>
          <MatchRing pct={item.matchScore} />
          {item.matchScore > 0 && <span className={styles.matchLabel}>match</span>}
        </div>
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.cardDates}>
          <span><Bookmark size={10} /> Saved {timeAgo(item.savedAt)}</span>
          {job.expiresAt && (
            <span style={{ color: item.daysLeft !== null && item.daysLeft <= 7 ? "var(--status-danger)" : undefined }}>
              <Clock size={10} /> Deadline: {formatDate(job.expiresAt)}
            </span>
          )}
        </div>

        <div className={styles.cardActions}>
          <Link href={`/applicant/jobs/${job.id}`} className={`${styles.btn} ${styles.btnGhost}`}>
            <ExternalLink size={12} /> View job
          </Link>
          {!item.applied && !item.isExpired && (
            <Link href={`/applicant/jobs/${job.id}`} className={`${styles.btn} ${styles.btnPrimary}`}>
              <Send size={12} /> Apply
            </Link>
          )}
          {confirmUnsave ? (
            <div className={styles.unsaveConfirm}>
              <span>Remove?</span>
              <button className={styles.confirmYes} onClick={() => onUnsave(job.id)}>Yes</button>
              <button className={styles.confirmNo} onClick={() => setConfirmUnsave(false)}>No</button>
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className={styles.list}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div style={{ display: "flex", gap: 12, padding: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0,
              background: "var(--border)", animation: "shimmer 1.4s infinite" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 16, width: "55%", borderRadius: 6, background: "var(--border)" }} />
              <div style={{ height: 12, width: "80%", borderRadius: 6, background: "var(--border)" }} />
              <div style={{ height: 12, width: "40%", borderRadius: 6, background: "var(--border)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SavedJobsPage() {
  const {
    filtered, stats,
    loading, error,
    search,   setSearch,
    filter,   setFilter,
    sort,     setSort,
    sortOpen, setSortOpen,
    handleUnsave,
  } = useSavedJobs();

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Saved Jobs</h1>
          <p className={styles.subtitle}>
            {stats.total} saved · {stats.notApplied} not yet applied
          </p>
        </div>
        <Link href="/applicant/browse-jobs" className={`${styles.btn} ${styles.btnPrimary}`}>
          <BriefcaseIcon size={14} /> Browse more
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.statRow}>
        {[
          { label: "Total saved", val: stats.total,      color: "var(--text-primary)"    },
          { label: "To apply",    val: stats.notApplied, color: "var(--color-secondary)" },
          { label: "Applied",     val: stats.applied,    color: "var(--status-success)"  },
          { label: "Expired",     val: stats.expired,    color: "var(--status-danger)"   },
        ].map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statVal} style={{ color: s.color }}>{s.val}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search saved jobs…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className={styles.sortWrap}>
          <button className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => setSortOpen((p) => !p)}>
            <SlidersHorizontal size={13} />
            Sort: {sort.charAt(0).toUpperCase() + sort.slice(1)}
            <ChevronDown size={12} />
          </button>
          {sortOpen && (
            <div className={styles.dropdown}>
              {(["saved", "match", "deadline"] as SortKey[]).map((o) => (
                <button key={o}
                  className={`${styles.dropItem} ${sort === o ? styles.dropItemActive : ""}`}
                  onClick={() => { setSort(o); setSortOpen(false); }}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {([
          { key: "all",         label: "All",          count: stats.total      },
          { key: "not-applied", label: "To apply",     count: stats.notApplied },
          { key: "applied",     label: "Applied",      count: stats.applied    },
          { key: "expiring",    label: "Expiring soon",count: stats.expiring   },
        ] as { key: FilterKey; label: string; count: number }[]).map((t) => (
          <button key={t.key}
            className={`${styles.tab} ${filter === t.key ? styles.tabActive : ""}`}
            onClick={() => setFilter(t.key)}>
            {t.label}
            {t.count > 0 && <span className={styles.tabCount}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <p style={{ color: "var(--status-danger)", fontSize: 14 }}>{error}</p>}

      {/* List */}
      {loading ? <Skeleton /> : (
        <div className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <Bookmark size={32} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
              <p>{search ? `No results for "${search}"` : "No saved jobs here"}</p>
              <span>
                {search ? "Try a different search"
                  : "Browse jobs and save ones you're interested in"}
              </span>
              {!search && (
                <Link href="/applicant/browse-jobs"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ marginTop: 16 }}>
                  Browse Jobs
                </Link>
              )}
            </div>
          ) : (
            filtered.map((item) => (
              <JobCard key={item.id} item={item} onUnsave={handleUnsave} />
            ))
          )}
        </div>
      )}

      {filtered.length > 0 && !loading && (
        <p className={styles.footer}>
          Showing {filtered.length} of {stats.total} saved jobs
        </p>
      )}
    </div>
  );
}