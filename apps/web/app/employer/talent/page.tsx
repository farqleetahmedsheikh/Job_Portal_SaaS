/** @format */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Crown,
  Eye,
  MapPin,
  Search,
  Shield,
  X,
} from "lucide-react";
import { api } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "./talent.module.css";

type Candidate = {
  userId: string;
  fullName: string;
  email: string | null;
  avatar: string | null;
  headline: string | null;
  skills: string[];
  experienceSummary: string | null;
  experienceLevel: "junior" | "mid" | "senior";
  experienceYears: number | null;
  location: string | null;
  profileCompleteness: number;
  lastActiveAt: string | null;
  isOpenToWork: boolean;
  isSaved: boolean;
  isLocked: boolean;
  contactAllowed: boolean;
  resume: { id: string; name: string; fileUrl?: string } | null;
  resumes?: { id: string; name: string; fileUrl?: string }[];
  education?: unknown[];
  experience?: { title?: string; company?: string; description?: string }[];
  contact?: { email: string | null; phone: string | null } | null;
};

type TalentResponse = {
  data: Candidate[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasTalentDb: boolean;
    locked: boolean;
    requiredPlan?: string | null;
  };
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function lastActive(value: string | null) {
  if (!value) return "Activity hidden";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "Active today";
  if (days === 1) return "Active yesterday";
  return `Active ${days} days ago`;
}

export default function TalentDatabasePage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TalentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const params = useMemo(() => {
    const p = new URLSearchParams({
      page: String(page),
      limit: "12",
    });
    if (query) p.set("search", query);
    if (location) p.set("location", location);
    if (skills) p.set("skills", skills);
    if (experienceLevel) p.set("experienceLevel", experienceLevel);
    return p;
  }, [query, location, skills, experienceLevel, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<TalentResponse>(`${API_BASE}/talent-db?${params.toString()}`, "GET")
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load talent");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  async function openCandidate(candidate: Candidate) {
    if (candidate.isLocked) {
      setSelected(candidate);
      return;
    }
    setSelected(candidate);
    setDetailLoading(true);
    try {
      const detail = await api<Candidate>(
        `${API_BASE}/talent-db/${candidate.userId}`,
        "GET",
      );
      setSelected(detail);
    } catch {
      setSelected(candidate);
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleSave(candidate: Candidate) {
    if (candidate.isLocked) return;
    const method = candidate.isSaved ? "DELETE" : "POST";
    const url = candidate.isSaved
      ? `${API_BASE}/talent-db/save/${candidate.userId}`
      : `${API_BASE}/talent-db/save`;
    await api(url, method, candidate.isSaved ? undefined : { candidateId: candidate.userId });
    setData((current) =>
      current
        ? {
            ...current,
            data: current.data.map((item) =>
              item.userId === candidate.userId
                ? { ...item, isSaved: !candidate.isSaved }
                : item,
            ),
          }
        : current,
    );
    setSelected((current) =>
      current?.userId === candidate.userId
        ? { ...current, isSaved: !candidate.isSaved }
        : current,
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.meta.total / data.meta.limit)) : 1;

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <span className={styles.kicker}>Employer workspace</span>
          <h1>Talent Database</h1>
          <p>Discover and connect with candidates already in HiringFly.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/employer/talent/saved" className={styles.btnGhost}>
            <BookmarkCheck size={15} /> Saved candidates
          </Link>
          <Link href="/employer/billing" className={styles.btnPrimary}>
            <Crown size={15} /> Upgrade access
          </Link>
        </div>
      </section>

      <section className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={15} />
          <input
            className={styles.input}
            placeholder="Search name, title, skills..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <input
          className={styles.input}
          placeholder="Location"
          value={location}
          onChange={(event) => {
            setLocation(event.target.value);
            setPage(1);
          }}
        />
        <input
          className={styles.input}
          placeholder="Skills, comma separated"
          value={skills}
          onChange={(event) => {
            setSkills(event.target.value);
            setPage(1);
          }}
        />
        <select
          className={styles.select}
          value={experienceLevel}
          onChange={(event) => {
            setExperienceLevel(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All experience</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid-level</option>
          <option value="senior">Senior</option>
        </select>
      </section>

      {data?.meta.locked && (
        <section className={styles.lockedBanner}>
          <div>
            <h2>Unlock full talent database with Growth</h2>
            <p>
              Free and Starter plans get a limited preview. Upgrade to view full
              profiles, save candidates, and access contact options.
            </p>
          </div>
          <Link href="/employer/billing" className={styles.btnPrimary}>
            View plans
          </Link>
        </section>
      )}

      {error && <div className={styles.empty}>{error}</div>}

      <section className={styles.grid}>
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={styles.skeleton} />
            ))
          : data?.data.length
            ? data.data.map((candidate) => (
                <CandidateCard
                  key={candidate.userId}
                  candidate={candidate}
                  onView={() => void openCandidate(candidate)}
                  onSave={() => void toggleSave(candidate)}
                />
              ))
            : !error && (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>
                    <Search size={20} />
                  </span>
                  <h2>No candidates found</h2>
                  <p>Try broadening your search or removing a filter.</p>
                </div>
              )}
      </section>

      {data && data.meta.total > data.meta.limit && (
        <div className={styles.pagination}>
          <button
            className={styles.btnGhost}
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className={styles.btnGhost}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <CandidateModal
          candidate={selected}
          loading={detailLoading}
          onClose={() => setSelected(null)}
          onSave={() => void toggleSave(selected)}
        />
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  onView,
  onSave,
}: {
  candidate: Candidate;
  onView: () => void;
  onSave: () => void;
}) {
  return (
    <article className={`${styles.candidate} ${candidate.isLocked ? styles.locked : ""}`}>
      <div className={styles.top}>
        <span className={styles.avatar}>
          {candidate.avatar ? (
            <Image src={candidate.avatar} alt={candidate.fullName} width={48} height={48} />
          ) : (
            initials(candidate.fullName)
          )}
        </span>
        <div className={styles.identity}>
          <h2>{candidate.fullName}</h2>
          <p>{candidate.headline ?? "Applicant"}</p>
        </div>
      </div>

      <div className={styles.badgeRow}>
        {candidate.isOpenToWork && <span className={styles.badge}>Open to work</span>}
        {!candidate.isLocked && <span className={styles.badge}>Recently active</span>}
      </div>

      <div className={styles.meta}>
        <span>
          <MapPin size={13} /> {candidate.location ?? "Location not set"}
        </span>
        <span>
          <Briefcase size={13} /> {candidate.experienceLevel}
        </span>
        <span>{lastActive(candidate.lastActiveAt)}</span>
      </div>

      <div className={styles.skills}>
        {candidate.skills.slice(0, 5).map((skill) => (
          <span key={skill} className={styles.skill}>
            {skill}
          </span>
        ))}
        {candidate.skills.length === 0 && <span className={styles.skill}>Skills pending</span>}
      </div>

      <div className={styles.strength}>
        <div className={styles.strengthTop}>
          <span>Profile strength</span>
          <strong>{candidate.profileCompleteness}%</strong>
        </div>
        <div className={styles.track}>
          <span style={{ width: `${candidate.profileCompleteness}%` }} />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} type="button" onClick={onView}>
          <Eye size={14} /> View Profile
        </button>
        <button
          className={styles.iconButton}
          type="button"
          onClick={onSave}
          disabled={candidate.isLocked}
          aria-label={candidate.isSaved ? "Unsave candidate" : "Save candidate"}
        >
          {candidate.isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        </button>
      </div>
    </article>
  );
}

function CandidateModal({
  candidate,
  loading,
  onClose,
  onSave,
}: {
  candidate: Candidate;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const contactLocked = candidate.isLocked || !candidate.contactAllowed;

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <span className={styles.avatar}>
              {candidate.avatar ? (
                <Image src={candidate.avatar} alt={candidate.fullName} width={48} height={48} />
              ) : (
                initials(candidate.fullName)
              )}
            </span>
            <div>
              <h2>{candidate.fullName}</h2>
              <p>{candidate.headline ?? "Applicant"}</p>
            </div>
          </div>
          <button className={styles.iconButton} type="button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className={styles.skeleton} />
        ) : (
          <div className={styles.detailGrid}>
            <section className={styles.detailSection}>
              <h3>Profile</h3>
              <p>{candidate.experienceSummary ?? "No summary added yet."}</p>
              <div className={styles.skills}>
                {candidate.skills.map((skill) => (
                  <span key={skill} className={styles.skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3>Contact</h3>
              <p className={contactLocked ? styles.blurred : undefined}>
                {contactLocked
                  ? "candidate@email.com"
                  : candidate.contact?.email ?? candidate.email ?? "Email hidden"}
              </p>
              <p className={contactLocked ? styles.blurred : undefined}>
                {contactLocked
                  ? "+00 000 000000"
                  : candidate.contact?.phone ?? "Phone hidden"}
              </p>
              {contactLocked && (
                <Link href="/employer/billing" className={styles.btnPrimary}>
                  <Shield size={14} /> Upgrade to unlock contact
                </Link>
              )}
            </section>
            <section className={styles.detailSection}>
              <h3>Experience</h3>
              <ul>
                {(candidate.experience ?? []).slice(0, 4).map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    <strong>{item.title ?? "Role"}</strong>
                    {item.company ? ` at ${item.company}` : ""}
                  </li>
                ))}
                {(!candidate.experience || candidate.experience.length === 0) && (
                  <li>No experience added yet.</li>
                )}
              </ul>
            </section>
            <section className={styles.detailSection}>
              <h3>Resume</h3>
              {candidate.resume ? (
                candidate.resume.fileUrl ? (
                  <Link href={candidate.resume.fileUrl} target="_blank" className={styles.btnGhost}>
                    Download {candidate.resume.name}
                  </Link>
                ) : (
                  <p>{candidate.resume.name} available after access is unlocked.</p>
                )
              ) : (
                <p>No resume uploaded.</p>
              )}
            </section>
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            className={styles.btnGhost}
            type="button"
            onClick={onSave}
            disabled={candidate.isLocked}
          >
            {candidate.isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {candidate.isSaved ? "Saved" : "Save candidate"}
          </button>
          <button className={styles.btnPrimary} type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
