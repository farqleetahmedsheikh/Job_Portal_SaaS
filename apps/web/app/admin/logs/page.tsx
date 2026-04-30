/** @format */
"use client";

import { useCallback, useEffect, useState } from "react";
import { api, formatDateTime } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "../admin.module.css";

interface SystemLog {
  id: string;
  level: "info" | "warning" | "error";
  message: string;
  route: string | null;
  method: string | null;
  createdAt: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [level, setLevel] = useState("");
  const [route, setRoute] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (level) params.set("level", level);
    if (route) params.set("route", route);
    try {
      const res = await api<{ data: SystemLog[] }>(
        `${API_BASE}/admin/logs?${params.toString()}`,
      );
      setLogs(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    }
  }, [level, route]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Production monitoring</p>
          <h1 className={styles.title}>Logs & Error Tracking</h1>
          <p className={styles.subtitle}>Track API warnings and failures captured by the global exception filter.</p>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.toolbar}>
        <select className={styles.select} value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <input className={styles.input} placeholder="Filter route" value={route} onChange={(e) => setRoute(e.target.value)} />
        <button className={styles.btn} onClick={load}>Apply</button>
      </div>
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead><tr><th>Level</th><th>Route</th><th>Message</th><th>Timestamp</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span className={`${styles.badge} ${log.level === "error" ? styles.danger : log.level === "warning" ? styles.warning : ""}`}>
                    {log.level}
                  </span>
                </td>
                <td>{log.method} {log.route}</td>
                <td>{log.message}</td>
                <td>{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length && <div className={styles.empty}>No matching logs. A quiet monitor is a beautiful thing.</div>}
      </div>
    </div>
  );
}
