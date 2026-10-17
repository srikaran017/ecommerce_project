import React from "react";
import { clsx } from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "outline"
    | "sale"
    | "success"
    | "warning"
    | "info"
    | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  className,
  ...props
}) => {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium transition-colors rounded-full";

  const variants = {
    primary: "bg-[var(--primary)] text-[var(--primary-foreground)]",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
    accent: "bg-[var(--accent)] text-[var(--accent-foreground)]",
    outline: "border border-[var(--border)] text-[var(--foreground)] bg-transparent",
    sale: "bg-red-50 text-red-700 border border-red-200 font-semibold",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium",
    warning: "bg-amber-50 text-amber-800 border border-amber-200/80 font-medium",
    info: "bg-sky-50 text-sky-800 border border-sky-200/80 font-medium",
    neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200 font-medium",
  };

  return (
    <span className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
