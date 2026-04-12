/** @format */

"use client";

import { X, Zap, CheckCircle2 } from "lucide-react";
import {
  PLANS,
  getPlanMeta,
  type SubscriptionPlan,
} from "../../types/billing.types";
import { useBilling } from "../../hooks/useBilling";
import styles from "../../employer/styles/billing.module.css";

export type UpgradeTrigger =
  | "applicant_view_limit"
  | "ai_matcher"
  | "talent_db"
  | "team_seats"
  | "automation"
  | "job_post_limit"
  | "featured_slots";

const TRIGGER_COPY: Record<
  UpgradeTrigger,
  {
    title: string;
    body: string;
    target: SubscriptionPlan;
  }
> = {
  applicant_view_limit: {
    title: "You've reached your applicant view limit",
    body: "Your current plan only shows 10 applicants per job. Upgrade to see every candidate and never miss a great hire.",
    target: "starter",
  },
  ai_matcher: {
    title: "AI candidate matching",
    body: "Let AI rank your applicants by fit score and explain why — saving hours of manual screening.",
    target: "starter",
  },
  talent_db: {
    title: "Search our talent database",
    body: "Access thousands of open-to-work candidates. Search by skills, location and experience before posting a job.",
    target: "growth",
  },
  team_seats: {
    title: "Invite your team",
    body: "Collaborate with hiring managers and HR colleagues. Team access starts on Starter.",
    target: "starter",
  },
  automation: {
    title: "Automate your hiring pipeline",
    body: "Auto-move candidates, send follow-ups, and trigger interview invites without manual effort.",
    target: "growth",
  },
  job_post_limit: {
    title: "Monthly job post limit reached",
    body: "You've used all your job posts for this month. Upgrade for more slots or purchase a one-time extra post.",
    target: "starter",
  },
  featured_slots: {
    title: "Feature your job listing",
    body: "Featured jobs appear at the top of search results and get 3× more applicants.",
    target: "growth",
  },
};

interface Props {
  trigger: UpgradeTrigger;
  currentPlan: SubscriptionPlan;
  onClose: () => void;
}

export function UpgradeModal({ trigger, currentPlan, onClose }: Props) {
  const { checkout, checkoutLoading } = useBilling();
  const copy = TRIGGER_COPY[trigger];
  const targetMeta = getPlanMeta(copy.target);

  // If they already have the target plan or higher, suggest next tier
  const PLAN_ORDER: SubscriptionPlan[] = ["free", "starter", "growth", "scale"];
  const effectiveTarget =
    PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(copy.target)
      ? PLAN_ORDER[Math.min(PLAN_ORDER.indexOf(currentPlan) + 1, 3)]
      : copy.target;

  const meta = getPlanMeta(effectiveTarget as SubscriptionPlan);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles["upgrade-modal"]}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles["modal-close"]} onClick={onClose}>
          <X size={16} />
        </button>

        <div className={styles["upgrade-icon"]}>
          <Zap size={20} />
        </div>

        <h2 className={styles["upgrade-title"]}>{copy.title}</h2>
        <p className={styles["upgrade-body"]}>{copy.body}</p>

        <div className={styles["upgrade-plan-preview"]}>
          <div className={styles["upgrade-plan-name"]}>
            {meta.label} — PKR{" "}
            {new Intl.NumberFormat("en-PK").format(meta.price)}/mo
          </div>
          <ul className={styles["upgrade-features"]}>
            <li>
              <CheckCircle2 size={11} /> {meta.jobPostsPerMonth} job posts/month
            </li>
            <li>
              <CheckCircle2 size={11} /> View up to {meta.maxApplicantsViewable}{" "}
              applicants
            </li>
            <li>
              <CheckCircle2 size={11} /> AI matcher: {meta.aiMatcher}
            </li>
            {meta.hasTalentDb && (
              <li>
                <CheckCircle2 size={11} /> Talent database access
              </li>
            )}
            {meta.hasVerifiedBadge && (
              <li>
                <CheckCircle2 size={11} /> Verified badge
              </li>
            )}
            {meta.hasAutomation && (
              <li>
                <CheckCircle2 size={11} /> Automation workflows
              </li>
            )}
          </ul>
        </div>

        <div className={styles["upgrade-actions"]}>
          <button
            className={styles["upgrade-btn"]}
            onClick={() => checkout(effectiveTarget as SubscriptionPlan)}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? "Redirecting…" : `Upgrade to ${meta.label}`}
          </button>
          <button className={styles["upgrade-skip"]} onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
