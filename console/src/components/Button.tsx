import { Icon } from "./Icons.tsx";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: string;
};
export function Button({ variant = "secondary", size = "md", icon, className = "", children, ...rest }: Props) {
  const v = variant === "secondary" ? "" : variant;
  return (
    <button type="button" {...rest} className={`btn ${v} ${size === "sm" ? "small" : size === "lg" ? "lg" : ""} ${icon ? "withico" : ""} ${className}`}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 15} />}
      {children}
    </button>
  );
}
export function LinkButton({ className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...rest} className={`link ${className}`} />;
}
