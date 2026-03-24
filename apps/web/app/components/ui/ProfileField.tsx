/** @format */
"use client";

import type { FieldConfig } from "../../config/profile.config";
import { EmailVerifiedBadge } from "./EmailVerifyBadge";
import styles from "../../applicant/styles/profile.module.css";

interface Props {
  config: FieldConfig;
  value: string;
  draftValue: string;
  editing: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export function ProfileField({
  config,
  value,
  draftValue,
  editing,
  onChange,
}: Props) {
  const {
    name,
    label,
    type,
    placeholder,
    span,
    textarea,
    icon,
    readOnly,
    isEmailVerified,
  } = config;

  return (
    <div
      className={[styles.field, span ? styles["span-2"] : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <label className={styles.label} htmlFor={name}>
        {icon} {label}
      </label>

      {editing && !readOnly ? (
        textarea ? (
          <textarea
            id={name}
            name={name}
            className={styles.textarea}
            value={draftValue}
            onChange={onChange}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type ?? "text"}
            className={styles.input}
            value={draftValue}
            onChange={onChange}
            placeholder={placeholder}
            min={type === "number" ? 0 : undefined}
            max={type === "number" ? 50 : undefined}
          />
        )
      ) : (
        <div
          className={[styles.value, !value ? styles.empty : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {name === "email" && value ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {value}
              <span style={{ fontSize: "10px" }}>
                <EmailVerifiedBadge isVerified={isEmailVerified} />
              </span>
            </div>
          ) : name === "experienceYears" && value ? (
            `${value} year${value === "1" ? "" : "s"}`
          ) : type === "url" && value ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              onClick={(e) => e.stopPropagation()}
            >
              {value.replace(/^https?:\/\//, "")}
            </a>
          ) : (
            value || "Not set"
          )}
        </div>
      )}
    </div>
  );
}
