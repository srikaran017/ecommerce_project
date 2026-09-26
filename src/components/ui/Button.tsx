import React from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-wider uppercase text-xs";

    const variantStyles = {
      primary:
        "bg-[var(--button-bg)] text-[var(--button-text)] hover:opacity-90 shadow-sm border border-[var(--button-bg)]",
      secondary:
        "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90 border border-[var(--secondary)]",
      outline:
        "border border-[var(--foreground)] text-[var(--foreground)] bg-transparent hover:bg-[var(--foreground)] hover:text-[var(--background)]",
      ghost:
        "text-[var(--foreground)] bg-transparent hover:bg-[var(--muted)] border-transparent",
      accent:
        "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 font-semibold border border-[var(--accent)]",
    };

    const sizeStyles = {
      sm: "px-4 py-2 text-[10px] rounded-[var(--radius)]",
      md: "px-6 py-3 text-xs rounded-[var(--radius)]",
      lg: "px-8 py-4 text-sm rounded-[var(--radius)]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
        ) : leftIcon ? (
          <span className="mr-2 inline-flex items-center">{leftIcon}</span>
        ) : null}

        <span>{children}</span>

        {!isLoading && rightIcon ? (
          <span className="ml-2 inline-flex items-center">{rightIcon}</span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = "Button";
