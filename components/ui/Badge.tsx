import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "accent";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-[#F0EDE8] text-[#1A1A1A]",
    success: "bg-[#C6F6D5] text-[#276749]",
    warning: "bg-[#FEFCBF] text-[#744210]",
    error: "bg-[#FED7D7] text-[#9B2C2C]",
    accent: "bg-[#C4A882] text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
