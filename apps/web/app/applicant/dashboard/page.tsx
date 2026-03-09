/** @format */
"use client";

import Link from "next/link";
import { Card } from "../../components/ui/Card";
import { ProfileStrengthCard } from "../../components/ui/ProfileStrengthCard";
import { RecentApplications } from "../../components/ui/RecentApplications";
import { UpcomingInterviews } from "../../components/ui/UpcomingInterviews";
import { useUser } from "../../store/session.store";
import { useProfileStrength } from "../../hooks/useProfileStrength";
import styles from "../../styles/applicant.module.css";

// ─── Static placeholder data — replace when applications API is built ─
const APPLICATIONS = [
  {
    title: "Frontend Developer",
    company: "Acme Corp",
    logo: "AC",
    time: "2d ago",
    status: "applied" as const,
  },
  {
    title: "React Engineer",
    company: "TechCo",
    logo: "TC",
    time: "5d ago",
    status: "interview" as const,
  },
  {
    title: "UI Developer",
    company: "StartupXYZ",
    logo: "SX",
    time: "1w ago",
    status: "rejected" as const,
  },
];

const INTERVIEWS = [
  {
    title: "Technical Round — Acme Corp",
    sub: "Video call · 45 min",
    time: "Tomorrow, 10:00 AM",
    color: "dot-blue",
  },
  {
    title: "HR Round — TechCo",
    sub: "Phone call · 30 min",
    time: "Friday, 2:00 PM",
    color: "dot-green",
  },
];

// ─── Greeting based on time of day ────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ─── Page ─────────────────────────────────────────────────
export default function ApplicantDashboard() {
  const user = useUser();
  const { data: strengthData } = useProfileStrength(); // ← add this
  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const greeting = getGreeting();
  const strength = strengthData?.strength ?? 0; // ← replace the hardcoded line

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <div className={styles["welcome-text"]}>
          <h1>
            {greeting}, {firstName} 👋
          </h1>
          <p>
            You have {APPLICATIONS.length} active applications this week. Keep
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

      {/* Stat cards */}
      <div className={styles.stats}>
        <Card
          title="Applications"
          value={String(APPLICATIONS.length)}
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
          value={`${strength}%`} // ← was stats.profileStrength
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

      {/* Two-col layout */}
      <div className={styles["two-col"]}>
        {/* Left: Applications + Interviews */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <RecentApplications applications={APPLICATIONS} />
          <UpcomingInterviews interviews={INTERVIEWS} />
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
