/** @format */
"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib";
import { COUNTRIES, TIMEZONES, countryLabel } from "../../lib/region";
import { API_BASE } from "../../constants";

interface PrivacyState {
  country: string;
  timezone: string;
  marketingConsent: boolean;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  dataExportRequestedAt: string | null;
  deletionRequestedAt: string | null;
}

export function AccountPrivacyControls() {
  const [privacy, setPrivacy] = useState<PrivacyState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<PrivacyState>(`${API_BASE}/account/privacy`, "GET")
      .then((data) => {
        setPrivacy(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load account");
        setLoading(false);
      });
  }, []);

  async function savePrivacy() {
    if (!privacy) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api<PrivacyState>(
        `${API_BASE}/account/privacy`,
        "PATCH",
        {
          country: privacy.country,
          timezone: privacy.timezone,
          marketingConsent: privacy.marketingConsent,
        },
      );
      setPrivacy(updated);
      setMessage("Privacy settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function requestExport() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ requestedAt: string }>(
        `${API_BASE}/account/export-request`,
        "POST",
      );
      setPrivacy((current) =>
        current
          ? { ...current, dataExportRequestedAt: result.requestedAt }
          : current,
      );
      setMessage("Data export request recorded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export request failed");
    } finally {
      setSaving(false);
    }
  }

  async function requestDeletion() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ deletionRequestedAt: string }>(
        `${API_BASE}/account/delete-request`,
        "POST",
      );
      setPrivacy((current) =>
        current
          ? { ...current, deletionRequestedAt: result.deletionRequestedAt }
          : current,
      );
      setMessage("Account deletion request recorded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete request failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ margin: 0 }}>Loading account settings...</p>;
  if (!privacy) {
    return (
      <p style={{ margin: 0, color: "var(--status-danger)" }}>
        {error ?? "Account settings unavailable."}
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Country</span>
          <select
            value={privacy.country}
            onChange={(event) =>
              setPrivacy({ ...privacy, country: event.target.value })
            }
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Timezone</span>
          <select
            value={privacy.timezone}
            onChange={(event) =>
              setPrivacy({ ...privacy, timezone: event.target.value })
            }
          >
            {TIMEZONES.map((timezone) => (
              <option key={timezone.code} value={timezone.code}>
                {timezone.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={privacy.marketingConsent}
            onChange={(event) =>
              setPrivacy({
                ...privacy,
                marketingConsent: event.target.checked,
              })
            }
          />
          Marketing email consent
        </label>
      </div>

      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
        Current region: {countryLabel(privacy.country)} · {privacy.timezone}
      </p>
      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
        Account deletion is recorded as a request so the team can process it
        without breaking related hiring records.
      </p>

      {error && (
        <p style={{ margin: 0, color: "var(--status-danger)" }}>{error}</p>
      )}
      {message && (
        <p style={{ margin: 0, color: "var(--status-success)" }}>{message}</p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" onClick={savePrivacy} disabled={saving}>
          {saving ? "Saving..." : "Save privacy settings"}
        </button>
        <button type="button" onClick={requestExport} disabled={saving}>
          Request data export
        </button>
        <button type="button" onClick={requestDeletion} disabled={saving}>
          Request account deletion
        </button>
      </div>

      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>
        Last export request: {privacy.dataExportRequestedAt ?? "none"} ·
        Deletion request: {privacy.deletionRequestedAt ?? "none"}
      </p>
    </div>
  );
}
