/** @format */

"use client";

import { useState } from "react";
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
  Star,
  Zap,
  Shield,
} from "lucide-react";
import { useManageJobs } from "../../hooks/useManageJobs";
import { useBilling } from "../../hooks/useBilling";
import { formatDate } from "../../lib";
import {
  STATUS_META,
  FILTERS,
  type JobStatus,
} from "../../types/manage-jobs.types";
import { UpgradeModal } from "../../components/ui/UpgradeModal";
import { JobPostQuota } from "../../components/ui/JobPostQuota";
import styles from "../styles/manage-jobs.module.css";
import billingStyles from "../styles/billing.module.css";

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

// ── Feature job modal — shown after posting or from ⋮ menu ────────────────────
function FeatureJobModal({
  jobId,
  jobTitle,
  onClose,
  onFeature,
  loading,
}: {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
  onFeature: (jobId: string) => void;
  loading: boolean;
}) {
  return (
    <div className={billingStyles.overlay} onClick={onClose}>
      <div
        className={billingStyles["upgrade-modal"]}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={billingStyles["modal-close"]} onClick={onClose}>
          <XCircle size={16} />
        </button>

        <div
          className={billingStyles["upgrade-icon"]}
          style={{ background: "var(--color-background-warning)" }}
        >
          <Star size={20} style={{ color: "var(--color-text-warning)" }} />
        </div>

        <h2 className={billingStyles["upgrade-title"]}>Feature this job?</h2>
        <p className={billingStyles["upgrade-body"]}>
          <strong>{jobTitle}</strong> was posted successfully. Feature it to pin
          it to the top of search results and get up to 3× more applicants.
        </p>

        <div className={billingStyles["upgrade-plan-preview"]}>
          <div className={billingStyles["upgrade-plan-name"]}>
            What you get with a featured listing
          </div>
          <ul className={billingStyles["upgrade-features"]}>
            <li>
              <CheckCircle2 size={11} /> Pinned to top of all job searches
            </li>
            <li>
              <CheckCircle2 size={11} /> "Featured" badge on your listing
            </li>
            <li>
              <CheckCircle2 size={11} /> 3× average applicant increase
            </li>
            <li>
              <CheckCircle2 size={11} /> Active for 7 days
            </li>
            <li>
              <CheckCircle2 size={11} /> PKR 1,999 one-time charge
            </li>
          </ul>
        </div>

        <div className={billingStyles["upgrade-actions"]}>
          <button
            className={billingStyles["upgrade-btn"]}
            onClick={() => onFeature(jobId)}
            disabled={loading}
          >
            {loading ? "Redirecting…" : "Feature this job — PKR 1,999"}
          </button>
          <button className={billingStyles["upgrade-skip"]} onClick={onClose}>
            No thanks, skip
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Addons modal — extra posts, cap boost, featured ───────────────────────────
function AddonsModal({ onClose }: { onClose: () => void }) {
  const { purchaseAddon, checkoutLoading } = useBilling();

  const addons = [
    {
      type: "extra_post" as const,
      icon: <Plus size={18} />,
      title: "Extra job post",
      desc: "Post one additional job outside your monthly quota.",
      price: 999,
      color: "var(--color-background-info)",
      iconColor: "var(--color-text-info)",
    },
    {
      type: "feature_job" as const,
      icon: <Star size={18} />,
      title: "Feature a job (7 days)",
      desc: "Pin your job to the top of search results for 7 days.",
      price: 1999,
      color: "var(--color-background-warning)",
      iconColor: "var(--color-text-warning)",
    },
    {
      type: "boost_cap" as const,
      icon: <Zap size={18} />,
      title: "Boost applicant cap +25",
      desc: "Reopen a closed job and accept 25 more applicants.",
      price: 1499,
      color: "var(--color-background-success)",
      iconColor: "var(--color-text-success)",
    },
  ];

  return (
    <div className={billingStyles.overlay} onClick={onClose}>
      <div
        className={billingStyles["upgrade-modal"]}
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={billingStyles["modal-close"]} onClick={onClose}>
          <XCircle size={16} />
        </button>

        <h2 className={billingStyles["upgrade-title"]}>Add-ons</h2>
        <p className={billingStyles["upgrade-body"]}>
          One-time purchases — no subscription required.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {addons.map((addon) => (
            <div
              key={addon.type}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "var(--color-background-secondary)",
                border: "1px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-md)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: addon.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: addon.iconColor,
                }}
              >
                {addon.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {addon.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    marginTop: 2,
                  }}
                >
                  {addon.desc}
                </div>
              </div>
              <button
                style={{
                  background: "var(--color-text-primary)",
                  color: "var(--color-background-primary)",
                  border: "none",
                  borderRadius: "var(--border-radius-md)",
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  opacity: checkoutLoading ? 0.6 : 1,
                }}
                disabled={checkoutLoading}
                onClick={() => purchaseAddon(addon.type)}
              >
                PKR {new Intl.NumberFormat("en-PK").format(addon.price)}
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border-tertiary)",
            paddingTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Shield size={14} style={{ color: "var(--color-text-secondary)" }} />
          <p
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Want a{" "}
            <strong style={{ color: "var(--status-success)" }}>
              Verified badge
            </strong>{" "}
            on all your job posts?{" "}
            <Link
              href="/employer/billing"
              style={{ color: "var(--color-text-info)" }}
            >
              PKR 3,999/month — manage in Billing →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
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

  const { subscription, purchaseAddon, checkoutLoading } = useBilling();

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  const [featureJobId, setFeatureJobId] = useState<string | null>(null);
  const [featureJobTitle, setFeatureJobTitle] = useState("");
  const [lastPostedJob, setLastPostedJob] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // ── Guard: check quota before navigating to post job ─────────────────────
  const handlePostJobClick = (e: React.MouseEvent) => {
    if (subscription && subscription.jobPostsRemaining <= 0) {
      e.preventDefault();
      setShowUpgrade(true);
    }
  };

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
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manage Jobs</h1>
          <p className={styles.subtitle}>
            {counts.active} active · {totalApps} total applicants · {totalNew}{" "}
            new today
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {/* Add-ons button */}
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => setShowAddons(true)}
          >
            <Zap size={14} /> Add-ons
          </button>

          {/* Post job — guarded by quota */}
          <Link
            href="/employer/jobs/new"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handlePostJobClick}
          >
            <Plus size={14} /> Post new job
          </Link>
        </div>
      </div>

      <JobPostQuota />

      {/* ── Stat pills ── */}
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

      {/* ── Search ── */}
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

      {/* ── Tabs ── */}
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

      {/* ── Table head ── */}
      <div className={styles.tableHead}>
        <span className={styles.thTitle}>Job Title</span>
        <span>Type</span>
        <span>Applicants</span>
        <span>Views</span>
        <span>Deadline</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      {/* ── Rows ── */}
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
                  <p className={styles.jobTitle}>
                    {job.isFeatured && (
                      <Star
                        size={11}
                        style={{
                          color: "var(--color-text-warning)",
                          marginRight: 4,
                        }}
                      />
                    )}
                    {job.title}
                  </p>
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

                <span className={`${styles.statusChip} ${styles[meta.cls]}`}>
                  {STATUS_ICON[job.status]} {meta.label}
                </span>

                {/* Actions */}
                <div className={styles.rowActions}>
                  {/* Feature button — only for active non-featured jobs */}
                  {job.status === "active" && !job.isFeatured && (
                    <button
                      className={styles.actionBtn}
                      title="Feature this job"
                      onClick={() => {
                        setFeatureJobId(job.id);
                        setFeatureJobTitle(job.title);
                      }}
                    >
                      <Star size={14} />
                    </button>
                  )}

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

      {/* ── Delete confirm modal ── */}
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

      {/* ── Upgrade modal — quota exhausted ── */}
      {showUpgrade && subscription && (
        <UpgradeModal
          trigger="job_post_limit"
          currentPlan={subscription.plan}
          onClose={() => setShowUpgrade(false)}
        />
      )}

      {/* ── Add-ons modal ── */}
      {showAddons && <AddonsModal onClose={() => setShowAddons(false)} />}

      {/* ── Feature job modal ── */}
      {featureJobId && (
        <FeatureJobModal
          jobId={featureJobId}
          jobTitle={featureJobTitle}
          onClose={() => {
            setFeatureJobId(null);
            setFeatureJobTitle("");
          }}
          onFeature={(id) => purchaseAddon("feature_job", id)}
          loading={checkoutLoading}
        />
      )}

      {/* ── Post-job feature prompt — triggered by post job page ── */}
      {lastPostedJob && (
        <FeatureJobModal
          jobId={lastPostedJob.id}
          jobTitle={lastPostedJob.title}
          onClose={() => setLastPostedJob(null)}
          onFeature={(id) => purchaseAddon("feature_job", id)}
          loading={checkoutLoading}
        />
      )}
    </div>
  );
}
