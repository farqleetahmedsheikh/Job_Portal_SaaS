/** @format */
"use client";

import { useState } from "react";
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
  CheckCircle2,
  AlertCircle,
  Filter,
  Building2,
  Calendar,
  SlidersHorizontal,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useApplications } from "../../hooks/useApplications";
import type { Application, AppStatus } from "../../types/applications.types";
import styles from "../styles/applications.module.css";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AppStatus,
  { label: string; icon: React.ReactNode; cls: string; step: number }
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

// ─── Application row ──────────────────────────────────────────────────────────

function ApplicationRow({
  app,
  onWithdraw,
  onRemove,
}: {
  app: Application;
  onWithdraw: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[app.status];
  const inPipeline = app.status !== "rejected" && app.status !== "withdrawn";

  return (
    <div className={`${styles.row} ${expanded ? styles["row-open"] : ""}`}>
      <div
        className={styles["row-main"]}
        onClick={() => setExpanded((p) => !p)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((p) => !p)}
      >
        <div className={styles["row-logo"]}>{app.logo}</div>

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

        <div className={styles["row-salary"]}>{app.salary}</div>

        <div className={styles["row-date"]}>
          <span>{app.appliedDate}</span>
          <span className={styles["row-update"]}>
            <Clock size={10} /> {app.lastUpdate}
          </span>
        </div>

        <div className={styles["row-status"]}>
          <span className={`${styles["status-chip"]} ${styles[cfg.cls]}`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`${styles.chevron} ${expanded ? styles["chevron-up"] : ""}`}
        />
      </div>

      {expanded && (
        <div className={styles["row-expanded"]}>
          {inPipeline && (
            <div className={styles.pipeline}>
              {PIPELINE_STEPS.map((step, i) => {
                const stepNum = i + 1;
                const isDone = stepNum < cfg.step;
                const isActive = stepNum === cfg.step;
                return (
                  <div key={step} className={styles["pipeline-step"]}>
                    <div
                      className={`${styles["step-dot"]} ${isDone ? styles["dot-done"] : ""} ${isActive ? styles["dot-active"] : ""}`}
                    >
                      {isDone ? <CheckCircle2 size={12} /> : stepNum}
                    </div>
                    <span
                      className={`${styles["step-label"]} ${isActive ? styles["step-active"] : ""} ${isDone ? styles["step-done"] : ""}`}
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

            <div className={styles["row-actions"]}>
              {app.jobUrl && (
                <Link
                  href={app.jobUrl}
                  className={`${styles.btn} ${styles["btn-ghost"]}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={12} /> View Job
                </Link>
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
              {app.status !== "withdrawn" && (
                <button
                  className={`${styles.btn} ${styles["btn-danger-ghost"]}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWithdraw(app.id);
                  }}
                >
                  <AlertCircle size={12} /> Withdraw
                </button>
              )}
              <button
                className={`${styles.btn} ${styles["btn-danger-ghost"]}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove "${app.role}" at ${app.company}?`))
                    onRemove(app.id);
                }}
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}
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
              height: 28,
              width: 180,
              background: "var(--surface)",
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              height: 16,
              width: 120,
              background: "var(--surface)",
              borderRadius: 4,
            }}
          />
        </div>
      </div>
      <div className={styles["stat-row"]}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={styles["stat-card"]}
            style={{ height: 64, background: "var(--surface)" }}
          />
        ))}
      </div>
      <div className={styles.list}>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              height: 72,
              borderRadius: 10,
              background: "var(--surface)",
              marginBottom: 8,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const {
    filtered,
    stats,
    counts,
    loading,
    error,
    activeFilter,
    setActiveFilter,
    search,
    setSearch,
    sortBy,
    setSortBy,
    withdrawApplication,
    removeApplication,
  } = useApplications();

  const [showSort, setShowSort] = useState(false);

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className={styles.page}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--status-danger)",
            padding: "14px 18px",
            background: "rgba(239,68,68,0.06)",
            borderRadius: 10,
          }}
        >
          <AlertTriangle size={14} /> {error}
        </div>
      </div>
    );
  }

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
        <div className={styles["search-wrap"]}>
          <Search size={13} className={styles["search-icon"]} />
          <input
            className={styles["search-input"]}
            placeholder="Search role, company, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
        <button
          className={`${styles.btn} ${styles["btn-ghost"]} ${styles["filter-btn"]}`}
        >
          <Filter size={13} />
        </button>
      </div>

      {/* Status filter tabs */}
      <div className={styles["filter-tabs"]}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`${styles["filter-tab"]} ${activeFilter === f.key ? styles["filter-tab-active"] : ""}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
            {(counts[f.key] ?? 0) > 0 && (
              <span className={styles["filter-count"]}>{counts[f.key]}</span>
            )}
          </button>
        ))}
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
          filtered.map((app) => (
            <ApplicationRow
              key={app.id}
              app={app}
              onWithdraw={withdrawApplication}
              onRemove={removeApplication}
            />
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p className={styles["list-footer"]}>
          Showing {filtered.length} of {stats.total} applications
        </p>
      )}
    </div>
  );
}
