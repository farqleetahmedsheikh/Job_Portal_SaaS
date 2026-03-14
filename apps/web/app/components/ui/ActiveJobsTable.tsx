/** @format */
"use client";

import Link from "next/link";
import { Users, Eye, ChevronRight } from "lucide-react";
import { formatDate } from "../../lib";
import type { ActiveJob } from "../../types/emp-dashboard.types";
import styles from "../../employer/styles/emp-dashboard.module.css";

interface Props {
  jobs: ActiveJob[];
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function ActiveJobsTable({ jobs }: Props) {
  console.log(jobs);
  return (
    <div className={`${styles.card} ${styles.cardWide}`}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Active Job Postings</h2>
        <Link href="/employer/jobs" className={styles.cardLink}>
          Manage jobs <ChevronRight size={13} />
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className={styles.empty}>No active jobs. Post one to get started.</p>
      ) : (
        <div className={styles.jobTable}>
          <div className={styles.jobTableHead}>
            <span>Title</span>
            <span>Applicants</span>
            <span>Views</span>
            <span>Posted</span>
            <span>Expires</span>
            <span>Status</span>
            <span />
          </div>

          {jobs.map((j) => {
            const dl = daysLeft(j.deadline);
            return (
              <div key={j.id} className={styles.jobTableRow}>
                <span className={styles.jobTitle}>{j.title}</span>

                <span className={styles.jobStat}>
                  <Users size={11} /> {j.applicants}
                </span>

                <span className={styles.jobStat}>
                  <Eye size={11} /> {j.viewsCount}
                </span>

                <span className={styles.jobMeta}>
                  {j.createdAt ? formatDate(j.createdAt) : "—"}
                </span>

                <span
                  className={styles.jobDays}
                  style={{
                    color:
                      dl !== null && dl <= 7
                        ? "var(--status-danger)"
                        : "var(--text-muted)",
                  }}
                >
                  {dl !== null ? `${dl}d left` : "—"}
                </span>

                <span
                  className={`${styles.jobStatus} ${
                    j.status === "active" ? styles.jobActive : styles.jobPaused
                  }`}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
