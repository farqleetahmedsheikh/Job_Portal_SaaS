/** @format */
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Star,
  Download,
  Calendar,
  MessageSquare,
  ChevronDown,
  XCircle,
  Eye,
  Clock,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useApplicants } from "../../../../hooks/useApplicants";
import { CandidateAvatar } from "../../../../components/ui/CandidateAvatar";
import { timeAgo } from "../../../../lib";
import {
  STATUS_META,
  PIPELINE,
  type AppStatus,
  type SortKey,
} from "../../../../types/applicants.types";
import styles from "../../../styles/applicants.module.css";

interface Props {
  id: string; // plain prop — no Promise, no use()
}

export function ApplicantsView({ id }: Props) {
  const {
    job,
    applicants,
    filtered,
    counts,
    loading,
    error,
    filter,
    setFilter,
    search,
    setSearch,
    sort,
    setSort,
    sortOpen,
    setSortOpen,
    selected,
    toggleSelect,
    selectAll,
    clearSelected,
    toggleStar,
    changeStatus,
  } = useApplicants({ id });

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

  // ── Error ─────────────────────────────────────────────────────────────────
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
        <Link href="/employer/jobs" className={styles.back}>
          <ArrowLeft size={14} /> Back to jobs
        </Link>
        <div className={styles.headerMain}>
          <div>
            <h1 className={styles.title}>{job?.title ?? "Job Applicants"}</h1>
            <p className={styles.subtitle}>
              {applicants.length} applicants
              {job?.location ? ` · ${job.location}` : ""}
              {job?.locationType ? ` (${job.locationType})` : ""}
              {job?.createdAt
                ? ` · Posted ${new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : ""}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={`${styles.btn} ${styles.btnGhost}`}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Pipeline tabs ──────────────────────────────────────────────────── */}
      <div className={styles.pipeline}>
        {PIPELINE.map((s) => {
          const meta = STATUS_META[s];
          return (
            <button
              key={s}
              className={`${styles.pipelineStep} ${filter === s ? styles.pipelineActive : ""}`}
              onClick={() => setFilter(filter === s ? "all" : s)}
            >
              <span className={`${styles.pipelineChip} ${styles[meta.cls]}`}>
                {counts[s]}
              </span>
              <span className={styles.pipelineLabel}>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search applicants…"
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
              {(["match", "date", "name"] as SortKey[]).map((o) => (
                <button
                  key={o}
                  className={`${styles.dropItem} ${sort === o ? styles.dropActive : ""}`}
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

        {selected.length > 0 && (
          <div className={styles.bulkActions}>
            <span>{selected.length} selected</span>
            <button
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            >
              <Calendar size={12} /> Schedule
            </button>
            <button
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            >
              <MessageSquare size={12} /> Message
            </button>
            <button
              className={`${styles.btn} ${styles.btnDangerGhost} ${styles.btnSm}`}
              onClick={clearSelected}
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <Users
            size={32}
            style={{ color: "var(--text-muted)", marginBottom: 12 }}
          />
          <p>No applicants found</p>
          <span>
            {search
              ? `No results for "${search}"`
              : "No applications in this stage yet"}
          </span>
        </div>
      ) : (
        <>
          <div className={styles.tableHead}>
            <input
              type="checkbox"
              checked={
                selected.length === filtered.length && filtered.length > 0
              }
              onChange={() => selectAll(filtered)}
            />
            <span>Candidate</span>
            <span>Experience</span>
            <span>Skills</span>
            <span>Applied</span>
            <span>Match</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className={styles.list}>
            {filtered.map((app) => {
              const meta = STATUS_META[app.status];
              const isSelected = selected.includes(app.id);

              return (
                <div
                  key={app.id}
                  className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(app.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className={styles.candidate}>
                    <CandidateAvatar
                      name={app.name}
                      avatarUrl={app.avatarUrl}
                    />
                    <div className={styles.candidateInfo}>
                      <div className={styles.candidateName}>
                        <Link
                          href={`/employer/applicants/${app.id}`}
                          className={styles.nameLink}
                        >
                          {app.name}
                        </Link>
                        <button
                          className={`${styles.starBtn} ${app.starred ? styles.starActive : ""}`}
                          onClick={() => toggleStar(app.id)}
                          aria-label={app.starred ? "Unstar" : "Star"}
                        >
                          <Star
                            size={13}
                            style={{ fill: app.starred ? "#f59e0b" : "none" }}
                          />
                        </button>
                      </div>
                      <p className={styles.candidateTitle}>{app.title}</p>
                      <p className={styles.candidateLocation}>{app.location}</p>
                    </div>
                  </div>

                  <span className={styles.experience}>{app.experience}</span>

                  <div className={styles.skills}>
                    {app.skills.slice(0, 2).map((s) => (
                      <span key={s} className={styles.skill}>
                        {s}
                      </span>
                    ))}
                    {app.skills.length > 2 && (
                      <span className={styles.skillMore}>
                        +{app.skills.length - 2}
                      </span>
                    )}
                  </div>

                  <span className={styles.appliedAt}>
                    <Clock size={10} /> {timeAgo(app.appliedAt)}
                  </span>

                  <div className={styles.matchWrap}>
                    <div
                      className={styles.matchRing}
                      style={{ "--pct": app.match } as React.CSSProperties}
                    >
                      <span
                        className={styles.matchNum}
                        style={{
                          color:
                            app.match >= 90
                              ? "var(--status-success)"
                              : app.match >= 75
                                ? "var(--color-secondary)"
                                : "#f59e0b",
                        }}
                      >
                        {app.match}%
                      </span>
                    </div>
                  </div>

                  <div className={styles.statusWrap}>
                    <select
                      className={`${styles.statusSelect} ${styles[meta.cls]}`}
                      value={app.status}
                      onChange={(e) =>
                        changeStatus(app.id, e.target.value as AppStatus)
                      }
                    >
                      {PIPELINE.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.rowActions}>
                    <Link
                      href={`/employer/applicants/${app.id}`}
                      className={styles.actionBtn}
                      title="View profile"
                    >
                      <Eye size={14} />
                    </Link>
                    <Link
                      href={`/employer/messages?to=${app.id}`}
                      className={styles.actionBtn}
                      title="Message"
                    >
                      <MessageSquare size={14} />
                    </Link>
                    <button
                      className={styles.actionBtn}
                      title="Schedule interview"
                    >
                      <Calendar size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className={styles.footer}>
            Showing {filtered.length} of {applicants.length} applicants
          </p>
        </>
      )}
    </div>
  );
}
