/** @format */
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Download,
  Minus,
} from "lucide-react";
import { useAnalytics } from "../../hooks/useAnalytics";
import type {
  ChartPoint,
  FunnelStage,
  TopJob,
  SourceBreakdown,
  DateRange,
} from "../../types/analytics.types";
import styles from "../styles/analytics.module.css";

// ── Constants ─────────────────────────────────────────────────────────────────
const RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
];

const SERIES = [
  { key: "views" as const, label: "Views", color: "#4f8ef7" },
  { key: "applications" as const, label: "Applications", color: "#a78bfa" },
  { key: "offers" as const, label: "Offers", color: "#34d9b3" },
];

const FUNNEL_COLORS = ["#4f8ef7", "#a78bfa", "#f59e0b", "#34d9b3", "#f43f5e"];

const SOURCE_COLORS = [
  "#4f46e5",
  "#4f8ef7",
  "#34d9b3",
  "#f59e0b",
  "#a78bfa",
  "#f43f5e",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function Delta({ val }: { val: number }) {
  const cls =
    val > 0 ? styles.deltaPos : val < 0 ? styles.deltaNeg : styles.deltaNeut;
  const Icon = val > 0 ? TrendingUp : val < 0 ? TrendingDown : Minus;
  return (
    <span className={`${styles.statDelta} ${cls}`}>
      <Icon size={10} /> {Math.abs(val)}%
    </span>
  );
}

// ── SVG Line Chart ─────────────────────────────────────────────────────────────
function LineChart({ data }: { data: ChartPoint[] }) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    point: ChartPoint;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 700;
  const H = 200;
  const padL = 36;
  const padR = 12;
  const padT = 10;
  const padB = 28;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allVals = data.flatMap((d) => [d.views, d.applications, d.offers]);
  const maxVal = Math.max(...allVals, 1);
  const steps = 4;
  const gridVals = Array.from({ length: steps + 1 }, (_, i) =>
    Math.round((maxVal / steps) * (steps - i)),
  );

  const xOf = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const yOf = (v: number) => padT + (1 - v / maxVal) * innerH;

  const path = (key: keyof ChartPoint) => {
    if (data.length < 2) return "";
    return data
      .map(
        (d, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(d[key] as number)}`,
      )
      .join(" ");
  };

  const area = (key: keyof ChartPoint, color: string) => {
    if (data.length < 2) return null;
    const p = path(key);
    const lastX = xOf(data.length - 1);
    const baseY = padT + innerH;
    return (
      <path
        d={`${p} L ${lastX} ${baseY} L ${padL} ${baseY} Z`}
        fill={color}
        fillOpacity=".06"
      />
    );
  };

  return (
    <div className={styles.chartWrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.chartSvg}
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={(e) => {
          if (!svgRef.current) return;
          const rect = svgRef.current.getBoundingClientRect();
          const mouseX = ((e.clientX - rect.left) / rect.width) * W;
          const relX = mouseX - padL;
          const idx = Math.max(
            0,
            Math.min(
              data.length - 1,
              Math.round((relX / innerW) * (data.length - 1)),
            ),
          );
          setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            point: data[idx],
          });
        }}
      >
        {/* Grid */}
        <g className={styles.chartGrid}>
          {gridVals.map((v, i) => {
            const y = padT + (i / steps) * innerH;
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} />
                <text
                  x={padL - 6}
                  y={y + 4}
                  textAnchor="end"
                  className={styles.chartAxisLabel}
                >
                  {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                </text>
              </g>
            );
          })}
          {/* X labels */}
          {data.map((d, i) => {
            const show =
              data.length <= 12 || i % Math.ceil(data.length / 8) === 0;
            return show ? (
              <text
                key={i}
                x={xOf(i)}
                y={H - 6}
                textAnchor="middle"
                className={styles.chartAxisLabel}
              >
                {d.label}
              </text>
            ) : null;
          })}
        </g>

        {/* Areas */}
        {SERIES.map((s) => area(s.key, s.color))}

        {/* Lines */}
        {SERIES.map((s) => (
          <path
            key={s.key}
            d={path(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Hover dots */}
        {tooltip &&
          data.map((d, i) =>
            Math.abs(
              xOf(i) -
                tooltip.x *
                  (W / (svgRef.current?.getBoundingClientRect().width ?? W)),
            ) < 20
              ? SERIES.map((s) => (
                  <circle
                    key={s.key}
                    cx={xOf(i)}
                    cy={yOf(d[s.key] as number)}
                    r={4}
                    fill={s.color}
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                  />
                ))
              : null,
          )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            opacity: 1,
            transform: tooltip.x > 500 ? "translateX(-110%)" : undefined,
          }}
        >
          <div className={styles.tooltipLabel}>{tooltip.point.label}</div>
          {SERIES.map((s) => (
            <div key={s.key} className={styles.tooltipRow}>
              <span
                className={styles.tooltipDot}
                style={{ background: s.color }}
              />
              {s.label}: <strong>{tooltip.point[s.key]}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Funnel ────────────────────────────────────────────────────────────────────
function Funnel({ data }: { data: FunnelStage[] }) {
  return (
    <div className={styles.funnelList}>
      {data.map((stage, i) => (
        <div key={stage.stage} className={styles.funnelItem}>
          <div className={styles.funnelTop}>
            <span className={styles.funnelStage}>{stage.stage}</span>
            <span className={styles.funnelCount}>
              {stage.count.toLocaleString()}
            </span>
          </div>
          <div className={styles.funnelTrack}>
            <div
              className={styles.funnelFill}
              style={{
                width: `${stage.pct}%`,
                background: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
              }}
            />
          </div>
          <span className={styles.funnelPct}>{stage.pct}% of total</span>
        </div>
      ))}
    </div>
  );
}

// ── Source Breakdown ──────────────────────────────────────────────────────────
function SourceBreakdownList({ data }: { data: SourceBreakdown[] }) {
  return (
    <div className={styles.sourceList}>
      {data.map((s, i) => (
        <div key={s.source} className={styles.sourceItem}>
          <div className={styles.sourceTop}>
            <span className={styles.sourceName}>{s.source}</span>
            <span className={styles.sourceCount}>
              {s.count} · {s.pct}%
            </span>
          </div>
          <div className={styles.sourceTrack}>
            <div
              className={styles.sourceFill}
              style={{
                width: `${s.pct}%`,
                background: SOURCE_COLORS[i % SOURCE_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Top Jobs Table ─────────────────────────────────────────────────────────────
function TopJobsTable({ jobs }: { jobs: TopJob[] }) {
  const statusCls: Record<TopJob["status"], string> = {
    active: styles.statusActive,
    paused: styles.statusPaused,
    closed: styles.statusClosed,
  };
  return (
    <table className={styles.jobsTable}>
      <thead>
        <tr>
          <th>Job Title</th>
          <th>Views</th>
          <th>Applications</th>
          <th>Hire Rate</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j.id} className={styles.jobsTableRow}>
            <td>
              <Link
                href={`/employer/jobs/${j.id}`}
                className={styles.jobTitle2}
              >
                {j.title}
              </Link>
            </td>
            <td>{j.views.toLocaleString()}</td>
            <td>{j.applications.toLocaleString()}</td>
            <td>
              <span
                style={{
                  color:
                    j.hireRate >= 10
                      ? "var(--status-success)"
                      : j.hireRate >= 5
                        ? "var(--status-warning)"
                        : "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                {j.hireRate}%
              </span>
            </td>
            <td>
              <span
                className={`${styles.jobStatusChip} ${statusCls[j.status]}`}
              >
                {j.status.charAt(0).toUpperCase() + j.status.slice(1)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function AnalyticsSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`${styles.skeleton} ${styles.skeletonCard}`}
          />
        ))}
      </div>
      <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
      <div className={styles.skeletonRow}>
        <div className={`${styles.skeleton} ${styles.skeletonHalf}`} />
        <div className={`${styles.skeleton} ${styles.skeletonHalf}`} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const STAT_CARDS = [
  {
    key: "totalViews" as const,
    delta: "viewsDelta" as const,
    label: "Total Views",
    sub: "Job listing impressions",
    icon: <Eye size={16} />,
    color: "#4f8ef7",
  },
  {
    key: "totalApplications" as const,
    delta: "applicationsDelta" as const,
    label: "Applications",
    sub: "Candidates applied",
    icon: <Users size={16} />,
    color: "#a78bfa",
  },
  {
    key: "hireRate" as const,
    delta: "hireRateDelta" as const,
    label: "Hire Rate",
    sub: "Applications → offers",
    icon: <CheckCircle2 size={16} />,
    color: "#34d9b3",
    suffix: "%",
  },
  {
    key: "avgTimeToHire" as const,
    delta: "timeToHireDelta" as const,
    label: "Avg. Time to Hire",
    sub: "Days from post to offer",
    icon: <Clock size={16} />,
    color: "#f59e0b",
    suffix: "d",
    invertDelta: true, // lower is better
  },
];

export default function AnalyticsPage() {
  const { data, loading, error, range, changeRange } = useAnalytics();

  if (loading) return <AnalyticsSkeleton />;
  if (error || !data)
    return (
      <div className={styles.page}>
        <p className={styles.errorMsg}>
          {error ?? "Failed to load analytics."}
        </p>
      </div>
    );

  const { overview, chart, funnel, topJobs, sources } = data;

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Analytics</h1>
          <p>Track your hiring performance and pipeline health</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className={styles.rangePicker}>
            {RANGES.map((r) => (
              <button
                key={r.value}
                className={`${styles.rangeBtn} ${range === r.value ? styles.rangeBtnActive : ""}`}
                onClick={() => changeRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className={`${styles.btn} ${styles.btnGhost}`}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((s) => {
          const raw = overview[s.key];
          const delta = overview[s.delta];
          const disp = s.invertDelta ? -delta : delta;
          return (
            <div key={s.key} className={styles.statCard}>
              <div className={styles.statTop}>
                <div
                  className={styles.statIcon}
                  style={{ background: `${s.color}18`, color: s.color }}
                >
                  {s.icon}
                </div>
                <Delta val={disp} />
              </div>
              <div className={styles.statValue}>
                {raw.toLocaleString()}
                {s.suffix ?? ""}
              </div>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statSub}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Trend chart ────────────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Performance Over Time</h2>
            <p className={styles.cardSub}>
              Views, applications and offers per period
            </p>
          </div>
        </div>
        <LineChart data={chart} />
        <div className={styles.chartLegend}>
          {SERIES.map((s) => (
            <div key={s.key} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: s.color }}
              />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Funnel + Sources ────────────────────────────────────────────────── */}
      <div className={`${styles.row} ${styles.row2}`}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Hiring Funnel</h2>
              <p className={styles.cardSub}>Candidate drop-off at each stage</p>
            </div>
          </div>
          <Funnel data={funnel} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Traffic Sources</h2>
              <p className={styles.cardSub}>Where applicants found your jobs</p>
            </div>
          </div>
          <SourceBreakdownList data={sources} />
        </div>
      </div>

      {/* ── Top jobs table ──────────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Top Performing Jobs</h2>
            <p className={styles.cardSub}>Ranked by applications received</p>
          </div>
          <Link
            href="/employer/jobs"
            className={`${styles.btn} ${styles.btnGhost}`}
          >
            View all jobs
          </Link>
        </div>
        <div className={styles.cardBody}>
          <TopJobsTable jobs={topJobs} />
        </div>
      </div>
    </div>
  );
}
