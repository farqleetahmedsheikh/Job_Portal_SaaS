/** @format */
"use client";

import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "../admin.module.css";

interface CompanyRow {
  id: string;
  companyName: string;
  verificationStatus: string;
  isVerified: boolean;
  activeJobs: number;
  createdAt: string;
  owner: { name: string; email: string } | null;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("verificationStatus", status);
    try {
      const res = await api<{ data: CompanyRow[] }>(
        `${API_BASE}/admin/companies?${params.toString()}`,
      );
      setCompanies(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function verify(id: string) {
    await api(`${API_BASE}/admin/companies/${id}/verify`, "PATCH");
    await load();
  }

  async function reject(id: string) {
    await api(`${API_BASE}/admin/companies/${id}/reject`, "PATCH", {
      reason: "Rejected from admin panel",
    });
    await load();
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Company operations</p>
          <h1 className={styles.title}>Companies</h1>
          <p className={styles.subtitle}>Review company verification and platform presence.</p>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.toolbar}>
        <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All verification states</option>
          {["unverified", "pending", "verified", "rejected", "expired"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <button className={styles.btn} onClick={load}>Apply</button>
      </div>
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Company</th>
              <th>Owner</th>
              <th>Verification</th>
              <th>Active jobs</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td><strong>{company.companyName}</strong></td>
                <td>
                  {company.owner?.name ?? "Unknown"}
                  <p>{company.owner?.email}</p>
                </td>
                <td>
                  <span className={`${styles.badge} ${company.isVerified ? styles.success : styles.warning}`}>
                    {company.verificationStatus}
                  </span>
                </td>
                <td>{company.activeJobs}</td>
                <td>{formatDate(company.createdAt)}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.ghostBtn} onClick={() => void verify(company.id)}>
                      Verify
                    </button>
                    <button className={`${styles.ghostBtn} ${styles.danger}`} onClick={() => void reject(company.id)}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!companies.length && <div className={styles.empty}>No companies found.</div>}
      </div>
    </div>
  );
}
