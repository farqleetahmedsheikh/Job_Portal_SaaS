/** @format */
"use client";

import { useCallback, useEffect, useState } from "react";
import { api, formatDate } from "../../lib";
import { API_BASE } from "../../constants";
import { useUser } from "../../store/session.store";
import type { UserRole } from "../../types/user.types";
import styles from "../admin.module.css";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

const allRoles: UserRole[] = ["applicant", "employer", "admin", "super_admin", "supervisor"];
const normalRoles: UserRole[] = ["applicant", "employer"];

function isStaffRole(role: UserRole) {
  return role === "admin" || role === "super_admin" || role === "supervisor";
}

export default function AdminUsersPage() {
  const currentUser = useUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (search) params.set("search", search);
    setLoading(true);
    try {
      const res = await api<{ data: AdminUser[] }>(
        `${API_BASE}/admin/users?${params.toString()}`,
      );
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [role, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleUser(user: AdminUser) {
    setBusyUserId(user.id);
    setError(null);
    try {
      await api(`${API_BASE}/admin/users/${user.id}`, "PATCH", {
        isActive: !user.isActive,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setBusyUserId(null);
    }
  }

  async function changeRole(id: string, nextRole: UserRole) {
    setBusyUserId(id);
    setError(null);
    try {
      await api(`${API_BASE}/admin/users/${id}`, "PATCH", { role: nextRole });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusyUserId(null);
    }
  }

  if (currentUser?.role === "supervisor") {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Supervisors can only access the support complaint queue.</div>
      </div>
    );
  }

  const roleOptions = currentUser?.role === "super_admin" ? allRoles : normalRoles;

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
          {roleOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <button className={styles.btn} onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Apply filters"}
        </button>
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
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              const busy = busyUserId === user.id;
              const canChangeRole = currentUser?.role === "super_admin" && !isSelf;
              const canToggle =
                !isSelf &&
                (currentUser?.role === "super_admin" ||
                  (currentUser?.role === "admin" && !isStaffRole(user.role)));

              return (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                    <p>{user.email}</p>
                  </td>
                  <td>
                    {canChangeRole ? (
                      <select
                        className={styles.select}
                        value={user.role}
                        disabled={busy}
                        onChange={(e) => void changeRole(user.id, e.target.value as UserRole)}
                      >
                        {allRoles.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={styles.badge}>{user.role}</span>
                    )}
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
                      disabled={!canToggle || busy}
                      onClick={() => void toggleUser(user)}
                    >
                      {busy ? "Saving..." : user.isActive ? "Ban" : "Unban"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!users.length && <div className={styles.empty}>No users match the current filters.</div>}
      </div>
    </div>
  );
}
