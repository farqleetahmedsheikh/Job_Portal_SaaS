/** @format */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { api } from "../../lib";
import { API_BASE } from "../../constants";
// Uses applicant.module.css (shared between both dashboards — do not change import)
import styles from "../../applicant/styles/applicant.module.css";
// Uses emp-dashboard classes for inline-state messages
import dashStyles from "../../employer/styles/emp-dashboard.module.css";

interface RawInterview {
  id: string;
  scheduledAt: string;
  durationMins: number;
  status: string;
  job?: { title?: string };
  candidate?: { fullName?: string };
}

interface Props {
  mode?: "employer" | "applicant";
  interviews?: unknown[];
}

const DOT_COLORS = [
  "dotBlue",
  "dotGreen",
  "dotYellow",
  "dotRed",
  "dotPurple",
] as const;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = isToday
    ? "Today"
    : d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
  return `${date} · ${time}`;
}

export function UpcomingInterviews({ mode = "applicant" }: Props) {
  const [items, setItems] = useState<RawInterview[]>([]);
  const [loading, setLoading] = useState(true);
  // FIX: was .catch(console.error) — error was swallowed, component stayed in
  // "Loading..." state forever on failure. Added proper error state.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url =
      mode === "employer"
        ? `${API_BASE}/interviews`
        : `${API_BASE}/interviews/mine`;

    api<RawInterview[]>(url, "GET")
      .then((data) => {
        const now = new Date();
        const upcoming = data
          .filter(
            (iv) => iv.status === "upcoming" && new Date(iv.scheduledAt) >= now,
          )
          .sort(
            (a, b) =>
              new Date(a.scheduledAt).getTime() -
              new Date(b.scheduledAt).getTime(),
          )
          .slice(0, 5);
        setItems(upcoming);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to load interviews",
        );
      })
      .finally(() => setLoading(false));
  }, [mode]);

  const viewAllHref =
    mode === "employer" ? "/employer/interviews" : "/applicant/interviews";

  return (
    <div>
      <div className={styles["section-header"]}>
        <h2 className={styles["section-title"]}>Upcoming Interviews</h2>
        <Link href={viewAllHref} className={styles["section-link"]}>
          View all →
        </Link>
      </div>

      <div className={styles.card}>
        {/* FIX: loading/empty/error were inline-styled <p> tags — now use CSS classes */}
        {loading ? (
          <p className={dashStyles.inlineLoading}>Loading…</p>
        ) : error ? (
          <p className={dashStyles.inlineError}>
            <AlertCircle size={13} /> {error}
          </p>
        ) : items.length === 0 ? (
          <p className={dashStyles.inlineEmpty}>
            No upcoming interviews scheduled.
          </p>
        ) : (
          <div className={styles.timeline}>
            {items.map((iv, i) => (
              <div key={iv.id} className={styles["timeline-item"]}>
                <div
                  className={`${styles["timeline-dot"]} ${
                    styles[
                      DOT_COLORS[i % DOT_COLORS.length] as keyof typeof styles
                    ] ?? ""
                  }`}
                />
                <div className={styles["timeline-content"]}>
                  <p className={styles["timeline-title"]}>
                    {iv.job?.title ?? "Interview"}
                  </p>
                  <p className={styles["timeline-sub"]}>
                    {mode === "employer"
                      ? (iv.candidate?.fullName ?? "Candidate")
                      : `${iv.durationMins ?? 45} min`}
                  </p>
                </div>
                <span className={styles["timeline-time"]}>
                  {formatTime(iv.scheduledAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
