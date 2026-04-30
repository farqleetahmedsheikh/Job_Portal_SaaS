/** @format */
"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  UserRound,
  Zap,
} from "lucide-react";
import { useUser } from "../../store/session.store";
import { useProfileStrength } from "../../hooks/useProfileStrength";
import { useApplicantDashboard } from "../../hooks/useApplicantDashboard";
import { useResumes } from "../../hooks/useResumes";
import { api } from "../../lib";
import { API_BASE } from "../../constants";
import type {
  DashboardApplication,
  DashboardInterview,
} from "../../types/dashboard.types";
import styles from "../styles/applicant.module.css";

interface RecommendedJob {
  id: string;
  title: string;
  company: {
    companyName: string;
    logoUrl: string | null;
    isVerified?: boolean;
  };
  location: string;
  locationType: string;
  type: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  publishedAt: string;
  isFeatured?: boolean;
  skills?: string[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function initials(name?: string | null) {
  if (!name) return "HF";
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatPosted(iso?: string | null) {
  if (!iso) return "Recently posted";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.max(0, Math.floor(diff / 86_400_000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  return new Date(iso).toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric",
  });
}

function formatSalary(job: RecommendedJob) {
  if (job.salaryMin && job.salaryMax) {
    return `${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k-${(job.salaryMax / 1000).toFixed(0)}k`;
  }
  if (job.salaryMin) {
    return `From ${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k`;
  }
  return null;
}

function responseRateCopy(totalApplications: number, responseRate?: number) {
  if (!totalApplications || !responseRate) {
    return "Response rate appears after employer responses.";
  }
  return "Based on real employer responses.";
}

function DashboardSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Loading dashboard">
      <div className={styles.welcome}>
        <div className={styles["welcome-text"]}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonSubtitle} />
        </div>
      </div>
      <div className={styles.stats}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={styles.skeletonCard} />
        ))}
      </div>
      <div className={styles.commandLayout}>
        <div className={styles.skeletonPanel} />
        <div className={styles.skeletonPanel} />
      </div>
    </div>
  );
}

function useRecommendedJobs() {
  const user = useUser();
  const profileSkills = useMemo(
    () => user?.applicantProfile?.skills ?? [],
    [user],
  );
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          sort: "newest",
          page: "1",
          limit: "5",
        });
        const [jobsRes, savedRes] = await Promise.all([
          api<{ items: RecommendedJob[] }>(
            `${API_BASE}/jobs?${params.toString()}`,
            "GET",
          ),
          api<{ id: string }[]>(`${API_BASE}/jobs/saved`, "GET").catch(
            () => [],
          ),
        ]);

        if (cancelled) return;
        setJobs(jobsRes.items ?? []);
        setSavedIds(new Set(savedRes.map((job) => job.id)));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load jobs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleSave(jobId: string) {
    const isSaved = savedIds.has(jobId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });

    try {
      await api(`${API_BASE}/jobs/${jobId}/save`, isSaved ? "DELETE" : "POST");
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) {
          next.add(jobId);
        } else {
          next.delete(jobId);
        }
        return next;
      });
    }
  }

  function reasonFor(job: RecommendedJob) {
    const jobSkills = job.skills ?? [];
    const profileSet = new Set(profileSkills.map((skill) => skill.toLowerCase()));
    const matched = jobSkills.filter((skill) =>
      profileSet.has(skill.toLowerCase()),
    );
    if (matched.length > 0) return "Matches your profile";
    if (job.company.isVerified) return "Verified company";
    if (job.isFeatured) return "Featured opportunity";
    return "Recently posted";
  }

  return {
    jobs,
    savedIds,
    loading,
    error,
    savedCount: savedIds.size,
    profileSkills,
    toggleSave,
    reasonFor,
  };
}

export default function ApplicantDashboard() {
  const user = useUser();
  const { data: strengthData } = useProfileStrength();
  const { resumes } = useResumes();
  const { stats, applications, interviews, loading, error, responseRateLabel } =
    useApplicantDashboard();
  const recommended = useRecommendedJobs();

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const strength = strengthData?.strength ?? 0;
  const visibleApplications = applications.filter(
    (application) => application.status !== "withdrawn",
  );
  const hasResume = resumes.length > 0;

  const nextSteps = buildNextSteps({
    strength,
    hasResume,
    applicationsCount: stats?.totalApplications ?? 0,
    savedJobsCount: recommended.savedCount,
    interviewsCount: interviews.length,
  });
  const tips = buildTips({
    strength,
    applicationsCount: stats?.totalApplications ?? 0,
    interviewsCount: interviews.length,
  });
  const checklist = buildApplicantChecklist({
    strength,
    hasResume,
    savedJobsCount: recommended.savedCount,
    applicationsCount: stats?.totalApplications ?? 0,
    interviewsCount: interviews.length,
  });

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.commandError}>
          <span className={styles.commandErrorIcon}>
            <Zap size={18} />
          </span>
          <div>
            <h1>Dashboard could not load</h1>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className={styles.commandPrimaryBtn}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.commandHero}>
        <div className={styles["welcome-text"]}>
          <span className={styles.commandKicker}>Job Search Command Center</span>
          <h1>
            {getGreeting()}, {firstName}
          </h1>
          <p>Here&apos;s your job search momentum today.</p>
          <p className={styles.commandHeroSub}>
            Complete your profile and apply to matched roles faster.
          </p>
        </div>
        <div className={styles.commandHeroActions}>
          <Link href="/applicant/profile" className={styles.commandSecondaryBtn}>
            <UserRound size={15} /> Complete Profile
          </Link>
          <Link href="/applicant/browse-jobs" className={styles.commandPrimaryBtn}>
            <Search size={15} /> Browse Jobs
          </Link>
        </div>
      </section>

      <section className={styles.stats}>
        <CommandStat
          icon={<Briefcase size={18} />}
          label="Applications"
          value={String(stats?.totalApplications ?? 0)}
          helper={
            (stats?.totalApplications ?? 0) === 0
              ? "Apply to jobs to start tracking your progress."
              : "Track your hiring pipeline."
          }
        />
        <CommandStat
          icon={<TrendingUp size={18} />}
          label="Response Rate"
          value={
            (stats?.totalApplications ?? 0) > 0
              ? `${stats?.responseRate ?? 0}%`
              : "Pending"
          }
          helper={
            (stats?.totalApplications ?? 0) > 0
              ? responseRateLabel
              : responseRateCopy(stats?.totalApplications ?? 0, stats?.responseRate)
          }
        />
        <CommandStat
          icon={<UserRound size={18} />}
          label="Profile Strength"
          value={`${strength}%`}
          helper="Complete your profile to improve job matching."
        />
        <CommandStat
          icon={<CalendarCheck size={18} />}
          label="Upcoming Interviews"
          value={String(interviews.length)}
          helper={
            interviews.length === 0
              ? "Interviews appear when employers shortlist you."
              : "Prepare for confirmed conversations."
          }
        />
      </section>

      <GettingStartedChecklist checklist={checklist} />

      <section className={styles.commandLayout}>
        <main className={styles.commandMain}>
          <RecommendedJobsSection recommended={recommended} />
          <ApplicationsSection applications={visibleApplications} />
          <InterviewsSection interviews={interviews} />
        </main>

        <aside className={styles.commandSide}>
          <ProfileCommandCard strength={strength} checklist={strengthData?.checklist ?? []} />
          <NextStepsCard steps={nextSteps} />
          <TipsCard tips={tips} />
        </aside>
      </section>
    </div>
  );
}

function buildApplicantChecklist({
  strength,
  hasResume,
  savedJobsCount,
  applicationsCount,
  interviewsCount,
}: {
  strength: number;
  hasResume: boolean;
  savedJobsCount: number;
  applicationsCount: number;
  interviewsCount: number;
}) {
  return [
    {
      title: "Complete profile",
      description: "Help employers evaluate your background faster.",
      href: "/applicant/profile",
      done: strength >= 80,
    },
    {
      title: "Upload resume",
      description: "Keep your latest resume ready for applications.",
      href: "/applicant/resumes",
      done: hasResume,
    },
    {
      title: "Browse or save jobs",
      description: "Build a shortlist of roles worth applying to.",
      href: "/applicant/browse-jobs",
      done: savedJobsCount > 0 || applicationsCount > 0,
    },
    {
      title: "Apply to first job",
      description: "Start tracking your hiring pipeline in HiringFly.",
      href: "/applicant/browse-jobs",
      done: applicationsCount > 0,
    },
    {
      title: "Track application status",
      description: "Return here to follow applications and interviews.",
      href: "/applicant/applications",
      done: applicationsCount > 0 || interviewsCount > 0,
    },
  ];
}

function GettingStartedChecklist({
  checklist,
}: {
  checklist: ReturnType<typeof buildApplicantChecklist>;
}) {
  const completed = checklist.filter((item) => item.done).length;
  if (completed === checklist.length) return null;

  return (
    <section className={styles.gettingStartedCard}>
      <div className={styles.gettingStartedHeader}>
        <div>
          <span className={styles.commandKicker}>Getting started</span>
          <h2>Build your job-search momentum</h2>
          <p>{completed} of {checklist.length} completed</p>
        </div>
        <div className={styles.gettingStartedProgress}>
          <span style={{ width: `${(completed / checklist.length) * 100}%` }} />
        </div>
      </div>
      <div className={styles.gettingStartedGrid}>
        {checklist.map((item) => (
          <Link key={item.title} href={item.href} className={styles.gettingStartedItem}>
            <span
              className={
                item.done
                  ? styles.gettingStartedDone
                  : styles.gettingStartedTodo
              }
            >
              {item.done ? <CheckCircle2 size={15} /> : <Clock size={15} />}
            </span>
            <span className={styles.gettingStartedBody}>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
            <ArrowRight size={13} />
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
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className={styles.commandStat}>
      <span className={styles.commandStatIcon}>{icon}</span>
      <p className={styles.commandStatValue}>{value}</p>
      <h2>{label}</h2>
      <span>{helper}</span>
    </article>
  );
}

function RecommendedJobsSection({
  recommended,
}: {
  recommended: ReturnType<typeof useRecommendedJobs>;
}) {
  return (
    <section className={styles.commandPanel}>
      <PanelHeader
        title="Recommended for you"
        href="/applicant/browse-jobs"
        action="Browse all"
      />

      {recommended.loading ? (
        <div className={styles.recommendedGrid}>
          {[1, 2, 3].map((item) => (
            <div key={item} className={styles.recommendedSkeleton} />
          ))}
        </div>
      ) : recommended.error ? (
        <div className={styles.inlineError}>{recommended.error}</div>
      ) : recommended.jobs.length === 0 ? (
        <PremiumEmptyState
          icon={<Sparkles size={20} />}
          title="Fresh opportunities will appear here"
          description="Once employers publish jobs, recent active roles will show up in this space."
          cta="Browse Jobs"
          href="/applicant/browse-jobs"
        />
      ) : (
        <div className={styles.recommendedGrid}>
          {recommended.jobs.slice(0, 4).map((job) => (
            <RecommendedJobCard
              key={job.id}
              job={job}
              isSaved={recommended.savedIds.has(job.id)}
              reason={recommended.reasonFor(job)}
              onSave={() => void recommended.toggleSave(job.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendedJobCard({
  job,
  isSaved,
  reason,
  onSave,
}: {
  job: RecommendedJob;
  isSaved: boolean;
  reason: string;
  onSave: () => void;
}) {
  const salary = formatSalary(job);

  return (
    <article className={styles.recommendedJob}>
      <div className={styles.recommendedTop}>
        <div className={styles.companyAvatar}>
          {job.company.logoUrl ? (
            <Image
              src={job.company.logoUrl}
              alt={job.company.companyName}
              width={40}
              height={40}
            />
          ) : (
            initials(job.company.companyName)
          )}
        </div>
        <div className={styles.recommendedBadges}>
          {job.company.isVerified && (
            <span className={styles.verifiedBadge}>
              <ShieldCheck size={11} /> Verified
            </span>
          )}
          {job.isFeatured && <span className={styles.featuredBadge}>Featured</span>}
        </div>
      </div>

      <div>
        <h3>{job.title}</h3>
        <p>{job.company.companyName}</p>
      </div>

      <div className={styles.jobMetaRow}>
        {job.location && (
          <span>
            <MapPin size={12} /> {job.location}
          </span>
        )}
        <span>
          <Briefcase size={12} /> {job.type}
        </span>
        {salary && <span>{salary}</span>}
      </div>

      <p className={styles.matchReason}>
        <Sparkles size={12} /> {reason}
      </p>

      <div className={styles.recommendedFooter}>
        <span>{formatPosted(job.publishedAt)}</span>
        <div className={styles.recommendedActions}>
          <button
            type="button"
            className={styles.saveButton}
            aria-label={isSaved ? "Unsave job" : "Save job"}
            onClick={onSave}
          >
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>
          <Link href={`/applicant/jobs/${job.id}`} className={styles.commandPrimaryBtn}>
            View Job
          </Link>
        </div>
      </div>
    </article>
  );
}

function ApplicationsSection({
  applications,
}: {
  applications: DashboardApplication[];
}) {
  return (
    <section className={styles.commandPanel}>
      <PanelHeader
        title="Recent Applications"
        href="/applicant/applications"
        action="View all"
      />
      {applications.length === 0 ? (
        <PremiumEmptyState
          icon={<FileText size={20} />}
          title="Start your application journey"
          description="You haven't applied to any jobs yet. Browse roles that match your skills and start building your hiring pipeline."
          cta="Browse Jobs"
          href="/applicant/browse-jobs"
        />
      ) : (
        <div className={styles.commandList}>
          {applications.map((application) => (
            <Link
              href="/applicant/applications"
              key={application.id}
              className={styles.commandRow}
            >
              <span className={styles.companyAvatar}>
                {application.logoUrl ? (
                  <Image
                    src={application.logoUrl}
                    alt={application.company}
                    width={36}
                    height={36}
                  />
                ) : (
                  application.logo
                )}
              </span>
              <span className={styles.commandRowMain}>
                <strong>{application.title}</strong>
                <small>{application.company}</small>
              </span>
              <span className={styles.commandRowMeta}>
                <span className={styles.statusBadge}>{application.status}</span>
                <small>{application.time}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function InterviewsSection({
  interviews,
}: {
  interviews: DashboardInterview[];
}) {
  return (
    <section className={styles.commandPanel}>
      <PanelHeader
        title="Upcoming Interviews"
        href="/applicant/interviews"
        action="View schedule"
      />
      {interviews.length === 0 ? (
        <PremiumEmptyState
          icon={<CalendarCheck size={20} />}
          title="No interviews scheduled yet"
          description="When employers shortlist you, interviews will appear here with date, time, and meeting details."
          cta="View Applications"
          href="/applicant/applications"
        />
      ) : (
        <div className={styles.commandList}>
          {interviews.map((interview) => (
            <Link
              href="/applicant/interviews"
              key={interview.id}
              className={styles.commandRow}
            >
              <span className={styles.commandDot}>
                <CalendarCheck size={16} />
              </span>
              <span className={styles.commandRowMain}>
                <strong>{interview.title}</strong>
                <small>{interview.sub}</small>
              </span>
              <span className={styles.commandRowMeta}>
                <small>{interview.time}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function ProfileCommandCard({
  strength,
  checklist,
}: {
  strength: number;
  checklist: { label: string; done: boolean }[];
}) {
  const remaining = checklist.filter((item) => !item.done).length;

  return (
    <section className={styles.commandPanel}>
      <div className={styles.profileCommandTop}>
        <div>
          <h2>Profile Strength</h2>
          <p>You&apos;re {strength}% complete</p>
        </div>
        <div className={styles.strengthMeter}>
          <span style={{ width: `${strength}%` }} />
        </div>
      </div>
      <p className={styles.profileCommandCopy}>
        {remaining === 0
          ? "Your profile is complete and ready for applications."
          : "Finish the remaining steps to improve your visibility."}
      </p>
      <div className={styles.profileChecklist}>
        {checklist.slice(0, 5).map((item) => (
          <div key={item.label} className={styles.profileCheckItem}>
            <span
              className={
                item.done ? styles.profileCheckDone : styles.profileCheckTodo
              }
            >
              {item.done ? <CheckCircle2 size={13} /> : <Clock size={13} />}
            </span>
            <p>{item.label}</p>
          </div>
        ))}
      </div>
      <Link href="/applicant/profile" className={styles.commandSecondaryBtn}>
        Complete Profile <ArrowRight size={13} />
      </Link>
    </section>
  );
}

function buildNextSteps({
  strength,
  hasResume,
  applicationsCount,
  savedJobsCount,
  interviewsCount,
}: {
  strength: number;
  hasResume: boolean;
  applicationsCount: number;
  savedJobsCount: number;
  interviewsCount: number;
}) {
  const steps = [];

  if (strength < 80) {
    steps.push({
      icon: <UserRound size={16} />,
      title: "Complete your profile",
      description: "A complete profile helps employers evaluate you faster.",
      href: "/applicant/profile",
      cta: "Update profile",
      complete: false,
    });
  }

  if (!hasResume) {
    steps.push({
      icon: <Upload size={16} />,
      title: "Upload your resume",
      description: "Keep your latest resume ready before applying.",
      href: "/applicant/resumes",
      cta: "Upload resume",
      complete: false,
    });
  }

  if (applicationsCount === 0) {
    steps.push({
      icon: <Search size={16} />,
      title: "Apply to your first job",
      description: "Start with recently posted roles that match your goals.",
      href: "/applicant/browse-jobs",
      cta: "Browse jobs",
      complete: false,
    });
  }

  if (savedJobsCount > 0) {
    steps.push({
      icon: <BookmarkCheck size={16} />,
      title: "Apply to saved jobs",
      description: "Turn saved opportunities into active applications.",
      href: "/applicant/saved-jobs",
      cta: "Open saved",
      complete: false,
    });
  }

  if (interviewsCount > 0) {
    steps.push({
      icon: <CalendarCheck size={16} />,
      title: "Prepare for upcoming interview",
      description: "Review role details and confirm your meeting information.",
      href: "/applicant/interviews",
      cta: "Prepare",
      complete: false,
    });
  }

  if (steps.length === 0) {
    steps.push({
      icon: <CheckCircle2 size={16} />,
      title: "Keep your search active",
      description: "Browse new roles regularly and save promising matches.",
      href: "/applicant/browse-jobs",
      cta: "Browse jobs",
      complete: true,
    });
  }

  return steps.slice(0, 4);
}

function NextStepsCard({
  steps,
}: {
  steps: ReturnType<typeof buildNextSteps>;
}) {
  return (
    <section className={styles.commandPanel}>
      <h2 className={styles.sideTitle}>Your next best steps</h2>
      <div className={styles.nextStepList}>
        {steps.map((step) => (
          <Link href={step.href} key={step.title} className={styles.nextStep}>
            <span className={styles.nextStepIcon}>{step.icon}</span>
            <span className={styles.nextStepBody}>
              <strong>{step.title}</strong>
              <small>{step.description}</small>
            </span>
            <span className={styles.nextStepCta}>
              {step.cta} <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function buildTips({
  strength,
  applicationsCount,
  interviewsCount,
}: {
  strength: number;
  applicationsCount: number;
  interviewsCount: number;
}) {
  const tips = [];
  if (strength < 80) tips.push("Complete your profile before sending applications.");
  if (applicationsCount === 0) tips.push("Apply early to recently posted jobs.");
  if (interviewsCount > 0) tips.push("Review the job description before each interview.");
  tips.push("Add skills that match your target roles.");
  tips.push("Keep your resume updated before applying.");
  return [...new Set(tips)].slice(0, 4);
}

function TipsCard({ tips }: { tips: string[] }) {
  return (
    <section className={styles.commandPanel}>
      <h2 className={styles.sideTitle}>Tips to get hired faster</h2>
      <div className={styles.tipList}>
        {tips.map((tip) => (
          <div className={styles.tipItem} key={tip}>
            <GraduationCap size={15} />
            <p>{tip}</p>
          </div>
        ))}
      </div>
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
    <div className={styles.commandPanelHeader}>
      <h2>{title}</h2>
      <Link href={href}>
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
    <div className={styles.commandEmpty}>
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={href} className={styles.commandPrimaryBtn}>
        {cta}
      </Link>
    </div>
  );
}
