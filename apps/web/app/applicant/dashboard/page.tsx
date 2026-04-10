/** @format */
"use client";

import Link from "next/link";
import { Card } from "../../components/ui/Card";
import { ProfileStrengthCard } from "../../components/ui/ProfileStrengthCard";
import { RecentApplications } from "../../components/ui/RecentApplications";
import { UpcomingInterviews } from "../../components/ui/UpcomingInterviews";
import { useUser } from "../../store/session.store";
import { useProfileStrength } from "../../hooks/useProfileStrength";
import { useApplicantDashboard } from "../../hooks/useApplicantDashboard";
import styles from "../styles/applicant.module.css";

// ─── Greeting based on time of day ────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

// ─── Trend helpers ────────────────────────────────────────────────────────────
function deltaTrend(delta: number): "up" | "down" | "neutral" {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "neutral";
}

function deltaLabel(delta: number, suffix = "Change"): string {
  if (delta === 0) return `Nothing ${suffix}`;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}% ${suffix}`;
}

// ─── Skeleton placeholder while loading ──────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div
      className={styles.page}
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className={styles.welcome}>
        <div className={styles["welcome-text"]}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonSubtitle} />
        </div>
      </div>
      <div className={styles.stats}>
        {[1, 2, 3].map((n) => (
          <div key={n} className={styles.skeletonCard} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApplicantDashboard() {
  const user = useUser();
  const { data: strengthData } = useProfileStrength();

  // Hook returns flat values — no data wrapper, no refetch
  const { stats, applications, interviews, loading, error, responseRateLabel } =
    useApplicantDashboard();

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const greeting = getGreeting();
  const strength = strengthData?.strength ?? 0;

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBanner}>
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Welcome ──────────────────────────────────────────────────────────── */}
      <div className={styles.welcome}>
        <div className={styles["welcome-text"]}>
          <h1>
            {greeting}, {firstName} 👋
          </h1>
          <p>
            You have {stats?.activeApplications ?? 0} active application
            {(stats?.activeApplications ?? 0) !== 1 ? "s" : ""} this week. Keep
            going!
          </p>
        </div>
        <Link
          href="/applicant/browse-jobs"
          className={styles["welcome-action"]}
        >
          Browse Jobs →
        </Link>
      </div>

      {/* Stat cards ───────────────────────────────────────────────────────── */}
      <div className={styles.stats}>
        <Card
          title="Applications"
          value={String(stats?.totalApplications ?? 0)}
          icon="briefcase"
          trend={deltaTrend(stats?.weeklyDelta ?? 0)}
          trendLabel={deltaLabel(stats?.weeklyDelta ?? 0)}
        />

        <Card
          title="Response Rate"
          value={`${stats?.responseRate ?? 0}%`}
          icon="trending-up"
          trend={deltaTrend(stats?.responseRateDelta ?? 0)}
          trendLabel={deltaLabel(stats?.responseRateDelta ?? 0, "change")}
        >
          {responseRateLabel}
        </Card>

        <Card
          title="Profile Strength"
          value={`${strength}%`}
          icon="user"
          trend={strength >= 80 ? "up" : strength >= 50 ? "neutral" : "down"}
          trendLabel={
            strength === 100
              ? "Complete!"
              : strength >= 80
                ? "Almost there"
                : strength >= 50
                  ? "Halfway there"
                  : "Needs attention"
          }
        >
          {user?.isProfileComplete && strength === 100
            ? "Your profile is complete 🎉"
            : "Complete your profile to attract more employers"}
        </Card>
      </div>

      {/* Two-col layout ───────────────────────────────────────────────────── */}
      <div className={styles["two-col"]}>
        {/* Left: Applications + Interviews */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {applications.length > 0 ? (
            <RecentApplications
              applications={applications
                .filter((app) => app.status !== "withdrawn")
                .map((app) => ({
                  ...app,
                  logoUrl: app.logoUrl ?? "",
                  status:
                    app.status === "reviewing"
                      ? "applied"
                      : app.status === "shortlisted"
                        ? "interview"
                        : (app.status as
                            | "applied"
                            | "interview"
                            | "offered"
                            | "rejected"),
                }))}
            />
          ) : (
            <div className={styles.emptyState}>
              <p>No applications yet.</p>
              <Link href="/applicant/browse-jobs">Browse jobs →</Link>
            </div>
          )}

          {interviews.length > 0 ? (
            <UpcomingInterviews interviews={interviews} />
          ) : (
            <div className={styles.emptyState}>
              <p>No upcoming interviews.</p>
            </div>
          )}
        </div>

        {/* Right: Profile strength */}
        <div>
          <div className={styles["section-header"]}>
            <h2 className={styles["section-title"]}>Profile Strength</h2>
          </div>
          <ProfileStrengthCard />
        </div>
      </div>
    </div>
  );
}
