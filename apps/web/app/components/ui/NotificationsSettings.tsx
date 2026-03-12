/** @format */
"use client";

import { Bell } from "lucide-react";
import { NOTIFICATION_TOGGLES } from "../../config/profile.config";
import { ToggleRow } from "./ToggleRow";
import type { NotificationsForm } from "../../types/profile.types";
import styles from "../../applicant/styles/profile.module.css";

interface Props {
  notifications: NotificationsForm;
  onToggle: (name: keyof NotificationsForm) => void;
}

// Split the flat list into email vs push sections by field name prefix
const EMAIL_KEYS: (keyof NotificationsForm)[] = [
  "notifEmailApplications",
  "notifEmailMessages",
  "notifEmailDigest",
  "notifEmailMarketing",
];
const PUSH_KEYS: (keyof NotificationsForm)[] = [
  "notifPushApplications",
  "notifPushMessages",
  "notifPushReminders",
  "notifPushJobAlerts",
];

const EMAIL_TOGGLES = NOTIFICATION_TOGGLES.filter((t) =>
  EMAIL_KEYS.includes(t.name),
);
const PUSH_TOGGLES = NOTIFICATION_TOGGLES.filter((t) =>
  PUSH_KEYS.includes(t.name),
);

export function NotificationsSettings({ notifications, onToggle }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles["card-header"]}>
        <h2 className={styles["card-title"]}>
          <Bell size={16} aria-hidden /> Notifications
        </h2>
        <p className={styles["card-subtitle"]}>
          Choose how and when you want to be notified
        </p>
      </div>

      <div className={styles["card-body"]}>
        {/* Email section */}
        <p className={styles["toggle-section-title"]}>Email</p>
        <div className={styles["toggle-list"]}>
          {EMAIL_TOGGLES.map(({ name, label, desc }) => (
            <ToggleRow
              key={name as string}
              label={label}
              desc={desc}
              checked={notifications[name]}
              onChange={() => onToggle(name)}
            />
          ))}
        </div>

        {/* Push section */}
        <p className={styles["toggle-section-title"]} style={{ marginTop: 20 }}>
          Push
        </p>
        <div className={styles["toggle-list"]}>
          {PUSH_TOGGLES.map(({ name, label, desc }) => (
            <ToggleRow
              key={name as string}
              label={label}
              desc={desc}
              checked={notifications[name]}
              onChange={() => onToggle(name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
