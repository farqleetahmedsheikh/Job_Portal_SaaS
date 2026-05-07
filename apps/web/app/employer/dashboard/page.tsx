/** @format */
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Circle,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { useUser } from "../../store/session.store";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import { useBilling } from "../../hooks/useBilling";
import { DashboardSkeleton } from "../../components/ui/DashboardSkeleton";
import { getPlanMeta } from "../../types/billing.types";
import type {
  ActiveJob,
  RecentApplication,
  UpcomingInterview,
} from "../../types/emp-dashboard.types";
import styles from "../styles/emp-dashboard.module.css";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatShortDate(value?: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric",
  });
}

function formatInterviewTime(value?: string | null) {
  if (!value) return "Time pending";
  return new Date(value).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPlanName(plan?: string) {
  if (!plan) return "Free";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function percent(value: number, total: number | "unlimited" | undefined) {
  if (!total || total === "unlimited" || total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function applicationStatusLabel(status?: string) {
  if (!status) return "New";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

function initials(name?: string | null) {
  if (!name) return "HF";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function EmployerDashboardPage() {
  const user = useUser();
  const { data, loading, error } = useEmployerDashboard();
  const {
    capabilities,
    subscription,
    loading: billingLoading,
  } = useBilling();

  const displayName = user?.company?.companyName ?? user?.fullName ?? "there";
  const isVerified =
    user?.company?.isVerified ||
    capabilities?.limits?.hasVerifiedBadge === true ||
    subscription?.verificationStatus === "verified";

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            <Zap size={18} />
          </div>
          <div>
            <h1 className={styles.errorTitle}>Dashboard could not load</h1>
            <p className={styles.errorMsg}>
              {error ?? "Failed to load dashboard. Please refresh."}
            </p>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasJobs = data.stats.activeJobs > 0 || data.jobs.length > 0;
  const hasApplications = data.stats.totalApplications > 0;
  const hasUpcomingInterviews =
    data.stats.upcomingInterviews > 0 || data.interviews.length > 0;
  const companyProfileComplete = Boolean(
    user?.company?.companyName &&
      user.company.industry &&
      user.company.location &&
      user.company.description,
  );

  const plan = capabilities?.plan ?? subscription?.plan ?? "free";
  const planMeta = getPlanMeta(plan);
  const interviewUsage = capabilities?.usage?.interviews;
  const interviewPercent = percent(
    interviewUsage?.currentUsage ?? 0,
    interviewUsage?.limit,
  );
  const jobLimit = Number(capabilities?.limits?.jobPostsPerMonth ?? 0);
  const jobsUsed =
    jobLimit > 0
      ? Math.max(0, jobLimit - (capabilities?.usage?.jobPostsRemaining ?? 0))
      : data.stats.activeJobs;
  const jobPercent = jobLimit > 0 ? percent(jobsUsed, jobLimit) : 0;

  const nextActions = buildNextActions({
    hasJobs,
    hasApplications,
    hasUpcomingInterviews,
    isVerified: Boolean(isVerified),
    interviewPercent,
  });
  const insights = buildInsights({
    hasJobs,
    hasApplications,
    hasUpcomingInterviews,
    isVerified: Boolean(isVerified),
    activeJobs: data.stats.activeJobs,
    newApplications: data.stats.newApplications,
    interviewPercent,
  });
  const checklist = buildEmployerChecklist({
    companyProfileComplete,
    hasJobs,
    hasApplications,
    hasUpcomingInterviews,
  });

  return (
    <div className={styles.page}>
      <section className={styles.commandHero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Hiring Command Center</span>
          <h1 className={styles.title}>
            {greeting()}, {displayName}
          </h1>
          <p className={styles.subtitle}>
            Here&apos;s what needs your attention today.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link
            href="/employer/company/verification"
            className={`${styles.btn} ${styles.btnGhost}`}
          >
            <ShieldCheck size={15} /> Verify company
          </Link>
          <Link
            href="/employer/jobs/new"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus size={15} /> Post a job
          </Link>
        </div>
      </section>

      <section className={styles.statsGrid}>
        <CommandStat
          icon={<Briefcase size={18} />}
          label="Active Jobs"
          value={data.stats.activeJobs}
          accent="blue"
          helper={
            data.stats.activeJobs === 0
              ? "Post your first job to start receiving candidates"
              : "Open roles currently visible to candidates"
          }
        />
        <CommandStat
          icon={<Users size={18} />}
          label="Total Applicants"
          value={data.stats.totalApplications}
          accent="amber"
          helper={
            data.stats.totalApplications === 0
              ? "Applicants will appear after your jobs go live"
              : "Candidates across your active hiring pipeline"
          }
        />
        <CommandStat
          icon={<CalendarCheck size={18} />}
          label="Upcoming Interviews"
          value={data.stats.upcomingInterviews}
          accent="green"
          helper={
            data.stats.upcomingInterviews === 0
              ? "Schedule interviews from shortlisted candidates"
              : "Interviews that need preparation and follow-up"
          }
        />
        <CommandStat
          icon={<UserCheck size={18} />}
          label="New Applications"
          value={data.stats.newApplications}
          accent="violet"
          helper="New applicants from the last 7 days"
        />
      </section>

      <GettingStartedChecklist checklist={checklist} />

      <section className={styles.commandGrid}>
        <div className={styles.mainColumn}>
          <RecentApplicationsPanel applications={data.applications} />
          <ActiveJobsPanel jobs={data.jobs} />
          <UpcomingInterviewsPanel interviews={data.interviews} />
        </div>

        <aside className={styles.sideColumn}>
          <NextBestActions actions={nextActions} />
          <PlanUsageCard
            billingLoading={billingLoading}
            planName={formatPlanName(plan)}
            planDescription={planMeta.label}
            interviewUsage={interviewUsage}
            interviewPercent={interviewPercent}
            jobsUsed={jobsUsed}
            jobLimit={jobLimit}
            jobPercent={jobPercent}
          />
          <HiringInsights insights={insights} />
          <QuickActionCards />
        </aside>
      </section>
    </div>
  );
}

function buildEmployerChecklist({
  companyProfileComplete,
  hasJobs,
  hasApplications,
  hasUpcomingInterviews,
}: {
  companyProfileComplete: boolean;
  hasJobs: boolean;
  hasApplications: boolean;
  hasUpcomingInterviews: boolean;
}) {
  return [
    {
      title: "Complete company profile",
      description: "Help candidates understand your team before they apply.",
      href: "/employer/company",
      done: companyProfileComplete,
    },
    {
      title: "Post first job",
      description: "Open a role and start building your hiring pipeline.",
      href: "/employer/jobs/new",
      done: hasJobs,
    },
    {
      title: "Review first applicant",
      description: "Move candidates forward with status updates.",
      href: "/employer/applicants",
      done: hasApplications,
    },
    {
      title: "Schedule first interview",
      description: "Keep interviews and candidate communication tracked.",
      href: "/employer/interviews",
      done: hasUpcomingInterviews,
    },
    {
      title: "Explore automation",
      description: "See how HiringFly can send updates and reminders for you.",
      href: "/employer/automation",
      done: false,
    },
  ];
}

function GettingStartedChecklist({
  checklist,
}: {
  checklist: ReturnType<typeof buildEmployerChecklist>;
}) {
  const completed = checklist.filter((item) => item.done).length;
  if (completed === checklist.length) return null;

  return (
    <section className={styles.checklistCard}>
      <div className={styles.checklistHeader}>
        <div>
          <span className={styles.kicker}>Getting started</span>
          <h2>Set up your hiring workspace</h2>
          <p>{completed} of {checklist.length} completed</p>
        </div>
        <div className={styles.checklistProgress}>
          <span style={{ width: `${(completed / checklist.length) * 100}%` }} />
        </div>
      </div>
      <div className={styles.checklistGrid}>
        {checklist.map((item) => (
          <Link key={item.title} href={item.href} className={styles.checklistItem}>
            <span
              className={
                item.done ? styles.checklistDone : styles.checklistTodo
              }
            >
              {item.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
            </span>
            <span className={styles.checklistBody}>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
            <ArrowRight size={13} className={styles.quickChevron} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function CommandStat({
  icon,
  label,
  value,
  helper,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  helper: string;
  accent: "blue" | "amber" | "green" | "violet";
}) {
  return (
    <article className={`${styles.statCard} ${styles[`stat-${accent}`]}`}>
      <div className={styles.statTop}>
        <span className={styles.statIcon}>{icon}</span>
        <span className={styles.statPulse}>Live</span>
      </div>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statDelta}>{helper}</p>
    </article>
  );
}

function RecentApplicationsPanel({
  applications,
}: {
  applications: RecentApplication[];
}) {
  return (
    <section className={styles.card}>
      <PanelHeader
        title="Recent Applications"
        href="/employer/applicants"
        action="Review all"
      />
      {applications.length === 0 ? (
        <PremiumEmptyState
          icon={<Search size={20} />}
          title="No applicants yet"
          description="Post a job and candidates will start appearing here."
          cta="Post a Job"
          href="/employer/jobs/new"
        />
      ) : (
        <div className={styles.applicationList}>
          {applications.map((application) => (
            <Link
              key={application.id}
              href={`/employer/applicants/${application.id}`}
              className={styles.applicationRow}
            >
              <span className={styles.avatar}>{initials(application.name)}</span>
              <span className={styles.rowMain}>
                <strong>{application.name}</strong>
                <span>{application.jobTitle}</span>
              </span>
              <span className={styles.rowMeta}>
                <span className={styles.statusPill}>
                  {applicationStatusLabel(application.status)}
                </span>
                <small>{formatShortDate(application.appliedAt)}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function ActiveJobsPanel({ jobs }: { jobs: ActiveJob[] }) {
  return (
    <section className={styles.card}>
      <PanelHeader
        title="Active Jobs"
        href="/employer/jobs"
        action="Manage jobs"
      />
      {jobs.length === 0 ? (
        <PremiumEmptyState
          icon={<Briefcase size={20} />}
          title="Your first job post starts here"
          description="Create a job listing to attract candidates and begin your hiring pipeline."
          cta="Post your first job"
          href="/employer/jobs/new"
        />
      ) : (
        <div className={styles.jobCommandList}>
          {jobs.slice(0, 5).map((job) => (
            <Link
              key={job.id}
              href={`/employer/jobs/${job.id}`}
              className={styles.jobCommandRow}
            >
              <span className={styles.jobIcon}>
                <FileText size={15} />
              </span>
              <span className={styles.rowMain}>
                <strong>{job.title}</strong>
                <span>
                  {job.applicants} applicants · {job.viewsCount} views
                </span>
              </span>
              <span className={styles.rowMeta}>
                <span className={styles.statusPill}>{job.status}</span>
                <small>{formatShortDate(job.createdAt)}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function UpcomingInterviewsPanel({
  interviews,
}: {
  interviews: UpcomingInterview[];
}) {
  return (
    <section className={styles.card}>
      <PanelHeader
        title="Upcoming Interviews"
        href="/employer/interviews"
        action="Open calendar"
      />
      {interviews.length === 0 ? (
        <PremiumEmptyState
          icon={<CalendarCheck size={20} />}
          title="No interviews scheduled"
          description="Shortlist candidates and schedule interviews in a few clicks."
          cta="View Applicants"
          href="/employer/applicants"
        />
      ) : (
        <div className={styles.interviewList}>
          {interviews.map((interview) => (
            <Link
              key={interview.id}
              href="/employer/interviews"
              className={styles.interviewRow}
            >
              <span className={styles.avatar}>
                {initials(interview.candidate)}
              </span>
              <span className={styles.rowMain}>
                <strong>{interview.candidate}</strong>
                <span>{interview.jobTitle}</span>
              </span>
              <span className={styles.rowMeta}>
                <span className={styles.statusPill}>{interview.type}</span>
                <small>{formatInterviewTime(interview.scheduledAt)}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function PanelHeader({
  title,
  href,
  action,
}: {
  title: string;
  href: string;
  action: string;
}) {
  return (
    <div className={styles.cardHeader}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <Link href={href} className={styles.cardLink}>
        {action} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function PremiumEmptyState({
  icon,
  title,
  description,
  cta,
  href,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={href} className={`${styles.btn} ${styles.btnPrimary}`}>
        {cta}
      </Link>
    </div>
  );
}

function buildNextActions({
  hasJobs,
  hasApplications,
  hasUpcomingInterviews,
  isVerified,
  interviewPercent,
}: {
  hasJobs: boolean;
  hasApplications: boolean;
  hasUpcomingInterviews: boolean;
  isVerified: boolean;
  interviewPercent: number;
}) {
  const actions = [];

  if (!hasJobs) {
    actions.push({
      icon: <Plus size={16} />,
      title: "Post your first job",
      description: "Start your hiring pipeline with a focused role listing.",
      cta: "Post job",
      href: "/employer/jobs/new",
    });
  }

  actions.push({
    icon: <Building2 size={16} />,
    title: "Complete company profile",
    description: "Help candidates understand your culture and hiring brand.",
    cta: "Edit profile",
    href: "/employer/company",
  });

  if (!isVerified) {
    actions.push({
      icon: <ShieldCheck size={16} />,
      title: "Verify your company",
      description: "Build trust before candidates decide where to apply.",
      cta: "Verify now",
      href: "/employer/company/verification",
    });
  }

  if (hasApplications) {
    actions.push({
      icon: <ClipboardList size={16} />,
      title: "Review new applicants",
      description: "Move promising candidates forward before momentum fades.",
      cta: "Review",
      href: "/employer/applicants",
    });
  }

  if (hasUpcomingInterviews) {
    actions.push({
      icon: <CalendarCheck size={16} />,
      title: "Prepare for upcoming interviews",
      description: "Check notes, links, and candidate context before calls.",
      cta: "Open schedule",
      href: "/employer/interviews",
    });
  }

  if (interviewPercent >= 80) {
    actions.push({
      icon: <TrendingUp size={16} />,
      title: "Upgrade before interviews pause",
      description: "Unlock more scheduling volume, reminders, and automation.",
      cta: "View plans",
      href: "/employer/billing",
    });
  }

  return actions.slice(0, 4);
}

function NextBestActions({
  actions,
}: {
  actions: ReturnType<typeof buildNextActions>;
}) {
  return (
    <section className={styles.sideCard}>
      <h2 className={styles.sideTitle}>Next Best Actions</h2>
      <div className={styles.actionStack}>
        {actions.map((action) => (
          <Link key={action.title} href={action.href} className={styles.actionCard}>
            <span className={styles.actionIcon}>{action.icon}</span>
            <span className={styles.actionBody}>
              <strong>{action.title}</strong>
              <span>{action.description}</span>
            </span>
            <span className={styles.actionCta}>
              {action.cta} <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PlanUsageCard({
  billingLoading,
  planName,
  planDescription,
  interviewUsage,
  interviewPercent,
  jobsUsed,
  jobLimit,
  jobPercent,
}: {
  billingLoading: boolean;
  planName: string;
  planDescription: string;
  interviewUsage:
    | {
        currentUsage: number;
        limit: number | "unlimited";
      }
    | undefined;
  interviewPercent: number;
  jobsUsed: number;
  jobLimit: number;
  jobPercent: number;
}) {
  const interviewLimit = interviewUsage?.limit ?? 5;
  const interviewsLabel =
    interviewLimit === "unlimited"
      ? "Unlimited interviews"
      : `${interviewUsage?.currentUsage ?? 0} / ${interviewLimit} interviews`;

  return (
    <section className={styles.sideCard}>
      <div className={styles.planHeader}>
        <span className={styles.planBadge}>{billingLoading ? "Loading" : planName}</span>
        <span className={styles.planStatus}>{planDescription}</span>
      </div>
      <h2 className={styles.sideTitle}>Plan & Usage</h2>
      <p className={styles.sideCopy}>
        You&apos;re on {planName}. Upgrade to unlock automation, templates,
        verified badge, and advanced analytics.
      </p>

      <div className={styles.usageBlock}>
        <div className={styles.usageRow}>
          <span>Interview scheduling</span>
          <strong>{interviewsLabel}</strong>
        </div>
        <div className={styles.usageTrack}>
          <span className={styles.usageFill} style={{ width: `${interviewPercent}%` }} />
        </div>
      </div>

      <div className={styles.usageBlock}>
        <div className={styles.usageRow}>
          <span>Job posts this month</span>
          <strong>{jobLimit > 0 ? `${jobsUsed} / ${jobLimit}` : "Included"}</strong>
        </div>
        <div className={styles.usageTrack}>
          <span className={styles.usageFill} style={{ width: `${jobPercent}%` }} />
        </div>
      </div>

      <Link href="/employer/billing" className={`${styles.btn} ${styles.btnGhost} ${styles.btnFull}`}>
        Compare plans
      </Link>
    </section>
  );
}

function buildInsights({
  hasJobs,
  hasApplications,
  hasUpcomingInterviews,
  isVerified,
  activeJobs,
  newApplications,
  interviewPercent,
}: {
  hasJobs: boolean;
  hasApplications: boolean;
  hasUpcomingInterviews: boolean;
  isVerified: boolean;
  activeJobs: number;
  newApplications: number;
  interviewPercent: number;
}) {
  const insights = [];

  if (!hasJobs) {
    insights.push("Jobs with clear salary ranges usually receive better candidate response.");
  }
  if (!isVerified) {
    insights.push("Verified companies build more trust with candidates.");
  }
  if (hasApplications && newApplications > 0) {
    insights.push(`${newApplications} new applicants are waiting for a timely response.`);
  }
  if (hasUpcomingInterviews) {
    insights.push("Prepare interview notes before calls to keep evaluations consistent.");
  }
  if (interviewPercent >= 80) {
    insights.push("You are close to your interview limit. Upgrade before scheduling stops.");
  }
  if (activeJobs > 0) {
    insights.push("Featured jobs can improve visibility when a priority role needs more reach.");
  }

  if (insights.length === 0) {
    insights.push("Responding quickly improves candidate engagement.");
    insights.push("A complete company profile helps candidates decide with confidence.");
  }

  return insights.slice(0, 4);
}

function HiringInsights({ insights }: { insights: string[] }) {
  return (
    <section className={styles.sideCard}>
      <h2 className={styles.sideTitle}>Hiring Insights</h2>
      <div className={styles.insightStack}>
        {insights.map((insight) => (
          <div key={insight} className={styles.insightItem}>
            <span className={styles.insightIcon}>
              <Sparkles size={14} />
            </span>
            <p>{insight}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickActionCards() {
  const actions = [
    {
      icon: <Plus size={15} />,
      label: "Post a new job",
      description: "Open a role and start collecting candidates.",
      href: "/employer/jobs/new",
    },
    {
      icon: <Users size={15} />,
      label: "Review applications",
      description: "Move applicants through your pipeline.",
      href: "/employer/applicants",
    },
    {
      icon: <CalendarCheck size={15} />,
      label: "Schedule interview",
      description: "Coordinate next steps with candidates.",
      href: "/employer/interviews",
    },
    {
      icon: <MessageSquare size={15} />,
      label: "View messages",
      description: "Continue candidate conversations.",
      href: "/employer/messages",
    },
    {
      icon: <BarChart3 size={15} />,
      label: "View analytics",
      description: "See funnel health and hiring performance.",
      href: "/employer/analytics",
    },
    {
      icon: <Eye size={15} />,
      label: "Company profile",
      description: "Tune candidate-facing company details.",
      href: "/employer/company",
    },
  ];

  return (
    <section className={styles.sideCard}>
      <h2 className={styles.sideTitle}>Quick Actions</h2>
      <div className={styles.quickActionGrid}>
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className={styles.quickActionCard}>
            <span className={styles.quickIcon}>{action.icon}</span>
            <span>
              <strong>{action.label}</strong>
              <small>{action.description}</small>
            </span>
            <ArrowRight size={13} className={styles.quickChevron} />
          </Link>
        ))}
      </div>
    </section>
  );
}
