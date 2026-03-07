"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#1A1A1A]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-3 text-sm border rounded bg-white text-[#1A1A1A] placeholder:text-[#A0A0A0] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[#C4A882] focus:border-transparent",
            error
              ? "border-[#E53E3E] focus:ring-[#E53E3E]"
              : "border-[#E8E4DE] hover:border-[#C4A882]",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#E53E3E]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#6B6B6B]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
