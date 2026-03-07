"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-[#1A1A1A] text-white hover:bg-[#333333] focus:ring-[#1A1A1A]",
      secondary:
        "bg-[#C4A882] text-white hover:bg-[#A8875E] focus:ring-[#C4A882]",
      outline:
        "border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white focus:ring-[#1A1A1A]",
      ghost:
        "text-[#1A1A1A] hover:bg-[#F0EDE8] focus:ring-[#C4A882]",
      danger:
        "bg-[#E53E3E] text-white hover:bg-[#C53030] focus:ring-[#E53E3E]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded",
      md: "px-6 py-3 text-sm rounded",
      lg: "px-8 py-4 text-base rounded",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Завантаження...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
