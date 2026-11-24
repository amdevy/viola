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
    default: "bg-panel text-foreground",
    success: "bg-[#C6F6D5] text-[#276749] dark:bg-success/15 dark:text-success",
    warning: "bg-[#FEFCBF] text-[#744210] dark:bg-[#D97706]/15 dark:text-[#F0B860]",
    error: "bg-[#FED7D7] text-[#9B2C2C] dark:bg-error/15 dark:text-error",
    accent: "bg-accent text-white",
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
