/** @format */
"use client";

import styles from "../../applicant/styles/profile.module.css";

interface Props {
  editing: boolean;
  draftValue: string;
  skills: string[] | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SkillsField({ editing, draftValue, skills, onChange }: Props) {
  return (
    <div className={styles.field} style={{ marginTop: 16 }}>
      <label className={styles.label} htmlFor="skills">
        Skills{" "}
        <span
          style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 4 }}
        >
          (comma separated)
        </span>
      </label>
      {editing ? (
        <input
          id="skills"
          name="skills"
          className={styles.input}
          value={draftValue}
          onChange={onChange}
          placeholder="React, TypeScript, Node.js"
        />
      ) : (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}
        >
          {skills?.length ? (
            skills.map((s) => (
              <span key={s} className={styles.badge}>
                {s}
              </span>
            ))
          ) : (
            <span className={styles.empty}>Not set</span>
          )}
        </div>
      )}
    </div>
  );
}
