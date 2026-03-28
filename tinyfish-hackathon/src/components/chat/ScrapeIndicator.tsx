import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ScrapeIndicator({ count }: { count: number }) {
  if (!count) return null;

  return (
    <Badge className="gap-2 border-[var(--brand-400)]/30 bg-[var(--brand-500)]/10 text-[var(--brand-100)]">
      <Loader2 className="h-3 w-3 animate-spin" />
      Researching {count} source{count === 1 ? "" : "s"}...
    </Badge>
  );
}
