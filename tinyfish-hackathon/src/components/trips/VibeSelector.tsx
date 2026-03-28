"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const suggestedVibes = [
  "foodie",
  "nightlife",
  "surfing",
  "hidden gems",
  "luxury",
  "budget-friendly",
  "art",
  "wellness",
];

export function VibeSelector({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestedVibes.map((vibe) => {
        const active = selected.includes(vibe);
        return (
          <button key={vibe} type="button" onClick={() => onToggle(vibe)}>
            <Badge
              className={cn(
                active &&
                  "border-[var(--brand-400)]/40 bg-[var(--brand-500)]/16 text-white",
              )}
            >
              {vibe}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
