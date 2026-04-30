/** @format */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, CheckCircle2 } from "lucide-react";
import { api, formatDate } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "../admin.module.css";

interface Complaint {
  id: string;
  type: string;
  message: string;
  status: string;
  assignedTo: string | null;
  adminNote: string | null;
  response: string | null;
  createdAt: string;
  user: { name: string; email: string; role: string } | null;
}

interface AiSuggestion {
  suggestion: string;
  summary: string;
  recommendedAction: string;
  riskLevel: "low" | "medium" | "high";
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [ai, setAi] = useState<AiSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    try {
      const res = await api<{ data: Complaint[] }>(
        `${API_BASE}/admin/complaints?${params.toString()}`,
      );
      setComplaints(res.data);
      setSelected((current) => current ?? res.data[0] ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load complaints");
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateComplaint(nextStatus: string) {
    if (!selected) return;
    await api(`${API_BASE}/admin/complaints/${selected.id}`, "PATCH", {
      status: nextStatus,
      adminNote: note || selected.adminNote,
      response: ai?.suggestion ?? selected.response,
    });
    setAi(null);
    await load();
  }

  async function askAi() {
    if (!selected) return;
    setLoadingAi(true);
    setError(null);
    try {
      const result = await api<AiSuggestion>(
        `${API_BASE}/admin/ai-support/suggest-reply`,
        "POST",
        { complaintId: selected.id, tone: "professional", notes: note },
      );
      setAi(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI assistant failed");
    } finally {
      setLoadingAi(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Support operations</p>
          <h1 className={styles.title}>Complaints</h1>
          <p className={styles.subtitle}>Assign, resolve, and draft support replies with review-first AI assistance.</p>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.toolbar}>
        <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["open", "in_progress", "resolved"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <button className={styles.btn} onClick={load}>Apply</button>
      </div>
      <section className={styles.twoCol}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}><h2>Queue</h2></div>
          <div className={styles.list}>
            {complaints.map((complaint) => (
              <button
                key={complaint.id}
                className={styles.row}
                onClick={() => {
                  setSelected(complaint);
                  setAi(null);
                  setNote(complaint.adminNote ?? "");
                }}
              >
                <div>
                  <h3>{complaint.type} · {complaint.status}</h3>
                  <p>{complaint.message}</p>
                  <p>{complaint.user?.email} · {formatDate(complaint.createdAt)}</p>
                </div>
              </button>
            ))}
            {!complaints.length && <div className={styles.empty}>No complaints in this queue.</div>}
          </div>
        </div>
        <div className={styles.panel}>
          {selected ? (
            <>
              <div className={styles.panelHeader}>
                <div>
                  <h2>{selected.type} complaint</h2>
                  <p className={styles.subtitle}>{selected.user?.name} · {selected.user?.email}</p>
                </div>
                <span className={styles.badge}>{selected.status}</span>
              </div>
              <p>{selected.message}</p>
              <textarea
                className={styles.textarea}
                placeholder="Internal notes"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className={styles.actions}>
                <button className={styles.ghostBtn} onClick={askAi} disabled={loadingAi}>
                  <Bot size={16} /> {loadingAi ? "Thinking..." : "Ask AI Assistant"}
                </button>
                <button className={styles.ghostBtn} onClick={() => void updateComplaint("in_progress")}>
                  Mark in progress
                </button>
                <button className={styles.btn} onClick={() => void updateComplaint("resolved")}>
                  <CheckCircle2 size={16} /> Resolve
                </button>
              </div>
              {ai && (
                <div className={styles.aiBox}>
                  <span className={`${styles.badge} ${ai.riskLevel === "high" ? styles.danger : ai.riskLevel === "medium" ? styles.warning : styles.success}`}>
                    Risk: {ai.riskLevel}
                  </span>
                  <strong>Summary</strong>
                  <p>{ai.summary}</p>
                  <strong>Suggested reply</strong>
                  <textarea
                    className={styles.textarea}
                    value={ai.suggestion}
                    onChange={(e) => setAi({ ...ai, suggestion: e.target.value })}
                  />
                  <strong>Recommended action</strong>
                  <p>{ai.recommendedAction}</p>
                </div>
              )}
            </>
          ) : (
            <div className={styles.empty}>Select a complaint to inspect details.</div>
          )}
        </div>
      </section>
    </div>
  );
}
