/** @format */
"use client";

import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import type { EmployerStats } from "../../types/emp-dashboard.types";
import styles from "../../employer/styles/emp-dashboard.module.css";

interface StatCard {
  label: string;
  value: number;
  delta: string;
  icon: React.ReactNode;
  color: string;
}

function buildCards(stats: EmployerStats): StatCard[] {
  return [
    {
      label: "Active Jobs",
      value: stats.activeJobs,
      delta: "Currently open",
      icon: <Briefcase size={18} />,
      color: "var(--color-secondary)",
    },
    {
      label: "Total Applicants",
      value: stats.totalApplications,
      delta: `${stats.newApplications} new`,
      icon: <Users size={18} />,
      color: "#f59e0b",
    },
    {
      label: "Upcoming Interviews",
      value: stats.upcomingInterviews,
      delta: "Scheduled",
      icon: <Calendar size={18} />,
      color: "var(--status-success)",
    },
    {
      label: "New Applications",
      value: stats.newApplications,
      delta: "Awaiting review",
      icon: <CheckCircle2 size={18} />,
      color: "#8b5cf6",
    },
  ];
}

interface Props {
  stats: EmployerStats;
}

export function StatsGrid({ stats }: Props) {
  const cards = buildCards(stats);

  return (
    <div className={styles.statsGrid}>
      {cards.map((s) => (
        <div key={s.label} className={styles.statCard}>
          <div className={styles.statTop}>
            <div
              className={styles.statIcon}
              style={{
                background: `${s.color}18`,
                color: s.color,
                border: `1px solid ${s.color}28`,
              }}
            >
              {s.icon}
            </div>
            <TrendingUp size={14} style={{ color: "var(--status-success)" }} />
          </div>
          <p className={styles.statValue}>{s.value}</p>
          <p className={styles.statLabel}>{s.label}</p>
          <p className={styles.statDelta}>{s.delta}</p>
        </div>
      ))}
    </div>
  );
}
