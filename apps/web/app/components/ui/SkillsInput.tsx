/** @format */
"use client";

import { X } from "lucide-react";
import styles from "../../employer/styles/post-job.module.css"; // 

interface Props {
  skills: string[];
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onRemove: (skill: string) => void;
  max?: number;
  placeholder?: string;
}

export function SkillsInput({
  skills,
  inputValue,
  onInputChange,
  onKeyDown,
  onRemove,
  max = 12,
  placeholder = "React, TypeScript...",
}: Props) {
  return (
    <div className={styles.skillBox}>
      {skills.map((s) => (
        <span key={s} className={styles.skillTag}>
          {s}
          <button
            type="button"
            className={styles.skillRemove}
            onClick={() => onRemove(s)}
            aria-label={`Remove ${s}`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      {skills.length < max && (
        <input
          className={styles.skillInput}
          placeholder={skills.length === 0 ? placeholder : "Add more..."}
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
        />
      )}
    </div>
  );
}
