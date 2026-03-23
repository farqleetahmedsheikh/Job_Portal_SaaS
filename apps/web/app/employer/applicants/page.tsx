/** @format */
"use client";

import Link from "next/link";
import {
  Search,
  Star,
  StarOff,
  Eye,
  Download,
  MapPin,
  Clock,
  Briefcase,
  Users,
  UserCheck,
  Calendar,
  Award,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { useAllApplicants } from "../../hooks/useAllApplicants";
import type {
  AllApplicant,
  ApplicantStatus,
} from "../../types/all-applicants.types";
import styles from "../styles/all-applicants.module.css";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ApplicantStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  rejected: "Rejected",
};

const STATUS_CHIP_CLS: Record<ApplicantStatus, string | undefined> = {
  new: styles.chipNew,
  reviewing: styles.chipReviewing,
  shortlisted: styles.chipShortlisted,
  interview: styles.chipInterview,
  offered: styles.chipOffered,
  rejected: styles.chipRejected,
};

const STATUS_FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "reviewing", label: "Reviewing" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "offered", label: "Offered" },
  { key: "rejected", label: "Rejected" },
] as const;

const SORT_OPTIONS = [
  { key: "date", label: "Latest" },
  { key: "match", label: "Match" },
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
] as const;

// ─── Match bar helpers ────────────────────────────────────────────────────────

function matchFillCls(pct: number) {
  if (pct >= 70) return styles.matchFillHigh;
  if (pct >= 40) return styles.matchFillMid;
  return styles.matchFillLow;
}

function matchPctCls(pct: number) {
  if (pct >= 70) return styles.matchPctHigh;
  if (pct >= 40) return styles.matchPctMid;
  return styles.matchPctLow;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ─── Applicant card ───────────────────────────────────────────────────────────

function ApplicantCard({
  applicant,
  onStar,
  onStatus,
}: {
  applicant: AllApplicant;
  onStar: (id: string) => void;
  onStatus: (id: string, s: ApplicantStatus) => void;
}) {
  const visibleSkills = applicant.skills.slice(0, 4);
  const extraSkills = applicant.skills.length - visibleSkills.length;

  return (
    <div
      className={`${styles.card} ${applicant.starred ? styles.cardStarred : ""}`}
    >
      {/* Top row — avatar + info + star */}
      <div className={styles.cardTop}>
        <div className={styles.avatar}>
          {applicant.avatarUrl ? (
            <img src={applicant.avatarUrl} alt={applicant.name} />
          ) : (
            applicant.avatar
          )}
        </div>

        <div className={styles.cardInfo}>
          <p className={styles.cardName}>{applicant.name}</p>
          <p className={styles.cardTitle}>{applicant.title}</p>
          <div className={styles.cardMeta}>
            <span>
              <MapPin size={9} /> {applicant.location}
            </span>
            {applicant.experience && (
              <span>
                <Briefcase size={9} /> {applicant.experience}
              </span>
            )}
            <span>
              <Clock size={9} /> {relativeTime(applicant.appliedAt)}
            </span>
          </div>
        </div>

        <button
          className={`${styles.iconBtn} ${applicant.starred ? styles.iconBtnStarred : ""}`}
          onClick={() => onStar(applicant.id)}
          title={applicant.starred ? "Unstar" : "Star"}
        >
          {applicant.starred ? (
            <Star size={13} fill="currentColor" />
          ) : (
            <StarOff size={13} />
          )}
        </button>
      </div>

      {/* Job tag */}
      <div>
        <span className={styles.jobTag}>
          <Briefcase size={9} />
          {applicant.jobTitle}
        </span>
      </div>

      {/* Match bar */}
      <div className={styles.matchRow}>
        <span className={styles.matchLabel}>Match</span>
        <div className={styles.matchBar}>
          <div
            className={`${styles.matchFill} ${matchFillCls(applicant.match)}`}
            style={{ width: `${applicant.match}%` }}
          />
        </div>
        <span className={`${styles.matchPct} ${matchPctCls(applicant.match)}`}>
          {applicant.match}%
        </span>
      </div>

      {/* Skills */}
      {visibleSkills.length > 0 && (
        <div className={styles.skills}>
          {visibleSkills.map((s) => (
            <span key={s} className={styles.skill}>
              {s}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className={styles.skillMore}>+{extraSkills} more</span>
          )}
        </div>
      )}

      {/* Footer — status + actions */}
      <div className={styles.cardFooter}>
        <select
          className={styles.statusSelect}
          value={applicant.status}
          onChange={(e) =>
            onStatus(applicant.id, e.target.value as ApplicantStatus)
          }
          onClick={(e) => e.stopPropagation()}
        >
          {(Object.keys(STATUS_LABELS) as ApplicantStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <div className={styles.footerActions}>
          {applicant.resumeUrl && (
            <a
              href={applicant.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconBtn}
              title="Download resume"
              download
            >
              <Download size={13} />
            </a>
          )}
          <Link
            href={`/employer/jobs/${applicant.jobId}/applicants/${applicant.id}`}
            className={styles.viewBtn}
          >
            <Eye size={12} /> View
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div
            style={{
              height: 24,
              width: 200,
              background: "var(--surface)",
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              height: 14,
              width: 140,
              background: "var(--surface)",
              borderRadius: 4,
            }}
          />
        </div>
      </div>
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className={styles.skeletonCard} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AllApplicantsPage() {
  const {
    filtered,
    stats,
    counts,
    jobOptions,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    jobFilter,
    setJobFilter,
    sort,
    setSort,
    starredOnly,
    setStarredOnly,
    toggleStar,
    changeStatus,
  } = useAllApplicants();

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className={styles.page}>
        <p style={{ color: "var(--status-danger)", fontSize: 13 }}>⚠ {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>All Applicants</h1>
          <p>
            {stats.total} applicant{stats.total !== 1 ? "s" : ""} across{" "}
            {jobOptions.length} job{jobOptions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Stat strip */}
      <div className={styles.statStrip}>
        <div className={styles.statPill}>
          <Users size={13} />
          <strong>{stats.total}</strong> Total
        </div>
        <div className={`${styles.statPill} ${styles.pillNew}`}>
          <UserCheck size={13} />
          <strong>{stats.new}</strong> New
        </div>
        <div className={`${styles.statPill} ${styles.pillShortlisted}`}>
          <Award size={13} />
          <strong>{stats.shortlisted}</strong> Shortlisted
        </div>
        <div className={`${styles.statPill} ${styles.pillInterview}`}>
          <Calendar size={13} />
          <strong>{stats.interview}</strong> Interview
        </div>
        <div className={`${styles.statPill} ${styles.pillOffered}`}>
          <Star size={13} />
          <strong>{stats.offered}</strong> Offered
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search name, role, skills, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Job filter */}
        <select
          className={styles.filterSelect}
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
        >
          <option value="all">All Jobs</option>
          {jobOptions.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} ({j.count})
            </option>
          ))}
        </select>

        {/* Starred toggle */}
        <button
          className={`${styles.toolbarBtn} ${starredOnly ? styles.toolbarBtnActive : ""}`}
          onClick={() => setStarredOnly((p) => !p)}
        >
          <Star size={13} /> Starred
        </button>
      </div>

      {/* Status tabs */}
      <div className={styles.statusTabs}>
        {STATUS_FILTER_TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${statusFilter === t.key ? styles.tabActive : ""}`}
            onClick={() => setStatusFilter(t.key)}
          >
            {t.label}
            {(counts[t.key] ?? 0) > 0 && (
              <span className={styles.tabCount}>{counts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div className={styles.sortBar}>
        <span>
          Showing{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {filtered.length}
          </strong>{" "}
          applicant{filtered.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowUpDown size={11} />
          <div className={styles.sortOptions}>
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                className={`${styles.sortBtn} ${sort === o.key ? styles.sortBtnActive : ""}`}
                onClick={() => setSort(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Users size={32} style={{ opacity: 0.3 }} />
            <p>No applicants found</p>
            <span>
              {search
                ? `No results for "${search}"`
                : "Applicants will appear here once candidates apply to your jobs"}
            </span>
          </div>
        ) : (
          filtered.map((a) => (
            <ApplicantCard
              key={a.id}
              applicant={a}
              onStar={toggleStar}
              onStatus={changeStatus}
            />
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p className={styles.listFooter}>
          Showing {filtered.length} of {stats.total} applicants
        </p>
      )}
    </div>
  );
}
