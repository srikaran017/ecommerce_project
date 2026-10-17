import React from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = "text", id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-neutral-700 select-none flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={clsx(
            "w-full px-3.5 py-2.5 text-sm bg-white text-neutral-900 border border-neutral-300 rounded-lg transition-all focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder:text-neutral-400 shadow-2xs",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs text-red-600 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-neutral-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
