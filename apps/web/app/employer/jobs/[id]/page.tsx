/** @format */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Eye,
  TrendingUp,
  BarChart2,
  Briefcase,
  MapPin,
  Clock,
  Star,
  Lock,
} from "lucide-react";
import { api } from "../../../lib";
import { API_BASE } from "../../../constants";

interface PipelineSummary {
  new?: number;
  reviewing?: number;
  shortlisted?: number;
  interview?: number;
  offered?: number;
  rejected?: number;
}

interface Analytics {
  viewsCount: number;
  totalApplications: number;
  applyRate: number;
  statusBreakdown: PipelineSummary;
  funnel?: { stage: string; count: number }[];
  tier: string;
}

interface JobDetail {
  job: any;
  pipelineSummary: PipelineSummary;
  recentApplicants: any[];
}

const PIPELINE_STAGES = [
  { key: "new", label: "New", color: "#6366f1" },
  { key: "reviewing", label: "Reviewing", color: "#f59e0b" },
  { key: "shortlisted", label: "Shortlisted", color: "#3b82f6" },
  { key: "interview", label: "Interview", color: "#8b5cf6" },
  { key: "offered", label: "Offered", color: "#10b981" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
];

export default function EmployerJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLocked, setAnalyticsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<JobDetail>(`${API_BASE}/jobs/${id}/detail`, "GET"),
      api<Analytics>(`${API_BASE}/jobs/${id}/analytics`, "GET").catch((e) => {
        if (e?.status === 403) {
          setAnalyticsLocked(true);
        }
        return null;
      }),
    ])
      .then(([d, a]) => {
        setDetail(d);
        if (a) setAnalytics(a);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 32 }}>Loading…</div>;
  if (!detail) return <div style={{ padding: 32 }}>Job not found</div>;

  const { job, pipelineSummary, recentApplicants } = detail;
  const totalApps = Object.values(pipelineSummary).reduce(
    (s, v) => s + (v ?? 0),
    0,
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            {job.title}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            {job.location} · {job.type} · {job.status}
          </p>
        </div>
        <Link
          href={`/employer/jobs/${id}/edit`}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Edit job
        </Link>
        <Link
          href={`/employer/jobs/${id}/applicants`}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "var(--color-primary)",
            color: "#fff",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          <Users size={13} /> View all applicants
        </Link>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            icon: <Eye size={16} />,
            label: "Views",
            value: analytics?.viewsCount ?? job.viewsCount ?? 0,
          },
          { icon: <Users size={16} />, label: "Applicants", value: totalApps },
          {
            icon: <TrendingUp size={16} />,
            label: "Apply rate",
            value: analytics ? `${analytics.applyRate}%` : "—",
          },
          {
            icon: <Star size={16} />,
            label: "Shortlisted",
            value: pipelineSummary.shortlisted ?? 0,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--surface)",
              borderRadius: 12,
              padding: "16px 20px",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ color: "var(--text-muted)", marginBottom: 8 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Pipeline summary */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            padding: 20,
            border: "1px solid var(--border)",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            Pipeline
          </h3>
          {PIPELINE_STAGES.map((s) => {
            const count = (pipelineSummary as any)[s.key] ?? 0;
            const pct =
              totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
            return (
              <div key={s.key} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <span>{s.label}</span>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "var(--border)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 3,
                      width: `${pct}%`,
                      background: s.color,
                      transition: "width 0.5s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Analytics funnel or locked */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            padding: 20,
            border: "1px solid var(--border)",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            <BarChart2 size={14} style={{ marginRight: 6 }} />
            Analytics
          </h3>
          {analyticsLocked ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "var(--text-muted)",
              }}
            >
              <Lock size={28} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, marginBottom: 12 }}>
                Analytics available on Starter and above
              </p>
              <Link
                href="/employer/billing"
                style={{
                  fontSize: 13,
                  color: "var(--color-primary)",
                  textDecoration: "none",
                }}
              >
                Upgrade plan →
              </Link>
            </div>
          ) : analytics?.funnel ? (
            <div>
              {analytics.funnel.map((f, i) => {
                const pct =
                  analytics?.funnel![0].count > 0
                    ? Math.round((f.count / analytics?.funnel![0].count) * 100)
                    : 0;
                return (
                  <div
                    key={f.stage}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 80,
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      {f.stage}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        background: "var(--border)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 4,
                          width: `${pct}%`,
                          background: `hsl(${220 - i * 20}, 80%, 55%)`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, width: 32 }}>
                      {f.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              No analytics data yet
            </p>
          )}
        </div>
      </div>

      {/* Recent applicants */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          padding: 20,
          border: "1px solid var(--border)",
          marginTop: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
            Recent applicants
          </h3>
          <Link
            href={`/employer/applicants?jobId=${id}`}
            style={{
              fontSize: 12,
              color: "var(--color-primary)",
              textDecoration: "none",
            }}
          >
            View all →
          </Link>
        </div>
        {recentApplicants.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            No applicants yet
          </p>
        ) : (
          recentApplicants.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--color-primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {a.applicant?.fullName?.[0] ?? "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                  {a.applicant?.fullName}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  {a.applicant?.applicantProfile?.jobTitle ?? "Applicant"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {a.matchScore != null && (
                  <span
                    style={{
                      fontSize: 11,
                      background: "#f0fdf4",
                      color: "#16a34a",
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontWeight: 600,
                    }}
                  >
                    {a.matchScore}% match
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    background: "var(--border)",
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}
                >
                  {a.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
