/** @format */
"use client";

import React, { useState } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import styles from "../../styles/auth.module.css";

interface Props {
  label?: string;
  type?: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
}

export const InputField: React.FC<Props> = ({
  label,
  type = "text",
  placeholder,
  register,
  error,
}) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles["input-wrap"]}>
        <input
          {...register}
          type={inputType}
          placeholder={placeholder}
          className={`${styles.input} ${error ? styles.error : ""} ${isPassword ? styles["has-toggle"] : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            className={styles["pw-toggle"]}
            onClick={() => setShow((p) => !p)}
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <span className={styles["error-msg"]}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error.message}
        </span>
      )}
    </div>
  );
};
