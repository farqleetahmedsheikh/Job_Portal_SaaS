/** @format */
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useUser } from "../../store/session.store";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import { DashboardSkeleton } from "../../components/ui/DashboardSkeleton";
import { StatsGrid } from "../../components/ui/StatsGrid";
import { RecentApplications } from "../../components/ui/RecentApplications";
import { UpcomingInterviews } from "../../components/ui/UpcomingInterviews";
import { ActiveJobsTable } from "../../components/ui/ActiveJobsTable";
import { QuickActions } from "../../components/ui/QuickActions";
import styles from "../styles/emp-dashboard.module.css";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function EmployerDashboardPage() {
  const user = useUser();
  const { data, loading, error } = useEmployerDashboard();

  const displayName = user?.companies?.companyName ?? user?.fullName ?? "there";

  if (loading) return <DashboardSkeleton />;

  // FIX: was a plain <p> with inline color/margin/textAlign — use proper CSS class
  if (error || !data) {
    return (
      <div className={styles.page}>
        <p className={styles.errorMsg}>
          {error ?? "Failed to load dashboard. Please refresh."}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {greeting()}, {displayName} 👋
          </h1>
          <p className={styles.subtitle}>
            Here&apos;s what&apos;s happening with your hiring today.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link
            href="/employer/jobs/new"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus size={15} /> Post a job
          </Link>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <StatsGrid stats={data.stats} />

      {/* ── Cards grid ─────────────────────────────────────────────────────── */}
      <div className={styles.grid}>
        <RecentApplications applications={data.applications} />
        <UpcomingInterviews mode="employer" />
        <ActiveJobsTable jobs={data.jobs} />
        <QuickActions />
      </div>
    </div>
  );
}
