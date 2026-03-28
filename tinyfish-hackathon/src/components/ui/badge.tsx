import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--line)] bg-white/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)]",
        className,
      )}
      {...props}
    />
  );
}
