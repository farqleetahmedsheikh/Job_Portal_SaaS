/** @format */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useCallback } from "react";
import {
  Bell,
  Shield,
  Eye,
  Palette,
  Globe,
  Mail,
  Smartphone,
  Lock,
  Trash2,
  ChevronRight,
  Check,
  Moon,
  Sun,
  Monitor,
  Download,
  LogOut,
  AlertTriangle,
  BriefcaseIcon,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "../../store/session.store";
import { useSessionStore } from "../../store/session.store";
import styles from "../styles/setting.module.css";
import { useTheme } from "../../components/theme/ThemeProvider";

// ─── Types ────────────────────────────────────────────────
type ThemeOption = "light" | "dark" | "system";
type SectionKey =
  | "notifications"
  | "privacy"
  | "appearance"
  | "account"
  | "security";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

interface SectionTab {
  key: SectionKey;
  label: string;
  icon: React.ReactNode;
}

// ─── Subcomponents ────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`${styles.toggle} ${checked ? styles["toggle-on"] : ""} ${disabled ? styles["toggle-disabled"] : ""}`}
    >
      <span className={styles["toggle-thumb"]} />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <div className={styles["toggle-row"]}>
      <div className={styles["toggle-info"]}>
        <span className={styles["toggle-label"]}>{label}</span>
        <span className={styles["toggle-desc"]}>{description}</span>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles["section-card"]}>
      <h2 className={styles["section-title"]}>{title}</h2>
      <div className={styles["section-body"]}>{children}</div>
    </div>
  );
}

function ActionRow({
  label,
  description,
  icon,
  onClick,
  variant = "default",
  badge,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "warning";
  badge?: string;
}) {
  return (
    <button
      className={`${styles["action-row"]} ${styles[`action-${variant}`]}`}
      onClick={onClick}
    >
      <div
        className={`${styles["action-icon-wrap"]} ${styles[`action-icon-${variant}`]}`}
      >
        {icon}
      </div>
      <div className={styles["action-info"]}>
        <span className={styles["action-label"]}>{label}</span>
        <span className={styles["action-desc"]}>{description}</span>
      </div>
      {badge && <span className={styles["action-badge"]}>{badge}</span>}
      <ChevronRight size={15} className={styles["action-chevron"]} />
    </button>
  );
}

// ─── Section: Notifications ───────────────────────────────
function NotificationsSection() {
  const [notifs, setNotifs] = useState({
    emailApplications: true,
    emailMessages: true,
    emailWeeklyDigest: false,
    emailMarketing: false,
    pushApplications: true,
    pushMessages: true,
    pushReminders: true,
    pushJobAlerts: false,
  });

  const set = (key: keyof typeof notifs) => (v: boolean) =>
    setNotifs((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionCard title="Email Notifications">
        <ToggleRow
          label="Application updates"
          description="Status changes on your job applications"
          checked={notifs.emailApplications}
          onChange={set("emailApplications")}
        />
        <ToggleRow
          label="New messages"
          description="When a recruiter or employer sends you a message"
          checked={notifs.emailMessages}
          onChange={set("emailMessages")}
        />
        <ToggleRow
          label="Weekly digest"
          description="A summary of your job search activity each week"
          checked={notifs.emailWeeklyDigest}
          onChange={set("emailWeeklyDigest")}
        />
        <ToggleRow
          label="Marketing & tips"
          description="Career advice, feature announcements, and promotions"
          checked={notifs.emailMarketing}
          onChange={set("emailMarketing")}
        />
      </SectionCard>

      <SectionCard title="Push Notifications">
        <ToggleRow
          label="Application status changes"
          description="Real-time updates on your applications"
          checked={notifs.pushApplications}
          onChange={set("pushApplications")}
        />
        <ToggleRow
          label="Messages"
          description="Instant alerts for new recruiter messages"
          checked={notifs.pushMessages}
          onChange={set("pushMessages")}
        />
        <ToggleRow
          label="Interview reminders"
          description="Reminders 1 hour before scheduled interviews"
          checked={notifs.pushReminders}
          onChange={set("pushReminders")}
        />
        <ToggleRow
          label="Job recommendations"
          description="Personalised job alerts based on your profile"
          checked={notifs.pushJobAlerts}
          onChange={set("pushJobAlerts")}
        />
      </SectionCard>
    </>
  );
}

// ─── Section: Privacy ─────────────────────────────────────
function PrivacySection() {
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showResume: true,
    showEmail: false,
    showPhone: false,
    openToWork: true,
    recruitersOnly: false,
    activityVisible: true,
  });

  const set = (key: keyof typeof privacy) => (v: boolean) =>
    setPrivacy((p) => ({ ...p, [key]: v }));

  return (
    <>
      <SectionCard title="Profile Visibility">
        <ToggleRow
          label="Public profile"
          description="Allow employers and recruiters to find your profile"
          checked={privacy.profileVisible}
          onChange={set("profileVisible")}
        />
        <ToggleRow
          label="Show resume"
          description="Allow employers to view your uploaded resume"
          checked={privacy.showResume}
          onChange={set("showResume")}
        />
        <ToggleRow
          label="Show email address"
          description="Display your email on your public profile"
          checked={privacy.showEmail}
          onChange={set("showEmail")}
        />
        <ToggleRow
          label="Show phone number"
          description="Display your phone number on your public profile"
          checked={privacy.showPhone}
          onChange={set("showPhone")}
        />
      </SectionCard>

      <SectionCard title="Job Search Status">
        <ToggleRow
          label="Open to work"
          description="Show the 'Open to Work' banner on your profile"
          checked={privacy.openToWork}
          onChange={set("openToWork")}
        />
        <ToggleRow
          label="Recruiters only"
          description="Only show your availability to verified recruiters"
          checked={privacy.recruitersOnly}
          onChange={set("recruitersOnly")}
          disabled={!privacy.openToWork}
        />
        <ToggleRow
          label="Show activity"
          description="Let employers see when you were last active"
          checked={privacy.activityVisible}
          onChange={set("activityVisible")}
        />
      </SectionCard>
    </>
  );
}

// ─── Section: Appearance ──────────────────────────────────
function AppearanceSection() {
  const { theme, toggle } = useTheme();
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [language, setLanguage] = useState("en");

  const THEMES: { key: ThemeOption; label: string; icon: React.ReactNode }[] = [
    { key: "light", label: "Light", icon: <Sun size={16} /> },
    { key: "dark", label: "Dark", icon: <Moon size={16} /> },
    { key: "system", label: "System", icon: <Monitor size={16} /> },
  ];

  return (
    <>
      <SectionCard title="Theme">
        <div className={styles["theme-grid"]}>
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`${styles["theme-btn"]} ${theme === t.key ? styles["theme-active"] : ""}`}
              onClick={() => toggle()}
            >
              <div className={styles["theme-icon"]}>{t.icon}</div>
              <span>{t.label}</span>
              {theme === t.key && (
                <Check size={12} className={styles["theme-check"]} />
              )}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Display">
        <div className={styles["density-row"]}>
          <div className={styles["toggle-info"]}>
            <span className={styles["toggle-label"]}>Layout density</span>
            <span className={styles["toggle-desc"]}>
              Control spacing and information density
            </span>
          </div>
          <div className={styles["density-pills"]}>
            {(["comfortable", "compact"] as const).map((d) => (
              <button
                key={d}
                className={`${styles["density-pill"]} ${density === d ? styles["density-active"] : ""}`}
                onClick={() => setDensity(d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Language & Region">
        <div className={styles["select-row"]}>
          <div className={styles["toggle-info"]}>
            <span className={styles["toggle-label"]}>Language</span>
            <span className={styles["toggle-desc"]}>Interface language</span>
          </div>
          <select
            className={styles.select}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ur">اردو</option>
          </select>
        </div>
      </SectionCard>
    </>
  );
}

// ─── Section: Security ────────────────────────────────────
function SecuritySection() {
  const [twoFa, setTwoFa] = useState(false);
  const router = useRouter();

  return (
    <>
      <SectionCard title="Authentication">
        <ToggleRow
          label="Two-factor authentication"
          description="Add an extra layer of security with an authenticator app"
          checked={twoFa}
          onChange={setTwoFa}
        />
      </SectionCard>

      <SectionCard title="Password & Access">
        <ActionRow
          label="Change password"
          description="Update your login password"
          icon={<Lock size={15} />}
          onClick={() => router.push("/change-password")}
        />
        <ActionRow
          label="Active sessions"
          description="View and revoke active login sessions"
          icon={<Smartphone size={15} />}
          onClick={() => {}}
          badge="2 active"
        />
        <ActionRow
          label="Connected apps"
          description="Manage third-party apps with access to your account"
          icon={<Globe size={15} />}
          onClick={() => {}}
        />
      </SectionCard>
    </>
  );
}

// ─── Section: Account ─────────────────────────────────────
function AccountSection() {
  const router = useRouter();
  const user = useUser();
  const { clearUser } = useSessionStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = useCallback(async () => {
    clearUser();
    router.push("/login");
  }, [clearUser, router]);

  return (
    <>
      <SectionCard title="Data & Export">
        <ActionRow
          label="Download your data"
          description="Export all your profile data, applications, and activity"
          icon={<Download size={15} />}
          onClick={() => {}}
        />
        <ActionRow
          label="Email preferences"
          description="Manage your email subscriptions and preferences"
          icon={<Mail size={15} />}
          onClick={() => {}}
        />
      </SectionCard>

      <SectionCard title="Job Preferences">
        <ActionRow
          label="Job alerts"
          description="Set up automated alerts for matching job listings"
          icon={<BriefcaseIcon size={15} />}
          onClick={() => {}}
          badge="3 active"
        />
      </SectionCard>

      <SectionCard title="Danger Zone">
        <ActionRow
          label="Deactivate account"
          description="Temporarily hide your profile and pause all notifications"
          icon={<UserX size={15} />}
          onClick={() => {}}
          variant="warning"
        />
        <ActionRow
          label="Delete account"
          description="Permanently delete your account and all associated data"
          icon={<Trash2 size={15} />}
          onClick={() => setShowDeleteConfirm(true)}
          variant="danger"
        />
      </SectionCard>

      {/* Logout */}
      <button className={styles["logout-btn"]} onClick={handleLogout}>
        <LogOut size={15} /> Sign out of HiringFly
      </button>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles["modal-icon"]}>
              <AlertTriangle size={24} />
            </div>
            <h3 className={styles["modal-title"]}>Delete account?</h3>
            <p className={styles["modal-body"]}>
              This will permanently remove your account, profile, applications,
              and all associated data. This action{" "}
              <strong>cannot be undone</strong>.
            </p>
            <div className={styles["modal-actions"]}>
              <button
                className={`${styles.btn} ${styles["btn-ghost"]}`}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className={`${styles.btn} ${styles["btn-danger"]}`}>
                Yes, delete my account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────
const TABS: SectionTab[] = [
  { key: "notifications", label: "Notifications", icon: <Bell size={15} /> },
  { key: "privacy", label: "Privacy", icon: <Eye size={15} /> },
  { key: "appearance", label: "Appearance", icon: <Palette size={15} /> },
  { key: "security", label: "Security", icon: <Shield size={15} /> },
  { key: "account", label: "Account", icon: <UserX size={15} /> },
];

export default function SettingsPage() {
  const [active, setActive] = useState<SectionKey>("notifications");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const ActiveSection = {
    notifications: NotificationsSection,
    privacy: PrivacySection,
    appearance: AppearanceSection,
    security: SecuritySection,
    account: AccountSection,
  }[active];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your account preferences</p>
        </div>
        {active !== "account" && (
          <button
            className={`${styles.btn} ${styles["btn-primary"]}`}
            onClick={handleSave}
          >
            {saved ? (
              <>
                <Check size={13} /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        )}
      </div>

      {/* Saved banner */}
      {saved && (
        <div className={styles["save-banner"]} role="status">
          <Check size={14} /> Settings saved successfully
        </div>
      )}

      <div className={styles.layout}>
        {/* Sidebar nav */}
        <nav className={styles.nav}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles["nav-item"]} ${active === tab.key ? styles["nav-active"] : ""}`}
              onClick={() => setActive(tab.key)}
            >
              <span className={styles["nav-icon"]}>{tab.icon}</span>
              {tab.label}
              {active === tab.key && (
                <div className={styles["nav-indicator"]} />
              )}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className={styles.content}>
          <ActiveSection />
        </div>
      </div>
    </div>
  );
}
