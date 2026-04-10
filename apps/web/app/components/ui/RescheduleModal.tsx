/* eslint-disable @typescript-eslint/no-explicit-any */
/** @format */
"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";
import { api } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "../styles/schedule-modal.module.css";

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hr" },
  { value: 90, label: "1.5 hr" },
  { value: 120, label: "2 hr" },
];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

interface Props {
  interviewId: string;
  candidateName: string;
  currentScheduledAt: string;
  currentDuration: number;
  onClose: () => void;
  onRescheduled: () => void;
}

export function RescheduleModal({
  interviewId,
  candidateName,
  currentScheduledAt,
  currentDuration,
  onClose,
  onRescheduled,
}: Props) {
  const cur = new Date(currentScheduledAt);
  const [date, setDate] = useState(cur.toISOString().split("T")[0]);
  const [time, setTime] = useState(cur.toTimeString().slice(0, 5));
  const [duration, setDuration] = useState(currentDuration);
  const [meetLink, setMeetLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!date || !time) {
      setError("Date and time are required.");
      return;
    }
    const scheduledAt = new Date(`${date}T${time}:00`);
    if (scheduledAt <= new Date()) {
      setError("Please pick a future date and time.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api(`${API_BASE}/interviews/${interviewId}/reschedule`, "PATCH", {
        scheduledAt: scheduledAt.toISOString(),
        durationMins: duration,
        meetLink: meetLink || undefined,
      });
      onRescheduled();
    } catch (e: any) {
      setError(e.message ?? "Failed to reschedule.");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Reschedule interview</h2>
            <p className={styles.titleSub}>{candidateName}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>
                <Calendar size={11} /> New date
              </label>
              <input
                className={styles.input}
                type="date"
                value={date}
                min={tomorrow()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                <Clock size={11} /> New time
              </label>
              <input
                className={styles.input}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Duration</label>
            <div className={styles.pillRow}>
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`${styles.pill} ${duration === d.value ? styles.pillActive : ""}`}
                  onClick={() => setDuration(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <LinkIcon size={11} /> New meet link{" "}
              <span className={styles.optional}>(optional)</span>
            </label>
            <input
              className={styles.input}
              placeholder="Leave blank to keep existing link"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
            />
          </div>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} /> Saving…
              </>
            ) : (
              <>
                <Calendar size={13} /> Confirm reschedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
