import React from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = "text", ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] opacity-90">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={clsx(
            "w-full px-4 py-3 text-sm bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] transition-colors duration-150 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] placeholder:text-[var(--muted-foreground)]",
            error && "border-red-600 focus:border-red-600 focus:ring-red-600",
            className
          )}
          {...props}
        />
        {error ? (
          <span className="text-[11px] text-red-600 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-[var(--muted-foreground)]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
