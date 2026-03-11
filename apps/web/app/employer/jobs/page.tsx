/** @format */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Users,
  BarChart2,
  Clock,
  ChevronDown,
  Search,
  ToggleLeft,
  ToggleRight,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Filter,
} from "lucide-react";
import styles from "../styles/manage-jobs.module.css";

type JobStatus = "active" | "paused" | "draft" | "closed" | "expired";

interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  salary: string;
  posted: string;
  deadline: string;
  daysLeft: number;
  status: JobStatus;
  applicants: number;
  views: number;
  newApps: number;
}

const JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    type: "Full-time",
    location: "Remote",
    salary: "$160k–$200k",
    posted: "Mar 1",
    deadline: "Mar 30",
    daysLeft: 20,
    status: "active",
    applicants: 48,
    views: 342,
    newApps: 5,
  },
  {
    id: "2",
    title: "React Developer",
    type: "Full-time",
    location: "San Francisco, CA",
    salary: "$140k–$170k",
    posted: "Mar 4",
    deadline: "Apr 5",
    daysLeft: 26,
    status: "active",
    applicants: 31,
    views: 218,
    newApps: 3,
  },
  {
    id: "3",
    title: "UI/UX Designer",
    type: "Full-time",
    location: "Remote",
    salary: "$100k–$130k",
    posted: "Feb 28",
    deadline: "Mar 28",
    daysLeft: 18,
    status: "active",
    applicants: 19,
    views: 156,
    newApps: 1,
  },
  {
    id: "4",
    title: "Backend Engineer",
    type: "Full-time",
    location: "New York, NY",
    salary: "$150k–$190k",
    posted: "Feb 25",
    deadline: "Mar 25",
    daysLeft: 15,
    status: "paused",
    applicants: 27,
    views: 189,
    newApps: 0,
  },
  {
    id: "5",
    title: "DevOps Engineer",
    type: "Full-time",
    location: "Remote",
    salary: "$130k–$160k",
    posted: "Feb 20",
    deadline: "Mar 20",
    daysLeft: 10,
    status: "active",
    applicants: 14,
    views: 97,
    newApps: 2,
  },
  {
    id: "6",
    title: "Product Manager",
    type: "Full-time",
    location: "Remote",
    salary: "$140k–$170k",
    posted: "Feb 10",
    deadline: "Mar 10",
    daysLeft: 0,
    status: "expired",
    applicants: 62,
    views: 489,
    newApps: 0,
  },
  {
    id: "7",
    title: "Data Engineer",
    type: "Contract",
    location: "Remote",
    salary: "$80–120/hr",
    posted: "Jan 28",
    deadline: "Feb 28",
    daysLeft: 0,
    status: "closed",
    applicants: 8,
    views: 72,
    newApps: 0,
  },
  {
    id: "8",
    title: "Marketing Manager",
    type: "Full-time",
    location: "Chicago, IL",
    salary: "$90k–$110k",
    posted: "—",
    deadline: "—",
    daysLeft: 0,
    status: "draft",
    applicants: 0,
    views: 0,
    newApps: 0,
  },
];

const STATUS_META: Record<
  JobStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  active: { label: "Active", cls: "sActive", icon: <CheckCircle2 size={11} /> },
  paused: { label: "Paused", cls: "sPaused", icon: <PauseCircle size={11} /> },
  draft: { label: "Draft", cls: "sDraft", icon: <Edit2 size={11} /> },
  closed: { label: "Closed", cls: "sClosed", icon: <XCircle size={11} /> },
  expired: {
    label: "Expired",
    cls: "sExpired",
    icon: <AlertCircle size={11} />,
  },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "draft", label: "Drafts" },
  { key: "closed", label: "Closed" },
  { key: "expired", label: "Expired" },
] as const;

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState(JOBS);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const toggleStatus = (id: string) => {
    setJobs((p) =>
      p.map((j) =>
        j.id === id
          ? {
              ...j,
              status:
                j.status === "active" ? "paused" : ("active" as JobStatus),
            }
          : j,
      ),
    );
  };

  const deleteJob = (id: string) => {
    setJobs((p) => p.filter((j) => j.id !== id));
    setConfirmDelete(null);
  };

  const filtered = useMemo(() => {
    let list = jobs;
    if (filter !== "all") list = list.filter((j) => j.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q),
      );
    }
    return list;
  }, [jobs, filter, search]);

  const counts = useMemo(
    () => ({
      all: jobs.length,
      active: jobs.filter((j) => j.status === "active").length,
      paused: jobs.filter((j) => j.status === "paused").length,
      draft: jobs.filter((j) => j.status === "draft").length,
      closed: jobs.filter((j) => j.status === "closed").length,
      expired: jobs.filter((j) => j.status === "expired").length,
    }),
    [jobs],
  );

  const totalApps = jobs
    .filter((j) => j.status === "active")
    .reduce((a, j) => a + j.applicants, 0);
  const totalNew = jobs.reduce((a, j) => a + j.newApps, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
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

      {/* Stat pills */}
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

      {/* Toolbar */}
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

      {/* Tabs */}
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

      {/* Table header */}
      <div className={styles.tableHead}>
        <span className={styles.thTitle}>Job Title</span>
        <span>Type</span>
        <span>Applicants</span>
        <span>Views</span>
        <span>Deadline</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      {/* Rows */}
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
            return (
              <div
                key={job.id}
                className={`${styles.row} ${job.status === "expired" || job.status === "closed" ? styles.rowFaded : ""}`}
              >
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
                  <Eye size={10} /> {job.views}
                </span>

                <div className={styles.rowDeadline}>
                  <span>{job.deadline}</span>
                  {job.daysLeft > 0 && (
                    <span
                      style={{
                        color:
                          job.daysLeft <= 7
                            ? "var(--status-danger)"
                            : "var(--text-muted)",
                        fontSize: 10,
                      }}
                    >
                      <Clock size={9} /> {job.daysLeft}d left
                    </span>
                  )}
                </div>

                <span className={`${styles.statusChip} ${styles[meta.cls]}`}>
                  {meta.icon} {meta.label}
                </span>

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
                    onClick={() => {}}
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

      {/* Delete confirm modal */}
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
