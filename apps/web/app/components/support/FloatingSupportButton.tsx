/** @format */
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { LifeBuoy, Send, X } from "lucide-react";
import { api, formatDate } from "../../lib";
import { API_BASE } from "../../constants";
import type { User } from "../../types/user.types";
import styles from "./floating-support.module.css";

type ComplaintType = "billing" | "employer" | "candidate" | "bug";

interface SupportTicket {
  id: string;
  type: ComplaintType;
  subject: string | null;
  message: string;
  status: "open" | "in_progress" | "resolved";
  response: string | null;
  createdAt: string;
}

const complaintTypes: ComplaintType[] = [
  "billing",
  "employer",
  "candidate",
  "bug",
];

export function FloatingSupportButton({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ComplaintType>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const enabled = user.role === "applicant" || user.role === "employer";

  useEffect(() => {
    if (!open || !enabled) return;
    api<{ data: SupportTicket[] }>(`${API_BASE}/support/complaints/my?limit=3`)
      .then((res) => setTickets(res.data))
      .catch(() => setTickets([]));
  }, [enabled, open]);

  if (!enabled) return null;

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const ticket = await api<SupportTicket>(
        `${API_BASE}/support/complaints`,
        "POST",
        { type, subject: subject.trim() || undefined, message },
      );
      setSubject("");
      setMessage("");
      setSuccess(`Ticket created with status: ${ticket.status}`);
      setTickets((current) => [ticket, ...current].slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.support}>
      {open && (
        <section className={styles.panel} aria-label="Support ticket panel">
          <header className={styles.header}>
            <div>
              <strong>Hi, how can we help?</strong>
              <span>Send a support ticket to the HiringFly team.</span>
            </div>
            <button
              className={styles.iconButton}
              onClick={() => setOpen(false)}
              aria-label="Close support"
            >
              <X size={17} />
            </button>
          </header>

          <form className={styles.form} onSubmit={submitTicket}>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as ComplaintType)}
            >
              {complaintTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject (optional)"
              maxLength={180}
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe the issue or question"
              minLength={10}
              maxLength={4000}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}
            <button className={styles.submit} disabled={loading}>
              <Send size={15} />
              {loading ? "Sending..." : "Submit ticket"}
            </button>
          </form>

          <div className={styles.tickets}>
            <strong>My tickets</strong>
            {tickets.map((ticket) => (
              <div key={ticket.id} className={styles.ticket}>
                <span>
                  {ticket.subject ?? ticket.type} · {ticket.status}
                </span>
                <p>{ticket.response ?? ticket.message}</p>
                <small>{formatDate(ticket.createdAt)}</small>
              </div>
            ))}
            {!tickets.length && <p className={styles.muted}>No tickets yet.</p>}
          </div>
        </section>
      )}

      <button className={styles.fab} onClick={() => setOpen((value) => !value)}>
        <LifeBuoy size={20} />
        Support
      </button>
    </div>
  );
}
