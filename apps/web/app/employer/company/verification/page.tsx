"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Shield, Upload } from "lucide-react";
import { api } from "../../../lib";
import { API_BASE } from "../../../constants";
import styles from "../../styles/billing.module.css";

interface VerificationDoc {
  id: string;
  businessRegNumber?: string;
  websiteUrl?: string;
  officialEmail?: string;
  docUrl?: string;
  status: string;
  rejectionReason?: string;
  reviewerNotes?: string;
  expiresAt?: string;
  createdAt: string;
}

interface VerificationStatus {
  status: string;
  verifiedAt?: string;
  latestDoc?: VerificationDoc;
  documents?: VerificationDoc[];
}

export default function CompanyVerificationPage() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [businessRegNumber, setBusinessRegNumber] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(
        await api<VerificationStatus>(
          `${API_BASE}/billing/verification/status`,
          "GET",
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await api(`${API_BASE}/billing/verification/submit`, "POST", {
        businessRegNumber,
        officialEmail,
        websiteUrl: websiteUrl || undefined,
        docUrl: docUrl || undefined,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSaving(false);
    }
  };

  const latest = status?.latestDoc;
  const rejectionReason = latest?.rejectionReason ?? latest?.reviewerNotes;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeleton} style={{ height: 220 }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Company verification</h1>
        <p className={styles.subtitle}>
          Submit business details and track your verified badge status.
        </p>
      </div>

      {error && (
        <div className={styles["error-box"]}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className={styles["current-card"]}>
        <div className={styles["current-left"]}>
          <div className={styles["current-plan-name"]}>
            <Shield size={14} /> Status: {status?.status ?? "unverified"}
          </div>
          {latest?.expiresAt && (
            <p className={styles["current-renews"]}>
              <Clock size={11} /> Badge expires{" "}
              {new Date(latest.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
        {status?.status === "verified" && (
          <span className={styles["verified-badge"]}>
            <CheckCircle2 size={12} /> Verified
          </span>
        )}
      </div>

      {rejectionReason && (
        <div className={styles["error-box"]}>
          <AlertCircle size={14} /> {rejectionReason}
        </div>
      )}

      <div className={styles["verification-section"]}>
        <div className={styles["verify-pricing-card"]}>
          <div className={styles["verify-pricing-left"]}>
            <span className={styles["verify-pricing-label"]}>
              Verification request
            </span>
            <span className={styles["verify-pricing-sub"]}>
              Paste a Cloudinary or document URL until direct upload is enabled.
            </span>
          </div>
        </div>

        <input
          className={styles.input}
          placeholder="Business registration number"
          value={businessRegNumber}
          onChange={(e) => setBusinessRegNumber(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Official company email"
          type="email"
          value={officialEmail}
          onChange={(e) => setOfficialEmail(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Website URL"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Document URL"
          value={docUrl}
          onChange={(e) => setDocUrl(e.target.value)}
        />
        <button
          className={styles["verify-btn"]}
          onClick={submit}
          disabled={saving || !businessRegNumber || !officialEmail}
        >
          <Upload size={14} /> {saving ? "Submitting..." : "Submit for review"}
        </button>

        <div className={styles["history-table"]}>
          {(status?.documents ?? []).map((doc) => (
            <div key={doc.id} className={styles["addon-card"]}>
              <div className={styles["addon-body"]}>
                <span className={styles["addon-title"]}>{doc.status}</span>
                <span className={styles["addon-desc"]}>
                  {doc.businessRegNumber} · {doc.officialEmail}
                </span>
              </div>
              {doc.docUrl && (
                <a className={styles["addon-btn"]} href={doc.docUrl}>
                  View document
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
