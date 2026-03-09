/** @format */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Users,
  Star,
  Download,
  Calendar,
  MessageSquare,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Filter,
  SlidersHorizontal,
  BarChart2,
  ArrowUpDown,
  Send,
} from "lucide-react";
import styles from "../../styles/applicants.module.css";

type AppStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected";

interface Applicant {
  id: string;
  name: string;
  avatar: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  appliedAt: string;
  status: AppStatus;
  match: number;
  starred: boolean;
  resumeUrl: string;
}

const APPLICANTS: Applicant[] = [
  {
    id: "1",
    name: "Alex Rivera",
    avatar: "AR",
    title: "Senior React Engineer",
    location: "San Francisco, CA",
    experience: "6 yrs",
    skills: ["React", "TypeScript", "CSS"],
    appliedAt: "2h ago",
    status: "new",
    match: 94,
    starred: true,
    resumeUrl: "#",
  },
  {
    id: "2",
    name: "Priya Patel",
    avatar: "PP",
    title: "Frontend Developer",
    location: "Remote",
    experience: "4 yrs",
    skills: ["React", "Next.js", "GraphQL"],
    appliedAt: "5h ago",
    status: "reviewing",
    match: 88,
    starred: false,
    resumeUrl: "#",
  },
  {
    id: "3",
    name: "Jordan Lee",
    avatar: "JL",
    title: "UI Engineer",
    location: "New York, NY",
    experience: "5 yrs",
    skills: ["React", "CSS", "Figma"],
    appliedAt: "Yesterday",
    status: "shortlisted",
    match: 91,
    starred: true,
    resumeUrl: "#",
  },
  {
    id: "4",
    name: "Sam Wilson",
    avatar: "SW",
    title: "Full Stack Developer",
    location: "Austin, TX",
    experience: "7 yrs",
    skills: ["React", "Node.js", "PostgreSQL"],
    appliedAt: "Yesterday",
    status: "interview",
    match: 79,
    starred: false,
    resumeUrl: "#",
  },
  {
    id: "5",
    name: "Casey Morgan",
    avatar: "CM",
    title: "Frontend Engineer",
    location: "Remote",
    experience: "3 yrs",
    skills: ["React", "TypeScript", "Testing"],
    appliedAt: "2d ago",
    status: "offered",
    match: 85,
    starred: false,
    resumeUrl: "#",
  },
  {
    id: "6",
    name: "Taylor Brooks",
    avatar: "TB",
    title: "React Developer",
    location: "Seattle, WA",
    experience: "5 yrs",
    skills: ["React", "Redux", "CSS Modules"],
    appliedAt: "2d ago",
    status: "rejected",
    match: 62,
    starred: false,
    resumeUrl: "#",
  },
  {
    id: "7",
    name: "Morgan Davis",
    avatar: "MD",
    title: "Senior Frontend Eng.",
    location: "Chicago, IL",
    experience: "8 yrs",
    skills: ["React", "TypeScript", "Performance"],
    appliedAt: "3d ago",
    status: "reviewing",
    match: 90,
    starred: true,
    resumeUrl: "#",
  },
  {
    id: "8",
    name: "Jamie Chen",
    avatar: "JC",
    title: "UI/Frontend Developer",
    location: "Los Angeles, CA",
    experience: "2 yrs",
    skills: ["React", "CSS", "JavaScript"],
    appliedAt: "4d ago",
    status: "new",
    match: 71,
    starred: false,
    resumeUrl: "#",
  },
];

const STATUS_META: Record<AppStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "sNew" },
  reviewing: { label: "Reviewing", cls: "sReviewing" },
  shortlisted: { label: "Shortlisted", cls: "sShortlisted" },
  interview: { label: "Interview", cls: "sInterview" },
  offered: { label: "Offered", cls: "sOffered" },
  rejected: { label: "Rejected", cls: "sRejected" },
};

const PIPELINE: AppStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
];

export default function ApplicantsPage() {
  const [apps, setApps] = useState(APPLICANTS);
  const [filter, setFilter] = useState<AppStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"match" | "date" | "name">("match");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleStar = (id: string) =>
    setApps((p) =>
      p.map((a) => (a.id === id ? { ...a, starred: !a.starred } : a)),
    );

  const changeStatus = (id: string, status: AppStatus) =>
    setApps((p) => p.map((a) => (a.id === id ? { ...a, status } : a)));

  const toggleSelect = (id: string) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const filtered = useMemo(() => {
    let list = apps;
    if (filter !== "all") list = list.filter((a) => a.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) || a.title.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "match") return b.match - a.match;
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [apps, filter, search, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length };
    PIPELINE.forEach((s) => {
      c[s] = apps.filter((a) => a.status === s).length;
    });
    return c;
  }, [apps]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/employer/jobs" className={styles.back}>
          <ArrowLeft size={14} /> Back to jobs
        </Link>
        <div className={styles.headerMain}>
          <div>
            <h1 className={styles.title}>Senior Frontend Engineer</h1>
            <p className={styles.subtitle}>
              {apps.length} applicants · Remote · Posted Mar 1, 2026
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={`${styles.btn} ${styles.btnGhost}`}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline counts */}
      <div className={styles.pipeline}>
        {PIPELINE.map((s) => {
          const meta = STATUS_META[s];
          return (
            <button
              key={s}
              className={`${styles.pipelineStep} ${filter === s ? styles.pipelineActive : ""}`}
              onClick={() => setFilter(filter === s ? "all" : s)}
            >
              <span className={`${styles.pipelineChip} ${styles[meta.cls]}`}>
                {counts[s]}
              </span>
              <span className={styles.pipelineLabel}>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search applicants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.sortWrap}>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => setSortOpen((p) => !p)}
          >
            <SlidersHorizontal size={13} /> Sort:{" "}
            {sort.charAt(0).toUpperCase() + sort.slice(1)}{" "}
            <ChevronDown size={12} />
          </button>
          {sortOpen && (
            <div className={styles.dropdown}>
              {(["match", "date", "name"] as const).map((o) => (
                <button
                  key={o}
                  className={`${styles.dropItem} ${sort === o ? styles.dropActive : ""}`}
                  onClick={() => {
                    setSort(o);
                    setSortOpen(false);
                  }}
                >
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <div className={styles.bulkActions}>
            <span>{selected.length} selected</span>
            <button
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            >
              <Calendar size={12} /> Schedule
            </button>
            <button
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            >
              <MessageSquare size={12} /> Message
            </button>
            <button
              className={`${styles.btn} ${styles.btnDangerGhost} ${styles.btnSm}`}
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        )}
      </div>

      {/* Table head */}
      {filtered.length > 0 && (
        <div className={styles.tableHead}>
          <input
            type="checkbox"
            onChange={(e) =>
              setSelected(e.target.checked ? filtered.map((a) => a.id) : [])
            }
            checked={selected.length === filtered.length && filtered.length > 0}
          />
          <span>Candidate</span>
          <span>Experience</span>
          <span>Skills</span>
          <span>Applied</span>
          <span>Match</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
      )}

      {/* Applicant rows */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <Users
              size={32}
              style={{ color: "var(--text-muted)", marginBottom: 12 }}
            />
            <p>No applicants found</p>
            <span>
              {search
                ? `No results for "${search}"`
                : "No applications in this stage yet"}
            </span>
          </div>
        ) : (
          filtered.map((app) => {
            const meta = STATUS_META[app.status];
            const isSelected = selected.includes(app.id);
            return (
              <div
                key={app.id}
                className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(app.id)}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Candidate info */}
                <div className={styles.candidate}>
                  <div className={styles.avatar}>{app.avatar}</div>
                  <div className={styles.candidateInfo}>
                    <div className={styles.candidateName}>
                      <Link
                        href={`/employer/applicants/${app.id}`}
                        className={styles.nameLink}
                      >
                        {app.name}
                      </Link>
                      <button
                        className={`${styles.starBtn} ${app.starred ? styles.starActive : ""}`}
                        onClick={() => toggleStar(app.id)}
                      >
                        <Star
                          size={13}
                          style={{ fill: app.starred ? "#f59e0b" : "none" }}
                        />
                      </button>
                    </div>
                    <p className={styles.candidateTitle}>{app.title}</p>
                    <p className={styles.candidateLocation}>{app.location}</p>
                  </div>
                </div>

                <span className={styles.experience}>{app.experience}</span>

                <div className={styles.skills}>
                  {app.skills.slice(0, 2).map((s) => (
                    <span key={s} className={styles.skill}>
                      {s}
                    </span>
                  ))}
                  {app.skills.length > 2 && (
                    <span className={styles.skillMore}>
                      +{app.skills.length - 2}
                    </span>
                  )}
                </div>

                <span className={styles.appliedAt}>
                  <Clock size={10} /> {app.appliedAt}
                </span>

                {/* Match ring */}
                <div className={styles.matchWrap}>
                  <div
                    className={styles.matchRing}
                    style={{ "--pct": app.match } as React.CSSProperties}
                  >
                    <span
                      className={styles.matchNum}
                      style={{
                        color:
                          app.match >= 90
                            ? "var(--status-success)"
                            : app.match >= 75
                              ? "var(--color-secondary)"
                              : "#f59e0b",
                      }}
                    >
                      {app.match}%
                    </span>
                  </div>
                </div>

                {/* Status dropdown */}
                <div className={styles.statusWrap}>
                  <select
                    className={`${styles.statusSelect} ${styles[meta.cls]}`}
                    value={app.status}
                    onChange={(e) =>
                      changeStatus(app.id, e.target.value as AppStatus)
                    }
                  >
                    {PIPELINE.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row actions */}
                <div className={styles.rowActions}>
                  <Link
                    href={`/employer/applicants/${app.id}`}
                    className={styles.actionBtn}
                    title="View profile"
                  >
                    <Eye size={14} />
                  </Link>
                  <Link
                    href={`/employer/messages?to=${app.id}`}
                    className={styles.actionBtn}
                    title="Message"
                  >
                    <MessageSquare size={14} />
                  </Link>
                  <button
                    className={styles.actionBtn}
                    title="Schedule interview"
                  >
                    <Calendar size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <p className={styles.footer}>
          Showing {filtered.length} of {apps.length} applicants
        </p>
      )}
    </div>
  );
}
