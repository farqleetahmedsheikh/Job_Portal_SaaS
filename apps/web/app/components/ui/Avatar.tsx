/** @format */

"use client";

import Image from "next/image";
import { useMemo } from "react";
import styles from "../../styles/avatar.module.css";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
}

export const Avatar = ({ name, src, size = 40 }: AvatarProps) => {
  const initials = useMemo(() => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() ?? "";
    return (
      (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
    ).toUpperCase();
  }, [name]);

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className={styles["avatar"]}
        />
      ) : (
        <span className={styles["avatar-fallback"]}>{initials}</span>
      )}
    </div>
  );
};
