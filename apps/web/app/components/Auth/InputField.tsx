/** @format */

import React from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface Props {
  label?: string;
  type?: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
}

export const InputField: React.FC<Props> = ({
  label,
  register,
  error,
  ...props
}) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <label style={{ display: "block", marginBottom: 4 }}>{label}</label>
    )}
    <input
      {...register}
      {...props}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: 8,
        border: error ? "1px solid red" : "1px solid #CBD5E1",
        fontSize: 14,
      }}
    />
    {error && (
      <span style={{ color: "red", fontSize: 12 }}>{error.message}</span>
    )}
  </div>
);
