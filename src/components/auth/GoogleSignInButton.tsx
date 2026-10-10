"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface GoogleSignInButtonProps {
  redirectTarget?: string;
  className?: string;
  text?: "continue_with" | "signin_with" | "signup_with";
}

export function GoogleSignInButton({
  redirectTarget = "/",
  className = "",
  text = "continue_with",
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const buttonText =
    text === "signup_with"
      ? "Sign up with Google"
      : text === "signin_with"
      ? "Sign in with Google"
      : "Continue with Google";

  const handleGoogleClick = () => {
    setIsLoading(true);
    const target = `/api/auth/google?redirect=${encodeURIComponent(redirectTarget)}`;
    window.location.href = target;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={isLoading}
      aria-label={buttonText}
      className={`w-full py-3 px-4 border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 rounded-2xl flex items-center justify-center gap-3 text-xs font-semibold text-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-60 ${className}`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.58H1.27a11.98 11.98 0 0 0 0 10.84l4.01-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}
      <span>{isLoading ? "Connecting to Google..." : buttonText}</span>
    </button>
  );
}
