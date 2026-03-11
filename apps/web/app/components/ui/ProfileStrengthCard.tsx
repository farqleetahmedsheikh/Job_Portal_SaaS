/** @format */

"use client";

import Link from "next/link";
import { useUser } from "../../store/session.store";
import { useProfileStrength } from "../../hooks/useProfileStrength";
import { initials } from "../../lib";
import styles from "../styles/profile-strength-card.module.css";

const CIRCUMFERENCE = 2 * Math.PI * 36; // r=36 matches SVG

export function ProfileStrengthCard() {
  const user = useUser();
  const { data, loading } = useProfileStrength();

  const strength = data?.strength ?? 0;
  const checklist = data?.checklist ?? [];
  const userInitials = initials(user?.fullName ?? "U");

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles["profile-card"]}>
          <div className={styles["skeleton-avatar"]} />
          <div className={styles["skeleton-ring"]} />
          <div className={styles["skeleton-list"]} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles["profile-card"]}>
        {/* Top — avatar + name */}
        <div className={styles["profile-top"]}>
          <div className={styles["profile-avatar"]}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              userInitials
            )}
          </div>
          <div>
            <p className={styles["profile-name"]}>{user?.fullName ?? "—"}</p>
            <p className={styles["profile-role"]}>
              {user?.role === "applicant"
                ? (user.applicantProfile?.jobTitle ?? "Applicant")
                : (user?.company?.companyName ?? "Employer")}
            </p>
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
              stroke={
                strength >= 80
                  ? "var(--status-success)"
                  : strength >= 50
                    ? "var(--color-secondary)"
                    : "var(--status-warning)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - strength / 100)}
              style={{
                transition:
                  "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </svg>
          <div className={styles["strength-label"]}>
            <div className={styles["strength-pct"]}>{strength}%</div>
            <div className={styles["strength-sub"]}>Complete</div>
          </div>
        </div>

        {/* Checklist — show top 5, collapsible */}
        <div className={styles.checklist}>
          {checklist.map((item) => (
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
              {/* Show weight only for incomplete items */}
              {!item.done && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "var(--text-muted)",
                  }}
                >
                  +{item.weight}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* CTA — only if incomplete */}
        {strength < 100 && (
          <Link
            href="/applicant/profile"
            style={{ display: "block", marginTop: 20 }}
            className={styles["welcome-action"]}
          >
            Complete Profile →
          </Link>
        )}

        {strength === 100 && (
          <div
            style={{
              marginTop: 16,
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(var(--success-rgb), 0.1)",
              color: "var(--status-success)",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            ✓ Profile complete
          </div>
        )}
      </div>
    </div>
  );
}
