/** @format */
"use client";

import Link from "next/link";
import {
  Plus,
  Users,
  Calendar,
  Building2,
  MessageSquare,
  BarChart2,
  ChevronRight,
} from "lucide-react";
import styles from "../../employer/styles/emp-dashboard.module.css";

const ACTIONS = [
  {
    icon: <Plus size={15} />,
    label: "Post a new job",
    href: "/employer/jobs/new",
  },
  {
    icon: <Users size={15} />,
    label: "Review applications",
    href: "/employer/applicants",
  },
  {
    icon: <Calendar size={15} />,
    label: "Schedule interview",
    href: "/employer/interviews",
  },
  {
    icon: <Building2 size={15} />,
    label: "Edit company profile",
    href: "/employer/company",
  },
  {
    icon: <MessageSquare size={15} />,
    label: "View messages",
    href: "/employer/messages",
  },
  {
    icon: <BarChart2 size={15} />,
    label: "View analytics",
    href: "/employer/analytics",
  },
] as const;

export function QuickActions() {
  return (
    <div className={styles.card}>
      {/* FIX: was using inline style={{ marginBottom: 14 }} on h2 */}
      <h2 className={styles.quickActionsTitle}>Quick Actions</h2>
      <div className={styles.quickActions}>
        {ACTIONS.map((a) => (
          <Link key={a.label} href={a.href} className={styles.quickAction}>
            <span className={styles.quickIcon}>{a.icon}</span>
            <span>{a.label}</span>
            {/* FIX: was using inline style={{ marginLeft: "auto", color: "var(--text-muted)" }} */}
            <ChevronRight size={13} className={styles.quickChevron} />
          </Link>
        ))}
      </div>
    </div>
  );
}
