import React from "react";
import { clsx } from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "sale";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  className,
  ...props
}) => {
  const base =
    "inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase transition-colors rounded-[var(--radius)]";

  const variants = {
    primary: "bg-[var(--primary)] text-[var(--primary-foreground)]",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
    accent: "bg-[var(--accent)] text-[var(--accent-foreground)]",
    outline: "border border-[var(--border)] text-[var(--foreground)] bg-transparent",
    sale: "bg-red-900 text-white font-bold",
  };

  return (
    <span className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
