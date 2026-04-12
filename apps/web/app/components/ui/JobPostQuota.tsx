/** @format */

"use client";

import { Plus, AlertCircle, Zap } from "lucide-react";
import { useState } from "react";
import { useBilling } from "../../hooks/useBilling";
import { getPlanMeta } from "../../types/billing.types";
import { UpgradeModal } from "./UpgradeModal";
import styles from "../../employer/styles/billing.module.css";

export function JobPostQuota() {
  const { subscription, loading } = useBilling();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading || !subscription) return null;

  const planMeta = getPlanMeta(subscription.plan);
  const remaining = subscription.jobPostsRemaining;
  const total = planMeta.jobPostsPerMonth;
  const used = total - remaining;
  const pct = total === 0 ? 100 : Math.min((used / total) * 100, 100);
  const isExhausted = remaining === 0;
  const isWarning = remaining <= 1 && !isExhausted;

  return (
    <>
      <div
        className={`${styles["quota-banner"]} ${isExhausted ? styles["quota-banner-danger"] : isWarning ? styles["quota-banner-warn"] : ""}`}
      >
        <div className={styles["quota-banner-left"]}>
          {isExhausted ? (
            <AlertCircle size={14} className={styles["icon-danger"]} />
          ) : (
            <Plus size={14} />
          )}
          <div>
            <span className={styles["quota-banner-label"]}>
              Job posts this month
            </span>
            <span className={styles["quota-banner-count"]}>
              {used} of {total} used
              {isExhausted && " — limit reached"}
              {isWarning && ` — ${remaining} remaining`}
            </span>
          </div>
        </div>

        <div className={styles["quota-banner-right"]}>
          <div className={styles["quota-track"]}>
            <div
              className={`${styles["quota-fill"]} ${isExhausted ? styles["quota-fill-danger"] : isWarning ? styles["quota-fill-warn"] : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {(isExhausted || isWarning) && (
            <button
              className={styles["quota-upgrade-btn"]}
              onClick={() => setShowUpgrade(true)}
            >
              <Zap size={11} /> Upgrade
            </button>
          )}
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          trigger="job_post_limit"
          currentPlan={subscription.plan}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
}
