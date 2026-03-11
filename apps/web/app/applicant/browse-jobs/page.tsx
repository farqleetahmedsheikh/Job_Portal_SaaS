/** @format */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "../styles/browse-jobs.module.css";

/* ── Types ── */
interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  mode: "Remote" | "Hybrid" | "On-site";
  salary: string;
  salaryRaw: number;
  experience: string;
  description: string;
  tags: string[];
  posted: string;
  featured?: boolean;
  isNew?: boolean;
  urgent?: boolean;
}

/* ── Mock data ── */
const JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "Stripe",
    logo: "🏢",
    location: "San Francisco, CA",
    type: "Full-time",
    mode: "Remote",
    salary: "$140k – $180k",
    salaryRaw: 160000,
    experience: "5+ years",
    description:
      "Build and maintain Stripe's dashboard and developer tools used by millions of businesses worldwide.",
    tags: ["React", "TypeScript", "GraphQL"],
    posted: "2h ago",
    featured: true,
    isNew: true,
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Linear",
    logo: "🔵",
    location: "New York, NY",
    type: "Full-time",
    mode: "Hybrid",
    salary: "$120k – $150k",
    salaryRaw: 135000,
    experience: "3+ years",
    description:
      "Design intuitive interfaces for the project management tool loved by modern software teams.",
    tags: ["Figma", "Design Systems", "Prototyping"],
    posted: "5h ago",
    isNew: true,
  },
  {
    id: "3",
    title: "Backend Engineer",
    company: "Vercel",
    logo: "▲",
    location: "Remote",
    type: "Full-time",
    mode: "Remote",
    salary: "$130k – $165k",
    salaryRaw: 147000,
    experience: "4+ years",
    description:
      "Work on the infrastructure powering Next.js deployments at massive scale for developers globally.",
    tags: ["Node.js", "Rust", "PostgreSQL"],
    posted: "1d ago",
  },
  {
    id: "4",
    title: "iOS Engineer",
    company: "Notion",
    logo: "📝",
    location: "Los Angeles, CA",
    type: "Full-time",
    mode: "On-site",
    salary: "$125k – $155k",
    salaryRaw: 140000,
    experience: "3+ years",
    description:
      "Build the Notion iOS app experience for millions of users who rely on it daily for work and life.",
    tags: ["Swift", "SwiftUI", "Core Data"],
    posted: "2d ago",
    urgent: true,
  },
  {
    id: "5",
    title: "DevOps Engineer",
    company: "PlanetScale",
    logo: "🟣",
    location: "Remote",
    type: "Contract",
    mode: "Remote",
    salary: "$90k – $120k",
    salaryRaw: 105000,
    experience: "2+ years",
    description:
      "Manage cloud infrastructure, CI/CD pipelines, and database operations for a high-growth startup.",
    tags: ["AWS", "Kubernetes", "Terraform"],
    posted: "3d ago",
  },
  {
    id: "6",
    title: "ML Engineer",
    company: "Hugging Face",
    logo: "🤗",
    location: "Paris / Remote",
    type: "Full-time",
    mode: "Remote",
    salary: "$145k – $190k",
    salaryRaw: 167000,
    experience: "4+ years",
    description:
      "Train and deploy state-of-the-art NLP models that power the world's largest AI model hub.",
    tags: ["Python", "PyTorch", "Transformers"],
    posted: "4d ago",
    featured: true,
  },
  {
    id: "7",
    title: "React Native Developer",
    company: "Shopify",
    logo: "🛍️",
    location: "Toronto, Canada",
    type: "Full-time",
    mode: "Hybrid",
    salary: "$110k – $140k",
    salaryRaw: 125000,
    experience: "2+ years",
    description:
      "Help millions of merchants manage their stores on the go with Shopify's mobile apps.",
    tags: ["React Native", "TypeScript", "Redux"],
    posted: "5d ago",
  },
  {
    id: "8",
    title: "Data Engineer",
    company: "Figma",
    logo: "🎨",
    location: "Seattle, WA",
    type: "Full-time",
    mode: "Hybrid",
    salary: "$135k – $160k",
    salaryRaw: 147000,
    experience: "3+ years",
    description:
      "Build the data pipelines and analytics infrastructure that help Figma make product decisions.",
    tags: ["Python", "dbt", "Snowflake"],
    posted: "1w ago",
  },
];

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const MODES = ["Remote", "Hybrid", "On-site"];
const EXPERIENCE = ["0–1 years", "2–3 years", "4–5 years", "5+ years"];

export default function BrowseJobsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [activeModes, setActiveModes] = useState<Set<string>>(new Set());
  const [activeExp, setActiveExp] = useState<Set<string>>(new Set());
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const toggleSet = (set: Set<string>, val: string): Set<string> => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    return next;
  };

  const activeChips: { label: string; clear: () => void }[] = [
    ...[...activeTypes].map((v) => ({
      label: v,
      clear: () => setActiveTypes(toggleSet(activeTypes, v)),
    })),
    ...[...activeModes].map((v) => ({
      label: v,
      clear: () => setActiveModes(toggleSet(activeModes, v)),
    })),
    ...[...activeExp].map((v) => ({
      label: v,
      clear: () => setActiveExp(toggleSet(activeExp, v)),
    })),
    ...(salaryMin
      ? [{ label: `Min $${salaryMin}`, clear: () => setSalaryMin("") }]
      : []),
    ...(salaryMax
      ? [{ label: `Max $${salaryMax}`, clear: () => setSalaryMax("") }]
      : []),
  ];

  const filtered = useMemo(() => {
    let list = [...JOBS];

    if (search.trim())
      list = list.filter((j) =>
        [j.title, j.company, ...j.tags]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
      );

    if (activeTypes.size) list = list.filter((j) => activeTypes.has(j.type));
    if (activeModes.size) list = list.filter((j) => activeModes.has(j.mode));
    if (salaryMin)
      list = list.filter((j) => j.salaryRaw >= Number(salaryMin) * 1000);
    if (salaryMax)
      list = list.filter((j) => j.salaryRaw <= Number(salaryMax) * 1000);

    if (sortBy === "salary") list.sort((a, b) => b.salaryRaw - a.salaryRaw);
    if (sortBy === "newest") list.sort((a) => (a.isNew ? -1 : 1));
    if (sortBy === "featured") list.sort((a) => (a.featured ? -1 : 1));

    return list;
  }, [search, activeTypes, activeModes, salaryMin, salaryMax, sortBy]);

  const toggleSave = (id: string) => setSavedIds(toggleSet(savedIds, id));

  const resetFilters = () => {
    setActiveTypes(new Set());
    setActiveModes(new Set());
    setActiveExp(new Set());
    setSalaryMin("");
    setSalaryMax("");
  };

  return (
    <div className={styles.page}>
      {/* ════ FILTER SIDEBAR ════ */}
      <aside className={styles.filters}>
        <div className={styles["filter-heading"]}>
          <h2>Filters</h2>
          {activeChips.length > 0 && (
            <button className={styles["filter-reset"]} onClick={resetFilters}>
              Reset all
            </button>
          )}
        </div>

        {/* Job type */}
        <div className={styles["filter-group"]}>
          <span className={styles["filter-label"]}>Job Type</span>
          {JOB_TYPES.map((type) => (
            <label key={type} className={styles["check-row"]}>
              <input
                type="checkbox"
                checked={activeTypes.has(type)}
                onChange={() => setActiveTypes(toggleSet(activeTypes, type))}
              />
              <span className={styles["check-text"]}>{type}</span>
              <span className={styles["check-count"]}>
                {JOBS.filter((j) => j.type === type).length}
              </span>
            </label>
          ))}
        </div>

        {/* Work mode */}
        <div className={styles["filter-group"]}>
          <span className={styles["filter-label"]}>Work Mode</span>
          {MODES.map((mode) => (
            <label key={mode} className={styles["check-row"]}>
              <input
                type="checkbox"
                checked={activeModes.has(mode)}
                onChange={() => setActiveModes(toggleSet(activeModes, mode))}
              />
              <span className={styles["check-text"]}>{mode}</span>
              <span className={styles["check-count"]}>
                {JOBS.filter((j) => j.mode === mode).length}
              </span>
            </label>
          ))}
        </div>

        {/* Experience */}
        <div className={styles["filter-group"]}>
          <span className={styles["filter-label"]}>Experience</span>
          {EXPERIENCE.map((exp) => (
            <label key={exp} className={styles["check-row"]}>
              <input
                type="checkbox"
                checked={activeExp.has(exp)}
                onChange={() => setActiveExp(toggleSet(activeExp, exp))}
              />
              <span className={styles["check-text"]}>{exp}</span>
            </label>
          ))}
        </div>

        {/* Salary range */}
        <div className={styles["filter-group"]}>
          <span className={styles["filter-label"]}>Salary (USD/yr $k)</span>
          <div className={styles["salary-inputs"]}>
            <input
              className={styles["salary-input"]}
              placeholder="Min"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              type="number"
            />
            <input
              className={styles["salary-input"]}
              placeholder="Max"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              type="number"
            />
          </div>
        </div>
      </aside>

      {/* ════ MAIN CONTENT ════ */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topbar}>
          <div className={styles["search-wrap"]}>
            <svg
              className={styles["search-icon"]}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={styles.search}
              placeholder="Search jobs, companies, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className={styles["sort-select"]}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevance">Most Relevant</option>
            <option value="newest">Newest First</option>
            <option value="salary">Highest Salary</option>
            <option value="featured">Featured</option>
          </select>

          <span className={styles["result-count"]}>
            <strong>{filtered.length}</strong> jobs found
          </span>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className={styles.chips}>
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                className={styles.chip}
                onClick={chip.clear}
              >
                {chip.label}
                <span className={styles["chip-x"]}>×</span>
              </button>
            ))}
          </div>
        )}

        {/* Job grid */}
        <div className={styles["job-grid"]}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles["empty-icon"]}>🔍</div>
              <h3>No jobs found</h3>
              <p>Try adjusting your filters or search term</p>
            </div>
          ) : (
            filtered.map((job) => (
              <div
                key={job.id}
                className={`${styles["job-card"]} ${job.featured ? styles.featured : ""}`}
              >
                {/* Top row */}
                <div className={styles["job-card-top"]}>
                  <div className={styles["company-logo"]}>{job.logo}</div>
                  <div className={styles["job-card-badges"]}>
                    {job.featured && (
                      <span
                        className={`${styles.badge} ${styles["badge-featured"]}`}
                      >
                        Featured
                      </span>
                    )}
                    {job.isNew && (
                      <span
                        className={`${styles.badge} ${styles["badge-new"]}`}
                      >
                        New
                      </span>
                    )}
                    {job.urgent && (
                      <span
                        className={`${styles.badge} ${styles["badge-urgent"]}`}
                      >
                        Urgent
                      </span>
                    )}
                    {job.mode === "Remote" && (
                      <span
                        className={`${styles.badge} ${styles["badge-remote"]}`}
                      >
                        Remote
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className={styles["job-card-body"]}>
                  <h3 className={styles["job-title"]}>{job.title}</h3>
                  <p className={styles["job-company"]}>
                    {job.company} · {job.location}
                  </p>
                </div>

                {/* Meta */}
                <div className={styles["job-meta"]}>
                  <span className={styles["meta-pill"]}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    </svg>
                    {job.type}
                  </span>
                  <span className={styles["meta-pill"]}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    {job.experience}
                  </span>
                  <span className={styles["meta-pill"]}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {job.mode}
                  </span>
                </div>

                {/* Description */}
                <p className={styles["job-desc"]}>{job.description}</p>

                {/* Footer */}
                <div className={styles["job-card-footer"]}>
                  <div>
                    <div className={styles["job-salary"]}>
                      {job.salary} <span>/ yr</span>
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      Posted {job.posted}
                    </div>
                  </div>
                  <div className={styles["job-actions"]}>
                    <button
                      className={`${styles["save-btn"]} ${savedIds.has(job.id) ? styles.saved : ""}`}
                      onClick={() => toggleSave(job.id)}
                      title={savedIds.has(job.id) ? "Unsave" : "Save"}
                    >
                      {savedIds.has(job.id) ? (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      ) : (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                    </button>
                    <Link
                      href={`/jobs/${job.id}`}
                      className={styles["apply-btn"]}
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
