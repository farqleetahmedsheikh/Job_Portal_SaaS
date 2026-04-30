/** @format */
"use client";

import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "../admin.module.css";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (search) params.set("search", search);
    try {
      const res = await api<{ data: AdminUser[] }>(
        `${API_BASE}/admin/users?${params.toString()}`,
      );
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  }, [role, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleUser(user: AdminUser) {
    await api(`${API_BASE}/admin/users/${user.id}`, "PATCH", {
      isActive: !user.isActive,
    });
    await load();
  }

  async function changeRole(id: string, nextRole: string) {
    await api(`${API_BASE}/admin/users/${id}`, "PATCH", { role: nextRole });
    await load();
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Access control</p>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>Search, ban, unban, and manage operational roles.</p>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.toolbar}>
        <input
          className={styles.input}
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {["applicant", "employer", "admin", "super_admin", "supervisor"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <button className={styles.btn} onClick={load}>Apply filters</button>
      </div>
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.fullName}</strong>
                  <p>{user.email}</p>
                </td>
                <td>
                  <select
                    className={styles.select}
                    value={user.role}
                    onChange={(e) => void changeRole(user.id, e.target.value)}
                  >
                    {["applicant", "employer", "admin", "super_admin", "supervisor"].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={`${styles.badge} ${user.isActive ? styles.success : styles.danger}`}>
                    {user.isActive ? "Active" : "Banned"}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <button
                    className={`${styles.ghostBtn} ${user.isActive ? styles.danger : styles.success}`}
                    onClick={() => void toggleUser(user)}
                  >
                    {user.isActive ? "Ban" : "Unban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && <div className={styles.empty}>No users match the current filters.</div>}
      </div>
    </div>
  );
}
