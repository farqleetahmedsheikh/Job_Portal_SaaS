/** @format */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  RefreshCw,
  AlertCircle,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { useAnalytics } from "../../hooks/useAnalytics";
import type {
  ChartPoint,
  FunnelStage,
  TopJob,
  SourceBreakdown,
  DateRange,
  SeriesKey,
} from "../../types/analytics.types";
import styles from "../styles/analytics.module.css";

// ── Constants ─────────────────────────────────────────────────────────────────
const RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
];

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "views", label: "Views", color: "#4f8ef7" },
  { key: "applications", label: "Applications", color: "#a78bfa" },
  { key: "offers", label: "Offers", color: "#34d9b3" },
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

// ── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    prev.current = value;
    if (start === end) return;

    const duration = 700;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(start + (end - start) * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <>
      {display.toLocaleString()}
      {suffix}
    </>
  );
}

// ── Delta Badge ───────────────────────────────────────────────────────────────
function Delta({ val, known = true }: { val: number; known?: boolean }) {
  if (!known) {
    return (
      <span className={`${styles.statDelta} ${styles.deltaNeut}`}>
        <Minus size={9} /> —
      </span>
    );
  }
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
function LineChart({
  data,
  activeSeries,
}: {
  data: ChartPoint[];
  activeSeries: Set<SeriesKey>;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 700;
  const H = 220;
  const padL = 44;
  const padR = 16;
  const padT = 12;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const activeSer = SERIES.filter((s) => activeSeries.has(s.key));

  const allVals = data.flatMap((d) => activeSer.map((s) => d[s.key] as number));
  const maxVal = Math.max(...allVals, 1);
  const steps = 4;
  const gridVals = Array.from({ length: steps + 1 }, (_, i) =>
    Math.round((maxVal / steps) * (steps - i)),
  );

  // FIX: guard division by zero when only 1 data point
  const xOf = (i: number) =>
    data.length < 2
      ? padL + innerW / 2
      : padL + (i / (data.length - 1)) * innerW;
  const yOf = (v: number) => padT + (1 - v / maxVal) * innerH;

  // Smooth cubic bezier path instead of sharp lines
  const smooth = (key: SeriesKey): string => {
    if (data.length < 2) return "";
    const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d[key] as number) }));
    return pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1]!;
        const cpx = (prev.x + p.x) / 2;
        return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
      })
      .join(" ");
  };

  const area = (key: SeriesKey, color: string) => {
    if (data.length < 2) return null;
    const linePath = smooth(key);
    const lastX = xOf(data.length - 1);
    const firstX = xOf(0);
    const baseY = padT + innerH;
    return (
      <path
        d={`${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`}
        fill={color}
        fillOpacity=".07"
      />
    );
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || data.length === 0) return;
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
      setHoverIdx(idx);
    },
    [data.length, W, innerW, padL],
  );

  if (data.length === 0) {
    return (
      <div className={styles.chartEmpty}>
        <BarChart3 size={28} />
        <p>No trend data for this period</p>
      </div>
    );
  }

  const hoverPoint = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? xOf(hoverIdx) : null;

  return (
    <div className={styles.chartWrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.chartSvg}
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={handleMouseMove}
      >
        {/* Grid lines */}
        {gridVals.map((v, i) => {
          const y = padT + (i / steps) * innerH;
          return (
            <g key={i} className={styles.chartGrid}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 4"
                strokeWidth={0.8}
              />
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

        {/* X-axis labels */}
        {data.map((d, i) => {
          const show =
            data.length <= 12 || i % Math.ceil(data.length / 8) === 0;
          return show ? (
            <text
              key={i}
              x={xOf(i)}
              y={H - 8}
              textAnchor="middle"
              className={styles.chartAxisLabel}
            >
              {d.label}
            </text>
          ) : null;
        })}

        {/* Areas */}
        {activeSer.map((s) => area(s.key, s.color))}

        {/* Lines */}
        {activeSer.map((s) => (
          <path
            key={s.key}
            d={smooth(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Crosshair */}
        {hoverX !== null && (
          <line
            x1={hoverX}
            y1={padT}
            x2={hoverX}
            y2={padT + innerH}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* Hover dots */}
        {hoverIdx !== null &&
          hoverPoint &&
          activeSer.map((s) => (
            <circle
              key={s.key}
              cx={xOf(hoverIdx)}
              cy={yOf(hoverPoint[s.key] as number)}
              r={4.5}
              fill={s.color}
              stroke="var(--bg-card)"
              strokeWidth={2.5}
            />
          ))}
      </svg>

      {/* FIX: tooltip position uses % instead of hardcoded px threshold */}
      {hoverIdx !== null && hoverPoint && (
        <div
          className={styles.tooltip}
          style={{
            left: `clamp(8px, calc(${((hoverIdx / Math.max(data.length - 1, 1)) * 100).toFixed(1)}% - 64px), calc(100% - 144px))`,
            top: 8,
          }}
        >
          <div className={styles.tooltipLabel}>{hoverPoint.label}</div>
          {activeSer.map((s) => (
            <div key={s.key} className={styles.tooltipRow}>
              <span
                className={styles.tooltipDot}
                style={{ background: s.color }}
              />
              <span className={styles.tooltipSeries}>{s.label}</span>
              <strong>{(hoverPoint[s.key] as number).toLocaleString()}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Funnel ────────────────────────────────────────────────────────────────────
function Funnel({ data }: { data: FunnelStage[] }) {
  if (data.length === 0 || data[0]?.count === 0) {
    return (
      <div className={styles.emptyState}>
        <BarChart3 size={24} />
        <p>No pipeline data yet</p>
        <span>Funnel will populate as candidates progress</span>
      </div>
    );
  }

  return (
    <div className={styles.funnelList}>
      {data.map((stage, i) => {
        const prevCount =
          i > 0 ? (data[i - 1]?.count ?? stage.count) : stage.count;
        const dropOff =
          i > 0 && prevCount > 0
            ? Math.round(((prevCount - stage.count) / prevCount) * 100)
            : null;

        return (
          <div key={stage.stage} className={styles.funnelItem}>
            <div className={styles.funnelTop}>
              <span className={styles.funnelStage}>{stage.stage}</span>
              <div className={styles.funnelMeta}>
                {dropOff !== null && dropOff > 0 && (
                  <span className={styles.funnelDropOff}>↓ {dropOff}%</span>
                )}
                <span className={styles.funnelCount}>
                  {stage.count.toLocaleString()}
                </span>
              </div>
            </div>
            <div className={styles.funnelTrack}>
              <div
                className={styles.funnelFill}
                style={{
                  width: `${stage.pct}%`,
                  background: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                  animationDelay: `${i * 80}ms`,
                }}
              />
            </div>
            <span className={styles.funnelPct}>{stage.pct}% of total</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Source Breakdown ──────────────────────────────────────────────────────────
function SourceBreakdownList({ data }: { data: SourceBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <ArrowUpRight size={24} />
        <p>Source tracking not active yet</p>
        <span>
          Data appears once applicants start arriving via tracked links
        </span>
      </div>
    );
  }

  return (
    <div className={styles.sourceList}>
      {data.map((s, i) => (
        <div key={s.source} className={styles.sourceItem}>
          <div className={styles.sourceTop}>
            <span className={styles.sourceName}>{s.source}</span>
            <span className={styles.sourceCount}>
              {s.count.toLocaleString()} · {s.pct}%
            </span>
          </div>
          <div className={styles.sourceTrack}>
            <div
              className={styles.sourceFill}
              style={{
                width: `${s.pct}%`,
                background: SOURCE_COLORS[i % SOURCE_COLORS.length],
                animationDelay: `${i * 60}ms`,
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
  if (jobs.length === 0) {
    return (
      <div className={styles.tableEmpty}>
        <BarChart3 size={28} />
        <p>No jobs to show yet</p>
        <span>Post a job to start tracking performance metrics</span>
        <Link
          href="/employer/jobs/new"
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          Post a Job <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  // FIX: CSS class map — was missing fallbacks, statusClosed had no fallback
  const statusCls: Record<TopJob["status"], string> = {
    active: styles.statusActive ?? "",
    paused: styles.statusPaused ?? "",
    closed: styles.statusClosed ?? "",
  };

  return (
    // FIX: horizontal scroll wrapper for mobile
    <div className={styles.tableScroll}>
      <table className={styles.jobsTable}>
        {/* FIX: applied styles.jobsTableHead to <thead> so CSS selector works */}
        <thead className={styles.jobsTableHead}>
          <tr>
            <th>Job Title</th>
            <th>Views</th>
            <th>Applications</th>
            <th>Apply Rate</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className={styles.jobsTableRow}>
              <td>
                {/* FIX: span instead of Link so overflow ellipsis works, link is in last col */}
                <span className={styles.jobTitle2}>{j.title}</span>
              </td>
              <td className={styles.numCell}>{j.views.toLocaleString()}</td>
              <td className={styles.numCell}>
                {j.applications.toLocaleString()}
              </td>
              <td className={styles.numCell}>
                {/* FIX: replaced inline style with CSS classes */}
                <span
                  className={
                    j.hireRate >= 10
                      ? styles.rateGood
                      : j.hireRate >= 5
                        ? styles.rateOk
                        : styles.rateLow
                  }
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
              <td>
                <Link
                  href={`/employer/jobs/${j.id}`}
                  className={styles.tableViewLink}
                >
                  View <ArrowRight size={11} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      <div className={`${styles.skeleton} ${styles.skeletonFull}`} />
    </div>
  );
}

// ── Stat Cards config ─────────────────────────────────────────────────────────
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const {
    data,
    loading,
    error,
    range,
    changeRange,
    refresh,
    isRefreshing,
    lastUpdated,
  } = useAnalytics();

  // Series toggle — keep at least 1 active at all times
  const [activeSeries, setActiveSeries] = useState<Set<SeriesKey>>(
    new Set<SeriesKey>(["views", "applications", "offers"]),
  );

  const toggleSeries = useCallback((key: SeriesKey) => {
    setActiveSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev; // never allow empty
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  if (loading) return <AnalyticsSkeleton />;

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <AlertCircle size={32} />
          <h3>Failed to load analytics</h3>
          <p>{error ?? "An unexpected error occurred."}</p>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={refresh}
          >
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      </div>
    );
  }

  const { overview, chart, funnel, topJobs, sources } = data;

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Analytics</h1>
          <p className={styles.pageSub}>
            Track your hiring performance and pipeline health
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.rangePicker}>
            {RANGES.map((r) => (
              <button
                key={r.value}
                className={`${styles.rangeBtn} ${range === r.value ? styles.rangeBtnActive : ""}`}
                onClick={() => changeRange(r.value)}
                aria-pressed={range === r.value}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnIcon}`}
            onClick={refresh}
            disabled={isRefreshing}
            aria-label="Refresh"
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? styles.spinning : undefined}
            />
          </button>
          <button className={`${styles.btn} ${styles.btnGhost}`}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className={styles.lastUpdated}>
          Updated{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((s) => {
          const raw = overview[s.key];
          const delta = overview[s.delta];
          // FIX: delta of exactly 0 means backend didn't supply it — show "—" not "0%"
          const deltaKnown = delta !== 0;
          const disp = s.invertDelta ? -delta : delta;
          return (
            <div
              key={s.key}
              className={styles.statCard}
              style={{ "--card-accent": s.color } as React.CSSProperties}
            >
              <div className={styles.statTop}>
                <div
                  className={styles.statIcon}
                  style={{ background: `${s.color}1a`, color: s.color }}
                >
                  {s.icon}
                </div>
                <Delta val={disp} known={deltaKnown} />
              </div>
              <div className={styles.statValue}>
                <AnimatedCounter value={raw} suffix={s.suffix ?? ""} />
              </div>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statSub}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Trend chart ─────────────────────────────────────────────────────── */}
      <div
        className={`${styles.card} ${isRefreshing ? styles.cardRefreshing : ""}`}
      >
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Performance Over Time</h2>
            <p className={styles.cardSub}>
              Views, applications and offers per period
            </p>
          </div>
        </div>
        <LineChart data={chart} activeSeries={activeSeries} />
        {/* FIX: legend items are toggle buttons — click to show/hide a series */}
        <div className={styles.chartLegend}>
          {SERIES.map((s) => (
            <button
              key={s.key}
              className={`${styles.legendItem} ${!activeSeries.has(s.key) ? styles.legendItemOff : ""}`}
              onClick={() => toggleSeries(s.key)}
              aria-pressed={activeSeries.has(s.key)}
              title={`${activeSeries.has(s.key) ? "Hide" : "Show"} ${s.label}`}
            >
              <span
                className={styles.legendDot}
                style={{
                  background: activeSeries.has(s.key)
                    ? s.color
                    : "var(--border)",
                }}
              />
              {s.label}
            </button>
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

      {/* ── Top jobs table ───────────────────────────────────────────────────── */}
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
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className={styles.cardBody}>
          <TopJobsTable jobs={topJobs} />
        </div>
      </div>
    </div>
  );
}
