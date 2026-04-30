/** @format */
"use client";

import { useEffect, useState } from "react";
import { api, formatDate } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "../admin.module.css";

interface Transaction {
  id: string;
  source: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  plan: string | null;
  date: string;
  user: { fullName: string; email: string } | null;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  billingInterval: string;
  trialEndAt: string | null;
  currentPeriodEnd: string | null;
  user: { fullName: string; email: string } | null;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ data: Transaction[] }>(`${API_BASE}/admin/transactions`),
      api<{ data: Subscription[] }>(`${API_BASE}/admin/subscriptions`),
    ])
      .then(([tx, subs]) => {
        setTransactions(tx.data);
        setSubscriptions(subs.data);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load billing data"),
      );
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Billing operations</p>
          <h1 className={styles.title}>Transactions</h1>
          <p className={styles.subtitle}>Safe payment metadata, subscription state, and one-time purchases.</p>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <section className={styles.twoCol}>
        <div className={styles.tableCard}>
          <div className={styles.panelHeader}><h2>Recent transactions</h2></div>
          <table className={styles.table}>
            <thead><tr><th>Type</th><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.type}<p>{tx.source}</p></td>
                  <td>{tx.user?.email ?? "Company"}</td>
                  <td>{tx.currency} {tx.amount.toLocaleString()}</td>
                  <td><span className={styles.badge}>{tx.status}</span></td>
                  <td>{formatDate(tx.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!transactions.length && <div className={styles.empty}>No transactions recorded yet.</div>}
        </div>
        <div className={styles.tableCard}>
          <div className={styles.panelHeader}><h2>Subscriptions</h2></div>
          <table className={styles.table}>
            <thead><tr><th>Company/User</th><th>Plan</th><th>Status</th><th>Period</th></tr></thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td>{sub.user?.email ?? "Unknown"}</td>
                  <td>{sub.plan}<p>{sub.billingInterval}</p></td>
                  <td><span className={styles.badge}>{sub.status}</span></td>
                  <td>{sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "Not set"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!subscriptions.length && <div className={styles.empty}>No subscriptions yet.</div>}
        </div>
      </section>
    </div>
  );
}
