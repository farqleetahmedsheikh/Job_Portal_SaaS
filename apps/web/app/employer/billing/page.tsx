/** @format */
/* eslint-disable react/no-unescaped-entities */

"use client";

import { useState } from "react";
import {
  CreditCard,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  BarChart2,
  Shield,
  Plus,
  Package,
  CalendarCheck,
} from "lucide-react";
import { useBilling } from "../../hooks/useBilling";
import {
  PLANS,
  getPlanMeta,
  isUpgrade,
  type BillingInterval,
  type SubscriptionPlan,
} from "../../types/billing.types";
import type { BillingEvent } from "../../types/billing.types";
import styles from "../styles/billing.module.css";

function fmt(n: number) {
  return new Intl.NumberFormat("en-PK").format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  currentPlan,
  onSelect,
  onTrial,
  loading,
  trialAvailable,
}: {
  plan: (typeof PLANS)[0];
  currentPlan: SubscriptionPlan;
  onSelect: (p: SubscriptionPlan, interval?: BillingInterval) => void;
  onTrial: (p: SubscriptionPlan) => void;
  loading: boolean;
  trialAvailable: boolean;
}) {
  const isCurrent = plan.key === currentPlan;
  const upgrade = isUpgrade(currentPlan, plan.key);
  const downgrade = isUpgrade(plan.key, currentPlan);

  return (
    <div
      className={`${styles["plan-card"]} ${plan.highlight ? styles["plan-card-highlight"] : ""} ${isCurrent ? styles["plan-card-current"] : ""}`}
    >
      {plan.highlight && (
        <div className={styles["plan-popular"]}>Most Popular</div>
      )}

      <div className={styles["plan-header"]}>
        <span className={styles["plan-name"]}>{plan.label}</span>
        <div className={styles["plan-price"]}>
          {plan.price === 0 ? (
            <span className={styles["plan-price-amount"]}>Free</span>
          ) : (
            <>
              <span className={styles["plan-price-currency"]}>PKR</span>
              <span className={styles["plan-price-amount"]}>
                {fmt(plan.price)}
              </span>
              <span className={styles["plan-price-period"]}>/mo</span>
            </>
          )}
        </div>
        {plan.price > 0 && (
          <span className={styles["plan-price-period"]}>
            Yearly PKR {fmt(plan.price * 10)} · 2 months free
          </span>
        )}
      </div>

      <div className={styles["plan-divider"]} />

      <ul className={styles["plan-features"]}>
        <li>
          <CheckCircle2 size={12} /> {plan.jobPostsPerMonth} job posts/month
        </li>
        <li>
          <CheckCircle2 size={12} /> {plan.applicantsPerJob} applicants/job
        </li>
        <li>
          <CheckCircle2 size={12} /> View up to {plan.maxApplicantsViewable}{" "}
          applicants
        </li>
        <li>
          <CheckCircle2 size={12} /> {plan.teamSeats} team seat
          {plan.teamSeats > 1 ? "s" : ""}
        </li>
        <li>
          <CheckCircle2 size={12} /> Basic interview scheduling:{" "}
          {plan.maxInterviewsPerMonth} / month
        </li>
        {plan.hasInterviewReminders && (
          <li>
            <CheckCircle2 size={12} /> Automated interview reminders
          </li>
        )}
        {plan.hasCustomEmailTemplates && (
          <li>
            <CheckCircle2 size={12} /> Custom candidate email templates
          </li>
        )}
        {plan.hasContractTemplates && (
          <li>
            <CheckCircle2 size={12} /> Contract and offer templates
          </li>
        )}
        <li>
          <CheckCircle2 size={12} /> AI matcher: {plan.aiMatcher}
        </li>
        {plan.hasTalentDb && (
          <li>
            <CheckCircle2 size={12} /> Talent database
          </li>
        )}
        {plan.hasVerifiedBadge && (
          <li>
            <CheckCircle2 size={12} /> Verified badge
          </li>
        )}
        {plan.hasAutomation && (
          <li>
            <CheckCircle2 size={12} /> Automation
          </li>
        )}
        {plan.hasExport && (
          <li>
            <CheckCircle2 size={12} /> CSV export
          </li>
        )}
        {plan.hasMarketIntel && (
          <li>
            <CheckCircle2 size={12} /> Market intelligence
          </li>
        )}
        <li>
          <CheckCircle2 size={12} /> {plan.support} support
        </li>
      </ul>

      <div className={styles["plan-btn-wrap"]}>
        <button
          className={`${styles["plan-btn"]} ${isCurrent ? styles["plan-btn-current"] : upgrade ? styles["plan-btn-upgrade"] : styles["plan-btn-downgrade"]}`}
          onClick={() => !isCurrent && onSelect(plan.key)}
          disabled={isCurrent || loading}
        >
          {isCurrent
            ? "Current plan"
            : upgrade
              ? `Upgrade to ${plan.label}`
              : downgrade
                ? `Downgrade to ${plan.label}`
                : "Select"}
        </button>
        {!isCurrent && plan.key !== "free" && trialAvailable && (
          <button
            className={`${styles["plan-btn"]} ${styles["plan-btn-current"]}`}
            onClick={() => onTrial(plan.key)}
            disabled={loading}
          >
            Start 7-day trial
          </button>
        )}
        {!isCurrent && plan.key !== "free" && (
          <button
            className={`${styles["plan-btn"]} ${styles["plan-btn-downgrade"]}`}
            onClick={() => onSelect(plan.key, "yearly")}
            disabled={loading}
          >
            Pay yearly
          </button>
        )}
      </div>
    </div>
  );
}

// ── Quota bar ─────────────────────────────────────────────────────────────────
function QuotaBar({
  label,
  used,
  total,
  icon,
}: {
  label: string;
  used: number;
  total: number;
  icon: React.ReactNode;
}) {
  const pct = total === 0 ? 100 : Math.min((used / total) * 100, 100);
  const danger = pct >= 90;
  const warning = pct >= 70 && !danger;
  return (
    <div className={styles["quota-item"]}>
      <div className={styles["quota-label"]}>
        {icon}
        <span>{label}</span>
        <span
          className={`${styles["quota-count"]} ${danger ? styles["quota-danger"] : warning ? styles["quota-warn"] : ""}`}
        >
          {used} / {total}
        </span>
      </div>
      <div className={styles["quota-track"]}>
        <div
          className={`${styles["quota-fill"]} ${danger ? styles["quota-fill-danger"] : warning ? styles["quota-fill-warn"] : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Addon card ────────────────────────────────────────────────────────────────
function AddonCard({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  price,
  note,
  onBuy,
  loading,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  price: number;
  note?: string;
  onBuy: () => void;
  loading: boolean;
}) {
  return (
    <div className={styles["addon-card"]}>
      <div
        className={styles["addon-icon"]}
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className={styles["addon-body"]}>
        <span className={styles["addon-title"]}>{title}</span>
        <span className={styles["addon-desc"]}>{desc}</span>
        {note && <span className={styles["addon-note"]}>{note}</span>}
      </div>
      <div className={styles["addon-action"]}>
        <span className={styles["addon-price"]}>PKR {fmt(price)}</span>
        <button
          className={styles["addon-btn"]}
          onClick={onBuy}
          disabled={loading}
        >
          {loading ? "…" : "Buy"}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const {
    subscription,
    history,
    loading,
    error,
    checkout,
    startTrial,
    purchaseAddon,
    checkoutLoading,
    checkoutError,
    capabilities,
  } = useBilling();

  const [tab, setTab] = useState<
    "plans" | "addons" | "verification" | "history"
  >("plans");

  if (loading) {
    return (
      <div className={styles.page}>
        <div
          className={styles.skeleton}
          style={{ height: 200, borderRadius: 12 }}
        />
        <div
          className={styles.skeleton}
          style={{ height: 400, borderRadius: 12, marginTop: 16 }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles["error-box"]}>
          <AlertCircle size={14} /> {error}
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? "free";
  const planMeta = getPlanMeta(currentPlan);
  const postsUsed =
    planMeta.jobPostsPerMonth - (subscription?.jobPostsRemaining ?? 0);
  const isVerified = subscription?.verificationStatus === "verified";
  const verPending = subscription?.verificationStatus === "pending";
  const trialAvailable = !subscription?.trialUsedAt;
  const interviewUsage = capabilities?.usage.interviews;
  const interviewLimit =
    interviewUsage?.limit === "unlimited" ? null : interviewUsage?.limit;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Billing & Plans</h1>
        <p className={styles.subtitle}>
          Manage your subscription, add-ons and verification
        </p>
      </div>

      {checkoutError && (
        <div className={styles["error-box"]}>
          <AlertCircle size={14} /> {checkoutError}
        </div>
      )}

      {/* ── Current plan summary ── */}
      <div className={styles["current-card"]}>
        <div className={styles["current-left"]}>
          <div className={styles["current-plan-name"]}>
            <Shield size={14} />
            {planMeta.label} plan
            {isVerified && (
              <span className={styles["verified-badge"]}>✓ Verified</span>
            )}
            {verPending && (
              <span className={styles["pending-badge"]}>
                ⏳ Verification pending
              </span>
            )}
          </div>
          {subscription?.currentPeriodEnd && (
            <p className={styles["current-renews"]}>
              <Clock size={11} />
              {currentPlan === "free"
                ? "Resets monthly"
                : `Renews ${fmtDate(subscription.currentPeriodEnd)}`}
            </p>
          )}
        </div>

        <div className={styles["quota-group"]}>
          <QuotaBar
            label="Job posts"
            used={postsUsed}
            total={planMeta.jobPostsPerMonth}
            icon={<BarChart2 size={11} />}
          />
          {subscription &&
            subscription.featuredSlotsRemaining !== undefined &&
            planMeta.featuredSlotsPerMonth > 0 && (
              <QuotaBar
                label="Featured slots"
                used={
                  planMeta.featuredSlotsPerMonth -
                  subscription.featuredSlotsRemaining
                }
                total={planMeta.featuredSlotsPerMonth}
                icon={<Star size={11} />}
              />
            )}
          {interviewUsage && interviewLimit !== null && interviewLimit !== undefined && (
            <QuotaBar
              label="Interviews"
              used={interviewUsage.currentUsage}
              total={interviewLimit}
              icon={<CalendarCheck size={11} />}
            />
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "plans" ? styles["tab-active"] : ""}`}
          onClick={() => setTab("plans")}
        >
          <Zap size={13} /> Plans
        </button>
        <button
          className={`${styles.tab} ${tab === "addons" ? styles["tab-active"] : ""}`}
          onClick={() => setTab("addons")}
        >
          <Package size={13} /> Add-ons
        </button>
        <button
          className={`${styles.tab} ${tab === "verification" ? styles["tab-active"] : ""}`}
          onClick={() => setTab("verification")}
        >
          <Shield size={13} /> Verification
          {isVerified && <span className={styles["tab-verified-dot"]} />}
        </button>
        <button
          className={`${styles.tab} ${tab === "history" ? styles["tab-active"] : ""}`}
          onClick={() => setTab("history")}
        >
          <CreditCard size={13} /> History
        </button>
      </div>

      {/* ══ Plans ══ */}
      {tab === "plans" && (
        <div className={styles["plans-grid"]}>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              currentPlan={currentPlan}
              onSelect={checkout}
              onTrial={startTrial}
              loading={checkoutLoading}
              trialAvailable={trialAvailable}
            />
          ))}
        </div>
      )}

      {/* ══ Add-ons ══ */}
      {tab === "addons" && (
        <div className={styles["addons-section"]}>
          <p className={styles["section-desc"]}>
            One-time purchases — no subscription required. Applied instantly
            after payment.
          </p>

          <div className={styles["addons-list"]}>
            <AddonCard
              icon={<Plus size={17} />}
              iconBg="var(--color-background-info)"
              iconColor="var(--color-text-info)"
              title="Extra job post"
              desc="Post one additional job outside your monthly quota. Never miss a hiring opportunity because of a limit."
              note="One-time · Valid immediately · No expiry"
              price={999}
              onBuy={() => purchaseAddon("extra_post")}
              loading={checkoutLoading}
            />
            <AddonCard
              icon={<Star size={17} />}
              iconBg="var(--color-background-warning)"
              iconColor="var(--color-text-warning)"
              title="Feature a job listing (7 days)"
              desc="Pin your job to the top of all search results. Featured jobs get up to 3× more applicants."
              note="One-time · 7 days active · Select job after checkout"
              price={1999}
              onBuy={() => purchaseAddon("feature_job")}
              loading={checkoutLoading}
            />
            <AddonCard
              icon={<Zap size={17} />}
              iconBg="var(--color-background-success)"
              iconColor="var(--color-text-success)"
              title="Boost applicant cap +25"
              desc="Reopen a job that closed after hitting its applicant limit. Adds 25 more slots to that job."
              note="One-time · Reopens closed job · Select job after checkout"
              price={1499}
              onBuy={() => purchaseAddon("boost_cap")}
              loading={checkoutLoading}
            />
          </div>
        </div>
      )}

      {/* ══ Verification ══ */}
      {tab === "verification" && (
        <div className={styles["verification-section"]}>
          {/* Status banner */}
          {isVerified && (
            <div
              className={styles["verify-status-banner"]}
              data-status="verified"
            >
              <CheckCircle2 size={16} />
              <div>
                <strong>Your company is verified</strong>
                <span>
                  Verified badge is active on all your job posts and company
                  page.
                </span>
              </div>
            </div>
          )}
          {verPending && (
            <div
              className={styles["verify-status-banner"]}
              data-status="pending"
            >
              <Clock size={16} />
              <div>
                <strong>Verification under review</strong>
                <span>
                  We'll notify you within 48 hours once your documents are
                  reviewed.
                </span>
              </div>
            </div>
          )}

          {/* What you get */}
          <div className={styles["verify-what"]}>
            <h3 className={styles["verify-what-title"]}>
              What you get with a Verified badge
            </h3>
            <div className={styles["verify-benefits"]}>
              {[
                {
                  icon: <Shield size={15} />,
                  text: "✓ Green verified checkmark on every job post",
                },
                {
                  icon: <Star size={15} />,
                  text: "Higher placement in search results",
                },
                {
                  icon: <CheckCircle2 size={15} />,
                  text: 'Applicants can filter "Verified employers only"',
                },
                {
                  icon: <BarChart2 size={15} />,
                  text: "Build trust — verified jobs get more applications",
                },
                {
                  icon: <Zap size={15} />,
                  text: "Badge stays active as long as subscription is paid",
                },
              ].map((b, i) => (
                <div key={i} className={styles["verify-benefit-item"]}>
                  <span className={styles["verify-benefit-icon"]}>
                    {b.icon}
                  </span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className={styles["verify-pricing-card"]}>
            <div className={styles["verify-pricing-left"]}>
              <span className={styles["verify-pricing-label"]}>
                Company Verification
              </span>
              <span className={styles["verify-pricing-sub"]}>
                Monthly recurring · Cancel anytime
              </span>
            </div>
            <div className={styles["verify-pricing-right"]}>
              <span className={styles["verify-price"]}>
                PKR <strong>3,999</strong>
                <span>/mo</span>
              </span>
              {!isVerified && !verPending && (
                <button
                  className={styles["verify-btn"]}
                  onClick={() => checkout("growth")}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? "Redirecting…" : "Get verified →"}
                </button>
              )}
              {verPending && (
                <span className={styles["verify-pending-label"]}>
                  Under review
                </span>
              )}
              {isVerified && (
                <span className={styles["verify-active-label"]}>✓ Active</span>
              )}
            </div>
          </div>

          {/* Note */}
          <p className={styles["verify-note"]}>
            Verification requires submitting your NTN, business registration
            number, and official email. Our team reviews submissions within 48
            hours. The badge is automatically removed if the subscription
            lapses.
          </p>
        </div>
      )}

      {/* ══ History ══ */}
      {tab === "history" && (
        <div className={styles["history-table"]}>
          {history.length === 0 ? (
            <div className={styles.empty}>
              <CreditCard size={28} />
              <p>No billing history yet</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {history.map((ev: BillingEvent) => (
                  <tr key={ev.id}>
                    <td>{fmtDate(ev.createdAt)}</td>
                    <td>
                      <span
                        className={`${styles["event-badge"]} ${styles[`event-${ev.type}`]}`}
                      >
                        {ev.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td
                      className={
                        ev.type === "refund"
                          ? styles["amount-refund"]
                          : styles["amount-charge"]
                      }
                    >
                      {ev.type === "refund" ? "−" : "+"} PKR {fmt(ev.amount)}
                    </td>
                    <td className={styles["ref-id"]}>
                      {ev.gatewayPaymentId ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
