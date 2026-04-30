/** @format */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CreditCard, LifeBuoy, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, formatDate } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "../admin.module.css";

interface DashboardData {
  totalUsers: number;
  totalEmployers: number;
  totalApplicants: number;
  totalJobs: number;
  totalApplications: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingVerifications: number;
  openComplaints: number;
  recentActivity: { id: string; action: string; createdAt: string }[];
  recentErrors: { id: string; message: string; route: string; createdAt: string }[];
}

interface RevenueInsights {
  monthlyRecurringRevenue: number;
  failedPayments: number | null;
  planDistribution: { plan: string; count: number }[];
  insights: {
    type: "warning" | "opportunity" | "info";
    title: string;
    description: string;
    actionHref?: string;
    actionLabel?: string;
  }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [revenue, setRevenue] = useState<RevenueInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardData>(`${API_BASE}/admin/dashboard`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
    api<RevenueInsights>(`${API_BASE}/admin/revenue-insights`)
      .then(setRevenue)
      .catch(() => setRevenue(null));
  }, []);

  if (error) return <div className={styles.page}><div className={styles.error}>{error}</div></div>;

  const cards: { label: string; value: number | string | null | undefined; icon: LucideIcon }[] = [
    { label: "Total users", value: data?.totalUsers, icon: Users },
    { label: "Revenue", value: data ? `PKR ${data.totalRevenue.toLocaleString()}` : null, icon: CreditCard },
    { label: "Open complaints", value: data?.openComplaints, icon: LifeBuoy },
    { label: "API errors", value: data?.recentErrors.length, icon: AlertTriangle },
    { label: "Active subscriptions", value: data?.activeSubscriptions, icon: CreditCard },
    { label: "Pending verifications", value: data?.pendingVerifications, icon: AlertTriangle },
    { label: "Jobs", value: data?.totalJobs, icon: Users },
    { label: "Applications", value: data?.totalApplications, icon: Users },
  ];

  const maxPlanCount = Math.max(1, ...(revenue?.planDistribution.map((p) => p.count) ?? [1]));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin overview</p>
          <h1 className={styles.title}>System Command Center</h1>
          <p className={styles.subtitle}>
            Monitor users, revenue, complaints, verification, and production errors.
          </p>
        </div>
        <Link href="/admin/logs" className={styles.ghostBtn}>View monitoring</Link>
      </div>

      <section className={styles.grid}>
        {cards.map(({ label, value, icon: Icon }) => (
          <article key={label} className={styles.card}>
            <span>{label}</span>
            <strong>{value ?? "..."}</strong>
            <Icon size={18} />
          </article>
        ))}
      </section>

      <section className={styles.twoCol}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Revenue health</h2>
            <span className={styles.badge}>
              MRR {revenue ? `PKR ${revenue.monthlyRecurringRevenue.toLocaleString()}` : "restricted"}
            </span>
          </div>
          {revenue ? (
            <div className={styles.chartBars}>
              {revenue.planDistribution.map((plan) => (
                <div key={plan.plan} className={styles.barRow}>
                  <span>{plan.plan}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${(plan.count / maxPlanCount) * 100}%` }}
                    />
                  </div>
                  <strong>{plan.count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>Revenue insights are restricted to Super Admin.</div>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Actionable insights</h2>
          </div>
          <div className={styles.list}>
            {(revenue?.insights ?? []).map((insight) => (
              <div key={insight.title} className={styles.row}>
                <div>
                  <h3>{insight.title}</h3>
                  <p>{insight.description}</p>
                </div>
                {insight.actionHref && (
                  <Link href={insight.actionHref} className={styles.ghostBtn}>
                    {insight.actionLabel ?? "Open"}
                  </Link>
                )}
              </div>
            ))}
            {!revenue?.insights?.length && <div className={styles.empty}>Not enough data yet.</div>}
          </div>
        </div>
      </section>

      <section className={styles.twoCol}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}><h2>Recent admin activity</h2></div>
          <div className={styles.list}>
            {(data?.recentActivity ?? []).map((item) => (
              <div key={item.id} className={styles.row}>
                <div>
                  <h3>{item.action}</h3>
                  <p>{formatDate(item.createdAt)}</p>
                </div>
              </div>
            ))}
            {!data?.recentActivity?.length && <div className={styles.empty}>No admin activity yet.</div>}
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHeader}><h2>Recent production errors</h2></div>
          <div className={styles.list}>
            {(data?.recentErrors ?? []).map((item) => (
              <div key={item.id} className={styles.row}>
                <div>
                  <h3>{item.message}</h3>
                  <p>{item.route} · {formatDate(item.createdAt)}</p>
                </div>
              </div>
            ))}
            {!data?.recentErrors?.length && <div className={styles.empty}>No recent errors logged.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
