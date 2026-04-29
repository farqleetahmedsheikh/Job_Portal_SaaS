/** @format */
import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "HiringFly - Hire Smarter, Ship Faster",
  description:
    "HiringFly helps companies post jobs, manage applicants, schedule interviews, send updates, and hire faster from one workspace.",
  keywords: [
    "hiring platform",
    "recruitment software",
    "applicant tracking system",
    "ATS",
    "job posting",
    "candidate management",
    "hiring pipeline",
    "interview scheduling",
  ],
  authors: [{ name: "HiringFly" }],
  creator: "HiringFly",
  metadataBase: new URL("https://hiringfly.com"),
  openGraph: {
    type: "website",
    url: "https://hiringfly.com",
    title: "HiringFly - Hire Smarter, Ship Faster",
    description:
      "Jobs, candidates, interviews, messages, and notifications in one modern hiring workspace.",
    siteName: "HiringFly",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HiringFly - Hire Smarter, Ship Faster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HiringFly - Hire Smarter, Ship Faster",
    description:
      "Post jobs, manage applicants, schedule interviews, and keep candidates updated from one workspace.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: "https://hiringfly.com",
  },
};

const PIPELINE = ["Applied", "Shortlisted", "Interview", "Offer", "Hired"];

const PAINS = [
  {
    title: "Applications get scattered",
    copy: "Candidate context disappears across inboxes, spreadsheets, and separate notes.",
  },
  {
    title: "Scheduling slows momentum",
    copy: "Interview coordination takes too many messages when hiring teams are busy.",
  },
  {
    title: "Candidates lose visibility",
    copy: "People apply, wait, and miss updates when communication is not part of the workflow.",
  },
];

const EMPLOYER_POINTS = [
  "Post and manage jobs",
  "Review applicants in one pipeline",
  "Schedule interviews",
  "Send candidate updates",
  "Use analytics and templates",
];

const CANDIDATE_POINTS = [
  "Browse active jobs",
  "Apply with profile and resume",
  "Track application status",
  "Receive interview invites",
  "Get timely notifications",
];

const PREVIEWS = [
  {
    title: "Hiring Pipeline",
    copy: "Move candidates from application to hire without losing the thread.",
    rows: ["New applicant", "Shortlist review", "Offer pending"],
  },
  {
    title: "Interview Scheduling",
    copy: "Coordinate interview type, time, notes, and candidate details in one place.",
    rows: ["Video call", "Panel interview", "Reschedule request"],
  },
  {
    title: "Candidate Dashboard",
    copy: "Give applicants a clear view of jobs, applications, interviews, and next steps.",
    rows: ["Recommended job", "Application status", "Profile strength"],
  },
  {
    title: "Employer Analytics",
    copy: "Understand funnel health, job performance, and hiring activity as your team grows.",
    rows: ["Pipeline health", "Job performance", "Usage insights"],
  },
];

const FEATURES = [
  ["Structured hiring pipelines", "Keep every candidate moving through clear stages."],
  ["Interview scheduling built in", "Schedule basic interviews on every plan, including free."],
  ["Candidate messaging", "Keep conversations attached to the hiring workflow."],
  ["Smart notifications", "Send updates when applications and interviews change."],
  ["Coding assessments", "Evaluate technical candidates inside the platform."],
  ["Employer analytics", "See funnel, pipeline, and job performance signals."],
  ["Company verification badge", "Help candidates trust the companies they apply to."],
  ["Email and contract templates", "Standardize candidate communication as hiring grows."],
  ["Applicant tracking dashboard", "Give candidates a calm place to track their search."],
];

const TRUST = [
  ["Role-based dashboards", "Separate experiences for employers and applicants."],
  ["Secure candidate workflows", "Access stays aligned with account role and ownership."],
  ["Professional communication", "Notifications and email flows keep candidates informed."],
  ["Built for growing teams", "Start simple, then unlock automation, templates, and analytics."],
];

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className={styles.landing}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            HiringFly
          </Link>
          <div className={styles.navLinks}>
            <Link href="/applicant/browse-jobs" className={styles.navLogin}>
              Find jobs
            </Link>
            <Link href="/login" className={styles.navLogin}>
              Sign in
            </Link>
            <Link href="/register" className={styles.navCta}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            Modern hiring workspace
          </div>
          <h1 className={styles.heroTitle}>
            Hire smarter.
            <br />
            <span className={styles.heroAccent}>Ship faster.</span>
          </h1>
          <p className={styles.heroSub}>
            HiringFly helps companies post jobs, manage applicants, schedule
            interviews, send updates, and hire faster from one workspace.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register?role=employer" className={styles.btnPrimary}>
              Start as Employer <Arrow />
            </Link>
            <Link href="/applicant/browse-jobs" className={styles.btnGhost}>
              Find Jobs
            </Link>
          </div>
          <div className={styles.trustLine}>
            <span>No credit card required</span>
            <span>Free interview scheduling included</span>
            <span>Built for modern hiring teams</span>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="HiringFly product preview">
          <div className={styles.dashboardMock}>
            <div className={styles.mockTop}>
              <span className={styles.mockTitle}>Hiring command center</span>
              <span className={styles.mockStatus}>Live pipeline</span>
            </div>
            <div className={styles.pipeline}>
              {PIPELINE.map((stage, index) => (
                <div key={stage} className={styles.pipelineStage}>
                  <span>{stage}</span>
                  <div className={styles.stageTrack}>
                    <i style={{ width: `${92 - index * 13}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.candidatePanel}>
              <div>
                <strong>Senior Product Designer</strong>
                <span>3 candidates need review</span>
              </div>
              <Link href="/register?role=employer">Open role</Link>
            </div>
          </div>

          <div className={`${styles.notificationCard} ${styles.noteOne}`}>
            <span className={styles.noteIcon}>I</span>
            <div>
              <strong>Interview scheduled</strong>
              <p>Candidate received meeting details.</p>
            </div>
          </div>
          <div className={`${styles.notificationCard} ${styles.noteTwo}`}>
            <span className={styles.noteIcon}>O</span>
            <div>
              <strong>Offer sent</strong>
              <p>Template ready for candidate review.</p>
            </div>
          </div>
          <div className={`${styles.notificationCard} ${styles.noteThree}`}>
            <span className={styles.noteIcon}>R</span>
            <div>
              <strong>Candidate replied</strong>
              <p>Message added to the hiring thread.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.problem}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Problem to workflow</span>
          <h2>Hiring breaks when everything is scattered.</h2>
          <p>
            HiringFly brings jobs, candidates, interviews, messages, and
            notifications into one clear workflow.
          </p>
        </div>
        <div className={styles.problemGrid}>
          {PAINS.map((pain) => (
            <article key={pain.title} className={styles.problemCard}>
              <span className={styles.cardIndex}>Pain</span>
              <h3>{pain.title}</h3>
              <p>{pain.copy}</p>
            </article>
          ))}
          <article className={styles.solutionCard}>
            <span className={styles.cardIndex}>Solution</span>
            <h3>One connected hiring workspace</h3>
            <p>
              Teams can post roles, review applicants, schedule interviews, and
              communicate with candidates without stitching tools together.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.split}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Two focused experiences</span>
          <h2>Built for employers and candidates.</h2>
        </div>
        <div className={styles.splitInner}>
          <RoleCard
            label="For companies"
            title="Run hiring from first job post to final offer."
            copy="A focused workspace for job publishing, applicant review, interview scheduling, candidate updates, analytics, and templates."
            points={EMPLOYER_POINTS}
            href="/register?role=employer"
            cta="Start as Employer"
          />
          <RoleCard
            label="For candidates"
            title="Find roles and track every application clearly."
            copy="Applicants can browse jobs, apply with a profile and resume, monitor status changes, and receive interview updates."
            points={CANDIDATE_POINTS}
            href="/register?role=applicant"
            cta="Start as Candidate"
          />
        </div>
      </section>

      <section className={styles.previews}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Inside HiringFly</span>
          <h2>Product-led workflows, not generic dashboards.</h2>
        </div>
        <div className={styles.previewGrid}>
          {PREVIEWS.map((preview) => (
            <article key={preview.title} className={styles.previewCard}>
              <div className={styles.previewMock}>
                {preview.rows.map((row, index) => (
                  <div key={row} className={styles.previewRow}>
                    <span className={styles.previewDot} />
                    <span>{row}</span>
                    <i style={{ width: `${58 + index * 12}%` }} />
                  </div>
                ))}
              </div>
              <h3>{preview.title}</h3>
              <p>{preview.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Everything connected</span>
            <h2>Purpose-built features for serious hiring.</h2>
          </div>
          <div className={styles.featureGrid}>
            {FEATURES.map(([title, copy]) => (
              <article key={title} className={styles.featureCard}>
                <span className={styles.featureIcon}>+</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.pricing}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Pricing preview</span>
          <h2>Start free. Upgrade when your hiring grows.</h2>
          <p>
            Basic interview scheduling is included on every plan. Paid plans
            unlock more volume, automation, templates, badges, and analytics.
          </p>
        </div>
        <div className={styles.pricingGrid}>
          <article className={styles.priceCard}>
            <span className={styles.planBadge}>Free</span>
            <h3>Start hiring without setup friction.</h3>
            <ul>
              <li>Basic job posting</li>
              <li>Basic interview scheduling</li>
              <li>Limited applicants and interviews</li>
            </ul>
            <Link href="/register?role=employer" className={styles.btnGhost}>
              Create free account
            </Link>
          </article>
          <article className={`${styles.priceCard} ${styles.priceFeatured}`}>
            <span className={styles.planBadge}>Growth</span>
            <h3>Unlock a stronger hiring engine.</h3>
            <ul>
              <li>More interviews and hiring volume</li>
              <li>Automation, reminders, and templates</li>
              <li>Verified badge and advanced analytics</li>
            </ul>
            <p className={styles.planNote}>
              7-day trial available. Yearly plans include 2 months free.
            </p>
            <Link href="/register?role=employer" className={styles.btnPrimary}>
              Start free trial <Arrow />
            </Link>
          </article>
        </div>
      </section>

      <section className={styles.trust}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Trust by design</span>
          <h2>Designed for startups, agencies, and growing teams.</h2>
        </div>
        <div className={styles.trustGrid}>
          {TRUST.map(([title, copy]) => (
            <article key={title} className={styles.trustCard}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <p className={styles.ctaEyebrow}>No credit card required</p>
          <h2>Ready to run hiring from one workspace?</h2>
          <p>
            Create your free account, post your first job, and start managing
            candidates with built-in interview scheduling.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/register?role=employer" className={styles.btnPrimary}>
              Start hiring free <Arrow />
            </Link>
            <Link href="/applicant/browse-jobs" className={styles.btnGhost}>
              Browse jobs
            </Link>
          </div>
          <div className={styles.ctaChecks}>
            <span>No credit card required</span>
            <span>Free interview scheduling included</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>HiringFly</span>
            <p className={styles.footerTagline}>
              Modern hiring infrastructure for growing teams.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/applicant/browse-jobs">Find jobs</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/register">Get started</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          &copy; {new Date().getFullYear()} HiringFly. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function RoleCard({
  label,
  title,
  copy,
  points,
  href,
  cta,
}: {
  label: string;
  title: string;
  copy: string;
  points: string[];
  href: string;
  cta: string;
}) {
  return (
    <article className={styles.roleCard}>
      <span className={styles.roleLabel}>{label}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
      <ul>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <Link href={href} className={styles.roleLink}>
        {cta} <Arrow />
      </Link>
    </article>
  );
}
