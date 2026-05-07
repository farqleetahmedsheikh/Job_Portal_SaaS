/** @format */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, CheckCircle2 } from "lucide-react";
import { api, formatDate } from "../../lib";
import { API_BASE } from "../../constants";
import { useUser } from "../../store/session.store";
import styles from "../admin.module.css";

type ComplaintStatus = "open" | "in_progress" | "resolved";
type ComplaintType = "billing" | "employer" | "candidate" | "bug";

interface Assignee {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  role: "admin" | "supervisor";
}

interface Complaint {
  id: string;
  type: ComplaintType;
  message: string;
  status: ComplaintStatus;
  assignedTo: string | null;
  adminNote: string | null;
  response: string | null;
  createdAt: string;
  user: { name: string; email: string; role: string } | null;
  assignee: Assignee | null;
}

interface AiSuggestion {
  suggestion: string;
  summary: string;
  recommendedAction: string;
  riskLevel: "low" | "medium" | "high";
}

type ComplaintUpdate = Partial<Pick<Complaint, "status" | "adminNote" | "response">> & {
  assignedTo?: string | null;
};

const statuses: ComplaintStatus[] = ["open", "in_progress", "resolved"];
const types: ComplaintType[] = ["billing", "employer", "candidate", "bug"];

export default function AdminComplaintsPage() {
  const currentUser = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [note, setNote] = useState("");
  const [response, setResponse] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [ai, setAi] = useState<AiSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    try {
      const res = await api<{ data: Complaint[] }>(
        `${API_BASE}/admin/complaints?${params.toString()}`,
      );
      setComplaints(res.data);
      setSelected((current) => {
        const next = current
          ? res.data.find((complaint) => complaint.id === current.id) ?? res.data[0] ?? null
          : res.data[0] ?? null;
        setNote(next?.adminNote ?? "");
        setResponse(next?.response ?? "");
        setAssignedTo(next?.assignedTo ?? "");
        return next;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load complaints");
    }
  }, [status, type]);

  const loadAssignees = useCallback(async () => {
    if (currentUser?.role !== "admin" && currentUser?.role !== "super_admin") {
      setAssignees([]);
      return;
    }
    try {
      const res = await api<{ data: Assignee[] }>(
        `${API_BASE}/admin/complaints/assignees`,
      );
      setAssignees(res.data);
    } catch {
      setAssignees([]);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadAssignees();
  }, [loadAssignees]);

  function selectComplaint(complaint: Complaint) {
    setSelected(complaint);
    setAi(null);
    setNote(complaint.adminNote ?? "");
    setResponse(complaint.response ?? "");
    setAssignedTo(complaint.assignedTo ?? "");
  }

  async function saveComplaint(body: ComplaintUpdate) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<Complaint>(
        `${API_BASE}/admin/complaints/${selected.id}`,
        "PATCH",
        body,
      );
      selectComplaint(updated);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update complaint");
    } finally {
      setSaving(false);
    }
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
      setError(err instanceof Error ? err.message : "AI support draft failed");
    } finally {
      setLoadingAi(false);
    }
  }

  const isSupervisor = currentUser?.role === "supervisor";
  const canAssignSelf = isSupervisor && selected?.assignedTo === null;
  const canEdit =
    !isSupervisor || (selected?.assignedTo != null && selected.assignedTo === currentUser?.id);
  const canAssignOthers = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Support operations</p>
          <h1 className={styles.title}>Complaints</h1>
          <p className={styles.subtitle}>
            Assign, resolve, and draft support replies with review-first AI assistance.
          </p>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.toolbar}>
        <select className={styles.select} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select className={styles.select} value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">All types</option>
          {types.map((item) => (
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
                onClick={() => selectComplaint(complaint)}
              >
                <div>
                  <h3>{complaint.type} · {complaint.status}</h3>
                  <p>{complaint.message}</p>
                  <p>
                    {complaint.user?.email ?? "Unknown user"} · Assigned to{" "}
                    {complaint.assignee?.name ?? complaint.assignee?.fullName ?? "Unassigned"} ·{" "}
                    {formatDate(complaint.createdAt)}
                  </p>
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
              <p className={styles.subtitle}>
                Assignee: {selected.assignee?.name ?? selected.assignee?.fullName ?? "Unassigned"}
              </p>

              {canAssignOthers && (
                <div className={styles.toolbar}>
                  <select
                    className={styles.select}
                    value={assignedTo}
                    onChange={(event) => setAssignedTo(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.fullName ?? assignee.name ?? assignee.email} · {assignee.role}
                      </option>
                    ))}
                  </select>
                  <button
                    className={styles.ghostBtn}
                    disabled={saving}
                    onClick={() => void saveComplaint({ assignedTo: assignedTo || null })}
                  >
                    Assign
                  </button>
                </div>
              )}

              {canAssignSelf && (
                <button
                  className={styles.btn}
                  disabled={saving}
                  onClick={() => void saveComplaint({ assignedTo: currentUser?.id ?? null })}
                >
                  Assign to me
                </button>
              )}

              <textarea
                className={styles.textarea}
                placeholder="Internal notes"
                value={note}
                disabled={!canEdit}
                onChange={(event) => setNote(event.target.value)}
              />
              <textarea
                className={styles.textarea}
                placeholder="Customer response"
                value={response}
                disabled={!canEdit}
                onChange={(event) => setResponse(event.target.value)}
              />
              <div className={styles.actions}>
                <button className={styles.ghostBtn} onClick={askAi} disabled={loadingAi || !canEdit}>
                  <Bot size={16} /> {loadingAi ? "Drafting..." : "Ask AI Assistant"}
                </button>
                <button
                  className={styles.ghostBtn}
                  disabled={saving || !canEdit}
                  onClick={() => void saveComplaint({ adminNote: note })}
                >
                  Save note
                </button>
                <button
                  className={styles.ghostBtn}
                  disabled={saving || !canEdit}
                  onClick={() => void saveComplaint({ status: "in_progress", adminNote: note })}
                >
                  Mark in progress
                </button>
                <button
                  className={styles.btn}
                  disabled={saving || !canEdit}
                  onClick={() => void saveComplaint({ status: "resolved", adminNote: note, response })}
                >
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
                    onChange={(event) => setAi({ ...ai, suggestion: event.target.value })}
                  />
                  <div className={styles.actions}>
                    <button className={styles.ghostBtn} onClick={() => setResponse(ai.suggestion)}>
                      Use draft
                    </button>
                  </div>
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
