/** @format */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  FileClock,
  Lock,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { api, timeAgo } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "./automation.module.css";

interface AutomationCapabilities {
  canUseBasicAutomation: boolean;
  canControlAutomation: boolean;
  canUseStatusMessageAutomation: boolean;
  canUseInterviewReminders: boolean;
  canUseFollowUps: boolean;
  canControlFollowUpDelay: boolean;
  canCustomizeCandidateMessages: boolean;
  canUseAdvancedRules: boolean;
}

interface AutomationSettings {
  id: string;
  plan: string;
  autoApplicationConfirmation: boolean;
  autoShortlistMessage: boolean;
  autoRejectionMessage: boolean;
  autoInterviewReminders: boolean;
  autoFollowUpAfterNoResponse: boolean;
  followUpDelayDays: number;
  capabilities: AutomationCapabilities;
}

interface AutomationLog {
  id: string;
  trigger: string;
  action: string;
  status: "success" | "failed" | "skipped";
  message: string;
  createdAt: string;
  candidateId?: string | null;
  jobId?: string | null;
}

interface LogsResponse {
  data: AutomationLog[];
  meta: { page: number; limit: number; total: number };
}

type ToggleKey =
  | "autoApplicationConfirmation"
  | "autoShortlistMessage"
  | "autoRejectionMessage"
  | "autoInterviewReminders"
  | "autoFollowUpAfterNoResponse";

const overviewCards = [
  {
    icon: Send,
    title: "Application confirmations",
    body: "Candidates get a professional confirmation as soon as they apply.",
  },
  {
    icon: ShieldCheck,
    title: "Pipeline status updates",
    body: "Shortlisted, rejected, and hired updates stay consistent.",
  },
  {
    icon: BellRing,
    title: "Interview reminders",
    body: "Paid plans can remind candidates before upcoming interviews.",
  },
  {
    icon: FileClock,
    title: "Follow-up nudges",
    body: "Keep employers aware when candidates wait too long.",
  },
];

const previewRows = [
  "Candidate applies -> send confirmation email and in-app update",
  "Employer shortlists -> notify candidate and open interview scheduling path",
  "Interview scheduled -> send details and queue reminders when included",
  "Job closes -> notify remaining active candidates automatically",
];

const freeIncludedFeatures = [
  {
    title: "Application confirmations",
    body: "Candidates automatically receive confirmation when they apply.",
  },
  {
    title: "Status updates",
    body: "Candidates are notified when their application status changes.",
  },
];

const freeLockedFeatures = [
  {
    title: "Auto shortlist message",
    body: "Send polished next-step messages when candidates move forward.",
  },
  {
    title: "Auto rejection message",
    body: "Send consistent, professional rejection communication.",
  },
  {
    title: "Interview reminders",
    body: "Ensure candidates don't miss interviews with timed reminders.",
  },
  {
    title: "Follow-up automation",
    body: "Nudge your team when candidates have been waiting too long.",
  },
];

export default function EmployerAutomationPage() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const planLabel = useMemo(
    () => {
      const plan = settings?.plan;
      return plan ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)}` : "Free";
    },
    [settings?.plan],
  );
  const isFree = settings?.plan === "free";

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, logsRes] = await Promise.all([
        api<AutomationSettings>(`${API_BASE}/automation/settings`, "GET"),
        api<LogsResponse>(`${API_BASE}/automation/logs?limit=12`, "GET"),
      ]);
      setSettings(settingsRes);
      setLogs(logsRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load automation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function patchSettings(update: Partial<AutomationSettings>, label: string) {
    setSavingKey(label);
    setError(null);
    setSuccess(null);
    try {
      const next = await api<AutomationSettings>(
        `${API_BASE}/automation/settings`,
        "PATCH",
        update,
      );
      setSettings(next);
      setSuccess("Automation settings updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update automation");
    } finally {
      setSavingKey(null);
    }
  }

  function canToggle(key: ToggleKey) {
    if (!settings) return false;
    if (
      key === "autoInterviewReminders" &&
      !settings.capabilities.canUseInterviewReminders
    ) {
      return false;
    }
    if (
      key === "autoFollowUpAfterNoResponse" &&
      !settings.capabilities.canUseFollowUps
    ) {
      return false;
    }
    if (
      ["autoApplicationConfirmation", "autoShortlistMessage", "autoRejectionMessage"].includes(key) &&
      settings.plan === "free"
    ) {
      return false;
    }
    return true;
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.heroSkeleton} />
        <div className={styles.cardGrid}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
        <div className={styles.skeletonPanel} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Hiring operating system</span>
          <h1>Hiring Automation</h1>
          <p>
            Automate candidate updates, interview reminders, and follow-ups from
            one place while keeping employers in control.
          </p>
          <div className={styles.heroMeta}>
            <span>
              <CheckCircle2 size={15} /> Candidate communication stays consistent
            </span>
            <span>
              <Zap size={15} /> Basic updates included in every workflow
            </span>
          </div>
        </div>
        <div className={styles.planCard}>
          <span className={styles.planBadge}>{planLabel} plan</span>
          <h2>
            {isFree
              ? "You're using basic automation"
              : settings?.capabilities.canCustomizeCandidateMessages
                ? "Full automation controls unlocked"
                : "Upgrade for deeper automation control"}
          </h2>
          <p>
            {isFree
              ? "Upgrade to automate interviews, follow-ups, and candidate communication."
              : "Growth unlocks customized candidate communication, advanced workflows, and stronger follow-up automation."}
          </p>
          <Link href="/employer/billing" className={styles.primaryLink}>
            {isFree ? "Upgrade to Starter" : "View plans"}{" "}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {isFree && (
        <section className={styles.upgradeBanner}>
          <div>
            <span className={styles.eyebrow}>Basic automation active</span>
            <h2>Upgrade to automate more of your hiring workflow.</h2>
            <p>
              Starter unlocks interview reminders, shortlist and rejection
              messages, and follow-up automation.
            </p>
          </div>
          <Link href="/employer/billing" className={styles.bannerCta}>
            Upgrade to Starter <ArrowRight size={15} />
          </Link>
        </section>
      )}

      {error && (
        <div className={styles.alert} role="alert">
          <span>{error}</span>
          <button onClick={() => void load()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}
      {success && <div className={styles.success}>{success}</div>}

      <section className={styles.cardGrid}>
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className={styles.overviewCard}>
              <div className={styles.iconBox}>
                <Icon size={18} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          );
        })}
      </section>

      <section className={styles.layout}>
        <div className={styles.mainPanel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.eyebrow}>Controls</span>
              <h2>Automation settings</h2>
            </div>
            <span className={styles.statusPill}>Company scoped</span>
          </div>

          {settings && isFree && <FreeAutomationPanel />}

          {settings && !isFree && (
            <div className={styles.toggleList}>
              <ToggleRow
                title="Auto-send application confirmation"
                body="Send candidates a confirmation when their application is received."
                enabled={settings.autoApplicationConfirmation}
                locked={!canToggle("autoApplicationConfirmation")}
                saving={savingKey === "application"}
                lockText="Starter unlocks basic automation controls."
                onChange={() =>
                  patchSettings(
                    {
                      autoApplicationConfirmation:
                        !settings.autoApplicationConfirmation,
                    },
                    "application",
                  )
                }
              />
              <ToggleRow
                title="Auto-send shortlist message"
                body="Let candidates know when they move forward in the pipeline."
                enabled={settings.autoShortlistMessage}
                locked={!canToggle("autoShortlistMessage")}
                saving={savingKey === "shortlist"}
                lockText="Starter unlocks basic automation controls."
                onChange={() =>
                  patchSettings(
                    { autoShortlistMessage: !settings.autoShortlistMessage },
                    "shortlist",
                  )
                }
              />
              <ToggleRow
                title="Auto-send rejection message"
                body="Send a concise professional update when candidates are rejected."
                enabled={settings.autoRejectionMessage}
                locked={!canToggle("autoRejectionMessage")}
                saving={savingKey === "rejection"}
                lockText="Starter unlocks basic automation controls."
                onChange={() =>
                  patchSettings(
                    { autoRejectionMessage: !settings.autoRejectionMessage },
                    "rejection",
                  )
                }
              />
              <ToggleRow
                title="Auto-send interview reminders"
                body="Send 24-hour and 1-hour reminders before upcoming interviews."
                enabled={settings.autoInterviewReminders}
                locked={!canToggle("autoInterviewReminders")}
                saving={savingKey === "reminders"}
                lockText="Starter includes interview reminders."
                onChange={() =>
                  patchSettings(
                    { autoInterviewReminders: !settings.autoInterviewReminders },
                    "reminders",
                  )
                }
              />
              <ToggleRow
                title="Follow up after no response"
                body="Nudge your team when a candidate has waited too long at a stage."
                enabled={settings.autoFollowUpAfterNoResponse}
                locked={!canToggle("autoFollowUpAfterNoResponse")}
                saving={savingKey === "followup"}
                lockText="Starter unlocks follow-up nudges."
                onChange={() =>
                  patchSettings(
                    {
                      autoFollowUpAfterNoResponse:
                        !settings.autoFollowUpAfterNoResponse,
                    },
                    "followup",
                  )
                }
              />

              <label
                className={`${styles.delayControl} ${
                  !settings.autoFollowUpAfterNoResponse ||
                  !settings.capabilities.canUseFollowUps ||
                  !settings.capabilities.canControlFollowUpDelay
                    ? styles.disabled
                    : ""
                }`}
              >
                <span>
                  <Clock3 size={15} /> Follow-up delay
                </span>
                <select
                  value={settings.followUpDelayDays}
                  disabled={
                    savingKey === "delay" ||
                    !settings.autoFollowUpAfterNoResponse ||
                    !settings.capabilities.canUseFollowUps ||
                    !settings.capabilities.canControlFollowUpDelay
                  }
                  onChange={(event) =>
                    patchSettings(
                      { followUpDelayDays: Number(event.target.value) },
                      "delay",
                    )
                  }
                >
                  {[1, 3, 5, 7, 10, 14].map((days) => (
                    <option key={days} value={days}>
                      {days} day{days > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                {!settings.capabilities.canControlFollowUpDelay && (
                  <small>Growth unlocks custom timing.</small>
                )}
              </label>
            </div>
          )}
        </div>

        <aside className={styles.sidePanel}>
          <section className={styles.previewCard}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.eyebrow}>Preview</span>
                <h2>How it works</h2>
              </div>
              <Sparkles size={18} />
            </div>
            <div className={styles.previewList}>
              {previewRows.map((row) => (
                <div key={row} className={styles.previewRow}>
                  <span />
                  <p>{row}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.logsCard}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.eyebrow}>Activity</span>
                <h2>Recent automation</h2>
              </div>
              <button className={styles.iconButton} onClick={() => void load()}>
                <RefreshCw size={15} />
              </button>
            </div>
            {logs.length ? (
              <div className={styles.logList}>
                {logs.map((log) => (
                  <article key={log.id} className={styles.logItem}>
                    <span
                      className={`${styles.logDot} ${statusClass(log.status)}`}
                    />
                    <div>
                      <strong>{humanize(log.action)}</strong>
                      <p>{log.message}</p>
                      <span>{humanize(log.trigger)} - {timeAgo(log.createdAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <Zap size={24} />
                <h3>No automation activity yet</h3>
                <p>
                  Actions will appear here as candidates move through your
                  hiring pipeline.
                </p>
              </div>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}

function ToggleRow({
  title,
  body,
  enabled,
  locked,
  saving,
  lockText,
  onChange,
}: {
  title: string;
  body: string;
  enabled: boolean;
  locked: boolean;
  saving: boolean;
  lockText: string;
  onChange: () => void;
}) {
  return (
    <div className={`${styles.toggleRow} ${locked ? styles.locked : ""}`}>
      <div>
        <h3>
          {title}
          {locked && <Lock size={14} />}
        </h3>
        <p>{locked ? lockText : body}</p>
      </div>
      <button
        type="button"
        className={`${styles.switch} ${enabled ? styles.switchOn : ""}`}
        disabled={locked || saving}
        onClick={onChange}
        aria-pressed={enabled}
      >
        <span />
      </button>
    </div>
  );
}

function FreeAutomationPanel() {
  return (
    <div className={styles.freePanel}>
      <div className={styles.includedList}>
        {freeIncludedFeatures.map((feature) => (
          <div key={feature.title} className={styles.infoRow}>
            <span className={styles.includedIcon}>
              <CheckCircle2 size={15} />
            </span>
            <div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
            <strong>Automatic</strong>
          </div>
        ))}
      </div>

      <div className={styles.lockedGrid}>
        {freeLockedFeatures.map((feature) => (
          <article key={feature.title} className={styles.lockedFeature}>
            <div className={styles.lockIcon}>
              <Lock size={15} />
            </div>
            <div>
              <h3>{feature.title}</h3>
              <p>{feature.body} Available in Starter plan.</p>
            </div>
            <Link href="/employer/billing">Upgrade</Link>
          </article>
        ))}
      </div>
    </div>
  );
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll(".", " / ");
}

function statusClass(status: AutomationLog["status"]) {
  if (status === "success") return styles.dotSuccess;
  if (status === "failed") return styles.dotFailed;
  return styles.dotSkipped;
}
