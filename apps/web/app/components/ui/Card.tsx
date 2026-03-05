/** @format */

import React from "react";
import styles from "../../styles/card.module.css";
import { Icon } from "./Icon"; // your reusable Icon component

interface CardProps {
  title: string;
  value: string | number;
  icon?: string; // optional icon name
  children?: React.ReactNode; // optional extra content
}

export const Card = ({ title, value, icon, children }: CardProps) => {
  return (
    <div className={styles.card}>
      {icon && (
        <div className={styles["card-icon"]}>
          <Icon name={icon} size={28} />
        </div>
      )}
      <div className={styles["card-content"]}>
        <h3>{title}</h3>
        <p>{value}</p>
        {children && <div className={styles["card-extra"]}>{children}</div>}
      </div>
    </div>
  );
};
