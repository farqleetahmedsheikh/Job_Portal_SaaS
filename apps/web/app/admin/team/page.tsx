/** @format */
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, formatDate } from "../../lib";
import { API_BASE } from "../../constants";
import { useUser } from "../../store/session.store";
import type { UserRole } from "../../types/user.types";
import styles from "../admin.module.css";

type StaffRole = Extract<UserRole, "super_admin" | "admin" | "supervisor">;

interface AdminStaffUser {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

const staffRoles: StaffRole[] = ["admin", "supervisor", "super_admin"];

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  role: "supervisor" as StaffRole,
};

export default function AdminTeamPage() {
  const currentUser = useUser();
  const [staff, setStaff] = useState<AdminStaffUser[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ data: AdminStaffUser[] }>(
        `${API_BASE}/admin/users/admins`,
      );
      setStaff(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin team");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api(`${API_BASE}/admin/users/admins`, "POST", form);
      setForm(initialForm);
      setSuccess("Admin team member created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin user");
      setForm((current) => ({ ...current, password: "" }));
    } finally {
      setLoading(false);
    }
  }

  async function updateStaff(user: AdminStaffUser, body: Partial<Pick<AdminStaffUser, "role" | "isActive">>) {
    setBusyUserId(user.id);
    setError(null);
    setSuccess(null);
    try {
      await api(`${API_BASE}/admin/users/${user.id}`, "PATCH", body);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update admin user");
    } finally {
      setBusyUserId(null);
    }
  }

  if (currentUser?.role && currentUser.role !== "super_admin") {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Only Super Admin users can manage the admin team.</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Super Admin</p>
          <h1 className={styles.title}>Admin Team</h1>
          <p className={styles.subtitle}>Create staff accounts and manage admin role access.</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={`${styles.error} ${styles.success}`}>{success}</div>}

      <form className={styles.panel} onSubmit={createStaff}>
        <div className={styles.panelHeader}>
          <h2>Create staff user</h2>
        </div>
        <div className={styles.formGrid}>
          <input
            className={styles.input}
            placeholder="Full name"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            required
          />
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
            minLength={8}
          />
          <select
            className={styles.select}
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })}
          >
            {staffRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.actions}>
          <button className={styles.btn} disabled={loading}>
            {loading ? "Creating..." : "Create staff user"}
          </button>
        </div>
      </form>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((user) => {
              const isSelf = user.id === currentUser?.id;
              const busy = busyUserId === user.id;
              return (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                    <p>{user.email}</p>
                  </td>
                  <td>
                    <select
                      className={styles.select}
                      value={user.role}
                      disabled={isSelf || busy}
                      onChange={(event) =>
                        void updateStaff(user, { role: event.target.value as StaffRole })
                      }
                    >
                      {staffRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${user.isActive ? styles.success : styles.danger}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button
                      className={`${styles.ghostBtn} ${user.isActive ? styles.danger : styles.success}`}
                      disabled={isSelf || busy}
                      onClick={() => void updateStaff(user, { isActive: !user.isActive })}
                    >
                      {busy ? "Saving..." : user.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!staff.length && <div className={styles.empty}>No admin staff users found.</div>}
      </div>
    </div>
  );
}
