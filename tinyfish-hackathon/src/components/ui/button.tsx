import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,var(--brand-400),var(--brand-500))] text-white shadow-[0_18px_35px_rgba(16,148,214,0.28)] hover:-translate-y-0.5 hover:shadow-[0_24px_40px_rgba(16,148,214,0.34)]",
        variant === "secondary" &&
          "border border-[var(--line)] bg-white/8 text-[var(--foreground)] hover:bg-white/14",
        variant === "ghost" &&
          "text-[var(--muted-foreground)] hover:bg-white/8 hover:text-[var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}
