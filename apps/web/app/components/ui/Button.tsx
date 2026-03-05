/** @format */
import styles from "../../styles/button.module.css";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={styles.btn + " " + styles[`btn-${variant}`]}
      {...props}
    />
  );
}
