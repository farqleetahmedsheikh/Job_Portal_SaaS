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
  XCircle,
  MessageSquare,
  Edit2,
  Copy,
  MoreVertical,
} from "lucide-react";
import { useInterviews } from "../../hooks/useInterviews";
import { CandidateAvatar } from "../../components/ui/CandidateAvatar";
import { formatDateTime } from "../../lib";
import {
  TYPE_META,
  STATUS_META,
  SCHEDULE_INIT,
  type Interview,
  type InterviewType,
  type ScheduleForm,
} from "../../types/interviews.types";
import styles from "../styles/emp-interviews.module.css";

const TYPE_ICON: Record<InterviewType, React.ReactNode> = {
  video: <Video size={13} />,
  phone: <Phone size={13} />,
  onsite: <Building2 size={13} />,
};

function isToday(iso: string) {
  const d = new Date(iso),
    t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

// ── InterviewCard ─────────────────────────────────────────────────────────────
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
  const today = isToday(iv.scheduledAt);

  return (
    <div
      className={`${styles.card} ${today ? styles.cardToday : ""} ${iv.status === "cancelled" ? styles.cardCancelled : ""}`}
    >
      {today && iv.status === "upcoming" && (
        <div className={styles.todayBanner}>
          <span className={styles.pulse} /> Today
        </div>
      )}
      <div className={styles.cardMain}>
        <div className={styles.candidate}>
          <CandidateAvatar name={iv.candidate} avatarUrl={iv.avatarUrl} />
          <div className={styles.candidateInfo}>
            <p className={styles.candidateName}>{iv.candidate}</p>
            <p className={styles.candidateRole}>{iv.role}</p>
          </div>
        </div>
        <div className={styles.timeBlock}>
          <div className={styles.timeMain}>
            <Calendar size={13} /> {formatDateTime(iv.scheduledAt)}
          </div>
          <div className={styles.timeSub}>
            <Clock size={11} /> {iv.duration} min
          </div>
        </div>
        <span className={`${styles.typeChip} ${styles[typeMeta.cls]}`}>
          {TYPE_ICON[iv.type]} {typeMeta.label}
        </span>
        <div className={styles.interviewers}>
          {iv.interviewers.map((name) => (
            <span key={name} className={styles.interviewer}>
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          ))}
          <span className={styles.interviewerNames}>
            {iv.interviewers.join(", ")}
          </span>
        </div>
        <span className={`${styles.statusChip} ${styles[statusMeta.cls]}`}>
          {statusMeta.label}
        </span>
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
                  <button
                    className={styles.moreItem}
                    onClick={() => {
                      navigator.clipboard.writeText(iv.meetLink!);
                      setShowMenu(false);
                    }}
                  >
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

// ── ScheduleModal ─────────────────────────────────────────────────────────────
function ScheduleModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (f: ScheduleForm) => Promise<void>;
  submitting: boolean;
}) {
  const [form, setForm] = useState<ScheduleForm>(SCHEDULE_INIT);
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof ScheduleForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.candidate || !form.date || !form.time) {
      setError("Candidate, date and time are required.");
      return;
    }
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule");
    }
  };

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
          {error && <p className={styles.modalError}>{error}</p>}
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Candidate *</label>
              <input
                className={styles.formInput}
                placeholder="Name"
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
                rows={3}
                placeholder="Topics to cover, special instructions…"
                value={form.notes}
                onChange={set("notes")}
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
            onClick={handleSubmit}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} /> Scheduling...
              </>
            ) : (
              <>
                <Calendar size={14} /> Schedule &amp; Send invite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EmployerInterviewsPage() {
  const {
    loading,
    error,
    filter,
    setFilter,
    showModal,
    setShowModal,
    submitting,
    todayList,
    upcomingList,
    pastList,
    filtered,
    counts,
    handleCancel,
    handleSchedule,
  } = useInterviews();

  if (loading)
    return (
      <div className={styles.page}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={styles.skeleton}
            style={{ height: 110, marginBottom: 12 }}
          />
        ))}
      </div>
    );

  if (error)
    return (
      <div className={styles.page}>
        <p className={styles.errorMsg}>{error}</p>
      </div>
    );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Interviews</h1>
          <p className={styles.subtitle}>
            {counts.upcoming} upcoming · {counts.today} today
          </p>
        </div>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} /> Schedule interview
        </button>
      </div>

      <div className={styles.statRow}>
        {[
          { label: "Total", val: counts.all, color: "var(--text-primary)" },
          {
            label: "Upcoming",
            val: counts.upcoming,
            color: "var(--color-secondary)",
          },
          { label: "Today", val: counts.today, color: "#f59e0b" },
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

      {todayList.length > 0 && (
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>
            <span className={styles.groupPulse} />
            Today · {todayList.length} interview
            {todayList.length > 1 ? "s" : ""}
          </h2>
          {todayList.map((iv) => (
            <InterviewCard key={iv.id} iv={iv} onCancel={handleCancel} />
          ))}
        </div>
      )}
      {upcomingList.length > 0 && (
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>Upcoming</h2>
          {upcomingList.map((iv) => (
            <InterviewCard key={iv.id} iv={iv} onCancel={handleCancel} />
          ))}
        </div>
      )}
      {pastList.length > 0 && (
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>Past</h2>
          {pastList.map((iv) => (
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

      {showModal && (
        <ScheduleModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSchedule}
          submitting={submitting}
        />
      )}
    </div>
  );
}
