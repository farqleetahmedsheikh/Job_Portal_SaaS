/** @format */
"use client";

import Link from "next/link";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  BarChart2,
  Clock,
  Search,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { useManageJobs } from "../../hooks/useManageJobs";
import { formatDate } from "../../lib";
import {
  STATUS_META,
  FILTERS,
  type JobStatus,
} from "../../types/manage-jobs.types";
import styles from "../styles/manage-jobs.module.css";

// ── Inline — too small + used only here ──────────────────────────────────────
const STATUS_ICON: Record<JobStatus, React.ReactNode> = {
  active: <CheckCircle2 size={11} />,
  paused: <PauseCircle size={11} />,
  draft: <Edit2 size={11} />,
  closed: <XCircle size={11} />,
  expired: <AlertCircle size={11} />,
};

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000),
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ManageJobsPage() {
  const {
    filtered,
    counts,
    totalApps,
    totalNew,
    loading,
    error,
    filter,
    setFilter,
    search,
    setSearch,
    toggleStatus,
    duplicateJob,
    deleteJob,
    confirmDelete,
    setConfirmDelete,
  } = useManageJobs();

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className={styles.page}>
        <div className={styles.loadingRows}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className={styles.page}>
        <p className={styles.errorMsg}>{error}</p>
      </div>
    );

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manage Jobs</h1>
          <p className={styles.subtitle}>
            {counts.active} active · {totalApps} total applicants · {totalNew}{" "}
            new today
          </p>
        </div>
        <Link
          href="/employer/jobs/new"
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          <Plus size={14} /> Post new job
        </Link>
      </div>

      {/* ── Stat pills ─────────────────────────────────────────────────────── */}
      <div className={styles.statRow}>
        {[
          {
            label: "Active jobs",
            val: counts.active,
            color: "var(--status-success)",
          },
          {
            label: "Total applicants",
            val: totalApps,
            color: "var(--color-secondary)",
          },
          { label: "New applications", val: totalNew, color: "#f59e0b" },
          { label: "Drafts", val: counts.draft, color: "var(--text-muted)" },
        ].map((s) => (
          <div key={s.label} className={styles.statPill}>
            <span className={styles.statVal} style={{ color: s.color }}>
              {s.val}
            </span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`${styles.tab} ${filter === f.key ? styles.tabActive : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className={styles.tabCount}>
              {counts[f.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table head ─────────────────────────────────────────────────────── */}
      <div className={styles.tableHead}>
        <span className={styles.thTitle}>Job Title</span>
        <span>Type</span>
        <span>Applicants</span>
        <span>Views</span>
        <span>Deadline</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      {/* ── Rows ───────────────────────────────────────────────────────────── */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <BarChart2
              size={32}
              style={{ color: "var(--text-muted)", marginBottom: 12 }}
            />
            <p>No jobs found</p>
            <span>
              {search
                ? `No results for "${search}"`
                : "Post your first job to start hiring"}
            </span>
          </div>
        ) : (
          filtered.map((job) => {
            const meta = STATUS_META[job.status];
            const dl = daysLeft(job.deadline);
            return (
              <div
                key={job.id}
                className={`${styles.row} ${
                  job.status === "expired" || job.status === "closed"
                    ? styles.rowFaded
                    : ""
                }`}
              >
                {/* Title */}
                <div className={styles.rowTitle}>
                  <p className={styles.jobTitle}>{job.title}</p>
                  <p className={styles.jobMeta}>
                    {job.location} · {job.salary}
                  </p>
                  {job.newApps > 0 && (
                    <span className={styles.newBadge}>+{job.newApps} new</span>
                  )}
                </div>

                <span className={styles.rowType}>{job.type}</span>

                {/* Applicants */}
                <div className={styles.rowApps}>
                  <span className={styles.appCount}>{job.applicants}</span>
                  <Link
                    href={`/employer/jobs/${job.id}/applicants`}
                    className={styles.viewAppsLink}
                  >
                    View <ExternalLink size={10} />
                  </Link>
                </div>

                {/* Views */}
                <span className={styles.rowViews}>
                  <Eye size={10} /> {job.viewsCount}
                </span>

                {/* Deadline */}
                <div className={styles.rowDeadline}>
                  <span>{job.deadline ? formatDate(job.deadline) : "—"}</span>
                  {dl !== null && dl > 0 && (
                    <span
                      style={{
                        color:
                          dl <= 7
                            ? "var(--status-danger)"
                            : "var(--text-muted)",
                        fontSize: 10,
                      }}
                    >
                      <Clock size={9} /> {dl}d left
                    </span>
                  )}
                </div>

                {/* Status */}
                <span className={`${styles.statusChip} ${styles[meta.cls]}`}>
                  {STATUS_ICON[job.status]} {meta.label}
                </span>

                {/* Actions */}
                <div className={styles.rowActions}>
                  {(job.status === "active" || job.status === "paused") && (
                    <button
                      className={styles.actionBtn}
                      title={job.status === "active" ? "Pause" : "Activate"}
                      onClick={() => toggleStatus(job.id)}
                    >
                      {job.status === "active" ? (
                        <PauseCircle size={14} />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                    </button>
                  )}
                  <Link
                    href={`/employer/jobs/${job.id}/edit`}
                    className={styles.actionBtn}
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </Link>
                  <button
                    className={styles.actionBtn}
                    title="Duplicate"
                    onClick={() => duplicateJob(job.id)}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    title="Delete"
                    onClick={() => setConfirmDelete(job.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Delete confirm modal ────────────────────────────────────────────── */}
      {confirmDelete && (
        <div className={styles.overlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <AlertCircle size={24} />
            </div>
            <h3 className={styles.modalTitle}>Delete this job?</h3>
            <p className={styles.modalBody}>
              This will remove the job posting and all associated data. This
              cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={() => deleteJob(confirmDelete)}
              >
                Delete job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
