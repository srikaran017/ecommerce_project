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
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-xs sm:text-sm select-none";

    const variantStyles = {
      primary:
        "bg-[var(--button-bg)] text-[var(--button-text)] hover:opacity-90 shadow-xs border border-[var(--button-bg)] focus:ring-[var(--button-bg)]",
      secondary:
        "bg-white text-neutral-800 hover:bg-neutral-50 border border-neutral-300 shadow-2xs focus:ring-neutral-400",
      outline:
        "border border-neutral-300 text-neutral-800 bg-transparent hover:bg-neutral-100 focus:ring-neutral-400",
      ghost:
        "text-neutral-700 bg-transparent hover:bg-neutral-100 border-transparent focus:ring-neutral-400",
      accent:
        "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 font-medium border border-[var(--accent)] focus:ring-[var(--accent)]",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-lg",
      md: "px-4 py-2.5 text-xs sm:text-sm rounded-lg",
      lg: "px-6 py-3 text-sm rounded-lg",
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
