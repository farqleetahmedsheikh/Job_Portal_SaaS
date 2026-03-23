/** @format */
"use client";

import Link               from "next/link";
import {
  MapPin, Briefcase, Clock, DollarSign,
  Bookmark, BookmarkCheck, Search, Sparkles,
} from "lucide-react";
import { useBrowseJobs }  from "../../hooks/useBrowseJobs";
import { formatDate }     from "../../lib";
import type { BrowseJob } from "../../hooks/useBrowseJobs";
import styles from "../styles/browse-jobs.module.css";

// ── Constants ─────────────────────────────────────────────────────────────────
const JOB_TYPES  = ["Full-time", "Part-time", "Contract", "Internship"];
const MODES      = ["Remote", "Hybrid", "On-site"];
const EXPERIENCE = ["0-1", "1-3", "3-5", "5+", "10+"];

const EXP_LABELS: Record<string, string> = {
  "0-1":  "0–1 yrs",
  "1-3":  "1–3 yrs",
  "3-5":  "3–5 yrs",
  "5+":   "5+ yrs",
  "10+":  "10+ yrs",
};

// ── MatchRing — visual skill match indicator ──────────────────────────────────
function MatchRing({ score }: { score: number }) {
  const color = score >= 70 ? "var(--status-success)"
    : score >= 40 ? "var(--status-warning)"
    : "var(--text-muted)";

  if (score === 0) return null;

  return (
    <div className={styles.matchRing} style={{ "--match-color": color } as React.CSSProperties}>
      <svg viewBox="0 0 36 36" className={styles.matchSvg}>
        <circle cx="18" cy="18" r="15.9" fill="none"
          stroke="var(--border)" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${score} 100`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className={styles.matchPct} style={{ color }}>{score}%</span>
    </div>
  );
}

// ── JobCard ───────────────────────────────────────────────────────────────────
function JobCard({
  job, isSaved, onSave, profileSkills,
}: {
  job:           BrowseJob;
  isSaved:       boolean;
  onSave:        () => void;
  profileSkills: string[];
}) {
  const salary = job.salaryMin && job.salaryMax
    ? `${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax / 1000).toFixed(0)}k`
    : job.salaryMin
      ? `From ${job.salaryCurrency} ${(job.salaryMin / 1000).toFixed(0)}k`
      : null;

  return (
    <div className={`${styles["job-card"]} ${job.isFeatured ? styles.featured : ""}`}>
      {/* Badges */}
      <div className={styles["job-card-top"]}>
        <div className={styles["company-logo"]}>
          {job.company.logoUrl
            ? <img src={job.company.logoUrl} alt={job.company.companyName} />
            : job.company.companyName[0]}
        </div>
        <div className={styles["job-card-badges"]}>
          {job.isFeatured && <span className={`${styles.badge} ${styles["badge-featured"]}`}>Featured</span>}
          {job.isUrgent  && <span className={`${styles.badge} ${styles["badge-urgent"]}`}>Urgent</span>}
          {job.locationType === "remote" && (
            <span className={`${styles.badge} ${styles["badge-remote"]}`}>Remote</span>
          )}
        </div>
        {/* Match ring — only if profile has skills */}
        {profileSkills.length > 0 && <MatchRing score={job.matchScore} />}
      </div>

      {/* Info */}
      <div className={styles["job-card-body"]}>
        <h3 className={styles["job-title"]}>{job.title}</h3>
        <p className={styles["job-company"]}>
          {job.company.companyName}
          {job.location && <> · <MapPin size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {job.location}</>}
        </p>
      </div>

      {/* Meta pills */}
      <div className={styles["job-meta"]}>
        <span className={styles["meta-pill"]}>
          <Briefcase size={11} /> {job.type}
        </span>
        {job.experienceLevel && (
          <span className={styles["meta-pill"]}>
            <Clock size={11} /> {EXP_LABELS[job.experienceLevel] ?? job.experienceLevel}
          </span>
        )}
        {salary && (
          <span className={styles["meta-pill"]}>
            <DollarSign size={11} /> {salary}
          </span>
        )}
      </div>

      {/* Description */}
      <p className={styles["job-desc"]}>{job.description}</p>

      {/* Skills — highlight matched ones */}
      {job.skills.length > 0 && (
        <div className={styles["skill-tags"]}>
          {job.skills.slice(0, 5).map((s) => (
            <span
              key={s}
              className={`${styles["skill-tag"]} ${
                job.matchedSkills.includes(s) ? styles["skill-tag-match"] : ""
              }`}
            >
              {job.matchedSkills.includes(s) && <Sparkles size={9} />}
              {s}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span className={styles["skill-tag"]}>+{job.skills.length - 5}</span>
          )}
        </div>
      )}

      {/* Matched skills summary */}
      {job.matchedSkills.length > 0 && (
        <p className={styles.matchHint}>
          <Sparkles size={11} /> You match {job.matchedSkills.length} of {job.skills.length} required skills
        </p>
      )}

      {/* Footer */}
      <div className={styles["job-card-footer"]}>
        <span className={styles["job-posted"]}>
          {job.publishedAt ? formatDate(job.publishedAt) : "—"}
        </span>
        <div className={styles["job-actions"]}>
          <button
            className={`${styles["save-btn"]} ${isSaved ? styles.saved : ""}`}
            onClick={onSave}
            aria-label={isSaved ? "Unsave job" : "Save job"}
          >
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>
          <Link href={`/applicant/jobs/${job.id}`} className={styles["apply-btn"]}>
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function JobSkeleton() {
  return (
    <div className={styles["job-grid"]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles["job-card"]}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div className={styles.skeleton} style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className={styles.skeleton} style={{ height: 16, width: "70%" }} />
              <div className={styles.skeleton} style={{ height: 12, width: "50%" }} />
            </div>
          </div>
          <div className={styles.skeleton} style={{ height: 12, width: "90%", marginBottom: 6 }} />
          <div className={styles.skeleton} style={{ height: 12, width: "75%" }} />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BrowseJobsPage() {
  const {
    jobs, loading, error,
    total, page, totalPages, setPage,
    sort, setSort,
    filters, setSearch, toggleSet, setSalary,
    resetFilters, activeChips,
    savedIds, toggleSave,
    profileSkills,
  } = useBrowseJobs();

  return (
    <div className={styles.page}>
      {/* ── Filter sidebar ───────────────────────────────────────────────── */}
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
              <input type="checkbox"
                checked={filters.types.has(type)}
                onChange={() => toggleSet("types", type)} />
              <span className={styles["check-text"]}>{type}</span>
            </label>
          ))}
        </div>

        {/* Work mode */}
        <div className={styles["filter-group"]}>
          <span className={styles["filter-label"]}>Work Mode</span>
          {MODES.map((mode) => (
            <label key={mode} className={styles["check-row"]}>
              <input type="checkbox"
                checked={filters.modes.has(mode)}
                onChange={() => toggleSet("modes", mode)} />
              <span className={styles["check-text"]}>{mode}</span>
            </label>
          ))}
        </div>

        {/* Experience */}
        <div className={styles["filter-group"]}>
          <span className={styles["filter-label"]}>Experience</span>
          {EXPERIENCE.map((exp) => (
            <label key={exp} className={styles["check-row"]}>
              <input type="checkbox"
                checked={filters.experience.has(exp)}
                onChange={() => toggleSet("experience", exp)} />
              <span className={styles["check-text"]}>{EXP_LABELS[exp]}</span>
            </label>
          ))}
        </div>

        {/* Salary */}
        <div className={styles["filter-group"]}>
          <span className={styles["filter-label"]}>Salary (PKR k / yr)</span>
          <div className={styles["salary-inputs"]}>
            <input className={styles["salary-input"]} placeholder="Min"
              type="number" value={filters.salaryMin}
              onChange={(e) => setSalary("salaryMin", e.target.value)} />
            <input className={styles["salary-input"]} placeholder="Max"
              type="number" value={filters.salaryMax}
              onChange={(e) => setSalary("salaryMax", e.target.value)} />
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles["search-wrap"]}>
            <Search size={14} className={styles["search-icon"]} />
            <input
              className={styles.search}
              placeholder="Search jobs, companies, skills..."
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className={styles["sort-select"]} value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="newest">Latest First</option>
            <option value="match"  disabled={!profileSkills.length}>
              Best Match {!profileSkills.length ? "(add skills to profile)" : ""}
            </option>
            <option value="salary">Highest Salary</option>
          </select>

          <span className={styles["result-count"]}>
            <strong>{total}</strong> jobs found
          </span>
        </div>

        {/* Skill match banner — shown when sort=match */}
        {sort === "match" && profileSkills.length > 0 && (
          <div className={styles.matchBanner}>
            <Sparkles size={14} />
            Sorted by match with your skills:
            {profileSkills.slice(0, 5).map((s) => (
              <span key={s} className={styles.matchBannerSkill}>{s}</span>
            ))}
            {profileSkills.length > 5 && (
              <span className={styles.matchBannerSkill}>+{profileSkills.length - 5} more</span>
            )}
          </div>
        )}

        {/* No profile skills hint */}
        {sort === "match" && profileSkills.length === 0 && (
          <div className={styles.matchBanner} style={{ borderColor: "rgba(249,115,22,.3)", background: "rgba(249,115,22,.06)", color: "var(--status-warning)" }}>
            Add skills to your profile to see how well you match each job.
            <Link href="/applicant/profile" style={{ color: "inherit", fontWeight: 600, marginLeft: 6 }}>
              Update profile →
            </Link>
          </div>
        )}

        {/* Active chips */}
        {activeChips.length > 0 && (
          <div className={styles.chips}>
            {activeChips.map((chip) => (
              <button key={chip.label} className={styles.chip} onClick={chip.clear}>
                {chip.label} <span className={styles["chip-x"]}>×</span>
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: "var(--status-danger)", padding: "20px 0", fontSize: 14 }}>
            {error}
          </p>
        )}

        {/* Jobs */}
        {loading ? <JobSkeleton /> : (
          <>
            {jobs.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles["empty-icon"]}>🔍</div>
                <h3>No jobs found</h3>
                <p>Try adjusting your filters or search term</p>
              </div>
            ) : (
              <div className={styles["job-grid"]}>
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedIds.has(job.id)}
                    onSave={() => toggleSave(job.id)}
                    profileSkills={profileSkills}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}