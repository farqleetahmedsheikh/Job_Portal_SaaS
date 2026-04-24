/** @format */
"use client";

import styles from "../../employer/styles/emp-dashboard.module.css";

// FIX: .skeleton class was missing from emp-dashboard.module.css entirely.
// Bones rendered as plain unstyled divs with no shimmer. Now fixed in CSS.
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
          <Bone w={220} h={26} />
          <Bone w={300} h={14} />
        </div>
        <Bone w={120} h={36} />
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={styles.statCard}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <Bone w={38} h={38} />
            <Bone w={70} h={28} />
            <Bone w={110} h={12} />
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className={styles.grid}>
        {/* Two narrow cards */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className={styles.card}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <Bone w={150} h={18} />
            {Array.from({ length: 4 }).map((__, j) => (
              <div
                key={j}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <Bone w={36} h={36} />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <Bone w="80%" h={13} />
                  <Bone w="55%" h={11} />
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Wide jobs table */}
        <div
          className={`${styles.card} ${styles.cardWide}`}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Bone w={160} h={18} />
            <Bone w={80} h={14} />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} h={42} />
          ))}
        </div>
      </div>
    </div>
  );
}
