/** @format */

"use client";

import Link from "next/link";
import styles from "../../styles/applicant.module.css";

interface Interview {
  title: string;
  sub: string;
  time: string;
  color: string;
}

interface Props {
  interviews: Interview[];
}

export function UpcomingInterviews({ interviews }: Props) {
  return (
    <div>
      <div className={styles["section-header"]}>
        <h2 className={styles["section-title"]}>Upcoming</h2>
        <Link href="/applicant/interviews" className={styles["section-link"]}>
          View calendar →
        </Link>
      </div>
      <div className={styles.card}>
        {interviews.length === 0 ? (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              padding: "12px 0",
            }}
          >
            No upcoming interviews scheduled.
          </p>
        ) : (
          <div className={styles.timeline}>
            {interviews.map((item) => (
              <div
                key={`${item.title}-${item.time}`}
                className={styles["timeline-item"]}
              >
                <div
                  className={`${styles["timeline-dot"]} ${styles[item.color]}`}
                />
                <div className={styles["timeline-content"]}>
                  <p className={styles["timeline-title"]}>{item.title}</p>
                  <p className={styles["timeline-sub"]}>{item.sub}</p>
                </div>
                <span className={styles["timeline-time"]}>{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
