/** @format */

"use client";

import { useState } from "react";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import styles from "../../applicant/styles/profile.module.css";
import { Education } from "../../types/profile.types";

interface Props {
  editing: boolean;
  value: Education[];
  onChange: (name: string, value: Education[]) => void;
}

const empty = (): Education => ({
  school: "",
  degree: "",
  field: "",
  startYear: "",
  endYear: "",
  grade: "",
  description: "",
});

export function EducationField({ editing, value = [], onChange }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const update = (i: number, key: keyof Education, val: string) => {
    const next = value.map((e, idx) => (idx === i ? { ...e, [key]: val } : e));
    onChange("educations", next);
  };

  const add = () => {
    const next = [...value, empty()];
    onChange("educations", next);
    setOpen(next.length - 1);
  };

  const remove = (i: number) => {
    onChange(
      "educations",
      value.filter((_, idx) => idx !== i),
    );
    setOpen(null);
  };

  if (!editing && value.length === 0) {
    return <p className={styles["empty-note"]}>No education added yet.</p>;
  }

  return (
    <div className={styles["section-list"]}>
      {value.map((edu, i) => (
        <div key={i} className={styles["section-item"]}>
          {editing ? (
            <div className={styles["section-form"]}>
              <div className={styles["section-form-header"]}>
                <span className={styles["section-form-title"]}>
                  {edu.school || "New education"}
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
                    ["school", "School / University"],
                    ["degree", "Degree"],
                    ["field", "Field of study"],
                    ["startYear", "Start year"],
                    ["endYear", "End year (leave blank if current)"],
                    ["grade", "Grade / GPA (optional)"],
                  ] as [keyof Education, string][]
                ).map(([key, label]) => (
                  <div key={key} className={styles["field-group"]}>
                    <label className={styles.label}>{label}</label>
                    <input
                      className={styles.input}
                      value={edu[key] ?? ""}
                      onChange={(e) => update(i, key, e.target.value)}
                    />
                  </div>
                ))}
                <div
                  className={`${styles["field-group"]} ${styles["col-span-2"]}`}
                >
                  <label className={styles.label}>Description (optional)</label>
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={edu.description ?? ""}
                    onChange={(e) => update(i, "description", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles["section-view"]}>
              <div className={styles["section-icon"]}>
                <GraduationCap size={14} />
              </div>
              <div className={styles["section-info"]}>
                <span className={styles["section-primary"]}>
                  {edu.degree} {edu.field && `· ${edu.field}`}
                </span>
                <span className={styles["section-secondary"]}>
                  {edu.school}
                </span>
                <span className={styles["section-meta"]}>
                  {edu.startYear}
                  {edu.endYear ? ` – ${edu.endYear}` : " – Present"}
                  {edu.grade && ` · ${edu.grade}`}
                </span>
                {edu.description && (
                  <span className={styles["section-desc"]}>
                    {edu.description}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {editing && (
        <button type="button" className={styles["add-btn"]} onClick={add}>
          <Plus size={13} /> Add education
        </button>
      )}
    </div>
  );
}
