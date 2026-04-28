/** @format */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib";
import { API_BASE } from "../../../constants";
import styles from "../templates.module.css";

interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  isDefault?: boolean;
}

interface EmailsResponse {
  canCustomize: boolean;
  defaults: EmailTemplate[];
  custom: EmailTemplate[];
}

export default function EmailTemplatesPage() {
  const [data, setData] = useState<EmailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<EmailsResponse>(`${API_BASE}/templates/emails`, "GET")
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load templates"),
      );
  }, []);

  if (error) return <div className={styles.page}>{error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Email Templates</h1>
          <p className={styles.subtitle}>
            Preview default candidate emails and unlock branded customization on Growth.
          </p>
        </div>
        <Link href="/employer/billing" className={styles.btn}>
          Upgrade to customize
        </Link>
      </div>

      <div className={styles.card}>
        <h2>Customization</h2>
        <p>
          {data?.canCustomize
            ? "Your plan can customize candidate communication templates."
            : "Free and Starter use professional defaults. Growth unlocks custom email templates."}
        </p>
        <span className={`${styles.badge} ${!data?.canCustomize ? styles.locked : ""}`}>
          {data?.canCustomize ? "Unlocked" : "Growth required"}
        </span>
      </div>

      <div className={styles.list}>
        {(data?.defaults ?? []).concat(data?.custom ?? []).map((template) => (
          <article key={template.id} className={styles.template}>
            <div className={styles.meta}>
              <span className={styles.badge}>{template.type.replaceAll("_", " ")}</span>
              {template.isDefault && <span className={styles.badge}>Default</span>}
            </div>
            <h3>{template.subject}</h3>
            <p className={styles.body}>{template.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
