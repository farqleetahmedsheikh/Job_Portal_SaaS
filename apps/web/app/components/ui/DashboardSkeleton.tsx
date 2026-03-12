/** @format */
"use client";

import styles from "../../employer/styles/emp-dashboard.module.css";

function Bone({ w = "100%", h = 16 }: { w?: string | number; h?: number }) {
  return (
    <div
      className={styles.skeleton}
      style={{ width: w, height: h, borderRadius: 6 }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Bone w={240} h={28} />
          <Bone w={320} h={14} />
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.statCard}>
            <Bone w={40} h={40} />
            <Bone w={60} h={32} />
            <Bone w={100} h={14} />
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className={styles.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.card} style={{ gap: 12, display: "flex", flexDirection: "column" }}>
            <Bone w={160} h={20} />
            {Array.from({ length: 4 }).map((__, j) => (
              <Bone key={j} h={44} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}