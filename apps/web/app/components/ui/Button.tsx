/** @format */
import "../../styles/buttons.css";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", ...props }: ButtonProps) {
  return <button className={`btn btn-${variant}`} {...props} />;
}
