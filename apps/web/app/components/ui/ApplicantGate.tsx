/** @format */

"use client";

import { useState } from "react";
import { Lock, Zap } from "lucide-react";
import { useBilling } from "../../hooks/useBilling";
import { getPlanMeta } from "../../types/billing.types";
import { UpgradeModal } from "./UpgradeModal";
import styles from "../../employer/styles/billing.module.css";

interface Props {
  totalCount: number; // actual total from API (job.applicantCount)
  children: React.ReactNode;
}

export function ApplicantGate({ totalCount, children }: Props) {
  const { subscription, loading } = useBilling();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading || !subscription) return <>{children}</>;

  const planMeta = getPlanMeta(subscription.plan);
  const viewLimit = planMeta.maxApplicantsViewable;
  const isLimited =
    viewLimit !== "Unlimited" && totalCount > (viewLimit as number);
  const hidden = isLimited ? totalCount - (viewLimit as number) : 0;

  return (
    <>
      {children}

      {isLimited && (
        <div className={styles["gate-banner"]}>
          <div className={styles["gate-lock"]}>
            <Lock size={16} />
          </div>
          <div className={styles["gate-copy"]}>
            <span className={styles["gate-title"]}>
              {hidden} more candidate{hidden !== 1 ? "s" : ""} hidden
            </span>
            <span className={styles["gate-sub"]}>
              Your {planMeta.label} plan shows up to {viewLimit} applicants.
              Upgrade to see everyone.
            </span>
          </div>
          <button
            className={styles["gate-btn"]}
            onClick={() => setShowUpgrade(true)}
          >
            <Zap size={12} /> Unlock all
          </button>
        </div>
      )}

      {showUpgrade && (
        <UpgradeModal
          trigger="applicant_view_limit"
          currentPlan={subscription.plan}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
}
