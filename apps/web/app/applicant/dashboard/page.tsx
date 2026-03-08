/** @format */
"use client";

import Link from "next/link";
import { Card } from "../../components/ui/Card";
import styles from "../../styles/applicant.module.css";

const APPLICATIONS = [
  {
    logo: "🏢",
    title: "Senior Frontend Engineer",
    company: "Stripe",
    time: "2h ago",
    status: "interview",
  },
  {
    logo: "🔵",
    title: "Product Designer",
    company: "Linear",
    time: "1d ago",
    status: "applied",
  },
  {
    logo: "🟠",
    title: "React Developer",
    company: "Vercel",
    time: "2d ago",
    status: "reviewed",
  },
  {
    logo: "🟣",
    title: "UI Engineer",
    company: "Figma",
    time: "3d ago",
    status: "applied",
  },
  {
    logo: "🔴",
    title: "Full Stack Developer",
    company: "Loom",
    time: "5d ago",
    status: "rejected",
  },
];

const INTERVIEWS = [
  {
    color: "dot-blue",
    title: "Technical Interview",
    sub: "Stripe · Senior Frontend",
    time: "Today 3:00 PM",
  },
  {
    color: "dot-violet",
    title: "HR Screening",
    sub: "Linear · Product Designer",
    time: "Tomorrow 11 AM",
  },
  {
    color: "dot-teal",
    title: "Take-home Task Due",
    sub: "Vercel · React Developer",
    time: "Thu 5:00 PM",
  },
];

const CHECKLIST = [
  { label: "Basic info added", done: true },
  { label: "Profile photo uploaded", done: true },
  { label: "Resume uploaded", done: true },
  { label: "Skills listed", done: false },
  { label: "Bio written", done: false },
];

const STRENGTH = 62; // percent
const CIRCUMFERENCE = 2 * Math.PI * 36;

const statusClass: Record<string, string | undefined> = {
  interview: styles["badge-interview"],
  applied: styles["badge-applied"],
  reviewed: styles["badge-reviewed"],
  rejected: styles["badge-rejected"],
  saved: styles["badge-saved"],
};

export default function ApplicantPage() {
  return (
    <div className={styles.page}>
      {/* ── Welcome ── */}
      <div className={styles.welcome}>
        <div className={styles["welcome-text"]}>
          <h1>Good morning, Alex 👋</h1>
          <p>You have 3 active applications this week. Keep going!</p>
        </div>
        <Link href="browse-jobs" className={styles["welcome-action"]}>
          Browse Jobs →
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className={styles.stats}>
        <Card
          title="Applications"
          value="24"
          icon="briefcase"
          trend="up"
          trendLabel="12% this week"
        />

        <Card
          title="Response Rate"
          value="38%"
          icon="trending-up"
          trend="down"
          trendLabel="4% drop"
        >
          Below average — follow up on pending apps
        </Card>

        <Card
          title="Profile Strength"
          value="85%"
          icon="user"
          trend="neutral"
          trendLabel="Almost there"
        >
          Complete your bio to reach 100%
        </Card>
      </div>

      {/* ── Main two-col ── */}
      <div className={styles["two-col"]}>
        {/* Left: Applications + Interviews */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Applications */}
          <div>
            <div className={styles["section-header"]}>
              <h2 className={styles["section-title"]}>Recent Applications</h2>
              <Link href="/applications" className={styles["section-link"]}>
                View all →
              </Link>
            </div>
            <div className={styles.card}>
              <div className={styles["job-list"]}>
                {APPLICATIONS.map((job) => (
                  <div key={job.title} className={styles["job-row"]}>
                    <div className={styles["job-logo"]}>{job.logo}</div>
                    <div className={styles["job-info"]}>
                      <p className={styles["job-title"]}>{job.title}</p>
                      <p className={styles["job-company"]}>{job.company}</p>
                    </div>
                    <div className={styles["job-meta"]}>
                      <span className={styles["job-time"]}>{job.time}</span>
                      <span
                        className={`${styles.badge} ${statusClass[job.status]}`}
                      >
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming interviews */}
          <div>
            <div className={styles["section-header"]}>
              <h2 className={styles["section-title"]}>Upcoming</h2>
              <Link href="/interviews" className={styles["section-link"]}>
                View calendar →
              </Link>
            </div>
            <div className={styles.card}>
              <div className={styles.timeline}>
                {INTERVIEWS.map((item) => (
                  <div key={item.title} className={styles["timeline-item"]}>
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
            </div>
          </div>
        </div>

        {/* Right: Profile strength */}
        <div>
          <div className={styles["section-header"]}>
            <h2 className={styles["section-title"]}>Profile Strength</h2>
          </div>
          <div className={styles.card}>
            <div className={styles["profile-card"]}>
              <div className={styles["profile-top"]}>
                <div className={styles["profile-avatar"]}>AL</div>
                <div>
                  <p className={styles["profile-name"]}>Alex Johnson</p>
                  <p className={styles["profile-role"]}>Applicant</p>
                </div>
              </div>

              {/* SVG ring */}
              <div className={styles["strength-ring-wrap"]}>
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    fill="none"
                    stroke="var(--color-secondary)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - STRENGTH / 100)}
                    style={{
                      transition:
                        "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)",
                    }}
                  />
                </svg>
                <div className={styles["strength-label"]}>
                  <div className={styles["strength-pct"]}>{STRENGTH}%</div>
                  <div className={styles["strength-sub"]}>Complete</div>
                </div>
              </div>

              {/* Checklist */}
              <div className={styles.checklist}>
                {CHECKLIST.map((item) => (
                  <div key={item.label} className={styles["check-item"]}>
                    <div
                      className={`${styles["check-icon"]} ${item.done ? styles["check-done"] : styles["check-todo"]}`}
                    >
                      {item.done ? "✓" : "·"}
                    </div>
                    <span
                      className={
                        item.done
                          ? styles["check-text-done"]
                          : styles["check-text-todo"]
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/profile"
                style={{ display: "block", marginTop: 20 }}
                className={styles["welcome-action"]}
              >
                Complete Profile →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
