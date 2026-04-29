/** @format */
"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  Mail,
  Package,
  Plus,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useBilling } from "../../hooks/useBilling";
import {
  PLANS,
  getPlanMeta,
  isUpgrade,
  type BillingInterval,
  type PlanMeta,
  type SubscriptionPlan,
} from "../../types/billing.types";
import type { BillingEvent } from "../../types/billing.types";
import styles from "../styles/billing.module.css";

const BEST_FOR: Record<SubscriptionPlan, string> = {
  free: "Best for trying HiringFly",
  starter: "Best for small teams hiring occasionally",
  growth: "Best for growing teams hiring every month",
  scale: "Best for high-volume hiring teams",
};

const VALUE_CARDS = [
  {
    icon: <CalendarCheck size={18} />,
    title: "Hire faster with reminders",
    copy: "Reduce manual follow-ups and keep interviews moving.",
  },
  {
    icon: <Shield size={18} />,
    title: "Build trust with verification",
    copy: "A verified company badge helps candidates apply with confidence.",
  },
  {
    icon: <Mail size={18} />,
    title: "Save time with templates",
    copy: "Standardize candidate emails, offers, and contracts as you scale.",
  },
  {
    icon: <BarChart3 size={18} />,
    title: "Unlock hiring analytics",
    copy: "See pipeline health, job performance, and hiring bottlenecks.",
  },
];

const PREMIUM_UNLOCKS = [
  ["Talent Database", "Growth", "Discover candidates beyond inbound applicants."],
  ["Custom email templates", "Growth", "Send polished candidate updates faster."],
  ["Contract templates", "Starter", "Create offers and contracts with less repetition."],
  ["Verified badge", "Growth", "Build candidate trust on jobs and company pages."],
  ["Advanced analytics", "Growth", "Understand pipeline health and conversion."],
  ["Automation", "Growth", "Automate repetitive hiring tasks."],
] as const;

function fmt(n: number) {
  return new Intl.NumberFormat("en-PK").format(n);
}

function fmtDate(iso?: string) {
  if (!iso) return "Not scheduled";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function priceFor(plan: PlanMeta, interval: BillingInterval) {
  if (plan.price === 0) return 0;
  return interval === "yearly" ? plan.price * 10 : plan.price;
}

function formatLimit(value: number | "Unlimited") {
  return value === "Unlimited" ? "Unlimited" : fmt(value);
}

function percent(used: number, total?: number | "unlimited" | "Unlimited") {
  if (!total || total === "unlimited" || total === "Unlimited" || total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

function usageMessage(args: {
  currentPlan: SubscriptionPlan;
  interviewPct: number;
  jobsPct: number;
  talentLocked: boolean;
}) {
  if (args.interviewPct >= 80) {
    return `You're close to your ${getPlanMeta(args.currentPlan).label} plan interview limit.`;
  }
  if (args.jobsPct >= 100) return "Upgrade to keep posting jobs this month.";
  if (args.talentLocked) return "Unlock candidate discovery with Growth.";
  return "Your current plan is active. Upgrade when your hiring volume grows.";
}

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

  const [tab, setTab] = useState<"plans" | "addons" | "verification" | "history">("plans");
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const currentPlan = subscription?.plan ?? "free";
  const planMeta = getPlanMeta(currentPlan);
  const trialAvailable = !subscription?.trialUsedAt;
  const isVerified = subscription?.verificationStatus === "verified";
  const verPending = subscription?.verificationStatus === "pending";
  const jobLimit = Number(capabilities?.limits.jobPostsPerMonth ?? planMeta.jobPostsPerMonth);
  const jobsRemaining = capabilities?.usage.jobPostsRemaining ?? subscription?.jobPostsRemaining ?? 0;
  const jobsUsed = Math.max(0, jobLimit - jobsRemaining);
  const jobsPct = percent(jobsUsed, jobLimit);
  const interviewUsage = capabilities?.usage.interviews;
  const interviewLimit = interviewUsage?.limit ?? planMeta.maxInterviewsPerMonth;
  const interviewPct = percent(interviewUsage?.currentUsage ?? 0, interviewLimit);
  const talentLocked = capabilities?.limits.hasTalentDb !== true;

  const pressure = usageMessage({
    currentPlan,
    interviewPct,
    jobsPct,
    talentLocked,
  });

  const applicantViews = planMeta.maxApplicantsViewable;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonHero} />
        <div className={styles.skeletonGrid} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.kicker}>Employer billing</span>
          <h1>Billing & Plans</h1>
          <p>Choose the plan that matches your hiring volume.</p>
        </div>
        <div className={styles.intervalToggle} aria-label="Billing interval">
          <button
            className={interval === "monthly" ? styles.activeInterval : ""}
            onClick={() => setInterval("monthly")}
            type="button"
          >
            Monthly
          </button>
          <button
            className={interval === "yearly" ? styles.activeInterval : ""}
            onClick={() => setInterval("yearly")}
            type="button"
          >
            Yearly <span>Save 17%</span>
          </button>
        </div>
      </section>

      {(checkoutError || error) && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} /> {checkoutError ?? error}
        </div>
      )}

      <section className={styles.usageCard}>
        <div className={styles.usageIntro}>
          <span className={styles.planBadge}>{planMeta.label} plan</span>
          <h2>{pressure}</h2>
          <p>
            Current usage helps you choose when to upgrade. Yearly plans include
            2 months free.
          </p>
          {subscription?.currentPeriodEnd && (
            <span className={styles.renewal}>
              <Clock size={13} />
              {currentPlan === "free"
                ? "Usage resets monthly"
                : `Renews ${fmtDate(subscription.currentPeriodEnd)}`}
            </span>
          )}
        </div>
        <div className={styles.usageMetrics}>
          <UsageMeter
            icon={<Package size={15} />}
            label="Job posts used"
            value={`${jobsUsed} / ${jobLimit}`}
            pct={jobsPct}
            warn={jobsPct >= 80}
          />
          <UsageMeter
            icon={<CalendarCheck size={15} />}
            label="Interviews used"
            value={
              interviewLimit === "Unlimited" || interviewLimit === "unlimited"
                ? `${interviewUsage?.currentUsage ?? 0} / Unlimited`
                : `${interviewUsage?.currentUsage ?? 0} / ${interviewLimit}`
            }
            pct={interviewPct}
            warn={interviewPct >= 80}
          />
          <UsageMeter
            icon={<Users size={15} />}
            label="Applicant views"
            value={
              applicantViews === "Unlimited"
                ? "Unlimited"
                : `Up to ${fmt(applicantViews)}`
            }
            pct={applicantViews === "Unlimited" ? 100 : 40}
          />
        </div>
      </section>

      <section className={styles.valueGrid}>
        {VALUE_CARDS.map((card) => (
          <article key={card.title} className={styles.valueCard}>
            <span>{card.icon}</span>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
          </article>
        ))}
      </section>

      <div className={styles.tabs}>
        <TabButton active={tab === "plans"} onClick={() => setTab("plans")} icon={<Zap size={14} />}>
          Plans
        </TabButton>
        <TabButton active={tab === "addons"} onClick={() => setTab("addons")} icon={<Package size={14} />}>
          Add-ons
        </TabButton>
        <TabButton active={tab === "verification"} onClick={() => setTab("verification")} icon={<Shield size={14} />}>
          Verification
        </TabButton>
        <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={<CreditCard size={14} />}>
          History
        </TabButton>
      </div>

      {tab === "plans" && (
        <>
          <section className={styles.plansGrid}>
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                currentPlan={currentPlan}
                interval={interval}
                onSelect={checkout}
                onTrial={startTrial}
                loading={checkoutLoading}
                trialAvailable={trialAvailable}
              />
            ))}
          </section>
          <PremiumUnlocks />
        </>
      )}

      {tab === "addons" && (
        <section className={styles.sectionCard}>
          <SectionTitle
            title="Add-ons"
            copy="One-time upgrades for hiring spikes without changing your base plan."
          />
          <div className={styles.addonList}>
            <AddonCard
              icon={<Plus size={17} />}
              title="Add another active job"
              desc="Post one additional job outside your monthly quota."
              price={999}
              onBuy={() => purchaseAddon("extra_post")}
              loading={checkoutLoading}
            />
            <AddonCard
              icon={<Star size={17} />}
              title="Boost job visibility"
              desc="Feature a priority job for 7 days to help it stand out."
              price={1999}
              onBuy={() => purchaseAddon("feature_job")}
              loading={checkoutLoading}
            />
            <AddonCard
              icon={<Zap size={17} />}
              title="Expand applicant capacity"
              desc="Add 25 more applicant slots to a role that needs more reach."
              price={1499}
              onBuy={() => purchaseAddon("boost_cap")}
              loading={checkoutLoading}
            />
          </div>
        </section>
      )}

      {tab === "verification" && (
        <section className={styles.sectionCard}>
          <SectionTitle
            title="Company Verification"
            copy="Verified companies build more trust with candidates and make job posts feel safer to apply to."
          />
          <div className={styles.verifyGrid}>
            <div className={styles.verifyPanel}>
              <Shield size={22} />
              <h3>
                {isVerified
                  ? "Your company is verified"
                  : verPending
                    ? "Verification is under review"
                    : "Get a verified company badge"}
              </h3>
              <p>
                Show candidates that your company profile and hiring identity
                have been reviewed.
              </p>
              <button
                className={styles.primaryButton}
                onClick={() => checkout("growth")}
                disabled={checkoutLoading || isVerified || verPending}
              >
                {isVerified ? "Verified" : verPending ? "Under review" : "Get verified"}
              </button>
            </div>
            <div className={styles.verifyBenefits}>
              {[
                "Verified badge on job posts and company profile",
                "Clearer trust signal for candidates",
                "Better employer credibility while hiring",
                "Included with Growth and Scale plans",
              ].map((item) => (
                <span key={item}>
                  <CheckCircle2 size={14} /> {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className={styles.sectionCard}>
          <SectionTitle
            title="Billing History"
            copy="Track subscription charges, add-ons, refunds, and payment references."
          />
          {history.length === 0 ? (
            <EmptyState
              icon={<CreditCard size={26} />}
              title="No billing history yet"
              copy="Charges and add-on purchases will appear here after checkout."
            />
          ) : (
            <div className={styles.tableWrap}>
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
                  {history.map((event: BillingEvent) => (
                    <tr key={event.id}>
                      <td>{fmtDate(event.createdAt)}</td>
                      <td>{event.type.replace(/_/g, " ")}</td>
                      <td>
                        {event.type === "refund" ? "-" : "+"} PKR {fmt(event.amount)}
                      </td>
                      <td>{event.gatewayPaymentId ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function UsageMeter({
  icon,
  label,
  value,
  pct,
  warn,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  pct: number;
  warn?: boolean;
}) {
  return (
    <div className={styles.usageMeter}>
      <div>
        <span>{icon}</span>
        <strong>{label}</strong>
        <em>{value}</em>
      </div>
      <div className={styles.meterTrack}>
        <span className={warn ? styles.warningFill : ""} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  currentPlan,
  interval,
  onSelect,
  onTrial,
  loading,
  trialAvailable,
}: {
  plan: PlanMeta;
  currentPlan: SubscriptionPlan;
  interval: BillingInterval;
  onSelect: (p: SubscriptionPlan, interval?: BillingInterval) => void;
  onTrial: (p: SubscriptionPlan) => void;
  loading: boolean;
  trialAvailable: boolean;
}) {
  const isCurrent = plan.key === currentPlan;
  const upgrade = isUpgrade(currentPlan, plan.key);
  const price = priceFor(plan, interval);
  const monthlyEquivalent = interval === "yearly" && plan.price > 0 ? Math.round(price / 12) : null;
  const features = planFeatures(plan);

  const cta =
    isCurrent
      ? "Current plan"
      : plan.key === "growth" && trialAvailable
        ? "Start Growth trial"
        : upgrade
          ? `Upgrade to ${plan.label}`
          : `Switch to ${plan.label}`;

  return (
    <article
      className={`${styles.planCard} ${plan.key === "growth" ? styles.growthPlan : ""} ${isCurrent ? styles.currentPlan : ""}`}
    >
      <div className={styles.planTop}>
        <div>
          <span className={styles.planName}>{plan.label}</span>
          <p>{BEST_FOR[plan.key]}</p>
        </div>
        {plan.key === "growth" && (
          <span className={styles.popularBadge}>Most Popular</span>
        )}
      </div>

      <div className={styles.priceBlock}>
        {price === 0 ? (
          <strong>Free</strong>
        ) : (
          <>
            <small>PKR</small>
            <strong>{fmt(price)}</strong>
            <span>/{interval === "yearly" ? "yr" : "mo"}</span>
          </>
        )}
      </div>
      {monthlyEquivalent && (
        <p className={styles.savingsLine}>
          PKR {fmt(monthlyEquivalent)}/mo equivalent · 2 months free
        </p>
      )}
      {plan.key === "growth" && <p className={styles.recommendedLine}>Recommended for teams hiring every month.</p>}

      <ul className={styles.featureList}>
        {features.map((feature) => (
          <li key={feature}>
            <CheckCircle2 size={13} /> {feature}
          </li>
        ))}
      </ul>

      <div className={styles.planActions}>
        <button
          className={`${styles.planButton} ${plan.key === "growth" ? styles.growthButton : ""}`}
          disabled={isCurrent || loading}
          onClick={() => {
            if (isCurrent) return;
            if (plan.key === "growth" && trialAvailable) {
              onTrial(plan.key);
            } else {
              onSelect(plan.key, interval);
            }
          }}
        >
          {cta}
        </button>
        {plan.key !== "free" && !isCurrent && (
          <span className={styles.ctaMicrocopy}>
            7-day free trial · Cancel anytime · Yearly saves 2 months
          </span>
        )}
      </div>
    </article>
  );
}

function planFeatures(plan: PlanMeta) {
  const features = [
    `Post up to ${fmt(plan.jobPostsPerMonth)} jobs each month`,
    `${formatLimit(plan.applicantsPerJob)} applicants per job`,
    `${formatLimit(plan.maxApplicantsViewable)} applicant views`,
    `${formatLimit(plan.maxInterviewsPerMonth)} interviews each month`,
  ];
  if (plan.hasInterviewReminders) features.push("Automate interview reminders");
  if (plan.hasCustomEmailTemplates) features.push("Customize candidate emails");
  if (plan.hasContractTemplates) features.push("Create offers and contracts faster");
  if (plan.aiMatcher !== "None") features.push("AI-assisted candidate matching");
  if (plan.hasTalentDb) features.push("Unlock candidate discovery");
  if (plan.hasVerifiedBadge) features.push("Verified company badge");
  if (plan.hasAutomation) features.push("Automate repetitive hiring tasks");
  if (plan.hasMarketIntel) features.push("Market intelligence");
  features.push(`${plan.support} support`);
  return features;
}

function PremiumUnlocks() {
  return (
    <section className={styles.unlockSection}>
      <SectionTitle
        title="Unlock more hiring power"
        copy="Premium plans are designed around hiring volume, automation, trust, and stronger decision-making."
      />
      <div className={styles.unlockGrid}>
        {PREMIUM_UNLOCKS.map(([title, plan, copy]) => (
          <article key={title} className={styles.unlockCard}>
            <Lock size={16} />
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
            <span>{plan}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AddonCard({
  icon,
  title,
  desc,
  price,
  onBuy,
  loading,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  price: number;
  onBuy: () => void;
  loading: boolean;
}) {
  return (
    <article className={styles.addonCard}>
      <span className={styles.addonIcon}>{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
      <div className={styles.addonAction}>
        <strong>PKR {fmt(price)}</strong>
        <button onClick={onBuy} disabled={loading} className={styles.secondaryButton}>
          {loading ? "Processing..." : "Buy add-on"}
        </button>
      </div>
    </article>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.tab} ${active ? styles.activeTab : ""}`}
      onClick={onClick}
    >
      {icon} {children}
    </button>
  );
}

function SectionTitle({ title, copy }: { title: string; copy: string }) {
  return (
    <div className={styles.sectionTitle}>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  copy,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className={styles.emptyState}>
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}
