import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-white/40 focus:border-[var(--brand-400)] [color-scheme:dark]",
        props.className,
      )}
    />
  );
}
