/** @format */

import Link from "next/link";
import { JSX } from "react";
import "./page.css";

export default function Home(): JSX.Element {
  return (
    <main className="landing">
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-badge">
              All-in-One Hiring Operating System
            </span>

            <h1 className="hero-title">
              Hire Smarter. Manage Everything in One Platform.
            </h1>

            <p className="hero-subtitle">
              HireSphere connects companies and candidates through structured
              pipelines, in-app messaging, coding assessments, and interview
              workflows — without emails or external tools.
            </p>

            <div className="hero-actions">
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>

              <Link href="/login" className="btn-outline">
                Login
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header" />
              <div className="preview-body" />
            </div>
          </div>
        </div>
      </section>

      {/* VALUE SPLIT SECTION */}
      <section className="split-section">
        <div className="container split-grid">
          <div className="split-card">
            <h3>For Companies</h3>
            <p>
              Manage job postings, track candidates, conduct interviews, assign
              coding tests, and hire — all within a structured hiring pipeline.
            </p>
          </div>

          <div className="split-card">
            <h3>For Candidates</h3>
            <p>
              Apply to jobs, track progress, receive interview invites, and
              complete coding assessments — without scattered emails.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">
            Everything You Need to Run Hiring Efficiently
          </h2>

          <div className="feature-grid">
            <FeatureCard
              title="Structured Hiring Pipelines"
              description="Move candidates across customizable stages from application to offer."
            />
            <FeatureCard
              title="Real-Time Messaging"
              description="Centralized in-app communication between recruiters and applicants."
            />
            <FeatureCard
              title="Coding Tests & Assessments"
              description="Evaluate technical skills with built-in testing workflows."
            />
            <FeatureCard
              title="Interview Management"
              description="Schedule and manage interviews inside the platform."
            />
            <FeatureCard
              title="Smart Notifications"
              description="Stay updated with real-time alerts and status changes."
            />
            <FeatureCard
              title="Centralized Dashboard"
              description="Gain complete visibility into hiring performance."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta">
        <div className="container cta-box">
          <h2>Transform the Way You Hire</h2>
          <p>
            Join forward-thinking teams using HireSphere to streamline
            recruitment.
          </p>
          <Link href="/register" className="btn-primary large">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <h4>HireSphere</h4>
            <p>Modern hiring infrastructure for growing teams.</p>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} HireSphere. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps): JSX.Element {
  return (
    <div className="feature-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
