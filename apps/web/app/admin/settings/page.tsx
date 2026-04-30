/** @format */

import styles from "../admin.module.css";

export default function AdminSettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin configuration</p>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>
            System-critical configuration is reserved for Super Admin users.
          </p>
        </div>
      </div>
      <section className={styles.grid}>
        <article className={styles.card}>
          <span>Super Admin</span>
          <strong>Full control</strong>
          <p>Can create admins, manage roles, view revenue, and access monitoring.</p>
        </article>
        <article className={styles.card}>
          <span>Admin</span>
          <strong>Operations</strong>
          <p>Can manage users, companies, complaints, billing metadata, and logs.</p>
        </article>
        <article className={styles.card}>
          <span>Supervisor</span>
          <strong>Support</strong>
          <p>Can handle complaint queues and use AI support drafts for review.</p>
        </article>
        <article className={styles.card}>
          <span>Future-ready</span>
          <strong>RBAC-first</strong>
          <p>New roles can be added through the admin role guard and route metadata.</p>
        </article>
      </section>
    </div>
  );
}
