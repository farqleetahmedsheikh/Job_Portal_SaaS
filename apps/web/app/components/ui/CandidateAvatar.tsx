/** @format */
"use client";

import styles from "../../employer/styles/emp-dashboard.module.css";

interface Props {
  name: string;
  avatarUrl: string | null;
  size?: number;
}

function toInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function CandidateAvatar({ name, avatarUrl, size = 36 }: Props) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={styles.appAvatar}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={styles.appAvatar}
      aria-label={name}
      style={{ width: size, height: size }}
    >
      {toInitials(name)}
    </div>
  );
}
