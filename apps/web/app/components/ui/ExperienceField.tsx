/* eslint-disable @typescript-eslint/no-explicit-any */
/** @format */

"use client";

import { Briefcase, Trash2, Plus } from "lucide-react";
import styles from "../../applicant/styles/profile.module.css";
import { Experience } from "../../types/profile.types";

interface Props {
  editing: boolean;
  value: Experience[];
  onChange: (name: string, value: Experience[]) => void;
}

const empty = (): Experience => ({
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
  skills: [],
});

export function ExperienceField({ editing, value = [], onChange }: Props) {
  const update = (i: number, key: keyof Experience, val: any) => {
    const next = value.map((e, idx) => (idx === i ? { ...e, [key]: val } : e));
    onChange("experiences", next);
  };

  const add = () => onChange("experiences", [...value, empty()]);

  const remove = (i: number) =>
    onChange(
      "experiences",
      value.filter((_, idx) => idx !== i),
    );

  const updateSkills = (i: number, raw: string) =>
    update(
      i,
      "skills",
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );

  if (!editing && value.length === 0) {
    return <p className={styles["empty-note"]}>No experience added yet.</p>;
  }

  return (
    <div className={styles["section-list"]}>
      {value.map((exp, i) => (
        <div key={i} className={styles["section-item"]}>
          {editing ? (
            <div className={styles["section-form"]}>
              <div className={styles["section-form-header"]}>
                <span className={styles["section-form-title"]}>
                  {exp.company || "New experience"}
                </span>
                <button
                  type="button"
                  className={styles["remove-btn"]}
                  onClick={() => remove(i)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className={styles["form-grid"]}>
                {(
                  [
                    ["company", "Company"],
                    ["title", "Job title"],
                    ["startDate", "Start date"],
                  ] as [keyof Experience, string][]
                ).map(([key, label]) => (
                  <div key={key} className={styles["field-group"]}>
                    <label className={styles.label}>{label}</label>
                    <input
                      className={styles.input}
                      value={(exp[key] as string) ?? ""}
                      onChange={(e) => update(i, key, e.target.value)}
                    />
                  </div>
                ))}

                <div className={styles["field-group"]}>
                  <label className={styles.label}>End date</label>
                  <input
                    className={styles.input}
                    value={exp.endDate ?? ""}
                    disabled={exp.isCurrent}
                    onChange={(e) => update(i, "endDate", e.target.value)}
                  />
                </div>

                <div
                  className={`${styles["field-group"]} ${styles["col-span-2"]}`}
                >
                  <label className={styles["checkbox-label"]}>
                    <input
                      type="checkbox"
                      checked={exp.isCurrent ?? false}
                      onChange={(e) => {
                        update(i, "isCurrent", e.target.checked);
                        if (e.target.checked) update(i, "endDate", "");
                      }}
                    />
                    I currently work here
                  </label>
                </div>

                <div
                  className={`${styles["field-group"]} ${styles["col-span-2"]}`}
                >
                  <label className={styles.label}>Description (optional)</label>
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={exp.description ?? ""}
                    onChange={(e) => update(i, "description", e.target.value)}
                  />
                </div>

                <div
                  className={`${styles["field-group"]} ${styles["col-span-2"]}`}
                >
                  <label className={styles.label}>
                    Skills used{" "}
                    <span
                      style={{ fontWeight: 400, color: "var(--text-muted)" }}
                    >
                      (comma separated)
                    </span>
                  </label>
                  <input
                    className={styles.input}
                    value={exp.skills?.join(", ") ?? ""}
                    onChange={(e) => updateSkills(i, e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles["section-view"]}>
              <div className={styles["section-icon"]}>
                <Briefcase size={14} />
              </div>
              <div className={styles["section-info"]}>
                <span className={styles["section-primary"]}>{exp.title}</span>
                <span className={styles["section-secondary"]}>
                  {exp.company}
                </span>
                <span className={styles["section-meta"]}>
                  {exp.startDate}
                  {exp.isCurrent
                    ? " – Present"
                    : exp.endDate
                      ? ` – ${exp.endDate}`
                      : ""}
                </span>
                {exp.description && (
                  <span className={styles["section-desc"]}>
                    {exp.description}
                  </span>
                )}
                {exp.skills && exp.skills.length > 0 && (
                  <div className={styles["skill-chips"]}>
                    {exp.skills.map((s) => (
                      <span key={s} className={styles["skill-chip"]}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {editing && (
        <button type="button" className={styles["add-btn"]} onClick={add}>
          <Plus size={13} /> Add experience
        </button>
      )}
    </div>
  );
}
