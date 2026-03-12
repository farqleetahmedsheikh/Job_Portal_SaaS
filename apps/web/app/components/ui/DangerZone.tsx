/** @format */
"use client";

import { AlertTriangle, Lock, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { DANGER_ACTIONS } from "../../config/profile.config";
import styles from "../../applicant/styles/profile.module.css";

const ICONS: Record<string, React.ReactNode> = {
  "/change-password": <Lock size={14} />,
  "/delete-account": <Trash2 size={14} />,
};

export function DangerZone() {
  const router = useRouter();
  return (
    <div className={styles.card}>
      <div className={styles["card-header"]}>
        <h2 className={styles["card-title"]}>
          <AlertTriangle
            size={16}
            style={{ color: "var(--status-danger)" }}
            aria-hidden
          />
          Account
        </h2>
      </div>
      <div className={styles["card-body"]}>
        <div className={styles["danger-list"]}>
          {DANGER_ACTIONS.map(({ label, desc, variant, route }) => (
            <div key={route} className={styles["danger-row"]}>
              <div className={styles["danger-info"]}>
                <strong>{label}</strong>
                <span>{desc}</span>
              </div>
              <button
                className={`${styles.btn} ${styles[variant]}`}
                onClick={() => router.push(route)}
                aria-label={label}
              >
                {ICONS[route]} {label.split(" ")[0]}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
