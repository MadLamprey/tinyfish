import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[30px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_20px_80px_rgba(8,15,52,0.18)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
