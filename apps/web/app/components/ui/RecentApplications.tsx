/** @format */
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "../../hooks/useSession";
import styles from "../../applicant/styles/applicant.module.css";

interface Application {
  title?: string;
  company?: string;
  logoUrl?: string;
  time?: string;
  job?: { title?: string; company?: { companyName?: string; logoUrl?: string } };
  appliedAt?: string;
  status: string;
}

const STATUS_CLASS: Record<string, string | undefined> = {
  applied: styles["badge-applied"],
  interview: styles["badge-interview"],
  rejected: styles["badge-rejected"],
  offered: styles["badge-green"],
};

interface Props {
  applications: Application[];
}

export function RecentApplications({ applications }: Props) {
  // FIX: removed console.log("Applications Recent------->", applications)
  const { user } = useSession();
  const isApplicant = user?.role === "applicant";

  return (
    <div>
      <div className={styles["section-header"]}>
        <h2 className={styles["section-title"]}>Recent Applications</h2>
        {/* FIX: was href="jobs" (relative — breaks depending on route).
            Now role-aware absolute path. */}
        <Link
          href={isApplicant ? "/jobs" : "/employer/applicants"}
          className={styles["section-link"]}
        >
          View all →
        </Link>
      </div>

      <div className={styles.card}>
        {applications.length === 0 ? (
          <p className={styles["empty-text"]}>
            No applications yet.{" "}
            {isApplicant && (
              <Link href="/jobs" className={styles["link-accent"]}>
                Browse jobs →
              </Link>
            )}
          </p>
        ) : (
          <div className={styles["job-list"]}>
            {applications.map((job) => (
              <div
                key={`${job.title}-${job.company}`}
                className={styles["job-row"]}
              >
                {/* FIX: Image crashed when logoUrl was empty/undefined.
                    Now shows initial-based fallback avatar instead. */}
                {job.logoUrl ? (
                  <Image
                    width={40}
                    height={40}
                    src={job.logoUrl}
                    alt={`${job.company} logo`}
                    className={styles["job-logo"]}
                    onError={(e) => {
                      // hide broken img on load error
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className={styles["job-logo-fallback"]}>
                    {job.company?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}

                <div className={styles["job-info"]}>
                  <p className={styles["job-title"]}>{job.title}</p>
                  <p className={styles["job-company"]}>{job.company}</p>
                </div>

                <div className={styles["job-meta"]}>
                  <span className={styles["job-time"]}>{job.time}</span>
                  <span
                    className={`${styles.badge} ${STATUS_CLASS[job.status] ?? ""}`}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
