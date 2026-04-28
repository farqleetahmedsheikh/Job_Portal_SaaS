/** @format */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib";
import { API_BASE } from "../../../constants";
import styles from "../templates.module.css";

interface ContractTemplate {
  id: string;
  title: string;
  type: "contract" | "offer_letter";
  body: string;
  isDefault?: boolean;
  isAdvanced?: boolean;
}

interface ContractsResponse {
  canUseBasicTemplates: boolean;
  canCustomize: boolean;
  canUseAdvancedTemplates: boolean;
  defaults: ContractTemplate[];
  custom: ContractTemplate[];
}

export default function ContractTemplatesPage() {
  const [data, setData] = useState<ContractsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ContractsResponse>(`${API_BASE}/templates/contracts`, "GET")
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
          <h1 className={styles.title}>Contract Templates</h1>
          <p className={styles.subtitle}>
            Start with standard contracts and unlock customization on Growth.
          </p>
        </div>
        <Link href="/employer/billing" className={styles.btn}>
          View plan options
        </Link>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Basic templates</h2>
          <p>Available on Starter and above for faster offer workflows.</p>
          <span className={`${styles.badge} ${!data?.canUseBasicTemplates ? styles.locked : ""}`}>
            {data?.canUseBasicTemplates ? "Included" : "Starter required"}
          </span>
        </div>
        <div className={styles.card}>
          <h2>Custom templates</h2>
          <p>Create reusable company-specific contracts and offer letters.</p>
          <span className={`${styles.badge} ${!data?.canCustomize ? styles.locked : ""}`}>
            {data?.canCustomize ? "Unlocked" : "Growth required"}
          </span>
        </div>
      </div>

      <div className={styles.list}>
        {(data?.defaults ?? []).concat(data?.custom ?? []).map((template) => (
          <article key={template.id} className={styles.template}>
            <div className={styles.meta}>
              <span className={styles.badge}>{template.type.replace("_", " ")}</span>
              {template.isAdvanced && <span className={styles.badge}>Scale</span>}
              {template.isDefault && <span className={styles.badge}>Default</span>}
            </div>
            <h3>{template.title}</h3>
            <p className={styles.body}>{template.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
