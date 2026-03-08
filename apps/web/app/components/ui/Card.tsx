/** @format */

import React from "react";
import styles from "../../styles/card.module.css";
import { Icon } from "./Icon";

interface CardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  children?: React.ReactNode;
}

export const Card = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  children,
}: CardProps) => {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendClass =
    trend === "up"
      ? styles["trend-up"]
      : trend === "down"
        ? styles["trend-down"]
        : styles["trend-neutral"];

  return (
    <div className={styles.card}>
      {/* Top: icon + trend */}
      {(icon || trend) && (
        <div className={styles["card-top"]}>
          {icon ? (
            <div className={styles["card-icon"]}>
              <Icon name={icon} size={20} />
            </div>
          ) : (
            <div />
          )}
          {trend && trendLabel && (
            <span className={`${styles["card-trend"]} ${trendClass}`}>
              {trendIcon} {trendLabel}
            </span>
          )}
        </div>
      )}

      {/* Value */}
      <div className={styles["card-body"]}>
        <p className={styles["card-title"]}>{title}</p>
        <p className={styles["card-value"]}>{value}</p>
      </div>

      {/* Optional children */}
      {children && <div className={styles["card-footer"]}>{children}</div>}
    </div>
  );
};
