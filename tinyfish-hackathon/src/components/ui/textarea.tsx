import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-3xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-white/40 focus:border-[var(--brand-400)]",
        props.className,
      )}
    />
  );
}
