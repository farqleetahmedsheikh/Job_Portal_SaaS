/** @format */

import React from "react";
import { Button } from "../ui/Button";

interface Props {
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
}

export const AuthForm: React.FC<Props> = ({
  title,
  children,
  onSubmit,
  loading,
}) => (
  <form
    onSubmit={onSubmit}
    style={{
      width: 400,
      margin: "50px auto",
      padding: 32,
      borderRadius: 16,
      background: "#fff",
      boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
    }}
  >
    <h2 style={{ marginBottom: 24 }}>{title}</h2>
    {children}
    <Button
      type="submit"
      disabled={loading}
      style={{
        width: "100%",
      }}
    >
      {loading ? "Processing..." : title}
    </Button>
  </form>
);
