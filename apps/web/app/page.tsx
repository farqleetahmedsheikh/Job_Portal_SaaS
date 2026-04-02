/** @format */
import Link from "next/link";
import { JSX } from "react";
import styles from "./page.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HiringFly — Hire Smarter, Ship Faster",
  description:
    "HiringFly is an all-in-one hiring platform connecting companies and candidates through structured pipelines, real-time messaging, coding assessments, and interview workflows.",
  keywords: [
    "hiring platform",
    "recruitment software",
    "applicant tracking system",
    "ATS",
    "job posting",
    "candidate management",
    "hiring pipeline",
    "interview management",
  ],
  authors: [{ name: "HiringFly" }],
  creator: "HiringFly",
  metadataBase: new URL("https://hiringfly.com"),
  openGraph: {
    type: "website",
    url: "https://hiringfly.com",
    title: "HiringFly — Hire Smarter, Ship Faster",
    description:
      "All-in-one hiring OS for modern teams. Structured pipelines, real-time messaging, and interview workflows — without scattered emails.",
    siteName: "HiringFly",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HiringFly — Hire Smarter, Ship Faster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HiringFly - Hire Smarter, Ship Faster",
    description:
      "All-in-one hiring OS for modern teams. Structured pipelines, real-time messaging, and interview workflows.",
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

const FEATURES = [
  {
    icon: "⬡",
    title: "Structured Pipelines",
    description:
      "Move candidates across customizable stages from application to offer with precision.",
  },
  {
    icon: "⬡",
    title: "Real-Time Messaging",
    description:
      "Centralized in-app communication between recruiters and applicants — no emails.",
  },
  {
    icon: "⬡",
    title: "Coding Assessments",
    description:
      "Evaluate technical skills with built-in testing workflows and instant results.",
  },
  {
    icon: "⬡",
    title: "Interview Management",
    description:
      "Schedule, conduct, and evaluate interviews entirely inside the platform.",
  },
  {
    icon: "⬡",
    title: "Smart Notifications",
    description:
      "Stay updated with real-time alerts, status changes, and candidate activity.",
  },
  {
    icon: "⬡",
    title: "Unified Dashboard",
    description:
      "Complete visibility into every role, candidate, and hiring performance metric.",
  },
];

const STATS = [
  { value: "10×", label: "faster hiring cycles" },
  { value: "94%", label: "candidate satisfaction" },
  { value: "0", label: "external tools needed" },
];

export default function Home(): JSX.Element {
  return (
    <main className={styles.landing}>
      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.logo}>HiringFly</span>
          <div className={styles.navLinks}>
            <Link href="/login" className={styles.navLogin}>
              Sign in
            </Link>
            <Link href="/register" className={styles.navCta}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroNoise} />
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            All-in-one hiring OS
          </div>
          <h1 className={styles.heroTitle}>
            Hire smarter.
            <br />
            <span className={styles.heroAccent}>Ship faster.</span>
          </h1>
          <p className={styles.heroSub}>
            HiringFly connects companies and candidates through structured
            pipelines, real-time messaging, and interview workflows — without
            scattered emails or external tools.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className={styles.btnPrimary}>
              Start hiring free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="/login" className={styles.btnGhost}>
              Sign in
            </Link>
          </div>

          {/* Stats row */}
          <div className={styles.statsRow}>
            {STATS.map((s) => (
              <div key={s.label} className={styles.stat}>
                <span className={styles.statVal}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating card mockup */}
        <div className={styles.heroVisual}>
          <div className={styles.mockCard}>
            <div className={styles.mockHeader}>
              <div className={styles.mockDots}>
                <span />
                <span />
                <span />
              </div>
              <span className={styles.mockTitle}>Active pipelines</span>
            </div>
            <div className={styles.mockPipeline}>
              {["Applied", "Review", "Interview", "Offer"].map((stage, i) => (
                <div key={stage} className={styles.mockStage}>
                  <div className={styles.mockStageLabel}>{stage}</div>
                  <div
                    className={`${styles.mockStageBar} ${styles[`bar${i}`]}`}
                  />
                  <div className={styles.mockStageCount}>
                    {[12, 8, 4, 2][i]}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.mockCandidates}>
              {["FA", "JS", "MR", "AL"].map((init, i) => (
                <div
                  key={i}
                  className={`${styles.mockAvatar} ${styles[`av${i}`]}`}
                >
                  {init}
                </div>
              ))}
              <span className={styles.mockAvatarMore}>+18 candidates</span>
            </div>
          </div>

          <div className={styles.mockCardSm}>
            <div className={styles.mockSmIcon}>✓</div>
            <div>
              <p className={styles.mockSmTitle}>Offer accepted</p>
              <p className={styles.mockSmSub}>Senior React Engineer · 2m ago</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOR WHO */}
      <section className={styles.split}>
        <div className={styles.splitInner}>
          <div className={styles.splitCard}>
            <div className={styles.splitIcon}>🏢</div>
            <h3 className={styles.splitTitle}>For companies</h3>
            <p className={styles.splitDesc}>
              Manage job postings, track candidates, conduct interviews, assign
              coding tests, and hire — all within a structured hiring pipeline.
            </p>
            <Link href="/register?role=employer" className={styles.splitLink}>
              Start as employer →
            </Link>
          </div>
          <div className={styles.splitDivider} />
          <div className={styles.splitCard}>
            <div className={styles.splitIcon}>🚀</div>
            <h3 className={styles.splitTitle}>For candidates</h3>
            <p className={styles.splitDesc}>
              Apply to jobs, track your progress, receive interview invites, and
              complete coding assessments — without scattered emails.
            </p>
            <Link href="/register?role=applicant" className={styles.splitLink}>
              Start as candidate →
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.featuresHeader}>
            <p className={styles.featuresEyebrow}>Everything included</p>
            <h2 className={styles.featuresTitle}>
              One platform.
              <br />
              Every hiring need.
            </h2>
          </div>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureCardInner}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaGlow} />
          <p className={styles.ctaEyebrow}>No credit card required</p>
          <h2 className={styles.ctaTitle}>Ready to transform how you hire?</h2>
          <p className={styles.ctaSub}>
            Join forward-thinking teams using HiringFly to streamline
            recruitment.
          </p>
          <Link href="/register" className={styles.btnPrimary}>
            Create free account
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>HiringFly</span>
            <p className={styles.footerTagline}>
              Modern hiring infrastructure for growing teams.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/login">Sign in</Link>
            <Link href="/register">Get started</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © {new Date().getFullYear()} HiringFly. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
