/** @format */
"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Search,
  Sparkles,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { useOnboarding, type OnboardingRole } from "../../hooks/useOnboarding";
import { useUser } from "../../store/session.store";
import styles from "./onboarding.module.css";

interface WelcomeStep {
  title: string;
  icon: ReactNode;
}

interface TourStep {
  id: string;
  href: string;
  target: string;
  eyebrow: string;
  title: string;
  body: string;
}

const WELCOME_STEPS: Record<OnboardingRole, WelcomeStep[]> = {
  employer: [
    { title: "Post your first job", icon: <Briefcase size={16} /> },
    { title: "Review applicants", icon: <Users size={16} /> },
    { title: "Schedule interviews", icon: <CalendarCheck size={16} /> },
    { title: "Hire with automated updates", icon: <Zap size={16} /> },
  ],
  applicant: [
    { title: "Complete your profile", icon: <UserRound size={16} /> },
    { title: "Browse jobs", icon: <Search size={16} /> },
    { title: "Track applications", icon: <ClipboardList size={16} /> },
    { title: "Attend interviews", icon: <CalendarCheck size={16} /> },
  ],
};

const TOUR_STEPS: Record<OnboardingRole, TourStep[]> = {
  employer: [
    {
      id: "employer-dashboard",
      href: "/employer/dashboard",
      target: "employer-dashboard",
      eyebrow: "Step 1 of 5",
      title: "Dashboard",
      body: "This is your hiring command center. Track jobs, applicants, interviews, and next actions.",
    },
    {
      id: "employer-jobs",
      href: "/employer/jobs",
      target: "employer-jobs",
      eyebrow: "Step 2 of 5",
      title: "Jobs",
      body: "Post and manage jobs here. Your applicants enter the hiring pipeline automatically.",
    },
    {
      id: "employer-applicants",
      href: "/employer/applicants",
      target: "employer-applicants",
      eyebrow: "Step 3 of 5",
      title: "Applicants",
      body: "Review candidates, change statuses, and keep communication organized.",
    },
    {
      id: "employer-interviews",
      href: "/employer/interviews",
      target: "employer-interviews",
      eyebrow: "Step 4 of 5",
      title: "Interviews",
      body: "Schedule interviews inside HiringFly and keep everything tracked without scattered tools.",
    },
    {
      id: "employer-automation",
      href: "/employer/automation",
      target: "employer-automation",
      eyebrow: "Step 5 of 5",
      title: "Automation",
      body: "Automate candidate updates, reminders, and follow-ups as your hiring grows.",
    },
  ],
  applicant: [
    {
      id: "applicant-dashboard",
      href: "/applicant/dashboard",
      target: "applicant-dashboard",
      eyebrow: "Step 1 of 5",
      title: "Dashboard",
      body: "This is your job search command center. Track your profile, applications, and interviews.",
    },
    {
      id: "applicant-browse-jobs",
      href: "/applicant/browse-jobs",
      target: "applicant-browse-jobs",
      eyebrow: "Step 2 of 5",
      title: "Browse Jobs",
      body: "Find roles that match your goals and apply directly from HiringFly.",
    },
    {
      id: "applicant-applications",
      href: "/applicant/applications",
      target: "applicant-applications",
      eyebrow: "Step 3 of 5",
      title: "Applications",
      body: "Track every application status from applied to interview and final decision.",
    },
    {
      id: "applicant-profile",
      href: "/applicant/profile",
      target: "applicant-profile",
      eyebrow: "Step 4 of 5",
      title: "Resumes and Profile",
      body: "Keep your profile and resume updated so employers can evaluate you faster.",
    },
    {
      id: "applicant-interviews",
      href: "/applicant/interviews",
      target: "applicant-interviews",
      eyebrow: "Step 5 of 5",
      title: "Interviews",
      body: "Interview invites and details appear here when employers schedule with you.",
    },
  ],
};

function getRole(role?: string | null): OnboardingRole | null {
  if (role === "applicant" || role === "employer") return role;
  return null;
}

function getTooltipStyle(rect: DOMRect | null): CSSProperties {
  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const panelWidth = Math.min(360, window.innerWidth - 32);
  const preferredLeft = rect.right + 18;
  const canSitRight = preferredLeft + panelWidth < window.innerWidth - 16;
  const left = canSitRight
    ? preferredLeft
    : Math.max(16, Math.min(rect.left, window.innerWidth - panelWidth - 16));
  const top =
    rect.top + 240 < window.innerHeight
      ? Math.max(16, rect.top)
      : Math.max(16, window.innerHeight - 260);

  return { top, left, width: panelWidth };
}

export function OnboardingExperience() {
  const user = useUser();
  const role = getRole(user?.role);
  const router = useRouter();
  const pathname = usePathname();
  const { status, loading, complete } = useOnboarding(Boolean(role));
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [saving, setSaving] = useState(false);
  const hasPrompted = useRef(false);

  const welcomeSteps = role ? WELCOME_STEPS[role] : [];
  const tourSteps = useMemo(() => (role ? TOUR_STEPS[role] : []), [role]);
  const activeStep = tourSteps[currentStep] ?? null;
  const isLastStep = currentStep >= tourSteps.length - 1;

  useEffect(() => {
    if (!role || loading || !status || hasPrompted.current) return;
    if (!status.hasCompletedOnboarding) {
      hasPrompted.current = true;
      setWelcomeOpen(true);
    }
  }, [loading, role, status]);

  const startTour = useCallback(() => {
    if (!role) return;
    setWelcomeOpen(false);
    setCurrentStep(0);
    setTourOpen(true);
  }, [role]);

  useEffect(() => {
    function restartTour() {
      hasPrompted.current = true;
      startTour();
    }

    window.addEventListener("hiringfly:restart-onboarding", restartTour);
    return () =>
      window.removeEventListener("hiringfly:restart-onboarding", restartTour);
  }, [startTour]);

  useEffect(() => {
    if (!tourOpen || !activeStep) return;
    const step = activeStep;
    if (!pathname.startsWith(step.href)) {
      router.push(step.href);
      return;
    }

    function measure() {
      const target = document.querySelector<HTMLElement>(
        `[data-tour-id="${step.target}"]`,
      );
      if (!target) {
        setTargetRect(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      setTargetRect(rect.width && rect.height ? rect : null);
    }

    const timer = window.setTimeout(measure, 90);
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [activeStep, pathname, router, tourOpen]);

  async function markComplete() {
    if (!role) return;
    setSaving(true);
    try {
      await complete(role);
    } catch {
      // Do not trap the user in onboarding if the persistence request fails.
    } finally {
      setSaving(false);
    }
  }

  async function closeAndComplete() {
    setWelcomeOpen(false);
    setTourOpen(false);
    await markComplete();
  }

  async function finishTour() {
    setTourOpen(false);
    await markComplete();
  }

  if (!role) return null;

  return (
    <>
      {welcomeOpen && (
        <div className={styles.modalLayer} role="presentation">
          <div
            className={styles.welcomeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
          >
            <span className={styles.modalIcon}>
              <Sparkles size={20} />
            </span>
            <p className={styles.kicker}>Quick start</p>
            <h2 id="onboarding-title">Welcome to HiringFly</h2>
            <p className={styles.modalCopy}>
              {role === "employer"
                ? "Manage jobs, candidates, interviews, messages, and hiring updates from one workspace."
                : "Find jobs, apply with your profile, track applications, and receive interview updates in one place."}
            </p>

            <div className={styles.stepGrid}>
              {welcomeSteps.map((step, index) => (
                <div key={step.title} className={styles.welcomeStep}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <span className={styles.stepIcon}>{step.icon}</span>
                  <strong>{step.title}</strong>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void closeAndComplete()}
                disabled={saving}
              >
                Skip for now
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={startTour}
              >
                Start quick tour <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {tourOpen && activeStep && (
        <div className={styles.tourLayer} aria-live="polite">
          <div className={styles.scrim} />
          {targetRect && (
            <div
              className={styles.spotlight}
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
              }}
            />
          )}
          <div className={styles.tourCard} style={getTooltipStyle(targetRect)}>
            <div className={styles.tourTop}>
              <span className={styles.kicker}>{activeStep.eyebrow}</span>
              <span className={styles.progressPill}>
                {currentStep + 1}/{tourSteps.length}
              </span>
            </div>
            <h2>{activeStep.title}</h2>
            <p>{activeStep.body}</p>
            <div className={styles.progressTrack}>
              <span
                style={{
                  width: `${((currentStep + 1) / tourSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className={styles.tourActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void closeAndComplete()}
                disabled={saving}
              >
                Skip
              </button>
              <div className={styles.tourNav}>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="Previous tour step"
                  onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() =>
                    isLastStep
                      ? void finishTour()
                      : setCurrentStep((step) => step + 1)
                  }
                  disabled={saving}
                >
                  {isLastStep ? (
                    <>
                      Finish <CheckCircle2 size={14} />
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
