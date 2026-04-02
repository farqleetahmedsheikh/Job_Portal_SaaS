/** @format */

"use client";

import Link from "next/link";
import styles from "../../applicant/styles/applicant.module.css";
import { useSession } from "../../hooks/useSession";

interface Application {
  title: string;
  company: string;
  logoUrl: string;
  time: string;
  status: "applied" | "interview" | "rejected" | "offered";
}

const STATUS_CLASS: Record<Application["status"], string | undefined> = {
  applied: styles["badge-applied"],
  interview: styles["badge-interview"],
  rejected: styles["badge-rejected"],
  offered: styles["badge-green"],
};

interface Props {
  applications: Application[];
}

export function RecentApplications({ applications }: Props) {
  const { user } = useSession();
  console.log("Applications Recent------->", applications);
  return (
    <div>
      <div className={styles["section-header"]}>
        <h2 className={styles["section-title"]}>Recent Applications</h2>
        <Link href="jobs" className={styles["section-link"]}>
          View all →
        </Link>
      </div>
      <div className={styles.card}>
        {applications.length === 0 ? (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              padding: "12px 10px",
            }}
          >
            No applications yet.{" "}
            {user?.role === "applicant" && (
              <Link href="/jobs" style={{ color: "var(--color-secondary)" }}>
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
                <img
                  src={`${job.logoUrl}`}
                  alt="Logo"
                  className={styles["job-logo"]}
                />
                <div className={styles["job-info"]}>
                  <p className={styles["job-title"]}>{job.title}</p>
                  <p className={styles["job-company"]}>{job.company}</p>
                </div>
                <div className={styles["job-meta"]}>
                  <span className={styles["job-time"]}>{job.time}</span>
                  <span
                    className={`${styles.badge} ${STATUS_CLASS[job.status]}`}
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
