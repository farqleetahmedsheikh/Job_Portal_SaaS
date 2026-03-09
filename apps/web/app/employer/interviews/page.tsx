/** @format */
"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Building2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Edit2,
  Users,
  Link2,
  Copy,
  MoreVertical,
} from "lucide-react";
import styles from "../../styles/emp-interviews.module.css";

type InterviewType = "video" | "phone" | "onsite";
type InterviewStatus = "upcoming" | "completed" | "cancelled";

interface Interview {
  id: string;
  candidate: string;
  avatar: string;
  role: string;
  date: string;
  time: string;
  duration: string;
  type: InterviewType;
  status: InterviewStatus;
  isToday: boolean;
  meetLink?: string;
  interviewers: string[];
  notes?: string;
}

const INTERVIEWS: Interview[] = [
  {
    id: "1",
    candidate: "Alex Rivera",
    avatar: "AR",
    role: "Senior Frontend Engineer",
    date: "Mar 10",
    time: "2:00 PM",
    duration: "45 min",
    type: "video",
    status: "upcoming",
    isToday: true,
    meetLink: "https://meet.google.com/abc-def-ghi",
    interviewers: ["Sarah Chen", "Tom Wright"],
    notes: "Strong profile. Focus on system design.",
  },
  {
    id: "2",
    candidate: "Jordan Lee",
    avatar: "JL",
    role: "Senior Frontend Engineer",
    date: "Mar 10",
    time: "4:30 PM",
    duration: "30 min",
    type: "phone",
    status: "upcoming",
    isToday: true,
    interviewers: ["Sarah Chen"],
    notes: "Initial screen.",
  },
  {
    id: "3",
    candidate: "Priya Patel",
    avatar: "PP",
    role: "React Developer",
    date: "Mar 11",
    time: "10:00 AM",
    duration: "60 min",
    type: "video",
    status: "upcoming",
    isToday: false,
    meetLink: "https://meet.google.com/xyz-uvw-rst",
    interviewers: ["James Miller", "Lisa Park"],
    notes: "Technical deep-dive.",
  },
  {
    id: "4",
    candidate: "Morgan Davis",
    avatar: "MD",
    role: "UI/UX Designer",
    date: "Mar 11",
    time: "2:00 PM",
    duration: "45 min",
    type: "onsite",
    status: "upcoming",
    isToday: false,
    interviewers: ["Casey Nguyen", "Tom Wright"],
    notes: "Portfolio review included.",
  },
  {
    id: "5",
    candidate: "Sam Wilson",
    avatar: "SW",
    role: "Backend Engineer",
    date: "Mar 8",
    time: "3:00 PM",
    duration: "60 min",
    type: "video",
    status: "completed",
    isToday: false,
    interviewers: ["Tom Wright"],
    notes: "Went well. Strong candidate.",
  },
  {
    id: "6",
    candidate: "Taylor Brooks",
    avatar: "TB",
    role: "DevOps Engineer",
    date: "Mar 7",
    time: "11:00 AM",
    duration: "30 min",
    type: "phone",
    status: "cancelled",
    isToday: false,
    interviewers: ["Sarah Chen"],
  },
];

const TYPE_META: Record<
  InterviewType,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  video: { label: "Video", icon: <Video size={13} />, cls: "typeVideo" },
  phone: { label: "Phone", icon: <Phone size={13} />, cls: "typePhone" },
  onsite: {
    label: "On-site",
    icon: <Building2 size={13} />,
    cls: "typeOnsite",
  },
};

const STATUS_META: Record<
  InterviewStatus,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  upcoming: { label: "Upcoming", icon: <Clock size={11} />, cls: "sUpcoming" },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 size={11} />,
    cls: "sCompleted",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle size={11} />,
    cls: "sCancelled",
  },
};

function InterviewCard({
  iv,
  onCancel,
}: {
  iv: Interview;
  onCancel: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const typeMeta = TYPE_META[iv.type];
  const statusMeta = STATUS_META[iv.status];

  return (
    <div
      className={`${styles.card} ${iv.isToday ? styles.cardToday : ""} ${iv.status === "cancelled" ? styles.cardCancelled : ""}`}
    >
      {iv.isToday && iv.status === "upcoming" && (
        <div className={styles.todayBanner}>
          <span className={styles.pulse} /> Today
        </div>
      )}

      <div className={styles.cardMain}>
        {/* Candidate */}
        <div className={styles.candidate}>
          <div className={styles.avatar}>{iv.avatar}</div>
          <div className={styles.candidateInfo}>
            <p className={styles.candidateName}>{iv.candidate}</p>
            <p className={styles.candidateRole}>{iv.role}</p>
          </div>
        </div>

        {/* Time */}
        <div className={styles.timeBlock}>
          <div className={styles.timeMain}>
            <Calendar size={13} /> {iv.date}
          </div>
          <div className={styles.timeSub}>
            <Clock size={11} /> {iv.time} · {iv.duration}
          </div>
        </div>

        {/* Type */}
        <span className={`${styles.typeChip} ${styles[typeMeta.cls]}`}>
          {typeMeta.icon} {typeMeta.label}
        </span>

        {/* Interviewers */}
        <div className={styles.interviewers}>
          {iv.interviewers.map((i) => (
            <span key={i} className={styles.interviewer}>
              {i
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          ))}
          <span className={styles.interviewerNames}>
            {iv.interviewers.join(", ")}
          </span>
        </div>

        {/* Status */}
        <span className={`${styles.statusChip} ${styles[statusMeta.cls]}`}>
          {statusMeta.icon} {statusMeta.label}
        </span>

        {/* Actions */}
        <div className={styles.cardActions}>
          {iv.meetLink && iv.status === "upcoming" && (
            <a
              href={iv.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
            >
              <Video size={12} /> Join
            </a>
          )}
          <button
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
          >
            <MessageSquare size={12} /> Message
          </button>
          <div className={styles.moreWrap}>
            <button
              className={styles.moreBtn}
              onClick={() => setShowMenu((p) => !p)}
            >
              <MoreVertical size={15} />
            </button>
            {showMenu && (
              <div className={styles.moreMenu}>
                <button className={styles.moreItem}>
                  <Edit2 size={12} /> Reschedule
                </button>
                {iv.meetLink && (
                  <button className={styles.moreItem}>
                    <Copy size={12} /> Copy link
                  </button>
                )}
                {iv.status === "upcoming" && (
                  <button
                    className={`${styles.moreItem} ${styles.moreItemDanger}`}
                    onClick={() => {
                      onCancel(iv.id);
                      setShowMenu(false);
                    }}
                  >
                    <XCircle size={12} /> Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {iv.notes && iv.status !== "cancelled" && (
        <div className={styles.cardNote}>{iv.notes}</div>
      )}
    </div>
  );
}

// ─── Schedule Interview Modal ──────────────────────────────
function ScheduleModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    candidate: "",
    role: "",
    date: "",
    time: "",
    type: "video",
    duration: "45",
    interviewers: "",
    notes: "",
  });
  const set =
    (k: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Schedule Interview</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <XCircle size={18} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Candidate *</label>
              <input
                className={styles.formInput}
                placeholder="Select or type name"
                value={form.candidate}
                onChange={set("candidate")}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Role</label>
              <input
                className={styles.formInput}
                placeholder="e.g. Senior Frontend Engineer"
                value={form.role}
                onChange={set("role")}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Date *</label>
              <input
                className={styles.formInput}
                type="date"
                value={form.date}
                onChange={set("date")}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Time *</label>
              <input
                className={styles.formInput}
                type="time"
                value={form.time}
                onChange={set("time")}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Duration</label>
              <select
                className={styles.formSelect}
                value={form.duration}
                onChange={set("duration")}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Interview Type</label>
              <select
                className={styles.formSelect}
                value={form.type}
                onChange={set("type")}
              >
                <option value="video">Video call</option>
                <option value="phone">Phone call</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.formLabel}>Interviewers</label>
              <input
                className={styles.formInput}
                placeholder="Names separated by comma"
                value={form.interviewers}
                onChange={set("interviewers")}
              />
            </div>
            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.formLabel}>Notes</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Topics to cover, special instructions…"
                value={form.notes}
                onChange={set("notes")}
                rows={3}
              />
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onClose}
          >
            <Calendar size={14} /> Schedule & Send invite
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployerInterviewsPage() {
  const [interviews, setInterviews] = useState(INTERVIEWS);
  const [filter, setFilter] = useState<"all" | InterviewStatus>("all");
  const [showModal, setShowModal] = useState(false);

  const handleCancel = (id: string) =>
    setInterviews((p) =>
      p.map((iv) =>
        iv.id === id ? { ...iv, status: "cancelled" as const } : iv,
      ),
    );

  const filtered = interviews.filter(
    (iv) => filter === "all" || iv.status === filter,
  );
  const today = filtered.filter((iv) => iv.isToday && iv.status === "upcoming");
  const upcoming = filtered.filter(
    (iv) => !iv.isToday && iv.status === "upcoming",
  );
  const past = filtered.filter((iv) => iv.status !== "upcoming");

  const counts = {
    all: interviews.length,
    upcoming: interviews.filter((iv) => iv.status === "upcoming").length,
    completed: interviews.filter((iv) => iv.status === "completed").length,
    cancelled: interviews.filter((iv) => iv.status === "cancelled").length,
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Interviews</h1>
          <p className={styles.subtitle}>
            {counts.upcoming} upcoming · {today.length} today
          </p>
        </div>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} /> Schedule interview
        </button>
      </div>

      {/* Stat row */}
      <div className={styles.statRow}>
        {[
          { label: "Total", val: counts.all, color: "var(--text-primary)" },
          {
            label: "Upcoming",
            val: counts.upcoming,
            color: "var(--color-secondary)",
          },
          { label: "Today", val: today.length, color: "#f59e0b" },
          {
            label: "Completed",
            val: counts.completed,
            color: "var(--status-success)",
          },
        ].map((s) => (
          <div key={s.label} className={styles.statPill}>
            <span className={styles.statVal} style={{ color: s.color }}>
              {s.val}
            </span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(["all", "upcoming", "completed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            className={`${styles.tab} ${filter === f ? styles.tabActive : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={styles.tabCount}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Today section */}
      {today.length > 0 && (
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>
            <span className={styles.groupPulse} />
            Today · {today.length} interview{today.length > 1 ? "s" : ""}
          </h2>
          {today.map((iv) => (
            <InterviewCard key={iv.id} iv={iv} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>Upcoming</h2>
          {upcoming.map((iv) => (
            <InterviewCard key={iv.id} iv={iv} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>Past</h2>
          {past.map((iv) => (
            <InterviewCard key={iv.id} iv={iv} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <Calendar
            size={32}
            style={{ color: "var(--text-muted)", marginBottom: 12 }}
          />
          <p>No interviews found</p>
          <span>Schedule an interview to get started</span>
        </div>
      )}

      {showModal && <ScheduleModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
